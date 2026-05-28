import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getReactNativeTargetSnapshotSummaryErrors } from './reactNativeTargetSnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'rn-target-snapshot-current-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing React Native target snapshot summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getReactNativeTargetSnapshotSummaryErrors(summary);

if (errors.length > 0) {
  console.error('React Native target snapshot summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('React Native target snapshot summary artifact is valid.');
