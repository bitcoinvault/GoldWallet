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

const yesNoLabels = [
  'Keychain primary write',
  'Legacy fallback reads active',
  'Legacy write path disabled',
  'Legacy cleanup after successful migration',
  'Legacy fallback instrumentation active',
  'SecureStorageService fallback migration tests present',
  'SecureStorageService keychain-failure empty fallback tests present',
  'AppStorage fallback migration tests present',
  'AppStorage keychain-failure empty fallback tests present',
  'Fallback migration tests present',
  'Removal release validation claimed',
  'Android warning source still expected',
  'Legacy package removal ready',
  'Secret values printed',
];

export const getSecureStorageRemovalReadinessSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const currentPackage = getLineValue(summary, 'Current secure-storage package');
  const legacyPackage = getLineValue(summary, 'Legacy secure-storage package');
  const currentPosture = getLineValue(summary, 'Current posture');
  const requiredValidation = getLineValue(summary, 'Required release validation');
  const removalBlocker = getLineValue(summary, 'Removal blocker');
  const warningCount = getLineValue(summary, 'Warnings');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const errorCount = getLineValue(summary, 'Errors');
  const errorLines = getBulletLinesAfter(summary, 'Errors');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Secure-storage removal readiness audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  yesNoLabels.forEach(label => {
    const value = getLineValue(summary, label);
    if (!['yes', 'no'].includes(value)) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  if (currentPackage !== 'react-native-keychain@10.0.0') {
    errors.push(`Current secure-storage package must be react-native-keychain@10.0.0. Received: ${currentPackage || 'missing'}`);
  }

  if (legacyPackage !== 'react-native-secure-key-store@2.0.10') {
    errors.push(`Legacy secure-storage package must be react-native-secure-key-store@2.0.10. Received: ${legacyPackage || 'missing'}`);
  }

  if (currentPosture !== 'staged migration with legacy fallback') {
    errors.push(`Current posture must be staged migration with legacy fallback. Received: ${currentPosture || 'missing'}`);
  }

  if (!requiredValidation.includes('migrated PIN') || !requiredValidation.includes('transaction-password') || !requiredValidation.includes('encrypted wallet data')) {
    errors.push('Required release validation must name migrated PIN, transaction-password, and encrypted wallet data');
  }

  if (getLineValue(summary, 'Keychain primary write') !== 'yes') {
    errors.push('Keychain primary write must stay yes before legacy removal');
  }

  if (getLineValue(summary, 'Legacy write path disabled') !== 'yes') {
    errors.push('Legacy write path disabled must stay yes');
  }

  if (getLineValue(summary, 'Legacy cleanup after successful migration') !== 'yes') {
    errors.push('Legacy cleanup after successful migration must stay yes before removal readiness can be tracked');
  }

  if (getLineValue(summary, 'Legacy fallback instrumentation active') !== 'yes') {
    errors.push('Legacy fallback instrumentation must stay active before removal readiness can be tracked');
  }

  if (getLineValue(summary, 'SecureStorageService fallback migration tests present') !== 'yes') {
    errors.push('SecureStorageService fallback migration tests must be present before removal readiness can be tracked');
  }

  if (getLineValue(summary, 'SecureStorageService keychain-failure empty fallback tests present') !== 'yes') {
    errors.push('SecureStorageService keychain-failure empty fallback tests must be present before removal readiness can be tracked');
  }

  if (getLineValue(summary, 'AppStorage fallback migration tests present') !== 'yes') {
    errors.push('AppStorage fallback migration tests must be present before removal readiness can be tracked');
  }

  if (getLineValue(summary, 'AppStorage keychain-failure empty fallback tests present') !== 'yes') {
    errors.push('AppStorage keychain-failure empty fallback tests must be present before removal readiness can be tracked');
  }

  if (getLineValue(summary, 'Fallback migration tests present') !== 'yes') {
    errors.push('Fallback migration tests must be present before removal readiness can be tracked');
  }

  if (getLineValue(summary, 'Legacy fallback reads active') !== 'yes') {
    errors.push('Legacy fallback reads must remain active until release validation proves removal');
  }

  if (getLineValue(summary, 'Removal release validation claimed') !== 'no') {
    errors.push('Removal release validation must not be claimed without funded/device release proof');
  }

  if (getLineValue(summary, 'Legacy package removal ready') !== 'no') {
    errors.push('Legacy package removal must stay blocked while fallback reads are active');
  }

  if (!removalBlocker.includes('release validation is not claimed')) {
    errors.push('Removal blocker must mention that release validation is not claimed');
  }

  [
    ['Warnings', warningCount, warningLines.length],
    ['Errors', errorCount, errorLines.length],
  ].forEach(([label, value, listedCount]) => {
    if (!/^\d+$/.test(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    } else if (Number(value) !== listedCount) {
      errors.push(`${label} count is ${value}, but listed ${listedCount}`);
    }
  });

  if (getLineValue(summary, 'Secret values printed') !== 'no') {
    errors.push('Secure-storage removal readiness summary must not print secret values');
  }

  if (!requiredAction.includes('keep react-native-secure-key-store installed')) {
    errors.push('Required action must keep react-native-secure-key-store installed until release validation is claimed');
  }

  return errors;
};
