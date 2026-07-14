import assert from 'assert';
import path from 'path';
import {
  getAndroidReleaseCreateWalletSmokeVariantConfig,
  getAndroidReleaseSmokeVariantConfig,
  parseAndroidReleaseSmokeVariant,
  supportedAndroidReleaseSmokeVariants,
} from './androidReleaseSmokeVariant.mjs';

const fixtureRoot = path.resolve('D:/fixture/GoldWallet');

assert.deepStrictEqual(supportedAndroidReleaseSmokeVariants, ['dev', 'stage', 'prod', 'beta']);
assert.strictEqual(parseAndroidReleaseSmokeVariant([]), 'dev');
assert.strictEqual(parseAndroidReleaseSmokeVariant(['--variant=prod']), 'prod');
assert.strictEqual(parseAndroidReleaseSmokeVariant(['--variant', 'stage']), 'stage');
assert.throws(() => parseAndroidReleaseSmokeVariant(['--variant=unknown']), /Unsupported Android release smoke variant: unknown/);
assert.throws(() => parseAndroidReleaseSmokeVariant(['--variant']), /Missing value for --variant/);

const prodConfig = getAndroidReleaseSmokeVariantConfig(fixtureRoot, 'prod');
assert.deepStrictEqual(prodConfig, {
  variant: 'prod',
  displayName: 'prodRelease',
  packageName: 'io.goldwallet.wallet',
  unsignedApkPath: path.join(
    fixtureRoot,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'prod',
    'release',
    'app-prod-release-unsigned.apk',
  ),
  alignedApkPath: path.join(fixtureRoot, 'local-docs', 'android-smoke-prod-release-aligned.apk'),
  signedApkPath: path.join(fixtureRoot, 'local-docs', 'android-smoke-prod-release-signed.apk'),
  artifactBase: 'android-smoke-prod-release',
});

const betaConfig = getAndroidReleaseSmokeVariantConfig(fixtureRoot, 'beta');
assert.strictEqual(betaConfig.packageName, 'io.goldwallet.wallet.beta');
assert.strictEqual(betaConfig.displayName, 'betaRelease');
assert.strictEqual(betaConfig.artifactBase, 'android-smoke-beta-release');

const prodCreateWalletConfig = getAndroidReleaseCreateWalletSmokeVariantConfig(fixtureRoot, 'prod');
assert.strictEqual(prodCreateWalletConfig.packageName, 'io.goldwallet.wallet');
assert.strictEqual(prodCreateWalletConfig.activityName, 'io.goldwallet.wallet/io.goldwallet.wallet.MainActivity');
assert.strictEqual(
  prodCreateWalletConfig.signedApkPath,
  path.join(fixtureRoot, 'local-docs', 'android-smoke-prod-release-signed.apk'),
);
assert.strictEqual(prodCreateWalletConfig.artifactBase, 'android-create-wallet-smoke-prod-release');

console.log('Android release smoke variant guard checks passed.');
