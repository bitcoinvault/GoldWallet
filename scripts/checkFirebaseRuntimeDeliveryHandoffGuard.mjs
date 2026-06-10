import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import {
  getFirebaseRuntimeDeliveryCommands,
  getFirebaseRuntimeDeliveryHandoffErrors,
  getFirebaseRuntimeDeliveryReadinessErrors,
  renderFirebaseRuntimeDeliveryCommand,
} from './runFirebaseRuntimeDeliveryHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getFirebaseRuntimeDeliveryCommands({ skipAndroidRelease: false });
const fullRendered = fullCommands.map(renderFirebaseRuntimeDeliveryCommand).join('\n');
const skippedCommands = getFirebaseRuntimeDeliveryCommands({ skipAndroidRelease: true });
const skippedRendered = skippedCommands.map(renderFirebaseRuntimeDeliveryCommand).join('\n');
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
  'corepack yarn firebase:release-services:audit',
  'corepack yarn firebase:release-services:check-summary',
  'corepack yarn push-notification:bridge-audit',
  'corepack yarn push-notification:bridge-check-summary',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected Firebase handoff commands to include: ${expected}`);
});

assert(
  !skippedRendered.includes('android:dev:release:verify-local'),
  'Skipped Firebase runtime handoff must omit Android release evidence refresh',
);
assert(
  !skippedRendered.includes('android:dev:release:smoke:embedded'),
  'Skipped Firebase runtime handoff must omit Android release smoke refresh',
);
assert(
  !skippedRendered.includes('android:dev:release:check-smoke-summary'),
  'Skipped Firebase runtime handoff must omit Android release smoke summary validation',
);
assert(
  skippedRendered.includes('corepack yarn firebase:release-services:audit'),
  'Skipped Firebase runtime handoff must still refresh Firebase release-services readiness',
);
assert(
  skippedRendered.includes('corepack yarn push-notification:bridge-audit'),
  'Skipped Firebase runtime handoff must still refresh push notification bridge readiness',
);
assert(
  skippedCommands[skippedCommands.length - 1].args.includes('release-services:check-summaries'),
  'Release-services aggregate check must be the final Firebase runtime handoff command',
);
assert(
  getFirebaseRuntimeDeliveryHandoffErrors({ skipAndroidRelease: 'false' }).some(error =>
    error.includes('skipAndroidRelease must be a boolean'),
  ),
  'Invalid skipAndroidRelease option must be rejected',
);

const readyFirebaseSummary = [
  'React Native Firebase package current: yes',
  'Firebase release-services wiring valid: yes',
  'Android release summary present: yes',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release APK manifest valid: yes',
  'Firebase runtime delivery validation: not claimed',
  'Wiring errors: 0',
  'Required action: none; Firebase release-services wiring is present locally.',
].join('\n');

const readyPushBridgeSummary = [
  'Push notification package current: yes',
  'Push notification bridge wiring valid: yes',
  'Push notification runtime delivery validation: not claimed',
  'Static readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none; static push notification bridge wiring is present locally.',
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
  `UI hierarchy attempts: 1`,
  'UI hierarchy path: package.json',
  'Screenshot path: package.json',
  'Screenshot bytes: 1234',
].join('\n');

assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary,
    pushBridgeSummaryText: readyPushBridgeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    smokeEvidenceOptions,
  }).length === 0,
  'Ready Firebase runtime handoff summary fixtures must pass readiness checks',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary.replace('Firebase runtime delivery validation: not claimed', 'Firebase runtime delivery validation: claimed'),
    pushBridgeSummaryText: readyPushBridgeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    smokeEvidenceOptions,
  }).some(error => error.includes('must stay unclaimed')),
  'Firebase runtime readiness check must reject claimed delivery without a real runtime handoff',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary.replace('Android release summary current inputs covered: yes', 'Android release summary current inputs covered: no'),
    pushBridgeSummaryText: readyPushBridgeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    smokeEvidenceOptions,
  }).some(error => error.includes('current release inputs')),
  'Firebase runtime readiness check must require fresh Android release inputs',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary,
    pushBridgeSummaryText: readyPushBridgeSummary.replace('Static readiness issues: 0', 'Static readiness issues: 1'),
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    smokeEvidenceOptions,
  }).some(error => error.includes('0 static readiness issues')),
  'Firebase runtime readiness check must require push notification static readiness',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: '',
    pushBridgeSummaryText: readyPushBridgeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    smokeEvidenceOptions,
  }).some(error => error.includes('Firebase release-services summary is missing')),
  'Firebase runtime readiness check must report a missing Firebase summary',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary,
    pushBridgeSummaryText: readyPushBridgeSummary,
    androidReleaseSmokeSummaryText: '',
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is missing')),
  'Firebase runtime readiness check must report a missing Android release smoke summary',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary,
    pushBridgeSummaryText: readyPushBridgeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary.replace('Validated empty-tab navigation: yes', 'Validated empty-tab navigation: no'),
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is invalid')),
  'Firebase runtime readiness check must reject invalid Android release smoke evidence',
);

console.log('Firebase runtime delivery handoff guard checks are valid.');
