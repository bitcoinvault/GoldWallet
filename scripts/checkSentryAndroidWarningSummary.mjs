import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'sentry-android-warning-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing Sentry Android warning summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getSentryAndroidWarningSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Sentry Android warning summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sentry Android warning summary artifact is valid.');
