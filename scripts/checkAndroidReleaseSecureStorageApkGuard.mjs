import assert from 'assert';
import { readFileSync } from 'fs';

import { getAndroidReleaseSecureStorageDumpErrors } from './androidReleaseSecureStorageApkGuard.mjs';

const keychainDump = [
  'P d 428 468 41454 com.oblador.keychain',
  'C d 43 44 5002 com.oblador.keychain.KeychainModule',
].join('\n');
const legacyDump = [
  keychainDump,
  'P d 12 12 1625 com.reactlibrary.securekeystore',
  'C d 3 3 216 com.reactlibrary.securekeystore.RNSecureKeyStorePackage',
].join('\n');

assert.deepStrictEqual(
  getAndroidReleaseSecureStorageDumpErrors({ dev: keychainDump, stage: keychainDump, prod: keychainDump, beta: keychainDump }),
  [],
);
assert.ok(
  getAndroidReleaseSecureStorageDumpErrors({ dev: legacyDump }).some(error => error.includes('legacy secure-storage package')),
);
assert.ok(
  getAndroidReleaseSecureStorageDumpErrors({ prod: 'P d 1 1 1 io.goldwallet.wallet' }).some(error =>
    error.includes('react-native-keychain'),
  ),
);

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(
  packageJson.scripts['check:android-release-secure-storage-apk-guard'],
  'node scripts/checkAndroidReleaseSecureStorageApkGuard.mjs',
);
assert.equal(
  packageJson.scripts['android:dev:release:check-secure-storage-apks'],
  'node scripts/checkAndroidReleaseSecureStorageApks.mjs',
);
assert.match(
  packageJson.scripts['android:dev:release:verify-local'],
  /android:dev:release:check-secure-storage-apks/,
);

console.log('Android release secure-storage APK guard checks are valid.');
