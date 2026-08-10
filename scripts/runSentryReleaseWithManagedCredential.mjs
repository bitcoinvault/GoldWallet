import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeSentryPropertiesFiles } from './createSentryProperties.mjs';
import { resolveSentryManagedCredential } from './sentryManagedCredential.mjs';
import { parseSentryManagedReleaseValidationArgs } from './sentryManagedReleaseValidation.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const handoffPath = path.join(__dirname, 'runSentryReleaseValidationHandoff.mjs');
const managedUsage = [
  'Usage: node scripts/runSentryReleaseWithManagedCredential.mjs --profile=prod|nonprod [handoff options]',
  '',
  'Handoff options: --dry-run, --preflight-only, --summary-only, --skip-android-release, --help',
].join('\n');

const runHandoff = ({ args, env }) =>
  spawnSync(process.execPath, [handoffPath, ...args], {
    cwd: root,
    env,
    stdio: 'inherit',
    windowsHide: true,
  });

try {
  const options = parseSentryManagedReleaseValidationArgs({ argv: process.argv.slice(2) });

  if (options.help) {
    console.log(managedUsage);
    process.exit(0);
  }

  if (options.dryRun) {
    const result = runHandoff({ args: options.handoffArgs, env: options.env });
    if (result.error) throw new Error(`Unable to start the Sentry release handoff: ${result.error.message}`);
    process.exit(result.status ?? 1);
  }

  const credential = resolveSentryManagedCredential({ env: options.env });
  const env = {
    ...options.env,
    SENTRY_AUTH_TOKEN: credential.token,
  };
  const writtenFiles = writeSentryPropertiesFiles({ root, env });

  console.log(`Sentry credential source: ${credential.source}`);
  console.log(`Sentry release profile: ${options.profile}`);
  console.log('Sentry credential value printed: no');
  writtenFiles.forEach(filePath => console.log(`Prepared ignored ${path.relative(root, filePath)}`));

  const result = runHandoff({ args: options.handoffArgs, env });

  if (result.error) {
    throw new Error(`Unable to start the Sentry release handoff: ${result.error.message}`);
  }

  process.exit(result.status ?? 1);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
