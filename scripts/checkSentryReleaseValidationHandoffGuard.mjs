import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import {
  getSentryReleaseValidationCommands,
  getSentryReleaseValidationHandoffErrors,
  getSentryReleaseValidationReadinessErrors,
  renderSentryReleaseValidationCommand,
} from './runSentryReleaseValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getSentryReleaseValidationCommands({ skipAndroidRelease: false });
const fullRendered = fullCommands.map(renderSentryReleaseValidationCommand).join('\n');
const skippedCommands = getSentryReleaseValidationCommands({ skipAndroidRelease: true });
const skippedRendered = skippedCommands.map(renderSentryReleaseValidationCommand).join('\n');
const fixtureApkPath = path.resolve('package.json');
const fixtureApkBytes = statSync(fixtureApkPath).size;
const fixtureApkSha256 = createHash('sha256').update(readFileSync(fixtureApkPath)).digest('hex');
const smokeEvidenceOptions = {
  expectedArtifactBase: 'android-smoke-dev-release',
  requireSmokeApkDigest: true,
  expectedSmokeApkPath: fixtureApkPath,
  requireSourceApkDigest: true,
  expectedSourceApkPath: fixtureApkPath,
};

[
  'corepack yarn check:sentry-properties-generator',
  'corepack yarn android:dev:release:verify-local',
  'corepack yarn android:dev:release:smoke:embedded',
  'corepack yarn android:dev:release:check-smoke-summary',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn sentry:android-warning:audit',
  'corepack yarn sentry:android-warning:check-summary',
  'corepack yarn sentry:release:create-properties',
  'requires-env=SENTRY_AUTH_TOKEN',
  'corepack yarn sentry:release:prereq-audit',
  'corepack yarn sentry:release:prereq-check-summary',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected Sentry handoff commands to include: ${expected}`);
});

assert(
  !fullRendered.includes('SENTRY_AUTH_TOKEN=') && !skippedRendered.includes('SENTRY_AUTH_TOKEN='),
  'Sentry handoff rendered commands must not print SENTRY_AUTH_TOKEN assignments',
);
assert(
  !skippedRendered.includes('android:dev:release:verify-local'),
  'Skipped Sentry handoff must omit Android release evidence refresh',
);
assert(
  !skippedRendered.includes('android:dev:release:smoke:embedded'),
  'Skipped Sentry handoff must omit Android release smoke refresh',
);
assert(
  !skippedRendered.includes('android:dev:release:check-smoke-summary'),
  'Skipped Sentry handoff must omit Android release smoke summary validation',
);
assert(
  skippedRendered.includes('corepack yarn sentry:release:create-properties'),
  'Skipped Sentry handoff must still generate Sentry release properties',
);
assert(
  skippedRendered.includes('corepack yarn sentry:android-warning:audit'),
  'Skipped Sentry handoff must still audit the Sentry Android warning surface',
);
assert(
  skippedRendered.includes('corepack yarn sentry:android-warning:check-summary'),
  'Skipped Sentry handoff must still validate the Sentry Android warning summary',
);
assert(
  fullCommands[0].args.includes('check:sentry-properties-generator'),
  'Sentry properties generator guard must run before properties are generated',
);
assert(
  fullCommands.findIndex(step => step.args.includes('sentry:android-warning:audit')) <
    fullCommands.findIndex(step => step.args.includes('sentry:release:prereq-audit')),
  'Sentry Android warning audit must run before the Sentry release prerequisite audit',
);
assert(
  fullCommands[fullCommands.length - 1].args.includes('release-services:check-summaries'),
  'Release-services aggregate check must be the final Sentry handoff command',
);
assert(
  getSentryReleaseValidationHandoffErrors({ skipAndroidRelease: 'false' }).some(error =>
    error.includes('skipAndroidRelease must be a boolean'),
  ),
  'Invalid skipAndroidRelease option must be rejected',
);

const readyAndroidReleaseSmokeSummary = [
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Android smoke outcome: passed',
  'Android smoke exit code: 0',
  'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet.dev',
  'Android activity: io.goldwallet.wallet.dev/io.goldwallet.wallet.MainActivity',
  'Artifact base: android-smoke-dev-release',
  `Smoke APK path: ${fixtureApkPath}`,
  `Smoke APK bytes: ${fixtureApkBytes}`,
  `Smoke APK sha256: ${fixtureApkSha256}`,
  `Source APK path: ${fixtureApkPath}`,
  `Source APK bytes: ${fixtureApkBytes}`,
  `Source APK sha256: ${fixtureApkSha256}`,
  'Metro required: no',
  'Metro endpoint: 127.0.0.1:8081',
  'Metro reachable: no',
  'Cleared app data: yes',
  'Expected UI texts: Wallets, No wallets, Create new wallet, Import wallet',
  'Expected resource IDs: dashboard-header, no-wallets-icon, create-wallet-button, import-wallet-button, navigation-tab-0',
  'App PID: 1234',
  'Captured logcat lines: 400',
  'Accepted first-run terms: yes',
  'Completed first-run PIN: yes',
  'Completed first-run transaction password: yes',
  'Skipped first-run email: yes',
  'Closed first-run success: yes',
  'Validated empty-dashboard CTA flow: yes',
  'Validated empty-tab navigation: yes',
  'Validated QR scanner screen: yes',
  'UI hierarchy attempts: 1',
  'UI hierarchy path: package.json',
  'Screenshot path: package.json',
  'Screenshot bytes: 1234',
].join('\n');

assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    smokeEvidenceOptions,
  }).length === 0,
  'Ready Sentry release handoff smoke fixture must pass readiness checks',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseSmokeSummaryText: '',
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is missing')),
  'Sentry release readiness check must report a missing Android release smoke summary',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary.replace('Validated empty-dashboard CTA flow: yes', 'Validated empty-dashboard CTA flow: no'),
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is invalid')),
  'Sentry release readiness check must reject invalid Android release smoke evidence',
);

console.log('Sentry release validation handoff guard checks are valid.');
