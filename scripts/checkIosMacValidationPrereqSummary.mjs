import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getIosMacValidationPrereqSummaryErrors } from './iosMacValidationPrereqSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'ios-mac-validation-prereqs-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing iOS macOS validation prerequisites summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getIosMacValidationPrereqSummaryErrors(summary);

if (errors.length > 0) {
  console.error('iOS macOS validation prerequisites summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('iOS macOS validation prerequisites summary artifact is valid.');
