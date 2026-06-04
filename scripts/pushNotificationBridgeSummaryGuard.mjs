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

export const getPushNotificationBridgeSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const packageDependencyVersion = getLineValue(summary, 'Push notification package dependency version');
  const packageInstalledVersion = getLineValue(summary, 'Push notification package installed version');
  const packageLatestVersion = getLineValue(summary, 'Push notification package latest version');
  const packageLatestPublishedAt = getLineValue(summary, 'Push notification package latest published at');
  const packageRepositoryUrl = getLineValue(summary, 'Push notification package npm repository');
  const packageCurrent = getLineValue(summary, 'Push notification package current');
  const wiringValid = getLineValue(summary, 'Push notification bridge wiring valid');
  const runtimeDeliveryValidation = getLineValue(summary, 'Push notification runtime delivery validation');
  const readinessCount = getLineValue(summary, 'Static readiness issues');
  const wiringErrorCount = getLineValue(summary, 'Wiring errors');
  const requiredAction = getLineValue(summary, 'Required action');
  const readinessLines = getBulletLinesAfter(summary, 'Static readiness issues');
  const wiringErrorLines = getBulletLinesAfter(summary, 'Wiring errors');

  if (!summary.startsWith('Push notification bridge audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!['yes', 'no'].includes(wiringValid)) {
    errors.push(`Push notification bridge wiring valid must be yes or no. Received: ${wiringValid || 'missing'}`);
  }

  if (!/^\d+\.\d+\.\d+$/.test(packageDependencyVersion)) {
    errors.push(`Push notification package dependency version must be present. Received: ${packageDependencyVersion || 'missing'}`);
  }

  if (packageInstalledVersion !== packageDependencyVersion) {
    errors.push(`Push notification package installed version must match dependency version. Received: ${packageInstalledVersion || 'missing'}`);
  }

  if (packageLatestVersion !== packageDependencyVersion) {
    errors.push(`Push notification package latest version must match dependency version. Received: ${packageLatestVersion || 'missing'}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}T/.test(packageLatestPublishedAt)) {
    errors.push(`Push notification package latest published timestamp must be present. Received: ${packageLatestPublishedAt || 'missing'}`);
  }

  if (!packageRepositoryUrl.includes('react-native-community/push-notification-ios')) {
    errors.push(`Push notification package npm repository must reference react-native-community/push-notification-ios. Received: ${packageRepositoryUrl || 'missing'}`);
  }

  if (packageCurrent !== 'yes') {
    errors.push(`Push notification package current must be yes. Received: ${packageCurrent || 'missing'}`);
  }

  if (runtimeDeliveryValidation !== 'not claimed') {
    errors.push(`Push notification runtime delivery validation must be not claimed. Received: ${runtimeDeliveryValidation || 'missing'}`);
  }

  [
    ['Static readiness issues', readinessCount, readinessLines.length],
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

  if (wiringValid === 'no' && !requiredAction.includes('push notification bridge wiring')) {
    errors.push('Invalid wiring summary must include the push notification bridge required action');
  }

  return errors;
};
