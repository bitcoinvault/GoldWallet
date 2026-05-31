const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const isSemver = value => /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value);

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

export const getCodePushReleasePathSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const wiringValid = getLineValue(summary, 'Release path wiring valid');
  const ready = getLineValue(summary, 'Release path ready for update validation');
  const readyEnvironmentCount = getLineValue(summary, 'Ready environments');
  const envReadinessCount = getLineValue(summary, 'Environment readiness entries');
  const dependencyVersion = getLineValue(summary, 'CodePush package dependency version');
  const installedVersion = getLineValue(summary, 'CodePush package installed version');
  const latestVersion = getLineValue(summary, 'CodePush package latest version');
  const latestPublishedAt = getLineValue(summary, 'CodePush package latest published at');
  const packageCurrent = getLineValue(summary, 'CodePush package current');
  const packageVersionsAligned = getLineValue(summary, 'CodePush package versions aligned');
  const runtimeGatePresent = getLineValue(summary, 'CodePush runtime gate present');
  const nativeBundleGatePresent = getLineValue(summary, 'CodePush native bundle gate present');
  const runtimeEnabledByDefault = getLineValue(summary, 'CodePush runtime enabled by default');
  const upstreamRepository = getLineValue(summary, 'CodePush upstream repository');
  const npmRepository = getLineValue(summary, 'CodePush npm repository');
  const appCenterRetirementDate = getLineValue(summary, 'App Center CodePush retirement date');
  const upstreamRetired = getLineValue(summary, 'CodePush upstream retired');
  const upstreamArchived = getLineValue(summary, 'CodePush upstream archived');
  const upstreamNewArchitectureSupport = getLineValue(summary, 'CodePush upstream New Architecture support');
  const androidNewArchitectureEnabled = getLineValue(summary, 'Android New Architecture enabled');
  const migrationRequired = getLineValue(summary, 'CodePush migration required');
  const androidReleaseSummaryPresent = getLineValue(summary, 'Android release summary present');
  const androidReleaseSummaryVariants = getLineValue(summary, 'Android release summary variants');
  const androidReleaseSummaryRequiredVariantsCovered = getLineValue(summary, 'Android release summary required variants covered');
  const androidReleaseSummaryValid = getLineValue(summary, 'Android release summary valid');
  const androidReleaseSummaryErrorCount = getLineValue(summary, 'Android release summary errors');
  const codePushUpdateValidation = getLineValue(summary, 'CodePush update validation');
  const warningCount = getLineValue(summary, 'Warnings');
  const readinessCount = getLineValue(summary, 'Readiness issues');
  const wiringErrorCount = getLineValue(summary, 'Wiring errors');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const envReadinessLines = getBulletLinesAfter(summary, 'Environment readiness entries');
  const androidReleaseSummaryErrorLines = getBulletLinesAfter(summary, 'Android release summary errors');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const readinessLines = getBulletLinesAfter(summary, 'Readiness issues');
  const wiringErrorLines = getBulletLinesAfter(summary, 'Wiring errors');

  if (!summary.startsWith('CodePush release path audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  [
    wiringValid,
    ready,
    packageCurrent,
    packageVersionsAligned,
    runtimeGatePresent,
    nativeBundleGatePresent,
    runtimeEnabledByDefault,
    upstreamRetired,
    upstreamArchived,
    upstreamNewArchitectureSupport,
    androidNewArchitectureEnabled,
    migrationRequired,
    androidReleaseSummaryPresent,
    androidReleaseSummaryRequiredVariantsCovered,
    androidReleaseSummaryValid,
    secretValuesPrinted,
  ].forEach(value => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`Boolean summary values must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  [
    ['CodePush package dependency version', dependencyVersion],
    ['CodePush package installed version', installedVersion],
    ['CodePush package latest version', latestVersion],
  ].forEach(([label, value]) => {
    if (!isSemver(value)) {
      errors.push(`${label} must be a semver package version. Received: ${value || 'missing'}`);
    }
  });

  if (dependencyVersion && installedVersion && dependencyVersion !== installedVersion) {
    errors.push(`CodePush package dependency version ${dependencyVersion} does not match installed version ${installedVersion}`);
  }

  if (latestVersion && dependencyVersion && installedVersion && packageCurrent === 'yes' && (dependencyVersion !== latestVersion || installedVersion !== latestVersion)) {
    errors.push('CodePush package current cannot be yes when dependency or installed version differs from latest');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(latestPublishedAt)) {
    errors.push(`CodePush package latest published at must be an ISO timestamp. Received: ${latestPublishedAt || 'missing'}`);
  }

  if (packageVersionsAligned !== 'yes') {
    errors.push('CodePush package versions must be aligned before release-path validation');
  }

  if (runtimeGatePresent !== 'yes') {
    errors.push(`CodePush runtime gate must be present. Received: ${runtimeGatePresent || 'missing'}`);
  }

  if (nativeBundleGatePresent !== 'yes') {
    errors.push(`CodePush native bundle gate must be present. Received: ${nativeBundleGatePresent || 'missing'}`);
  }

  if (runtimeEnabledByDefault !== 'no') {
    errors.push(`CodePush runtime must not be enabled by default while App Center CodePush is retired. Received: ${runtimeEnabledByDefault || 'missing'}`);
  }

  if (upstreamRepository !== 'https://github.com/microsoft/react-native-code-push') {
    errors.push(`CodePush upstream repository must be the Microsoft React Native CodePush repo. Received: ${upstreamRepository || 'missing'}`);
  }

  if (!npmRepository.includes('github.com/microsoft/react-native-code-push')) {
    errors.push(`CodePush npm repository must point at the Microsoft React Native CodePush repo. Received: ${npmRepository || 'missing'}`);
  }

  if (appCenterRetirementDate !== '2025-03-31') {
    errors.push(`App Center CodePush retirement date must be 2025-03-31. Received: ${appCenterRetirementDate || 'missing'}`);
  }

  if (upstreamRetired !== 'yes' || upstreamArchived !== 'yes') {
    errors.push('CodePush upstream must be recorded as retired and archived');
  }

  if (androidNewArchitectureEnabled === 'yes' && upstreamNewArchitectureSupport !== 'no') {
    errors.push('CodePush New Architecture support must remain no while Android New Architecture is enabled');
  }

  if (migrationRequired !== 'yes') {
    errors.push('CodePush migration required must be yes while App Center CodePush is retired');
  }

  [
    ['Environment readiness entries', envReadinessCount, envReadinessLines.length],
    ['Android release summary errors', androidReleaseSummaryErrorCount, androidReleaseSummaryErrorLines.length],
    ['Warnings', warningCount, warningLines.length],
    ['Readiness issues', readinessCount, readinessLines.length],
    ['Wiring errors', wiringErrorCount, wiringErrorLines.length],
  ].forEach(([label, value, listedCount]) => {
    if (!/^\d+$/.test(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    } else if (Number(value) !== listedCount) {
      errors.push(`${label} count is ${value}, but listed ${listedCount}`);
    }
  });

  if (secretValuesPrinted !== 'no') {
    errors.push('CodePush release path summary must not print secret values');
  }

  if (!androidReleaseSummaryVariants) {
    errors.push('Android release summary variants line is missing');
  }

  if (androidReleaseSummaryPresent === 'no' && androidReleaseSummaryVariants !== 'none') {
    errors.push('Missing Android release summary must report variants as none');
  }

  if (androidReleaseSummaryPresent === 'yes') {
    ['dev', 'stage', 'prod'].forEach(variant => {
      const variants = androidReleaseSummaryVariants
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);

      if (!variants.includes(variant)) {
        errors.push(`Android release summary must include ${variant} release evidence`);
      }
    });
  }

  if (androidReleaseSummaryRequiredVariantsCovered !== 'yes') {
    errors.push('Android release summary must cover dev, stage, and prod release evidence');
  }

  if (androidReleaseSummaryValid === 'yes' && androidReleaseSummaryErrorCount !== '0') {
    errors.push('Valid Android release summary must have 0 summary errors');
  }

  if (codePushUpdateValidation !== 'not claimed') {
    errors.push(`CodePush update validation must be not claimed. Received: ${codePushUpdateValidation || 'missing'}`);
  }

  if (!/^\d+$/.test(readyEnvironmentCount)) {
    errors.push(`Ready environments must be a non-negative integer. Received: ${readyEnvironmentCount || 'missing'}`);
  } else {
    const listedReadyEnvironments = envReadinessLines.filter(line => line.includes(': ready')).length;

    if (Number(readyEnvironmentCount) !== listedReadyEnvironments) {
      errors.push(`Ready environments count is ${readyEnvironmentCount}, but listed ${listedReadyEnvironments}`);
    }
  }

  if (summary.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') || summary.includes('CODEPUSH_DEPLOYMENT_KEY_IOS=')) {
    errors.push('CodePush release path summary must not print deployment key assignments');
  }

  if (ready === 'yes' && (wiringValid !== 'yes' || readinessCount !== '0' || wiringErrorCount !== '0')) {
    errors.push('Ready summary must have valid wiring, 0 readiness issues, and 0 wiring errors');
  }

  if (!requiredAction.includes('migrate or replace retired App Center CodePush')) {
    errors.push('Required action must name retired App Center CodePush migration or replacement');
  }

  if (ready === 'no' && !requiredAction.includes('CodePush deployment keys')) {
    errors.push('Not-ready summary must include the CodePush deployment key required action');
  }

  return errors;
};
