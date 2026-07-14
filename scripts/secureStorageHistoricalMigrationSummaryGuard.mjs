import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}:`));

  return line ? line.slice(label.length + 1).trim() : '';
};

const hasLine = (content, expectedLine) => content.split(/\r?\n/).includes(expectedLine);
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;
const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

const requireApkEvidence = (summary, prefix, errors, requireArtifacts) => {
  const filePath = getLineValue(summary, `${prefix} APK path`);
  const bytes = getLineValue(summary, `${prefix} APK bytes`);
  const sha256 = getLineValue(summary, `${prefix} APK sha256`);

  if (!filePath) errors.push(`${prefix} APK path is missing`);
  if (!isPositiveInteger(bytes)) errors.push(`${prefix} APK bytes must be a positive integer`);
  if (!/^[a-f0-9]{64}$/.test(sha256)) errors.push(`${prefix} APK sha256 must be a lowercase SHA-256 digest`);

  if (!requireArtifacts || !filePath) return;
  if (!existsSync(filePath) || statSync(filePath).size <= 0) {
    errors.push(`${prefix} APK path must point to a non-empty file`);
    return;
  }
  if (Number(bytes) !== statSync(filePath).size) errors.push(`${prefix} APK bytes do not match the current file`);
  if (sha256 !== fileSha256(filePath)) errors.push(`${prefix} APK sha256 does not match the current file`);
};

export const getSecureStorageHistoricalMigrationSummaryErrors = (
  summary,
  { requireArtifacts = true } = {},
) => {
  const errors = [];

  if (!isIsoTimestamp(getLineValue(summary, 'Generated at'))) {
    errors.push('Generated at must be an ISO timestamp');
  }

  [
    'Historical legacy migration outcome: passed',
    'Historical legacy migration exit code: 0',
    'Seed legacy native package linked: yes',
    'Seed validation entry selected: yes',
    'Seed wallet created in legacy backend only: yes',
    'Migration legacy native package linked: yes',
    'Migration normal entry selected: yes',
    'Migration installed with adb install -r: yes',
    'Legacy pin migrated and removed: yes',
    'Legacy transactionPassword migrated and removed: yes',
    'Legacy data_encrypted migrated and removed: yes',
    'Legacy data migrated and removed: yes',
    'Migration unlock screen reached: yes',
    'Migration incorrect PIN rejected: yes',
    'Migration correct PIN accepted: yes',
    'Migration wallet card visible: yes',
    'Fallback-free legacy native package linked: no',
    'Fallback-free normal entry selected: yes',
    'Fallback-free installed with adb install -r: yes',
    'Fallback-free application data preserved: yes',
    'Fallback-free unlock screen reached: yes',
    'Fallback-free incorrect PIN rejected: yes',
    'Fallback-free correct PIN accepted: yes',
    'Fallback-free wallet card visible: yes',
    'Secure window flag after fallback-free update: no',
    'Fatal/runtime logcat findings: no',
  ].forEach(expectedLine => {
    if (!hasLine(summary, expectedLine)) errors.push(`Expected line not found: ${expectedLine}`);
  });

  ['Android serial', 'Android package', 'Persisted wallet name'].forEach(label => {
    if (!getLineValue(summary, label)) errors.push(`${label} is missing`);
  });

  const pids = ['Seed App PID', 'Migration App PID', 'Fallback-free App PID'].map(label => {
    const value = getLineValue(summary, label);
    if (!isPositiveInteger(value)) errors.push(`${label} must be a positive integer`);
    return value;
  });
  if (pids.every(isPositiveInteger) && new Set(pids).size !== pids.length) {
    errors.push('Seed, migration, and fallback-free App PIDs must differ');
  }

  ['Seed', 'Migration', 'Fallback-free'].forEach(prefix =>
    requireApkEvidence(summary, prefix, errors, requireArtifacts),
  );
  const digests = ['Seed', 'Migration', 'Fallback-free'].map(prefix => getLineValue(summary, `${prefix} APK sha256`));
  if (digests.every(value => /^[a-f0-9]{64}$/.test(value)) && new Set(digests).size !== digests.length) {
    errors.push('Seed, migration, and fallback-free APK SHA-256 digests must differ');
  }

  if (/^(Mnemonic|Seed phrase|Private key|WIF|Secret|PIN|Transaction password):/im.test(summary)) {
    errors.push('Summary must not contain secret-bearing fields');
  }

  return errors;
};
