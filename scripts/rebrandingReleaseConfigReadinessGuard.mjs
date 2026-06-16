import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { getExplorerEnvConfigReadinessErrors } from './explorerEnvConfigReadinessGuard.mjs';
import { getStoreMetadataReadinessErrors } from './storeMetadataReadinessGuard.mjs';

const readIfExists = (root, relativePath, readFile = readFileSync, fileExists = existsSync) => {
  const fullPath = path.join(root, ...relativePath.split('/'));
  return fileExists(fullPath) ? readFile(fullPath, 'utf8') : '';
};

const fileExists = (root, relativePath, exists = existsSync) => exists(path.join(root, ...relativePath.split('/')));

export const expectedAndroidReleaseConfigSnippets = [
  ['android/app/build.gradle', 'namespace "io.goldwallet.wallet"'],
  ['android/app/build.gradle', "applicationId 'io.goldwallet.wallet.dev'"],
  ['android/app/build.gradle', "applicationId 'io.goldwallet.wallet.stage'"],
  ['android/app/build.gradle', "applicationId 'io.goldwallet.wallet'"],
  ['android/app/build.gradle', "applicationId 'io.goldwallet.wallet.beta'"],
  ['android/app/build.gradle', 'resValue "string", "build_config_package", "io.goldwallet.wallet"'],
  ['android/app/src/main/AndroidManifest.xml', '<data android:scheme="goldwallet" />'],
  ['android/app/src/main/AndroidManifest.xml', '<data android:scheme="lapp" />'],
  ['android/app/src/main/AndroidManifest.xml', '<data android:scheme="bitcoin" />'],
  ['android/app/src/prod/values/strings.xml', '<string name="app_name">GoldWallet</string>'],
  ['android/app/src/dev/res/values/strings.xml', '<string name="app_name">GoldWallet Dev</string>'],
  ['android/app/src/stage/res/values/strings.xml', '<string name="app_name">GoldWallet Stage</string>'],
  ['android/app/src/beta/res/values/strings.xml', '<string name="app_name">GoldWallet Beta</string>'],
];

export const expectedIosReleaseConfigSnippets = [
  ['ios/GoldWallet.xcodeproj/project.pbxproj', 'PRODUCT_BUNDLE_IDENTIFIER = com.minebest.goldwalletbtcv;'],
  ['ios/GoldWallet.xcodeproj/project.pbxproj', 'PRODUCT_BUNDLE_IDENTIFIER = com.minebest.goldwalletbtcv.dev;'],
  ['ios/GoldWallet.xcodeproj/project.pbxproj', 'PRODUCT_BUNDLE_IDENTIFIER = com.minebest.goldwalletbtcv.stage;'],
  ['ios/GoldWallet.xcodeproj/project.pbxproj', 'PRODUCT_BUNDLE_IDENTIFIER = com.minebest.goldwalletbtcv.beta;'],
  ['ios/GoldWallet.xcodeproj/project.pbxproj', 'PRODUCT_NAME = "GoldWallet Beta";'],
  ['ios/GoldWallet.xcodeproj/project.pbxproj', 'INFOPLIST_FILE = GoldWallet/Info.plist;'],
  ['ios/GoldWallet.xcodeproj/project.pbxproj', 'INFOPLIST_FILE = "GoldWalletDev-Info.plist";'],
  ['ios/GoldWallet.xcodeproj/project.pbxproj', 'INFOPLIST_FILE = "GoldWalletStage-Info.plist";'],
  ['ios/GoldWallet.xcodeproj/project.pbxproj', 'INFOPLIST_FILE = "GoldWallet-beta.plist";'],
  ['ios/GoldWallet/Info.plist', '<string>GoldWallet</string>'],
  ['ios/GoldWalletDev-Info.plist', '<string>GoldWallet Dev</string>'],
  ['ios/GoldWalletStage-Info.plist', '<string>GoldWallet Stage</string>'],
  ['ios/GoldWallet-beta.plist', '<string>$(PRODUCT_NAME)</string>'],
];

export const expectedIosSchemes = [
  'GoldWallet (Debug)',
  'GoldWallet (Release)',
  'GoldWallet Dev (Debug)',
  'GoldWallet Dev (Release)',
  'GoldWallet Stage (Debug)',
  'GoldWallet Stage (Release)',
  'GoldWallet Beta (Debug)',
  'GoldWallet Beta (Release)',
];

