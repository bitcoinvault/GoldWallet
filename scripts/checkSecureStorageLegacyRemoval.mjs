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

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Legacy secure-storage runtime and package are removed.');
