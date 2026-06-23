const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};

const hasLine = (content, expectedLine) => content.split(/\r?\n/).includes(expectedLine);
const getBulletLinesAfter = (content, label) => {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.startsWith(`${label}: `));
  const bulletLines = [];

  if (startIndex === -1) {
    return bulletLines;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (!lines[index].startsWith('- ')) {
      break;
    }

    bulletLines.push(lines[index].slice(2));
  }

  return bulletLines;
};
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value) && Number(value) >= 0;
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;

const expectedCurrentPodfileLockDriftSnippets = [
  'React-Core 0.65.3; package.json has react-native 0.86.0',
  'RNBootSplash 3.2.5; package.json has react-native-bootsplash 7.3.2',
  'react-native-config 1.4.4; package.json has react-native-config 1.6.1',
  'RNCAsyncStorage 1.15.7; package.json has @react-native-async-storage/async-storage 3.1.1',
  'RNDeviceInfo 6.2.1; package.json has react-native-device-info 15.0.2',
  'RNFastImage 8.3.7; package.json has react-native-fast-image 8.6.3',
  'RNFBApp 12.7.5; package.json has @react-native-firebase/app 24.1.1',
  'RNGestureHandler 1.10.3; package.json has react-native-gesture-handler 3.0.2',
  'RNLocalize 1.4.3; package.json has react-native-localize 3.7.0',
  'RNScreens 3.6.0; package.json has react-native-screens 4.25.2',
  'RNSentry 3.1.0; package.json has @sentry/react-native 8.15.1',
  'RNVectorIcons 6.6.0; package.json has react-native-vector-icons 10.3.0',
];

