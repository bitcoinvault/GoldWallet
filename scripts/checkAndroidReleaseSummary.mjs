import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-release-dev-summary.txt');
const defaultVariants = ['dev', 'stage', 'prod'];
const allowedVariants = new Set(['dev', 'stage', 'prod', 'beta']);
const expectedVariants = (process.env.ANDROID_RELEASE_VARIANTS || defaultVariants.join(','))
  .split(',')
  .map(variant => variant.trim().toLowerCase())
  .filter(Boolean);
const invalidVariants = expectedVariants.filter(variant => !allowedVariants.has(variant));

if (invalidVariants.length > 0) {
  console.error(`Unsupported Android release variant(s): ${invalidVariants.join(', ')}`);
  process.exit(1);
}

if (!existsSync(summaryPath)) {
  console.error(`Missing Android dev release summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getAndroidReleaseSummaryErrors(summary, root, { expectedVariants });

if (errors.length > 0) {
  console.error('Android dev release summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android release summary artifact is valid.');
