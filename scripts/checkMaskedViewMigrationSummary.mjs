import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMaskedViewMigrationSummaryErrors } from './maskedViewMigrationSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'masked-view-migration-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing masked-view migration summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getMaskedViewMigrationSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Masked-view migration summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Masked-view migration summary artifact is valid.');
