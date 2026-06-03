import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getGitDependencySnapshotSummaryErrors } from './gitDependencySnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'git-dependency-snapshot.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing git dependency snapshot summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getGitDependencySnapshotSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Git dependency snapshot summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Git dependency snapshot summary artifact is valid.');
