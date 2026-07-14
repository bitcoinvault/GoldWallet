import assert from 'assert';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';

const validSummary = [
  'Generated at: 2026-07-14T20:00:00.000Z',
  'Android create-wallet smoke outcome: passed',
  'Android create-wallet smoke exit code: 0',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet',
  'Android activity: io.goldwallet.wallet/io.goldwallet.wallet.MainActivity',
  'Artifact base: android-create-wallet-smoke-prod-release',
  'Standard wallet name: StdContract',
  'Standard wallet created: yes',
  'Standard mnemonic screen reached: yes',
  'Standard wallet persisted after restart: yes',
  'App process restart completed: yes',
  'Unlock screen reached after restart: yes',
  'Incorrect PIN rejected after restart: yes',
  'Secure window flag on mnemonic screen: yes',
  'Secure window flag after restart: no',
  'Vault wallet name: VaultContract',
  'Vault next-step reached: yes',
  'No create-wallet error UI: yes',
  'Fatal/runtime logcat findings: no',
  'Pre-restart App PID: 1234',
  'App PID: 5678',
  'Captured logcat lines: 100',
  'Screenshot bytes: 200',
].join('\n');

assert.deepStrictEqual(getAndroidCreateWalletSmokeSummaryErrors(validSummary, { requireArtifacts: false }), []);

const samePidSummary = validSummary.replace('App PID: 5678', 'App PID: 1234');
assert.ok(
  getAndroidCreateWalletSmokeSummaryErrors(samePidSummary, { requireArtifacts: false }).some(error =>
    error.includes('must differ after a process restart'),
  ),
);

const missingWrongPinProof = validSummary.replace('Incorrect PIN rejected after restart: yes\n', '');
assert.ok(
  getAndroidCreateWalletSmokeSummaryErrors(missingWrongPinProof, { requireArtifacts: false }).some(error =>
    error.includes('Incorrect PIN rejected after restart: yes'),
  ),
);

const secretLeakingSummary = `${validSummary}\nMnemonic: abandon abandon abandon\nPrivate key: L123`;
assert.ok(
  getAndroidCreateWalletSmokeSummaryErrors(secretLeakingSummary, { requireArtifacts: false }).some(error =>
    error.includes('secret-bearing fields'),
  ),
);

console.log('Android create-wallet smoke summary guard checks passed.');
