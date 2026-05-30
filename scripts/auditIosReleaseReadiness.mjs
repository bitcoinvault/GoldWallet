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

const collectIosReleaseReadiness = () => {
  const errors = [];
  const warnings = [];
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
  ];

  requiredFiles.forEach(relativePath => {
    if (!exists(relativePath)) {
      errors.push(`Missing required iOS release file: ${relativePath}`);
    }
  });

  const packageJson = JSON.parse(read('package.json'));
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

  const pbxproj = read('ios/GoldWallet.xcodeproj/project.pbxproj');
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

  const schemesDir = path.join(root, 'ios', 'GoldWallet.xcodeproj', 'xcshareddata', 'xcschemes');
  const actualSchemeConfigs = new Map(
    [...expectedIosSchemeConfigs.keys()].map(schemeFile => [
      schemeFile,
      parseIosSchemeConfig(readFileSync(path.join(schemesDir, schemeFile), 'utf8')),
    ]),
  );
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

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    reactNativeVersion: packageJson.dependencies['react-native'],
    rnMinIosVersion,
    rnMinXcodeVersion,
    podfilePlatform,
    deploymentTargets: [...new Set(deploymentTargets)].sort(compareVersions),
    schemeCount: actualSchemeConfigs.size,
    xcodebuildVersion,
  };
};

const formatSummary = (audit, generatedAt = new Date().toISOString()) => [
  'iOS release static readiness audit',
  `Generated at: ${generatedAt}`,
  `Ready for macOS archive validation: ${audit.ready ? 'yes' : 'no'}`,
  `React Native version: ${audit.reactNativeVersion}`,
  `React Native minimum iOS: ${audit.rnMinIosVersion || '<unknown>'}`,
  `React Native minimum Xcode: ${audit.rnMinXcodeVersion || '<unknown>'}`,
  `Podfile iOS platform: ${audit.podfilePlatform || '<missing>'}`,
  `Xcode deployment targets: ${audit.deploymentTargets.join(', ') || '<none>'}`,
  `Guarded iOS schemes: ${audit.schemeCount}`,
  `xcodebuild version: ${audit.xcodebuildVersion || '<not available on this machine>'}`,
  `Errors: ${audit.errors.length}`,
  ...audit.errors.map(error => `- ${error}`),
  `Warnings: ${audit.warnings.length}`,
  ...audit.warnings.map(warning => `- ${warning}`),
  audit.ready
    ? 'Required action: run pod install and iOS archive/simulator validation on macOS before claiming iOS runtime delivery.'
    : 'Required action: fix static iOS release readiness errors before macOS archive validation.',
  '',
].join('\n');

const audit = collectIosReleaseReadiness();
const summary = formatSummary(audit);
mkdirSync(localDocsDir, { recursive: true });
writeFileSync(path.join(localDocsDir, 'ios-release-static-readiness-summary.txt'), summary);

console.log(summary.trim());

if (!audit.ready) {
  process.exit(1);
}
