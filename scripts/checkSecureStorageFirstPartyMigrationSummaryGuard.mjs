import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getSecureStorageFirstPartyMigrationSummaryErrors } from './secureStorageFirstPartyMigrationSummaryGuard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const validSummary = [
  'Secure-storage first-party migration validation',
  'Generated at: 2026-08-11T00:00:00.000Z',
  'Outcome: passed',
  'Exit code: 0',
  'Validation run id: 11111111-1111-4111-8111-111111111111',
  `Migration source sha256: ${'a'.repeat(64)}`,
  'Reason: historical Android secure-storage values migrated through the first-party bridge',
  'Seed APK present: yes',
  'Candidate APK present: yes',
  `Candidate APK sha256: ${'b'.repeat(64)}`,
  'Seed wallet persisted: yes',
  'Candidate installed with adb install -r: yes',
  'Candidate uses first-party migration bridge: yes',
  'Candidate excludes third-party legacy package: yes',
  'PIN migrated and removed: yes',
  'Transaction password migrated and removed: yes',
  'Encrypted flag migrated and removed: yes',
  'Wallet data migrated and removed: yes',
  'Wallet accessible after candidate update: yes',
  'Incorrect PIN rejected after candidate update: yes',
  'Correct PIN accepted after candidate update: yes',
  'Storage password accepted after candidate update: yes',
  'Legacy cleanup evidence derived from runtime: yes',
  'Legacy fallback instrumentation observed: yes',
  'Fatal/runtime logcat findings: no',
  'Secret values printed: no',
  'Required action: keep the first-party migration bridge through a validated cross-platform rollout window.',
].join('\n');

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

assert(getSecureStorageFirstPartyMigrationSummaryErrors(validSummary).length === 0, 'Valid migration summary must pass');
assert(
  getSecureStorageFirstPartyMigrationSummaryErrors(validSummary, { migrationSourceSha256: 'c'.repeat(64) }).some(error =>
    error.includes('Migration source sha256 does not match'),
  ),
  'Stale migration source proof must fail',
);
assert(
  getSecureStorageFirstPartyMigrationSummaryErrors(validSummary, { candidateApkSha256: 'c'.repeat(64) }).some(error =>
    error.includes('Candidate APK sha256 does not match'),
  ),
  'Stale candidate APK proof must fail',
);
assert(
  getSecureStorageFirstPartyMigrationSummaryErrors(validSummary.replace('PIN migrated and removed: yes', 'PIN migrated and removed: no')).some(error =>
    error.includes('PIN migrated and removed'),
  ),
  'Missing PIN migration must fail',
);
assert(
  getSecureStorageFirstPartyMigrationSummaryErrors(validSummary.replace('Candidate excludes third-party legacy package: yes', 'Candidate excludes third-party legacy package: no')).some(error =>
    error.includes('Candidate excludes third-party legacy package'),
  ),
  'Third-party legacy package linkage must fail',
);
assert(
  getSecureStorageFirstPartyMigrationSummaryErrors(validSummary.replace('Wallet accessible after candidate update: yes', 'Wallet accessible after candidate update: no')).some(error =>
    error.includes('Wallet accessible after candidate update'),
  ),
  'Inaccessible migrated wallet must fail',
);

const runner = readFileSync(path.join(root, 'scripts', 'runSecureStorageFirstPartyMigrationValidation.mjs'), 'utf8');
for (const marker of [
  'secure-storage-first-party-migration-checkpoint.json',
  "stage: 'candidate-built-seed-installed'",
  'installedPackageSha256()',
  'sha256MigrationInputs(root)',
  'checkpoint.seedApkSha256',
  'candidateApkSha256: sha256File(candidateApkPath)',
  'migrationSourceSha256,',
  'checkpoint[field] !== expectedValue',
]) {
  assert(runner.includes(marker), `Migration runner must preserve resume evidence marker: ${marker}`);
}

console.log('Secure-storage first-party migration summary guard checks are valid.');
