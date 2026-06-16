const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const yesNoLabels = [
  'Migration summary valid',
  'Removal readiness summary valid',
  'Android dev smoke summary present',
  'Android dev smoke summary valid',
  'Keychain primary write',
  'Legacy fallback reads active',
  'Legacy writes disabled',
  'Legacy cleanup after successful migration',
  'Legacy fallback instrumentation active',
  'Removal release validation claimed',
  'Legacy package removal ready',
  'Android warning source still expected',
  'Secure-storage release validation evidence ready',
  'Secret values printed',
];

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value);

export const getSecureStorageReleaseValidationSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const currentPackage = getLineValue(summary, 'Current secure-storage package');
  const legacyPackage = getLineValue(summary, 'Legacy secure-storage package');
  const focusedValidationScript = getLineValue(summary, 'Focused validation script');
  const androidSmokeArtifactBase = getLineValue(summary, 'Android smoke artifact base');
  const androidSmokeOutcome = getLineValue(summary, 'Android smoke outcome');
  const migrationErrors = getLineValue(summary, 'Migration summary errors');
  const removalErrors = getLineValue(summary, 'Removal readiness summary errors');
  const androidSmokeErrors = getLineValue(summary, 'Android dev smoke summary errors');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Secure-storage release validation summary')) {
    errors.push('summary header is missing or invalid');
  }

  if (!isIsoTimestamp(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (currentPackage !== 'react-native-keychain@10.0.0') {
    errors.push(`Current secure-storage package must be react-native-keychain@10.0.0. Received: ${currentPackage || 'missing'}`);
  }

  if (legacyPackage !== 'react-native-secure-key-store@2.0.10') {
    errors.push(`Legacy secure-storage package must be react-native-secure-key-store@2.0.10. Received: ${legacyPackage || 'missing'}`);
  }

  yesNoLabels.forEach(label => {
    const value = getLineValue(summary, label);
    if (!['yes', 'no'].includes(value)) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  [
    ['Migration summary errors', migrationErrors],
    ['Removal readiness summary errors', removalErrors],
    ['Android dev smoke summary errors', androidSmokeErrors],
  ].forEach(([label, value]) => {
    if (!isNonNegativeInteger(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    }
  });

  if (focusedValidationScript !== 'test:storage-network:focused') {
    errors.push(`Focused validation script must be test:storage-network:focused. Received: ${focusedValidationScript || 'missing'}`);
  }

  if (androidSmokeArtifactBase !== 'android-smoke-dev') {
    errors.push(`Android smoke artifact base must be android-smoke-dev. Received: ${androidSmokeArtifactBase || 'missing'}`);
  }

  if (androidSmokeOutcome !== 'passed') {
    errors.push(`Android smoke outcome must be passed for release-validation evidence. Received: ${androidSmokeOutcome || 'missing'}`);
  }

  if (getLineValue(summary, 'Migration summary valid') !== 'yes') {
    errors.push('Migration summary must be valid before secure-storage release validation can be tracked');
  }

  if (getLineValue(summary, 'Removal readiness summary valid') !== 'yes') {
    errors.push('Removal readiness summary must be valid before secure-storage release validation can be tracked');
  }

  if (getLineValue(summary, 'Android dev smoke summary present') !== 'yes') {
    errors.push('Android dev smoke summary must be present before secure-storage release validation can be tracked');
  }

  if (getLineValue(summary, 'Android dev smoke summary valid') !== 'yes') {
    errors.push('Android dev smoke summary must be valid before secure-storage release validation can be tracked');
  }

  if (getLineValue(summary, 'Keychain primary write') !== 'yes') {
    errors.push('Keychain primary write must stay enabled');
  }

  if (getLineValue(summary, 'Legacy fallback reads active') !== 'yes') {
    errors.push('Legacy fallback reads must remain active until release validation without fallback is explicitly claimed');
  }

  if (getLineValue(summary, 'Legacy writes disabled') !== 'yes') {
    errors.push('Legacy writes must stay disabled during staged migration');
  }

  if (getLineValue(summary, 'Legacy cleanup after successful migration') !== 'yes') {
    errors.push('Legacy cleanup after successful migration must stay enabled');
  }

  if (getLineValue(summary, 'Legacy fallback instrumentation active') !== 'yes') {
    errors.push('Legacy fallback instrumentation must stay enabled until fallback-free validation is claimed');
  }

  if (getLineValue(summary, 'Removal release validation claimed') !== 'no') {
    errors.push('Removal release validation must remain unclaimed while fallback reads are active');
  }

  if (getLineValue(summary, 'Legacy package removal ready') !== 'no') {
    errors.push('Legacy package removal must remain blocked while fallback reads are active');
  }

  if (getLineValue(summary, 'Android warning source still expected') !== 'yes') {
    errors.push('Android warning source must remain expected while react-native-secure-key-store is installed');
  }

  if (getLineValue(summary, 'Secure-storage release validation evidence ready') !== 'yes') {
    errors.push('Secure-storage release validation evidence must be ready before this summary is valid');
  }

  if (getLineValue(summary, 'Secret values printed') !== 'no') {
    errors.push('Secure-storage release validation summary must not print secret values');
  }

  if (!requiredAction.includes('keep react-native-secure-key-store installed')) {
    errors.push('Required action must keep react-native-secure-key-store installed until fallback-free validation is claimed');
  }

  return errors;
};
