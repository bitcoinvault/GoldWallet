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

export const getCameraQrMigrationSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const cameraVersion = getLineValue(summary, 'react-native-camera manifest version');
  const cameraKitVersion = getLineValue(summary, 'react-native-camera-kit manifest version');
  const qrRendererVersion = getLineValue(summary, 'QR renderer version');
  const qrcodeResolution = getLineValue(summary, 'qrcode resolution');
  const wiringValid = getLineValue(summary, 'Camera QR migration wiring valid');
  const baselineStable = getLineValue(summary, 'Camera QR migration baseline stable');
  const warningCount = getLineValue(summary, 'Warnings');
  const readinessCount = getLineValue(summary, 'Readiness issues');
  const wiringErrorCount = getLineValue(summary, 'Wiring errors');
  const requiredAction = getLineValue(summary, 'Required action');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const readinessLines = getBulletLinesAfter(summary, 'Readiness issues');
  const wiringErrorLines = getBulletLinesAfter(summary, 'Wiring errors');

  if (!summary.startsWith('Camera QR migration audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!cameraVersion) {
    errors.push('react-native-camera manifest version is missing');
  }

  if (cameraKitVersion !== '18.0.0') {
    errors.push(`react-native-camera-kit manifest version must be 18.0.0. Received: ${cameraKitVersion || 'missing'}`);
  }

  if (!qrRendererVersion) {
    errors.push('QR renderer version is missing');
  }

  if (!qrcodeResolution) {
    errors.push('qrcode resolution is missing');
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

  if (baselineStable === 'yes' && !requiredAction.includes('none; camera QR migration baseline is stable')) {
    errors.push('Stable baseline summary must include the no-action camera QR required action');
  }

  if (baselineStable === 'no' && !requiredAction.includes('restore camera QR migration baseline')) {
    errors.push('Unstable baseline summary must include the camera QR restoration required action');
  }

  return errors;
};
