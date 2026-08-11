import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const errors = [];

if (packageJson.dependencies?.['react-native-keychain'] !== '10.0.0') {
  errors.push('react-native-keychain must remain the authoritative secure-storage backend at 10.0.0');
}

if (packageJson.dependencies?.['react-native-secure-key-store']) {
  errors.push('react-native-secure-key-store must be removed from dependencies');
}

if (existsSync(path.join(root, 'src/services/LegacySecureKeyStore.ts'))) {
  errors.push('src/services/LegacySecureKeyStore.ts must be removed');
}

const forbiddenReferences = [
  ['src/services/SecureStorageService.ts', ['LegacySecureKeyStore', 'RNSecureKeyStore']],
  ['class/app-storage.js', ['LegacySecureKeyStore', 'RNSecureKeyStore']],
  ['react-native.config.js', ['GOLDWALLET_DISABLE_LEGACY_SECURE_STORAGE', 'react-native-secure-key-store']],
];

for (const [relativePath, markers] of forbiddenReferences) {
  const source = read(relativePath);

  for (const marker of markers) {
    if (source.includes(marker)) errors.push(`${relativePath} must not reference ${marker}`);
  }
}

const requiredMigrationBridgeMarkers = [
  [
    'src/services/LegacySecureStorageMigration.ts',
    ['GoldWalletLegacySecureStorage', 'get(key: string)', 'remove(key: string)', 'LEGACY_SECURE_STORAGE_DELETION_MARKER'],
  ],
  [
    'src/services/SecureStorageService.ts',
    ['LegacySecureStorageMigration.get', 'LegacySecureStorageMigration.remove', 'legacy fallback was skipped', 'LEGACY_SECURE_STORAGE_DELETION_MARKER'],
  ],
  [
    'class/app-storage.js',
    ['LegacySecureStorageMigration.get', 'LegacySecureStorageMigration.remove', 'legacy fallback was skipped', 'LEGACY_SECURE_STORAGE_DELETION_MARKER'],
  ],
  [
    'android/app/src/main/java/io/goldwallet/LegacySecureStorageMigrationModule.java',
    ['secret_shared_prefs', 'MasterKey.DEFAULT_MASTER_KEY_ALIAS', 'GoldWalletLegacySecureStorage'],
  ],
  [
    'ios/GoldWallet/GoldWalletLegacySecureStorage.m',
    ['RNSecureKeyStoreKeyChain', 'kSecAttrGeneric', 'kSecAttrAccount', 'kSecAttrService'],
  ],
];

for (const [relativePath, markers] of requiredMigrationBridgeMarkers) {
  if (!existsSync(path.join(root, relativePath))) {
    errors.push(`${relativePath} must exist`);
    continue;
  }

  const source = read(relativePath);
  for (const marker of markers) {
    if (!source.includes(marker)) errors.push(`${relativePath} must contain ${marker}`);
  }
}

const nativeIntegrationMarkers = [
  [
    'android/app/src/main/java/io/goldwallet/wallet/MainApplication.java',
    ['import io.goldwallet.LegacySecureStorageMigrationPackage;', 'packages.add(new LegacySecureStorageMigrationPackage());'],
  ],
  ['android/app/build.gradle', ['androidx.security:security-crypto:1.1.0']],
  [
    'android/app/src/main/java/io/goldwallet/LegacySecureStorageMigrationModule.java',
    [
      'EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV',
      'EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM',
      'if (!removed)',
    ],
  ],
];

for (const [relativePath, markers] of nativeIntegrationMarkers) {
  const source = read(relativePath);
  for (const marker of markers) {
    if (!source.includes(marker)) errors.push(`${relativePath} must contain ${marker}`);
  }
}

const factoryReset = read('src/helpers/factoryReset.ts');
if (!factoryReset.includes('return Promise.all([')) {
  errors.push('factory reset must await both secure-storage deletion promises');
}

const xcodeProject = read('ios/GoldWallet.xcodeproj/project.pbxproj');
const iosBridgeSourceMemberships = xcodeProject.match(/GoldWalletLegacySecureStorage\.m in Sources/g) || [];
const iosBridgeFileReferences = xcodeProject.match(/GoldWalletLegacySecureStorage\.m \*\//g) || [];

if (iosBridgeSourceMemberships.length !== 8) {
  errors.push(`iOS migration bridge must have four build-file declarations and four target source memberships; found ${iosBridgeSourceMemberships.length} source markers`);
}

if (iosBridgeFileReferences.length !== 6) {
  errors.push(`iOS migration bridge must have four build-file references, one file declaration, and one group entry; found ${iosBridgeFileReferences.length} markers`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Third-party legacy secure-storage package is removed and the first-party migration bridge is present.');
