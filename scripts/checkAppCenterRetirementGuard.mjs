import assert from 'assert';
import { readFileSync } from 'fs';

import { getAppCenterRetirementErrors } from './appCenterRetirementGuard.mjs';
import { getAppCenterReleaseArtifactErrors } from './appCenterReleaseArtifactGuard.mjs';

const cleanInventory = {
  dependencyNames: [],
  trackedFiles: [],
  trackedFileContents: {},
};

assert.deepStrictEqual(getAppCenterRetirementErrors(cleanInventory), []);
assert.ok(
  getAppCenterRetirementErrors({
    ...cleanInventory,
    trackedFiles: ['android/app/src/main/assets/appcenter-config.json'],
  }).some(error => error.includes('appcenter-config.json')),
);
assert.ok(
  getAppCenterRetirementErrors({
    ...cleanInventory,
    trackedFileContents: {
      'android/app/src/main/res/values/strings.xml':
        '<string name="appCenterCrashes_whenToSendCrashes">ASK_JAVASCRIPT</string>',
    },
  }).some(error => error.includes('appCenterCrashes_whenToSendCrashes')),
);
assert.ok(
  getAppCenterRetirementErrors({
    ...cleanInventory,
    trackedFileContents: {
      'ios/GoldWallet.xcodeproj/project.pbxproj': 'AppCenter-Config.plist in Resources',
    },
  }).some(error => error.includes('AppCenter-Config.plist')),
);
assert.ok(
  getAppCenterRetirementErrors({
    ...cleanInventory,
    dependencyNames: ['appcenter-crashes'],
  }).some(error => error.includes('appcenter-crashes')),
);

assert.deepStrictEqual(
  getAppCenterReleaseArtifactErrors({
    dev: { files: '/assets/index.android.bundle', resources: 'io.goldwallet.wallet.dev.R$string int app_name' },
    prod: { files: '/assets/index.android.bundle', resources: 'io.goldwallet.wallet.R$string int app_name' },
  }),
  [],
);
assert.ok(
  getAppCenterReleaseArtifactErrors({
    prod: {
      files: '/assets/appcenter-config.json',
      resources: 'io.goldwallet.wallet.R$string int appCenterAnalytics_whenToEnableAnalytics',
    },
  }).some(error => error.includes('App Center artifact marker')),
);

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(packageJson.scripts['check:appcenter-retirement-guard'], 'node scripts/checkAppCenterRetirementGuard.mjs');
assert.equal(packageJson.scripts['check:appcenter-retirement'], 'node scripts/checkAppCenterRetirement.mjs');
assert.equal(
  packageJson.scripts['android:dev:release:check-appcenter-apks'],
  'node scripts/checkAndroidReleaseAppCenterArtifacts.mjs',
);
assert.match(packageJson.scripts['android:dev:check-light'], /check:appcenter-retirement/);
assert.match(packageJson.scripts['android:dev:release:verify-local'], /android:dev:release:check-appcenter-apks/);

console.log('App Center retirement guard checks are valid.');