export const expectedRebrandingRuntimeSnippets = [
  ['package.json', '"name": "goldwallet"'],
  ['src/config/index.ts', 'APP_ID'],
  ['src/config/index.ts', 'APPLICATION_NAME'],
  ['src/config/index.ts', 'EXPLORER_URL'],
  ['src/config/index.ts', 'SENTRY_DSN_IOS'],
  ['src/config/index.ts', 'SENTRY_DSN_ANDROID'],
];

export const requiredRebrandingDocSnippets = [
  ['docs/rebranding-release-config-readiness.md', 'Scope: `BEM-37.335`, rebranding and explorer/release-config preparation.'],
  ['docs/rebranding-release-config-readiness.md', 'Do not change `APP_ID` without matching Android `applicationId`, Firebase `google-services.json`, iOS bundle identifier, and store metadata.'],
  ['docs/rebranding-release-config-readiness.md', 'Do not change `EXPLORER_URL` or Electrum hosts without at least startup smoke, wallet list smoke, and link/address-flow checks.'],
  ['docs/rebranding-release-config-readiness.md', 'Do not change iOS Beta `PRODUCT_NAME` separately from `GoldWallet-beta.plist`, schemes, bundle identifier, and store metadata.'],
  ['docs/rebranding-release-config-readiness.md', 'Do not print Sentry DSNs, CodePush deployment keys, or Firebase app IDs in logs/docs.'],
  ['docs/explorer-env-config-readiness.md', 'Do not change `APP_ID` or `APPLICATION_NAME` in env files without the rebranding release-config checklist'],
  ['docs/store-metadata-readiness.md', 'Store metadata must move with rebrand, explorer/network wording, support/privacy URLs, screenshots, and legal/copyright decisions.'],
  ['docs/wallet-modernization-log.md', 'BEM-37.335 - Rebranding release-config readiness'],
];

export const requiredRebrandingPackageScripts = [
  'check:rebranding-release-config-readiness',
  'check:rebranding-release-config-readiness-guard',
  'check:explorer-env-config-readiness',
  'check:store-metadata-readiness',
];

export const getRebrandingReleaseConfigReadinessErrors = ({ root, readFile = readFileSync, fileExists: exists = existsSync }) => {
  const errors = [];
  const packageJson = JSON.parse(readIfExists(root, 'package.json', readFile, exists) || '{}');
  const scripts = packageJson.scripts || {};

  [
    ...expectedAndroidReleaseConfigSnippets,
    ...expectedIosReleaseConfigSnippets,
    ...expectedRebrandingRuntimeSnippets,
    ...requiredRebrandingDocSnippets,
  ].forEach(([relativePath, snippet]) => {
    const content = readIfExists(root, relativePath, readFile, exists);
    if (!content.includes(snippet)) {
      errors.push(`${relativePath} is missing "${snippet}"`);
    }
  });

  expectedIosSchemes.forEach(schemeName => {
    const schemePath = `ios/GoldWallet.xcodeproj/xcshareddata/xcschemes/${schemeName}.xcscheme`;
    if (!fileExists(root, schemePath, exists)) {
      errors.push(`${schemePath} is missing`);
    }
  });

  requiredRebrandingPackageScripts.forEach(scriptName => {
    if (!scripts[scriptName]) {
      errors.push(`package.json is missing ${scriptName}`);
    }
  });

  const checkLight = scripts['android:dev:check-light'] || '';
  if (!checkLight.includes('check:rebranding-release-config-readiness-guard')) {
    errors.push('android:dev:check-light must include check:rebranding-release-config-readiness-guard');
  }
  if (!checkLight.includes('check:rebranding-release-config-readiness')) {
    errors.push('android:dev:check-light must include check:rebranding-release-config-readiness');
  }

  const baselinePreflight = scripts['rn:baseline:preflight'] || '';
  if (!baselinePreflight.includes('check:rebranding-release-config-readiness-guard')) {
    errors.push('rn:baseline:preflight must include check:rebranding-release-config-readiness-guard');
  }
  if (!baselinePreflight.includes('check:rebranding-release-config-readiness')) {
    errors.push('rn:baseline:preflight must include check:rebranding-release-config-readiness');
  }

  errors.push(...getExplorerEnvConfigReadinessErrors({ root, readFile, fileExists: exists }));
  errors.push(...getStoreMetadataReadinessErrors({ root, readFile, fileExists: exists }));

  return errors;
};
