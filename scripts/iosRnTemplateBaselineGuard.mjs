const occurrences = (content, pattern) => [...content.matchAll(pattern)].length;
const normalizeEol = content => content.replace(/\r\n?/g, '\n');

export const getIosRnTemplateBaselineErrors = ({
  packageJson,
  podfile,
  pbxproj,
  appDelegate,
  xcodeEnv,
  macValidationHandoff,
  detoxIosBuild,
  gemfile,
}) => {
  const errors = [];
  const reactNativeVersion = packageJson.dependencies?.['react-native'];
  podfile = normalizeEol(podfile);
  pbxproj = normalizeEol(pbxproj);
  appDelegate = normalizeEol(appDelegate);
  xcodeEnv = normalizeEol(xcodeEnv);
  macValidationHandoff = normalizeEol(macValidationHandoff);
  detoxIosBuild = normalizeEol(detoxIosBuild);
  gemfile = normalizeEol(gemfile);

  if (reactNativeVersion !== '0.87.0') {
    errors.push(`React Native iOS template baseline expects react-native 0.87.0. Found: ${reactNativeVersion || 'missing'}`);
  }

  const requiredPodfileSnippets = [
    "require.resolve(\n    \"react-native/scripts/react_native_pods.rb\"",
    'platform :ios, min_ios_version_supported',
    'prepare_react_native_project!',
    '$RNFirebaseDisableSPM = true',
    'def configure_goldwallet_target',
    ':app_path => "#{Pod::Config.instance.installation_root}/.."',
    ':hermes_enabled => true',
    'config[:reactNativePath]',
    ':mac_catalyst_enabled => false',
  ];

  requiredPodfileSnippets.forEach(snippet => {
    if (!podfile.includes(snippet)) {
      errors.push(`ios/Podfile is missing the RN 0.87 template baseline snippet: ${snippet}`);
    }
  });

  const firebaseSpmOptOutMatch = /^\$RNFirebaseDisableSPM = true$/m.exec(podfile);
  if (occurrences(podfile, /^\$RNFirebaseDisableSPM = true$/gm) !== 1) {
    errors.push('ios/Podfile must set $RNFirebaseDisableSPM = true exactly once');
  }

  if (firebaseSpmOptOutMatch && firebaseSpmOptOutMatch.index > podfile.indexOf("target 'GoldWallet' do")) {
    errors.push('ios/Podfile must disable RN Firebase SPM before the concrete app targets are evaluated');
  }

  ['GoldWallet', 'GoldWallet Beta', 'GoldWallet Stage', 'GoldWallet Dev'].forEach(targetName => {
    if (!podfile.includes(`target '${targetName}' do\n  configure_goldwallet_target\nend`)) {
      errors.push(`ios/Podfile must autolink inside concrete target ${targetName}`);
    }
  });

  if (occurrences(podfile, /configure_goldwallet_target/g) !== 5) {
    errors.push('ios/Podfile must define one shared concrete-target helper and invoke it for all four app targets');
  }

  if (podfile.includes('abstract_target')) {
    errors.push('ios/Podfile must not autolink through an abstract target because package script phases would be skipped');
  }

  if (occurrences(podfile, /post_install do \|installer\|/g) !== 1) {
    errors.push('ios/Podfile must define exactly one shared post_install hook');
  }

  if (podfile.includes('@react-native-community/cli-platform-ios/native_modules')) {
    errors.push('ios/Podfile must not load the removed legacy CLI native_modules helper directly');
  }

  if (/pod ['"]react-native-config['"]/.test(podfile)) {
    errors.push('ios/Podfile must rely on autolinking instead of declaring react-native-config manually');
  }

  [
    'RCTDefaultReactNativeFactoryDelegate',
    'RCTReactNativeFactory',
    'RCTAppDependencyProvider',
    'startReactNativeWithModuleName:',
    'dependencyProvider = [RCTAppDependencyProvider new]',
    'customizeRootView:',
    '[RNBootSplash initWithStoryboard:@"Launch Screen" rootView:rootView]',
    '[FIRApp configure]',
    '[ReactNativeConfig envFor:@"APPLICATION_NAME"]',
    'RNCPushNotificationIOS',
    'RCTLinkingManager',
  ].forEach(snippet => {
    if (!appDelegate.includes(snippet)) {
      errors.push(`iOS AppDelegate is missing the RN 0.87 startup integration: ${snippet}`);
    }
  });

  if (appDelegate.includes('[[RCTBridge alloc] initWithDelegate:')) {
    errors.push('iOS AppDelegate must not create the removed legacy RCTBridge startup path directly');
  }

  if (!xcodeEnv.includes('export NODE_BINARY=$(command -v node)')) {
    errors.push('ios/.xcode.env must resolve NODE_BINARY for Xcode script phases');
  }

  if (macValidationHandoff.includes('-UseNewBuildSystem=NO')) {
    errors.push('iOS macOS handoff must not request the removed legacy Xcode build system');
  }

  if (detoxIosBuild.includes('-UseNewBuildSystem=NO')) {
    errors.push('iOS Detox build must not request the removed legacy Xcode build system');
  }

  ["gem 'cocoapods', '1.16.2'", "gem 'xcodeproj', '1.27.0'"].forEach(snippet => {
    if (!gemfile.includes(snippet)) {
      errors.push(`Root Gemfile is missing the Xcode 16 toolchain contract: ${snippet}`);
    }
  });

  const objectVersion = Number(pbxproj.match(/objectVersion = (\d+);/)?.[1]);
  if (!Number.isInteger(objectVersion) || objectVersion < 54) {
    errors.push(`Xcode project objectVersion must be at least 54. Found: ${objectVersion || 'missing'}`);
  }

  if (!pbxproj.includes('compatibilityVersion = "Xcode 12.0";')) {
    errors.push('Xcode project compatibilityVersion must match the RN 0.87 template baseline Xcode 12.0');
  }

  const swiftVersions = [...pbxproj.matchAll(/SWIFT_VERSION = ([^;]+);/g)].map(match => match[1]);
  if (swiftVersions.length === 0 || swiftVersions.some(version => version !== '5.0')) {
    errors.push(`All Xcode SWIFT_VERSION entries must be 5.0. Found: ${[...new Set(swiftVersions)].join(', ') || 'none'}`);
  }

  const cxxStandards = [...pbxproj.matchAll(/CLANG_CXX_LANGUAGE_STANDARD = "([^"]+)";/g)].map(match => match[1]);
  if (cxxStandards.length === 0 || cxxStandards.some(standard => standard !== 'c++20')) {
    errors.push(`All Xcode C++ language standard entries must be c++20. Found: ${[...new Set(cxxStandards)].join(', ') || 'none'}`);
  }

  const bundlePhaseCount = occurrences(pbxproj, /@sentry\/react-native\/scripts\/sentry-xcode\.sh/g);
  const environmentWrapperCount = occurrences(pbxproj, /scripts\/xcode\/with-environment\.sh/g);
  const debugFilesPhaseCount = occurrences(pbxproj, /@sentry\/react-native\/scripts\/sentry-xcode-debug-files\.sh/g);

  if (bundlePhaseCount !== 4 || environmentWrapperCount !== 4) {
    errors.push(
      `All four iOS app targets must bundle through the RN environment and current Sentry wrapper. Found wrappers: ${environmentWrapperCount}, Sentry phases: ${bundlePhaseCount}`,
    );
  }

  if (debugFilesPhaseCount !== 3) {
    errors.push(`The three existing iOS dSYM phases must use the current Sentry debug-files wrapper. Found: ${debugFilesPhaseCount}`);
  }

  return errors;
};
