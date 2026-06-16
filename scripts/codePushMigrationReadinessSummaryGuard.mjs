const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const yesNoLabels = [
  'CodePush package current',
  'CodePush upstream archived',
  'CodePush upstream New Architecture support',
  'Android New Architecture enabled',
  'CodePush runtime gated off by default',
  'CodePush migration required',
  'Decision document present',
  'Decision document covers removal',
  'Decision document covers replacement',
  'Decision document rejects blind package upgrade',
  'Release path summary valid',
  'CodePush release build evidence ready',
  'Android release smoke summary valid',
  'CodePush release smoke evidence ready',
  'Android release create-wallet smoke summary valid',
  'CodePush release create-wallet evidence ready',
  'Beta CodePush strategy confirmed',
  'Secret values printed',
];

export const getCodePushMigrationReadinessSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const packageCurrent = getLineValue(summary, 'CodePush package current');
  const codePushRemoved = getLineValue(summary, 'CodePush removed');
  const packageLatestVersion = getLineValue(summary, 'CodePush package latest version');
  const packageLatestPublishedAt = getLineValue(summary, 'CodePush package latest published at');
  const packageRepositoryUrl = getLineValue(summary, 'CodePush npm repository');
  const upstreamRepository = getLineValue(summary, 'CodePush upstream repository');
  const appCenterRetirementDate = getLineValue(summary, 'App Center CodePush retirement date');
  const upstreamArchived = getLineValue(summary, 'CodePush upstream archived');
  const upstreamArchivedDate = getLineValue(summary, 'CodePush upstream archived date');
  const upstreamNewArchitectureSupport = getLineValue(summary, 'CodePush upstream New Architecture support');
  const upstreamNewArchitectureUnsupportedRange = getLineValue(summary, 'CodePush upstream New Architecture unsupported RN range');
  const androidNewArchitectureEnabled = getLineValue(summary, 'Android New Architecture enabled');
  const runtimeGatedOff = getLineValue(summary, 'CodePush runtime gated off by default');
  const updateValidation = getLineValue(summary, 'CodePush update validation');
  const migrationRequired = getLineValue(summary, 'CodePush migration required');
  const currentPosture = getLineValue(summary, 'Current posture');
  const longTermOptions = getLineValue(summary, 'Long-term options');
  const decisionDocumentPresent = getLineValue(summary, 'Decision document present');
  const coversRemoval = getLineValue(summary, 'Decision document covers removal');
  const coversReplacement = getLineValue(summary, 'Decision document covers replacement');
  const rejectsBlindUpgrade = getLineValue(summary, 'Decision document rejects blind package upgrade');
  const releasePathSummaryValid = getLineValue(summary, 'Release path summary valid');
  const releasePathSummaryErrors = getLineValue(summary, 'Release path summary errors');
  const releaseBuildEvidenceReady = getLineValue(summary, 'CodePush release build evidence ready');
  const androidReleaseSmokeSummaryValid = getLineValue(summary, 'Android release smoke summary valid');
  const androidReleaseSmokeSummaryErrors = getLineValue(summary, 'Android release smoke summary errors');
  const releaseSmokeEvidenceReady = getLineValue(summary, 'CodePush release smoke evidence ready');
  const androidReleaseCreateWalletSmokeSummaryValid = getLineValue(summary, 'Android release create-wallet smoke summary valid');
  const androidReleaseCreateWalletSmokeSummaryErrors = getLineValue(summary, 'Android release create-wallet smoke summary errors');
  const releaseCreateWalletEvidenceReady = getLineValue(summary, 'CodePush release create-wallet evidence ready');
  const readyEnvironmentCount = getLineValue(summary, 'Ready CodePush environments');
  const blockedEnvironmentCount = getLineValue(summary, 'Blocked CodePush environments');
  const unconfirmedEnvironmentCount = getLineValue(summary, 'Unconfirmed CodePush environments');
  const betaStrategyConfirmed = getLineValue(summary, 'Beta CodePush strategy confirmed');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('CodePush migration readiness audit')) {
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

  if (!['yes', 'no'].includes(codePushRemoved)) {
    errors.push(`CodePush removed must be yes or no. Received: ${codePushRemoved || 'missing'}`);
  }

  if (packageCurrent !== 'yes') {
    errors.push('CodePush package should remain current before migration/removal decisions');
  }

  if (!/^\d+\.\d+\.\d+$/.test(packageLatestVersion)) {
    errors.push(`CodePush package latest version must be present. Received: ${packageLatestVersion || 'missing'}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}T/.test(packageLatestPublishedAt)) {
    errors.push(`CodePush package latest published timestamp must be present. Received: ${packageLatestPublishedAt || 'missing'}`);
  }

  if (!packageRepositoryUrl.includes('microsoft/react-native-code-push')) {
    errors.push(`CodePush npm repository must reference microsoft/react-native-code-push. Received: ${packageRepositoryUrl || 'missing'}`);
  }

  if (!upstreamRepository.includes('microsoft/react-native-code-push')) {
    errors.push(`CodePush upstream repository must reference microsoft/react-native-code-push. Received: ${upstreamRepository || 'missing'}`);
  }

  if (appCenterRetirementDate !== '2025-03-31') {
    errors.push(`App Center CodePush retirement date must be 2025-03-31. Received: ${appCenterRetirementDate || 'missing'}`);
  }

  if (upstreamArchived !== 'yes') {
    errors.push('CodePush upstream archived state must be yes');
  }

  if (upstreamArchivedDate !== '2025-05-20') {
    errors.push(`CodePush upstream archived date must be 2025-05-20. Received: ${upstreamArchivedDate || 'missing'}`);
  }

  if (androidNewArchitectureEnabled === 'yes' && upstreamNewArchitectureSupport !== 'no') {
    errors.push('CodePush New Architecture support must remain no while Android New Architecture is enabled');
  }

  if (upstreamNewArchitectureUnsupportedRange !== '>=0.76') {
    errors.push(
      `CodePush upstream New Architecture unsupported RN range must be >=0.76. Received: ${upstreamNewArchitectureUnsupportedRange || 'missing'}`,
    );
  }

  if (runtimeGatedOff !== 'yes') {
    errors.push('CodePush runtime must remain gated off by default while App Center CodePush is retired');
  }

  if (updateValidation !== 'not claimed') {
    errors.push(`CodePush update validation must be not claimed. Received: ${updateValidation || 'missing'}`);
  }

  if (codePushRemoved === 'yes') {
    if (migrationRequired !== 'no') {
      errors.push('CodePush migration required must be no after CodePush is removed');
    }
  } else if (migrationRequired !== 'yes') {
    errors.push('CodePush migration required must be yes while App Center CodePush is retired');
  }

  if (codePushRemoved === 'yes') {
    if (currentPosture !== 'removed') {
      errors.push(`Current posture must be removed after CodePush removal. Received: ${currentPosture || 'missing'}`);
    }
  } else if (currentPosture !== 'temporary legacy compatibility') {
    errors.push(`Current posture must be temporary legacy compatibility. Received: ${currentPosture || 'missing'}`);
  }

  if (codePushRemoved === 'yes' && longTermOptions !== 'removed') {
    errors.push(`Long-term options must be removed after CodePush removal. Received: ${longTermOptions || 'missing'}`);
  } else if (codePushRemoved !== 'yes' && longTermOptions !== 'remove or replace') {
    errors.push(`Long-term options must be remove or replace. Received: ${longTermOptions || 'missing'}`);
  }

  if (decisionDocumentPresent !== 'yes' || coversRemoval !== 'yes' || coversReplacement !== 'yes' || rejectsBlindUpgrade !== 'yes') {
    errors.push('CodePush decision document must cover removal, replacement, and reject blind package upgrades');
  }

  if (releasePathSummaryValid !== 'yes' || releasePathSummaryErrors !== '0') {
    errors.push('CodePush migration readiness requires a valid CodePush release path summary');
  }

  if (releaseBuildEvidenceReady !== 'yes') {
    errors.push('CodePush release build evidence must be ready before migration readiness is useful');
  }

  if (androidReleaseSmokeSummaryValid !== 'yes' || androidReleaseSmokeSummaryErrors !== '0') {
    errors.push('CodePush migration readiness requires a valid Android release smoke summary');
  }

  if (releaseSmokeEvidenceReady !== 'yes') {
    errors.push('CodePush release smoke evidence must be ready before migration readiness is useful');
  }

  if (androidReleaseCreateWalletSmokeSummaryValid !== 'yes' || androidReleaseCreateWalletSmokeSummaryErrors !== '0') {
    errors.push('CodePush migration readiness requires a valid Android release create-wallet smoke summary');
  }

  if (releaseCreateWalletEvidenceReady !== 'yes') {
    errors.push('CodePush release create-wallet evidence must be ready before migration readiness is useful');
  }

  [
    ['Ready CodePush environments', readyEnvironmentCount],
    ['Blocked CodePush environments', blockedEnvironmentCount],
    ['Unconfirmed CodePush environments', unconfirmedEnvironmentCount],
  ].forEach(([label, value]) => {
    if (!/^\d+$/.test(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    }
  });

  if (codePushRemoved !== 'yes' && betaStrategyConfirmed !== 'no') {
    errors.push('Beta CodePush strategy must remain unconfirmed until beta deployment keys/strategy are provided');
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('CodePush migration readiness summary must not print secret values');
  }

  if (codePushRemoved === 'yes') {
    if (!requiredAction.includes('keep CodePush removed')) {
      errors.push('Removed summary required action must keep CodePush removed');
    }
  } else if (!requiredAction.includes('choose remove or replace')) {
    errors.push('Required action must ask for a remove-or-replace CodePush decision');
  }

  return errors;
};
