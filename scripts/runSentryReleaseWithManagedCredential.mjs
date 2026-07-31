import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeSentryPropertiesFiles } from './createSentryProperties.mjs';
import { resolveSentryManagedCredential } from './sentryManagedCredential.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const handoffPath = path.join(__dirname, 'runSentryReleaseValidationHandoff.mjs');

try {
  const credential = resolveSentryManagedCredential();
  const env = {
    ...process.env,
    SENTRY_AUTH_TOKEN: credential.token,
  };
  const writtenFiles = writeSentryPropertiesFiles({ root, env });

  console.log(`Sentry credential source: ${credential.source}`);
  console.log('Sentry credential value printed: no');
  writtenFiles.forEach(filePath => console.log(`Prepared ignored ${path.relative(root, filePath)}`));

  const result = spawnSync(process.execPath, [handoffPath, ...process.argv.slice(2)], {
    cwd: root,
    env,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) {
    throw new Error(`Unable to start the Sentry release handoff: ${result.error.message}`);
  }

  process.exit(result.status ?? 1);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
