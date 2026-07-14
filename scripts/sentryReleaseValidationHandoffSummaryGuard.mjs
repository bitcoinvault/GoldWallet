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
  'Android release evidence refresh skipped',
  'Android warning summary valid',
  'RN bundle task compatibility summary valid',
  'Release prerequisite summary valid',
  'Credential plan valid',
  'Sentry packages current',
  'SENTRY_AUTH_TOKEN available',
  'Sentry properties files ready',
  'Sentry release smoke evidence ready',
  'Sentry release no-network blocker evidence ready',
  'Sentry release network blocker classified',
  'Sentry release create-wallet evidence ready',
  'iOS macOS validation prerequisites ready',
  'Secret values printed',
];

const handoffOutcomes = ['ready-for-credentialed-upload-test', 'blocked'];
const blockerTypes = [
  'none',
  'summary-invalid',
  'missing-sentry-credentials',
  'blocked-by-electrum-certificate-expired',
  'ios-validation-not-ready',
  'release-evidence-not-ready',
];

export const getSentryReleaseValidationHandoffSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const releaseSourceMapPrereqs = getLineValue(summary, 'Release source-map prerequisites');
  const androidWarningSummaryValid = getLineValue(summary, 'Android warning summary valid');
  const rnBundleTaskCompatibilitySummaryValid = getLineValue(summary, 'RN bundle task compatibility summary valid');
  const prereqSummaryValid = getLineValue(summary, 'Release prerequisite summary valid');
  const credentialPlanValid = getLineValue(summary, 'Credential plan valid');
  const sentryPackagesCurrent = getLineValue(summary, 'Sentry packages current');
  const sentryAuthTokenAvailable = getLineValue(summary, 'SENTRY_AUTH_TOKEN available');
  const sentryPropertiesReady = getLineValue(summary, 'Sentry properties files ready');
  const uploadValidation = getLineValue(summary, 'Sentry release upload validation');
  const runtimeProofState = getLineValue(summary, 'Sentry release runtime proof state');
  const controlledBlockerOutcome = getLineValue(summary, 'Controlled release blocker outcome');
  const iosMacValidationPrereqsReady = getLineValue(summary, 'iOS macOS validation prerequisites ready');
  const handoffOutcome = getLineValue(summary, 'Handoff outcome');
  const blockerType = getLineValue(summary, 'Handoff blocker type');
  const iosValidationStatus = getLineValue(summary, 'iOS runtime validation');
  const readinessErrorCount = getLineValue(summary, 'Readiness errors');
  const readinessErrorLines = getBulletLinesAfter(summary, 'Readiness errors');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Sentry release validation handoff summary')) {
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

  if (!['ready', 'not ready'].includes(releaseSourceMapPrereqs)) {
    errors.push(
      `Release source-map prerequisites must be ready or not ready. Received: ${releaseSourceMapPrereqs || 'missing'}`,
    );
  }

  if (uploadValidation !== 'not claimed') {
    errors.push(`Sentry release upload validation must remain not claimed. Received: ${uploadValidation || 'missing'}`);
  }

  if (!['ready', 'not ready', 'blocked-by-electrum-certificate-expired'].includes(runtimeProofState)) {
    errors.push(`Sentry release runtime proof state is invalid. Received: ${runtimeProofState || 'missing'}`);
  }

  if (!handoffOutcomes.includes(handoffOutcome)) {
    errors.push(`Handoff outcome must be one of ${handoffOutcomes.join(', ')}. Received: ${handoffOutcome || 'missing'}`);
  }

  if (!blockerTypes.includes(blockerType)) {
    errors.push(`Handoff blocker type must be one of ${blockerTypes.join(', ')}. Received: ${blockerType || 'missing'}`);
  }

  if (!/^\d+$/.test(readinessErrorCount)) {
    errors.push(`Readiness errors must be a non-negative integer. Received: ${readinessErrorCount || 'missing'}`);
  } else if (Number(readinessErrorCount) !== readinessErrorLines.length) {
    errors.push(`Readiness errors count is ${readinessErrorCount}, but listed ${readinessErrorLines.length}`);
  }

  if (!iosValidationStatus.includes('not claimed')) {
    errors.push('iOS runtime validation must remain not claimed unless it actually ran on macOS/Xcode');
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('Sentry release validation handoff summary must not print secret values');
  }

  if (summary.includes('SENTRY_AUTH_TOKEN=') || summary.includes('auth.token=')) {
    errors.push('Sentry release validation handoff summary must not print Sentry token assignments');
  }

  if (runtimeProofState === 'blocked-by-electrum-certificate-expired') {
    if (controlledBlockerOutcome !== 'blocked-by-electrum-certificate-expired') {
      errors.push('Controlled Electrum blocker must be visible when runtime proof is blocked by the certificate issue');
    }

    if (handoffOutcome !== 'blocked') {
      errors.push('Controlled Electrum blocker must keep Sentry release validation blocked');
    }
  }

  if (handoffOutcome === 'ready-for-credentialed-upload-test') {
    if (blockerType !== 'none') {
      errors.push('Ready Sentry release handoff must use blocker type none');
    }

    if (readinessErrorLines.length !== 0) {
      errors.push('Ready Sentry release handoff cannot list readiness errors');
    }

    if (
      androidWarningSummaryValid !== 'yes' ||
      rnBundleTaskCompatibilitySummaryValid !== 'yes' ||
      prereqSummaryValid !== 'yes' ||
      credentialPlanValid !== 'yes' ||
      sentryPackagesCurrent !== 'yes' ||
      sentryAuthTokenAvailable !== 'yes' ||
      sentryPropertiesReady !== 'yes' ||
      iosMacValidationPrereqsReady !== 'yes' ||
      releaseSourceMapPrereqs !== 'ready' ||
      runtimeProofState !== 'ready'
    ) {
      errors.push(
        'Ready Sentry release handoff requires valid summaries, current packages, credentials, properties, iOS prerequisites, source-map prerequisites, and runtime proof',
      );
    }
  }

  if (handoffOutcome === 'blocked' && blockerType === 'none') {
    errors.push('Blocked Sentry release handoff must name a blocker type');
  }

  if (!requiredAction.includes('do not claim Sentry release upload validation')) {
    errors.push('Required action must keep Sentry release upload validation unclaimed until credentialed release validation runs');
  }

  return errors;
};
