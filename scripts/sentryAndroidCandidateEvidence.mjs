import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import os from 'os';
import path from 'path';

export const SENTRY_AAB_JS_BUNDLE_ENTRY = 'base/assets/index.android.bundle';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const ARTIFACT_BASE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const CANDIDATE_TYPES = ['local-signing-proof', 'production-signed-candidate'];
const DEBUG_ID_STATES = ['absent-upload-disabled', 'present'];

const rootKeys = [
  'schemaVersion',
  'candidateType',
  'variant',
  'applicationId',
  'versionName',
  'versionCode',
  'sentryRelease',
  'sentryDist',
  'aab',
  'embeddedBundle',
  'generatedBundle',
  'sourceMap',
  'bundleDigestMatch',
  'debugIdState',
  'buildProvenance',
  'generatedReactOutputsCleaned',
  'sentryAutoUploadDisabled',
  'sentryUploadAttempted',
  'sentryUploadValidation',
  'candidateBinding',
  'secretValuesPrinted',
  'candidateIdentity',
];
const artifactKeys = ['path', 'bytes', 'sha256'];
const sourceMapKeys = ['path', 'bytes', 'sha256', 'jsonVersion', 'sourceCount', 'mappingsBytes'];
const buildProvenanceKeys = ['buildStartedAtUtc', 'generatedBundleMtimeUtc', 'sourceMapMtimeUtc', 'method'];

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const assertExactKeys = (value, expectedKeys, label) => {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object`);
  }

  const actualKeys = Object.keys(value);
  const missing = expectedKeys.filter(key => !actualKeys.includes(key));
  const unknown = actualKeys.filter(key => !expectedKeys.includes(key));
  if (missing.length > 0 || unknown.length > 0) {
    const details = [
      missing.length > 0 ? `missing: ${missing.join(', ')}` : '',
      unknown.length > 0 ? `unknown: ${unknown.join(', ')}` : '',
    ].filter(Boolean);
    throw new Error(`${label} has invalid fields (${details.join('; ')})`);
  }
};

const assertSafeScalar = (value, label) => {
  if (typeof value !== 'string' || value.length === 0 || /[\r\n]/.test(value)) {
    throw new Error(`${label} must be a nonempty single-line string`);
  }
};

const hashBuffer = value => createHash('sha256').update(value).digest('hex');
const isPathInside = (root, target) => {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};
const readRequiredFile = (filePath, label) => {
  if (!existsSync(filePath) || statSync(filePath).size === 0) {
    throw new Error(`${label} is missing or empty: ${filePath}`);
  }

  return readFileSync(filePath);
};

const artifactEvidence = (filePath, label) => {
  const content = readRequiredFile(filePath, label);
  return {
    path: path.resolve(filePath),
    bytes: content.length,
    sha256: hashBuffer(content),
  };
};

const getBundleDebugId = content => {
  const match = content.toString('utf8').match(/(?:\/\/[#@]|\/\*)\s*debugId=([0-9a-f-]{8,})/i);
  return match?.[1]?.toLowerCase() || '';
};

const getMapDebugId = sourceMap => {
  const debugId = sourceMap.debug_id ?? sourceMap.debugId ?? '';
  if (debugId !== '' && typeof debugId !== 'string') {
    throw new Error('Sentry source map debug ID must be a string when present');
  }
  return debugId.toLowerCase();
};

const getCandidateIdentity = evidence =>
  hashBuffer(
    Buffer.from(
      [
        evidence.aab.sha256,
        evidence.embeddedBundle.sha256,
        evidence.generatedBundle.sha256,
        evidence.sourceMap.sha256,
        evidence.candidateType,
        evidence.variant,
        evidence.sentryRelease,
        evidence.sentryDist,
        evidence.buildProvenance.buildStartedAtUtc,
        evidence.buildProvenance.generatedBundleMtimeUtc,
        evidence.buildProvenance.sourceMapMtimeUtc,
        evidence.buildProvenance.method,
      ].join('\n'),
      'utf8',
    ),
  );

const assertMetadata = metadata => {
  if (!isPlainObject(metadata)) throw new Error('Android candidate metadata must be an object');
  if (typeof metadata.versionName !== 'string') throw new Error('Android versionName must be a string');
  assertSafeScalar(metadata.versionName, 'Android versionName');
  if (!/^\d+$/.test(String(metadata.versionCode ?? ''))) {
    throw new Error('Android versionCode must be a non-negative integer');
  }
};

export const getSentryAndroidCandidateEvidenceConfig = (root, { aabPath, artifactBase }) => {
  if (!ARTIFACT_BASE_PATTERN.test(artifactBase || '')) {
    throw new Error(`Invalid Sentry Android candidate artifact base: ${artifactBase || 'missing'}`);
  }

  const resolvedRoot = path.resolve(root);
  const resolvedAabPath = path.resolve(resolvedRoot, aabPath);
  if (!isPathInside(resolvedRoot, resolvedAabPath)) {
    throw new Error(`Sentry Android candidate AAB must be inside the repository root: ${resolvedAabPath}`);
  }
  const aab = readRequiredFile(resolvedAabPath, 'Android candidate AAB');
  const aabSha256 = hashBuffer(aab);
  const candidateDirectory = path.join(resolvedRoot, 'local-docs', 'sentry-android-candidates', aabSha256);

  return {
    artifactBase,
    aabPath: resolvedAabPath,
    aabSha256,
    candidateDirectory,
    sourceGeneratedBundlePath: path.join(
      resolvedRoot,
      'android',
      'app',
      'build',
      'generated',
      'assets',
      'react',
      'prodRelease',
      'index.android.bundle',
    ),
    sourceGeneratedSourceMapPath: path.join(
      resolvedRoot,
      'android',
      'app',
      'build',
      'generated',
      'sourcemaps',
      'react',
      'prodRelease',
      'index.android.bundle.map',
    ),
    embeddedBundlePath: path.join(candidateDirectory, `${artifactBase}-embedded-index.android.bundle`),
    generatedBundlePath: path.join(candidateDirectory, `${artifactBase}-generated-index.android.bundle`),
    sourceMapPath: path.join(candidateDirectory, `${artifactBase}-index.android.bundle.map`),
    manifestPath: path.join(candidateDirectory, `${artifactBase}-manifest.json`),
  };
};

export const cleanSentryAndroidGeneratedOutputs = root => {
  const sourcePaths = [
    path.join(root, 'android', 'app', 'build', 'generated', 'assets', 'react', 'prodRelease', 'index.android.bundle'),
    path.join(root, 'android', 'app', 'build', 'generated', 'sourcemaps', 'react', 'prodRelease', 'index.android.bundle.map'),
  ].map(filePath => path.resolve(filePath));
  const existedBefore = sourcePaths.map(existsSync);

  sourcePaths.forEach(filePath => rmSync(filePath, { force: true }));
  if (sourcePaths.some(existsSync)) throw new Error('Unable to clean generated React prodRelease outputs before build');

  return { performed: true, sourcePaths, existedBefore };
};

const runJarExtraction = ({ aabPath, destination, jarCommand }) => {
  const result = spawnSync(jarCommand, ['xf', aabPath, SENTRY_AAB_JS_BUNDLE_ENTRY], {
    cwd: destination,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `Unable to extract the JavaScript bundle from the signed AAB: ${result.error?.message || `jar exited ${result.status}`}\n${`${result.stdout || ''}${result.stderr || ''}`.trim()}`.trim(),
    );
  }
};

export const captureSentryAndroidCandidateEvidence = ({
  config,
  metadata,
  candidateType,
  jarCommand,
  extractAabBundle = runJarExtraction,
  generatedReactOutputsCleaned,
  buildStartedAtMs,
  sentryAutoUploadDisabled,
  sentryUploadAttempted,
  secretValuesPrinted,
}) => {
  if (generatedReactOutputsCleaned !== true) {
    throw new Error('Sentry candidate capture requires freshly cleaned generated React outputs');
  }
  if (sentryAutoUploadDisabled !== true) {
    throw new Error('Sentry candidate capture requires automatic upload to remain disabled');
  }
  if (sentryUploadAttempted !== false) throw new Error('Sentry candidate capture must not attempt an upload');
  if (secretValuesPrinted !== false) throw new Error('Sentry candidate capture must not print secret values');
  if (!Number.isFinite(buildStartedAtMs) || buildStartedAtMs <= 0) {
    throw new Error('Sentry candidate capture requires the guarded Gradle build start time');
  }
  readRequiredFile(config.sourceGeneratedBundlePath, 'fresh generated JavaScript bundle');
  readRequiredFile(config.sourceGeneratedSourceMapPath, 'fresh generated Sentry source map');
  if (
    statSync(config.sourceGeneratedBundlePath).mtimeMs < buildStartedAtMs ||
    statSync(config.sourceGeneratedSourceMapPath).mtimeMs < buildStartedAtMs
  ) {
    throw new Error('Generated JavaScript bundle and source map must both be produced by the guarded Gradle build');
  }

  rmSync(config.candidateDirectory, { recursive: true, force: true });
  mkdirSync(config.candidateDirectory, { recursive: true });
  const extractionDirectory = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-aab-'));

  try {
    extractAabBundle({
      aabPath: config.aabPath,
      destination: extractionDirectory,
      jarCommand,
      entry: SENTRY_AAB_JS_BUNDLE_ENTRY,
    });
    const extractedBundlePath = path.resolve(extractionDirectory, ...SENTRY_AAB_JS_BUNDLE_ENTRY.split('/'));
    if (!isPathInside(extractionDirectory, extractedBundlePath)) {
      throw new Error('Extracted AAB JavaScript bundle resolved outside the temporary directory');
    }
    if (!existsSync(extractedBundlePath) || !lstatSync(extractedBundlePath).isFile()) {
      throw new Error(`Signed AAB does not contain ${SENTRY_AAB_JS_BUNDLE_ENTRY}`);
    }

    copyFileSync(extractedBundlePath, config.embeddedBundlePath);
    copyFileSync(config.sourceGeneratedBundlePath, config.generatedBundlePath);
    copyFileSync(config.sourceGeneratedSourceMapPath, config.sourceMapPath);
  } finally {
    rmSync(extractionDirectory, { recursive: true, force: true });
  }

  const evidence = collectSentryAndroidCandidateEvidence({
    config,
    metadata,
    candidateType,
    generatedReactOutputsCleaned,
    buildStartedAtMs,
    sentryAutoUploadDisabled,
    sentryUploadAttempted,
    secretValuesPrinted,
  });
  const manifestContent = renderSentryAndroidCandidateEvidenceManifest(evidence);
  writeFileSync(config.manifestPath, manifestContent);
  const errors = getSentryAndroidCandidateEvidenceErrors({
    manifestContent,
    config,
    metadata,
    candidateType,
    generatedReactOutputsCleaned,
    buildStartedAtMs,
    sentryAutoUploadDisabled,
    sentryUploadAttempted,
    secretValuesPrinted,
  });
  if (errors.length > 0) throw new Error(`Sentry Android candidate evidence is invalid:\n${errors.join('\n')}`);

  return { evidence, manifestContent };
};

export const collectSentryAndroidCandidateEvidence = ({
  config,
  metadata,
  candidateType,
  generatedReactOutputsCleaned = false,
  buildStartedAtMs,
  sentryAutoUploadDisabled = false,
  sentryUploadAttempted,
  secretValuesPrinted,
}) => {
  assertMetadata(metadata);
  if (!CANDIDATE_TYPES.includes(candidateType)) {
    throw new Error(`Sentry Android candidate type must be one of: ${CANDIDATE_TYPES.join(', ')}`);
  }
  if (generatedReactOutputsCleaned !== true) {
    throw new Error('Generated React prodRelease outputs were not proven clean before build');
  }
  if (sentryAutoUploadDisabled !== true) {
    throw new Error('Sentry automatic upload was not proven disabled for the candidate build');
  }
  if (sentryUploadAttempted !== false) throw new Error('Sentry upload was attempted or its state was not proven');
  if (secretValuesPrinted !== false) throw new Error('Secret-safe candidate capture was not proven');

  const aab = artifactEvidence(config.aabPath, 'Android candidate AAB');
  if (aab.sha256 !== config.aabSha256 || path.basename(config.candidateDirectory) !== aab.sha256) {
    throw new Error('Android candidate AAB no longer matches its SHA-256 snapshot directory');
  }

  const embeddedContent = readRequiredFile(config.embeddedBundlePath, 'AAB embedded JavaScript bundle snapshot');
  const generatedContent = readRequiredFile(config.generatedBundlePath, 'generated JavaScript bundle snapshot');
  const mapContent = readRequiredFile(config.sourceMapPath, 'generated Sentry source map snapshot');
  const embeddedBundle = artifactEvidence(config.embeddedBundlePath, 'AAB embedded JavaScript bundle snapshot');
  const generatedBundle = artifactEvidence(config.generatedBundlePath, 'generated JavaScript bundle snapshot');
  const sourceMapArtifact = artifactEvidence(config.sourceMapPath, 'generated Sentry source map snapshot');
  const sourceGeneratedBundle = artifactEvidence(config.sourceGeneratedBundlePath, 'current generated JavaScript bundle');
  const sourceGeneratedMap = artifactEvidence(config.sourceGeneratedSourceMapPath, 'current generated Sentry source map');
  if (sourceGeneratedBundle.sha256 !== generatedBundle.sha256 || sourceGeneratedMap.sha256 !== sourceMapArtifact.sha256) {
    throw new Error('Sentry candidate snapshots no longer match the guarded Gradle bundle/map outputs');
  }
  const generatedBundleMtimeMs = statSync(config.sourceGeneratedBundlePath).mtimeMs;
  const sourceMapMtimeMs = statSync(config.sourceGeneratedSourceMapPath).mtimeMs;
  if (!Number.isFinite(buildStartedAtMs) || buildStartedAtMs <= 0) {
    throw new Error('Guarded Gradle build start time was not provided');
  }
  if (generatedBundleMtimeMs < buildStartedAtMs || sourceMapMtimeMs < buildStartedAtMs) {
    throw new Error('Generated JavaScript bundle and source map were not both produced after the guarded Gradle build started');
  }

  if (embeddedBundle.sha256 !== generatedBundle.sha256) {
    throw new Error('AAB embedded and generated JavaScript bundle SHA-256 values do not match');
  }

  let parsedMap;
  try {
    parsedMap = JSON.parse(mapContent.toString('utf8'));
  } catch (error) {
    throw new Error(`Generated Sentry source map is malformed JSON: ${error.message}`);
  }
  if (!isPlainObject(parsedMap) || parsedMap.version !== 3) {
    throw new Error('Generated Sentry source map must use JSON source-map version 3');
  }
  if (!Array.isArray(parsedMap.sources) || parsedMap.sources.length === 0 || parsedMap.sources.some(source => typeof source !== 'string' || source.length === 0)) {
    throw new Error('Generated Sentry source map must contain nonempty string sources');
  }
  if (typeof parsedMap.mappings !== 'string' || parsedMap.mappings.length === 0) {
    throw new Error('Generated Sentry source map must contain nonempty mappings');
  }

  const bundleDebugId = getBundleDebugId(generatedContent);
  const mapDebugId = getMapDebugId(parsedMap);
  if (Boolean(bundleDebugId) !== Boolean(mapDebugId) || (bundleDebugId && bundleDebugId !== mapDebugId)) {
    throw new Error('Generated JavaScript bundle and source map debug IDs are inconsistent');
  }

  const versionName = String(metadata.versionName);
  const versionCode = String(metadata.versionCode);
  const evidence = {
    schemaVersion: 1,
    candidateType,
    variant: 'prodRelease',
    applicationId: 'io.goldwallet.wallet',
    versionName,
    versionCode,
    sentryRelease: `io.goldwallet.wallet@${versionName}+${versionCode}`,
    sentryDist: versionCode,
    aab,
    embeddedBundle,
    generatedBundle,
    sourceMap: {
      ...sourceMapArtifact,
      jsonVersion: parsedMap.version,
      sourceCount: parsedMap.sources.length,
      mappingsBytes: Buffer.byteLength(parsedMap.mappings, 'utf8'),
    },
    bundleDigestMatch: true,
    debugIdState: bundleDebugId ? 'present' : 'absent-upload-disabled',
    buildProvenance: {
      buildStartedAtUtc: new Date(buildStartedAtMs).toISOString(),
      generatedBundleMtimeUtc: new Date(generatedBundleMtimeMs).toISOString(),
      sourceMapMtimeUtc: new Date(sourceMapMtimeMs).toISOString(),
      method: 'cleaned-then-generated-by-guarded-gradle-prodRelease',
    },
    generatedReactOutputsCleaned,
    sentryAutoUploadDisabled,
    sentryUploadAttempted,
    sentryUploadValidation: 'not-claimed',
    candidateBinding: 'passed',
    secretValuesPrinted,
    candidateIdentity: '',
  };
  evidence.candidateIdentity = getCandidateIdentity(evidence);
  return evidence;
};

export const renderSentryAndroidCandidateEvidenceManifest = evidence => `${JSON.stringify(evidence, null, 2)}\n`;

const assertArtifactSchema = (artifact, label, expectedPath) => {
  assertExactKeys(artifact, artifactKeys, label);
  if (artifact.path !== path.resolve(expectedPath)) throw new Error(`${label} path does not match the candidate config`);
  if (!Number.isSafeInteger(artifact.bytes) || artifact.bytes <= 0) throw new Error(`${label} bytes must be a positive integer`);
  if (!SHA256_PATTERN.test(artifact.sha256)) throw new Error(`${label} SHA-256 is invalid`);
};

const assertManifestSchema = (manifest, config) => {
  assertExactKeys(manifest, rootKeys, 'Sentry Android candidate manifest');
  assertArtifactSchema(manifest.aab, 'AAB evidence', config.aabPath);
  assertArtifactSchema(manifest.embeddedBundle, 'embedded bundle evidence', config.embeddedBundlePath);
  assertArtifactSchema(manifest.generatedBundle, 'generated bundle evidence', config.generatedBundlePath);
  assertExactKeys(manifest.sourceMap, sourceMapKeys, 'source map evidence');
  assertArtifactSchema(
    { path: manifest.sourceMap.path, bytes: manifest.sourceMap.bytes, sha256: manifest.sourceMap.sha256 },
    'source map evidence',
    config.sourceMapPath,
  );
  if (manifest.sourceMap.jsonVersion !== 3) throw new Error('source map JSON version must be 3');
  if (!Number.isSafeInteger(manifest.sourceMap.sourceCount) || manifest.sourceMap.sourceCount <= 0) {
    throw new Error('source map source count must be a positive integer');
  }
  if (!Number.isSafeInteger(manifest.sourceMap.mappingsBytes) || manifest.sourceMap.mappingsBytes <= 0) {
    throw new Error('source map mappings bytes must be a positive integer');
  }
  assertExactKeys(manifest.buildProvenance, buildProvenanceKeys, 'build provenance');
  for (const key of buildProvenanceKeys) {
    assertSafeScalar(manifest.buildProvenance[key], `buildProvenance.${key}`);
  }
  if (manifest.buildProvenance.method !== 'cleaned-then-generated-by-guarded-gradle-prodRelease') {
    throw new Error('buildProvenance.method is invalid');
  }
  for (const key of ['buildStartedAtUtc', 'generatedBundleMtimeUtc', 'sourceMapMtimeUtc']) {
    if (!Number.isFinite(Date.parse(manifest.buildProvenance[key]))) {
      throw new Error(`buildProvenance.${key} is not a valid timestamp`);
    }
  }
  if (manifest.schemaVersion !== 1) throw new Error('schemaVersion must be 1');
  if (!CANDIDATE_TYPES.includes(manifest.candidateType)) throw new Error('candidateType is invalid');
  if (manifest.variant !== 'prodRelease') throw new Error('variant must be prodRelease');
  if (manifest.applicationId !== 'io.goldwallet.wallet') throw new Error('applicationId must be io.goldwallet.wallet');
  if (!DEBUG_ID_STATES.includes(manifest.debugIdState)) throw new Error('debugIdState is invalid');
  if (manifest.bundleDigestMatch !== true) throw new Error('bundleDigestMatch must be true');
  if (manifest.generatedReactOutputsCleaned !== true) throw new Error('generatedReactOutputsCleaned must be true');
  if (manifest.sentryAutoUploadDisabled !== true) throw new Error('sentryAutoUploadDisabled must be true');
  if (manifest.sentryUploadAttempted !== false) throw new Error('sentryUploadAttempted must be false');
  if (manifest.sentryUploadValidation !== 'not-claimed') throw new Error('sentryUploadValidation must be not-claimed');
  if (manifest.candidateBinding !== 'passed') throw new Error('candidateBinding must be passed');
  if (manifest.secretValuesPrinted !== false) throw new Error('secretValuesPrinted must be false');
  if (!SHA256_PATTERN.test(manifest.candidateIdentity)) throw new Error('candidateIdentity SHA-256 is invalid');
};

const SECRET_PATTERN = /SENTRY_AUTH_TOKEN|auth\.token|["']?token["']?\s*[:=]|sntrys_[a-z0-9_-]+/i;

export const parseSentryAndroidCandidateEvidenceManifest = (content, config) => {
  if (typeof content !== 'string' || content.length === 0) throw new Error('Sentry Android candidate manifest is empty');
  if (SECRET_PATTERN.test(content)) throw new Error('Sentry Android candidate manifest contains a token or auth.token value');

  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch (error) {
    throw new Error(`Sentry Android candidate manifest is malformed JSON: ${error.message}`);
  }
  assertManifestSchema(manifest, config);
  return manifest;
};

export const getSentryAndroidCandidateEvidenceErrors = ({
  manifestContent,
  config,
  metadata,
  candidateType,
  generatedReactOutputsCleaned = false,
  buildStartedAtMs,
  sentryAutoUploadDisabled = false,
  sentryUploadAttempted,
  secretValuesPrinted,
}) => {
  const errors = [];
  let parsed;
  try {
    parsed = parseSentryAndroidCandidateEvidenceManifest(manifestContent, config);
  } catch (error) {
    return [error.message];
  }

  let current;
  try {
    current = collectSentryAndroidCandidateEvidence({
      config,
      metadata,
      candidateType,
      generatedReactOutputsCleaned,
      buildStartedAtMs: buildStartedAtMs ?? Date.parse(parsed.buildProvenance.buildStartedAtUtc),
      sentryAutoUploadDisabled,
      sentryUploadAttempted,
      secretValuesPrinted,
    });
  } catch (error) {
    return [error.message];
  }

  if (parsed.candidateType !== candidateType) errors.push('Sentry Android candidate type does not match the expected candidate type');
  if (parsed.versionName !== String(metadata.versionName)) errors.push('Sentry Android candidate versionName is stale or incorrect');
  if (parsed.versionCode !== String(metadata.versionCode)) errors.push('Sentry Android candidate versionCode is stale or incorrect');
  if (parsed.sentryRelease !== current.sentryRelease) errors.push('Sentry Android candidate release is stale or incorrect');
  if (parsed.sentryDist !== current.sentryDist) errors.push('Sentry Android candidate dist is stale or incorrect');
  if (parsed.candidateIdentity !== getCandidateIdentity(parsed)) errors.push('Sentry Android candidate identity does not match the manifest fields');

  if (JSON.stringify(parsed) !== JSON.stringify(current)) {
    errors.push('Sentry Android candidate manifest does not match the current candidate files and metadata');
  }
  return errors;
};
