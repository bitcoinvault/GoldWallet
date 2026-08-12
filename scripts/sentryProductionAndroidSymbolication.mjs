import { createHash } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

export const SENTRY_PRODUCTION_ANDROID_ORG = 'decentraplanet';
export const SENTRY_PRODUCTION_ANDROID_PROJECT = 'goldwallet-prod-android';
export const SENTRY_PRODUCTION_ANDROID_PROJECT_ID = '5875213';
export const SENTRY_PRODUCTION_ANDROID_ENVIRONMENT = 'production-symbolication-canary';
export const SENTRY_PRODUCTION_ANDROID_TAG = 'sentry-production-android-symbolication';
export const SENTRY_PRODUCTION_ANDROID_WALLET_DATA_TAG = 'none';

const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const EVENT_ID_PATTERN = /^[a-f0-9]{32}$/;
const hash = value => createHash('sha256').update(value).digest('hex');
const hashFile = filePath => hash(readFileSync(filePath));

const requireFile = (filePath, label) => {
  if (!existsSync(filePath) || !statSync(filePath).isFile() || statSync(filePath).size === 0) {
    throw new Error(`${label} is missing or empty: ${filePath}`);
  }
};

export const getBundleDebugId = bundle => {
  const matches = [...bundle.toString('utf8').matchAll(/sentry-dbid-([a-f0-9-]{36})/gi)].map(match =>
    match[1].toLowerCase(),
  );
  const unique = [...new Set(matches)];
  if (unique.length !== 1 || !UUID_PATTERN.test(unique[0])) {
    throw new Error('Android production bundle must contain exactly one valid Sentry debug ID');
  }
  return unique[0];
};

export const getSentryProductionAndroidConfig = ({ root, metadata }) => {
  if (!metadata?.versionName || !/^\d+$/.test(String(metadata.versionCode || ''))) {
    throw new Error('Android production version metadata is invalid');
  }
  const release = `io.goldwallet.wallet@${metadata.versionName}+${metadata.versionCode}`;
  const outputDir = path.join(root, 'local-docs', 'sentry-production-android-symbolication');
  return {
    root,
    org: SENTRY_PRODUCTION_ANDROID_ORG,
    project: SENTRY_PRODUCTION_ANDROID_PROJECT,
    projectId: SENTRY_PRODUCTION_ANDROID_PROJECT_ID,
    release,
    dist: String(metadata.versionCode),
    aabPath: path.join(root, 'local-docs', 'android-upload-signing-proof-prod-release.aab'),
    bundlePath: path.join(
      root,
      'android',
      'app',
      'build',
      'generated',
      'assets',
      'react',
      'prodRelease',
      'index.android.bundle',
    ),
    sourceMapPath: path.join(
      root,
      'android',
      'app',
      'build',
      'generated',
      'sourcemaps',
      'react',
      'prodRelease',
      'index.android.bundle.map',
    ),
    outputDir,
    uploadBundlePath: path.join(outputDir, 'index.android.bundle'),
    uploadSourceMapPath: path.join(outputDir, 'index.android.bundle.map'),
    summaryPath: path.join(root, 'local-docs', 'sentry-production-android-symbolication-summary.txt'),
    dryRunSummaryPath: path.join(root, 'local-docs', 'sentry-production-android-symbolication-dry-run-summary.txt'),
    checkpointPath: path.join(root, 'local-docs', 'sentry-production-android-symbolication-checkpoint.txt'),
  };
};

export const getSentryProductionCliEnvironment = ({ env = process.env, token, config }) => {
  const controlled = { ...env };
  const ownedKeys = new Set([
    'SENTRY_AUTH_TOKEN',
    'SENTRY_URL',
    'SENTRY_HOST',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'SENTRY_RELEASE',
    'SENTRY_DIST',
  ]);
  for (const key of Object.keys(controlled)) {
    if (ownedKeys.has(key.toUpperCase())) delete controlled[key];
  }
  return {
    ...controlled,
    SENTRY_AUTH_TOKEN: token,
    SENTRY_URL: 'https://sentry.io',
    SENTRY_HOST: 'https://sentry.io',
    SENTRY_ORG: config.org,
    SENTRY_PROJECT: config.project,
    SENTRY_RELEASE: config.release,
    SENTRY_DIST: config.dist,
  };
};

