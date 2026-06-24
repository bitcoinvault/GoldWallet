import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getReactPatchBlockerSummaryErrors } from './reactPatchBlockerSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'react-patch-blocker-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing React patch blocker summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getReactPatchBlockerSummaryErrors(summary);

if (errors.length > 0) {
  console.error('React patch blocker summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('React patch blocker summary artifact is valid.');
