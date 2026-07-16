import assert from 'assert';
import path from 'path';

import {
  BUNDLETOOL_SHA256,
  BUNDLETOOL_VERSION,
  getAndroidAppBundleSummaryErrors,
  getAndroidAppBundleVariantConfig,
  parseAndroidAppBundleVariant,
  supportedAndroidAppBundleVariants,
} from './androidAppBundleValidation.mjs';

const fixtureRoot = path.resolve('D:/fixture/GoldWallet');

assert.deepStrictEqual(supportedAndroidAppBundleVariants, ['dev', 'stage', 'prod', 'beta']);
assert.strictEqual(BUNDLETOOL_VERSION, '1.18.3');
assert.strictEqual(BUNDLETOOL_SHA256, 'a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29');
assert.strictEqual(parseAndroidAppBundleVariant([]), 'prod');
assert.strictEqual(parseAndroidAppBundleVariant(['--variant=stage']), 'stage');
assert.strictEqual(parseAndroidAppBundleVariant(['--variant', 'beta']), 'beta');
assert.throws(() => parseAndroidAppBundleVariant(['--variant=unknown']), /Unsupported Android App Bundle variant: unknown/);
assert.throws(() => parseAndroidAppBundleVariant(['--variant']), /Missing value for --variant/);

const prodConfig = getAndroidAppBundleVariantConfig(fixtureRoot, 'prod');
assert.strictEqual(prodConfig.displayName, 'prodRelease');
assert.strictEqual(prodConfig.gradleTask, ':app:bundleProdRelease');
assert.strictEqual(prodConfig.packageName, 'io.goldwallet.wallet');
assert.strictEqual(
  prodConfig.aabPath,
  path.join(fixtureRoot, 'android', 'app', 'build', 'outputs', 'bundle', 'prodRelease', 'app-prod-release.aab'),
);
assert.strictEqual(prodConfig.apksPath, path.join(fixtureRoot, 'local-docs', 'android-app-bundle-prod-release.apks'));
assert.strictEqual(
  prodConfig.universalApkPath,
  path.join(fixtureRoot, 'local-docs', 'android-app-bundle-prod-release-universal.apk'),
);

const validSummary = [
  'Android App Bundle validation',
  'Variant: prodRelease',
  'Package: io.goldwallet.wallet',
  'Version code: 14',
  'Version name: 6.5.1',
  'Minimum SDK: 26',
  'Target SDK: 36',
  'Bundletool version: 1.18.3',
  `Bundletool SHA-256: ${BUNDLETOOL_SHA256}`,
  'Bundle validation: passed',
  'AAB SHA-256: fixture-aab-hash',
  'APK Set SHA-256: fixture-apks-hash',
  'Universal APK SHA-256: fixture-apk-hash',
  'Emulator smoke: passed',
  'Production signing/upload: not claimed; local debug keystore used for device proof',
  '',
].join('\n');

assert.deepStrictEqual(getAndroidAppBundleSummaryErrors(validSummary, prodConfig), []);
assert(
  getAndroidAppBundleSummaryErrors(validSummary.replace('Target SDK: 36', 'Target SDK: 35'), prodConfig).some(error =>
    error.includes('Target SDK: 36'),
  ),
);
assert(
  getAndroidAppBundleSummaryErrors(validSummary.replace('Emulator smoke: passed', 'Emulator smoke: skipped'), prodConfig).some(
    error => error.includes('Emulator smoke: passed'),
  ),
);

console.log('Android App Bundle validation guard checks passed.');
