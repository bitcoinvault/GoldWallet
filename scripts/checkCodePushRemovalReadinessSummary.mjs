import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCodePushRemovalReadinessSummaryErrors } from './codePushRemovalReadinessSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-removal-readiness-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`CodePush removal readiness summary artifact is missing at ${path.relative(root, summaryPath)}`);
  process.exit(1);
}

const errors = getCodePushRemovalReadinessSummaryErrors(readFileSync(summaryPath, 'utf8'));

if (errors.length > 0) {
  console.error('CodePush removal readiness summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CodePush removal readiness summary artifact is valid.');
