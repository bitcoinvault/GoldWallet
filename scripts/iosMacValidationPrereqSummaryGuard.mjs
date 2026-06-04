const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

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

export const getIosMacValidationPrereqSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const platform = getLineValue(summary, 'Platform');
  const ready = getLineValue(summary, 'Ready for macOS pod/archive validation');
  const xcodebuildAvailable = getLineValue(summary, 'xcodebuild available');
  const xcodebuildVersion = getLineValue(summary, 'xcodebuild version');
  const minimumXcode = getLineValue(summary, 'React Native minimum Xcode');
  const podAvailable = getLineValue(summary, 'pod available');
  const bundlePodAvailable = getLineValue(summary, 'bundle exec pod available');
  const podfileLockRefreshRequired = getLineValue(summary, 'Podfile.lock refresh required');
  const podfileLockDriftIssues = getLineValue(summary, 'Podfile.lock drift issues');
  const runtimeValidation = getLineValue(summary, 'iOS runtime delivery validation');
  const blockerCount = getLineValue(summary, 'Blockers');
  const blockerLines = getBulletLinesAfter(summary, 'Blockers');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('iOS macOS validation prerequisites audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!platform) {
    errors.push('Platform is missing');
  }

  if (!['yes', 'no'].includes(ready)) {
    errors.push(`Ready for macOS pod/archive validation must be yes or no. Received: ${ready || 'missing'}`);
  }

  if (!['yes', 'no'].includes(xcodebuildAvailable)) {
    errors.push(`xcodebuild available must be yes or no. Received: ${xcodebuildAvailable || 'missing'}`);
  }

  if (xcodebuildAvailable === 'yes' && !xcodebuildVersion.includes('Xcode')) {
    errors.push(`xcodebuild version must include Xcode when available. Received: ${xcodebuildVersion || 'missing'}`);
  }

  if (xcodebuildAvailable === 'no' && xcodebuildVersion !== '<not available>') {
    errors.push(`xcodebuild version must be <not available> when unavailable. Received: ${xcodebuildVersion || 'missing'}`);
  }

  if (minimumXcode !== '16.1') {
    errors.push(`React Native minimum Xcode must be 16.1. Received: ${minimumXcode || 'missing'}`);
  }

  if (!['yes', 'no'].includes(podAvailable)) {
    errors.push(`pod available must be yes or no. Received: ${podAvailable || 'missing'}`);
  }

  if (!['yes', 'no'].includes(bundlePodAvailable)) {
    errors.push(`bundle exec pod available must be yes or no. Received: ${bundlePodAvailable || 'missing'}`);
  }

  if (!['yes', 'no'].includes(podfileLockRefreshRequired)) {
    errors.push(`Podfile.lock refresh required must be yes or no. Received: ${podfileLockRefreshRequired || 'missing'}`);
  }

  if (!/^\d+$/.test(podfileLockDriftIssues)) {
    errors.push(`Podfile.lock drift issues must be a non-negative integer. Received: ${podfileLockDriftIssues || 'missing'}`);
  }

  if (podfileLockRefreshRequired === 'yes' && Number(podfileLockDriftIssues) === 0) {
    errors.push('Podfile.lock refresh required cannot be yes with 0 drift issues');
  }

  if (podfileLockRefreshRequired === 'no' && Number(podfileLockDriftIssues) > 0) {
    errors.push('Podfile.lock refresh required cannot be no with drift issues');
  }

  if (runtimeValidation !== 'not claimed') {
    errors.push('iOS runtime delivery validation must remain not claimed from this prerequisite audit');
  }

  if (!/^\d+$/.test(blockerCount)) {
    errors.push(`Blockers must be a non-negative integer. Received: ${blockerCount || 'missing'}`);
  } else if (Number(blockerCount) !== blockerLines.length) {
    errors.push(`Blockers count is ${blockerCount}, but listed ${blockerLines.length}`);
  }

  if (ready === 'yes' && Number(blockerCount) !== 0) {
    errors.push('Ready summary must have 0 blockers');
  }

  if (ready === 'no' && Number(blockerCount) === 0) {
    errors.push('Not-ready summary must list at least one blocker');
  }

  if (ready === 'no' && !requiredAction.includes('macOS') && !requiredAction.includes('Xcode')) {
    errors.push('Not-ready required action must name macOS or Xcode');
  }

  if (podfileLockRefreshRequired === 'yes' && !requiredAction.includes('pod install')) {
    errors.push('Podfile.lock drift required action must name pod install');
  }

  if (!requiredAction.includes('archive/simulator validation')) {
    errors.push('Required action must name archive/simulator validation');
  }

  return errors;
};
