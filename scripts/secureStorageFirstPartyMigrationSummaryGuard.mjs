const value = (summary, label) => {
  const line = summary.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const isSha256 = candidate => /^[a-f0-9]{64}$/.test(candidate);
const isRunId = candidate => /^[a-f0-9-]{36}$/.test(candidate);

export const getSecureStorageFirstPartyMigrationSummaryErrors = (summary, expected = {}) => {
  const errors = [];

  if (!summary.startsWith('Secure-storage first-party migration validation')) errors.push('summary header is missing');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value(summary, 'Generated at'))) errors.push('Generated at must be an ISO timestamp');
  if (value(summary, 'Outcome') !== 'passed') errors.push('Outcome must be passed');
  if (value(summary, 'Exit code') !== '0') errors.push('Exit code must be 0');
  if (!isRunId(value(summary, 'Validation run id'))) errors.push('Validation run id must be present');
  if (!isSha256(value(summary, 'Migration source sha256'))) errors.push('Migration source sha256 must be valid');
  if (!isSha256(value(summary, 'Candidate APK sha256'))) errors.push('Candidate APK sha256 must be valid');

  if (expected.migrationSourceSha256 && value(summary, 'Migration source sha256') !== expected.migrationSourceSha256) {
    errors.push('Migration source sha256 does not match the current migration inputs');
  }
  if (expected.candidateApkSha256 && value(summary, 'Candidate APK sha256') !== expected.candidateApkSha256) {
    errors.push('Candidate APK sha256 does not match the current candidate APK');
  }

  for (const label of [
    'Seed APK present',
    'Candidate APK present',
    'Seed wallet persisted',
    'Candidate installed with adb install -r',
    'Candidate uses first-party migration bridge',
    'Candidate excludes third-party legacy package',
    'PIN migrated and removed',
    'Transaction password migrated and removed',
    'Encrypted flag migrated and removed',
    'Wallet data migrated and removed',
    'Wallet accessible after candidate update',
    'Incorrect PIN rejected after candidate update',
    'Correct PIN accepted after candidate update',
    'Storage password accepted after candidate update',
    'Legacy cleanup evidence derived from runtime',
    'Legacy fallback instrumentation observed',
  ]) {
    if (value(summary, label) !== 'yes') errors.push(`${label} must be yes`);
  }

  if (value(summary, 'Fatal/runtime logcat findings') !== 'no') errors.push('Fatal/runtime logcat findings must be no');
  if (value(summary, 'Secret values printed') !== 'no') errors.push('Secret values printed must be no');
  if (!value(summary, 'Required action').includes('keep the first-party migration bridge')) {
    errors.push('Required action must preserve the first-party migration bridge');
  }

  return errors;
};
