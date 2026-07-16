import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidUploadSigningSummaryErrors,
  resolveAndroidUploadSigningConfiguration,
} from './androidUploadSigningReadiness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'local-docs', 'android-upload-signing-readiness-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Android upload signing readiness summary is missing: ${summaryPath}`);
  process.exit(1);
}

const resolved = resolveAndroidUploadSigningConfiguration({ root });
const errors = getAndroidUploadSigningSummaryErrors(readFileSync(summaryPath, 'utf8'), resolved);
if (errors.length > 0) {
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android upload signing readiness summary is valid.');