export const getIosReleaseReadinessSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const staticReady = getLineValue(summary, 'Static iOS release files valid');
  const ready = getLineValue(summary, 'Ready for macOS archive validation');
  const reactNativeVersion = getLineValue(summary, 'React Native version');
  const rnMinIos = getLineValue(summary, 'React Native minimum iOS');
  const rnMinXcode = getLineValue(summary, 'React Native minimum Xcode');
  const podfilePlatform = getLineValue(summary, 'Podfile iOS platform');
  const deploymentTargets = getLineValue(summary, 'Xcode deployment targets');
  const schemeCount = getLineValue(summary, 'Guarded iOS schemes');
  const sentryBundlePhaseCount = getLineValue(summary, 'iOS Sentry bundle/source-map phases');
  const sentryDsymPhaseCount = getLineValue(summary, 'iOS Sentry dSYM upload phases');
  const codePushPlistPlaceholderCount = getLineValue(summary, 'iOS CodePush plist placeholders');
  const remoteNotificationPlistCount = getLineValue(summary, 'iOS remote-notification plists');
  const podfileLockRefreshRequired = getLineValue(summary, 'Podfile.lock refresh required');
  const removedPodfileLockReferenceCount = getLineValue(summary, 'Removed Podfile.lock pod references');
  const podfileLockDriftCount = getLineValue(summary, 'Podfile.lock drift issues');
  const xcodebuildVersion = getLineValue(summary, 'xcodebuild version');
  const iosRuntimeDeliveryValidation = getLineValue(summary, 'iOS runtime delivery validation');
  const errorCount = getLineValue(summary, 'Errors');
  const warningCount = getLineValue(summary, 'Warnings');
  const requiredAction = getLineValue(summary, 'Required action');
  const podfileLockDriftLines = getBulletLinesAfter(summary, 'Podfile.lock drift issues');
  const removedPodfileLockReferenceLines = getBulletLinesAfter(summary, 'Removed Podfile.lock pod references');

  if (!summary.startsWith('iOS release static readiness audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!isIsoTimestamp(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (staticReady !== 'yes') {
    errors.push(`Static iOS release files valid must be yes. Received: ${staticReady || 'missing'}`);
  }

  if (!['yes', 'no'].includes(ready)) {
    errors.push(`Ready for macOS archive validation must be yes or no. Received: ${ready || 'missing'}`);
  }

  [
    ['React Native version', reactNativeVersion, '0.86.0'],
    ['React Native minimum iOS', rnMinIos, '15.1'],
    ['React Native minimum Xcode', rnMinXcode, '16.1'],
    ['Podfile iOS platform', podfilePlatform, '15.1'],
  ].forEach(([label, actual, expected]) => {
    if (actual !== expected) {
      errors.push(`${label} must be ${expected}. Received: ${actual || 'missing'}`);
    }
  });

  if (!deploymentTargets.split(',').map(value => value.trim()).includes('15.1')) {
    errors.push(`Xcode deployment targets must include 15.1. Received: ${deploymentTargets || 'missing'}`);
  }

  if (schemeCount !== '8') {
    errors.push(`Guarded iOS schemes must be 8. Received: ${schemeCount || 'missing'}`);
  }

  if (sentryBundlePhaseCount !== '4') {
    errors.push(`iOS Sentry bundle/source-map phases must be 4. Received: ${sentryBundlePhaseCount || 'missing'}`);
  }

  if (sentryDsymPhaseCount !== '3') {
    errors.push(`iOS Sentry dSYM upload phases must be 3. Received: ${sentryDsymPhaseCount || 'missing'}`);
  }

  if (codePushPlistPlaceholderCount !== '0') {
    errors.push(`iOS CodePush plist placeholders must be 0 after CodePush removal. Received: ${codePushPlistPlaceholderCount || 'missing'}`);
  }

  if (remoteNotificationPlistCount !== '4') {
    errors.push(`iOS remote-notification plists must be 4. Received: ${remoteNotificationPlistCount || 'missing'}`);
  }

  if (!['yes', 'no'].includes(podfileLockRefreshRequired)) {
    errors.push(`Podfile.lock refresh required must be yes or no. Received: ${podfileLockRefreshRequired || 'missing'}`);
  }

  if (!isNonNegativeInteger(removedPodfileLockReferenceCount)) {
    errors.push(`Removed Podfile.lock pod references must be a non-negative integer. Received: ${removedPodfileLockReferenceCount || 'missing'}`);
  } else if (Number(removedPodfileLockReferenceCount) !== removedPodfileLockReferenceLines.length) {
    errors.push(
      `Removed Podfile.lock pod references count is ${removedPodfileLockReferenceCount}, but listed ${removedPodfileLockReferenceLines.length}`,
    );
  }

  if (removedPodfileLockReferenceCount !== '0') {
    errors.push(`Removed Podfile.lock pod references must be 0 after removed-pod cleanup. Received: ${removedPodfileLockReferenceCount || 'missing'}`);
  }

  if (!isNonNegativeInteger(podfileLockDriftCount)) {
    errors.push(`Podfile.lock drift issues must be a non-negative integer. Received: ${podfileLockDriftCount || 'missing'}`);
  } else if (Number(podfileLockDriftCount) !== podfileLockDriftLines.length) {
    errors.push(`Podfile.lock drift issues count is ${podfileLockDriftCount}, but listed ${podfileLockDriftLines.length}`);
  }

  if (podfileLockRefreshRequired === 'yes' && podfileLockDriftCount === '0') {
    errors.push('Podfile.lock refresh required cannot be yes with 0 drift issues');
  }

  if (podfileLockRefreshRequired === 'no' && podfileLockDriftCount !== '0') {
    errors.push('Podfile.lock refresh required cannot be no with drift issues');
  }

  if (!xcodebuildVersion) {
    errors.push('xcodebuild version line is missing');
  }

  if (iosRuntimeDeliveryValidation !== 'not claimed') {
    errors.push(`iOS runtime delivery validation must be not claimed. Received: ${iosRuntimeDeliveryValidation || 'missing'}`);
  }

  if (!isNonNegativeInteger(errorCount) || Number(errorCount) !== 0) {
    errors.push(`Errors must be 0. Received: ${errorCount || 'missing'}`);
  }

  if (!isNonNegativeInteger(warningCount)) {
    errors.push(`Warnings must be a non-negative integer. Received: ${warningCount || 'missing'}`);
  }

  if (!requiredAction.includes('pod install') || !requiredAction.includes('iOS archive/simulator validation')) {
    errors.push('Required action must name pod install and iOS archive/simulator validation');
  }

  if (xcodebuildVersion === '<not available on this machine>') {
    const expectedWarning =
      '- iOS compile/archive validation is blocked on this machine: xcodebuild requires macOS with Xcode.';

    if (warningCount !== '1') {
      errors.push(`Warnings must be 1 when xcodebuild is unavailable. Received: ${warningCount || 'missing'}`);
    }

    if (!hasLine(summary, expectedWarning)) {
      errors.push('Missing xcodebuild unavailable warning line');
    }
  } else if (!isPositiveInteger(warningCount) && warningCount !== '0') {
    errors.push(`Warnings must be 0 or a positive integer. Received: ${warningCount || 'missing'}`);
  }

  if (ready === 'yes' && (xcodebuildVersion === '<not available on this machine>' || podfileLockRefreshRequired !== 'no' || podfileLockDriftCount !== '0')) {
    errors.push('Ready summary must have xcodebuild available and no Podfile.lock drift');
  }

  if (podfileLockRefreshRequired === 'yes' && !requiredAction.includes('refresh ios/Podfile.lock with pod install on macOS')) {
    errors.push('Podfile.lock drift summary must require refreshing ios/Podfile.lock with pod install on macOS');
  }

  if (podfileLockRefreshRequired === 'yes') {
    expectedCurrentPodfileLockDriftSnippets.forEach(snippet => {
      if (!podfileLockDriftLines.some(line => line.includes(snippet))) {
        errors.push(`Podfile.lock drift summary is missing current drift evidence: ${snippet}`);
      }
    });
  }

  return errors;
};
