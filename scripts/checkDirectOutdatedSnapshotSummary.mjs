import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDirectOutdatedSnapshotSummaryErrors } from './directOutdatedSnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'direct-outdated-snapshot.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing direct outdated snapshot summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getDirectOutdatedSnapshotSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Direct outdated snapshot summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Direct outdated snapshot summary artifact is valid.');
