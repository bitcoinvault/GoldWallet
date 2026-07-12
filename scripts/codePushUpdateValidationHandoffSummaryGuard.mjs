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
  'Release path summary valid',
  'Migration readiness summary valid',
  'Removal readiness summary valid',
  'Release path ready for update validation',
  'CodePush removed',
  'CodePush migration required',
  'CodePush release build evidence ready',
  'CodePush release smoke evidence ready',
  'CodePush release create-wallet evidence ready',
  'Secret values printed',
];

const handoffOutcomes = ['ready-for-real-ota-test', 'blocked'];
const blockerTypes = ['none', 'codepush-removed', 'release-evidence-not-ready', 'blocked-by-electrum-certificate-expired', 'summary-invalid'];

export const getCodePushUpdateValidationHandoffSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const codePushRemoved = getLineValue(summary, 'CodePush removed');
  const migrationRequired = getLineValue(summary, 'CodePush migration required');
  const updateValidation = getLineValue(summary, 'CodePush update validation');
  const releasePathReady = getLineValue(summary, 'Release path ready for update validation');
  const releaseBuildReady = getLineValue(summary, 'CodePush release build evidence ready');
  const releaseSmokeReady = getLineValue(summary, 'CodePush release smoke evidence ready');
  const releaseCreateWalletReady = getLineValue(summary, 'CodePush release create-wallet evidence ready');
  const controlledBlockerOutcome = getLineValue(summary, 'Controlled release blocker outcome');
  const releaseRuntimeProofState = getLineValue(summary, 'CodePush release runtime proof state');
  const handoffOutcome = getLineValue(summary, 'Handoff outcome');
  const blockerType = getLineValue(summary, 'Handoff blocker type');
  const iosValidationStatus = getLineValue(summary, 'iOS runtime validation');
  const readinessErrorCount = getLineValue(summary, 'Readiness errors');
  const readinessErrorLines = getBulletLinesAfter(summary, 'Readiness errors');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('CodePush update validation handoff summary')) {
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

  if (updateValidation !== 'not claimed') {
    errors.push(`CodePush update validation must remain not claimed. Received: ${updateValidation || 'missing'}`);
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
    errors.push('CodePush update-validation handoff summary must not print secret values');
  }

  if (summary.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') || summary.includes('CODEPUSH_DEPLOYMENT_KEY_IOS=')) {
    errors.push('CodePush update-validation handoff summary must not print deployment key assignments');
  }

  if (codePushRemoved === 'yes') {
    if (migrationRequired !== 'no') {
      errors.push('CodePush migration required must be no after CodePush is removed');
    }

    if (handoffOutcome !== 'blocked' || blockerType !== 'codepush-removed') {
      errors.push('Removed CodePush must keep update-validation handoff blocked with blocker type codepush-removed');
    }

    if (!requiredAction.includes('keep CodePush removed') || !requiredAction.includes('do not claim OTA update validation')) {
      errors.push('Removed CodePush required action must keep CodePush removed and avoid claiming OTA update validation');
    }
  } else {
    if (migrationRequired !== 'yes') {
      errors.push('CodePush migration required must remain yes while App Center CodePush is retired');
    }
  }

  const releaseEvidenceReady =
    releasePathReady === 'yes' && releaseBuildReady === 'yes' && releaseSmokeReady === 'yes' && releaseCreateWalletReady === 'yes';

  if (codePushRemoved !== 'yes' && releaseEvidenceReady) {
    if (handoffOutcome !== 'ready-for-real-ota-test') {
      errors.push('Ready CodePush release evidence must report ready-for-real-ota-test');
    }

    if (blockerType !== 'none') {
      errors.push('Ready CodePush release evidence must use blocker type none');
    }
  }

  if (releaseRuntimeProofState === 'blocked-by-electrum-certificate-expired') {
    if (controlledBlockerOutcome !== 'blocked-by-electrum-certificate-expired') {
      errors.push('Blocked release runtime proof requires a matching controlled Electrum blocker outcome');
    }

    if (handoffOutcome !== 'blocked') {
      errors.push('Controlled Electrum blocker must keep CodePush update-validation handoff blocked');
    }

    if (codePushRemoved !== 'yes' && blockerType !== 'blocked-by-electrum-certificate-expired') {
      errors.push('Controlled Electrum blocker must be visible as the handoff blocker type');
    }
  }

  if (handoffOutcome === 'ready-for-real-ota-test' && readinessErrorLines.length !== 0) {
    errors.push('Ready CodePush update-validation handoff cannot list readiness errors');
  }

  if (handoffOutcome === 'blocked' && blockerType === 'none') {
    errors.push('Blocked CodePush update-validation handoff must name a blocker type');
  }

  if (!requiredAction.includes('do not claim OTA update validation')) {
    errors.push('Required action must keep OTA update validation unclaimed until a real delivery test runs');
  }

  return errors;
};
