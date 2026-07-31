import { createHash } from 'crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import path from 'path';

export const SENTRY_ANDROID_CANARY_ORG = 'decentraplanet';
export const SENTRY_ANDROID_CANARY_PROJECT = 'goldwallet-dev-android';
export const SENTRY_ANDROID_CANARY_PROJECT_ID = '5875208';
export const SENTRY_ANDROID_CANARY_RELEASE_PREFIX = 'goldwallet-android-sourcemap-canary';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const hashFile = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');
const getSummaryValue = (summary, label) => {
  const line = summary.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line?.slice(label.length + 2);
};

export const getSentryAndroidCanaryDebugId = candidateIdentity => {
  if (!SHA256_PATTERN.test(candidateIdentity || '')) {
    throw new Error('Sentry Android canary candidate identity must be a SHA-256 digest');
  }

  const bytes = Buffer.from(candidateIdentity.slice(0, 32), 'hex');
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = bytes.toString('hex');

  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
};

export const getSentryAndroidUploadCanaryConfig = ({ root, evidence }) => {
  if (evidence?.candidateType !== 'local-signing-proof') {
    throw new Error('Sentry Android canary requires local-signing-proof candidate evidence');
  }
  if (!SHA256_PATTERN.test(evidence.candidateIdentity || '')) {
    throw new Error('Sentry Android canary candidate identity is invalid');
  }
  if (!/^\d+$/.test(evidence.sentryDist || '')) {
    throw new Error('Sentry Android canary candidate dist is invalid');
  }

  const canaryRelease = `${SENTRY_ANDROID_CANARY_RELEASE_PREFIX}@${evidence.versionName}+${evidence.versionCode}-${evidence.candidateIdentity.slice(0, 12)}`;
  if (canaryRelease === evidence.sentryRelease || canaryRelease.startsWith('io.goldwallet.wallet@')) {
    throw new Error('Sentry Android canary release must not use the production application release namespace');
  }
  const outputDir = path.join(root, 'local-docs', 'sentry-android-upload-canary', evidence.candidateIdentity);

  return {
    org: SENTRY_ANDROID_CANARY_ORG,
    project: SENTRY_ANDROID_CANARY_PROJECT,
    projectId: SENTRY_ANDROID_CANARY_PROJECT_ID,
    canaryRelease,
    dist: evidence.sentryDist,
    candidateIdentity: evidence.candidateIdentity,
    candidateRelease: evidence.sentryRelease,
    sourceBundlePath: evidence.generatedBundle.path,
    sourceMapPath: evidence.sourceMap.path,
    outputDir,
    uploadBundlePath: path.join(outputDir, 'index.android.bundle'),
    uploadSourceMapPath: path.join(outputDir, 'index.android.bundle.map'),
    summaryPath: path.join(root, 'local-docs', 'sentry-android-upload-canary-summary.txt'),
    dryRunSummaryPath: path.join(root, 'local-docs', 'sentry-android-upload-canary-dry-run-summary.txt'),
    debugId: getSentryAndroidCanaryDebugId(evidence.candidateIdentity),
  };
};

export const getSentryAndroidCanaryProjectEndpoint = config =>
  `https://sentry.io/api/0/projects/${encodeURIComponent(config.org)}/${encodeURIComponent(config.project)}/`;

export const getSentryAndroidCanaryProjectIdentityErrors = ({ project, config }) => {
  const errors = [];
  if (String(project?.id || '') !== config.projectId) errors.push('Sentry canary project ID mismatch');
  if (project?.slug !== config.project) errors.push('Sentry canary project slug mismatch');
  if (project?.organization?.slug !== config.org) errors.push('Sentry canary organization slug mismatch');
  return errors;
};

