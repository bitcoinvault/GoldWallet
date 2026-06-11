const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const decisions = ['pending', 'remove', 'replace', 'temporary legacy compatibility'];
const betaStrategies = ['unconfirmed', 'beta has OTA keys', 'beta has no OTA', 'beta out of scope'];

export const getCodePushDecisionHandoffErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const decision = getLineValue(summary, 'Decision');
  const implementationReady = getLineValue(summary, 'Implementation ready');
  const replacementTarget = getLineValue(summary, 'Replacement target');
  const betaStrategy = getLineValue(summary, 'Beta deployment-key strategy');
  const releasePathSummaryValid = getLineValue(summary, 'Release path summary valid');
  const migrationReadinessSummaryValid = getLineValue(summary, 'Migration readiness summary valid');
  const removalReadinessSummaryValid = getLineValue(summary, 'Removal readiness summary valid');
  const codePushMigrationRequired = getLineValue(summary, 'CodePush migration required');
  const codePushUpdateValidation = getLineValue(summary, 'CodePush update validation');
  const runtimeGatedOff = getLineValue(summary, 'CodePush runtime gated off by default');
  const releaseBuildEvidenceReady = getLineValue(summary, 'CodePush release build evidence ready');
  const releaseSmokeEvidenceReady = getLineValue(summary, 'CodePush release smoke evidence ready');
  const iosValidationStatus = getLineValue(summary, 'iOS runtime validation');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('CodePush decision handoff')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!decisions.includes(decision)) {
    errors.push(`Decision must be one of ${decisions.join(', ')}. Received: ${decision || 'missing'}`);
  }

  if (!['yes', 'no'].includes(implementationReady)) {
    errors.push(`Implementation ready must be yes or no. Received: ${implementationReady || 'missing'}`);
  }

  if (!betaStrategies.includes(betaStrategy)) {
    errors.push(`Beta deployment-key strategy must be one of ${betaStrategies.join(', ')}. Received: ${betaStrategy || 'missing'}`);
  }

  [
    ['Release path summary valid', releasePathSummaryValid],
    ['Migration readiness summary valid', migrationReadinessSummaryValid],
    ['Removal readiness summary valid', removalReadinessSummaryValid],
    ['CodePush migration required', codePushMigrationRequired],
    ['CodePush runtime gated off by default', runtimeGatedOff],
    ['CodePush release build evidence ready', releaseBuildEvidenceReady],
    ['CodePush release smoke evidence ready', releaseSmokeEvidenceReady],
    ['Secret values printed', secretValuesPrinted],
  ].forEach(([label, value]) => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`${label} must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  if (codePushUpdateValidation !== 'not claimed') {
    errors.push(`CodePush update validation must remain not claimed. Received: ${codePushUpdateValidation || 'missing'}`);
  }

  if (codePushMigrationRequired !== 'yes') {
    errors.push('CodePush migration must remain required while App Center CodePush is retired');
  }

  if (runtimeGatedOff !== 'yes') {
    errors.push('CodePush runtime must remain gated off by default until a remove/replace branch lands');
  }

  if (releasePathSummaryValid !== 'yes' || migrationReadinessSummaryValid !== 'yes' || removalReadinessSummaryValid !== 'yes') {
    errors.push('Decision handoff requires valid CodePush release, migration, and removal summaries');
  }

  if (releaseBuildEvidenceReady !== 'yes' || releaseSmokeEvidenceReady !== 'yes') {
    errors.push('Decision handoff requires current Android release build and release-smoke evidence');
  }

  if (decision === 'replace' && (!replacementTarget || replacementTarget === 'none')) {
    errors.push('Replace decision must name a replacement target');
  }

  if (decision !== 'replace' && replacementTarget !== 'none') {
    errors.push('Replacement target must be none unless the decision is replace');
  }

  if (decision === 'pending' && implementationReady !== 'no') {
    errors.push('Pending decision cannot be implementation ready');
  }

  if (decision === 'temporary legacy compatibility' && implementationReady !== 'no') {
    errors.push('Temporary legacy compatibility cannot be implementation ready');
  }

  if (decision === 'remove' && implementationReady !== 'yes') {
    errors.push('Remove decision should be implementation ready once guarded evidence is valid');
  }

  if (decision === 'replace' && betaStrategy === 'unconfirmed') {
    errors.push('Replace decision requires an explicit beta deployment-key strategy');
  }

  if (!iosValidationStatus.includes('not claimed')) {
    errors.push('iOS runtime validation must remain not claimed unless it actually ran on macOS/Xcode');
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('CodePush decision handoff must not print secret values');
  }

  if (summary.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') || summary.includes('CODEPUSH_DEPLOYMENT_KEY_IOS=')) {
    errors.push('CodePush decision handoff must not print deployment key assignments');
  }

  if (!requiredAction.includes('choose remove or replace') && decision === 'pending') {
    errors.push('Pending decision handoff must ask for a remove-or-replace decision');
  }

  if (!requiredAction.includes('do not claim OTA update validation')) {
    errors.push('Required action must keep OTA update validation unclaimed until a real delivery test runs');
  }

  return errors;
};
