import assert from 'assert';
import { createHash } from 'crypto';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import {
  BUNDLETOOL_SHA256,
  BUNDLETOOL_VERSION,
  getAndroidAppBundleArtifactErrors,
  getAndroidAppBundleSummaryErrors,
  getAndroidAppBundleVariantConfig,
  parseAndroidAppBundleVariant,
  supportedAndroidAppBundleVariants,
} from './androidAppBundleValidation.mjs';

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-app-bundle-${process.pid}`);

assert.deepStrictEqual(supportedAndroidAppBundleVariants, ['dev', 'stage', 'prod', 'beta']);
assert.strictEqual(BUNDLETOOL_VERSION, '1.18.3');
assert.strictEqual(BUNDLETOOL_SHA256, 'a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29');
assert.strictEqual(parseAndroidAppBundleVariant([]), 'prod');
assert.strictEqual(parseAndroidAppBundleVariant(['--variant=stage']), 'stage');
assert.strictEqual(parseAndroidAppBundleVariant(['--variant', 'beta']), 'beta');
assert.throws(() => parseAndroidAppBundleVariant(['--variant=unknown']), /Unsupported Android App Bundle variant: unknown/);
assert.throws(() => parseAndroidAppBundleVariant(['--variant']), /Missing value for --variant/);
assert.throws(() => parseAndroidAppBundleVariant(['--variant=']), /Missing value for --variant/);
assert.throws(() => parseAndroidAppBundleVariant(['--variant', '--skip-build']), /Missing value for --variant/);

mkdirSync(path.join(fixtureRoot, 'android', 'app'), { recursive: true });
writeFileSync(
  path.join(fixtureRoot, 'android', 'build.gradle'),
  "ext {\n  buildToolsVersion = '36.0.0'\n  minSdkVersion = 26\n  targetSdkVersion = 36\n}\n",
);
writeFileSync(
  path.join(fixtureRoot, 'android', 'release-version.properties'),
  'versionCode=14\nversionName=6.5.1\n',
);

const prodConfig = getAndroidAppBundleVariantConfig(fixtureRoot, 'prod');
assert.strictEqual(prodConfig.displayName, 'prodRelease');
assert.strictEqual(prodConfig.gradleTask, ':app:bundleProdRelease');
assert.strictEqual(prodConfig.packageName, 'io.goldwallet.wallet');
assert.strictEqual(prodConfig.buildToolsVersion, '36.0.0');
assert.strictEqual(
  prodConfig.aabPath,
  path.join(fixtureRoot, 'android', 'app', 'build', 'outputs', 'bundle', 'prodRelease', 'app-prod-release.aab'),
);
assert.strictEqual(prodConfig.apksPath, path.join(fixtureRoot, 'local-docs', 'android-app-bundle-prod-release.apks'));
assert.strictEqual(
  prodConfig.universalApkPath,
  path.join(fixtureRoot, 'local-docs', 'android-app-bundle-prod-release-universal.apk'),
);
const signedConfig = getAndroidAppBundleVariantConfig(fixtureRoot, 'prod', {
  aabPath: 'local-docs/candidate.aab',
  artifactBase: 'candidate-runtime',
});
assert.strictEqual(signedConfig.aabPath, path.join(fixtureRoot, 'local-docs', 'candidate.aab'));
assert.strictEqual(signedConfig.summaryPath, path.join(fixtureRoot, 'local-docs', 'candidate-runtime-summary.txt'));
assert.throws(
  () => getAndroidAppBundleVariantConfig(fixtureRoot, 'prod', { artifactBase: '../unsafe' }),
  /Invalid Android App Bundle artifact base/,
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
  'AAB page alignment: PAGE_ALIGNMENT_16K',
  'Universal APK 16 KB ZIP alignment: passed',
  'Universal APK 16 KB 64-bit ELF alignment: passed',
  '16 KB required ABIs: arm64-v8a, x86_64',
  '16 KB native libraries checked: 12',
  '16 KB ELF LOAD segments checked: 36',
  '16 KB ignored 32-bit libraries: 12',
  `AAB SHA-256: ${'a'.repeat(64)}`,
  `APK Set SHA-256: ${'b'.repeat(64)}`,
  `Universal APK SHA-256: ${'c'.repeat(64)}`,
  'Emulator smoke: passed',
  'Production signing/upload: not claimed; local debug keystore used for device proof',
  '',
].join('\n');

assert.deepStrictEqual(getAndroidAppBundleSummaryErrors(validSummary, prodConfig), []);

mkdirSync(path.dirname(prodConfig.aabPath), { recursive: true });
writeFileSync(prodConfig.aabPath, 'fixture-aab');
mkdirSync(path.dirname(prodConfig.apksPath), { recursive: true });
writeFileSync(prodConfig.apksPath, 'fixture-apks');
writeFileSync(prodConfig.universalApkPath, 'fixture-universal-apk');
const hash = value => createHash('sha256').update(value).digest('hex');
const artifactSummary = [
  validSummary,
  'AAB bytes: 11',
  `AAB SHA-256: ${hash('fixture-aab')}`,
  'APK Set bytes: 12',
  `APK Set SHA-256: ${hash('fixture-apks')}`,
  'Universal APK bytes: 21',
  `Universal APK SHA-256: ${hash('fixture-universal-apk')}`,
].join('\n');
assert.deepStrictEqual(getAndroidAppBundleArtifactErrors(artifactSummary, prodConfig), []);
writeFileSync(prodConfig.aabPath, 'changed-fixture-aab');
assert(
  getAndroidAppBundleArtifactErrors(artifactSummary, prodConfig).some(error => error.includes('stale for AAB')),
);
assert(
  getAndroidAppBundleSummaryErrors(validSummary.replace('Target SDK: 36', 'Target SDK: 35'), prodConfig).some(error =>
    error.includes('Target SDK: 36'),
  ),
);
assert(
  getAndroidAppBundleSummaryErrors(validSummary.replace('a'.repeat(64), 'not-a-hash'), prodConfig).some(error =>
    error.includes('invalid AAB SHA-256'),
  ),
);
assert(
  getAndroidAppBundleSummaryErrors(validSummary.replace('Emulator smoke: passed', 'Emulator smoke: skipped'), prodConfig).some(
    error => error.includes('Emulator smoke: passed'),
  ),
);
assert(
  getAndroidAppBundleSummaryErrors(
    validSummary.replace(
      'Universal APK 16 KB 64-bit ELF alignment: passed',
      'Universal APK 16 KB 64-bit ELF alignment: failed',
    ),
    prodConfig,
  ).some(error => error.includes('Universal APK 16 KB 64-bit ELF alignment: passed')),
);

rmSync(fixtureRoot, { recursive: true, force: true });

console.log('Android App Bundle validation guard checks passed.');
