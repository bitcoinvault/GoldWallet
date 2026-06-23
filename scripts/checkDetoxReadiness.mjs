import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const detoxConfig = JSON.parse(read('.detoxrc.json'));
const e2eJestConfig = JSON.parse(read('tests/e2e/config.json'));
const androidBuildGradle = read('android/app/build.gradle');
const e2eEnvironment = read('tests/e2e/environment.js');
const e2eUtils = read('tests/e2e/helpers/utils.ts');
const e2eActions = read('tests/e2e/actions.ts');
const e2eOnboardingPage = read('tests/e2e/pageObjects/pages/Onboarding.ts');
const androidDetoxTestRunner = read('scripts/runDetoxAndroidTest.mjs');
const expectedDetoxVersion = packageJson.devDependencies.detox;
const expectedStartDetoxScript = 'node scripts/runDetoxMetro.mjs';
const expectedAndroidDetoxTestScript = 'node scripts/runDetoxAndroidTest.mjs android.emu.dev.debug';
const expectedAndroidAvdName = 'Medium_Phone_API_36.0';
const expectedDetoxJestEntries = {
  reporter: 'detox/runners/jest/reporter',
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
};
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

if (packageJson.scripts?.['test:detox:android:debug'] !== expectedAndroidDetoxTestScript) {
  errors.push(`package.json test:detox:android:debug must use "${expectedAndroidDetoxTestScript}" for Android SDK env handling`);
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

if (e2eJestConfig.testRunner) {
  errors.push('tests/e2e/config.json must not set deprecated testRunner; Jest 27+ uses jest-circus by default');
}

if (e2eJestConfig.testEnvironment !== expectedDetoxJestEntries.testEnvironment) {
  errors.push(`tests/e2e/config.json testEnvironment must be ${expectedDetoxJestEntries.testEnvironment}`);
}

if (e2eJestConfig.globalSetup !== expectedDetoxJestEntries.globalSetup) {
  errors.push(`tests/e2e/config.json globalSetup must be ${expectedDetoxJestEntries.globalSetup}`);
}

if (e2eJestConfig.globalTeardown !== expectedDetoxJestEntries.globalTeardown) {
  errors.push(`tests/e2e/config.json globalTeardown must be ${expectedDetoxJestEntries.globalTeardown}`);
}

if (e2eJestConfig.maxWorkers !== 1) {
  errors.push('tests/e2e/config.json maxWorkers must be 1 for deterministic Detox Android runs');
}

const e2eReporters = e2eJestConfig.reporters || [];
if (!e2eReporters.some(reporter => reporter === expectedDetoxJestEntries.reporter)) {
  errors.push(`tests/e2e/config.json reporters must include ${expectedDetoxJestEntries.reporter}`);
}

if (e2eReporters.some(reporter => reporter === 'detox/runners/jest/streamlineReporter')) {
  errors.push('tests/e2e/config.json must not use deprecated detox/runners/jest/streamlineReporter');
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

if (e2eEnvironment.includes('detox/runners/jest-circus') || e2eEnvironment.includes('SpecReporter') || e2eEnvironment.includes('WorkerAssignReporter')) {
  errors.push('tests/e2e/environment.js must not use deprecated Detox 20 Jest adapters/listeners');
}

if (!e2eEnvironment.includes("require('detox/runners/jest/testEnvironment')")) {
  errors.push('tests/e2e/environment.js must delegate to detox/runners/jest/testEnvironment');
}

if (e2eUtils.includes('detox/src/utils/argparse')) {
  errors.push('tests/e2e/helpers/utils.ts must not use private Detox argparse internals');
}

if (!e2eUtils.includes('process.env.DETOX_CONFIGURATION')) {
  errors.push('tests/e2e/helpers/utils.ts must read the selected Detox configuration from DETOX_CONFIGURATION');
}

if (!e2eActions.includes("options?.closeKeyboard && !text.endsWith('\\n')")) {
  errors.push('tests/e2e/actions.ts closeKeyboard handling must avoid appending duplicate newlines');
}

if (!e2eOnboardingPage.includes('actions.typeText(this.passowrdInput, value, { closeKeyboard: true })')) {
  errors.push('tests/e2e/pageObjects/pages/Onboarding.ts password fields must close the keyboard before tapping footer buttons');
}

for (const snippet of [
  "CHAMBER_OF_SECRETS: 'true'",
  "RN_SRC_EXT: 'e2e.tsx'",
  "LOG_BOX_IGNORE: process.env.LOG_BOX_IGNORE ?? 'true'",
  "path.join(root, 'scripts', 'runDetoxMetro.mjs')",
  'DETOX_REUSE_METRO',
  'DETOX_SKIP_METRO',
  'taskkill',
]) {
  if (!androidDetoxTestRunner.includes(snippet)) {
    errors.push(`scripts/runDetoxAndroidTest.mjs must include ${snippet} for deterministic Android e2e Metro handling`);
  }
}

if (errors.length > 0) {
  console.error('Detox readiness check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Detox readiness check passed for detox@${expectedDetoxVersion}.`);
