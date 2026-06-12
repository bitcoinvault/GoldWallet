import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSentryReleaseCredentialPlanErrors } from './sentryReleaseCredentialPlanGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'local-docs', 'sentry-release-credential-plan.txt');

if (!existsSync(planPath)) {
  console.error(`Missing Sentry release credential plan artifact: ${planPath}`);
  process.exit(1);
}

const plan = readFileSync(planPath, 'utf8');
const errors = getSentryReleaseCredentialPlanErrors(plan);

if (errors.length > 0) {
  console.error('Sentry release credential plan artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sentry release credential plan artifact is valid.');
