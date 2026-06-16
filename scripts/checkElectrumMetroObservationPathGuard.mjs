import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const metroWrapper = readFileSync(path.join(root, 'scripts', 'androidSmokeDevMetro.mjs'), 'utf8');
const metroConfig = readFileSync(path.join(root, 'metro.config.js'), 'utf8');
const startMetroNoMultipart = readFileSync(path.join(root, 'scripts', 'startMetroNoMultipart.mjs'), 'utf8');
const managedMetroObservation = readFileSync(path.join(root, 'scripts', 'runManagedMetroElectrumObservation.mjs'), 'utf8');
const scripts = packageJson.scripts || {};
const errors = [];

const requireScript = (name, expectedSnippet) => {
  if (!scripts[name]) {
    errors.push(`package.json script ${name} is missing`);
    return;
  }

  if (!scripts[name].includes(expectedSnippet)) {
    errors.push(`package.json script ${name} must include ${expectedSnippet}`);
  }
};

requireScript('android:dev:smoke:metro', 'scripts/androidSmokeDevMetro.mjs');
requireScript('start:metro:no-multipart', 'scripts/startMetroNoMultipart.mjs');
requireScript('android:dev:create-wallet-electrum-observe:metro:managed', 'scripts/runManagedMetroElectrumObservation.mjs');
requireScript('android:dev:create-wallet-smoke:metro', 'yarn android:dev:smoke:metro && yarn android:dev:create-wallet-smoke');
requireScript(
  'android:dev:create-wallet-electrum-observe:metro',
  'yarn android:dev:create-wallet-smoke:metro && yarn electrum:runtime:observe && yarn electrum:runtime:check-artifact',
);

[
  "process.env.ANDROID_SMOKE_REQUIRE_METRO ??= 'true'",
  "process.env.ANDROID_SMOKE_OUTPUT_BASENAME ??= 'android-smoke-dev-metro'",
  "process.env.ANDROID_SMOKE_EXPECT_TEXTS ??= 'Wallets,No wallets,Create new wallet,Import wallet'",
  "process.env.ANDROID_SMOKE_CLEAR_APP_DATA ??= 'true'",
  "await import('./androidSmokeDev.mjs')",
].forEach(snippet => {
  if (!metroWrapper.includes(snippet)) {
    errors.push(`scripts/androidSmokeDevMetro.mjs is missing: ${snippet}`);
  }
});

[
  "RN_DISABLE_METRO_MULTIPART: 'true'",
  "LOG_BOX_IGNORE: process.env.LOG_BOX_IGNORE ?? 'true'",
  "const args = ['start', ...process.argv.slice(2)]",
  "require.resolve('react-native/cli.js')",
].forEach(snippet => {
  if (!startMetroNoMultipart.includes(snippet)) {
    errors.push(`scripts/startMetroNoMultipart.mjs is missing: ${snippet}`);
  }
});

[
  "const yarnScriptName = 'android:dev:create-wallet-electrum-observe:metro'",
  'startMetroNoMultipart.mjs',
  'packager-status:running',
  'RN_DISABLE_METRO_MULTIPART',
  "LOG_BOX_IGNORE: process.env.LOG_BOX_IGNORE ?? 'true'",
  'ANDROID_METRO_REUSE_EXISTING',
  'taskkill',
].forEach(snippet => {
  if (!managedMetroObservation.includes(snippet)) {
    errors.push(`scripts/runManagedMetroElectrumObservation.mjs is missing: ${snippet}`);
  }
});

[
  "process.env.RN_DISABLE_METRO_MULTIPART === 'true'",
  "req.headers.accept?.includes('multipart/mixed')",
  "value !== 'multipart/mixed'",
].forEach(snippet => {
  if (!metroConfig.includes(snippet)) {
    errors.push(`metro.config.js is missing: ${snippet}`);
  }
});

if (scripts['android:dev:create-wallet-electrum-observe']?.includes('android:dev:smoke:metro')) {
  errors.push('embedded Electrum observation script must not depend on the Metro smoke path');
}

if (errors.length > 0) {
  console.error('Electrum Metro observation path guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Electrum Metro observation path guard checks are valid.');
