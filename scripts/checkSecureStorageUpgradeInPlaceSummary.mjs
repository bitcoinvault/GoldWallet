import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getSecureStorageUpgradeInPlaceSummaryErrors } from './secureStorageUpgradeInPlaceSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-upgrade-in-place-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing secure-storage upgrade-in-place summary artifact: ${summaryPath}`);
  process.exit(1);
}

const errors = getSecureStorageUpgradeInPlaceSummaryErrors(readFileSync(summaryPath, 'utf8'));

if (errors.length > 0) {
  console.error('Secure-storage upgrade-in-place summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Secure-storage upgrade-in-place summary artifact is valid.');
