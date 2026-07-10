import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getTypescript7CompatibilityProbeSummaryErrors } from './typescript7CompatibilityProbeSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'typescript7-compatibility-probe-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing TypeScript 7 compatibility probe summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getTypescript7CompatibilityProbeSummaryErrors(summary);

if (errors.length > 0) {
  console.error('TypeScript 7 compatibility probe summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('TypeScript 7 compatibility probe summary artifact is valid.');
