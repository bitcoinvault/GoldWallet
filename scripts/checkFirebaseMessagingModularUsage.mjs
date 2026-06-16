import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  expectedFirebaseMessagingModularUsage,
  getFirebaseMessagingModularUsageErrors,
} from './firebaseMessagingModularUsageGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sources = new Map(
  [...expectedFirebaseMessagingModularUsage.keys()].map(filePath => [
    filePath,
    readFileSync(path.join(root, filePath), 'utf8'),
  ]),
);
const errors = getFirebaseMessagingModularUsageErrors(sources);

if (errors.length > 0) {
  console.error('Firebase messaging modular usage check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Firebase messaging runtime usage uses modular API.');
