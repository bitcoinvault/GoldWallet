import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-release-dev-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing Android dev release summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getAndroidReleaseSummaryErrors(summary, root);

if (errors.length > 0) {
  console.error('Android dev release summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android release summary artifact is valid.');
