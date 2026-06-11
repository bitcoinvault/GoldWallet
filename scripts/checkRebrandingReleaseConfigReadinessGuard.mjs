import { getRebrandingReleaseConfigReadinessErrors } from './rebrandingReleaseConfigReadinessGuard.mjs';

const files = new Map([
  [
    'package.json',
    JSON.stringify(
      {
        name: 'goldwallet',
        scripts: {
          'android:dev:check-light':
            'yarn check:rebranding-release-config-readiness-guard && yarn check:rebranding-release-config-readiness',
          'rn:baseline:preflight':
            'yarn check:rebranding-release-config-readiness-guard && yarn check:rebranding-release-config-readiness',
          'check:rebranding-release-config-readiness': 'node scripts/checkRebrandingReleaseConfigReadiness.mjs',
          'check:rebranding-release-config-readiness-guard': 'node scripts/checkRebrandingReleaseConfigReadinessGuard.mjs',
          'check:explorer-env-config-readiness': 'node scripts/checkExplorerEnvConfigReadiness.mjs',
          'check:store-metadata-readiness': 'node scripts/checkStoreMetadataReadiness.mjs',
        },
      },
      null,
      2,
    ),
  ],
  [
    'android/app/build.gradle',
    [
      'namespace "io.goldwallet.wallet"',
      "applicationId 'io.goldwallet.wallet.dev'",
      "applicationId 'io.goldwallet.wallet.stage'",
      "applicationId 'io.goldwallet.wallet'",
      "applicationId 'io.goldwallet.wallet.beta'",
      'resValue "string", "build_config_package", "io.goldwallet.wallet"',
    ].join('\n'),
  ],
  [
    'android/app/src/main/AndroidManifest.xml',
    ['<data android:scheme="goldwallet" />', '<data android:scheme="lapp" />', '<data android:scheme="bitcoin" />'].join('\n'),
  ],
  ['android/app/src/prod/values/strings.xml', '<string name="app_name">GoldWallet</string>'],
  ['android/app/src/dev/res/values/strings.xml', '<string name="app_name">GoldWallet Dev</string>'],
  ['android/app/src/stage/res/values/strings.xml', '<string name="app_name">GoldWallet Stage</string>'],
  ['android/app/src/beta/res/values/strings.xml', '<string name="app_name">GoldWallet Beta</string>'],
  [
    'ios/GoldWallet.xcodeproj/project.pbxproj',
    [
      'PRODUCT_BUNDLE_IDENTIFIER = com.minebest.goldwalletbtcv;',
      'PRODUCT_BUNDLE_IDENTIFIER = com.minebest.goldwalletbtcv.dev;',
      'PRODUCT_BUNDLE_IDENTIFIER = com.minebest.goldwalletbtcv.stage;',
      'PRODUCT_BUNDLE_IDENTIFIER = com.minebest.goldwalletbtcv.beta;',
      'INFOPLIST_FILE = GoldWallet/Info.plist;',
      'INFOPLIST_FILE = "GoldWalletDev-Info.plist";',
      'INFOPLIST_FILE = "GoldWalletStage-Info.plist";',
      'INFOPLIST_FILE = "GoldWallet-beta.plist";',
    ].join('\n'),
  ],
  ['ios/GoldWallet/Info.plist', '<string>GoldWallet</string>'],
  ['ios/GoldWalletDev-Info.plist', '<string>GoldWallet Dev</string>'],
  ['ios/GoldWalletStage-Info.plist', '<string>GoldWallet Stage</string>'],
  ['ios/GoldWallet-beta.plist', '<string>$(PRODUCT_NAME)</string>'],
  [
    'src/config/index.ts',
    [
      'APP_ID',
      'APPLICATION_NAME',
      'BTCV_NETWORK',
      'HOSTS',
      'PORT',
      'PROTOCOL',
      'ELECTRUM_X_PROTOCOL_VERSION',
      'EXPLORER_URL',
      'SENTRY_DSN_IOS',
      'SENTRY_DSN_ANDROID',
    ].join('\n'),
  ],
  [
    'docs/rebranding-release-config-readiness.md',
    [
      'Scope: `BEM-37.335`, rebranding and explorer/release-config preparation.',
      'Do not change `APP_ID` without matching Android `applicationId`, Firebase `google-services.json`, iOS bundle identifier, and store metadata.',
      'Do not change `EXPLORER_URL` or Electrum hosts without at least startup smoke, wallet list smoke, and link/address-flow checks.',
      'Do not print Sentry DSNs, CodePush deployment keys, or Firebase app IDs in logs/docs.',
      'Explorer/env alignment',
      'Store metadata refresh',
    ].join('\n'),
  ],
  ['docs/explorer-env-config-readiness.md', 'Do not change `APP_ID` or `APPLICATION_NAME` in env files without the rebranding release-config checklist'],
  [
    'docs/explorer-env-config-readiness.md',
    [
      'Scope: `BEM-37.336`, explorer and env alignment preparation.',
      'Do not print env values in readiness logs or docs.',
      'Explorer changes are not visual-only changes.',
      '`EXPLORER_URL`',
      '`HOSTS`',
      '`ELECTRUM_X_PROTOCOL_VERSION`',
      'Do not change `APP_ID` or `APPLICATION_NAME` in env files without the rebranding release-config checklist',
    ].join('\n'),
  ],
  [
    'docs/store-metadata-readiness.md',
    [
      'Scope: `BEM-37.337`, store metadata and rebranding preparation.',
      'Android Fastlane metadata baseline is present under `android/fastlane/metadata/android/en-US`.',
      'Play Console screenshots still need external/store-side verification.',
      '`GoldWallet`',
      '`goldwallet.io`',
      '`https://github.com/GoldWallet/GoldWallet/issues`',
      'Store metadata must move with rebrand, explorer/network wording, support/privacy URLs, screenshots, and legal/copyright decisions.',
    ].join('\n'),
  ],
  [
    'docs/wallet-modernization-log.md',
    [
      'BEM-37.335 - Rebranding release-config readiness',
      'BEM-37.336 - Explorer env alignment readiness',
      'BEM-37.337 - Store metadata readiness',
    ].join('\n'),
  ],
]);

