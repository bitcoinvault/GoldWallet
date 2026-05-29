import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expectedRemainingWarningFollowups, getRemainingWarningPlanErrors } from './androidRemainingWarningPlanGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'docs', 'android-warning-baseline-followups.md');
const summaryPath = path.join(root, 'local-docs', 'android-warning-audit-summary.txt');

const errors = [];

if (!existsSync(planPath)) {
  errors.push('docs/android-warning-baseline-followups.md is missing');
} else {
  const plan = readFileSync(planPath, 'utf8');
  errors.push(...getRemainingWarningPlanErrors(plan));
}

if (existsSync(summaryPath)) {
  const summary = readFileSync(summaryPath, 'utf8');

  if (!summary.includes(`Targeted Android Gradle warnings: ${expectedRemainingWarningFollowups.length}`)) {
    errors.push(`Android warning summary must report ${expectedRemainingWarningFollowups.length} targeted warnings`);
  }

  expectedRemainingWarningFollowups.forEach(({ packageName, warningSource }) => {
    const sourceParts = warningSource.split('/').filter(part => part !== 'node_modules');

    if (!sourceParts.every(part => summary.includes(part))) {
      errors.push(`Android warning summary is missing ${packageName}`);
    }
  });
}

if (errors.length > 0) {
  console.error('Android remaining warning plan is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android remaining warning plan matches the current warning baseline.');
