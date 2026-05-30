const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};

const hasLine = (content, expectedLine) => content.split(/\r?\n/).includes(expectedLine);
const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value) && Number(value) >= 0;
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;

export const getIosReleaseReadinessSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const ready = getLineValue(summary, 'Ready for macOS archive validation');
  const reactNativeVersion = getLineValue(summary, 'React Native version');
  const rnMinIos = getLineValue(summary, 'React Native minimum iOS');
  const rnMinXcode = getLineValue(summary, 'React Native minimum Xcode');
  const podfilePlatform = getLineValue(summary, 'Podfile iOS platform');
  const deploymentTargets = getLineValue(summary, 'Xcode deployment targets');
  const schemeCount = getLineValue(summary, 'Guarded iOS schemes');
  const xcodebuildVersion = getLineValue(summary, 'xcodebuild version');
  const errorCount = getLineValue(summary, 'Errors');
  const warningCount = getLineValue(summary, 'Warnings');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('iOS release static readiness audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!isIsoTimestamp(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (ready !== 'yes') {
    errors.push(`Ready for macOS archive validation must be yes. Received: ${ready || 'missing'}`);
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

  if (!xcodebuildVersion) {
    errors.push('xcodebuild version line is missing');
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

  return errors;
};
