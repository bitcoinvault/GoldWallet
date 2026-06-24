const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const yesNoLabels = [
  'Migration summary valid',
  'Removal readiness summary valid',
  'Android dev smoke summary present',
  'Android dev smoke summary valid',
  'Android release smoke summary present',
  'Android release smoke summary valid',
  'Android release create-wallet smoke summary present',
  'Android release create-wallet smoke summary valid',
  'Controlled network blocker accepted',
  'Android dev smoke secure-storage steps completed',
  'Full Android runtime proof ready',
  'Keychain primary write',
  'Legacy fallback reads active',
  'Legacy writes disabled',
  'Legacy cleanup after successful migration',
  'Legacy fallback instrumentation active',
  'Removal release validation claimed',
  'Legacy package removal ready',
  'Android warning source still expected',
  'Secure-storage release validation evidence ready',
  'Android release evidence ready',
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
  const androidReleaseSmokePresent = getLineValue(summary, 'Android release smoke summary present');
  const androidReleaseSmokeValid = getLineValue(summary, 'Android release smoke summary valid');
  const androidReleaseSmokeArtifactBase = getLineValue(summary, 'Android release smoke artifact base');
  const androidReleaseSmokeOutcome = getLineValue(summary, 'Android release smoke outcome');
  const androidReleaseCreateWalletSmokePresent = getLineValue(summary, 'Android release create-wallet smoke summary present');
  const androidReleaseCreateWalletSmokeValid = getLineValue(summary, 'Android release create-wallet smoke summary valid');
  const androidReleaseCreateWalletSmokeArtifactBase = getLineValue(summary, 'Android release create-wallet smoke artifact base');
  const androidReleaseCreateWalletSmokeOutcome = getLineValue(summary, 'Android release create-wallet smoke outcome');
  const controlledNetworkBlockerOutcome = getLineValue(summary, 'Controlled network blocker outcome');
  const controlledNetworkBlockerAccepted = getLineValue(summary, 'Controlled network blocker accepted');
  const androidDevSmokeStorageStepsCompleted = getLineValue(summary, 'Android dev smoke secure-storage steps completed');
  const fullAndroidRuntimeProofReady = getLineValue(summary, 'Full Android runtime proof ready');
  const migrationErrors = getLineValue(summary, 'Migration summary errors');
  const removalErrors = getLineValue(summary, 'Removal readiness summary errors');
  const androidSmokeErrors = getLineValue(summary, 'Android dev smoke summary errors');
  const androidReleaseSmokeErrors = getLineValue(summary, 'Android release smoke summary errors');
  const androidReleaseCreateWalletSmokeErrors = getLineValue(summary, 'Android release create-wallet smoke summary errors');
  const androidReleaseNetworkBlockerErrors = getLineValue(summary, 'Android release network blocker summary errors');
  const requiredAction = getLineValue(summary, 'Required action');
  const controlledBlockerValid =
    controlledNetworkBlockerOutcome === 'blocked-by-electrum-certificate-expired' &&
    controlledNetworkBlockerAccepted === 'yes' &&
    androidDevSmokeStorageStepsCompleted === 'yes' &&
    androidReleaseNetworkBlockerErrors === '0';

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
    ['Android release smoke summary errors', androidReleaseSmokeErrors],
    ['Android release create-wallet smoke summary errors', androidReleaseCreateWalletSmokeErrors],
    ['Android release network blocker summary errors', androidReleaseNetworkBlockerErrors],
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

  if (androidSmokeOutcome !== 'passed' && !controlledBlockerValid) {
    errors.push(`Android smoke outcome must be passed for release-validation evidence. Received: ${androidSmokeOutcome || 'missing'}`);
  }

  if (controlledNetworkBlockerAccepted === 'yes') {
    if (controlledNetworkBlockerOutcome !== 'blocked-by-electrum-certificate-expired') {
      errors.push('Controlled network blocker accepted requires blocked-by-electrum-certificate-expired outcome');
    }

    if (androidDevSmokeStorageStepsCompleted !== 'yes') {
      errors.push('Controlled network blocker accepted requires completed Android dev secure-storage steps');
    }

    if (androidReleaseNetworkBlockerErrors !== '0') {
      errors.push('Controlled network blocker accepted requires 0 Android release network blocker summary errors');
    }

    if (fullAndroidRuntimeProofReady !== 'no') {
      errors.push('Full Android runtime proof must remain no while controlled network blocker is accepted');
    }

    if (!requiredAction.includes('fix the dev/testnet Electrum TLS certificate') || !requiredAction.includes('rerun full Android dev and release smoke')) {
      errors.push('Required action must mention fixing the dev/testnet Electrum TLS certificate and rerunning full Android dev and release smoke');
    }
  }

  if (androidReleaseSmokePresent === 'yes') {
    if ((androidReleaseSmokeValid !== 'yes' || androidReleaseSmokeErrors !== '0') && !controlledBlockerValid) {
      errors.push('Android release smoke summary must be valid when present');
    }

    if (androidReleaseSmokeArtifactBase !== 'android-smoke-dev-release') {
      errors.push(`Android release smoke artifact base must be android-smoke-dev-release. Received: ${androidReleaseSmokeArtifactBase || 'missing'}`);
    }

    if (androidReleaseSmokeOutcome !== 'passed' && !controlledBlockerValid) {
      errors.push(`Android release smoke outcome must be passed when present. Received: ${androidReleaseSmokeOutcome || 'missing'}`);
    }
  } else if (androidReleaseSmokeValid === 'yes') {
    errors.push('Android release smoke summary cannot be valid when it is not present');
  }

  if (androidReleaseCreateWalletSmokePresent === 'yes') {
    if ((androidReleaseCreateWalletSmokeValid !== 'yes' || androidReleaseCreateWalletSmokeErrors !== '0') && !controlledBlockerValid) {
      errors.push('Android release create-wallet smoke summary must be valid when present');
    }

    if (androidReleaseCreateWalletSmokeArtifactBase !== 'android-create-wallet-smoke-dev-release') {
      errors.push(
        `Android release create-wallet smoke artifact base must be android-create-wallet-smoke-dev-release. Received: ${
          androidReleaseCreateWalletSmokeArtifactBase || 'missing'
        }`,
      );
    }

    if (androidReleaseCreateWalletSmokeOutcome !== 'passed' && !controlledBlockerValid) {
      errors.push(`Android release create-wallet smoke outcome must be passed when present. Received: ${androidReleaseCreateWalletSmokeOutcome || 'missing'}`);
    }
  } else if (androidReleaseCreateWalletSmokeValid === 'yes') {
    errors.push('Android release create-wallet smoke summary cannot be valid when it is not present');
  }

  const androidReleaseEvidenceReady = getLineValue(summary, 'Android release evidence ready');
  const expectedAndroidReleaseEvidenceReady =
    androidReleaseSmokePresent === 'yes' &&
    androidReleaseSmokeValid === 'yes' &&
    androidReleaseSmokeErrors === '0' &&
    androidReleaseCreateWalletSmokePresent === 'yes' &&
    androidReleaseCreateWalletSmokeValid === 'yes' &&
    androidReleaseCreateWalletSmokeErrors === '0'
      ? 'yes'
      : 'no';

  if (androidReleaseEvidenceReady !== expectedAndroidReleaseEvidenceReady) {
    errors.push(
      `Android release evidence ready must be ${expectedAndroidReleaseEvidenceReady} for the reported release smoke evidence. Received: ${
        androidReleaseEvidenceReady || 'missing'
      }`,
    );
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

  if (getLineValue(summary, 'Android dev smoke summary valid') !== 'yes' && !controlledBlockerValid) {
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
