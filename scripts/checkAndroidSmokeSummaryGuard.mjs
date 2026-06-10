import { getAndroidEmbeddedSmokeSummaryErrors, getAndroidSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';

const fixtureFilePath = 'package.json';
const fixtureFileBytes = statSync(fixtureFilePath).size;
const fixtureFileSha256 = createHash('sha256').update(readFileSync(fixtureFilePath)).digest('hex');

const validSummary = [
  'Generated at: 2026-05-28T14:50:52.705Z',
  'Android smoke outcome: passed',
  'Android smoke exit code: 0',
  'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet.dev',
  'Artifact base: android-smoke-dev',
  `Smoke APK path: ${fixtureFilePath}`,
  `Smoke APK bytes: ${fixtureFileBytes}`,
  `Smoke APK sha256: ${fixtureFileSha256}`,
  `Source APK path: ${fixtureFilePath}`,
  `Source APK bytes: ${fixtureFileBytes}`,
  `Source APK sha256: ${fixtureFileSha256}`,
  'Metro required: yes',
  'Metro endpoint: 127.0.0.1:8081',
  'Metro reachable: yes',
  'Cleared app data: no',
  'Expected UI texts: Wallets, E2EWalletTypeTest, Send, Receive',
  'Expected resource IDs: none',
  'App PID: 21294',
  'Captured logcat lines: 211',
  'Accepted first-run terms: no',
  'Completed first-run PIN: no',
  'Completed first-run transaction password: no',
  'Skipped first-run email: no',
  'Closed first-run success: no',
  'Validated empty-dashboard CTA flow: no',
  'Validated empty-tab navigation: no',
  'Validated QR scanner screen: no',
  'UI hierarchy attempts: 2',
  'UI hierarchy path: package.json',
  'Screenshot path: package.json',
  'Screenshot bytes: 154489',
].join('\n');

const failedSummary = validSummary.replace('Android smoke outcome: passed', 'Android smoke outcome: failed');
const missingMetroSummary = validSummary.replace('Metro reachable: yes', 'Metro reachable: no');
const embeddedSummary = validSummary
  .replace('Artifact base: android-smoke-dev', 'Artifact base: android-smoke-dev-release')
  .replace('Metro required: yes', 'Metro required: no')
  .replace('Metro reachable: yes', 'Metro reachable: no')
  .replace('Cleared app data: no', 'Cleared app data: yes')
  .replace('Accepted first-run terms: no', 'Accepted first-run terms: yes')
  .replace('Completed first-run PIN: no', 'Completed first-run PIN: yes')
  .replace('Completed first-run transaction password: no', 'Completed first-run transaction password: yes')
  .replace('Skipped first-run email: no', 'Skipped first-run email: yes')
  .replace('Closed first-run success: no', 'Closed first-run success: yes')
  .replace(
    'Expected UI texts: Wallets, E2EWalletTypeTest, Send, Receive',
    'Expected UI texts: Wallets, No wallets, Create new wallet, Import wallet',
  )
  .replace(
    'Expected resource IDs: none',
    'Expected resource IDs: dashboard-header, no-wallets-icon, create-wallet-button, import-wallet-button, navigation-tab-0',
  )
  .replace(
    'Validated empty-dashboard CTA flow: no',
    'Validated empty-dashboard CTA flow: yes',
  )
  .replace(
    'Validated empty-tab navigation: no',
    'Validated empty-tab navigation: yes',
  )
  .replace(
    'Validated QR scanner screen: no',
    'Validated QR scanner screen: yes',
  );
const invalidCleanStateSummary = validSummary.replace('Cleared app data: no', 'Cleared app data: maybe');
const missingScreenshotSummary = validSummary.replace(
  'Screenshot path: package.json',
  'Screenshot path: local-docs/missing.png',
);
const invalidTimestampSummary = validSummary.replace(
  'Generated at: 2026-05-28T14:50:52.705Z',
  'Generated at: 2026-05-28',
);

const assertAccepted = (label, summary) => {
  const errors = getAndroidSmokeSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(error));
    process.exit(1);
  }
};

const assertRejected = (label, summary) => {
  const errors = getAndroidSmokeSummaryErrors(summary);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

const assertEmbeddedAccepted = (label, summary) => {
  const errors = getAndroidEmbeddedSmokeSummaryErrors(summary, {
    expectedArtifactBase: 'android-smoke-dev-release',
  });

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(error));
    process.exit(1);
  }
};

