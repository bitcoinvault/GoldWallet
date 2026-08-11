import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-migration-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const collectSecureStorageMigrationAudit = () => {
  const packageJson = JSON.parse(read('package.json'));
  const dependencies = packageJson.dependencies || {};
  const scripts = packageJson.scripts || {};
  const service = read('src/services/SecureStorageService.ts');
  const appStorage = read('class/app-storage.js');
  const authSagas = read('src/state/authentication/sagas.ts');
  const unlockTransaction = read('src/screens/UnlockTransaction.tsx');
  const factoryReset = read('src/helpers/factoryReset.ts');
  const errors = [];
  const focusedValidationCommand = scripts['test:storage-network:focused'] || '';
  const requiredFocusedCommands = [
    'yarn test:secure-storage:unit',
    'yarn test:storage',
    'yarn test:authenticator',
    'yarn test:wallet-core:offline',
  ];

  if (dependencies['react-native-keychain'] !== '10.0.0') errors.push('react-native-keychain must remain at 10.0.0');
  if (dependencies['react-native-secure-key-store']) errors.push('react-native-secure-key-store must be absent');
  if (existsSync(path.join(root, 'src/services/LegacySecureKeyStore.ts'))) errors.push('third-party legacy native adapter must be absent');

  for (const [label, source] of [
    ['SecureStorageService', service],
    ['AppStorage', appStorage],
  ]) {
    if (!source.includes("from 'react-native-keychain'")) errors.push(`${label} must use react-native-keychain`);
    if (!source.includes('LegacySecureStorageMigration')) errors.push(`${label} must use the first-party migration bridge`);
  }

  if (!service.includes('Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY')) {
    errors.push('SecureStorageService must keep device-only unlocked accessibility');
  }
  if (!appStorage.includes('Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY')) {
    errors.push('AppStorage must keep device-only unlocked accessibility');
  }
  for (const command of requiredFocusedCommands) {
    if (!focusedValidationCommand.includes(command)) errors.push(`focused validation is missing ${command}`);
  }

  return {
    currentPackage: `react-native-keychain@${dependencies['react-native-keychain'] || '<missing>'}`,
    legacyPackage: dependencies['react-native-secure-key-store'] ? `react-native-secure-key-store@${dependencies['react-native-secure-key-store']}` : '<removed>',
    serviceFile: 'src/services/SecureStorageService.ts',
    appStorageFile: 'class/app-storage.js',
    storesPin: authSagas.includes('CONST.pin') && factoryReset.includes('CONST.pin'),
    storesTransactionPassword:
      authSagas.includes('CONST.transactionPassword') &&
      unlockTransaction.includes('CONST.transactionPassword') &&
      service.includes('sha256(value).toString()'),
    keychainPrimaryWrite:
      service.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))') &&
      appStorage.includes('return Keychain.setGenericPassword(key, value, secureStorageOptions(key))'),
    legacyFallbackReadsActive:
      service.includes('LegacySecureStorageMigration.get') && appStorage.includes('LegacySecureStorageMigration.get'),
    legacyRuntimeRemoved:
      !dependencies['react-native-secure-key-store'] &&
      !existsSync(path.join(root, 'src/services/LegacySecureKeyStore.ts')),
    migrationBridgeActive:
      existsSync(path.join(root, 'src/services/LegacySecureStorageMigration.ts')) &&
      existsSync(path.join(root, 'android/app/src/main/java/io/goldwallet/LegacySecureStorageMigrationModule.java')) &&
      existsSync(path.join(root, 'ios/GoldWallet/GoldWalletLegacySecureStorage.m')),
    focusedValidation: 'test:storage-network:focused',
    focusedValidationCommand,
    errors,
    baselineStable: errors.length === 0,
  };
};

export const formatSecureStorageMigrationSummary = (audit, generatedAt = new Date().toISOString()) =>
  [
    'Secure-storage migration audit',
    `Generated at: ${generatedAt}`,
    `Current secure-storage package: ${audit.currentPackage}`,
    `Legacy secure-storage package: ${audit.legacyPackage}`,
    `SecureStorageService file: ${audit.serviceFile}`,
    `AppStorage secure-storage file: ${audit.appStorageFile}`,
    `Stores PIN: ${audit.storesPin ? 'yes' : 'no'}`,
    `Stores transaction password hash: ${audit.storesTransactionPassword ? 'yes' : 'no'}`,
    `Keychain primary write: ${audit.keychainPrimaryWrite ? 'yes' : 'no'}`,
    `Legacy secure-storage fallback reads active: ${audit.legacyFallbackReadsActive ? 'yes' : 'no'}`,
    `Legacy third-party runtime removed: ${audit.legacyRuntimeRemoved ? 'yes' : 'no'}`,
    `First-party migration bridge active: ${audit.migrationBridgeActive ? 'yes' : 'no'}`,
    `Focused validation script: ${audit.focusedValidation}`,
    `Focused validation command: ${audit.focusedValidationCommand}`,
    `Secure-storage migration baseline stable: ${audit.baselineStable ? 'yes' : 'no'}`,
    `Errors: ${audit.errors.length}`,
    ...audit.errors.map(error => `- ${error}`),
    audit.baselineStable
      ? 'Required action: keep the first-party migration bridge through a validated cross-platform rollout window.'
      : 'Required action: restore the Keychain-primary secure-storage migration window.',
    '',
  ].join('\n');

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSecureStorageMigrationAudit();
  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, formatSecureStorageMigrationSummary(audit));
  console.log(`Secure-storage migration audit\nCurrent package: ${audit.currentPackage}\nLegacy package: ${audit.legacyPackage}`);
  if (audit.errors.length > 0) {
    audit.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log('Keychain-primary secure-storage migration window is stable.');
  }
  console.log(`Secure-storage migration summary written to ${path.relative(root, summaryPath)}`);
}
