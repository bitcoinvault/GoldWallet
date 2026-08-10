import assert from 'assert';
import { readFileSync } from 'fs';

import {
  SENTRY_PRODUCTION_PROJECTS,
  getSentryProductionPreflightEnv,
  getSentryProductionPreflightSummaryErrors,
  getSentryProductionProjectErrors,
  getSentryProductionProjectViewInvocation,
} from './sentryProductionPreflight.mjs';

const env = getSentryProductionPreflightEnv({
  SENTRY_URL: 'https://wrong.invalid',
  SENTRY_HOST: 'https://wrong-host.invalid',
  SENTRY_RELEASE: 'wrong',
  SENTRY_DIST: '999',
  SENTRY_RELEASE_PROFILE: 'nonprod',
  SENTRY_ORG: 'wrong',
  SENTRY_ANDROID_PROJECT: 'wrong',
  SENTRY_IOS_PROJECT: 'wrong',
  SENTRY_ANDROID_RELEASE_EVIDENCE_VARIANT: 'dev',
  SENTRY_DISABLE_AUTO_UPLOAD: 'false',
});
assert.strictEqual(env.SENTRY_URL, 'https://sentry.io');
assert.strictEqual(env.SENTRY_HOST, 'https://sentry.io');
assert.strictEqual(env.SENTRY_RELEASE, undefined);
assert.strictEqual(env.SENTRY_DIST, undefined);
assert.strictEqual(env.SENTRY_RELEASE_PROFILE, 'prod');
assert.strictEqual(env.SENTRY_ORG, 'decentraplanet');
assert.strictEqual(env.SENTRY_ANDROID_PROJECT, 'goldwallet-prod-android');
assert.strictEqual(env.SENTRY_IOS_PROJECT, 'goldwallet');
assert.strictEqual(env.SENTRY_ANDROID_RELEASE_EVIDENCE_VARIANT, 'prod');
assert.strictEqual(env.SENTRY_DISABLE_AUTO_UPLOAD, 'true');

for (const project of SENTRY_PRODUCTION_PROJECTS) {
  const response = [
    {
      id: project.id,
      slug: project.slug,
      organization: { slug: 'decentraplanet' },
      status: 'active',
      hasAccess: true,
      access: ['project:read', 'project:releases'],
    },
  ];
  assert.deepStrictEqual(getSentryProductionProjectErrors({ response, expected: project }), []);
  for (const mutation of [
    { id: '1' },
    { slug: 'wrong' },
    { organization: { slug: 'wrong' } },
    { status: 'disabled' },
    { hasAccess: false },
    { access: [] },
  ]) {
    assert(
      getSentryProductionProjectErrors({ response: [{ ...response[0], ...mutation }], expected: project }).length > 0,
    );
  }
}
assert(getSentryProductionProjectErrors({ response: [], expected: SENTRY_PRODUCTION_PROJECTS[0] }).length > 0);

const windowsInvocation = getSentryProductionProjectViewInvocation(SENTRY_PRODUCTION_PROJECTS[0], 'win32');
assert.strictEqual(windowsInvocation.command, 'powershell.exe');
assert(windowsInvocation.args.at(-1).includes('decentraplanet/goldwallet-prod-android --fresh --json'));
const posixInvocation = getSentryProductionProjectViewInvocation(SENTRY_PRODUCTION_PROJECTS[1], 'linux');
assert.deepStrictEqual(posixInvocation.args, ['project', 'view', 'decentraplanet/goldwallet', '--fresh', '--json']);

const summary = `
Android release evidence variant: prod
Android release build evidence ready: yes
Sentry packages current: yes
SENTRY_AUTH_TOKEN available: yes
Sentry properties files ready: yes
Sentry release upload validation: not claimed
Sentry release runtime proof state: ready
Handoff outcome: blocked
Handoff blocker type: ios-validation-not-ready
Readiness errors: 1
- iOS archive/simulator validation is not ready on this Windows host.
Secret values printed: no
`;
assert.deepStrictEqual(getSentryProductionPreflightSummaryErrors(summary), []);
assert(
  getSentryProductionPreflightSummaryErrors(
    summary.replace('runtime proof state: ready', 'runtime proof state: not ready'),
  ).length > 0,
);
assert(
  getSentryProductionPreflightSummaryErrors(summary.replace('ios-validation-not-ready', 'missing-sentry-credentials'))
    .length > 0,
);
assert(
  getSentryProductionPreflightSummaryErrors(
    summary.replace('Android release build evidence ready: yes', 'Android release build evidence ready: no'),
  ).length > 0,
);
assert(
  getSentryProductionPreflightSummaryErrors(summary.replace('Readiness errors: 1', 'Readiness errors: 2')).length > 0,
);
assert(
  getSentryProductionPreflightSummaryErrors(
    summary.replace('Handoff outcome: blocked', 'Handoff outcome: ready-for-credentialed-upload-test'),
  ).length > 0,
);
assert.deepStrictEqual(
  getSentryProductionPreflightSummaryErrors(
    summary
      .replace('Handoff outcome: blocked', 'Handoff outcome: ready-for-credentialed-upload-test')
      .replace('Handoff blocker type: ios-validation-not-ready', 'Handoff blocker type: none')
      .replace(
        'Readiness errors: 1\n- iOS archive/simulator validation is not ready on this Windows host.',
        'Readiness errors: 0',
      ),
  ),
  [],
);

const runner = readFileSync('scripts/runSentryProductionPreflight.mjs', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
assert.strictEqual(
  packageJson.scripts['sentry:release:validation:production:preflight'],
  'node scripts/runSentryProductionPreflight.mjs',
);
assert.strictEqual(
  packageJson.scripts['check:sentry-production-preflight-guard'],
  'node scripts/checkSentryProductionPreflightGuard.mjs',
);
assert(runner.includes("[managedRunner, '--preflight-only', '--skip-android-release']"));
assert(!runner.includes('[managedRunner, ...process.argv'));
assert(!runner.includes('[managedRunner, ...args'));
assert(!runner.includes('--root'));
assert(!runner.includes('--execute'));
assert(!runner.includes('credential.token'));
assert(runner.includes('env: preflightEnv'));
const invalidateSummary = runner.indexOf('rmSync(summaryPath, { force: true });');
const runFirstProjectLookup = runner.indexOf('for (const project of SENTRY_PRODUCTION_PROJECTS)');
const runManagedPreflight = runner.indexOf(
  "spawnSync(process.execPath, [managedRunner, '--preflight-only', '--skip-android-release']",
);
assert(invalidateSummary >= 0);
assert(runFirstProjectLookup >= 0);
assert(runManagedPreflight >= 0);
assert(invalidateSummary < runFirstProjectLookup);
assert(invalidateSummary < runManagedPreflight);

console.log('Sentry production preflight guard checks passed.');
