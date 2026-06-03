import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCodePushMigrationReadinessSummaryErrors } from './codePushMigrationReadinessSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-migration-readiness-summary.txt');

if (!existsSync(summaryPath)) {
  console.error(`Missing CodePush migration readiness summary artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getCodePushMigrationReadinessSummaryErrors(summary);

if (errors.length > 0) {
  console.error('CodePush migration readiness summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CodePush migration readiness summary artifact is valid.');
