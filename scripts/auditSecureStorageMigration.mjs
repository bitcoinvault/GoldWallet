import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-migration-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};
const scripts = packageJson.scripts || {};
const requiredFocusedValidationCommands = [
  'yarn test:secure-storage:unit',
  'yarn test:storage',
  'yarn test:authenticator',
  'yarn test:wallet-core:offline',
];

const requireFile = (errors, relativePath) => {
  if (!exists(relativePath)) {
    errors.push(`${relativePath} is missing`);
    return '';
  }

  return read(relativePath);
};

const requireSnippet = (errors, label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

export const collectSecureStorageMigrationAudit = () => {
  const errors = [];
  const warnings = [];
  const currentVersion = dependencies['react-native-keychain'];
  const legacyVersion = dependencies['react-native-secure-key-store'];
  const secureStorageService = requireFile(errors, 'src/services/SecureStorageService.ts');
  const legacySecureKeyStore = requireFile(errors, 'src/services/LegacySecureKeyStore.ts');
  const appStorage = requireFile(errors, 'class/app-storage.js');
  const authSagas = requireFile(errors, 'src/state/authentication/sagas.ts');
  const unlockTransaction = requireFile(errors, 'src/screens/UnlockTransaction.tsx');
  const factoryReset = requireFile(errors, 'src/helpers/factoryReset.ts');
  const warningBaseline = requireFile(errors, 'local-docs/android-warning-audit-summary.txt');
  const storageAudit = requireFile(errors, 'docs/storage-network-native-compatibility-audit.md');
  const followupPlan = requireFile(errors, 'docs/android-warning-baseline-followups.md');

  if (currentVersion !== '10.0.0') {
    errors.push(`package.json has react-native-keychain@${currentVersion || '<missing>'}; expected 10.0.0`);
  }

  if (legacyVersion !== '2.0.10') {
    errors.push(`package.json has react-native-secure-key-store@${legacyVersion || '<missing>'}; expected 2.0.10 for staged fallback`);
  }

  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, "from 'react-native-keychain'");
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, "from './LegacySecureKeyStore'");
  requireSnippet(errors, 'LegacySecureKeyStore.ts', legacySecureKeyStore, "from 'react-native'");
  requireSnippet(errors, 'LegacySecureKeyStore.ts', legacySecureKeyStore, 'nativeModules.RNSecureKeyStore');
  requireSnippet(errors, 'LegacySecureKeyStore.ts', legacySecureKeyStore, 'Legacy secure-storage native module is unavailable');
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY');
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'setGenericPassword');
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'getGenericPassword');
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'resetGenericPassword');
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'RNSecureKeyStore.get');
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'secure-storage-migration');
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'Legacy secure-storage value found; migrating to Keychain.');
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'sha256(value).toString()');
  requireSnippet(errors, 'class/app-storage.js', appStorage, "from 'react-native-keychain'");
  requireSnippet(errors, 'class/app-storage.js', appStorage, "from '../src/services/LegacySecureKeyStore'");
  requireSnippet(errors, 'class/app-storage.js', appStorage, 'Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY');
  requireSnippet(errors, 'class/app-storage.js', appStorage, 'setGenericPassword');
  requireSnippet(errors, 'class/app-storage.js', appStorage, 'getGenericPassword');
  requireSnippet(errors, 'class/app-storage.js', appStorage, 'RNSecureKeyStore.get');
  requireSnippet(errors, 'class/app-storage.js', appStorage, 'secure-storage-migration');
  requireSnippet(errors, 'class/app-storage.js', appStorage, 'Legacy secure-storage wallet value found; migrating to Keychain.');
  requireSnippet(errors, 'authentication sagas', authSagas, 'CONST.pin');
  requireSnippet(errors, 'authentication sagas', authSagas, 'CONST.transactionPassword');
  requireSnippet(errors, 'UnlockTransaction.tsx', unlockTransaction, 'checkSecuredPassword(CONST.transactionPassword');
  requireSnippet(errors, 'factoryReset.ts', factoryReset, 'removeSecuredPassword(CONST.pin)');
  requireSnippet(errors, 'factoryReset.ts', factoryReset, 'removeSecuredPassword(CONST.transactionPassword)');
  requireSnippet(errors, 'docs/storage-network-native-compatibility-audit.md', storageAudit, 'react-native-keychain latest: 10.0.0');
  requireSnippet(errors, 'docs/storage-network-native-compatibility-audit.md', storageAudit, 'react-native-secure-key-store latest: 2.0.10');
  requireSnippet(errors, 'docs/android-warning-baseline-followups.md', followupPlan, 'dedicated secure-storage removal after legacy fallback migration validation');

  const focusedValidationCommand = scripts['test:storage-network:focused'] || '';
  const missingFocusedValidationCommands = requiredFocusedValidationCommands.filter(
    command => !focusedValidationCommand.includes(command),
  );

  if (missingFocusedValidationCommands.length > 0) {
    errors.push(
      `test:storage-network:focused must keep secure-storage, storage, authenticator, and wallet-core offline checks grouped; missing ${missingFocusedValidationCommands.join(', ')}`,
    );
  }

  if (!warningBaseline.includes('react-native-secure-key-store')) {
    warnings.push('local Android warning audit summary does not mention react-native-secure-key-store; legacy backend removal may already have happened.');
  }

  const legacyWritesDisabled =
    !secureStorageService.includes('RNSecureKeyStore.set') && !appStorage.includes('RNSecureKeyStore.set');
  const legacyFallbackReadsActive =
    secureStorageService.includes('RNSecureKeyStore.get') && appStorage.includes('RNSecureKeyStore.get');
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
  const keychainPrimaryWrite =
    secureStorageService.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))') &&
    appStorage.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))');

  if (!legacyWritesDisabled) {
    errors.push('new secure-storage writes must not call RNSecureKeyStore.set');
  }

  return {
    currentPackage: `react-native-keychain@${currentVersion || '<missing>'}`,
    legacyPackage: `react-native-secure-key-store@${legacyVersion || '<missing>'}`,
    serviceFile: 'src/services/SecureStorageService.ts',
    appStorageFile: 'class/app-storage.js',
    storesPin: authSagas.includes('CONST.pin') && factoryReset.includes('CONST.pin'),
    storesTransactionPassword:
      authSagas.includes('CONST.transactionPassword') &&
      unlockTransaction.includes('CONST.transactionPassword') &&
      secureStorageService.includes('sha256(value).toString()'),
    focusedValidation: 'test:storage-network:focused',
    focusedValidationCommand: scripts['test:storage-network:focused'] || '<missing>',
    keychainPrimaryWrite,
    legacyWritesDisabled,
    legacyFallbackReadsActive,
    legacyCleanupAfterSuccessfulMigration,
    legacyFallbackInstrumentation,
    warningBaselineMentionsSecureStorage: warningBaseline.includes('react-native-secure-key-store'),
    legacyRemovalReady: false,
    legacyRemovalBlocker:
      'legacy fallback reads are still active; remove react-native-secure-key-store only after a release validates migrated PIN, transaction-password, and encrypted wallet data without the fallback backend',
    errors,
    warnings,
    baselineStable: errors.length === 0,
  };
};

export const formatSecureStorageMigrationSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Secure-storage migration audit',
    `Generated at: ${generatedAt}`,
    `Current secure-storage package: ${audit.currentPackage}`,
    `Legacy secure-storage package: ${audit.legacyPackage}`,
    `SecureStorageService file: ${audit.serviceFile}`,
    `AppStorage secure-storage file: ${audit.appStorageFile}`,
    `Stores PIN: ${audit.storesPin ? 'yes' : 'no'}`,
    `Stores transaction password hash: ${audit.storesTransactionPassword ? 'yes' : 'no'}`,
    `Keychain primary write: ${audit.keychainPrimaryWrite ? 'yes' : 'no'}`,
    `Legacy secure-storage writes disabled: ${audit.legacyWritesDisabled ? 'yes' : 'no'}`,
    `Legacy secure-storage fallback reads active: ${audit.legacyFallbackReadsActive ? 'yes' : 'no'}`,
    `Legacy secure-storage cleanup after successful migration: ${audit.legacyCleanupAfterSuccessfulMigration ? 'yes' : 'no'}`,
    `Legacy fallback instrumentation active: ${audit.legacyFallbackInstrumentation ? 'yes' : 'no'}`,
    `Focused validation script: ${audit.focusedValidation}`,
    `Focused validation command: ${audit.focusedValidationCommand}`,
    `Warning baseline mentions secure-key-store: ${audit.warningBaselineMentionsSecureStorage ? 'yes' : 'no'}`,
    `Legacy secure-storage removal ready: ${audit.legacyRemovalReady ? 'yes' : 'no'}`,
    `Legacy secure-storage removal blocker: ${audit.legacyRemovalBlocker}`,
    `Secure-storage migration baseline stable: ${audit.baselineStable ? 'yes' : 'no'}`,
    `Warnings: ${audit.warnings.length}`,
  ];

  audit.warnings.forEach(warning => lines.push(`- ${warning}`));
  lines.push(`Errors: ${audit.errors.length}`);
  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push(
    audit.baselineStable
      ? 'Required action: none; secure-storage migration baseline is stable for a dedicated storage validation branch.'
      : 'Required action: restore secure-storage migration baseline before replacing the dependency.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Secure-storage migration audit');
  console.log(`Current package: ${audit.currentPackage}`);
  console.log(`Legacy package: ${audit.legacyPackage}`);
  console.log(`Focused validation: ${audit.focusedValidation}`);

  if (audit.warnings.length > 0) {
    console.log('Warnings:');
    audit.warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (audit.errors.length > 0) {
    console.log('Secure-storage migration baseline needs review:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('Secure-storage migration baseline is stable for a dedicated storage validation branch.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSecureStorageMigrationAudit();
  const summary = formatSecureStorageMigrationSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Secure-storage migration summary written to ${path.relative(root, summaryPath)}`);
}
