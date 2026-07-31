import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveSentryManagedCredential } from './sentryManagedCredential.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const wrapper = readFileSync(path.join(root, 'scripts', 'runSentryReleaseWithManagedCredential.mjs'), 'utf8');
const errors = [];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

let spawnCalls = 0;
const envCredential = resolveSentryManagedCredential({
  env: { SENTRY_AUTH_TOKEN: 'env-token' },
  spawn: () => {
    spawnCalls += 1;
    return { status: 1, stdout: '' };
  },
});
assert(envCredential.source === 'environment', 'Explicit SENTRY_AUTH_TOKEN must take precedence');
assert(envCredential.token === 'env-token', 'Explicit SENTRY_AUTH_TOKEN must be preserved');
assert(spawnCalls === 0, 'Managed CLI must not run when SENTRY_AUTH_TOKEN is already available');

const managedCredential = resolveSentryManagedCredential({
  env: {},
  platform: 'win32',
  spawn: (command, args, options) => {
    assert(command === 'powershell.exe', 'Windows managed credential lookup must use PowerShell');
    assert(args.at(-1) === 'sentry auth token', 'Managed credential lookup must invoke sentry auth token');
    assert(options.encoding === 'utf8', 'Managed credential lookup must capture text output');
    return { status: 0, stdout: 'managed-token\r\n' };
  },
});
assert(managedCredential.source === 'managed-cli', 'Managed credential source must be recorded');
assert(managedCredential.token === 'managed-token', 'Managed credential output must trim the final newline');

const expectRejected = (label, options, forbiddenText) => {
  try {
    resolveSentryManagedCredential(options);
    errors.push(`${label} must fail`);
  } catch (error) {
    assert(!error.message.includes(forbiddenText), `${label} must not expose captured CLI output`);
  }
};

expectRejected(
  'Failed managed CLI lookup',
  {
    env: {},
    spawn: () => ({ status: 10, stdout: 'secret-from-failed-command', stderr: 'secret-error' }),
  },
  'secret',
);
expectRejected('Blank managed CLI token', { env: {}, spawn: () => ({ status: 0, stdout: '   \n' }) }, 'secret');
expectRejected(
  'Whitespace-bearing managed CLI token',
  { env: {}, spawn: () => ({ status: 0, stdout: 'secret token\n' }) },
  'secret token',
);

assert(
  packageJson.scripts['sentry:release:validation:managed'] === 'node scripts/runSentryReleaseWithManagedCredential.mjs',
  'Managed Sentry validation package script is missing',
);
assert(
  packageJson.scripts['sentry:release:validation:managed:preflight'] ===
    'node scripts/runSentryReleaseWithManagedCredential.mjs --preflight-only --skip-android-release',
  'Managed Sentry preflight package script is missing',
);
assert(wrapper.includes('writeSentryPropertiesFiles({ root, env })'), 'Wrapper must prepare ignored properties files');
assert(wrapper.includes('SENTRY_AUTH_TOKEN: credential.token'), 'Wrapper must scope the managed token to child env');
assert(!/console\.(?:log|error)\([^\n]*credential\.token/.test(wrapper), 'Wrapper must not print the managed token');

if (errors.length > 0) {
  console.error('Sentry managed credential guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sentry managed credential guard checks are valid.');
