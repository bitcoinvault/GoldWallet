import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import {
  getCodePushUpdateValidationCommands,
  getCodePushUpdateValidationHandoffErrors,
  getCodePushUpdateValidationReadinessErrors,
  renderCodePushUpdateValidationCommand,
} from './runCodePushUpdateValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getCodePushUpdateValidationCommands({ skipAndroidRelease: false });
const fullRendered = fullCommands.map(renderCodePushUpdateValidationCommand).join('\n');
const skippedCommands = getCodePushUpdateValidationCommands({ skipAndroidRelease: true });
const skippedRendered = skippedCommands.map(renderCodePushUpdateValidationCommand).join('\n');
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
  'corepack yarn android:dev:release:verify-local',
  'corepack yarn android:dev:release:smoke:embedded',
  'corepack yarn android:dev:release:check-smoke-summary',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn codepush:release:path-audit',
  'corepack yarn codepush:release:path-check-summary',
  'corepack yarn codepush:migration:readiness-audit',
  'corepack yarn codepush:migration:readiness-check-summary',
  'corepack yarn codepush:removal-readiness:audit',
  'corepack yarn codepush:removal-readiness:check-summary',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected CodePush handoff commands to include: ${expected}`);
});

assert(
  !fullRendered.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') &&
    !fullRendered.includes('CODEPUSH_DEPLOYMENT_KEY_IOS=') &&
    !skippedRendered.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') &&
    !skippedRendered.includes('CODEPUSH_DEPLOYMENT_KEY_IOS='),
  'CodePush handoff rendered commands must not print deployment-key assignments',
);
assert(
  !skippedRendered.includes('android:dev:release:verify-local'),
  'Skipped CodePush handoff must omit Android release evidence refresh',
);
assert(
  !skippedRendered.includes('android:dev:release:smoke:embedded'),
  'Skipped CodePush handoff must omit Android release smoke refresh',
);
assert(
  !skippedRendered.includes('android:dev:release:check-smoke-summary'),
  'Skipped CodePush handoff must omit Android release smoke summary validation',
);
assert(
  skippedRendered.includes('corepack yarn codepush:release:path-audit'),
  'Skipped CodePush handoff must still refresh CodePush release path readiness',
);
assert(
  skippedCommands[skippedCommands.length - 1].args.includes('release-services:check-summaries'),
  'Release-services aggregate check must be the final CodePush handoff command',
);
assert(
  getCodePushUpdateValidationHandoffErrors({ skipAndroidRelease: 'false' }).some(error =>
    error.includes('skipAndroidRelease must be a boolean'),
  ),
  'Invalid skipAndroidRelease option must be rejected',
);

const readySummary = [
  'Release path ready for update validation: yes',
  'CodePush update validation: not claimed',
  'CodePush migration required: yes',
  'Secret values printed: no',
].join('\n');

const blockedSummary = [
  'Release path ready for update validation: no',
  'CodePush update validation: not claimed',
  'CodePush migration required: yes',
  'Secret values printed: no',
].join('\n');

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
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    smokeEvidenceOptions,
  }).length === 0,
  'Ready CodePush handoff summary fixture must pass readiness checks',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: blockedSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    smokeEvidenceOptions,
  }).some(error => error.includes('not ready for update validation')),
  'Blocked CodePush handoff summary fixture must report update-validation readiness blocker',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: 'Release path ready for update validation: yes',
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    smokeEvidenceOptions,
  }).some(error => error.includes('deployment-key values were not printed')),
  'CodePush readiness check must require secret-safe summary evidence',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    androidReleaseSmokeSummaryText: '',
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is missing')),
  'CodePush readiness check must report a missing Android release smoke summary',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary.replace('Validated empty-dashboard CTA flow: yes', 'Validated empty-dashboard CTA flow: no'),
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is invalid')),
  'CodePush readiness check must reject invalid Android release smoke evidence',
);

console.log('CodePush update validation handoff guard checks are valid.');
