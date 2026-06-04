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
  'CodePush upstream archived',
  'CodePush upstream New Architecture support',
  'Android New Architecture enabled',
  'CodePush migration required',
  'CodePush release build evidence ready',
  'Android native integration present',
  'iOS native integration present',
  'CodePush runtime gated off by default',
  'Removal decision available',
  'Replacement decision available',
  'Safe to remove now',
  'Secret values printed',
];

export const getCodePushRemovalReadinessSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const packageLatestVersion = getLineValue(summary, 'CodePush package latest version');
  const packageLatestPublishedAt = getLineValue(summary, 'CodePush package latest published at');
  const packageRepositoryUrl = getLineValue(summary, 'CodePush npm repository');
  const upstreamRepository = getLineValue(summary, 'CodePush upstream repository');
  const upstreamArchived = getLineValue(summary, 'CodePush upstream archived');
  const upstreamNewArchitectureSupport = getLineValue(summary, 'CodePush upstream New Architecture support');
  const androidNewArchitectureEnabled = getLineValue(summary, 'Android New Architecture enabled');
  const migrationRequired = getLineValue(summary, 'CodePush migration required');
  const releaseBuildEvidenceReady = getLineValue(summary, 'CodePush release build evidence ready');
  const runtimeUsageCount = getLineValue(summary, 'Runtime usage files');
  const nativeIntegrationCount = getLineValue(summary, 'Native integration files');
  const envFileCount = getLineValue(summary, 'Env files carrying CodePush keys');
  const iosPlistCount = getLineValue(summary, 'iOS plist placeholders');
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

  if (upstreamNewArchitectureSupport !== 'no') {
    errors.push(`CodePush upstream New Architecture support must remain no. Received: ${upstreamNewArchitectureSupport || 'missing'}`);
  }

  if (androidNewArchitectureEnabled !== 'yes') {
    errors.push(`Android New Architecture enabled must remain yes. Received: ${androidNewArchitectureEnabled || 'missing'}`);
  }

  if (migrationRequired !== 'yes') {
    errors.push(`CodePush migration required must remain yes. Received: ${migrationRequired || 'missing'}`);
  }

  if (releaseBuildEvidenceReady !== 'yes') {
    errors.push(`CodePush release build evidence must be ready before removal planning. Received: ${releaseBuildEvidenceReady || 'missing'}`);
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

  if (iosPlistCount !== '3') {
    errors.push(`iOS plist placeholders must remain 3 until CodePush is removed or replaced. Received: ${iosPlistCount || 'missing'}`);
  }

  if (runtimeUsageCount !== '1') {
    errors.push(`CodePush runtime usage must remain isolated to one runtime file until removal. Received: ${runtimeUsageCount || 'missing'}`);
  }

  if (nativeIntegrationCount !== '8') {
    errors.push(`CodePush native integration inventory must remain 8 files until removal. Received: ${nativeIntegrationCount || 'missing'}`);
  }

  if (removalDecision !== 'no' || replacementDecision !== 'no') {
    errors.push('CodePush remove/replace decision must not be claimed by this audit-only branch');
  }

  if (safeToRemove !== 'no') {
    errors.push('CodePush must not be marked safe to remove until a remove-or-replace decision is available');
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('CodePush removal readiness summary must not print secret values');
  }

  if (summary.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') || summary.includes('CODEPUSH_DEPLOYMENT_KEY_IOS=')) {
    errors.push('CodePush removal readiness summary must not print deployment key assignments');
  }

  if (!requiredAction.includes('choose remove or replace')) {
    errors.push('Required action must ask for a remove-or-replace CodePush decision');
  }

  return errors;
};
