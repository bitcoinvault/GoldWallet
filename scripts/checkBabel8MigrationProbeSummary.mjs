import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getBabel8MigrationProbeSummaryErrors } from './babel8MigrationProbeSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'babel-8-migration-probe-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing Babel 8 migration probe summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getBabel8MigrationProbeSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Babel 8 migration probe summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const babel7TraverseSummary = summary.replace(
  /- @babel\/traverse: installed \d+\.\d+\.\d+, expected \d+\.\d+\.\d+, matches yes/,
  '- @babel/traverse: installed 7.29.8, expected 7.29.8, matches yes',
);
const babel7TraverseErrors = getBabel8MigrationProbeSummaryErrors(babel7TraverseSummary);

if (
  !babel7TraverseErrors.some(
    error => error.includes('@babel/traverse isolated') && error.includes('Babel 8'),
  )
) {
  console.error('Babel 8 migration probe summary guard failed to reject a Babel 7 traverse cohort mutation.');
  process.exit(1);
}

console.log('Babel 8 migration probe summary artifact and Babel 7 traverse mutation guard are valid.');
