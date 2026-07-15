import assert from 'assert';
import { readFileSync } from 'fs';

import { getSecureStorageHistoricalMigrationSummaryErrors } from './secureStorageHistoricalMigrationSummaryGuard.mjs';

const validSummary = [
  'Generated at: 2026-07-14T20:00:00.000Z',
  'Historical legacy migration outcome: passed',
  'Historical legacy migration exit code: 0',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet',
  'Persisted wallet name: HistoricalWallet',
  'Seed APK path: D:\\seed.apk',
  'Seed APK bytes: 100',
  `Seed APK sha256: ${'a'.repeat(64)}`,
  'Migration APK path: D:\\migration.apk',
  'Migration APK bytes: 101',
  `Migration APK sha256: ${'b'.repeat(64)}`,
  'Fallback-free APK path: D:\\fallback-free.apk',
  'Fallback-free APK bytes: 102',
  `Fallback-free APK sha256: ${'c'.repeat(64)}`,
  'Seed legacy native package linked: yes',
  'Seed validation entry selected: yes',
  'Seed wallet created in legacy backend only: yes',
  'Migration legacy native package linked: yes',
  'Migration production entry loaded: yes',
  'Migration installed with adb install -r: yes',
  'Legacy pin migrated and removed: yes',
  'Legacy transactionPassword migrated and removed: yes',
  'Legacy data_encrypted migrated and removed: yes',
  'Legacy data migrated and removed: yes',
  'Migration unlock screen reached: yes',
  'Migration incorrect PIN rejected: yes',
  'Migration correct PIN accepted: yes',
  'Migration storage password accepted: yes',
  'Migration wallet card visible: yes',
  'Fallback-free legacy native package linked: no',
  'Fallback-free normal entry selected: yes',
  'Fallback-free installed with adb install -r: yes',
  'Fallback-free application data preserved: yes',
  'Fallback-free unlock screen reached: yes',
  'Fallback-free incorrect PIN rejected: yes',
  'Fallback-free correct PIN accepted: yes',
  'Fallback-free storage password accepted: yes',
  'Fallback-free wallet card visible: yes',
  'Secure window flag after fallback-free update: no',
  'Fatal/runtime logcat findings: no',
  'Seed App PID: 111',
  'Migration App PID: 222',
  'Fallback-free App PID: 333',
].join('\n');

assert.deepStrictEqual(getSecureStorageHistoricalMigrationSummaryErrors(validSummary, { requireArtifacts: false }), []);
assert.ok(
  getSecureStorageHistoricalMigrationSummaryErrors(
    validSummary.replace(
      'Legacy transactionPassword migrated and removed: yes',
      'Legacy transactionPassword migrated and removed: no',
    ),
    { requireArtifacts: false },
  ).some(error => error.includes('Legacy transactionPassword migrated and removed: yes')),
);
assert.ok(
  getSecureStorageHistoricalMigrationSummaryErrors(`${validSummary}\nPIN: 1111`, { requireArtifacts: false }).some(
    error => error.includes('secret-bearing fields'),
  ),
);

const buildGradle = readFileSync('android/app/build.gradle', 'utf8');
const seedEntry = readFileSync('validation/legacySecureStorageSeedEntry.js', 'utf8');
const migrationProbeEntry = readFileSync('validation/legacySecureStorageMigrationProbeEntry.js', 'utf8');
const driver = readFileSync('scripts/runSecureStorageHistoricalMigrationValidation.mjs', 'utf8');

assert.match(buildGradle, /goldwalletEntryFile/);
assert.match(seedEntry, /RNSecureKeyStore/);
assert.match(seedEntry, /^require\('react-native-get-random-values'\);/);
assert.match(seedEntry, /setSecuredValue/);
assert.match(seedEntry, /AppStorage\.prototype\.setItem/);
assert.match(seedEntry, /AppStorage\.prototype\.getItem/);
assert.match(seedEntry, /AppStorage\.prototype\.storageIsEncrypted/);
assert.match(seedEntry, /encryption\.encrypt/);
assert.match(migrationProbeEntry, /GOLDWALLET_LEGACY_MIGRATION_REMOVED/);
assert.match(migrationProbeEntry, /data_encrypted/);
assert.match(migrationProbeEntry, /require\('\.\.\/index'\)/);
assert.match(driver, /legacySecureStorageSeedEntry\.js/);
assert.match(driver, /--resume-seed-build/);
assert.match(driver, /Cannot resume seed build/);
assert.match(driver, /'install', '-r'/);
assert.match(driver, /GOLDWALLET_DISABLE_LEGACY_SECURE_STORAGE/);
assert.match(driver, /transactionPassword/);
assert.match(driver, /data_encrypted/);

console.log('Historical secure-storage migration summary guard checks passed.');
