import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getStorageNetworkValidationScriptErrors,
  requiredStorageNetworkValidationScripts,
} from './storageNetworkValidationScriptsGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const errors = getStorageNetworkValidationScriptErrors(packageJson.scripts);

if (errors.length > 0) {
  console.error('Storage/network validation script guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Storage/network validation scripts are guarded for ${requiredStorageNetworkValidationScripts.size} focused tests.`);
