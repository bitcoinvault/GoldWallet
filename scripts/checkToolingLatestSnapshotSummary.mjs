import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getToolingLatestSnapshotSummaryErrors } from './toolingLatestSnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'tooling-latest-snapshot.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing tooling latest snapshot summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getToolingLatestSnapshotSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Tooling latest snapshot summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Tooling latest snapshot summary artifact is valid.');