[
  '.env.dev.testnet',
  '.env.stage.mainnet',
  '.env.prod.mainnet',
  '.env.beta.testnet',
  '.env.beta.mainnet',
  '.env.testnet',
  '.env.test',
].forEach(envPath => {
  files.set(
    envPath,
    'APP_ID=\nAPPLICATION_NAME=\nENVIRONMENT=\nBTCV_NETWORK=\nHOSTS=\nPORT=\nPROTOCOL=\nELECTRUM_X_PROTOCOL_VERSION=\nEXPLORER_URL=',
  );
});

['da', 'en-US', 'es-ES', 'no', 'pt-BR', 'pt-PT', 'ru', 'sv'].forEach(locale => {
  files.set(`ios/fastlane/metadata/${locale}/name.txt`, 'GoldWallet - Bitcoin wallet');
  files.set(`ios/fastlane/metadata/${locale}/privacy_url.txt`, 'https://goldwallet.io/privacy');
  files.set(`ios/fastlane/metadata/${locale}/support_url.txt`, 'https://github.com/GoldWallet/GoldWallet/issues');
  [
    'subtitle.txt',
    'description.txt',
    'keywords.txt',
    'promotional_text.txt',
    'release_notes.txt',
    'marketing_url.txt',
    'apple_tv_privacy_policy.txt',
  ].forEach(fileName => files.set(`ios/fastlane/metadata/${locale}/${fileName}`, 'present'));
});

[
  'app_icon.jpg',
  'watch_icon.jpg',
  'copyright.txt',
  'primary_category.txt',
  'primary_first_sub_category.txt',
  'primary_second_sub_category.txt',
  'secondary_category.txt',
  'secondary_first_sub_category.txt',
  'secondary_second_sub_category.txt',
].forEach(fileName => files.set(`ios/fastlane/metadata/${fileName}`, 'present'));

files.set('android/app/src/main/ic_launcher-playstore.png', 'present');
files.set('android/fastlane/metadata/android/en-US/title.txt', 'GoldWallet');
files.set('android/fastlane/metadata/android/en-US/short_description.txt', 'GoldWallet');
files.set('android/fastlane/metadata/android/en-US/full_description.txt', 'GoldWallet');

[
  'GoldWallet (Debug)',
  'GoldWallet (Release)',
  'GoldWallet Dev (Debug)',
  'GoldWallet Dev (Release)',
  'GoldWallet Stage (Debug)',
  'GoldWallet Stage (Release)',
  'GoldWallet Beta (Debug)',
  'GoldWallet Beta (Release)',
].forEach(schemeName => files.set(`ios/GoldWallet.xcodeproj/xcshareddata/xcschemes/${schemeName}.xcscheme`, 'present'));

const assertAccepted = (label, fixtureFiles = files) => {
  const errors = getRebrandingReleaseConfigReadinessErrors({
    root: '',
    readFile: fullPath => fixtureFiles.get(fullPath.replaceAll('\\', '/')) || '',
    fileExists: fullPath => fixtureFiles.has(fullPath.replaceAll('\\', '/')),
  });

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, mutate, expectedError) => {
  const fixtureFiles = new Map(files);
  mutate(fixtureFiles);
  const errors = getRebrandingReleaseConfigReadinessErrors({
    root: '',
    readFile: fullPath => fixtureFiles.get(fullPath.replaceAll('\\', '/')) || '',
    fileExists: fullPath => fixtureFiles.has(fullPath.replaceAll('\\', '/')),
  });

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid rebranding release-config readiness fixture');
assertRejected(
  'Android application id drift fixture',
  fixture => fixture.set('android/app/build.gradle', fixture.get('android/app/build.gradle').replace("applicationId 'io.goldwallet.wallet.dev'", '')),
  "applicationId 'io.goldwallet.wallet.dev'",
);
assertRejected(
  'iOS bundle id drift fixture',
  fixture =>
    fixture.set(
      'ios/GoldWallet.xcodeproj/project.pbxproj',
      fixture.get('ios/GoldWallet.xcodeproj/project.pbxproj').replace('PRODUCT_BUNDLE_IDENTIFIER = com.minebest.goldwalletbtcv.beta;', ''),
    ),
  'com.minebest.goldwalletbtcv.beta',
);
assertRejected(
  'Missing env key fixture',
  fixture => fixture.set('.env.dev.testnet', fixture.get('.env.dev.testnet').replace('EXPLORER_URL=', '')),
  '.env.dev.testnet is missing required explorer/env key EXPLORER_URL',
);
assertRejected(
  'Missing store metadata fixture',
  fixture => fixture.delete('ios/fastlane/metadata/en-US/name.txt'),
  'ios/fastlane/metadata/en-US/name.txt is missing',
);
assertRejected(
  'Missing package script fixture',
  fixture => {
    const packageJson = JSON.parse(fixture.get('package.json'));
    delete packageJson.scripts['check:rebranding-release-config-readiness'];
    fixture.set('package.json', JSON.stringify(packageJson));
  },
  'package.json is missing check:rebranding-release-config-readiness',
);

console.log('Rebranding release-config readiness guard checks are valid.');
