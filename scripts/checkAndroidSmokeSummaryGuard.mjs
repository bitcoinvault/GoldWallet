import { getAndroidSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';

const validSummary = [
  'Generated at: 2026-05-28T14:50:52.705Z',
  'Android smoke outcome: passed',
  'Android smoke exit code: 0',
  'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet.dev',
  'Metro required: yes',
  'Metro endpoint: 127.0.0.1:8081',
  'Metro reachable: yes',
  'Cleared app data: no',
  'Expected UI texts: Wallets, E2EWalletTypeTest, Send, Receive',
  'App PID: 21294',
  'Captured logcat lines: 211',
  'UI hierarchy attempts: 2',
  'UI hierarchy path: package.json',
  'Screenshot path: package.json',
  'Screenshot bytes: 154489',
].join('\n');

const failedSummary = validSummary.replace('Android smoke outcome: passed', 'Android smoke outcome: failed');
const missingMetroSummary = validSummary.replace('Metro reachable: yes', 'Metro reachable: no');
const embeddedSummary = validSummary
  .replace('Metro required: yes', 'Metro required: no')
  .replace('Metro reachable: yes', 'Metro reachable: no')
  .replace('Cleared app data: no', 'Cleared app data: yes')
  .replace(
    'Expected UI texts: Wallets, E2EWalletTypeTest, Send, Receive',
    'Expected UI texts: Wallets, No wallets, Create new wallet, Import wallet',
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

assertAccepted('Valid Android smoke summary fixture', validSummary);
assertAccepted('Valid embedded Android smoke summary fixture', embeddedSummary);
assertRejected('Failed smoke outcome fixture', failedSummary);
assertRejected('Metro unreachable fixture', missingMetroSummary);
assertRejected('Invalid clean-state fixture', invalidCleanStateSummary);
assertRejected('Missing screenshot fixture', missingScreenshotSummary);
assertRejected('Invalid timestamp fixture', invalidTimestampSummary);

console.log('Android smoke summary guard checks are valid.');
