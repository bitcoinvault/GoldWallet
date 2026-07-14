import assert from 'assert';
import path from 'path';

import { getAndroidReleaseImportWalletSmokeVariantConfig } from './androidReleaseSmokeVariant.mjs';
import { getAndroidImportWalletSmokeSummaryErrors } from './checkAndroidImportWalletSmokeSummary.mjs';

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
    expectedApkPath: prodConfig.signedApkPath,
    expectedArtifactBase: prodConfig.artifactBase,
    requireArtifacts: false,
  }),
  [],
);

const failedSummary = validSummary
  .replace('Android import-wallet smoke outcome: passed', 'Android import-wallet smoke outcome: failed')
  .replace('Imported wallet visible on dashboard: yes', 'Imported wallet visible on dashboard: no');

assert.ok(getAndroidImportWalletSmokeSummaryErrors(failedSummary, { requireArtifacts: false }).length >= 2);

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
