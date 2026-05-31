import { requiredSentryPropertiesFiles } from './auditSentryReleasePrerequisites.mjs';

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

export const getSentryReleasePrereqSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const readiness = getLineValue(summary, 'Release source-map prerequisites');
  const sentryReactNativeVersion = getLineValue(summary, '@sentry/react-native version');
  const sentryCliPackageVersion = getLineValue(summary, '@sentry/cli package version');
  const sentryCliBinPresent = getLineValue(summary, 'Sentry CLI binary present');
  const sentryCliVersionOutput = getLineValue(summary, 'Sentry CLI version output');
  const sentryCliExecutable = getLineValue(summary, 'Sentry CLI executable');
  const releaseIntegrationWired = getLineValue(summary, 'Sentry release integration wired');
  const releaseIntegrationErrors = getLineValue(summary, 'Sentry release integration errors');
  const filesPresent = getLineValue(summary, 'sentry.properties files present');
  const missingFiles = getLineValue(summary, 'Missing files');
  const invalidFiles = getLineValue(summary, 'Invalid files');
  const readinessEntries = getLineValue(summary, 'Properties file readiness entries');
  const readyPropertiesFiles = getLineValue(summary, 'Ready properties files');
  const androidReleaseSummaryPresent = getLineValue(summary, 'Android release summary present');
  const androidReleaseSummaryVariants = getLineValue(summary, 'Android release summary variants');
  const androidReleaseSummaryValid = getLineValue(summary, 'Android release summary valid');
  const androidReleaseSummaryErrors = getLineValue(summary, 'Android release summary errors');
  const sentryReleaseUploadValidation = getLineValue(summary, 'Sentry release upload validation');
  const createScriptPresent = getLineValue(summary, 'create-sentry-properties.sh present');
  const createScriptUsesToken = getLineValue(summary, 'create-sentry-properties.sh requires SENTRY_AUTH_TOKEN');
  const createScriptWritesRootProperties = getLineValue(summary, 'create-sentry-properties.sh writes root properties');
  const createScriptWritesAndroidProperties = getLineValue(summary, 'create-sentry-properties.sh writes Android properties');
  const createScriptWritesIosProperties = getLineValue(summary, 'create-sentry-properties.sh writes iOS properties');
  const createScriptStaticDefaultsValid = getLineValue(summary, 'create-sentry-properties.sh static defaults valid');
  const envHasToken = getLineValue(summary, 'SENTRY_AUTH_TOKEN available in current shell');
  const requiredAction = getLineValue(summary, 'Required action');
  const releaseIntegrationErrorLines = getBulletLinesAfter(summary, 'Sentry release integration errors');
  const missingFileLines = getBulletLinesAfter(summary, 'Missing files');
  const invalidFileLines = getBulletLinesAfter(summary, 'Invalid files');
  const readinessLines = getBulletLinesAfter(summary, 'Properties file readiness entries');
  const androidReleaseSummaryErrorLines = getBulletLinesAfter(summary, 'Android release summary errors');

  if (/(auth\.token|SENTRY_AUTH_TOKEN)\s*=/.test(summary)) {
    errors.push('summary must not print Sentry token assignments');
  }

  if (!summary.startsWith('Sentry release prerequisite audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!['ready', 'not ready'].includes(readiness)) {
    errors.push(`Release source-map prerequisites must be ready or not ready. Received: ${readiness || 'missing'}`);
  }

  if (!/^\d+\.\d+\.\d+/.test(sentryReactNativeVersion)) {
    errors.push(`@sentry/react-native version must be present. Received: ${sentryReactNativeVersion || 'missing'}`);
  }

  if (!/^\d+\.\d+\.\d+/.test(sentryCliPackageVersion)) {
    errors.push(`@sentry/cli package version must be present. Received: ${sentryCliPackageVersion || 'missing'}`);
  }

  if (!sentryCliVersionOutput) {
    errors.push('Sentry CLI version output must be present');
  } else if (/^\d+\.\d+\.\d+/.test(sentryCliPackageVersion) && !sentryCliVersionOutput.includes(sentryCliPackageVersion)) {
    errors.push('Sentry CLI version output must include the installed @sentry/cli package version');
  }

  if (!['yes', 'no'].includes(releaseIntegrationWired)) {
    errors.push(`Sentry release integration wired must be yes or no. Received: ${releaseIntegrationWired || 'missing'}`);
  }

  if (!/^\d+$/.test(releaseIntegrationErrors)) {
    errors.push(`Sentry release integration errors must be a non-negative integer. Received: ${releaseIntegrationErrors || 'missing'}`);
  } else if (Number(releaseIntegrationErrors) !== releaseIntegrationErrorLines.length) {
    errors.push(`Sentry release integration errors count is ${releaseIntegrationErrors}, but listed ${releaseIntegrationErrorLines.length}`);
  }

  if (releaseIntegrationWired === 'yes' && releaseIntegrationErrors !== '0') {
    errors.push('Wired Sentry release integration must have 0 integration errors');
  }

  if (!['yes', 'no'].includes(filesPresent)) {
    errors.push(`sentry.properties files present must be yes or no. Received: ${filesPresent || 'missing'}`);
  }

  if (!/^\d+$/.test(missingFiles)) {
    errors.push(`Missing files must be a non-negative integer. Received: ${missingFiles || 'missing'}`);
  } else if (Number(missingFiles) !== missingFileLines.length) {
    errors.push(`Missing files count is ${missingFiles}, but listed ${missingFileLines.length}`);
  }

  if (!/^\d+$/.test(invalidFiles)) {
    errors.push(`Invalid files must be a non-negative integer. Received: ${invalidFiles || 'missing'}`);
  } else if (Number(invalidFiles) !== invalidFileLines.length) {
    errors.push(`Invalid files count is ${invalidFiles}, but listed ${invalidFileLines.length}`);
  }

  if (!/^\d+$/.test(readinessEntries)) {
    errors.push(`Properties file readiness entries must be a non-negative integer. Received: ${readinessEntries || 'missing'}`);
  } else if (Number(readinessEntries) !== readinessLines.length) {
    errors.push(`Properties file readiness entries count is ${readinessEntries}, but listed ${readinessLines.length}`);
  } else if (Number(readinessEntries) !== requiredSentryPropertiesFiles.length) {
    errors.push(`Properties file readiness entries must cover ${requiredSentryPropertiesFiles.length} required sentry.properties files`);
  }

  if (!/^\d+$/.test(readyPropertiesFiles)) {
    errors.push(`Ready properties files must be a non-negative integer. Received: ${readyPropertiesFiles || 'missing'}`);
  }

  if (!['yes', 'no'].includes(androidReleaseSummaryPresent)) {
    errors.push(`Android release summary present must be yes or no. Received: ${androidReleaseSummaryPresent || 'missing'}`);
  }

  if (!androidReleaseSummaryVariants) {
    errors.push('Android release summary variants line is missing');
  }

  if (!['yes', 'no'].includes(androidReleaseSummaryValid)) {
    errors.push(`Android release summary valid must be yes or no. Received: ${androidReleaseSummaryValid || 'missing'}`);
  }

  if (!/^\d+$/.test(androidReleaseSummaryErrors)) {
    errors.push(`Android release summary errors must be a non-negative integer. Received: ${androidReleaseSummaryErrors || 'missing'}`);
  } else if (Number(androidReleaseSummaryErrors) !== androidReleaseSummaryErrorLines.length) {
    errors.push(`Android release summary errors count is ${androidReleaseSummaryErrors}, but listed ${androidReleaseSummaryErrorLines.length}`);
  }

  if (androidReleaseSummaryPresent === 'no' && androidReleaseSummaryVariants !== 'none') {
    errors.push('Missing Android release summary must report variants as none');
  }

  if (androidReleaseSummaryValid === 'yes' && androidReleaseSummaryErrors !== '0') {
    errors.push('Valid Android release summary must have 0 summary errors');
  }

  if (sentryReleaseUploadValidation !== 'not claimed') {
    errors.push(`Sentry release upload validation must be not claimed. Received: ${sentryReleaseUploadValidation || 'missing'}`);
  }

  [
    androidReleaseSummaryPresent,
    androidReleaseSummaryValid,
    sentryCliBinPresent,
    sentryCliExecutable,
    createScriptPresent,
    createScriptUsesToken,
    createScriptWritesRootProperties,
    createScriptWritesAndroidProperties,
    createScriptWritesIosProperties,
    createScriptStaticDefaultsValid,
    envHasToken,
  ].forEach(value => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`Boolean summary values must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  missingFileLines.forEach(relativePath => {
    if (!requiredSentryPropertiesFiles.includes(relativePath)) {
      errors.push(`Unexpected missing sentry.properties file listed: ${relativePath}`);
    }
  });

  const readinessByFile = new Map();
  readinessLines.forEach(line => {
    const match = line.match(/^([^:]+): (ready|missing|invalid)$/);

    if (!match) {
      errors.push(`Invalid properties readiness line: ${line}`);
      return;
    }

    const [, relativePath, status] = match;

    if (!requiredSentryPropertiesFiles.includes(relativePath)) {
      errors.push(`Unexpected sentry.properties readiness file listed: ${relativePath}`);
      return;
    }

    readinessByFile.set(relativePath, status);
  });

  requiredSentryPropertiesFiles.forEach(relativePath => {
    if (!readinessByFile.has(relativePath)) {
      errors.push(`Missing sentry.properties readiness entry: ${relativePath}`);
    }
  });

  if (/^\d+$/.test(readyPropertiesFiles)) {
    const listedReadyFiles = [...readinessByFile.values()].filter(status => status === 'ready').length;

    if (Number(readyPropertiesFiles) !== listedReadyFiles) {
      errors.push(`Ready properties files count is ${readyPropertiesFiles}, but listed ${listedReadyFiles}`);
    }
  }

  if (
    readiness === 'ready' &&
    (releaseIntegrationWired !== 'yes' ||
      sentryCliBinPresent !== 'yes' ||
      sentryCliExecutable !== 'yes' ||
      filesPresent !== 'yes' ||
      missingFiles !== '0' ||
      invalidFiles !== '0' ||
      readyPropertiesFiles !== String(requiredSentryPropertiesFiles.length))
  ) {
    errors.push('Ready summary must have wired Sentry release integration, executable Sentry CLI, present properties files, 0 missing files, 0 invalid files, and all properties files ready');
  }

  if (
    createScriptPresent === 'yes' &&
    (createScriptUsesToken !== 'yes' ||
      createScriptWritesRootProperties !== 'yes' ||
      createScriptWritesAndroidProperties !== 'yes' ||
      createScriptWritesIosProperties !== 'yes' ||
      createScriptStaticDefaultsValid !== 'yes')
  ) {
    errors.push('Present create-sentry-properties.sh must require SENTRY_AUTH_TOKEN, write root/android/iOS properties, and keep expected static defaults');
  }

  if (
    readiness === 'not ready' &&
    (!requiredAction.includes('SENTRY_AUTH_TOKEN') ||
      !requiredSentryPropertiesFiles.every(relativePath => requiredAction.includes(relativePath)))
  ) {
    errors.push('Not ready summary must include SENTRY_AUTH_TOKEN and all sentry.properties paths in the required action');
  }

  return errors;
};
