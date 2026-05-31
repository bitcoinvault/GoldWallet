import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import {
  expectedIosSchemeConfigs,
  getIosSchemeConfigErrors,
  parseIosSchemeConfig,
} from './iosSchemeConfigGuard.mjs';
import { getSentryReleaseIntegrationErrors } from './sentryReleaseIntegrationGuard.mjs';

const require = createRequire(import.meta.url);
const plist = require('plist');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const localDocsDir = path.join(root, 'local-docs');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const parsePlist = relativePath => plist.parse(read(relativePath));

const compareVersions = (left, right) => {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] || 0;
    const rightPart = rightParts[index] || 0;
    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
};

const getLockedPodVersion = (podfileLock, podName) => {
  const escapedPodName = podName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = podfileLock.match(new RegExp(`^  - ${escapedPodName} \\(([^)]+)\\)`, 'm'));

  return match ? match[1] : null;
};

const normalizePackageVersion = version => (version || '').replace(/^[~^]/, '');

const collectIosReleaseReadiness = () => {
  const errors = [];
  const warnings = [];
  const schemesDir = path.join(root, 'ios', 'GoldWallet.xcodeproj', 'xcshareddata', 'xcschemes');
  const requiredFiles = [
    'ios/GoldWallet.xcworkspace',
    'ios/GoldWallet.xcodeproj/project.pbxproj',
    'ios/Podfile',
    'ios/Podfile.lock',
    'ios/GoldWallet/Info.plist',
    'ios/GoldWalletDev-Info.plist',
    'ios/GoldWalletStage-Info.plist',
    'ios/GoldWallet-beta.plist',
    'ios/GoogleService-Info-dev.plist',
    'ios/GoogleService-Info-prod.plist',
    'ios/GoogleService-Info-stage.plist',
    'ios/GoogleService-Info.plist',
    ...[...expectedIosSchemeConfigs.keys()].map(schemeFile =>
      path.join('ios', 'GoldWallet.xcodeproj', 'xcshareddata', 'xcschemes', schemeFile).replace(/\\/g, '/'),
    ),
  ];

  requiredFiles.forEach(relativePath => {
    if (!exists(relativePath)) {
      errors.push(`Missing required iOS release file: ${relativePath}`);
    }
  });

  const packageJson = JSON.parse(read('package.json'));
  const podfileLock = read('ios/Podfile.lock');
  const rnHelpers = read('node_modules/react-native/scripts/cocoapods/helpers.rb');
  const rnMinIosMatch = rnHelpers.match(/min_ios_version_supported\s*\n\s*return '([^']+)'/);
  const rnMinXcodeMatch = rnHelpers.match(/min_xcode_version_supported\s*\n\s*return '([^']+)'/);
  const rnMinIosVersion = rnMinIosMatch ? rnMinIosMatch[1] : null;
  const rnMinXcodeVersion = rnMinXcodeMatch ? rnMinXcodeMatch[1] : null;

  if (!rnMinIosVersion) {
    errors.push('Unable to read React Native minimum iOS version from node_modules/react-native/scripts/cocoapods/helpers.rb');
  }

  const podfile = read('ios/Podfile');
  const podfilePlatformMatch = podfile.match(/platform :ios, '([^']+)'/);
  const podfilePlatform = podfilePlatformMatch ? podfilePlatformMatch[1] : null;

  if (!podfilePlatform) {
    errors.push('ios/Podfile is missing platform :ios');
  } else if (rnMinIosVersion && compareVersions(podfilePlatform, rnMinIosVersion) < 0) {
    errors.push(`ios/Podfile platform is ${podfilePlatform}; React Native ${packageJson.dependencies['react-native']} requires at least ${rnMinIosVersion}`);
  }

  if (!podfile.includes(':hermes_enabled => true')) {
    errors.push('ios/Podfile is not configured with Hermes enabled');
  }

  const podfileLockDriftIssues = [];
  const reactNativeVersion = normalizePackageVersion(packageJson.dependencies['react-native']);
  const reactCoreLockVersion = getLockedPodVersion(podfileLock, 'React-Core');

  if (reactCoreLockVersion && reactCoreLockVersion !== reactNativeVersion) {
    podfileLockDriftIssues.push(`ios/Podfile.lock has React-Core ${reactCoreLockVersion}; package.json has react-native ${reactNativeVersion}`);
  }

  [
    { podName: 'react-native-camera', matchNames: ['react-native-camera'], reason: 'after the CameraKit migration' },
    { podName: 'react-native-qrcode-local-image', matchNames: ['react-native-qrcode-local-image'], reason: 'after the QR local-image cleanup' },
    {
      podName: 'RNCMaskedView',
      matchNames: ['RNCMaskedView', '@react-native-community/masked-view'],
      reason: 'after the React Navigation 7 masked-view removal',
    },
  ].forEach(({ podName, matchNames, reason }) => {
    if (matchNames.some(matchName => podfileLock.includes(matchName))) {
      podfileLockDriftIssues.push(`ios/Podfile.lock still references removed ${podName}; run pod install on macOS ${reason}`);
    }
  });

  [
    ['RNBootSplash', 'react-native-bootsplash'],
    ['react-native-config', 'react-native-config'],
    ['RNCAsyncStorage', '@react-native-async-storage/async-storage'],
    ['RNDeviceInfo', 'react-native-device-info'],
    ['RNFastImage', 'react-native-fast-image'],
    ['RNFBApp', '@react-native-firebase/app'],
    ['RNGestureHandler', 'react-native-gesture-handler'],
    ['RNLocalize', 'react-native-localize'],
    ['RNScreens', 'react-native-screens'],
    ['RNSentry', '@sentry/react-native'],
    ['RNVectorIcons', 'react-native-vector-icons'],
  ].forEach(([podName, packageName]) => {
    const lockedVersion = getLockedPodVersion(podfileLock, podName);
    const packageVersion = normalizePackageVersion(packageJson.dependencies[packageName]);

    if (lockedVersion && packageVersion && lockedVersion !== packageVersion) {
      podfileLockDriftIssues.push(`ios/Podfile.lock has ${podName} ${lockedVersion}; package.json has ${packageName} ${packageVersion}`);
    }
  });

  const pbxproj = read('ios/GoldWallet.xcodeproj/project.pbxproj');
  const sentryReleaseIntegrationErrors = getSentryReleaseIntegrationErrors({
    androidBuildGradle: read('android/app/build.gradle'),
    iosProject: pbxproj,
  });
  errors.push(...sentryReleaseIntegrationErrors);
  const sentryBundlePhaseCount = (pbxproj.match(/@sentry\/cli\/bin\/sentry-cli react-native xcode/g) || []).length;
  const sentryDsymPhaseCount = (pbxproj.match(/@sentry\/cli\/bin\/sentry-cli upload-dsym/g) || []).length;

  const deploymentTargets = [...pbxproj.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([0-9.]+);/g)].map(match => match[1]);
  if (deploymentTargets.length === 0) {
    errors.push('No IPHONEOS_DEPLOYMENT_TARGET entries found in ios/GoldWallet.xcodeproj/project.pbxproj');
  }
  const tooLowDeploymentTargets = [...new Set(deploymentTargets.filter(version => rnMinIosVersion && compareVersions(version, rnMinIosVersion) < 0))];
  if (tooLowDeploymentTargets.length > 0) {
    errors.push(
      `Xcode project has IPHONEOS_DEPLOYMENT_TARGET below React Native minimum ${rnMinIosVersion}: ${tooLowDeploymentTargets.join(', ')}`,
    );
  }

  const requiredTargets = ['GoldWallet', 'GoldWallet Beta', 'GoldWallet Stage', 'GoldWallet Dev'];
  requiredTargets.forEach(targetName => {
    if (!pbxproj.includes(`target = ${targetName}`) && !pbxproj.includes(`/* ${targetName} */`)) {
      errors.push(`Xcode project appears to be missing target ${targetName}`);
    }
  });

  const actualSchemeConfigs = new Map();

  [...expectedIosSchemeConfigs.keys()].forEach(schemeFile => {
    const schemePath = path.join(schemesDir, schemeFile);

    if (existsSync(schemePath)) {
      actualSchemeConfigs.set(schemeFile, parseIosSchemeConfig(readFileSync(schemePath, 'utf8')));
    }
  });

  errors.push(...getIosSchemeConfigErrors(actualSchemeConfigs));

  const expectedIosScripts = {
    'ios:dev': "react-native run-ios --scheme='GoldWallet Dev (Debug)'",
    'ios:stage': "react-native run-ios --scheme='GoldWallet Stage (Debug)'",
    'ios:beta': "react-native run-ios --scheme='GoldWallet Beta (Debug)'",
    'ios:prod': "react-native run-ios --scheme='GoldWallet (Debug)'",
    'ios:dev:release': "react-native run-ios --scheme='GoldWallet Dev (Release)'",
    'ios:stage:release': "react-native run-ios --scheme='GoldWallet Stage (Release)'",
    'ios:beta:release': "react-native run-ios --scheme='GoldWallet Beta (Release)'",
    'ios:prod:release': "react-native run-ios --scheme='GoldWallet (Release)'",
  };
  Object.entries(expectedIosScripts).forEach(([scriptName, expectedCommand]) => {
    if (packageJson.scripts[scriptName] !== expectedCommand) {
      errors.push(`package.json script ${scriptName} changed; expected "${expectedCommand}"`);
    }
  });

  const infoPlists = [
    { path: 'ios/GoldWallet/Info.plist', displayName: 'GoldWallet', requiresCodePush: true, requiresRemoteNotification: true },
    { path: 'ios/GoldWalletDev-Info.plist', displayName: 'GoldWallet Dev', requiresCodePush: true, requiresRemoteNotification: true },
    { path: 'ios/GoldWalletStage-Info.plist', displayName: 'GoldWallet Stage', requiresCodePush: true, requiresRemoteNotification: true },
    { path: 'ios/GoldWallet-beta.plist', displayName: '$(PRODUCT_NAME)', requiresCodePush: false, requiresRemoteNotification: false },
  ];
  let codePushPlistPlaceholderCount = 0;

  infoPlists.forEach(config => {
    const parsed = parsePlist(config.path);
    if (parsed.CFBundleIdentifier !== '$(PRODUCT_BUNDLE_IDENTIFIER)') {
      errors.push(`${config.path} must use $(PRODUCT_BUNDLE_IDENTIFIER)`);
    }
    if (parsed.CFBundleDisplayName !== config.displayName) {
      errors.push(`${config.path} display name is ${parsed.CFBundleDisplayName}; expected ${config.displayName}`);
    }
    if (config.requiresCodePush && parsed.CodePushDeploymentKey !== '$(CODEPUSH_DEPLOYMENT_KEY_IOS)') {
      errors.push(`${config.path} must reference $(CODEPUSH_DEPLOYMENT_KEY_IOS)`);
    }
    if (parsed.CodePushDeploymentKey === '$(CODEPUSH_DEPLOYMENT_KEY_IOS)') {
      codePushPlistPlaceholderCount += 1;
    }
    ['NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription', 'NSFaceIDUsageDescription'].forEach(key => {
      if (!parsed[key]) {
        errors.push(`${config.path} is missing ${key}`);
      }
    });
    if (!Array.isArray(parsed.UISupportedInterfaceOrientations) || !parsed.UISupportedInterfaceOrientations.includes('UIInterfaceOrientationPortrait')) {
      errors.push(`${config.path} must support portrait orientation`);
    }
    if (config.requiresRemoteNotification && !parsed.UIBackgroundModes?.includes('remote-notification')) {
      errors.push(`${config.path} must include remote-notification background mode`);
    }
  });

  let xcodebuildVersion = null;
  if (process.platform !== 'darwin') {
    warnings.push('iOS compile/archive validation is blocked on this machine: xcodebuild requires macOS with Xcode.');
  } else {
    try {
      xcodebuildVersion = execFileSync('xcodebuild', ['-version'], { encoding: 'utf8' }).trim().replace(/\r?\n/g, '; ');
    } catch (error) {
      warnings.push(`Unable to run xcodebuild -version: ${error.message}`);
    }
  }

  const staticReady = errors.length === 0;
  const archiveReady = staticReady && podfileLockDriftIssues.length === 0 && Boolean(xcodebuildVersion);

  return {
    ready: archiveReady,
    staticReady,
    errors,
    warnings,
    podfileLockDriftIssues,
    reactNativeVersion: packageJson.dependencies['react-native'],
    rnMinIosVersion,
    rnMinXcodeVersion,
    podfilePlatform,
    deploymentTargets: [...new Set(deploymentTargets)].sort(compareVersions),
    schemeCount: actualSchemeConfigs.size,
    sentryBundlePhaseCount,
    sentryDsymPhaseCount,
    codePushPlistPlaceholderCount,
    xcodebuildVersion,
  };
};

