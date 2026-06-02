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
const errors = [];

if (!expectedDetoxVersion) {
  errors.push('package.json is missing devDependencies.detox');
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

const androidApps = Object.entries(detoxConfig.apps || {}).filter(([, app]) => app.type === 'android.apk');
for (const [appName, app] of androidApps) {
  if (!app.build?.startsWith('node scripts/runDetoxAndroidBuild.mjs ')) {
    errors.push(`${appName} must use scripts/runDetoxAndroidBuild.mjs for a cross-platform Android Detox build`);
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
