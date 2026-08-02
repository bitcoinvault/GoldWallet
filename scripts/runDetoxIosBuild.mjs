import { spawnSync } from 'child_process';

const [environment, buildType] = process.argv.slice(2);

const environments = {
  dev: { schemePrefix: 'GoldWallet Dev', appName: 'GoldWallet Dev' },
  stage: { schemePrefix: 'GoldWallet Stage', appName: 'GoldWallet Stage' },
  prod: { schemePrefix: 'GoldWallet', appName: 'GoldWallet' },
};
const buildTypes = {
  debug: 'Debug',
  release: 'Release',
};

if (!environments[environment] || !buildTypes[buildType]) {
  console.error('Usage: node scripts/runDetoxIosBuild.mjs <dev|stage|prod> <debug|release>');
  process.exit(1);
}

if (process.platform !== 'darwin') {
  console.error('iOS Detox builds require macOS with Xcode. Run this command on a Mac runner or developer machine.');
  process.exit(1);
}

const scheme = `${environments[environment].schemePrefix} (${buildTypes[buildType]})`;
const result = spawnSync(
  'xcodebuild',
  [
    '-workspace',
    'ios/GoldWallet.xcworkspace',
    '-scheme',
    scheme,
    '-configuration',
    buildTypes[buildType],
    '-sdk',
    'iphonesimulator',
    '-derivedDataPath',
    'ios/build',
    '-quiet',
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      RN_SRC_EXT: 'e2e.tsx',
      CHAMBER_OF_SECRETS: 'true',
    },
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
