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
  const codePushRemoved = getLineValue(summary, 'CodePush removed');
  const readyEnvironmentCount = getLineValue(summary, 'Ready environments');
  const envReadinessCount = getLineValue(summary, 'Environment readiness entries');
  const dependencyVersion = getLineValue(summary, 'CodePush package dependency version');
  const installedVersion = getLineValue(summary, 'CodePush package installed version');
  const latestVersion = getLineValue(summary, 'CodePush package latest version');
  const latestPublishedAt = getLineValue(summary, 'CodePush package latest published at');
  const packageCurrent = getLineValue(summary, 'CodePush package current');
  const packageVersionsAligned = getLineValue(summary, 'CodePush package versions aligned');
  const runtimeGatePresent = getLineValue(summary, 'CodePush runtime gate present');
  const runtimeHocLazyGated = getLineValue(summary, 'CodePush runtime HOC lazy gated');
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
  const releaseBuildEvidenceReady = getLineValue(summary, 'CodePush release build evidence ready');
  const androidReleaseSummaryPresent = getLineValue(summary, 'Android release summary present');
  const androidReleaseSummaryVariants = getLineValue(summary, 'Android release summary variants');
  const androidReleaseSummaryRequiredVariantsCovered = getLineValue(summary, 'Android release summary required variants covered');
  const androidReleaseSummaryValid = getLineValue(summary, 'Android release summary valid');
  const androidReleaseSummaryCurrentInputsCovered = getLineValue(summary, 'Android release summary current inputs covered');
  const androidReleaseSummaryErrorCount = getLineValue(summary, 'Android release summary errors');
  const androidReleaseApkManifestValid = getLineValue(summary, 'Android release APK manifest valid');
  const androidReleaseApkManifestErrorCount = getLineValue(summary, 'Android release APK manifest errors');
  const codePushUpdateValidation = getLineValue(summary, 'CodePush update validation');
  const warningCount = getLineValue(summary, 'Warnings');
  const readinessCount = getLineValue(summary, 'Readiness issues');
  const wiringErrorCount = getLineValue(summary, 'Wiring errors');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const envReadinessLines = getBulletLinesAfter(summary, 'Environment readiness entries');
  const androidReleaseSummaryErrorLines = getBulletLinesAfter(summary, 'Android release summary errors');
  const androidReleaseApkManifestErrorLines = getBulletLinesAfter(summary, 'Android release APK manifest errors');
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
    codePushRemoved,
    packageCurrent,
    packageVersionsAligned,
    runtimeGatePresent,
    runtimeHocLazyGated,
    nativeBundleGatePresent,
    runtimeEnabledByDefault,
    upstreamRetired,
    upstreamArchived,
    upstreamNewArchitectureSupport,
    androidNewArchitectureEnabled,
    migrationRequired,
    releaseBuildEvidenceReady,
    androidReleaseSummaryPresent,
    androidReleaseSummaryRequiredVariantsCovered,
    androidReleaseSummaryValid,
    androidReleaseSummaryCurrentInputsCovered,
    androidReleaseApkManifestValid,
    secretValuesPrinted,
  ].forEach(value => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`Boolean summary values must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  [
    ['CodePush package dependency version', dependencyVersion, codePushRemoved === 'yes'],
    ['CodePush package installed version', installedVersion, codePushRemoved === 'yes'],
    ['CodePush package latest version', latestVersion, false],
  ].forEach(([label, value, allowRemoved]) => {
    if (!(isSemver(value) || (allowRemoved && value === 'removed'))) {
      errors.push(`${label} must be a semver package version. Received: ${value || 'missing'}`);
    }
  });

  if (dependencyVersion && installedVersion && dependencyVersion !== 'removed' && installedVersion !== 'removed' && dependencyVersion !== installedVersion) {
    errors.push(`CodePush package dependency version ${dependencyVersion} does not match installed version ${installedVersion}`);
  }

  if (
    codePushRemoved !== 'yes' &&
    latestVersion &&
    dependencyVersion &&
    installedVersion &&
    packageCurrent === 'yes' &&
    (dependencyVersion !== latestVersion || installedVersion !== latestVersion)
  ) {
    errors.push('CodePush package current cannot be yes when dependency or installed version differs from latest');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(latestPublishedAt)) {
    errors.push(`CodePush package latest published at must be an ISO timestamp. Received: ${latestPublishedAt || 'missing'}`);
  }

  if (codePushRemoved !== 'yes' && packageVersionsAligned !== 'yes') {
    errors.push('CodePush package versions must be aligned before release-path validation');
  }

  if (runtimeGatePresent !== 'yes') {
    errors.push(`CodePush runtime gate must be present. Received: ${runtimeGatePresent || 'missing'}`);
  }

  if (runtimeHocLazyGated !== 'yes') {
    errors.push(`CodePush runtime HOC must be created only inside the runtime gate. Received: ${runtimeHocLazyGated || 'missing'}`);
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

  if (codePushRemoved === 'yes') {
    if (migrationRequired !== 'no') {
      errors.push('CodePush migration required must be no after CodePush is removed');
    }
  } else if (migrationRequired !== 'yes') {
    errors.push('CodePush migration required must be yes while App Center CodePush is retired');
  }

  if (
    releaseBuildEvidenceReady === 'yes' &&
    (wiringValid !== 'yes' ||
      androidReleaseSummaryPresent !== 'yes' ||
      androidReleaseSummaryRequiredVariantsCovered !== 'yes' ||
      androidReleaseSummaryValid !== 'yes' ||
      androidReleaseSummaryCurrentInputsCovered !== 'yes' ||
      androidReleaseSummaryErrorCount !== '0' ||
      androidReleaseApkManifestValid !== 'yes' ||
      androidReleaseApkManifestErrorCount !== '0')
  ) {
    errors.push('CodePush release build evidence cannot be ready without valid wiring, current Android dev/stage/prod/beta release evidence, and valid release APK manifests');
  }

  [
    ['Environment readiness entries', envReadinessCount, envReadinessLines.length],
    ['Android release summary errors', androidReleaseSummaryErrorCount, androidReleaseSummaryErrorLines.length],
    ['Android release APK manifest errors', androidReleaseApkManifestErrorCount, androidReleaseApkManifestErrorLines.length],
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
    ['dev', 'stage', 'prod', 'beta'].forEach(variant => {
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
    errors.push('Android release summary must cover dev, stage, prod, and beta release evidence');
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

  if (codePushRemoved === 'yes') {
    if (!requiredAction.includes('keep CodePush removed')) {
      errors.push('Removed summary required action must keep CodePush removed');
    }
  } else if (!requiredAction.includes('migrate or replace retired App Center CodePush')) {
    errors.push('Required action must name retired App Center CodePush migration or replacement');
  }

  if (ready === 'no' && codePushRemoved !== 'yes' && !requiredAction.includes('CodePush deployment keys')) {
    errors.push('Not-ready summary must include the CodePush deployment key required action');
  }

  return errors;
};
