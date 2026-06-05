import { getAndroidEmbeddedSmokeSummaryErrors, getAndroidSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';

const validSummary = [
  'Generated at: 2026-05-28T14:50:52.705Z',
  'Android smoke outcome: passed',
  'Android smoke exit code: 0',
  'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet.dev',
  'Artifact base: android-smoke-dev',
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

assertAccepted('Valid Android smoke summary fixture', validSummary);
assertAccepted('Valid embedded Android smoke summary fixture', embeddedSummary);
assertEmbeddedAccepted('Valid embedded Android smoke summary fixture', embeddedSummary);
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
assertEmbeddedRejected(
  'Embedded smoke without CTA validation fixture',
  embeddedSummary.replace('Validated empty-dashboard CTA flow: yes', 'Validated empty-dashboard CTA flow: no'),
);
assertEmbeddedRejected(
  'Embedded smoke without tab validation fixture',
  embeddedSummary.replace('Validated empty-tab navigation: yes', 'Validated empty-tab navigation: no'),
);
assertEmbeddedRejected(
  'Embedded smoke without clean onboarding fixture',
  embeddedSummary.replace('Completed first-run PIN: yes', 'Completed first-run PIN: no'),
);
assertEmbeddedRejected(
  'Embedded smoke wrong artifact base fixture',
  embeddedSummary.replace('Artifact base: android-smoke-dev-release', 'Artifact base: android-smoke-dev'),
);

console.log('Android smoke summary guard checks are valid.');