const assertEmbeddedRejected = (label, summary) => {
  const errors = getAndroidEmbeddedSmokeSummaryErrors(summary, {
    expectedArtifactBase: 'android-smoke-dev-release',
  });

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

const assertReleaseApkDigestRejected = (label, summary) => {
  const errors = getAndroidEmbeddedSmokeSummaryErrors(summary, {
    expectedArtifactBase: 'android-smoke-dev-release',
    requireSmokeApkDigest: true,
    expectedSmokeApkPath: 'package.json',
    requireSourceApkDigest: true,
    expectedSourceApkPath: 'package.json',
  });

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

const assertDebugApkDigestAccepted = (label, summary) => {
  const errors = getAndroidSmokeSummaryErrors(summary, {
    requireSmokeApkDigest: true,
    expectedSmokeApkPath: fixtureFilePath,
  });

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(error));
    process.exit(1);
  }
};

const assertDebugApkDigestRejected = (label, summary) => {
  const errors = getAndroidSmokeSummaryErrors(summary, {
    requireSmokeApkDigest: true,
    expectedSmokeApkPath: fixtureFilePath,
  });

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

const assertReleaseApkDigestAccepted = (label, summary) => {
  const errors = getAndroidEmbeddedSmokeSummaryErrors(summary, {
    expectedArtifactBase: 'android-smoke-dev-release',
    requireSmokeApkDigest: true,
    expectedSmokeApkPath: fixtureFilePath,
    requireSourceApkDigest: true,
    expectedSourceApkPath: fixtureFilePath,
  });

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(error));
    process.exit(1);
  }
};

assertAccepted('Valid Android smoke summary fixture', validSummary);
assertAccepted('Valid embedded Android smoke summary fixture', embeddedSummary);
assertEmbeddedAccepted('Valid embedded Android smoke summary fixture', embeddedSummary);
assertDebugApkDigestAccepted('Valid debug Android smoke APK digest fixture', validSummary);
assertRejected('Failed smoke outcome fixture', failedSummary);
assertRejected('Metro unreachable fixture', missingMetroSummary);
assertRejected('Invalid clean-state fixture', invalidCleanStateSummary);
assertRejected('Missing screenshot fixture', missingScreenshotSummary);
assertRejected('Invalid timestamp fixture', invalidTimestampSummary);
assertRejected('Missing resource IDs fixture', validSummary.replace('Expected resource IDs: none\n', ''));
assertRejected(
  'Invalid empty-dashboard CTA fixture',
  validSummary.replace('Validated empty-dashboard CTA flow: no', 'Validated empty-dashboard CTA flow: maybe'),
);
assertRejected(
  'Invalid empty-tab navigation fixture',
  validSummary.replace('Validated empty-tab navigation: no', 'Validated empty-tab navigation: maybe'),
);
assertRejected(
  'Invalid QR scanner screen fixture',
  validSummary.replace('Validated QR scanner screen: no', 'Validated QR scanner screen: maybe'),
);
assertEmbeddedRejected(
  'Embedded smoke without CTA validation fixture',
  embeddedSummary.replace('Validated empty-dashboard CTA flow: yes', 'Validated empty-dashboard CTA flow: no'),
);
assertEmbeddedRejected(
  'Embedded smoke without tab validation fixture',
  embeddedSummary.replace('Validated empty-tab navigation: yes', 'Validated empty-tab navigation: no'),
);
assertEmbeddedRejected(
  'Embedded smoke without QR scanner screen validation fixture',
  embeddedSummary.replace('Validated QR scanner screen: yes', 'Validated QR scanner screen: no'),
);
assertEmbeddedRejected(
  'Embedded smoke without clean onboarding fixture',
  embeddedSummary.replace('Completed first-run PIN: yes', 'Completed first-run PIN: no'),
);
assertEmbeddedRejected(
  'Embedded smoke wrong artifact base fixture',
  embeddedSummary.replace('Artifact base: android-smoke-dev-release', 'Artifact base: android-smoke-dev'),
);
assertDebugApkDigestRejected(
  'Debug smoke missing APK digest fixture',
  validSummary.replace(`Smoke APK sha256: ${fixtureFileSha256}\n`, ''),
);
assertDebugApkDigestRejected(
  'Debug smoke wrong APK path fixture',
  validSummary.replace('Smoke APK path: package.json', 'Smoke APK path: local-docs/missing.apk'),
);
assertReleaseApkDigestAccepted('Embedded release smoke APK digest fixture', embeddedSummary);
assertReleaseApkDigestRejected(
  'Embedded release smoke missing APK digest fixture',
  embeddedSummary.replace(`Smoke APK sha256: ${fixtureFileSha256}\n`, ''),
);
assertReleaseApkDigestRejected(
  'Embedded release smoke wrong source APK path fixture',
  embeddedSummary.replace('Source APK path: package.json', 'Source APK path: local-docs/missing.apk'),
);

console.log('Android smoke summary guard checks are valid.');
