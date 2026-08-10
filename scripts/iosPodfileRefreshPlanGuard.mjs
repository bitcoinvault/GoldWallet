const header = 'iOS Podfile.lock refresh plan';
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

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

const isNonNegativeInteger = value => /^\d+$/.test(value);

export const getIosPodfileRefreshPlanErrors = plan => {
  const errors = [];
  const generatedAt = getLineValue(plan, 'Generated at');
  const platform = getLineValue(plan, 'Platform');
  const firebaseAppleSdk = getLineValue(plan, 'Firebase Apple SDK');
  const firebaseMinimumXcode = getLineValue(plan, 'Firebase minimum Xcode');
  const effectiveMinimumXcode = getLineValue(plan, 'Effective minimum Xcode');
  const staticFilesValid = getLineValue(plan, 'Static iOS release files valid');
  const guardedSchemeCount = getLineValue(plan, 'Guarded iOS schemes');
  const refreshRequired = getLineValue(plan, 'Podfile.lock refresh required');
  const driftCount = getLineValue(plan, 'Podfile.lock drift issues');
  const removedReferenceCount = getLineValue(plan, 'Removed Podfile.lock pod references');
  const macRequired = getLineValue(plan, 'macOS/Xcode required');
  const runtimeValidation = getLineValue(plan, 'iOS runtime delivery validation');
  const secretValuesPrinted = getLineValue(plan, 'Secret values printed');
  const requiredAction = getLineValue(plan, 'Required action');
  const driftIssues = getBulletLinesAfter(plan, 'Podfile.lock drift issues');

  if (!plan.startsWith(header)) {
    errors.push('plan header is missing or invalid');
  }

  if (!isoTimestampPattern.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!platform) {
    errors.push('Platform must be recorded');
  }

  if (firebaseAppleSdk !== '12.17.0') {
    errors.push(`Firebase Apple SDK must be 12.17.0. Received: ${firebaseAppleSdk || 'missing'}`);
  }

  if (firebaseMinimumXcode !== '26.2') {
    errors.push(`Firebase minimum Xcode must be 26.2. Received: ${firebaseMinimumXcode || 'missing'}`);
  }

  if (effectiveMinimumXcode !== '26.2') {
    errors.push(`Effective minimum Xcode must be 26.2. Received: ${effectiveMinimumXcode || 'missing'}`);
  }

  [
    ['Static iOS release files valid', staticFilesValid],
    ['Podfile.lock refresh required', refreshRequired],
    ['macOS/Xcode required', macRequired],
    ['Secret values printed', secretValuesPrinted],
  ].forEach(([label, value]) => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  [
    ['Podfile.lock drift issues', driftCount],
    ['Removed Podfile.lock pod references', removedReferenceCount],
    ['Guarded iOS schemes', guardedSchemeCount],
  ].forEach(([label, value]) => {
    if (!isNonNegativeInteger(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    }
  });

  if (isNonNegativeInteger(driftCount) && Number(driftCount) !== driftIssues.length) {
    errors.push(`Podfile.lock drift issues count is ${driftCount}, but listed ${driftIssues.length}`);
  }

  if (staticFilesValid !== 'yes') {
    errors.push('Static iOS release files must be valid before a Podfile.lock refresh handoff');
  }

  if (guardedSchemeCount !== '8') {
    errors.push(`Guarded iOS schemes must remain 8. Received: ${guardedSchemeCount || 'missing'}`);
  }

  if (refreshRequired === 'yes' && driftCount === '0') {
    errors.push('Podfile.lock refresh cannot be required with zero drift issues');
  }

  if (refreshRequired === 'no' && driftCount !== '0') {
    errors.push('Podfile.lock refresh cannot be no while drift issues remain');
  }

  if (runtimeValidation !== 'not claimed') {
    errors.push(`iOS runtime delivery validation must be not claimed. Received: ${runtimeValidation || 'missing'}`);
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('iOS Podfile.lock refresh plan must not print secret values');
  }

  [
    'cwd=ios pod install',
    'corepack yarn ios:mac-validation-prereq:audit',
    'corepack yarn ios:mac-validation-prereq:check-summary',
    'node scripts/checkIosMacValidationPrereqSummary.mjs --require-toolchain',
    'corepack yarn ios:release:readiness:audit',
    'corepack yarn ios:release:readiness:check-summary',
    'corepack yarn ios:mac-validation:handoff',
    'corepack yarn ios:mac-validation:handoff --all-schemes',
  ].forEach(snippet => {
    if (!plan.includes(snippet)) {
      errors.push(`plan is missing required command: ${snippet}`);
    }
  });

  const commandLines = plan.split(/\r?\n/).filter(line => /^\d+\. cwd=/.test(line));
  const commandIndex = snippet => commandLines.findIndex(line => line.includes(snippet));
  const prereqAuditIndex = commandIndex('corepack yarn ios:mac-validation-prereq:audit');
  const prereqSummaryCheckIndex = commandIndex('corepack yarn ios:mac-validation-prereq:check-summary');
  const toolchainGateIndex = commandIndex('node scripts/checkIosMacValidationPrereqSummary.mjs --require-toolchain');
  const podInstallIndex = commandIndex('cwd=ios pod install');

  if (
    prereqAuditIndex === -1 ||
    prereqSummaryCheckIndex === -1 ||
    toolchainGateIndex === -1 ||
    podInstallIndex === -1 ||
    !(prereqAuditIndex < prereqSummaryCheckIndex &&
      prereqSummaryCheckIndex < toolchainGateIndex &&
      toolchainGateIndex < podInstallIndex)
  ) {
    errors.push(
      'Command plan must refresh and validate the current macOS prerequisite summary, then pass the toolchain gate before pod install',
    );
  }

  if (!requiredAction.includes('pod install') || !requiredAction.includes('archive/simulator validation') || !requiredAction.includes('--all-schemes')) {
    errors.push('Required action must name pod install, archive/simulator validation, and --all-schemes');
  }

  return errors;
};
