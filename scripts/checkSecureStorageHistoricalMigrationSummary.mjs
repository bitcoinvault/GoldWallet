import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getSecureStorageHistoricalMigrationSummaryErrors } from './secureStorageHistoricalMigrationSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-historical-migration-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing historical secure-storage migration summary artifact: ${summaryPath}`);
  process.exit(1);
}

const errors = getSecureStorageHistoricalMigrationSummaryErrors(readFileSync(summaryPath, 'utf8'));

if (errors.length > 0) {
  console.error('Historical secure-storage migration summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Historical secure-storage migration summary artifact is valid.');