export const prepareSentryAndroidCanaryArtifacts = config => {
  rmSync(config.outputDir, { recursive: true, force: true });
  mkdirSync(config.outputDir, { recursive: true });
  copyFileSync(config.sourceBundlePath, config.uploadBundlePath);

  const sourceMap = JSON.parse(readFileSync(config.sourceMapPath, 'utf8'));
  if (sourceMap.version !== 3 || !Array.isArray(sourceMap.sources) || sourceMap.sources.length === 0) {
    throw new Error('Sentry Android canary source map must be a nonempty version 3 map');
  }
  sourceMap.debug_id = config.debugId;
  writeFileSync(config.uploadSourceMapPath, `${JSON.stringify(sourceMap)}\n`);

  return {
    sourceBundleSha256: hashFile(config.sourceBundlePath),
    sourceMapSha256: hashFile(config.sourceMapPath),
    uploadBundleBytes: statSync(config.uploadBundlePath).size,
    uploadBundleSha256: hashFile(config.uploadBundlePath),
    uploadSourceMapBytes: statSync(config.uploadSourceMapPath).size,
    uploadSourceMapSha256: hashFile(config.uploadSourceMapPath),
  };
};

export const getSentryAndroidCanaryUploadArgs = config => [
  'sourcemaps',
  'upload',
  '--org',
  config.org,
  '--project',
  config.projectId,
  '--release',
  config.canaryRelease,
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
];

export const renderSentryAndroidCanaryCommand = (command, args) =>
  [command, ...args].map(value => (/^[a-zA-Z0-9_./:@+-]+$/.test(value) ? value : JSON.stringify(value))).join(' ');

export const renderSentryAndroidCanarySummary = ({
  config,
  artifacts,
  executed,
  uploadEvidence = null,
  projectIdentityVerified = false,
  generatedAt = new Date(),
}) =>
  [
    'Sentry Android source-map upload canary',
    `Generated at: ${generatedAt.toISOString()}`,
    `Mode: ${executed ? 'executed' : 'dry-run'}`,
    `Organization: ${config.org}`,
    `Project: ${config.project}`,
    `Project ID used by legacy CLI: ${config.projectId}`,
    `Project ID/slug API binding verified: ${projectIdentityVerified ? 'yes' : 'no'}`,
    `Candidate release: ${config.candidateRelease}`,
    `Canary release: ${config.canaryRelease}`,
    `Distribution: ${config.dist}`,
    `Candidate identity: ${config.candidateIdentity}`,
    `Canary debug ID: ${config.debugId}`,
    `Source bundle SHA-256: ${artifacts.sourceBundleSha256}`,
    `Source map SHA-256: ${artifacts.sourceMapSha256}`,
    `Upload bundle bytes: ${artifacts.uploadBundleBytes}`,
    `Upload bundle SHA-256: ${artifacts.uploadBundleSha256}`,
    `Upload source map bytes: ${artifacts.uploadSourceMapBytes}`,
    `Upload source map SHA-256: ${artifacts.uploadSourceMapSha256}`,
    `Upload attempted: ${executed ? 'yes' : 'no'}`,
    `Artifact bundle ID: ${uploadEvidence?.bundleId || 'not available'}`,
    `CLI processing complete: ${uploadEvidence?.processingComplete ? 'yes' : 'no'}`,
    `Script debug ID verified: ${uploadEvidence?.scriptDebugIdVerified ? 'yes' : 'no'}`,
    `Source map debug ID verified: ${uploadEvidence?.sourceMapDebugIdVerified ? 'yes' : 'no'}`,
    `Transport upload validation: ${executed && uploadEvidence?.passed && projectIdentityVerified ? 'passed' : 'not claimed'}`,
    'Legacy release-files API verification: not applicable to artifact bundles',
    'Production release upload validation: not claimed',
    'Event symbolication validation: not claimed',
    'Secret values printed: no',
    '',
  ].join('\n');

