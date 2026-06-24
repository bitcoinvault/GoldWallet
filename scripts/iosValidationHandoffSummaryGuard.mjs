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

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value);

export const getIosValidationHandoffSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const platform = getLineValue(summary, 'Platform');
  const staticReady = getLineValue(summary, 'Static iOS release files valid');
  const releaseReadinessSummaryValid = getLineValue(summary, 'Release readiness summary valid');
  const macPrerequisiteSummaryValid = getLineValue(summary, 'Mac prerequisite summary valid');
  const archiveReady = getLineValue(summary, 'Ready for macOS archive validation');
  const macPrereqsReady = getLineValue(summary, 'Ready for macOS pod/archive validation');
  const podfileLockRefreshRequired = getLineValue(summary, 'Podfile.lock refresh required');
  const releasePodfileLockDriftIssues = getLineValue(summary, 'Release Podfile.lock drift issues');
  const prereqPodfileLockDriftIssues = getLineValue(summary, 'Prereq Podfile.lock drift issues');
  const xcodebuildAvailable = getLineValue(summary, 'xcodebuild available');
  const xcodebuildVersion = getLineValue(summary, 'xcodebuild version');
  const podAvailable = getLineValue(summary, 'pod available');
  const bundlePodAvailable = getLineValue(summary, 'bundle exec pod available');
  const guardedSchemes = getLineValue(summary, 'Guarded iOS schemes');
  const macHandoffCommand = getLineValue(summary, 'Mac handoff command');
  const macHandoffDryRunCommand = getLineValue(summary, 'Mac handoff dry-run command');
  const macHandoffSchemeCoverage = getLineValue(summary, 'Mac handoff scheme coverage');
  const macHandoffSchemeCount = getLineValue(summary, 'Mac handoff scheme count');
  const macHandoffSdk = getLineValue(summary, 'Mac handoff SDK');
  const runtimeValidation = getLineValue(summary, 'iOS runtime delivery validation');
  const implementationReady = getLineValue(summary, 'Implementation ready');
  const blockerCount = getLineValue(summary, 'Blockers');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const blockerLines = getBulletLinesAfter(summary, 'Blockers');

  if (!summary.startsWith('iOS validation handoff summary')) {
    errors.push('summary header is missing or invalid');
  }

  if (!isIsoTimestamp(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!platform) {
    errors.push('Platform must be recorded');
  }

  [
    ['Static iOS release files valid', staticReady],
    ['Release readiness summary valid', releaseReadinessSummaryValid],
    ['Mac prerequisite summary valid', macPrerequisiteSummaryValid],
    ['Ready for macOS archive validation', archiveReady],
    ['Ready for macOS pod/archive validation', macPrereqsReady],
    ['Podfile.lock refresh required', podfileLockRefreshRequired],
    ['xcodebuild available', xcodebuildAvailable],
    ['pod available', podAvailable],
    ['bundle exec pod available', bundlePodAvailable],
    ['Implementation ready', implementationReady],
    ['Secret values printed', secretValuesPrinted],
  ].forEach(([label, value]) => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  [
    ['Release Podfile.lock drift issues', releasePodfileLockDriftIssues],
    ['Prereq Podfile.lock drift issues', prereqPodfileLockDriftIssues],
    ['Guarded iOS schemes', guardedSchemes],
    ['Mac handoff scheme count', macHandoffSchemeCount],
    ['Blockers', blockerCount],
  ].forEach(([label, value]) => {
    if (!isNonNegativeInteger(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    }
  });

  if (isNonNegativeInteger(blockerCount) && Number(blockerCount) !== blockerLines.length) {
    errors.push(`Blockers count is ${blockerCount}, but listed ${blockerLines.length}`);
  }

  if (staticReady !== 'yes') {
    errors.push('Static iOS release files must be valid before handoff');
  }

  if (releaseReadinessSummaryValid !== 'yes') {
    errors.push('Release readiness summary must be valid before handoff');
  }

  if (macPrerequisiteSummaryValid !== 'yes') {
    errors.push('Mac prerequisite summary must be valid before handoff');
  }

  if (guardedSchemes !== '8') {
    errors.push(`Guarded iOS schemes must remain 8. Received: ${guardedSchemes || 'missing'}`);
  }

  if (macHandoffCommand !== 'corepack yarn ios:mac-validation:handoff --all-schemes') {
    errors.push(`Mac handoff command must run all shared schemes. Received: ${macHandoffCommand || 'missing'}`);
  }

  if (macHandoffDryRunCommand !== 'corepack yarn ios:mac-validation:handoff:dry-run --all-schemes') {
    errors.push(
      `Mac handoff dry-run command must render all shared schemes. Received: ${macHandoffDryRunCommand || 'missing'}`,
    );
  }

  if (macHandoffSchemeCoverage !== 'all shared schemes') {
    errors.push(`Mac handoff scheme coverage must be all shared schemes. Received: ${macHandoffSchemeCoverage || 'missing'}`);
  }

  if (macHandoffSchemeCount !== guardedSchemes) {
    errors.push('Mac handoff scheme count must match guarded iOS schemes');
  }

  if (macHandoffSdk !== 'iphonesimulator') {
    errors.push(`Mac handoff SDK must be iphonesimulator. Received: ${macHandoffSdk || 'missing'}`);
  }

  if (runtimeValidation !== 'not claimed') {
    errors.push(`iOS runtime delivery validation must be not claimed. Received: ${runtimeValidation || 'missing'}`);
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('iOS validation handoff summary must not print secret values');
  }

  if (releasePodfileLockDriftIssues !== prereqPodfileLockDriftIssues) {
    errors.push('Release and prerequisite Podfile.lock drift counts must match');
  }

  if (podfileLockRefreshRequired === 'yes' && releasePodfileLockDriftIssues === '0') {
    errors.push('Podfile.lock refresh cannot be required with zero drift issues');
  }

  if (podfileLockRefreshRequired === 'no' && releasePodfileLockDriftIssues !== '0') {
    errors.push('Podfile.lock refresh cannot be no while drift issues remain');
  }

  if (xcodebuildAvailable === 'yes' && !xcodebuildVersion.includes('Xcode')) {
    errors.push('xcodebuild version must include Xcode when xcodebuild is available');
  }

  if (xcodebuildAvailable === 'no' && !xcodebuildVersion.includes('not available')) {
    errors.push('xcodebuild unavailable summary must record a not available xcodebuild version');
  }

  if (implementationReady === 'yes') {
    if (platform !== 'darwin') {
      errors.push('Implementation-ready iOS handoff must be produced on darwin');
    }

    if (
      archiveReady !== 'yes' ||
      macPrereqsReady !== 'yes' ||
      releaseReadinessSummaryValid !== 'yes' ||
      macPrerequisiteSummaryValid !== 'yes' ||
      podfileLockRefreshRequired !== 'no' ||
      releasePodfileLockDriftIssues !== '0' ||
      xcodebuildAvailable !== 'yes' ||
      (podAvailable !== 'yes' && bundlePodAvailable !== 'yes') ||
      blockerCount !== '0'
    ) {
      errors.push('Implementation-ready iOS handoff requires ready archive/prereq summaries, xcodebuild, CocoaPods, zero drift, and zero blockers');
    }
  } else if (blockerCount === '0') {
    errors.push('Not-ready iOS handoff must list at least one blocker');
  }

  if (platform !== 'darwin' && !blockerLines.some(line => line.includes('macOS') || line.includes('Xcode'))) {
    errors.push('Non-macOS iOS handoff must list a macOS/Xcode blocker');
  }

  if (podfileLockRefreshRequired === 'yes' && !requiredAction.includes('pod install')) {
    errors.push('Podfile.lock drift handoff must require pod install');
  }

  if (!requiredAction.includes('corepack yarn ios:mac-validation:handoff --all-schemes')) {
    errors.push('Required action must name the all-schemes macOS validation handoff command');
  }

  return errors;
};
