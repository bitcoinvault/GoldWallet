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
  const releaseIntegrationWired = getLineValue(summary, 'Sentry release integration wired');
  const releaseIntegrationErrors = getLineValue(summary, 'Sentry release integration errors');
  const filesPresent = getLineValue(summary, 'sentry.properties files present');
  const missingFiles = getLineValue(summary, 'Missing files');
  const invalidFiles = getLineValue(summary, 'Invalid files');
  const createScriptPresent = getLineValue(summary, 'create-sentry-properties.sh present');
  const createScriptUsesToken = getLineValue(summary, 'create-sentry-properties.sh requires SENTRY_AUTH_TOKEN');
  const envHasToken = getLineValue(summary, 'SENTRY_AUTH_TOKEN available in current shell');
  const requiredAction = getLineValue(summary, 'Required action');
  const releaseIntegrationErrorLines = getBulletLinesAfter(summary, 'Sentry release integration errors');
  const missingFileLines = getBulletLinesAfter(summary, 'Missing files');
  const invalidFileLines = getBulletLinesAfter(summary, 'Invalid files');

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

  [createScriptPresent, createScriptUsesToken, envHasToken].forEach(value => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`Boolean summary values must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  missingFileLines.forEach(relativePath => {
    if (!requiredSentryPropertiesFiles.includes(relativePath)) {
      errors.push(`Unexpected missing sentry.properties file listed: ${relativePath}`);
    }
  });

  if (
    readiness === 'ready' &&
    (releaseIntegrationWired !== 'yes' || filesPresent !== 'yes' || missingFiles !== '0' || invalidFiles !== '0')
  ) {
    errors.push('Ready summary must have wired Sentry release integration, present properties files, 0 missing files, and 0 invalid files');
  }

  if (readiness === 'not ready' && !requiredAction.includes('SENTRY_AUTH_TOKEN')) {
    errors.push('Not ready summary must include the SENTRY_AUTH_TOKEN required action');
  }

  return errors;
};