const formatSummary = (audit, generatedAt = new Date().toISOString()) => [
  'iOS release static readiness audit',
  `Generated at: ${generatedAt}`,
  `Static iOS release files valid: ${audit.staticReady ? 'yes' : 'no'}`,
  `Ready for macOS archive validation: ${audit.ready ? 'yes' : 'no'}`,
  `React Native version: ${audit.reactNativeVersion}`,
  `React Native minimum iOS: ${audit.rnMinIosVersion || '<unknown>'}`,
  `React Native minimum Xcode: ${audit.rnMinXcodeVersion || '<unknown>'}`,
  `Podfile iOS platform: ${audit.podfilePlatform || '<missing>'}`,
  `Xcode deployment targets: ${audit.deploymentTargets.join(', ') || '<none>'}`,
  `Guarded iOS schemes: ${audit.schemeCount}`,
  `iOS Sentry bundle/source-map phases: ${audit.sentryBundlePhaseCount}`,
  `iOS Sentry dSYM upload phases: ${audit.sentryDsymPhaseCount}`,
  `iOS CodePush plist placeholders: ${audit.codePushPlistPlaceholderCount}`,
  `Podfile.lock refresh required: ${audit.podfileLockDriftIssues.length > 0 ? 'yes' : 'no'}`,
  `Podfile.lock drift issues: ${audit.podfileLockDriftIssues.length}`,
  ...audit.podfileLockDriftIssues.map(issue => `- ${issue}`),
  `xcodebuild version: ${audit.xcodebuildVersion || '<not available on this machine>'}`,
  'iOS runtime delivery validation: not claimed',
  `Errors: ${audit.errors.length}`,
  ...audit.errors.map(error => `- ${error}`),
  `Warnings: ${audit.warnings.length}`,
  ...audit.warnings.map(warning => `- ${warning}`),
  audit.ready
    ? 'Required action: run pod install and iOS archive/simulator validation on macOS before claiming iOS runtime delivery.'
    : audit.podfileLockDriftIssues.length > 0
      ? 'Required action: refresh ios/Podfile.lock with pod install on macOS, then run iOS archive/simulator validation before claiming iOS runtime delivery.'
    : 'Required action: fix static iOS release readiness errors before macOS archive validation.',
  '',
].join('\n');

const audit = collectIosReleaseReadiness();
const summary = formatSummary(audit);
mkdirSync(localDocsDir, { recursive: true });
writeFileSync(path.join(localDocsDir, 'ios-release-static-readiness-summary.txt'), summary);

console.log(summary.trim());

if (!audit.staticReady) {
  process.exit(1);
}
