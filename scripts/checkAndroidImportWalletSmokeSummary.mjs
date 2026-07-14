import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const requestedOutputBaseName =
  process.env.ANDROID_IMPORT_WALLET_SMOKE_OUTPUT_BASENAME || 'android-import-wallet-smoke';
const isSafeOutputBaseName = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(requestedOutputBaseName);
const outputBaseName = isSafeOutputBaseName ? requestedOutputBaseName : 'android-import-wallet-smoke';
const summaryPath = path.join(root, 'local-docs', `${outputBaseName}-summary.txt`);
const debugApkPath = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'dev', 'debug', 'app-dev-debug.apk');
const expectedApkPath = process.env.ANDROID_IMPORT_WALLET_SMOKE_EXPECTED_APK || debugApkPath;

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}:`));

  return line ? line.slice(label.length + 1).trim() : '';
};

const hasLine = (content, expectedLine) => content.split(/\r?\n/).includes(expectedLine);
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;
const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

const requireExistingFile = (summary, label, errors) => {
  const filePath = getLineValue(summary, label);

  if (!filePath || !existsSync(filePath)) {
    errors.push(`${label} must point to an existing file`);
    return;
  }

  if (statSync(filePath).size <= 0) {
    errors.push(`${label} must point to a non-empty file`);
  }
};

const requireFileEvidence = (summary, expectedSourceApkPath, errors, requireArtifacts) => {
  const filePath = getLineValue(summary, 'Source APK path');
  const bytes = getLineValue(summary, 'Source APK bytes');
  const sha256 = getLineValue(summary, 'Source APK sha256');

  if (!filePath) {
    errors.push('Source APK path is missing');
    return;
  }

  if (expectedSourceApkPath && filePath !== expectedSourceApkPath) {
    errors.push(`Source APK path must be ${expectedSourceApkPath}. Received: ${filePath}`);
  }

  if (!isPositiveInteger(bytes)) {
    errors.push(`Source APK bytes must be a positive integer. Received: ${bytes || 'missing'}`);
  }

  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    errors.push(`Source APK sha256 must be a lowercase SHA-256 digest. Received: ${sha256 || 'missing'}`);
  }

  if (!requireArtifacts) {
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).size <= 0) {
    errors.push('Source APK path must point to a non-empty file');
    return;
  }

  if (Number(bytes) !== statSync(filePath).size) {
    errors.push(`Source APK bytes does not match the current file size for ${filePath}`);
  }

  if (sha256 !== fileSha256(filePath)) {
    errors.push(`Source APK sha256 does not match the current file digest for ${filePath}`);
  }
};

export const getAndroidImportWalletSmokeSummaryErrors = (summary, options = {}) => {
  const errors = [];
  const { expectedApkPath: expectedSourceApkPath, expectedArtifactBase, requireArtifacts = true } = options;

  if (!isIsoTimestamp(getLineValue(summary, 'Generated at'))) {
    errors.push('Generated at must be an ISO timestamp');
  }

  [
    'Android import-wallet smoke outcome: passed',
    'Android import-wallet smoke exit code: 0',
    'Import fixture type: public-watch-only-address',
    'Import success screen reached: yes',
    'Imported wallet visible on dashboard: yes',
    'No import-wallet error UI: yes',
    'Secure window flag after import: no',
    'Fatal/runtime logcat findings: no',
  ].forEach(expectedLine => {
    if (!hasLine(summary, expectedLine)) {
      errors.push(`Expected line not found: ${expectedLine}`);
    }
  });

  [
    'Android serial',
    'Android package',
    'Android activity',
    'Artifact base',
    'Import fixture address',
    'Imported wallet name',
  ].forEach(label => {
    if (!getLineValue(summary, label)) {
      errors.push(`${label} is missing`);
    }
  });

  if (expectedArtifactBase && getLineValue(summary, 'Artifact base') !== expectedArtifactBase) {
    errors.push(
      `Artifact base must be ${expectedArtifactBase}. Received: ${getLineValue(summary, 'Artifact base') || 'missing'}`,
    );
  }

  if (!/^(R[a-km-zA-HJ-NP-Z1-9]{20,}|royale1[a-z0-9]{20,})$/.test(getLineValue(summary, 'Import fixture address'))) {
    errors.push('Import fixture address must be a public BTCV address');
  }

  ['App PID', 'Captured logcat lines', 'Screenshot bytes'].forEach(label => {
    if (!isPositiveInteger(getLineValue(summary, label))) {
      errors.push(`${label} must be a positive integer`);
    }
  });

  if (/^(Mnemonic|Seed phrase|Private key|WIF|Secret):/im.test(summary)) {
    errors.push('Summary must not contain secret-bearing fields');
  }

  requireFileEvidence(summary, expectedSourceApkPath, errors, requireArtifacts);
  if (requireArtifacts) {
    requireExistingFile(summary, 'UI hierarchy path', errors);
    requireExistingFile(summary, 'Logcat path', errors);
    requireExistingFile(summary, 'Screenshot path', errors);
  }

  return errors;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!existsSync(summaryPath)) {
    console.error(`Missing Android import-wallet smoke summary artifact: ${summaryPath}`);
    process.exit(1);
  }

  const errors = [];

  if (!isSafeOutputBaseName) {
    errors.push(
      `ANDROID_IMPORT_WALLET_SMOKE_OUTPUT_BASENAME must be a safe file basename. Received: ${requestedOutputBaseName}`,
    );
  }

  getAndroidImportWalletSmokeSummaryErrors(readFileSync(summaryPath, 'utf8'), {
    expectedApkPath,
    expectedArtifactBase: outputBaseName,
  }).forEach(error => errors.push(error));

  if (errors.length > 0) {
    console.error('Android import-wallet smoke summary artifact is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Android import-wallet smoke summary artifact is valid.');
}
