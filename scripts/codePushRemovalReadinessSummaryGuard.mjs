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
  'CodePush package installed',
  'CodePush removed',
  'CodePush upstream archived',
  'CodePush upstream New Architecture support',
  'Android New Architecture enabled',
  'CodePush migration required',
  'CodePush release build evidence ready',
  'Android release smoke summary valid',
  'CodePush release smoke evidence ready',
  'Android release create-wallet smoke summary valid',
  'CodePush release create-wallet evidence ready',
  'Android native integration present',
  'iOS native integration present',
  'CodePush runtime gated off by default',
  'Decision handoff present',
  'Decision handoff valid',
  'Removal decision available',
  'Replacement decision available',
  'Safe to remove now',
  'Secret values printed',
];

const decisions = ['missing', 'pending', 'remove', 'replace', 'temporary legacy compatibility'];
const betaStrategies = ['missing', 'unconfirmed', 'beta has OTA keys', 'beta has no OTA', 'beta out of scope'];

export const getCodePushRemovalReadinessSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const packageLatestVersion = getLineValue(summary, 'CodePush package latest version');
  const codePushRemoved = getLineValue(summary, 'CodePush removed');
  const packageLatestPublishedAt = getLineValue(summary, 'CodePush package latest published at');
  const packageRepositoryUrl = getLineValue(summary, 'CodePush npm repository');
  const upstreamRepository = getLineValue(summary, 'CodePush upstream repository');
  const upstreamArchived = getLineValue(summary, 'CodePush upstream archived');
  const upstreamArchivedDate = getLineValue(summary, 'CodePush upstream archived date');
  const upstreamNewArchitectureSupport = getLineValue(summary, 'CodePush upstream New Architecture support');
  const upstreamNewArchitectureUnsupportedRange = getLineValue(summary, 'CodePush upstream New Architecture unsupported RN range');
  const androidNewArchitectureEnabled = getLineValue(summary, 'Android New Architecture enabled');
  const migrationRequired = getLineValue(summary, 'CodePush migration required');
  const releaseBuildEvidenceReady = getLineValue(summary, 'CodePush release build evidence ready');
  const androidReleaseSmokeSummaryValid = getLineValue(summary, 'Android release smoke summary valid');
  const androidReleaseSmokeSummaryErrors = getLineValue(summary, 'Android release smoke summary errors');
  const releaseSmokeEvidenceReady = getLineValue(summary, 'CodePush release smoke evidence ready');
  const androidReleaseCreateWalletSmokeSummaryValid = getLineValue(summary, 'Android release create-wallet smoke summary valid');
  const androidReleaseCreateWalletSmokeSummaryErrors = getLineValue(summary, 'Android release create-wallet smoke summary errors');
  const releaseCreateWalletEvidenceReady = getLineValue(summary, 'CodePush release create-wallet evidence ready');
  const runtimeUsageCount = getLineValue(summary, 'Runtime usage files');
  const nativeIntegrationCount = getLineValue(summary, 'Native integration files');
  const envFileCount = getLineValue(summary, 'Env files carrying CodePush keys');
  const iosPlistCount = getLineValue(summary, 'iOS plist placeholders');
  const androidNativeIntegrationPresent = getLineValue(summary, 'Android native integration present');
  const iosNativeIntegrationPresent = getLineValue(summary, 'iOS native integration present');
  const decisionHandoffPresent = getLineValue(summary, 'Decision handoff present');
  const decisionHandoffValid = getLineValue(summary, 'Decision handoff valid');
  const decision = getLineValue(summary, 'Decision');
  const betaStrategy = getLineValue(summary, 'Beta deployment-key strategy');
  const decisionHandoffErrors = getLineValue(summary, 'Decision handoff errors');
  const removalDecision = getLineValue(summary, 'Removal decision available');
  const replacementDecision = getLineValue(summary, 'Replacement decision available');
  const safeToRemove = getLineValue(summary, 'Safe to remove now');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const runtimeUsageLines = getBulletLinesAfter(summary, 'Runtime usage files');
  const nativeIntegrationLines = getBulletLinesAfter(summary, 'Native integration files');
  const envFileLines = getBulletLinesAfter(summary, 'Env files carrying CodePush keys');

  if (!summary.startsWith('CodePush removal readiness audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (codePushRemoved === 'yes' && getLineValue(summary, 'CodePush package installed') !== 'no') {
    errors.push('CodePush package installed must be no after CodePush removal');
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

  if (upstreamArchived !== 'yes') {
    errors.push(`CodePush upstream archived must remain yes for the removal decision. Received: ${upstreamArchived || 'missing'}`);
  }

  if (upstreamArchivedDate !== '2025-05-20') {
    errors.push(`CodePush upstream archived date must be 2025-05-20. Received: ${upstreamArchivedDate || 'missing'}`);
  }

  if (upstreamNewArchitectureSupport !== 'no') {
    errors.push(`CodePush upstream New Architecture support must remain no. Received: ${upstreamNewArchitectureSupport || 'missing'}`);
  }

  if (upstreamNewArchitectureUnsupportedRange !== '>=0.76') {
    errors.push(
      `CodePush upstream New Architecture unsupported RN range must be >=0.76. Received: ${upstreamNewArchitectureUnsupportedRange || 'missing'}`,
    );
  }

  if (androidNewArchitectureEnabled !== 'yes') {
    errors.push(`Android New Architecture enabled must remain yes. Received: ${androidNewArchitectureEnabled || 'missing'}`);
  }

  if (codePushRemoved === 'yes') {
    if (migrationRequired !== 'no') {
      errors.push(`CodePush migration required must be no after CodePush removal. Received: ${migrationRequired || 'missing'}`);
    }
  } else if (migrationRequired !== 'yes') {
    errors.push(`CodePush migration required must remain yes. Received: ${migrationRequired || 'missing'}`);
  }

  if (releaseBuildEvidenceReady !== 'yes') {
    errors.push(`CodePush release build evidence must be ready before removal planning. Received: ${releaseBuildEvidenceReady || 'missing'}`);
  }

  if (codePushRemoved !== 'yes') {
    if (androidReleaseSmokeSummaryValid !== 'yes' || androidReleaseSmokeSummaryErrors !== '0') {
      errors.push('CodePush removal planning requires a valid Android release smoke summary');
    }

    if (releaseSmokeEvidenceReady !== 'yes') {
      errors.push(`CodePush release smoke evidence must be ready before removal planning. Received: ${releaseSmokeEvidenceReady || 'missing'}`);
    }

    if (androidReleaseCreateWalletSmokeSummaryValid !== 'yes' || androidReleaseCreateWalletSmokeSummaryErrors !== '0') {
      errors.push('CodePush removal planning requires a valid Android release create-wallet smoke summary');
    }

    if (releaseCreateWalletEvidenceReady !== 'yes') {
      errors.push(
        `CodePush release create-wallet evidence must be ready before removal planning. Received: ${releaseCreateWalletEvidenceReady || 'missing'}`,
      );
    }
  }

  [
    ['Runtime usage files', runtimeUsageCount, runtimeUsageLines.length],
    ['Native integration files', nativeIntegrationCount, nativeIntegrationLines.length],
    ['Env files carrying CodePush keys', envFileCount, envFileLines.length],
  ].forEach(([label, value, listedCount]) => {
    if (!/^\d+$/.test(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    } else if (Number(value) !== listedCount) {
      errors.push(`${label} count is ${value}, but listed ${listedCount}`);
    }
  });

  if (codePushRemoved === 'yes') {
    if (iosPlistCount !== '0') {
      errors.push(`iOS plist placeholders must be 0 after CodePush removal. Received: ${iosPlistCount || 'missing'}`);
    }
  } else if (iosPlistCount !== '3') {
    errors.push(`iOS plist placeholders must remain 3 until CodePush is removed or replaced. Received: ${iosPlistCount || 'missing'}`);
  }

  if (codePushRemoved === 'yes') {
    if (runtimeUsageCount !== '0') {
      errors.push(`CodePush runtime usage must be 0 after removal. Received: ${runtimeUsageCount || 'missing'}`);
    }
  } else if (runtimeUsageCount !== '1') {
    errors.push(`CodePush runtime usage must remain isolated to one runtime file until removal. Received: ${runtimeUsageCount || 'missing'}`);
  }

  if (codePushRemoved === 'yes') {
    if (nativeIntegrationCount !== '0') {
      errors.push(`CodePush native integration inventory must be 0 after removal. Received: ${nativeIntegrationCount || 'missing'}`);
    }
  } else if (nativeIntegrationCount !== '8') {
    errors.push(`CodePush native integration inventory must remain 8 files until removal. Received: ${nativeIntegrationCount || 'missing'}`);
  }

  if (codePushRemoved === 'yes') {
    if (androidNativeIntegrationPresent !== 'no') {
      errors.push(`Android native integration present must be no after CodePush removal. Received: ${androidNativeIntegrationPresent || 'missing'}`);
    }

    if (iosNativeIntegrationPresent !== 'no') {
      errors.push(`iOS native integration present must be no after CodePush removal. Received: ${iosNativeIntegrationPresent || 'missing'}`);
    }
  } else {
    if (androidNativeIntegrationPresent !== 'yes') {
      errors.push(`Android native integration present must remain yes until CodePush is removed. Received: ${androidNativeIntegrationPresent || 'missing'}`);
    }

    if (iosNativeIntegrationPresent !== 'yes') {
      errors.push(`iOS native integration present must remain yes until CodePush is removed. Received: ${iosNativeIntegrationPresent || 'missing'}`);
    }
  }

  if (!decisions.includes(decision)) {
    errors.push(`Decision must be one of ${decisions.join(', ')}. Received: ${decision || 'missing'}`);
  }

  if (!betaStrategies.includes(betaStrategy)) {
    errors.push(`Beta deployment-key strategy must be one of ${betaStrategies.join(', ')}. Received: ${betaStrategy || 'missing'}`);
  }

  if (!/^\d+$/.test(decisionHandoffErrors)) {
    errors.push(`Decision handoff errors must be a non-negative integer. Received: ${decisionHandoffErrors || 'missing'}`);
  }

  if (decisionHandoffPresent === 'no' && decision !== 'missing') {
    errors.push('Missing decision handoff must report Decision: missing');
  }

  if (decisionHandoffValid === 'yes' && decisionHandoffErrors !== '0') {
    errors.push('Valid CodePush decision handoff must report zero decision handoff errors');
  }

  if (codePushRemoved !== 'yes' && decisionHandoffValid === 'no' && decision === 'remove') {
    errors.push('Remove decision requires a valid CodePush decision handoff');
  }

  if (codePushRemoved !== 'yes' && removalDecision === 'yes' && decision !== 'remove') {
    errors.push('Removal decision can be available only when Decision is remove');
  }

  if (codePushRemoved !== 'yes' && replacementDecision === 'yes' && decision !== 'replace') {
    errors.push('Replacement decision can be available only when Decision is replace');
  }

  if (codePushRemoved !== 'yes' && decision === 'remove' && removalDecision !== 'yes') {
    errors.push('Decision remove must make Removal decision available yes');
  }

  if (codePushRemoved !== 'yes' && decision !== 'remove' && removalDecision !== 'no') {
    errors.push('Removal decision must be no unless Decision is remove');
  }

  if (codePushRemoved !== 'yes' && decision !== 'replace' && replacementDecision !== 'no') {
    errors.push('Replacement decision must be no unless Decision is replace');
  }

  if (codePushRemoved !== 'yes' && safeToRemove === 'yes' && decision !== 'remove') {
    errors.push('CodePush can be marked safe to remove only when Decision is remove');
  }

  if (codePushRemoved === 'yes' && safeToRemove !== 'no') {
    errors.push('Safe to remove now must be no after CodePush has already been removed');
  } else if (codePushRemoved !== 'yes' && decision === 'remove' && safeToRemove !== 'yes') {
    errors.push('Decision remove must make Safe to remove now yes once release evidence and native gates are valid');
  }

  if (decision !== 'remove' && safeToRemove !== 'no') {
    errors.push('CodePush must not be marked safe to remove until a valid remove decision is available');
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('CodePush removal readiness summary must not print secret values');
  }

  if (summary.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') || summary.includes('CODEPUSH_DEPLOYMENT_KEY_IOS=')) {
    errors.push('CodePush removal readiness summary must not print deployment key assignments');
  }

  if (codePushRemoved === 'yes') {
    if (!requiredAction.includes('keep CodePush removed')) {
      errors.push('Removed summary required action must keep CodePush removed');
    }
  } else if (decision === 'remove') {
    if (!requiredAction.includes('start the CodePush removal implementation branch')) {
      errors.push('Remove decision required action must point to the CodePush removal implementation branch');
    }
  } else if (!requiredAction.includes('choose remove or replace')) {
    errors.push('Required action must ask for a remove-or-replace CodePush decision');
  }

  return errors;
};
