import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBlResolutionSummaryErrors } from './blResolutionSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'bl-resolution-readiness-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing BL resolution readiness summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getBlResolutionSummaryErrors(summary);

if (errors.length > 0) {
  console.error('BL resolution readiness summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('BL resolution readiness summary artifact is valid.');
