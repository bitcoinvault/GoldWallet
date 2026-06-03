import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSecureStorageRemovalReadinessSummaryErrors } from './secureStorageRemovalReadinessSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-removal-readiness-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing secure-storage removal readiness summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getSecureStorageRemovalReadinessSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Secure-storage removal readiness summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Secure-storage removal readiness summary artifact is valid.');
