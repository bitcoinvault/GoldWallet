import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'ios-release-static-readiness-summary.txt');
const summary = readFileSync(summaryPath, 'utf8');
const errors = getIosReleaseReadinessSummaryErrors(summary);

if (errors.length > 0) {
  console.error('iOS release readiness summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('iOS release readiness summary artifact is valid.');
