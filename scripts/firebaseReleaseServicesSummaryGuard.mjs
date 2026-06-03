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
  const androidReleaseSummaryPresent = getLineValue(summary, 'Android release summary present');
  const androidReleaseSummaryVariants = getLineValue(summary, 'Android release summary variants');
  const androidReleaseSummaryRequiredVariantsCovered = getLineValue(summary, 'Android release summary required variants covered');
  const androidReleaseSummaryValid = getLineValue(summary, 'Android release summary valid');
  const androidReleaseSummaryCurrentInputsCovered = getLineValue(summary, 'Android release summary current inputs covered');
  const androidReleaseSummaryErrorCount = getLineValue(summary, 'Android release summary errors');
  const androidReleaseApkManifestValid = getLineValue(summary, 'Android release APK manifest valid');
  const androidReleaseApkManifestErrorCount = getLineValue(summary, 'Android release APK manifest errors');
  const firebaseRuntimeDeliveryValidation = getLineValue(summary, 'Firebase runtime delivery validation');
  const warningCount = getLineValue(summary, 'Warnings');
  const wiringErrorCount = getLineValue(summary, 'Wiring errors');
  const requiredAction = getLineValue(summary, 'Required action');
  const androidReleaseSummaryErrorLines = getBulletLinesAfter(summary, 'Android release summary errors');
  const androidReleaseApkManifestErrorLines = getBulletLinesAfter(summary, 'Android release APK manifest errors');
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
    androidReleaseSummaryPresent,
    androidReleaseSummaryRequiredVariantsCovered,
    androidReleaseSummaryValid,
    androidReleaseSummaryCurrentInputsCovered,
    androidReleaseApkManifestValid,
  ].forEach(value => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`Boolean summary values must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  if (!androidReleaseSummaryVariants) {
    errors.push('Android release summary variants line is missing');
  }

  if (androidReleaseSummaryPresent === 'no' && androidReleaseSummaryVariants !== 'none') {
    errors.push('Missing Android release summary must report variants as none');
  }

  if (androidReleaseSummaryPresent === 'yes') {
    const variants = androidReleaseSummaryVariants
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean);

    ['dev', 'stage', 'prod', 'beta'].forEach(variant => {
      if (!variants.includes(variant)) {
        errors.push(`Android release summary must include ${variant} release evidence`);
      }
    });
  }

  if (androidReleaseSummaryRequiredVariantsCovered !== 'yes') {
    errors.push('Android release summary must cover dev, stage, prod, and beta release evidence');
  }

  if (firebaseRuntimeDeliveryValidation !== 'not claimed') {
    errors.push(`Firebase runtime delivery validation must be not claimed. Received: ${firebaseRuntimeDeliveryValidation || 'missing'}`);
  }

  [
    ['Android release summary errors', androidReleaseSummaryErrorCount, androidReleaseSummaryErrorLines.length],
    ['Android release APK manifest errors', androidReleaseApkManifestErrorCount, androidReleaseApkManifestErrorLines.length],
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

  if (androidReleaseSummaryValid === 'yes' && androidReleaseSummaryErrorCount !== '0') {
    errors.push('Valid Android release summary must have 0 summary errors');
  }

  if (androidReleaseSummaryValid === 'yes' && androidReleaseSummaryCurrentInputsCovered !== 'yes') {
    errors.push('Valid Android release summary must cover the current release inputs');
  }

  if (androidReleaseApkManifestValid === 'yes' && androidReleaseApkManifestErrorCount !== '0') {
    errors.push('Valid Android release APK manifest proof must have 0 manifest errors');
  }

  if (wiringValid === 'no' && !requiredAction.includes('Firebase package, Android, iOS, and Messaging wiring')) {
    errors.push('Invalid wiring summary must include the Firebase wiring required action');
  }

  return errors;
};
