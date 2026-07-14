import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSentryReleaseValidationHandoffSummaryErrors } from './sentryReleaseValidationHandoffSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'sentry-release-validation-handoff-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing Sentry release validation handoff summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getSentryReleaseValidationHandoffSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Sentry release validation handoff summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sentry release validation handoff summary artifact is valid.');
