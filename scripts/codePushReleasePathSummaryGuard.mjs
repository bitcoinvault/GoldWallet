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

export const getCodePushReleasePathSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const wiringValid = getLineValue(summary, 'Release path wiring valid');
  const ready = getLineValue(summary, 'Release path ready for update validation');
  const warningCount = getLineValue(summary, 'Warnings');
  const readinessCount = getLineValue(summary, 'Readiness issues');
  const wiringErrorCount = getLineValue(summary, 'Wiring errors');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const readinessLines = getBulletLinesAfter(summary, 'Readiness issues');
  const wiringErrorLines = getBulletLinesAfter(summary, 'Wiring errors');

  if (!summary.startsWith('CodePush release path audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  [wiringValid, ready, secretValuesPrinted].forEach(value => {
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

  if (secretValuesPrinted !== 'no') {
    errors.push('CodePush release path summary must not print secret values');
  }

  if (ready === 'yes' && (wiringValid !== 'yes' || readinessCount !== '0' || wiringErrorCount !== '0')) {
    errors.push('Ready summary must have valid wiring, 0 readiness issues, and 0 wiring errors');
  }

  if (ready === 'no' && !requiredAction.includes('CodePush deployment keys')) {
    errors.push('Not-ready summary must include the CodePush deployment key required action');
  }

  return errors;
};
