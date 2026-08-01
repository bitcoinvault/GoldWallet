import { existsSync, readFileSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  SENTRY_PRODUCTION_PROJECTS,
  getSentryProductionPreflightEnv,
  getSentryProductionPreflightSummaryErrors,
  getSentryProductionProjectErrors,
  getSentryProductionProjectViewInvocation,
} from './sentryProductionPreflight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  if (process.argv.length !== 2) throw new Error('Usage: node scripts/runSentryProductionPreflight.mjs');
  const managedRunner = path.join(root, 'scripts', 'runSentryReleaseWithManagedCredential.mjs');
  if (!existsSync(managedRunner)) throw new Error('Managed Sentry release runner is missing');
  const preflightEnv = getSentryProductionPreflightEnv();
  const summaryPath = path.join(root, 'local-docs', 'sentry-release-validation-handoff-summary.txt');
  rmSync(summaryPath, { force: true });

  for (const project of SENTRY_PRODUCTION_PROJECTS) {
    const invocation = getSentryProductionProjectViewInvocation(project);
    const result = spawnSync(invocation.command, invocation.args, {
      cwd: root,
      encoding: 'utf8',
      env: preflightEnv,
      windowsHide: true,
    });
    if (result.error || result.status !== 0) {
      throw new Error(`Unable to verify the ${project.platform} production Sentry project`);
    }
    let response;
    try {
      response = JSON.parse(result.stdout);
    } catch {
      throw new Error(`Invalid ${project.platform} production Sentry project response`);
    }
    const errors = getSentryProductionProjectErrors({ response, expected: project });
    if (errors.length > 0) throw new Error(errors.join('; '));
    console.log(`Verified ${project.platform} production Sentry project: ${project.slug} (${project.id})`);
  }

  console.log('Sentry production auto-upload disabled: yes');
  console.log('Sentry credential values and sensitive project response fields printed: no');
  const result = spawnSync(process.execPath, [managedRunner, '--preflight-only', '--skip-android-release'], {
    cwd: root,
    env: preflightEnv,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) throw new Error('Sentry production preflight failed');

  if (!existsSync(summaryPath)) throw new Error('Sentry production preflight did not write a fresh summary');
  const summaryErrors = getSentryProductionPreflightSummaryErrors(readFileSync(summaryPath, 'utf8'));
  if (summaryErrors.length > 0) throw new Error(summaryErrors.join('; '));
  console.log('Sentry production preflight passed without upload.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
