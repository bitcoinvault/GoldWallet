import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPlistMajorCompatibilitySummaryErrors } from './plistMajorCompatibilitySummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'plist-major-compatibility-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing plist major compatibility summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getPlistMajorCompatibilitySummaryErrors(summary);

if (errors.length > 0) {
  console.error('Plist major compatibility summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Plist major compatibility summary artifact is valid.');
