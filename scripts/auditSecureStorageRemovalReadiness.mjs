import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-removal-readiness-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const collectSecureStorageRemovalReadinessAudit = () => {
  const packageJson = JSON.parse(read('package.json'));
  const dependencies = packageJson.dependencies || {};
  const service = read('src/services/SecureStorageService.ts');
  const appStorage = read('class/app-storage.js');
  const unitTest = read('tests/unit/SecureStorageService.test.js');
  const storageTest = read('tests/integration/Storage.test.js');
  const historicalGuard = read('scripts/secureStorageHistoricalMigrationSummaryGuard.mjs');
  const firstPartyMigrationGuard = read('scripts/secureStorageFirstPartyMigrationSummaryGuard.mjs');
  const firstPartyMigrationDriver = read('scripts/runSecureStorageFirstPartyMigrationValidation.mjs');
  const errors = [];
  const legacyPackageAbsent = !dependencies['react-native-secure-key-store'];
  const legacyAdapterAbsent = !existsSync(path.join(root, 'src/services/LegacySecureKeyStore.ts'));
  const fallbackReadsActive =
    service.includes('LegacySecureStorageMigration.get') && appStorage.includes('LegacySecureStorageMigration.get');
  const migrationBridgeActive =
    existsSync(path.join(root, 'src/services/LegacySecureStorageMigration.ts')) &&
    existsSync(path.join(root, 'android/app/src/main/java/io/goldwallet/LegacySecureStorageMigrationModule.java')) &&
    existsSync(path.join(root, 'ios/GoldWallet/GoldWalletLegacySecureStorage.m'));
  const keychainOnlyTestsPresent =
    unitTest.includes('returns keychain credentials for the requested service') &&
    unitTest.includes('migrates a legacy value after an empty keychain read') &&
    unitTest.includes('returns the legacy value without cleanup when the migration write fails') &&
    storageTest.includes('validates fallback-free encrypted wallet data from keychain') &&
    storageTest.includes('migrates legacy wallet data before cleanup');
  const historicalMigrationProofGuarded =
    historicalGuard.includes('Legacy pin migrated and removed: yes') &&
    firstPartyMigrationGuard.includes('PIN migrated and removed') &&
    firstPartyMigrationGuard.includes('Candidate excludes third-party legacy package') &&
    firstPartyMigrationDriver.includes('install migration candidate over historical data') &&
    firstPartyMigrationDriver.includes("['install', '-r', candidateApkPath]");

  if (dependencies['react-native-keychain'] !== '10.0.0') errors.push('react-native-keychain must remain at 10.0.0');
  if (!legacyPackageAbsent) errors.push('react-native-secure-key-store must be absent');
  if (!legacyAdapterAbsent) errors.push('legacy native adapter must be absent');
  if (!fallbackReadsActive) errors.push('legacy fallback reads must remain active during the migration window');
  if (!migrationBridgeActive) errors.push('first-party cross-platform migration bridge must be present');
  if (!keychainOnlyTestsPresent) errors.push('Keychain-only secure-storage tests are incomplete');
  if (!historicalMigrationProofGuarded) errors.push('historical legacy migration proof must remain guarded');

  return {
    currentPackage: `react-native-keychain@${dependencies['react-native-keychain'] || '<missing>'}`,
    legacyPackage: legacyPackageAbsent ? '<removed>' : `react-native-secure-key-store@${dependencies['react-native-secure-key-store']}`,
    currentPosture: 'Keychain primary with first-party legacy migration bridge',
    keychainPrimaryWrite:
      service.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))') &&
      appStorage.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))'),
    fallbackReadsActive,
    legacyPackageAbsent,
    legacyAdapterAbsent,
    keychainOnlyTestsPresent,
    historicalMigrationProofGuarded,
    migrationBridgeActive,
    iosMigrationRuntimeValidated: false,
    migrationReleaseDeploymentConfirmed: false,
    removalReleaseValidationClaimed: false,
    androidWarningSourceStillExpected: false,
    legacyPackageRemovalReady: errors.length === 0,
    fallbackRemovalReady: false,
    errors,
  };
};

export const formatSecureStorageRemovalReadinessSummary = (audit, generatedAt = new Date().toISOString()) =>
  [
    'Secure-storage removal readiness audit',
    `Generated at: ${generatedAt}`,
    `Current secure-storage package: ${audit.currentPackage}`,
    `Legacy secure-storage package: ${audit.legacyPackage}`,
    `Current posture: ${audit.currentPosture}`,
    `Keychain primary write: ${audit.keychainPrimaryWrite ? 'yes' : 'no'}`,
    `Legacy fallback reads active: ${audit.fallbackReadsActive ? 'yes' : 'no'}`,
    `Legacy package absent: ${audit.legacyPackageAbsent ? 'yes' : 'no'}`,
    `Legacy adapter absent: ${audit.legacyAdapterAbsent ? 'yes' : 'no'}`,
    `Keychain-only tests present: ${audit.keychainOnlyTestsPresent ? 'yes' : 'no'}`,
    `Historical legacy migration proof guarded: ${audit.historicalMigrationProofGuarded ? 'yes' : 'no'}`,
    `First-party migration bridge active: ${audit.migrationBridgeActive ? 'yes' : 'no'}`,
    `iOS migration runtime validated: ${audit.iosMigrationRuntimeValidated ? 'yes' : 'no'}`,
    `Migration release deployment confirmed: ${audit.migrationReleaseDeploymentConfirmed ? 'yes' : 'no'}`,
    `Removal release validation claimed: ${audit.removalReleaseValidationClaimed ? 'yes' : 'no'}`,
    `Android warning source still expected: ${audit.androidWarningSourceStillExpected ? 'yes' : 'no'}`,
    `Legacy package removal ready: ${audit.legacyPackageRemovalReady ? 'yes' : 'no'}`,
    `Fallback removal ready: ${audit.fallbackRemovalReady ? 'yes' : 'no'}`,
    `Errors: ${audit.errors.length}`,
    ...audit.errors.map(error => `- ${error}`),
    audit.legacyPackageRemovalReady
      ? 'Required action: ship and validate the cross-platform migration window before removing the first-party fallback bridge.'
      : 'Required action: restore the first-party cross-platform migration bridge.',
    '',
  ].join('\n');

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSecureStorageRemovalReadinessAudit();
  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, formatSecureStorageRemovalReadinessSummary(audit));
  console.log(`Secure-storage removal readiness audit\nCurrent package: ${audit.currentPackage}\nLegacy package: ${audit.legacyPackage}`);
  if (audit.errors.length > 0) {
    audit.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log('Third-party legacy package removal is validated; first-party fallback removal remains blocked.');
  }
  console.log(`Secure-storage removal readiness summary written to ${path.relative(root, summaryPath)}`);
}
