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
  const historicalDriver = read('scripts/runSecureStorageHistoricalMigrationValidation.mjs');
  const errors = [];
  const legacyPackageAbsent = !dependencies['react-native-secure-key-store'];
  const legacyAdapterAbsent = !existsSync(path.join(root, 'src/services/LegacySecureKeyStore.ts'));
  const fallbackReadsActive = service.includes('RNSecureKeyStore.get') || appStorage.includes('RNSecureKeyStore.get');
  const keychainOnlyTestsPresent =
    unitTest.includes('returns keychain credentials for the requested service') &&
    unitTest.includes('returns an empty string when the keychain read fails') &&
    unitTest.includes('removes secured values from keychain') &&
    storageTest.includes('validates fallback-free encrypted wallet data from keychain') &&
    storageTest.includes('returns missing storage when keychain read fails');
  const historicalMigrationProofGuarded =
    historicalGuard.includes('Legacy pin migrated and removed: yes') &&
    historicalGuard.includes('Fallback-free legacy native package linked: no') &&
    historicalDriver.includes('historical legacy-only wallet migrated to Keychain and survived a fallback-free release update');

  if (dependencies['react-native-keychain'] !== '10.0.0') errors.push('react-native-keychain must remain at 10.0.0');
  if (!legacyPackageAbsent) errors.push('react-native-secure-key-store must be absent');
  if (!legacyAdapterAbsent) errors.push('legacy native adapter must be absent');
  if (fallbackReadsActive) errors.push('legacy fallback reads must be absent');
  if (!keychainOnlyTestsPresent) errors.push('Keychain-only secure-storage tests are incomplete');
  if (!historicalMigrationProofGuarded) errors.push('historical legacy migration proof must remain guarded');

  return {
    currentPackage: `react-native-keychain@${dependencies['react-native-keychain'] || '<missing>'}`,
    legacyPackage: legacyPackageAbsent ? '<removed>' : `react-native-secure-key-store@${dependencies['react-native-secure-key-store']}`,
    currentPosture: 'Keychain-only after validated historical migration',
    keychainPrimaryWrite:
      service.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))') &&
      appStorage.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))'),
    fallbackReadsActive,
    legacyPackageAbsent,
    legacyAdapterAbsent,
    keychainOnlyTestsPresent,
    historicalMigrationProofGuarded,
    removalReleaseValidationClaimed: historicalMigrationProofGuarded,
    androidWarningSourceStillExpected: false,
    legacyPackageRemovalReady: errors.length === 0,
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
    `Removal release validation claimed: ${audit.removalReleaseValidationClaimed ? 'yes' : 'no'}`,
    `Android warning source still expected: ${audit.androidWarningSourceStillExpected ? 'yes' : 'no'}`,
    `Legacy package removal ready: ${audit.legacyPackageRemovalReady ? 'yes' : 'no'}`,
    `Errors: ${audit.errors.length}`,
    ...audit.errors.map(error => `- ${error}`),
    audit.legacyPackageRemovalReady
      ? 'Required action: none; keep the removed legacy backend from returning.'
      : 'Required action: restore the validated Keychain-only removal baseline.',
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
    console.log('Legacy secure-storage package removal is validated.');
  }
  console.log(`Secure-storage removal readiness summary written to ${path.relative(root, summaryPath)}`);
}
