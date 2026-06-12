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
  const staticFilesValid = getLineValue(plan, 'Static iOS release files valid');
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
    'corepack yarn ios:release:readiness:audit',
    'corepack yarn ios:release:readiness:check-summary',
    'corepack yarn ios:mac-validation:handoff',
  ].forEach(snippet => {
    if (!plan.includes(snippet)) {
      errors.push(`plan is missing required command: ${snippet}`);
    }
  });

  if (!requiredAction.includes('pod install') || !requiredAction.includes('archive/simulator validation')) {
    errors.push('Required action must name pod install and archive/simulator validation');
  }

  return errors;
};
