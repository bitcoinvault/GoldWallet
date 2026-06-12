import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCodePushEnvCleanupPlanErrors } from './codePushEnvCleanupPlanGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'local-docs', 'codepush-env-cleanup-plan.txt');

if (!existsSync(planPath)) {
  console.error(`Missing CodePush env cleanup plan artifact: ${planPath}`);
  process.exit(1);
}

const plan = readFileSync(planPath, 'utf8');
const errors = getCodePushEnvCleanupPlanErrors(plan);

if (errors.length > 0) {
  console.error('CodePush env cleanup plan artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CodePush env cleanup plan artifact is valid.');
