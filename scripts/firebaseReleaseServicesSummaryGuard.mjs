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

export const getFirebaseReleaseServicesSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const packageVersionSet = getLineValue(summary, 'React Native Firebase package version set');
  const wiringValid = getLineValue(summary, 'Firebase release-services wiring valid');
  const warningCount = getLineValue(summary, 'Warnings');
  const wiringErrorCount = getLineValue(summary, 'Wiring errors');
  const requiredAction = getLineValue(summary, 'Required action');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const wiringErrorLines = getBulletLinesAfter(summary, 'Wiring errors');

  if (!summary.startsWith('Firebase release-services audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!packageVersionSet) {
    errors.push('React Native Firebase package version set is missing');
  }

  if (!['yes', 'no'].includes(wiringValid)) {
    errors.push(`Firebase release-services wiring valid must be yes or no. Received: ${wiringValid || 'missing'}`);
  }

  [
    ['Warnings', warningCount, warningLines.length],
    ['Wiring errors', wiringErrorCount, wiringErrorLines.length],
  ].forEach(([label, value, listedCount]) => {
    if (!/^\d+$/.test(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    } else if (Number(value) !== listedCount) {
      errors.push(`${label} count is ${value}, but listed ${listedCount}`);
    }
  });

  if (wiringValid === 'yes' && wiringErrorCount !== '0') {
    errors.push('Valid wiring summary must have 0 wiring errors');
  }

  if (wiringValid === 'no' && !requiredAction.includes('Firebase package, Android, iOS, and Messaging wiring')) {
    errors.push('Invalid wiring summary must include the Firebase wiring required action');
  }

  return errors;
};