export const prepareSentryProductionAndroidArtifacts = ({ config, jarCommand }) => {
  requireFile(config.aabPath, 'Android production proof AAB');
  requireFile(config.bundlePath, 'Android production JavaScript bundle');
  requireFile(config.sourceMapPath, 'Android production source map');
  const bundle = readFileSync(config.bundlePath);
  const debugId = getBundleDebugId(bundle);
  const extractionDir = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-sentry-production-'));
  let embeddedBundle;
  try {
    const result = spawnSync(jarCommand, ['xf', config.aabPath, 'base/assets/index.android.bundle'], {
      cwd: extractionDir,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
    });
    if (result.error || result.status !== 0) {
      throw new Error(
        `Unable to extract production bundle from AAB: ${result.error?.message || `exit ${result.status}`}`,
      );
    }
    const embeddedPath = path.join(extractionDir, 'base', 'assets', 'index.android.bundle');
    requireFile(embeddedPath, 'AAB-embedded production JavaScript bundle');
    embeddedBundle = readFileSync(embeddedPath);
  } finally {
    rmSync(extractionDir, { recursive: true, force: true });
  }
  if (hash(bundle) !== hash(embeddedBundle)) {
    throw new Error('Generated production bundle does not match the exact AAB-embedded bundle');
  }

  const sourceMap = JSON.parse(readFileSync(config.sourceMapPath, 'utf8'));
  if (
    sourceMap.version !== 3 ||
    !Array.isArray(sourceMap.sources) ||
    sourceMap.sources.length === 0 ||
    !Array.isArray(sourceMap.sourcesContent) ||
    sourceMap.sourcesContent.length !== sourceMap.sources.length ||
    typeof sourceMap.mappings !== 'string' ||
    sourceMap.mappings.length === 0
  ) {
    throw new Error('Android production source map is incomplete');
  }
  for (const existing of [sourceMap.debug_id, sourceMap.debugId].filter(Boolean)) {
    if (String(existing).toLowerCase() !== debugId) {
      throw new Error('Android production source-map debug ID conflicts with the bundle');
    }
  }
  sourceMap.debug_id = debugId;
  sourceMap.debugId = debugId;

  rmSync(config.outputDir, { recursive: true, force: true });
  mkdirSync(config.outputDir, { recursive: true });
  copyFileSync(config.bundlePath, config.uploadBundlePath);
  writeFileSync(config.uploadSourceMapPath, `${JSON.stringify(sourceMap)}\n`);
  return {
    debugId,
    aabSha256: hashFile(config.aabPath),
    sourceBundleSha256: hash(bundle),
    embeddedBundleSha256: hash(embeddedBundle),
    sourceMapSha256: hashFile(config.sourceMapPath),
    uploadBundleSha256: hashFile(config.uploadBundlePath),
    uploadSourceMapSha256: hashFile(config.uploadSourceMapPath),
    sourceCount: sourceMap.sources.length,
  };
};

export const getSentryProductionAndroidUploadArgs = ({ config, artifacts }) => [
  'sourcemaps',
  'upload',
  '--org',
  config.org,
  '--project',
  config.projectId,
  '--release',
  config.release,
  '--dist',
  config.dist,
  '--bundle',
  config.uploadBundlePath,
  '--bundle-sourcemap',
  config.uploadSourceMapPath,
  '--debug-id-reference',
  '--validate',
  '--strict',
  '--wait',
  '--note',
  `GoldWallet BEM-37.986 production Android recovery ${artifacts.debugId}`,
];

export const getSentryProductionAndroidProjectErrors = project => {
  const errors = [];
  if (String(project?.id || '') !== SENTRY_PRODUCTION_ANDROID_PROJECT_ID) errors.push('production project ID mismatch');
  if (project?.slug !== SENTRY_PRODUCTION_ANDROID_PROJECT) errors.push('production project slug mismatch');
  if (project?.organization?.slug !== SENTRY_PRODUCTION_ANDROID_ORG) errors.push('production organization mismatch');
  return errors;
};

const getEventTag = (event, key) => event?.tags?.find(tag => tag.key === key)?.value;
const getFrames = event =>
  (event?.entries || [])
    .filter(entry => entry.type === 'exception')
    .flatMap(entry => entry.data?.values || [])
    .flatMap(value => value.stacktrace?.frames || []);

export const getReferenceProductionEventErrors = ({ event, expected }) => {
  const errors = [];
  if ((event?.eventID || event?.id) !== expected.eventId) errors.push('reference event ID mismatch');
  if (String(event?.projectID || event?.project?.id || '') !== expected.projectId)
    errors.push('reference project mismatch');
  if ((event?.release?.version || event?.release) !== expected.release) errors.push('reference release mismatch');
  if (String(event?.dist || getEventTag(event, 'dist') || '') !== expected.dist) errors.push('reference dist mismatch');
  if (!getFrames(event).some(frame => String(frame.absPath || frame.filename || '').includes('index.android.bundle'))) {
    errors.push('reference generated bundle frame missing');
  }
  if (!event?.errors?.some(error => error.type === 'js_no_source')) {
    errors.push('reference missing-source error is absent');
  }
  return errors;
};

export const getSourceMapDebugEvidence = ({ response, debugId }) => {
  const frames = (response?.exceptions || []).flatMap(exception => exception.frames || []);
  const matching = frames.map(frame => frame.debug_id_process).filter(value => value?.debug_id === debugId);
  return {
    hasDebugIds: response?.has_debug_ids === true,
    matchingDebugId: matching.length > 0,
    artifactBundlePresent: response?.project_has_some_artifact_bundle === true,
    sourceFilePresent: matching.some(value => value.uploaded_source_file_with_correct_debug_id === true),
    sourceMapPresent: matching.some(value => value.uploaded_source_map_with_correct_debug_id === true),
  };
};