export const getSentryAndroidCanarySummaryErrors = ({
  summary,
  config,
  artifacts,
  executed,
  uploadEvidence = null,
  projectIdentityVerified = false,
}) => {
  const errors = [];
  const expect = (label, expected) => {
    if (getSummaryValue(summary, label) !== String(expected)) errors.push(`${label} mismatch`);
  };

  expect('Mode', executed ? 'executed' : 'dry-run');
  expect('Organization', SENTRY_ANDROID_CANARY_ORG);
  expect('Project', SENTRY_ANDROID_CANARY_PROJECT);
  expect('Project ID used by legacy CLI', SENTRY_ANDROID_CANARY_PROJECT_ID);
  expect('Project ID/slug API binding verified', projectIdentityVerified ? 'yes' : 'no');
  expect('Candidate release', config.candidateRelease);
  expect('Canary release', config.canaryRelease);
  expect('Distribution', config.dist);
  expect('Candidate identity', config.candidateIdentity);
  expect('Canary debug ID', config.debugId);
  expect('Source bundle SHA-256', artifacts.sourceBundleSha256);
  expect('Source map SHA-256', artifacts.sourceMapSha256);
  expect('Upload bundle bytes', artifacts.uploadBundleBytes);
  expect('Upload bundle SHA-256', artifacts.uploadBundleSha256);
  expect('Upload source map bytes', artifacts.uploadSourceMapBytes);
  expect('Upload source map SHA-256', artifacts.uploadSourceMapSha256);
  expect('Upload attempted', executed ? 'yes' : 'no');
  expect('Production release upload validation', 'not claimed');
  expect('Event symbolication validation', 'not claimed');
  expect('Secret values printed', 'no');

  expect('Artifact bundle ID', uploadEvidence?.bundleId || 'not available');
  expect('CLI processing complete', uploadEvidence?.processingComplete ? 'yes' : 'no');
  expect('Script debug ID verified', uploadEvidence?.scriptDebugIdVerified ? 'yes' : 'no');
  expect('Source map debug ID verified', uploadEvidence?.sourceMapDebugIdVerified ? 'yes' : 'no');
  expect(
    'Transport upload validation',
    executed && uploadEvidence?.passed && projectIdentityVerified ? 'passed' : 'not claimed',
  );
  expect('Legacy release-files API verification', 'not applicable to artifact bundles');
  if (config.canaryRelease.startsWith('io.goldwallet.wallet@')) errors.push('production release namespace used');
  if (artifacts.sourceBundleSha256 !== artifacts.uploadBundleSha256) errors.push('bundle digest changed');

  return errors;
};

export const getSentryAndroidCanaryUploadEvidence = ({ output, config }) => {
  const bundleId = output.match(/Bundle ID:\s*([a-f0-9-]{36})/i)?.[1]?.toLowerCase() || null;
  const scriptLine = `~/index.android.bundle (sourcemap at index.android.bundle.map, debug id ${config.debugId})`;
  const sourceMapLine = `~/index.android.bundle.map (debug id ${config.debugId})`;
  const checks = {
    bundleId: Boolean(bundleId),
    remoteFilesPresent:
      output.includes('Uploaded files to Sentry') || output.includes('Nothing to upload, all files are on the server'),
    processingComplete: output.includes('File processing complete'),
    organization: output.includes(`Organization: ${config.org}`),
    project: output.includes(`Projects: ${config.projectId}`),
    release: output.includes(`Release: ${config.canaryRelease}`),
    dist: output.includes(`Dist: ${config.dist}`),
    artifactBundle: output.includes('Upload type: artifact bundle'),
    scriptDebugIdVerified: output.includes(scriptLine),
    sourceMapDebugIdVerified: output.includes(sourceMapLine),
  };

  return {
    bundleId,
    processingComplete: checks.processingComplete,
    scriptDebugIdVerified: checks.scriptDebugIdVerified,
    sourceMapDebugIdVerified: checks.sourceMapDebugIdVerified,
    passed: Object.values(checks).every(Boolean),
    errors: Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => `${name} missing from Sentry CLI upload evidence`),
  };
};
