import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const requestedOutputBaseName = process.env.ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME || 'android-create-wallet-smoke';
const isSafeOutputBaseName = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(requestedOutputBaseName);
const outputBaseName = isSafeOutputBaseName ? requestedOutputBaseName : 'android-create-wallet-smoke';
const summaryPath = path.join(root, 'local-docs', `${outputBaseName}-summary.txt`);
const debugApkPath = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'dev', 'debug', 'app-dev-debug.apk');
const expectedApkPath = process.env.ANDROID_CREATE_WALLET_SMOKE_EXPECTED_APK || debugApkPath;

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

const requireFileEvidence = (summary, { pathLabel, bytesLabel, shaLabel, expectedPath }, errors) => {
  const filePath = getLineValue(summary, pathLabel);
  const bytes = getLineValue(summary, bytesLabel);
  const sha256 = getLineValue(summary, shaLabel);

  if (!filePath) {
    errors.push(`${pathLabel} is missing`);
    return;
  }

  if (filePath !== expectedPath) {
    errors.push(`${pathLabel} must be ${expectedPath}. Received: ${filePath}`);
  }

  if (!existsSync(filePath) || statSync(filePath).size <= 0) {
    errors.push(`${pathLabel} must point to a non-empty file`);
    return;
  }

  if (!isPositiveInteger(bytes)) {
    errors.push(`${bytesLabel} must be a positive integer. Received: ${bytes || 'missing'}`);
  } else if (Number(bytes) !== statSync(filePath).size) {
    errors.push(`${bytesLabel} does not match the current file size for ${filePath}`);
  }

  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    errors.push(`${shaLabel} must be a lowercase SHA-256 digest. Received: ${sha256 || 'missing'}`);
  } else if (sha256 !== fileSha256(filePath)) {
    errors.push(`${shaLabel} does not match the current file digest for ${filePath}`);
  }
};

if (!existsSync(summaryPath)) {
  console.error(`Missing Android create-wallet smoke summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = [];

if (!isSafeOutputBaseName) {
  errors.push(`ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME must be a safe file basename. Received: ${requestedOutputBaseName}`);
}

if (!isIsoTimestamp(getLineValue(summary, 'Generated at'))) {
  errors.push('Generated at must be an ISO timestamp');
}

[
  'Android create-wallet smoke outcome: passed',
  'Android create-wallet smoke exit code: 0',
  'Standard wallet created: yes',
  'Standard mnemonic screen reached: yes',
  'Vault next-step reached: yes',
  'No create-wallet error UI: yes',
  'Fatal/runtime logcat findings: no',
].forEach(expectedLine => {
  if (!hasLine(summary, expectedLine)) {
    errors.push(`Expected line not found: ${expectedLine}`);
  }
});

['Android serial', 'Android package', 'Android activity', 'Artifact base', 'Standard wallet name', 'Vault wallet name'].forEach(
  label => {
    if (!getLineValue(summary, label)) {
      errors.push(`${label} is missing`);
    }
  },
);

['App PID', 'Captured logcat lines', 'Screenshot bytes'].forEach(label => {
  if (!isPositiveInteger(getLineValue(summary, label))) {
    errors.push(`${label} must be a positive integer`);
  }
});

requireFileEvidence(
  summary,
  {
    pathLabel: 'Source APK path',
    bytesLabel: 'Source APK bytes',
    shaLabel: 'Source APK sha256',
    expectedPath: expectedApkPath,
  },
  errors,
);
requireExistingFile(summary, 'UI hierarchy path', errors);
requireExistingFile(summary, 'Logcat path', errors);
requireExistingFile(summary, 'Screenshot path', errors);

if (errors.length > 0) {
  console.error('Android create-wallet smoke summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android create-wallet smoke summary artifact is valid.');
