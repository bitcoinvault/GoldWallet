import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  expectedNativeModuleDependencies,
  formatNativeModuleInventoryErrors,
  getNativeModuleInventoryErrors,
} from './nativeModuleInventoryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const errors = getNativeModuleInventoryErrors(packageJson.dependencies);

if (errors.length > 0) {
  console.error(formatNativeModuleInventoryErrors(errors));
  process.exit(1);
}

console.log(`Native module inventory is stable (${expectedNativeModuleDependencies.size} dependencies).`);
