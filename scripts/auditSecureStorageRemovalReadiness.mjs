import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-removal-readiness-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));

export const collectSecureStorageRemovalReadinessAudit = () => {
  const packageJson = JSON.parse(read('package.json'));
  const dependencies = packageJson.dependencies || {};
  const secureStorageService = read('src/services/SecureStorageService.ts');
  const appStorage = read('class/app-storage.js');
  const unitTest = read('tests/unit/SecureStorageService.test.js');
  const storageTest = read('tests/integration/Storage.test.js');
  const warningFollowups = read('docs/android-warning-baseline-followups.md');
  const migrationPlan = read('docs/secure-storage-migration-plan.md');
  const warnings = [];
  const errors = [];

  const currentPackage = `react-native-keychain@${dependencies['react-native-keychain'] || '<missing>'}`;
  const legacyPackage = `react-native-secure-key-store@${dependencies['react-native-secure-key-store'] || '<missing>'}`;
  const keychainPrimaryWrite =
    secureStorageService.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))') &&
    appStorage.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))');
  const legacyFallbackReadsActive =
    secureStorageService.includes('RNSecureKeyStore.get') &&
    appStorage.includes('RNSecureKeyStore.get');
  const legacyWritePathDisabled =
    !secureStorageService.includes('RNSecureKeyStore.set') &&
    !appStorage.includes('RNSecureKeyStore.set');
  const legacyCleanupAfterSuccessfulMigration =
    secureStorageService.includes('await RNSecureKeyStore.remove(key)') &&
    appStorage.includes('RNSecureKeyStore.remove(key)');
  const legacyFallbackInstrumentation =
    secureStorageService.includes('secure-storage-migration') &&
    secureStorageService.includes('Legacy secure-storage value found; migrating to Keychain.') &&
    secureStorageService.includes('Legacy secure-storage migration to Keychain failed; returning legacy value.') &&
    appStorage.includes('secure-storage-migration') &&
    appStorage.includes('Legacy secure-storage wallet value found; migrating to Keychain.') &&
    appStorage.includes('Legacy secure-storage wallet migration to Keychain failed; returning legacy value.');
  const serviceFallbackMigrationTestsPresent =
    unitTest.includes('returns keychain credentials without touching the legacy secure store') &&
    unitTest.includes('normalizes a null legacy fallback result to an empty secured value') &&
    unitTest.includes('normalizes an undefined legacy fallback result to an empty secured value') &&
    unitTest.includes('falls back to the legacy secure store and migrates the value into keychain') &&
    unitTest.includes('keeps returning the legacy value when keychain migration write fails') &&
    unitTest.includes('rejects transaction passwords that do not match the stored hash');
  const serviceKeychainFailureEmptyFallbackTestsPresent =
    unitTest.includes('normalizes a null legacy fallback result after keychain read failure to an empty secured value') &&
    unitTest.includes('normalizes an undefined legacy fallback result after keychain read failure to an empty secured value');
  const serviceFallbackFreeKeychainTestsPresent =
    unitTest.includes('validates fallback-free migrated PIN reads from keychain') &&
    unitTest.includes('validates fallback-free transaction-password checks from keychain hash');
  const serviceSecretSafeFallbackInstrumentationTestsPresent =
    unitTest.includes('keeps secure-storage migration logs free of stored keys and values');
  const appStorageFallbackMigrationTestsPresent =
    storageTest.includes('normalizes a null legacy fallback result to missing storage') &&
    storageTest.includes('normalizes an undefined legacy fallback result to missing storage') &&
    storageTest.includes('migrates legacy value into keychain when keychain is empty') &&
    storageTest.includes('falls back to legacy value when keychain read fails') &&
    storageTest.includes('keeps legacy value when keychain migration write fails');
  const appStorageKeychainFailureEmptyFallbackTestsPresent =
    storageTest.includes('normalizes a null legacy fallback result after keychain read failure to missing storage') &&
    storageTest.includes('normalizes an undefined legacy fallback result after keychain read failure to missing storage');
  const appStorageFallbackFreeKeychainTestsPresent =
    storageTest.includes('validates fallback-free encrypted wallet data from keychain');
  const appStorageSecretSafeFallbackInstrumentationTestsPresent =
    storageTest.includes('keeps migration logs free of storage keys and values');
  const fallbackMigrationTestsPresent =
    serviceFallbackMigrationTestsPresent &&
    serviceKeychainFailureEmptyFallbackTestsPresent &&
    serviceFallbackFreeKeychainTestsPresent &&
    serviceSecretSafeFallbackInstrumentationTestsPresent &&
    appStorageFallbackMigrationTestsPresent &&
    appStorageKeychainFailureEmptyFallbackTestsPresent &&
    appStorageFallbackFreeKeychainTestsPresent &&
    appStorageSecretSafeFallbackInstrumentationTestsPresent;
  const androidWarningSourceStillExpected =
    warningFollowups.includes('react-native-secure-key-store') &&
    warningFollowups.includes('dedicated secure-storage removal after legacy fallback migration validation');
  const migrationPlanBlocksRemoval =
    migrationPlan.includes('Do not remove `react-native-secure-key-store` as warning-only cleanup') &&
    migrationPlan.includes('Existing installs may still have PIN, transaction password, and encrypted wallet buckets');

  if (currentPackage !== 'react-native-keychain@10.0.0') {
    errors.push(`current secure-storage package is ${currentPackage}; expected react-native-keychain@10.0.0`);
  }

  if (legacyPackage !== 'react-native-secure-key-store@2.0.10') {
    errors.push(`legacy secure-storage package is ${legacyPackage}; expected react-native-secure-key-store@2.0.10`);
  }

  if (!keychainPrimaryWrite) {
    errors.push('new secure-storage writes must remain Keychain-primary');
  }

  if (!legacyFallbackReadsActive) {
    errors.push('legacy fallback reads must remain active until release validation proves removal');
  }

  if (!legacyWritePathDisabled) {
    errors.push('legacy write path must stay disabled for new values');
  }

  if (!fallbackMigrationTestsPresent) {
    errors.push('focused fallback migration tests are missing');
  }

  if (!legacyFallbackInstrumentation) {
    errors.push('legacy fallback instrumentation must stay active before package removal can be evaluated');
  }

  if (!androidWarningSourceStillExpected) {
    warnings.push('android warning follow-up plan no longer lists secure-key-store as the expected remaining source');
  }

  if (!migrationPlanBlocksRemoval) {
    errors.push('secure-storage migration plan must block warning-only removal');
  }

  return {
    currentPackage,
    legacyPackage,
    currentPosture: 'staged migration with legacy fallback',
    keychainPrimaryWrite,
    legacyFallbackReadsActive,
    legacyWritePathDisabled,
    legacyCleanupAfterSuccessfulMigration,
    legacyFallbackInstrumentation,
    serviceFallbackMigrationTestsPresent,
    serviceKeychainFailureEmptyFallbackTestsPresent,
    serviceFallbackFreeKeychainTestsPresent,
    serviceSecretSafeFallbackInstrumentationTestsPresent,
    appStorageFallbackMigrationTestsPresent,
    appStorageKeychainFailureEmptyFallbackTestsPresent,
    appStorageFallbackFreeKeychainTestsPresent,
    appStorageSecretSafeFallbackInstrumentationTestsPresent,
    fallbackMigrationTestsPresent,
    removalReleaseValidationClaimed: false,
    androidWarningSourceStillExpected,
    legacyPackageRemovalReady: false,
    requiredReleaseValidation: 'migrated PIN, transaction-password, and encrypted wallet data without the fallback backend',
    removalBlocker: 'release validation is not claimed while legacy fallback reads remain active',
    warnings,
    errors,
  };
};

export const formatSecureStorageRemovalReadinessSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Secure-storage removal readiness audit',
    `Generated at: ${generatedAt}`,
    `Current secure-storage package: ${audit.currentPackage}`,
    `Legacy secure-storage package: ${audit.legacyPackage}`,
    `Current posture: ${audit.currentPosture}`,
    `Keychain primary write: ${audit.keychainPrimaryWrite ? 'yes' : 'no'}`,
    `Legacy fallback reads active: ${audit.legacyFallbackReadsActive ? 'yes' : 'no'}`,
    `Legacy write path disabled: ${audit.legacyWritePathDisabled ? 'yes' : 'no'}`,
    `Legacy cleanup after successful migration: ${audit.legacyCleanupAfterSuccessfulMigration ? 'yes' : 'no'}`,
    `Legacy fallback instrumentation active: ${audit.legacyFallbackInstrumentation ? 'yes' : 'no'}`,
    `SecureStorageService fallback migration tests present: ${audit.serviceFallbackMigrationTestsPresent ? 'yes' : 'no'}`,
    `SecureStorageService keychain-failure empty fallback tests present: ${audit.serviceKeychainFailureEmptyFallbackTestsPresent ? 'yes' : 'no'}`,
    `SecureStorageService fallback-free keychain tests present: ${audit.serviceFallbackFreeKeychainTestsPresent ? 'yes' : 'no'}`,
    `SecureStorageService secret-safe fallback instrumentation tests present: ${audit.serviceSecretSafeFallbackInstrumentationTestsPresent ? 'yes' : 'no'}`,
    `AppStorage fallback migration tests present: ${audit.appStorageFallbackMigrationTestsPresent ? 'yes' : 'no'}`,
    `AppStorage keychain-failure empty fallback tests present: ${audit.appStorageKeychainFailureEmptyFallbackTestsPresent ? 'yes' : 'no'}`,
    `AppStorage fallback-free encrypted wallet tests present: ${audit.appStorageFallbackFreeKeychainTestsPresent ? 'yes' : 'no'}`,
    `AppStorage secret-safe fallback instrumentation tests present: ${audit.appStorageSecretSafeFallbackInstrumentationTestsPresent ? 'yes' : 'no'}`,
    `Fallback migration tests present: ${audit.fallbackMigrationTestsPresent ? 'yes' : 'no'}`,
    `Removal release validation claimed: ${audit.removalReleaseValidationClaimed ? 'yes' : 'no'}`,
    `Android warning source still expected: ${audit.androidWarningSourceStillExpected ? 'yes' : 'no'}`,
    `Legacy package removal ready: ${audit.legacyPackageRemovalReady ? 'yes' : 'no'}`,
    `Required release validation: ${audit.requiredReleaseValidation}`,
    `Removal blocker: ${audit.removalBlocker}`,
    `Warnings: ${audit.warnings.length}`,
    ...audit.warnings.map(warning => `- ${warning}`),
    `Errors: ${audit.errors.length}`,
    ...audit.errors.map(error => `- ${error}`),
    'Secret values printed: no',
    'Required action: keep react-native-secure-key-store installed until release validation is claimed for migrated secure values.',
  ];

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Secure-storage removal readiness audit');
  console.log(`Current package: ${audit.currentPackage}`);
  console.log(`Legacy package: ${audit.legacyPackage}`);
  console.log(`Current posture: ${audit.currentPosture}`);
  console.log(`Legacy package removal ready: ${audit.legacyPackageRemovalReady ? 'yes' : 'no'}`);
  console.log(`Removal blocker: ${audit.removalBlocker}`);

  if (audit.errors.length > 0) {
    console.log('Secure-storage removal readiness needs review:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSecureStorageRemovalReadinessAudit();
  const summary = formatSecureStorageRemovalReadinessSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Secure-storage removal readiness summary written to ${path.relative(root, summaryPath)}`);
}
