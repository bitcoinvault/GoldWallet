import assert from 'assert';
import path from 'path';

import { getAndroidReleaseImportWalletSmokeVariantConfig } from './androidReleaseSmokeVariant.mjs';
import {
  getAndroidImportWalletControlledNetworkBlockerSummaryErrors,
  getAndroidImportWalletSmokeStepStatus,
  getAndroidImportWalletSmokeSummaryErrors,
} from './checkAndroidImportWalletSmokeSummary.mjs';

const fixtureRoot = path.resolve('D:/fixture/GoldWallet');
const prodConfig = getAndroidReleaseImportWalletSmokeVariantConfig(fixtureRoot, 'prod');

assert.strictEqual(prodConfig.packageName, 'io.goldwallet.wallet');
assert.strictEqual(prodConfig.activityName, 'io.goldwallet.wallet/io.goldwallet.wallet.MainActivity');
assert.strictEqual(
  prodConfig.signedApkPath,
  path.join(fixtureRoot, 'local-docs', 'android-smoke-prod-release-signed.apk'),
);
assert.strictEqual(prodConfig.artifactBase, 'android-import-wallet-smoke-prod-release');

const validSummary = [
  'Generated at: 2026-07-14T12:00:00.000Z',
  'Android import-wallet smoke outcome: passed',
  'Android import-wallet smoke exit code: 0',
  'Android import-wallet smoke reason: completed',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet',
  'Android activity: io.goldwallet.wallet/io.goldwallet.wallet.MainActivity',
  'Artifact base: android-import-wallet-smoke-prod-release',
  `Source APK path: ${prodConfig.signedApkPath}`,
  'Source APK bytes: 123',
  `Source APK sha256: ${'a'.repeat(64)}`,
  'Import fixture type: public-watch-only-address',
  'Import fixture address: royale1q3c4dwjwr4k9f40tdy373zy4mmuwd52p95ell7u',
  'Imported wallet name: ImportSmoke120000',
  'Import success screen reached: yes',
  'Imported wallet visible on dashboard: yes',
  'App process restart completed: yes',
  'Unlock screen reached after restart: yes',
  'Incorrect PIN rejected after restart: yes',
  'Imported wallet visible after restart: yes',
  'No import-wallet error UI: yes',
  'Secure window flag after import: no',
  'Secure window flag after restart: no',
  'Fatal/runtime logcat findings: no',
  'Pre-restart App PID: 1233',
  'App PID: 1234',
  'Captured logcat lines: 10',
  'UI hierarchy path: D:\\fixture\\ui.xml',
  'Logcat path: D:\\fixture\\logcat.txt',
  'Screenshot path: D:\\fixture\\screen.png',
  'Screenshot bytes: 123',
].join('\n');

assert.deepStrictEqual(
  getAndroidImportWalletSmokeSummaryErrors(validSummary, {
    expectedActivityName: prodConfig.activityName,
    expectedApkPath: prodConfig.signedApkPath,
    expectedArtifactBase: prodConfig.artifactBase,
    expectedPackageName: prodConfig.packageName,
    requireArtifacts: false,
  }),
  [],
);

const failedSummary = validSummary
  .replace('Android import-wallet smoke outcome: passed', 'Android import-wallet smoke outcome: failed')
  .replace('Imported wallet visible on dashboard: yes', 'Imported wallet visible on dashboard: no');

assert.ok(getAndroidImportWalletSmokeSummaryErrors(failedSummary, { requireArtifacts: false }).length >= 2);

assert.ok(
  getAndroidImportWalletSmokeSummaryErrors(validSummary, {
    expectedPackageName: 'io.goldwallet.wallet.dev',
    requireArtifacts: false,
  }).some(error => error.includes('Android package must be io.goldwallet.wallet.dev')),
);

const contradictoryControlledNetworkBlockerSummary = validSummary
  .replace('Android import-wallet smoke outcome: passed', 'Android import-wallet smoke outcome: failed')
  .replace('Android import-wallet smoke exit code: 0', 'Android import-wallet smoke exit code: 1')
  .replace('Android import-wallet smoke reason: completed', 'Android import-wallet smoke reason: Import-wallet blocked by no-network UI.');

assert.ok(
  getAndroidImportWalletControlledNetworkBlockerSummaryErrors(contradictoryControlledNetworkBlockerSummary, {
    requireArtifacts: false,
  }).some(error => error.includes('Import success screen reached: no')),
  'Controlled no-network evidence must reject contradictory success-state fields',
);

