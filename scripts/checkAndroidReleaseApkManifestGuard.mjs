import { mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import { getAndroidReleaseApkManifestErrors } from './checkAndroidReleaseApkManifest.mjs';

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-release-manifest-${process.pid}`);
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
  mkdirSync(path.join(fixtureRoot, 'android', 'app'), { recursive: true });

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
    path.join(fixtureRoot, 'android', 'app', 'build.gradle'),
    [
      'android {',
      '  defaultConfig {',
      '    versionCode 42',
      "    versionName '9.8.7'",
      '  }',
      '}',
      '',
    ].join('\n'),
  );

  const validErrors = checkFixture();
  assert(validErrors.length === 0, `Valid Android release APK manifest fixture should pass, got: ${validErrors.join('; ')}`);

  writeFileSync(
    path.join(fixtureRoot, 'android', 'app', 'build.gradle'),
    [
      'android {',
      '  defaultConfig {',
      '    versionCode 43',
      "    versionName '9.8.7'",
      '  }',
      '}',
      '',
    ].join('\n'),
  );

  const isolatedRootErrors = checkFixture();
  assert(
    isolatedRootErrors.some(error => error.includes('versionCode mismatch: expected 43, received 42')),
    `Android release APK manifest checker must read app/build.gradle from the provided root. Got: ${isolatedRootErrors.join('; ')}`,
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android release APK manifest guard checks are valid.');
