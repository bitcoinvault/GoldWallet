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
  const podfileLockRefreshRequired = getLineValue(summary, 'Podfile.lock refresh required');
  const podfileLockDriftCount = getLineValue(summary, 'Podfile.lock drift issues');
  const xcodebuildVersion = getLineValue(summary, 'xcodebuild version');
  const iosRuntimeDeliveryValidation = getLineValue(summary, 'iOS runtime delivery validation');
  const errorCount = getLineValue(summary, 'Errors');
  const warningCount = getLineValue(summary, 'Warnings');
  const requiredAction = getLineValue(summary, 'Required action');
  const podfileLockDriftLines = getBulletLinesAfter(summary, 'Podfile.lock drift issues');

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
    ['React Native version', reactNativeVersion, '0.85.3'],
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

  if (codePushPlistPlaceholderCount !== '3') {
    errors.push(`iOS CodePush plist placeholders must be 3. Received: ${codePushPlistPlaceholderCount || 'missing'}`);
  }

  if (!['yes', 'no'].includes(podfileLockRefreshRequired)) {
    errors.push(`Podfile.lock refresh required must be yes or no. Received: ${podfileLockRefreshRequired || 'missing'}`);
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

  if (
    podfileLockRefreshRequired === 'yes' &&
    podfileLockDriftLines.some(line => line.includes('removed react-native-camera')) &&
    !podfileLockDriftLines.some(line => line.includes('removed react-native-qrcode-local-image'))
  ) {
    errors.push('Podfile.lock drift summary must include the removed react-native-qrcode-local-image pod when removed camera pods are present');
  }

  if (
    podfileLockRefreshRequired === 'yes' &&
    podfileLockDriftLines.some(line => line.includes('removed react-native-camera')) &&
    !podfileLockDriftLines.some(line => line.includes('removed RNCMaskedView')) &&
    !podfileLockDriftLines.some(line => line.includes('removed @react-native-community/masked-view'))
  ) {
    errors.push('Podfile.lock drift summary must include the removed masked-view pod after React Navigation 7 migration');
  }

  return errors;
};
