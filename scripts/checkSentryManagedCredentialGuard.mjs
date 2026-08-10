import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveSentryManagedCredential } from './sentryManagedCredential.mjs';
import { parseSentryManagedReleaseValidationArgs } from './sentryManagedReleaseValidation.mjs';

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

const parsedProd = parseSentryManagedReleaseValidationArgs({
  argv: ['--profile=prod', '--preflight-only', '--skip-android-release'],
  env: {},
});
assert(parsedProd.profile === 'prod', 'Managed profile argument must select prod');
assert(parsedProd.env.SENTRY_RELEASE_PROFILE === 'prod', 'Managed profile must be passed through the child env');
assert(
  JSON.stringify(parsedProd.handoffArgs) === JSON.stringify(['--preflight-only', '--skip-android-release']),
  'Managed profile argument must not be forwarded to the handoff runner',
);

const parsedNonprod = parseSentryManagedReleaseValidationArgs({
  argv: ['--profile', 'nonprod', '--preflight-only'],
  env: {},
});
assert(parsedNonprod.profile === 'nonprod', 'Separated managed profile argument must select nonprod');

const parsedEnv = parseSentryManagedReleaseValidationArgs({
  argv: ['--preflight-only'],
  env: { SENTRY_RELEASE_PROFILE: 'prod' },
});
assert(parsedEnv.profile === 'prod', 'Managed profile env fallback must remain supported');

const parsedHelp = parseSentryManagedReleaseValidationArgs({ argv: ['--help'], env: {} });
assert(parsedHelp.help === true, 'Managed help must not require a release profile');
assert(parsedHelp.profile === undefined, 'Managed help must not materialize a release profile');

const parsedDryRun = parseSentryManagedReleaseValidationArgs({
  argv: ['--profile=prod', '--preflight-only', '--skip-android-release', '--dry-run'],
  env: {},
});
assert(parsedDryRun.dryRun === true, 'Managed dry run must be identified before credential lookup');

const expectProfileRejected = (label, argv, env = {}) => {
  try {
    parseSentryManagedReleaseValidationArgs({ argv, env });
    errors.push(`${label} must fail`);
  } catch (error) {
    assert(!error.message.includes('auth.token'), `${label} must not expose credential fields`);
  }
};

expectProfileRejected('Missing managed release profile', ['--preflight-only']);
expectProfileRejected('Blank managed release profile', ['--profile=']);
expectProfileRejected('Unsupported managed release profile', ['--profile=staging']);
expectProfileRejected('Duplicate managed release profile', ['--profile=prod', '--profile=prod']);
expectProfileRejected('Conflicting managed release profile', ['--profile=prod'], {
  SENTRY_RELEASE_PROFILE: 'nonprod',
});
expectProfileRejected('Unknown managed handoff argument', ['--profile=prod', '--execute']);
expectProfileRejected('Profile-like typo', ['--profile=prod', '--profilex=nonprod']);
expectProfileRejected('Argument separator', ['--profile=prod', '--']);
expectProfileRejected('Duplicate managed handoff argument', ['--profile=prod', '--dry-run', '--dry-run']);
expectProfileRejected('Duplicate managed help alias', ['--profile=prod', '--help', '-h']);
expectProfileRejected('Summary and dry-run conflict', ['--profile=prod', '--summary-only', '--dry-run']);
expectProfileRejected('Summary and preflight conflict', ['--profile=prod', '--summary-only', '--preflight-only']);
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
    'node scripts/runSentryReleaseWithManagedCredential.mjs --profile=prod --preflight-only --skip-android-release',
  'Managed Sentry preflight package script is missing',
);
assert(
  packageJson.scripts['sentry:release:validation:managed:preflight:nonprod'] ===
    'node scripts/runSentryReleaseWithManagedCredential.mjs --profile=nonprod --preflight-only --skip-android-release',
  'Managed non-production Sentry preflight package script is missing',
);
assert(
  packageJson.scripts['sentry:release:validation:production:preflight'] ===
    'node scripts/runSentryProductionPreflight.mjs',
  'Production Sentry preflight package script is missing',
);
assert(
  packageJson.scripts['check:sentry-production-preflight-guard'] ===
    'node scripts/checkSentryProductionPreflightGuard.mjs',
  'Production Sentry preflight guard package script is missing',
);
assert(wrapper.includes('writeSentryPropertiesFiles({ root, env })'), 'Wrapper must prepare ignored properties files');
assert(wrapper.includes('SENTRY_AUTH_TOKEN: credential.token'), 'Wrapper must scope the managed token to child env');
assert(
  wrapper.includes('parseSentryManagedReleaseValidationArgs({ argv: process.argv.slice(2) })'),
  'Wrapper must parse and validate the managed release profile before credential lookup',
);
assert(
  wrapper.includes('runHandoff({ args: options.handoffArgs, env'),
  'Wrapper must forward only validated handoff arguments',
);
const parseManagedArgs = wrapper.indexOf('parseSentryManagedReleaseValidationArgs({ argv: process.argv.slice(2) })');
const handleManagedHelp = wrapper.indexOf('if (options.help)');
const handleManagedDryRun = wrapper.indexOf('if (options.dryRun)');
const resolveManagedCredential = wrapper.indexOf('resolveSentryManagedCredential({ env: options.env })');
assert(parseManagedArgs >= 0, 'Wrapper must parse managed arguments');
assert(handleManagedHelp > parseManagedArgs, 'Wrapper must handle help after parsing');
assert(handleManagedDryRun > handleManagedHelp, 'Wrapper must handle dry-run after help');
assert(resolveManagedCredential > handleManagedDryRun, 'Wrapper must reject help/dry-run before credential lookup');
assert(!/console\.(?:log|error)\([^\n]*credential\.token/.test(wrapper), 'Wrapper must not print the managed token');

if (errors.length > 0) {
  console.error('Sentry managed credential guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sentry managed credential guard checks are valid.');
