import path from 'path';
import { fileURLToPath } from 'url';
import {
  expectedAndroidStoreMetadataLocales,
  expectedStoreMetadataLocales,
  getStoreMetadataReadinessErrors,
} from './storeMetadataReadinessGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const errors = getStoreMetadataReadinessErrors({ root });

if (errors.length > 0) {
  console.error('Store metadata readiness guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Store metadata readiness is documented and guarded for ${expectedStoreMetadataLocales.length} iOS locales and ${expectedAndroidStoreMetadataLocales.length} Android locale.`,
);
