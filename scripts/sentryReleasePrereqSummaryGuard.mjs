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
  const sentryReactNativeLatest = getLineValue(summary, '@sentry/react-native latest');
  const sentryReactNativeCurrent = getLineValue(summary, '@sentry/react-native current');
  const sentryCliPackageVersion = getLineValue(summary, '@sentry/cli package version');
  const sentryCliLatest = getLineValue(summary, '@sentry/cli latest');
  const sentryCliCurrent = getLineValue(summary, '@sentry/cli current');
  const sentryCliInstalledInstances = getLineValue(summary, '@sentry/cli installed package instances');
  const sentryCliInstalledVersions = getLineValue(summary, '@sentry/cli installed package versions');
  const sentryCliNestedVersions = getLineValue(summary, '@sentry/cli nested package versions');
  const sentryCliDirectPackageInstalled = getLineValue(summary, '@sentry/cli direct package installed');
  const sentryCliReleaseBuildPathUsesDirectPackage = getLineValue(summary, 'Sentry CLI release build path uses direct package');
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
  const androidReleaseSummaryRequiredVariantsCovered = getLineValue(summary, 'Android release summary required variants covered');
  const androidReleaseSummaryValid = getLineValue(summary, 'Android release summary valid');
  const androidReleaseSummaryCurrentInputsCovered = getLineValue(summary, 'Android release summary current inputs covered');
  const androidReleaseSummaryErrors = getLineValue(summary, 'Android release summary errors');
  const androidReleaseApkManifestValid = getLineValue(summary, 'Android release APK manifest valid');
  const androidReleaseApkManifestErrors = getLineValue(summary, 'Android release APK manifest errors');
  const androidReleaseSmokeSummaryPresent = getLineValue(summary, 'Android release smoke summary present');
  const androidReleaseSmokeSummaryValid = getLineValue(summary, 'Android release smoke summary valid');
  const androidReleaseSmokeSummaryErrors = getLineValue(summary, 'Android release smoke summary errors');
  const sentryReleaseSmokeEvidenceReady = getLineValue(summary, 'Sentry release smoke evidence ready');
  const androidReleaseNoNetworkSmokeSummaryPresent = getLineValue(summary, 'Android release no-network smoke summary present');
  const androidReleaseNoNetworkSmokeSummaryValid = getLineValue(summary, 'Android release no-network smoke summary valid');
  const androidReleaseNoNetworkSmokeSummaryErrors = getLineValue(summary, 'Android release no-network smoke summary errors');
  const sentryReleaseNoNetworkBlockerEvidenceReady = getLineValue(
    summary,
    'Sentry release no-network blocker evidence ready',
  );
  const androidReleaseCreateWalletSmokeSummaryPresent = getLineValue(summary, 'Android release create-wallet smoke summary present');
  const androidReleaseCreateWalletSmokeSummaryValid = getLineValue(summary, 'Android release create-wallet smoke summary valid');
  const androidReleaseCreateWalletSmokeSummaryErrors = getLineValue(summary, 'Android release create-wallet smoke summary errors');
  const sentryReleaseCreateWalletEvidenceReady = getLineValue(summary, 'Sentry release create-wallet evidence ready');
  const iosReleaseStaticReady = getLineValue(summary, 'iOS release static readiness valid');
  const iosMacArchiveReady = getLineValue(summary, 'iOS macOS archive validation ready');
  const iosSentryBundlePhaseCount = getLineValue(summary, 'iOS Sentry bundle/source-map phases');
  const iosSentryDsymPhaseCount = getLineValue(summary, 'iOS Sentry dSYM upload phases');
  const iosPodfileLockRefreshRequired = getLineValue(summary, 'iOS Podfile.lock refresh required');
  const iosPodfileLockDriftIssues = getLineValue(summary, 'iOS Podfile.lock drift issues');
  const iosMacValidationPrereqsReady = getLineValue(summary, 'iOS macOS validation prerequisites ready');
  const iosMacValidationBlockers = getLineValue(summary, 'iOS macOS validation blockers');
  const sentryReleaseUploadValidation = getLineValue(summary, 'Sentry release upload validation');
  const createScriptPresent = getLineValue(summary, 'create-sentry-properties.sh present');
  const createScriptUsesToken = getLineValue(summary, 'create-sentry-properties.sh requires SENTRY_AUTH_TOKEN');
  const createScriptRejectsMissingToken = getLineValue(summary, 'create-sentry-properties.sh rejects missing SENTRY_AUTH_TOKEN');
  const createScriptWritesRootProperties = getLineValue(summary, 'create-sentry-properties.sh writes root properties');
  const createScriptWritesAndroidProperties = getLineValue(summary, 'create-sentry-properties.sh writes Android properties');
  const createScriptWritesIosProperties = getLineValue(summary, 'create-sentry-properties.sh writes iOS properties');
  const createScriptStaticDefaultsValid = getLineValue(summary, 'create-sentry-properties.sh static defaults valid');
  const createScriptSupportsOrgOverride = getLineValue(summary, 'create-sentry-properties.sh supports SENTRY_ORG override');
  const createScriptSupportsProjectOverride = getLineValue(summary, 'create-sentry-properties.sh supports SENTRY_PROJECT override');
  const createNodeScriptPresent = getLineValue(summary, 'createSentryProperties.mjs present');
  const createNodeScriptUsesToken = getLineValue(summary, 'createSentryProperties.mjs requires SENTRY_AUTH_TOKEN');
  const createNodeScriptRejectsMissingToken = getLineValue(summary, 'createSentryProperties.mjs rejects missing SENTRY_AUTH_TOKEN');
  const createNodeScriptWritesRootProperties = getLineValue(summary, 'createSentryProperties.mjs writes root properties');
  const createNodeScriptWritesAndroidProperties = getLineValue(summary, 'createSentryProperties.mjs writes Android properties');
  const createNodeScriptWritesIosProperties = getLineValue(summary, 'createSentryProperties.mjs writes iOS properties');
  const createNodeScriptStaticDefaultsValid = getLineValue(summary, 'createSentryProperties.mjs static defaults valid');
  const createNodeScriptSupportsOrgOverride = getLineValue(summary, 'createSentryProperties.mjs supports SENTRY_ORG override');
  const createNodeScriptSupportsProjectOverride = getLineValue(summary, 'createSentryProperties.mjs supports SENTRY_PROJECT override');
  const createNodeScriptSupportsRootOverride = getLineValue(summary, 'createSentryProperties.mjs supports --root override');
  const createNodePackageScriptPresent = getLineValue(summary, 'sentry:release:create-properties script present');
  const envHasToken = getLineValue(summary, 'SENTRY_AUTH_TOKEN available in current shell');
  const requiredAction = getLineValue(summary, 'Required action');
  const sentryCliInstallationLines = getBulletLinesAfter(summary, '@sentry/cli installed package instances');
  const releaseIntegrationErrorLines = getBulletLinesAfter(summary, 'Sentry release integration errors');
  const missingFileLines = getBulletLinesAfter(summary, 'Missing files');
  const invalidFileLines = getBulletLinesAfter(summary, 'Invalid files');
  const readinessLines = getBulletLinesAfter(summary, 'Properties file readiness entries');
  const androidReleaseSummaryErrorLines = getBulletLinesAfter(summary, 'Android release summary errors');
  const androidReleaseApkManifestErrorLines = getBulletLinesAfter(summary, 'Android release APK manifest errors');
  const androidReleaseSmokeSummaryErrorLines = getBulletLinesAfter(summary, 'Android release smoke summary errors');
  const androidReleaseNoNetworkSmokeSummaryErrorLines = getBulletLinesAfter(
    summary,
    'Android release no-network smoke summary errors',
  );
  const androidReleaseCreateWalletSmokeSummaryErrorLines = getBulletLinesAfter(
    summary,
    'Android release create-wallet smoke summary errors',
  );
  const iosPodfileLockDriftIssueLines = getBulletLinesAfter(summary, 'iOS Podfile.lock drift issues');
  const iosMacValidationBlockerLines = getBulletLinesAfter(summary, 'iOS macOS validation blockers');

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

  if (!/^\d+\.\d+\.\d+/.test(sentryReactNativeLatest)) {
    errors.push(`@sentry/react-native latest must be present. Received: ${sentryReactNativeLatest || 'missing'}`);
  }

  if (!['yes', 'no'].includes(sentryReactNativeCurrent)) {
    errors.push(`@sentry/react-native current must be yes or no. Received: ${sentryReactNativeCurrent || 'missing'}`);
  } else if (sentryReactNativeCurrent === 'yes' && sentryReactNativeVersion !== sentryReactNativeLatest) {
    errors.push('@sentry/react-native current cannot be yes when installed version differs from latest');
  }

  if (!/^\d+\.\d+\.\d+/.test(sentryCliPackageVersion)) {
    errors.push(`@sentry/cli package version must be present. Received: ${sentryCliPackageVersion || 'missing'}`);
  }

  if (!/^\d+\.\d+\.\d+/.test(sentryCliLatest)) {
    errors.push(`@sentry/cli latest must be present. Received: ${sentryCliLatest || 'missing'}`);
  }

  if (!['yes', 'no'].includes(sentryCliCurrent)) {
    errors.push(`@sentry/cli current must be yes or no. Received: ${sentryCliCurrent || 'missing'}`);
  } else if (sentryCliCurrent === 'yes' && sentryCliPackageVersion !== sentryCliLatest) {
    errors.push('@sentry/cli current cannot be yes when installed version differs from latest');
  }

  if (!/^\d+$/.test(sentryCliInstalledInstances)) {
    errors.push(`@sentry/cli installed package instances must be a non-negative integer. Received: ${sentryCliInstalledInstances || 'missing'}`);
  } else if (Number(sentryCliInstalledInstances) !== sentryCliInstallationLines.length) {
    errors.push(`@sentry/cli installed package instances count is ${sentryCliInstalledInstances}, but listed ${sentryCliInstallationLines.length}`);
  }

  if (!sentryCliInstalledVersions || sentryCliInstalledVersions === 'none') {
    errors.push('@sentry/cli installed package versions must list at least the direct package version');
  } else if (!sentryCliInstalledVersions.split(',').map(value => value.trim()).includes(sentryCliPackageVersion)) {
    errors.push('@sentry/cli installed package versions must include the direct package version');
  }

  if (!sentryCliNestedVersions) {
    errors.push('@sentry/cli nested package versions must be present, use none when no nested copy exists');
  }

  const sentryCliInstallationEntries = sentryCliInstallationLines.map(line => {
    const match = line.match(/^(node_modules\/.+\/@sentry\/cli\/package\.json|node_modules\/@sentry\/cli\/package\.json): (\d+\.\d+\.\d+) \((direct|nested)\)$/);

    if (!match) {
      errors.push(`Invalid @sentry/cli package instance line: ${line}`);
      return null;
    }

    return {
      relativePath: match[1],
      version: match[2],
      kind: match[3],
    };
  }).filter(Boolean);
  const directSentryCliInstall = sentryCliInstallationEntries.find(
    entry => entry.relativePath === 'node_modules/@sentry/cli/package.json' && entry.kind === 'direct',
  );

  if (sentryCliDirectPackageInstalled !== 'yes') {
    errors.push('@sentry/cli direct package installed must be yes for release source-map validation');
  }

  if (sentryCliReleaseBuildPathUsesDirectPackage !== 'yes') {
    errors.push('Sentry CLI release build path must use the direct package');
  }

  if (sentryCliDirectPackageInstalled === 'yes' && !directSentryCliInstall) {
    errors.push('@sentry/cli direct package installed is yes, but direct package instance is missing');
  }

  if (directSentryCliInstall && directSentryCliInstall.version !== sentryCliPackageVersion) {
    errors.push('@sentry/cli direct package instance version must match the package version line');
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

  if (!/^\d+$/.test(androidReleaseApkManifestErrors)) {
    errors.push(`Android release APK manifest errors must be a non-negative integer. Received: ${androidReleaseApkManifestErrors || 'missing'}`);
  } else if (Number(androidReleaseApkManifestErrors) !== androidReleaseApkManifestErrorLines.length) {
    errors.push(`Android release APK manifest errors count is ${androidReleaseApkManifestErrors}, but listed ${androidReleaseApkManifestErrorLines.length}`);
  }

  if (androidReleaseSummaryPresent === 'no' && androidReleaseSummaryVariants !== 'none') {
    errors.push('Missing Android release summary must report variants as none');
  }

  if (androidReleaseSummaryPresent === 'yes') {
    const variants = androidReleaseSummaryVariants
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean);

    ['dev', 'stage', 'prod', 'beta'].forEach(variant => {
      if (!variants.includes(variant)) {
        errors.push(`Android release summary must include ${variant} release evidence`);
      }
    });
  }

  if (androidReleaseSummaryRequiredVariantsCovered !== 'yes') {
    errors.push('Android release summary must cover dev, stage, prod, and beta release evidence');
  }

  if (androidReleaseSummaryValid === 'yes' && androidReleaseSummaryErrors !== '0') {
    errors.push('Valid Android release summary must have 0 summary errors');
  }

  if (androidReleaseSummaryValid === 'yes' && androidReleaseSummaryCurrentInputsCovered !== 'yes') {
    errors.push('Valid Android release summary must cover the current release inputs');
  }

  if (androidReleaseApkManifestValid === 'yes' && androidReleaseApkManifestErrors !== '0') {
    errors.push('Valid Android release APK manifest proof must have 0 manifest errors');
  }

  if (!/^\d+$/.test(androidReleaseSmokeSummaryErrors)) {
    errors.push(`Android release smoke summary errors must be a non-negative integer. Received: ${androidReleaseSmokeSummaryErrors || 'missing'}`);
  } else if (Number(androidReleaseSmokeSummaryErrors) !== androidReleaseSmokeSummaryErrorLines.length) {
    errors.push(
      `Android release smoke summary errors count is ${androidReleaseSmokeSummaryErrors}, but listed ${androidReleaseSmokeSummaryErrorLines.length}`,
    );
  }

  if (androidReleaseSmokeSummaryPresent !== 'yes') {
    errors.push('Android release smoke summary must be present for Sentry release validation');
  }

  if (!/^\d+$/.test(androidReleaseNoNetworkSmokeSummaryErrors)) {
    errors.push(
      `Android release no-network smoke summary errors must be a non-negative integer. Received: ${
        androidReleaseNoNetworkSmokeSummaryErrors || 'missing'
      }`,
    );
  } else if (Number(androidReleaseNoNetworkSmokeSummaryErrors) !== androidReleaseNoNetworkSmokeSummaryErrorLines.length) {
    errors.push(
      `Android release no-network smoke summary errors count is ${androidReleaseNoNetworkSmokeSummaryErrors}, but listed ${androidReleaseNoNetworkSmokeSummaryErrorLines.length}`,
    );
  }

  const fullAndroidReleaseSmokeReady =
    androidReleaseSmokeSummaryPresent === 'yes' &&
    androidReleaseSmokeSummaryValid === 'yes' &&
    androidReleaseSmokeSummaryErrors === '0' &&
    sentryReleaseSmokeEvidenceReady === 'yes';
  const noNetworkBlockerEvidenceReady =
    androidReleaseNoNetworkSmokeSummaryPresent === 'yes' &&
    androidReleaseNoNetworkSmokeSummaryValid === 'yes' &&
    androidReleaseNoNetworkSmokeSummaryErrors === '0' &&
    sentryReleaseNoNetworkBlockerEvidenceReady === 'yes';

  if (!fullAndroidReleaseSmokeReady && !(readiness === 'not ready' && noNetworkBlockerEvidenceReady)) {
    errors.push(
      'Sentry release prerequisites require either valid full Android release smoke evidence or valid controlled no-network blocker evidence for a not-ready preflight summary',
    );
  }

  if (androidReleaseNoNetworkSmokeSummaryValid === 'yes' && androidReleaseNoNetworkSmokeSummaryErrors !== '0') {
    errors.push('Valid Android release no-network smoke summary must have 0 summary errors');
  }

  if (sentryReleaseNoNetworkBlockerEvidenceReady === 'yes' && androidReleaseNoNetworkSmokeSummaryValid !== 'yes') {
    errors.push('Sentry release no-network blocker evidence cannot be ready without a valid no-network smoke summary');
  }

  if (!/^\d+$/.test(androidReleaseCreateWalletSmokeSummaryErrors)) {
    errors.push(
      `Android release create-wallet smoke summary errors must be a non-negative integer. Received: ${
        androidReleaseCreateWalletSmokeSummaryErrors || 'missing'
      }`,
    );
  } else if (Number(androidReleaseCreateWalletSmokeSummaryErrors) !== androidReleaseCreateWalletSmokeSummaryErrorLines.length) {
    errors.push(
      `Android release create-wallet smoke summary errors count is ${androidReleaseCreateWalletSmokeSummaryErrors}, but listed ${androidReleaseCreateWalletSmokeSummaryErrorLines.length}`,
    );
  }

  if (androidReleaseCreateWalletSmokeSummaryPresent !== 'yes') {
    errors.push('Android release create-wallet smoke summary must be present for Sentry release validation');
  }

  if (
    androidReleaseCreateWalletSmokeSummaryValid !== 'yes' &&
    !(readiness === 'not ready' && noNetworkBlockerEvidenceReady)
  ) {
    errors.push('Sentry release prerequisites require a valid Android release create-wallet smoke summary');
  }

  if (sentryReleaseCreateWalletEvidenceReady !== 'yes' && !(readiness === 'not ready' && noNetworkBlockerEvidenceReady)) {
    errors.push('Sentry release create-wallet evidence must be ready before source-map release validation is useful');
  }

  if (!['yes', 'no'].includes(iosReleaseStaticReady)) {
    errors.push(`iOS release static readiness valid must be yes or no. Received: ${iosReleaseStaticReady || 'missing'}`);
  }

  if (!['yes', 'no'].includes(iosMacArchiveReady)) {
    errors.push(`iOS macOS archive validation ready must be yes or no. Received: ${iosMacArchiveReady || 'missing'}`);
  }

  [
    ['iOS Sentry bundle/source-map phases', iosSentryBundlePhaseCount],
    ['iOS Sentry dSYM upload phases', iosSentryDsymPhaseCount],
  ].forEach(([label, value]) => {
    if (!/^\d+$/.test(value) || Number(value) <= 0) {
      errors.push(`${label} must be a positive integer. Received: ${value || 'missing'}`);
    }
  });

  if (!['yes', 'no'].includes(iosPodfileLockRefreshRequired)) {
    errors.push(`iOS Podfile.lock refresh required must be yes or no. Received: ${iosPodfileLockRefreshRequired || 'missing'}`);
  }

  if (!/^\d+$/.test(iosPodfileLockDriftIssues)) {
    errors.push(`iOS Podfile.lock drift issues must be a non-negative integer. Received: ${iosPodfileLockDriftIssues || 'missing'}`);
  } else if (Number(iosPodfileLockDriftIssues) !== iosPodfileLockDriftIssueLines.length) {
    errors.push(`iOS Podfile.lock drift issues count is ${iosPodfileLockDriftIssues}, but listed ${iosPodfileLockDriftIssueLines.length}`);
  }

  if (iosPodfileLockRefreshRequired === 'yes' && iosPodfileLockDriftIssues === '0') {
    errors.push('iOS Podfile.lock refresh cannot be required with 0 drift issues');
  }

  if (iosPodfileLockRefreshRequired === 'no' && iosPodfileLockDriftIssues !== '0') {
    errors.push('iOS Podfile.lock refresh must be required when drift issues are listed');
  }

  if (!['yes', 'no'].includes(iosMacValidationPrereqsReady)) {
    errors.push(`iOS macOS validation prerequisites ready must be yes or no. Received: ${iosMacValidationPrereqsReady || 'missing'}`);
  }

  if (!/^\d+$/.test(iosMacValidationBlockers)) {
    errors.push(`iOS macOS validation blockers must be a non-negative integer. Received: ${iosMacValidationBlockers || 'missing'}`);
  } else if (Number(iosMacValidationBlockers) !== iosMacValidationBlockerLines.length) {
    errors.push(`iOS macOS validation blockers count is ${iosMacValidationBlockers}, but listed ${iosMacValidationBlockerLines.length}`);
  }

  if (iosMacValidationPrereqsReady === 'yes' && iosMacValidationBlockers !== '0') {
    errors.push('Ready iOS macOS validation prerequisites must have 0 blockers');
  }

  if (iosMacValidationPrereqsReady === 'no' && iosMacValidationBlockers === '0') {
    errors.push('Not-ready iOS macOS validation prerequisites must list at least one blocker');
  }

  if (sentryReleaseUploadValidation !== 'not claimed') {
    errors.push(`Sentry release upload validation must be not claimed. Received: ${sentryReleaseUploadValidation || 'missing'}`);
  }

  [
    androidReleaseSummaryPresent,
    androidReleaseSummaryRequiredVariantsCovered,
    androidReleaseSummaryValid,
    androidReleaseSummaryCurrentInputsCovered,
    androidReleaseApkManifestValid,
    androidReleaseSmokeSummaryPresent,
    androidReleaseSmokeSummaryValid,
    sentryReleaseSmokeEvidenceReady,
    androidReleaseNoNetworkSmokeSummaryPresent,
    androidReleaseNoNetworkSmokeSummaryValid,
    sentryReleaseNoNetworkBlockerEvidenceReady,
    androidReleaseCreateWalletSmokeSummaryPresent,
    androidReleaseCreateWalletSmokeSummaryValid,
    sentryReleaseCreateWalletEvidenceReady,
    iosReleaseStaticReady,
    iosMacArchiveReady,
    iosPodfileLockRefreshRequired,
    iosMacValidationPrereqsReady,
    sentryReactNativeCurrent,
    sentryCliCurrent,
    sentryCliDirectPackageInstalled,
    sentryCliReleaseBuildPathUsesDirectPackage,
    sentryCliBinPresent,
    sentryCliExecutable,
    createScriptPresent,
    createScriptUsesToken,
    createScriptRejectsMissingToken,
    createScriptWritesRootProperties,
    createScriptWritesAndroidProperties,
    createScriptWritesIosProperties,
    createScriptStaticDefaultsValid,
    createScriptSupportsOrgOverride,
    createScriptSupportsProjectOverride,
    createNodeScriptPresent,
    createNodeScriptUsesToken,
    createNodeScriptRejectsMissingToken,
    createNodeScriptWritesRootProperties,
    createNodeScriptWritesAndroidProperties,
    createNodeScriptWritesIosProperties,
    createNodeScriptStaticDefaultsValid,
    createNodeScriptSupportsOrgOverride,
    createNodeScriptSupportsProjectOverride,
    createNodeScriptSupportsRootOverride,
    createNodePackageScriptPresent,
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
      sentryCliDirectPackageInstalled !== 'yes' ||
      sentryCliReleaseBuildPathUsesDirectPackage !== 'yes' ||
      sentryCliBinPresent !== 'yes' ||
      sentryCliExecutable !== 'yes' ||
      filesPresent !== 'yes' ||
      missingFiles !== '0' ||
      invalidFiles !== '0' ||
      readyPropertiesFiles !== String(requiredSentryPropertiesFiles.length) ||
      androidReleaseSummaryPresent !== 'yes' ||
      androidReleaseSummaryRequiredVariantsCovered !== 'yes' ||
      androidReleaseSummaryValid !== 'yes' ||
      androidReleaseSummaryCurrentInputsCovered !== 'yes' ||
      androidReleaseApkManifestValid !== 'yes' ||
      androidReleaseSmokeSummaryPresent !== 'yes' ||
      androidReleaseSmokeSummaryValid !== 'yes' ||
      sentryReleaseSmokeEvidenceReady !== 'yes' ||
      androidReleaseCreateWalletSmokeSummaryPresent !== 'yes' ||
      androidReleaseCreateWalletSmokeSummaryValid !== 'yes' ||
      sentryReleaseCreateWalletEvidenceReady !== 'yes' ||
      iosReleaseStaticReady !== 'yes' ||
      iosMacArchiveReady !== 'yes' ||
      iosPodfileLockRefreshRequired !== 'no' ||
      iosPodfileLockDriftIssues !== '0' ||
      iosMacValidationPrereqsReady !== 'yes' ||
      iosMacValidationBlockers !== '0')
  ) {
    errors.push('Ready summary must have wired Sentry release integration, direct Sentry CLI release build path, executable Sentry CLI, present properties files, 0 missing files, 0 invalid files, all properties files ready, current Android release evidence with valid APK manifests, ready Android release smoke evidence, ready Android release create-wallet evidence, and ready iOS archive/macOS validation prerequisites');
  }

  if (
    createScriptPresent === 'yes' &&
    (createScriptUsesToken !== 'yes' ||
      createScriptRejectsMissingToken !== 'yes' ||
      createScriptWritesRootProperties !== 'yes' ||
      createScriptWritesAndroidProperties !== 'yes' ||
      createScriptWritesIosProperties !== 'yes' ||
      createScriptStaticDefaultsValid !== 'yes' ||
      createScriptSupportsOrgOverride !== 'yes' ||
      createScriptSupportsProjectOverride !== 'yes')
  ) {
    errors.push('Present create-sentry-properties.sh must require and reject missing SENTRY_AUTH_TOKEN, write root/android/iOS properties, keep expected static defaults, and support SENTRY_ORG/SENTRY_PROJECT overrides');
  }

  if (
    createNodeScriptPresent === 'yes' &&
    (createNodeScriptUsesToken !== 'yes' ||
      createNodeScriptRejectsMissingToken !== 'yes' ||
      createNodeScriptWritesRootProperties !== 'yes' ||
      createNodeScriptWritesAndroidProperties !== 'yes' ||
      createNodeScriptWritesIosProperties !== 'yes' ||
      createNodeScriptStaticDefaultsValid !== 'yes' ||
      createNodeScriptSupportsOrgOverride !== 'yes' ||
      createNodeScriptSupportsProjectOverride !== 'yes' ||
      createNodeScriptSupportsRootOverride !== 'yes' ||
      createNodePackageScriptPresent !== 'yes')
  ) {
    errors.push('Present createSentryProperties.mjs must require and reject missing SENTRY_AUTH_TOKEN, write root/android/iOS properties, keep expected static defaults, support SENTRY_ORG/SENTRY_PROJECT overrides, support --root test output, and have a package script entry');
  }

  if (
    readiness === 'not ready' &&
    (!requiredAction.includes('SENTRY_AUTH_TOKEN') ||
      !requiredSentryPropertiesFiles.every(relativePath => requiredAction.includes(relativePath)) ||
      !requiredAction.includes('ios/Podfile.lock') ||
      !requiredAction.includes('macOS') ||
      !requiredAction.includes('Xcode'))
  ) {
    errors.push('Not ready summary must include SENTRY_AUTH_TOKEN, all sentry.properties paths, ios/Podfile.lock, macOS, and Xcode in the required action');
  }

  return errors;
};
