import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-release-path-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing CodePush release path summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getCodePushReleasePathSummaryErrors(summary);

if (errors.length > 0) {
  console.error('CodePush release path summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CodePush release path summary artifact is valid.');
