import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSentryRnBundleTaskCompatibilitySummaryErrors } from './sentryRnBundleTaskCompatibilitySummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'sentry-rn-bundle-task-compatibility-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing Sentry RN bundle task compatibility summary artifact: ${summaryPath}`);
  process.exit(1);
}

const errors = getSentryRnBundleTaskCompatibilitySummaryErrors(readFileSync(summaryPath, 'utf8'));

if (errors.length > 0) {
  console.error('Sentry RN bundle task compatibility summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sentry RN bundle task compatibility summary artifact is valid.');
