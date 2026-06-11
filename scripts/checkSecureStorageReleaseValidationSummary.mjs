import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSecureStorageReleaseValidationSummaryErrors } from './secureStorageReleaseValidationSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-release-validation-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing secure-storage release validation summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getSecureStorageReleaseValidationSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Secure-storage release validation summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Secure-storage release validation summary artifact is valid.');
