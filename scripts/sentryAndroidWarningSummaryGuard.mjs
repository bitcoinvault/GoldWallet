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

export const getSentryAndroidWarningSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const sentryVersion = getLineValue(summary, '@sentry/react-native manifest version');
  const getPropertiesReferences = getLineValue(summary, 'Sentry Gradle getProperties() references');
  const wiringValid = getLineValue(summary, 'Sentry Android warning wiring valid');
  const baselineStable = getLineValue(summary, 'Sentry Android warning baseline stable');
  const warningCount = getLineValue(summary, 'Warnings');
  const readinessCount = getLineValue(summary, 'Readiness issues');
  const wiringErrorCount = getLineValue(summary, 'Wiring errors');
  const requiredAction = getLineValue(summary, 'Required action');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const readinessLines = getBulletLinesAfter(summary, 'Readiness issues');
  const wiringErrorLines = getBulletLinesAfter(summary, 'Wiring errors');

  if (!summary.startsWith('Sentry Android warning audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!sentryVersion) {
    errors.push('@sentry/react-native manifest version is missing');
  }

  if (!getPropertiesReferences) {
    errors.push('Sentry Gradle getProperties() references are missing');
  }

  [wiringValid, baselineStable].forEach(value => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`Boolean summary values must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  [
    ['Warnings', warningCount, warningLines.length],
    ['Readiness issues', readinessCount, readinessLines.length],
    ['Wiring errors', wiringErrorCount, wiringErrorLines.length],
  ].forEach(([label, value, listedCount]) => {
    if (!/^\d+$/.test(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    } else if (Number(value) !== listedCount) {
      errors.push(`${label} count is ${value}, but listed ${listedCount}`);
    }
  });

  if (baselineStable === 'yes' && (wiringValid !== 'yes' || readinessCount !== '0' || wiringErrorCount !== '0')) {
    errors.push('Stable baseline summary must have valid wiring, 0 readiness issues, and 0 wiring errors');
  }

  if (baselineStable === 'yes' && !requiredAction.includes('none; Sentry Android warning baseline is stable')) {
    errors.push('Stable baseline summary must include the no-action Sentry Android warning required action');
  }

  if (baselineStable === 'no' && !requiredAction.includes('restore Sentry Android warning baseline')) {
    errors.push('Unstable baseline summary must include the Sentry Android warning restoration required action');
  }

  return errors;
};
