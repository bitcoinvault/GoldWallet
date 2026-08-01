import { createHash } from 'crypto';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';

export const SENTRY_GRADLE_CANARY_RELEASE_PREFIX = 'goldwallet-android-gradle-canary';

const FIXED_INPUT_PATHS = [
  'App.tsx',
  'Main.tsx',
  'BlueApp.js',
  'BlueElectrum.js',
  'encryption.js',
  'events.js',
  'index.js',
  'MockStorage.js',
  'prompt.js',
  'shim.js',
  'babel.config.js',
  'metro.config.js',
  'react-native.config.js',
  'package.json',
  'yarn.lock',
  '.env.dev.testnet',
  'android/app/build.gradle',
  'android/build.gradle',
  'android/settings.gradle',
  'android/gradle.properties',
  'android/release-version.properties',
  'android/release-version.gradle',
  'android/release-version-contract.json',
];
const INPUT_DIRECTORIES = [
  'class',
  'error',
  'img',
  'loc',
  'logger',
  'models',
  'patches',
  'src',
  'utils',
  'validation',
  'android/app/src',
];
const GENERATED_INPUT_PATHS = new Set(['android/app/src/main/assets/modules.json']);

const collectDirectoryFiles = (root, relativeDirectory) => {
  const directory = path.join(root, relativeDirectory);
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return collectDirectoryFiles(root, relativePath);
    return entry.isFile() ? [relativePath] : [];
  });
};

const getInputPaths = root =>
  [
    ...FIXED_INPUT_PATHS.filter(relativePath => existsSync(path.join(root, relativePath))),
    ...INPUT_DIRECTORIES.flatMap(relativeDirectory => collectDirectoryFiles(root, relativeDirectory)),
  ]
    .map(relativePath => relativePath.replaceAll('\\', '/'))
    .filter(relativePath => !GENERATED_INPUT_PATHS.has(relativePath))
    .sort();

const hashFiles = (root, relativePaths) => {
  const hash = createHash('sha256');
  relativePaths.forEach(relativePath => {
    hash.update(relativePath);
    hash.update('\0');
    hash.update(readFileSync(path.join(root, relativePath)));
    hash.update('\0');
  });
  return hash.digest('hex');
};

export const getSentryGradleDevUploadCanaryConfig = ({ root, metadata }) => {
  const inputPaths = getInputPaths(root);
  if (inputPaths.length === 0) throw new Error('Sentry Gradle canary build input set is empty');
  const identity = hashFiles(root, inputPaths);
  const release = `${SENTRY_GRADLE_CANARY_RELEASE_PREFIX}@${metadata.versionName}+${metadata.versionCode}-${identity.slice(0, 12)}`;

  return {
    release,
    dist: String(metadata.versionCode),
    identity,
    logPath: path.join(root, 'local-docs', 'sentry-gradle-dev-upload-canary.log'),
    summaryPath: path.join(root, 'local-docs', 'sentry-gradle-dev-upload-canary-summary.txt'),
    dryRunSummaryPath: path.join(root, 'local-docs', 'sentry-gradle-dev-upload-canary-dry-run-summary.txt'),
  };
};

export const redactSentryGradleCanaryOutput = (output, token = '') => {
  let redacted = token ? output.replaceAll(token, '[REDACTED]') : output;
  redacted = redacted.replace(/Authorization:\s*Bearer\s+\S+/gi, 'Authorization: Bearer [REDACTED]');
  return redacted;
};

export const getSentryGradleDevUploadEvidence = ({ output, config, sourceMapDebugId, bundleContainsDebugId }) => {
  const bundleDebugId = output.match(/Bundle Debug ID:\s*([a-f0-9-]{36})/i)?.[1]?.toLowerCase() || null;
  const checkedDebugId =
    output.match(/Check generated source map for Debug ID:\s*([a-f0-9-]{36})/i)?.[1]?.toLowerCase() || null;
  const bundleId = output.match(/Bundle ID:\s*([a-f0-9-]{36})/i)?.[1]?.toLowerCase() || null;
  const checks = {
    buildSuccessful: /BUILD SUCCESSFUL/.test(output),
    uploadTaskRan: output.includes('Sentry Source Maps upload will include the release name and dist.'),
    remoteFilesPresent:
      output.includes('Uploaded files to Sentry') || output.includes('Nothing to upload, all files are on the server'),
    processingComplete: /Processing completed in/.test(output),
    artifactBundle: output.includes('Upload type: artifact bundle'),
    organization: output.includes('Organization: decentraplanet'),
    project: output.includes('Projects: goldwallet-dev-android'),
    release: output.includes(`Release: ${config.release}`),
    dist: output.includes(`Dist: ${config.dist}`),
    bundleId: Boolean(bundleId),
    debugId:
      Boolean(sourceMapDebugId) &&
      sourceMapDebugId === checkedDebugId &&
      (!bundleDebugId || bundleDebugId === sourceMapDebugId),
    bundleContainsDebugId,
    noMissingDebugId: !/does not contain ['"]?debugId|Packager source map does not have `debugId`/i.test(output),
    noCredentialHeaders: !/Authorization:\s*Bearer|SENTRY_AUTH_TOKEN=|auth\.token=/i.test(output),
  };

  return {
    bundleId,
    debugId: sourceMapDebugId,
    passed: Object.values(checks).every(Boolean),
    errors: Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => `${name} missing from Gradle Sentry canary evidence`),
  };
};

export const renderSentryGradleDevUploadSummary = ({
  config,
  executed,
  projectIdentityVerified = false,
  evidence = null,
  generatedAt = new Date(),
}) =>
  [
    'Sentry Gradle devRelease source-map upload canary',
    `Generated at: ${generatedAt.toISOString()}`,
    `Mode: ${executed ? 'executed' : 'dry-run'}`,
    'Organization: decentraplanet',
    'Project: goldwallet-dev-android',
    'Project ID: 5875208',
    `Project ID/slug API binding verified: ${projectIdentityVerified ? 'yes' : 'no'}`,
    `Canary release: ${config.release}`,
    `Distribution: ${config.dist}`,
    `Input identity: ${config.identity}`,
    `Artifact bundle ID: ${evidence?.bundleId || 'not available'}`,
    `Bundle/source-map debug ID: ${evidence?.debugId || 'not available'}`,
    `Gradle build and upload validation: ${executed && projectIdentityVerified && evidence?.passed ? 'passed' : 'not claimed'}`,
    'Production release upload validation: not claimed',
    'Event symbolication validation: not claimed',
    'iOS source-map/dSYM validation: not claimed',
    'Secret values printed: no',
    '',
  ].join('\n');
