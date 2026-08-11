import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

export const migrationInputPaths = [
  'package.json',
  'yarn.lock',
  'android/build.gradle',
  'android/app/build.gradle',
  'android/app/src/main/java/io/goldwallet/wallet/MainApplication.java',
  'android/app/src/main/java/io/goldwallet/LegacySecureStorageMigrationModule.java',
  'android/app/src/main/java/io/goldwallet/LegacySecureStorageMigrationPackage.java',
  'src/services/LegacySecureStorageMigration.ts',
  'src/services/SecureStorageService.ts',
  'src/helpers/factoryReset.ts',
  'class/app-storage.js',
  'validation/legacySecureStorageMigrationProbeEntry.js',
];

export const sha256File = filePath =>
  existsSync(filePath) ? createHash('sha256').update(readFileSync(filePath)).digest('hex') : '<missing>';

export const sha256MigrationInputs = root => {
  const hash = createHash('sha256');

  for (const relativePath of migrationInputPaths) {
    const filePath = path.join(root, relativePath);

    if (!existsSync(filePath)) {
      return '<missing>';
    }

    hash.update(relativePath.replace(/\\/g, '/'));
    hash.update('\0');
    hash.update(readFileSync(filePath));
    hash.update('\0');
  }

  return hash.digest('hex');
};
