import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const detoxConfig = JSON.parse(read('.detoxrc.json'));
const androidBuildGradle = read('android/app/build.gradle');
const e2eEnvironment = read('tests/e2e/environment.js');
const expectedDetoxVersion = packageJson.devDependencies.detox;
const expectedStartDetoxScript = 'node scripts/runDetoxMetro.mjs';
const expectedAndroidAvdName = 'Medium_Phone_API_36.0';
const errors = [];
const expectedIosApps = new Map([
  ['ios.dev.debug', { build: 'node scripts/runDetoxIosBuild.mjs dev debug', binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/GoldWallet Dev.app' }],
  ['ios.dev.release', { build: 'node scripts/runDetoxIosBuild.mjs dev release', binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/GoldWallet Dev.app' }],
  ['ios.stage.debug', { build: 'node scripts/runDetoxIosBuild.mjs stage debug', binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/GoldWallet Stage.app' }],
  ['ios.stage.release', { build: 'node scripts/runDetoxIosBuild.mjs stage release', binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/GoldWallet Stage.app' }],
  ['ios.prod.debug', { build: 'node scripts/runDetoxIosBuild.mjs prod debug', binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/GoldWallet.app' }],
  ['ios.prod.release', { build: 'node scripts/runDetoxIosBuild.mjs prod release', binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/GoldWallet.app' }],
]);

if (!expectedDetoxVersion) {
  errors.push('package.json is missing devDependencies.detox');
}

if (packageJson.scripts?.['start:detox'] !== expectedStartDetoxScript) {
  errors.push(`package.json start:detox must use "${expectedStartDetoxScript}" for cross-platform env handling`);
}

if (expectedDetoxVersion && !androidBuildGradle.includes(`androidTestImplementation('com.wix:detox:${expectedDetoxVersion}')`)) {
  errors.push(`android/app/build.gradle androidTestImplementation must match detox@${expectedDetoxVersion}`);
}

if (detoxConfig.runnerConfig) {
  errors.push('.detoxrc.json must not use deprecated runnerConfig');
}

if (typeof detoxConfig.testRunner !== 'object' || detoxConfig.testRunner?.args?.$0 !== 'jest') {
  errors.push('.detoxrc.json testRunner must use the Detox 20 object format with args.$0 = jest');
}

if (detoxConfig.testRunner?.args?.config !== 'tests/e2e/config.json') {
  errors.push('.detoxrc.json testRunner.args.config must point to tests/e2e/config.json');
}

if (detoxConfig.devices?.['pixel.emu']?.device?.avdName !== expectedAndroidAvdName) {
  errors.push(`.detoxrc.json pixel.emu must use Android validation AVD ${expectedAndroidAvdName}`);
}

const androidApps = Object.entries(detoxConfig.apps || {}).filter(([, app]) => app.type === 'android.apk');
for (const [appName, app] of androidApps) {
  if (!app.build?.startsWith('node scripts/runDetoxAndroidBuild.mjs ')) {
    errors.push(`${appName} must use scripts/runDetoxAndroidBuild.mjs for a cross-platform Android Detox build`);
  }
}

const iosApps = Object.entries(detoxConfig.apps || {}).filter(([, app]) => app.type === 'ios.app');
if (iosApps.length !== expectedIosApps.size) {
  errors.push(`.detoxrc.json must define ${expectedIosApps.size} iOS Detox apps, found ${iosApps.length}`);
}

for (const [appName, expected] of expectedIosApps) {
  const app = detoxConfig.apps?.[appName];

  if (!app) {
    errors.push(`.detoxrc.json is missing ${appName}`);
    continue;
  }

  if (app.build !== expected.build) {
    errors.push(`${appName} must use "${expected.build}"`);
  }

  if (app.binaryPath !== expected.binaryPath) {
    errors.push(`${appName} binaryPath must be ${expected.binaryPath}`);
  }
}

for (const [appName, app] of iosApps) {
  if (app.build?.includes('GoldWallet Prod')) {
    errors.push(`${appName} references non-existent GoldWallet Prod iOS scheme`);
  }

  if (!app.build?.startsWith('node scripts/runDetoxIosBuild.mjs ')) {
    errors.push(`${appName} must use scripts/runDetoxIosBuild.mjs for guarded iOS Detox build mapping`);
  }
}

if (e2eEnvironment.includes('detox/runners/jest-circus')) {
  errors.push('tests/e2e/environment.js must use detox/runners/jest instead of the deprecated jest-circus path');
}

if (errors.length > 0) {
  console.error('Detox readiness check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Detox readiness check passed for detox@${expectedDetoxVersion}.`);
