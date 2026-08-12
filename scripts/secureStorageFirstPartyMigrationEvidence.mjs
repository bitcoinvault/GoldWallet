import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
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

const isFile = filePath => Boolean(filePath && existsSync(filePath) && statSync(filePath).isFile());

export const sha256File = filePath =>
  isFile(filePath) ? createHash('sha256').update(readFileSync(filePath)).digest('hex') : '<missing>';

export const getFileEvidence = filePath => ({
  present: isFile(filePath),
  bytes: isFile(filePath) ? statSync(filePath).size : 0,
  sha256: sha256File(filePath),
});

export const sha256MigrationInputs = root => {
  const hash = createHash('sha256');

  for (const relativePath of migrationInputPaths) {
    const filePath = path.join(root, relativePath);

    if (!existsSync(filePath)) {
      return '<missing>';
    }

    hash.update(relativePath.replace(/\\/g, '/'));
    hash.update('\0');
    const canonicalText = readFileSync(filePath, 'utf8').replace(/\r\n?/g, '\n');
    hash.update(canonicalText, 'utf8');
    hash.update('\0');
  }

  return hash.digest('hex');
};
