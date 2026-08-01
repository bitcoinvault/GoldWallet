import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidReleaseApkManifestErrors, getAndroidReleaseExpectedVariantsFromEnv } from './checkAndroidReleaseApkManifest.mjs';

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-release-manifest-${process.pid}`);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const variant = 'dev';
const apkRelativePath = path.join('local-docs', 'fixture-dev-release.apk');
const apkPath = path.join(fixtureRoot, apkRelativePath);

const badging = [
  "package: name='io.goldwallet.wallet.dev' versionCode='42' versionName='9.8.7' compileSdkVersion='36'",
  "minSdkVersion:'26'",
  "targetSdkVersion:'36'",
  "uses-permission: name='android.permission.POST_NOTIFICATIONS'",
].join('\n');

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const checkFixture = overrides =>
  getAndroidReleaseApkManifestErrors({
    root: fixtureRoot,
    expectedVariants: [variant],
    aapt2Path: 'fixture-aapt2',
    dumpBadging: () => ({
      status: 0,
      output: badging,
      error: '',
    }),
    ...overrides,
  });

try {
  mkdirSync(path.dirname(apkPath), { recursive: true });
  mkdirSync(path.join(fixtureRoot, 'android'), { recursive: true });
  copyFileSync(
    path.join(root, 'android', 'release-version-contract.json'),
    path.join(fixtureRoot, 'android', 'release-version-contract.json'),
  );

  writeFileSync(
    path.join(fixtureRoot, 'local-docs', 'android-release-dev-summary.txt'),
    [
      'Android release validation',
      'Variants: dev',
      `Variant dev Release APK: ${apkRelativePath}`,
      '',
    ].join('\n'),
  );
  writeFileSync(apkPath, 'fixture-apk');
  writeFileSync(
    path.join(fixtureRoot, 'android', 'build.gradle'),
    [
      'ext {',
      "  buildToolsVersion = '36.0.0'",
      '  minSdkVersion = 26',
      '  targetSdkVersion = 36',
      '  compileSdkVersion = 36',
      '}',
      '',
    ].join('\n'),
  );
  writeFileSync(
    path.join(fixtureRoot, 'android', 'release-version.properties'),
    'versionCode=42\nversionName=9.8.7\n',
  );

  const validErrors = checkFixture();
  assert(validErrors.length === 0, `Valid Android release APK manifest fixture should pass, got: ${validErrors.join('; ')}`);
  assert(
    getAndroidReleaseExpectedVariantsFromEnv({ ANDROID_RELEASE_VARIANTS: 'dev' }).join(',') === 'dev',
    'Android release APK manifest checker must respect ANDROID_RELEASE_VARIANTS=dev',
  );

  try {
    getAndroidReleaseExpectedVariantsFromEnv({ ANDROID_RELEASE_VARIANTS: 'unknown' });
    assert(false, 'Android release APK manifest checker must reject unsupported ANDROID_RELEASE_VARIANTS values');
  } catch (error) {
    assert(
      error.message.includes('Unsupported Android release variant(s): unknown'),
      `Unsupported Android release variant error should name invalid variant. Got: ${error.message}`,
    );
  }

  writeFileSync(
    path.join(fixtureRoot, 'android', 'release-version.properties'),
    'versionCode=43\nversionName=9.8.7\n',
  );

  const isolatedRootErrors = checkFixture();
  assert(
    isolatedRootErrors.some(error => error.includes('versionCode mismatch: expected 43, received 42')),
    `Android release APK manifest checker must read release-version.properties from the provided root. Got: ${isolatedRootErrors.join('; ')}`,
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android release APK manifest guard checks are valid.');