export const getProductionSymbolicationEvidence = ({ event, expected }) => {
  const frames = getFrames(event);
  const sourceFrame = frames.find(frame => {
    const filename = String(frame.filename || frame.absPath || '').replaceAll('\\', '/');
    return filename.endsWith(`/${expected.source}`) || filename === expected.source;
  });
  const actualLine = Number(sourceFrame?.lineNo || sourceFrame?.lineno || 0);
  const user = event?.user || {};
  const userValues = Object.entries(user).filter(
    ([key, value]) =>
      !(['ipAddress', 'ip_address'].includes(key) && value === '0.0.0.0') && value != null && String(value) !== '',
  );
  const checks = {
    eventId: (event?.eventID || event?.id) === expected.eventId,
    project: String(event?.projectID || event?.project?.id || '') === expected.projectId,
    release: (event?.release?.version || event?.release) === expected.release,
    dist: String(event?.dist || getEventTag(event, 'dist') || '') === expected.dist,
    environment: (event?.environment || getEventTag(event, 'environment')) === SENTRY_PRODUCTION_ANDROID_ENVIRONMENT,
    canaryTag: getEventTag(event, 'goldwallet.canary') === SENTRY_PRODUCTION_ANDROID_TAG,
    walletDataTag: getEventTag(event, 'goldwallet.wallet_data') === SENTRY_PRODUCTION_ANDROID_WALLET_DATA_TAG,
    noIdentifyingUserData: userValues.length === 0,
    originalSource: Boolean(sourceFrame),
    originalLine: actualLine === expected.originalLine,
    generatedFrameRemoved: !frames.some(frame =>
      String(frame.absPath || frame.filename || '').includes('index.android.bundle'),
    ),
  };
  return {
    passed: Object.values(checks).every(Boolean),
    actualSource: sourceFrame?.filename || sourceFrame?.absPath || null,
    actualLine: actualLine || null,
    actualFunction: sourceFrame?.function || sourceFrame?.originalFunction || null,
    errors: Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => `${name} missing from processed production event evidence`),
  };
};

export const validateReferenceEventId = value => {
  const eventId = String(value || '').toLowerCase();
  if (!EVENT_ID_PATTERN.test(eventId)) throw new Error('Execute mode requires a valid --reference-event-id');
  return eventId;
};

export const renderSentryProductionAndroidSummary = ({
  config,
  artifacts,
  executed,
  referenceEventId = null,
  beforeDebug = null,
  afterDebug = null,
  uploadEvidence = null,
  uploadAttempted = false,
  syntheticEventId = null,
  symbolicationEvidence = null,
  generatedAt = new Date(),
}) =>
  [
    'Sentry production Android symbolication recovery',
    `Generated at: ${generatedAt.toISOString()}`,
    `Mode: ${executed ? 'executed' : 'dry-run'}`,
    `Organization: ${config.org}`,
    `Project: ${config.project}`,
    `Project ID: ${config.projectId}`,
    `Release: ${config.release}`,
    `Distribution: ${config.dist}`,
    `Debug ID: ${artifacts.debugId}`,
    `AAB SHA-256: ${artifacts.aabSha256}`,
    `Generated/embedded bundle match: ${artifacts.sourceBundleSha256 === artifacts.embeddedBundleSha256 ? 'yes' : 'no'}`,
    `Source map sources: ${artifacts.sourceCount}`,
    `Reference event ID: ${referenceEventId || 'not available'}`,
    `Before upload source file present: ${beforeDebug?.sourceFilePresent ? 'yes' : 'no'}`,
    `Before upload source map present: ${beforeDebug?.sourceMapPresent ? 'yes' : 'no'}`,
    `After upload source file present: ${afterDebug?.sourceFilePresent ? 'yes' : 'no'}`,
    `After upload source map present: ${afterDebug?.sourceMapPresent ? 'yes' : 'no'}`,
    `Artifacts present before run: ${beforeDebug?.sourceFilePresent && beforeDebug?.sourceMapPresent ? 'yes' : 'no'}`,
    `Upload attempted this run: ${uploadAttempted ? 'yes' : 'no'}`,
    `Artifact bundle ID: ${uploadEvidence?.bundleId || 'not available'}`,
    `Synthetic event ID: ${syntheticEventId || 'not available'}`,
    `Processed original source: ${symbolicationEvidence?.actualSource || 'not available'}`,
    `Processed original line: ${symbolicationEvidence?.actualLine || 'not available'}`,
    `Production source-map upload validation: ${executed && afterDebug?.sourceFilePresent && afterDebug?.sourceMapPresent ? 'passed' : 'not claimed'}`,
    `Production event symbolication validation: ${executed && symbolicationEvidence?.passed ? 'passed' : 'not claimed'}`,
    'iOS symbolication validation: not claimed',
    'Wallet data included: no',
    'Secret values printed: no',
    '',
  ].join('\n');
