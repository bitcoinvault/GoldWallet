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
  'Camera candidate summary valid',
  'Camera QR migration summary valid',
  'Android dev smoke summary present',
  'Android dev smoke summary valid',
  'Android dev QR scanner validated',
  'Android release smoke summary present',
  'Android release smoke summary valid',
  'Android release QR scanner validated',
  'Android release create-wallet smoke summary present',
  'Android release create-wallet smoke summary valid',
  'iOS camera Podfile.lock cleanup complete',
  'iOS broader Podfile.lock refresh required',
  'iOS runtime validation claimed',
  'Camera/QR Android validation evidence ready',
  'Android release evidence ready',
  'Secret values printed',
];

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value);

export const getCameraQrValidationSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const cameraKitPackage = getLineValue(summary, 'CameraKit package');
  const qrRendererPackage = getLineValue(summary, 'QR renderer package');
  const qrNativeRendererPackage = getLineValue(summary, 'QR native renderer package');
  const qrEncoderResolution = getLineValue(summary, 'QR encoder resolution');
  const androidSmokeArtifactBase = getLineValue(summary, 'Android smoke artifact base');
  const androidSmokeOutcome = getLineValue(summary, 'Android smoke outcome');
  const androidReleaseSmokePresent = getLineValue(summary, 'Android release smoke summary present');
  const androidReleaseSmokeValid = getLineValue(summary, 'Android release smoke summary valid');
  const androidReleaseSmokeArtifactBase = getLineValue(summary, 'Android release smoke artifact base');
  const androidReleaseSmokeOutcome = getLineValue(summary, 'Android release smoke outcome');
  const androidReleaseCreateWalletPresent = getLineValue(summary, 'Android release create-wallet smoke summary present');
  const androidReleaseCreateWalletValid = getLineValue(summary, 'Android release create-wallet smoke summary valid');
  const androidReleaseCreateWalletArtifactBase = getLineValue(summary, 'Android release create-wallet smoke artifact base');
  const androidReleaseCreateWalletOutcome = getLineValue(summary, 'Android release create-wallet smoke outcome');
  const iosBroaderRefreshRequired = getLineValue(summary, 'iOS broader Podfile.lock refresh required');
  const iosBroaderDriftIssues = getLineValue(summary, 'iOS broader Podfile.lock drift issues');
  const candidateErrors = getLineValue(summary, 'Camera candidate summary errors');
  const migrationErrors = getLineValue(summary, 'Camera QR migration summary errors');
  const androidSmokeErrors = getLineValue(summary, 'Android dev smoke summary errors');
  const androidReleaseSmokeErrors = getLineValue(summary, 'Android release smoke summary errors');
  const androidReleaseCreateWalletErrors = getLineValue(summary, 'Android release create-wallet smoke summary errors');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Camera/QR validation summary')) {
    errors.push('summary header is missing or invalid');
  }

  if (!isIsoTimestamp(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (cameraKitPackage !== 'react-native-camera-kit@18.0.0') {
    errors.push(`CameraKit package must be react-native-camera-kit@18.0.0. Received: ${cameraKitPackage || 'missing'}`);
  }

  if (qrRendererPackage !== 'react-native-qrcode-svg@6.3.21') {
    errors.push(`QR renderer package must be react-native-qrcode-svg@6.3.21. Received: ${qrRendererPackage || 'missing'}`);
  }

  if (qrNativeRendererPackage !== 'react-native-svg@15.15.5') {
    errors.push(`QR native renderer package must be react-native-svg@15.15.5. Received: ${qrNativeRendererPackage || 'missing'}`);
  }

  if (qrEncoderResolution !== 'qrcode@1.5.4') {
    errors.push(`QR encoder resolution must be qrcode@1.5.4. Received: ${qrEncoderResolution || 'missing'}`);
  }

  yesNoLabels.forEach(label => {
    const value = getLineValue(summary, label);
    if (!['yes', 'no'].includes(value)) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  [
    ['iOS broader Podfile.lock drift issues', iosBroaderDriftIssues, getBulletLinesAfter(summary, 'iOS broader Podfile.lock drift issues').length],
    ['Camera candidate summary errors', candidateErrors, getBulletLinesAfter(summary, 'Camera candidate summary errors').length],
    ['Camera QR migration summary errors', migrationErrors, getBulletLinesAfter(summary, 'Camera QR migration summary errors').length],
    ['Android dev smoke summary errors', androidSmokeErrors, getBulletLinesAfter(summary, 'Android dev smoke summary errors').length],
    ['Android release smoke summary errors', androidReleaseSmokeErrors, getBulletLinesAfter(summary, 'Android release smoke summary errors').length],
    [
      'Android release create-wallet smoke summary errors',
      androidReleaseCreateWalletErrors,
      getBulletLinesAfter(summary, 'Android release create-wallet smoke summary errors').length,
    ],
  ].forEach(([label, value, listedCount]) => {
    if (!isNonNegativeInteger(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    } else if (Number(value) !== listedCount) {
      errors.push(`${label} count is ${value}, but listed ${listedCount}`);
    }
  });

  if (androidSmokeArtifactBase !== 'android-smoke-dev') {
    errors.push(`Android smoke artifact base must be android-smoke-dev. Received: ${androidSmokeArtifactBase || 'missing'}`);
  }

  const androidSmokePresent = getLineValue(summary, 'Android dev smoke summary present');
  const androidSmokeValid = getLineValue(summary, 'Android dev smoke summary valid');
  const androidDevQrScannerValidated = getLineValue(summary, 'Android dev QR scanner validated');
  const androidValidationEvidenceReady = getLineValue(summary, 'Camera/QR Android validation evidence ready');
  const androidReleaseEvidenceReady = getLineValue(summary, 'Android release evidence ready');

  if (androidSmokeValid === 'yes' && androidSmokeOutcome !== 'passed') {
    errors.push(`Valid Android smoke outcome must be passed. Received: ${androidSmokeOutcome || 'missing'}`);
  }

  if (androidReleaseEvidenceReady === 'yes') {
    if (androidReleaseSmokePresent !== 'yes') {
      errors.push('Android release smoke summary must be present before release evidence is ready');
    }

    if (androidReleaseSmokeValid !== 'yes' || androidReleaseSmokeErrors !== '0') {
      errors.push('Android release smoke summary must be valid before release evidence is ready');
    }

    if (androidReleaseSmokeArtifactBase !== 'android-smoke-dev-release') {
      errors.push(`Android release smoke artifact base must be android-smoke-dev-release. Received: ${androidReleaseSmokeArtifactBase || 'missing'}`);
    }

    if (androidReleaseSmokeOutcome !== 'passed') {
      errors.push(`Android release smoke outcome must be passed before release evidence is ready. Received: ${androidReleaseSmokeOutcome || 'missing'}`);
    }
  } else if (androidReleaseSmokePresent !== 'yes' && androidReleaseSmokeValid === 'yes') {
    errors.push('Android release smoke summary cannot be valid when it is not present');
  }

  if (androidReleaseEvidenceReady === 'yes') {
    if (androidReleaseCreateWalletPresent !== 'yes') {
      errors.push('Android release create-wallet smoke summary must be present before release evidence is ready');
    }

    if (androidReleaseCreateWalletValid !== 'yes' || androidReleaseCreateWalletErrors !== '0') {
      errors.push('Android release create-wallet smoke summary must be valid before release evidence is ready');
    }

    if (androidReleaseCreateWalletArtifactBase !== 'android-create-wallet-smoke-dev-release') {
      errors.push(
        `Android release create-wallet smoke artifact base must be android-create-wallet-smoke-dev-release. Received: ${
          androidReleaseCreateWalletArtifactBase || 'missing'
        }`,
      );
    }

    if (androidReleaseCreateWalletOutcome !== 'passed') {
      errors.push(`Android release create-wallet smoke outcome must be passed before release evidence is ready. Received: ${androidReleaseCreateWalletOutcome || 'missing'}`);
    }
  } else if (androidReleaseCreateWalletPresent !== 'yes' && androidReleaseCreateWalletValid === 'yes') {
    errors.push('Android release create-wallet smoke summary cannot be valid when it is not present');
  }

  const expectedAndroidEvidenceReady =
    getLineValue(summary, 'Camera candidate summary valid') === 'yes' &&
    getLineValue(summary, 'Camera QR migration summary valid') === 'yes' &&
    androidSmokePresent === 'yes' &&
    androidSmokeValid === 'yes' &&
    androidDevQrScannerValidated === 'yes'
      ? 'yes'
      : 'no';

  if (androidValidationEvidenceReady !== expectedAndroidEvidenceReady) {
    errors.push(`Camera/QR Android validation evidence ready must be ${expectedAndroidEvidenceReady} for the reported evidence`);
  }

  const expectedAndroidReleaseEvidenceReady =
    androidReleaseSmokePresent === 'yes' &&
    androidReleaseSmokeValid === 'yes' &&
    androidReleaseSmokeErrors === '0' &&
    getLineValue(summary, 'Android release QR scanner validated') === 'yes' &&
    androidReleaseCreateWalletPresent === 'yes' &&
    androidReleaseCreateWalletValid === 'yes' &&
    androidReleaseCreateWalletErrors === '0'
      ? 'yes'
      : 'no';

  if (androidReleaseEvidenceReady !== expectedAndroidReleaseEvidenceReady) {
    errors.push(`Android release evidence ready must be ${expectedAndroidReleaseEvidenceReady} for the reported release evidence`);
  }

  if (getLineValue(summary, 'Camera candidate summary valid') !== 'yes') {
    errors.push('Camera candidate summary must be valid before Camera/QR validation evidence can be tracked');
  }

  if (getLineValue(summary, 'Camera QR migration summary valid') !== 'yes') {
    errors.push('Camera QR migration summary must be valid before Camera/QR validation evidence can be tracked');
  }

  if (
    androidValidationEvidenceReady === 'yes' &&
    (androidSmokePresent !== 'yes' || androidSmokeValid !== 'yes' || androidDevQrScannerValidated !== 'yes')
  ) {
    errors.push('Ready Android Camera/QR evidence requires a present, valid Android dev smoke summary that proves QR scanner screen validation');
  }

  if (getLineValue(summary, 'iOS camera Podfile.lock cleanup complete') !== 'yes') {
    errors.push('iOS camera Podfile.lock cleanup must be complete for removed camera pods');
  }

  if (iosBroaderRefreshRequired === 'yes' && iosBroaderDriftIssues === '0') {
    errors.push('iOS broader Podfile.lock refresh cannot be required with 0 drift issues');
  }

  if (iosBroaderRefreshRequired === 'no' && iosBroaderDriftIssues !== '0') {
    errors.push('iOS broader Podfile.lock drift issues must be 0 when refresh is not required');
  }

  if (getLineValue(summary, 'iOS runtime validation claimed') !== 'no') {
    errors.push('iOS runtime validation must remain unclaimed on Windows');
  }

  if (getLineValue(summary, 'Secret values printed') !== 'no') {
    errors.push('Camera/QR validation summary must not print secret values');
  }

  if (!requiredAction.includes('Android CameraKit scanner evidence')) {
    errors.push('Required action must mention Android CameraKit scanner evidence');
  }

  if (!requiredAction.includes('rerun Android dev and release Camera/QR smoke')) {
    errors.push('Required action must mention rerunning Android dev and release Camera/QR smoke before claiming Android validation');
  }

  if (!requiredAction.includes('pod install on macOS')) {
    errors.push('Required action must mention pod install on macOS before iOS runtime validation');
  }

  return errors;
};
