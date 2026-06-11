import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCodePushEnvCleanupReadinessSummaryErrors } from './codePushEnvCleanupReadinessSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-env-cleanup-readiness-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing CodePush env cleanup readiness summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getCodePushEnvCleanupReadinessSummaryErrors(summary);

if (errors.length > 0) {
  console.error('CodePush env cleanup readiness summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CodePush env cleanup readiness summary artifact is valid.');