const controlledNetworkBlockerSummary = contradictoryControlledNetworkBlockerSummary
  .replace('Import success screen reached: yes', 'Import success screen reached: no')
  .replace('Imported wallet visible on dashboard: yes', 'Imported wallet visible on dashboard: no')
  .replace('App process restart completed: yes', 'App process restart completed: no')
  .replace('Unlock screen reached after restart: yes', 'Unlock screen reached after restart: no')
  .replace('Incorrect PIN rejected after restart: yes', 'Incorrect PIN rejected after restart: no')
  .replace('Imported wallet visible after restart: yes', 'Imported wallet visible after restart: no')
  .replace('No import-wallet error UI: yes', 'No import-wallet error UI: no')
  .replace('Secure window flag after import: no', 'Secure window flag after import: not checked')
  .replace('Secure window flag after restart: no', 'Secure window flag after restart: not checked');

assert.deepStrictEqual(
  getAndroidImportWalletControlledNetworkBlockerSummaryErrors(controlledNetworkBlockerSummary, {
    expectedActivityName: prodConfig.activityName,
    expectedApkPath: prodConfig.signedApkPath,
    expectedArtifactBase: prodConfig.artifactBase,
    expectedPackageName: prodConfig.packageName,
    requireArtifacts: false,
  }),
  [],
);

assert.ok(
  getAndroidImportWalletControlledNetworkBlockerSummaryErrors(
    controlledNetworkBlockerSummary.replace(
      'Android import-wallet smoke reason: Import-wallet blocked by no-network UI.',
      'Android import-wallet smoke reason: Import-wallet error UI is visible.',
    ),
    { requireArtifacts: false },
  ).some(error => error.includes('controlled network blocker line')),
);

assert.strictEqual(
  getAndroidImportWalletSmokeStepStatus({
    status: 1,
    summary: controlledNetworkBlockerSummary,
    evidenceVariant: 'dev',
    evidenceOptions: {
      expectedActivityName: prodConfig.activityName,
      expectedApkPath: prodConfig.signedApkPath,
      expectedArtifactBase: prodConfig.artifactBase,
      expectedPackageName: prodConfig.packageName,
      requireArtifacts: false,
    },
  }),
  0,
);
assert.strictEqual(
  getAndroidImportWalletSmokeStepStatus({
    status: 1,
    summary: controlledNetworkBlockerSummary,
    evidenceVariant: 'prod',
    evidenceOptions: { requireArtifacts: false },
  }),
  1,
  'Production import-wallet failures must never use the dev-only controlled network fallback',
);
assert.strictEqual(
  getAndroidImportWalletSmokeStepStatus({
    status: 1,
    summary: controlledNetworkBlockerSummary.replace(
      'Android import-wallet smoke reason: Import-wallet blocked by no-network UI.',
      'Android import-wallet smoke reason: Import-wallet error UI is visible.',
    ),
    evidenceVariant: 'dev',
    evidenceOptions: { requireArtifacts: false },
  }),
  1,
);
assert.strictEqual(
  getAndroidImportWalletSmokeStepStatus({
    status: 1,
    summary: controlledNetworkBlockerSummary,
    evidenceVariant: 'dev',
    evidenceOptions: {
      minimumGeneratedAtMs: Date.parse('2026-07-14T12:00:01.000Z'),
      requireArtifacts: false,
    },
  }),
  1,
);

assert.ok(
  getAndroidImportWalletSmokeSummaryErrors(validSummary, {
    expectedActivityName: 'io.goldwallet.wallet.dev/io.goldwallet.wallet.MainActivity',
    requireArtifacts: false,
  }).some(error => error.includes('Android activity must be io.goldwallet.wallet.dev/io.goldwallet.wallet.MainActivity')),
);

const missingRestartEvidenceSummary = validSummary.replace('App process restart completed: yes\n', '');

assert.ok(
  getAndroidImportWalletSmokeSummaryErrors(missingRestartEvidenceSummary, { requireArtifacts: false }).some(error =>
    error.includes('App process restart completed: yes'),
  ),
);

const unchangedProcessSummary = validSummary.replace('Pre-restart App PID: 1233', 'Pre-restart App PID: 1234');

assert.ok(
  getAndroidImportWalletSmokeSummaryErrors(unchangedProcessSummary, { requireArtifacts: false }).some(error =>
    error.includes('must differ'),
  ),
);

const secretLeakingSummary = `${validSummary}\nMnemonic: abandon abandon abandon\nPrivate key: L123`;

assert.ok(
  getAndroidImportWalletSmokeSummaryErrors(secretLeakingSummary, { requireArtifacts: false }).some(error =>
    error.includes('secret-bearing fields'),
  ),
);

console.log('Android import-wallet smoke summary guard checks passed.');
