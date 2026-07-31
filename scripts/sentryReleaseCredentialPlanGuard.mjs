const header = 'Sentry release credential plan';
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const forbiddenSecretPatterns = [
  /SENTRY_AUTH_TOKEN\s*=/,
  /auth\.token\s*=/,
  /SENTRY_DSN\s*=/,
  /dsn\s*=/i,
];

const parseCount = (summary, label) => {
  const match = summary.match(new RegExp(`^${label}: (\\d+)$`, 'm'));
  return match ? Number(match[1]) : null;
};

const getLineValue = (summary, label) => {
  const line = summary.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getBulletLinesAfter = (summary, label) => {
  const lines = summary.split(/\r?\n/);
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

const assertYesNo = (errors, summary, label) => {
  const value = getLineValue(summary, label);

  if (!['yes', 'no'].includes(value)) {
    errors.push(`${label} must be yes or no.`);
  }

  return value;
};

const assertCountMatchesBullets = (errors, summary, label) => {
  const count = parseCount(summary, label);
  const bulletLines = getBulletLinesAfter(summary, label);

  if (count === null) {
    errors.push(`${label} count is missing.`);
  } else if (count !== bulletLines.length) {
    errors.push(`${label} count is ${count}, but ${bulletLines.length} entries were listed.`);
  }

  return { count, bulletLines };
};

export const getSentryReleaseCredentialPlanErrors = plan => {
  const errors = [];
  const lines = plan.split(/\r?\n/);

  if (lines[0] !== header) {
    errors.push('Missing Sentry release credential plan header.');
  }

  const generatedAt = lines.find(line => line.startsWith('Generated at: '));
  if (!generatedAt || !isoTimestampPattern.test(generatedAt.replace('Generated at: ', ''))) {
    errors.push('Generated at must be an ISO timestamp.');
  }

  if (!plan.includes('Secret values printed: no')) {
    errors.push('Plan must explicitly state that secret values were not printed.');
  }

  if (!plan.includes('Review-safe evidence: file paths, env variable names, and command names only')) {
    errors.push('Plan must state that review-safe evidence is limited to paths, env names, and commands.');
  }

  if (!plan.includes('Sentry release upload validation: not claimed')) {
    errors.push('Plan must keep Sentry release upload validation unclaimed.');
  }

  forbiddenSecretPatterns.forEach(pattern => {
    if (pattern.test(plan)) {
      errors.push('Plan must not contain Sentry token, DSN, or secret assignments.');
    }
  });

  ['sentry.properties', 'android/sentry.properties', 'ios/sentry.properties'].forEach(relativePath => {
    if (!plan.includes(`- ${relativePath}: `)) {
      errors.push(`Plan must include ${relativePath} readiness.`);
    }
  });

  const releaseReadiness = getLineValue(plan, 'Release source-map prerequisites');
  if (!['ready', 'not ready'].includes(releaseReadiness)) {
    errors.push('Release source-map prerequisites must be ready or not ready.');
  }

  [
    '@sentry/react-native version',
    '@sentry/react-native latest',
    '@sentry/cli package version',
    '@sentry/cli latest',
  ].forEach(label => {
    const value = getLineValue(plan, label);

    if (!/^\d+\.\d+\.\d+/.test(value)) {
      errors.push(`${label} must be present as a semantic version.`);
    }
  });

  const sentryReactNativeCurrent = assertYesNo(errors, plan, '@sentry/react-native current');
  const sentryCliCurrent = assertYesNo(errors, plan, '@sentry/cli current');

  const missingFiles = parseCount(plan, 'Missing properties files');
  const listedMissingFiles = lines.filter(line => line.startsWith('- missing file: ')).length;
  if (missingFiles === null) {
    errors.push('Missing properties files count is missing.');
  } else if (missingFiles !== listedMissingFiles) {
    errors.push(`Missing properties files count is ${missingFiles}, but ${listedMissingFiles} missing files were listed.`);
  }

  const invalidFiles = parseCount(plan, 'Invalid properties files');
  const listedInvalidFiles = lines.filter(line => line.startsWith('- invalid file: ')).length;
  if (invalidFiles === null) {
    errors.push('Invalid properties files count is missing.');
  } else if (invalidFiles !== listedInvalidFiles) {
    errors.push(`Invalid properties files count is ${invalidFiles}, but ${listedInvalidFiles} invalid files were listed.`);
  }

  const androidReleaseSummaryPresent = assertYesNo(errors, plan, 'Android release summary present');
  const androidReleaseSummaryVariants = getLineValue(plan, 'Android release summary variants');
  const androidReleaseSummaryRequiredVariantsCovered = assertYesNo(
    errors,
    plan,
    'Android release summary required variants covered',
  );
  const androidReleaseSummaryCurrentInputsCovered = assertYesNo(
    errors,
    plan,
    'Android release summary current inputs covered',
  );
  const androidReleaseSummaryEvidence = assertCountMatchesBullets(errors, plan, 'Android release summary errors');
  const androidReleaseApkManifestValid = assertYesNo(errors, plan, 'Android release APK manifest valid');
  assertCountMatchesBullets(errors, plan, 'Android release APK manifest errors');
  const androidReleaseEvidenceReady = assertYesNo(errors, plan, 'Android release evidence ready');
  const androidReleaseSmokeSummaryPresent = assertYesNo(errors, plan, 'Android release smoke summary present');
  const androidReleaseSmokeSummaryValid = assertYesNo(errors, plan, 'Android release smoke summary valid');
  assertCountMatchesBullets(errors, plan, 'Android release smoke summary errors');
  const androidReleaseSmokeEvidenceReady = assertYesNo(errors, plan, 'Android release smoke evidence ready');
  const androidReleaseNoNetworkSmokeSummaryPresent = assertYesNo(
    errors,
    plan,
    'Android release no-network smoke summary present',
  );
  const androidReleaseNoNetworkSmokeSummaryValid = assertYesNo(
    errors,
    plan,
    'Android release no-network smoke summary valid',
  );
  const androidReleaseNoNetworkSmokeEvidence = assertCountMatchesBullets(
    errors,
    plan,
    'Android release no-network smoke summary errors',
  );
  const sentryReleaseNoNetworkBlockerEvidenceReady = assertYesNo(
    errors,
    plan,
    'Sentry release no-network blocker evidence ready',
  );
  const androidReleaseNetworkBlockerSummaryPresent = assertYesNo(
    errors,
    plan,
    'Android release network blocker summary present',
  );
  const androidReleaseNetworkBlockerSummaryValid = assertYesNo(
    errors,
    plan,
    'Android release network blocker summary valid',
  );
  const androidReleaseNetworkBlockerOutcome = getLineValue(plan, 'Android release network blocker outcome');
  assertCountMatchesBullets(errors, plan, 'Android release network blocker summary errors');
  const sentryReleaseNetworkBlockerClassified = assertYesNo(errors, plan, 'Sentry release network blocker classified');
  const androidReleaseCreateWalletSmokeSummaryPresent = assertYesNo(
    errors,
    plan,
    'Android release create-wallet smoke summary present',
  );
  const androidReleaseCreateWalletSmokeSummaryValid = assertYesNo(
    errors,
    plan,
    'Android release create-wallet smoke summary valid',
  );
  assertCountMatchesBullets(errors, plan, 'Android release create-wallet smoke summary errors');
  const sentryReleaseCreateWalletEvidenceReady = assertYesNo(errors, plan, 'Sentry release create-wallet evidence ready');
  const iosReleaseStaticReadinessValid = assertYesNo(errors, plan, 'iOS release static readiness valid');
  const iosMacArchiveValidationReady = assertYesNo(errors, plan, 'iOS macOS archive validation ready');

  ['iOS Sentry bundle/source-map phases', 'iOS Sentry dSYM upload phases'].forEach(label => {
    const value = parseCount(plan, label);

    if (value === null || value <= 0) {
      errors.push(`${label} must be a positive integer.`);
    }
  });

  const iosPodfileLockRefreshRequired = assertYesNo(errors, plan, 'iOS Podfile.lock refresh required');
  const iosPodfileLockDriftEvidence = assertCountMatchesBullets(errors, plan, 'iOS Podfile.lock drift issues');
  const iosMacValidationPrerequisitesReady = assertYesNo(errors, plan, 'iOS macOS validation prerequisites ready');
  const iosMacValidationBlockerEvidence = assertCountMatchesBullets(errors, plan, 'iOS macOS validation blockers');

  if (androidReleaseSummaryPresent === 'yes') {
    const variants = androidReleaseSummaryVariants
      .split(',')
      .map(variant => variant.trim())
      .filter(Boolean);

    ['dev', 'stage', 'prod', 'beta'].forEach(variant => {
      if (!variants.includes(variant)) {
        errors.push(`Android release summary must include ${variant} evidence.`);
      }
    });
  }

  if (
    androidReleaseEvidenceReady === 'yes' &&
    (androidReleaseSummaryPresent !== 'yes' ||
      androidReleaseSummaryRequiredVariantsCovered !== 'yes' ||
      androidReleaseSummaryCurrentInputsCovered !== 'yes' ||
      androidReleaseSummaryEvidence.count !== 0 ||
      androidReleaseApkManifestValid !== 'yes')
  ) {
    errors.push('Ready Android release evidence requires current summary inputs, all release variants, 0 summary errors, and a valid APK manifest.');
  }

  if (
    androidReleaseSmokeEvidenceReady === 'yes' &&
    (androidReleaseSmokeSummaryPresent !== 'yes' || androidReleaseSmokeSummaryValid !== 'yes')
  ) {
    errors.push('Ready Android release smoke evidence requires a present and valid release smoke summary.');
  }

  if (
    sentryReleaseNoNetworkBlockerEvidenceReady === 'yes' &&
    (androidReleaseNoNetworkSmokeSummaryPresent !== 'yes' ||
      androidReleaseNoNetworkSmokeSummaryValid !== 'yes' ||
      androidReleaseNoNetworkSmokeEvidence.count !== 0 ||
      androidReleaseNetworkBlockerSummaryPresent !== 'yes' ||
      androidReleaseNetworkBlockerSummaryValid !== 'yes' ||
      androidReleaseNetworkBlockerOutcome !== 'blocked-by-electrum-certificate-expired' ||
      sentryReleaseNetworkBlockerClassified !== 'yes')
  ) {
    errors.push('Ready Sentry no-network blocker evidence requires valid no-network smoke and classified Electrum certificate blocker evidence.');
  }

  if (
    sentryReleaseCreateWalletEvidenceReady === 'yes' &&
    (androidReleaseCreateWalletSmokeSummaryPresent !== 'yes' || androidReleaseCreateWalletSmokeSummaryValid !== 'yes')
  ) {
    errors.push('Ready Sentry create-wallet evidence requires a present and valid create-wallet smoke summary.');
  }

  if (iosPodfileLockRefreshRequired === 'yes' && iosPodfileLockDriftEvidence.count === 0) {
    errors.push('iOS Podfile.lock refresh cannot be required without listed drift issues.');
  }

  if (iosPodfileLockRefreshRequired === 'no' && iosPodfileLockDriftEvidence.count !== 0) {
    errors.push('iOS Podfile.lock drift issues require refresh required to be yes.');
  }

  if (iosMacValidationPrerequisitesReady === 'yes' && iosMacValidationBlockerEvidence.count !== 0) {
    errors.push('Ready iOS macOS validation prerequisites must have 0 blockers.');
  }

  if (iosMacValidationPrerequisitesReady === 'no' && iosMacValidationBlockerEvidence.count === 0) {
    errors.push('Not-ready iOS macOS validation prerequisites must list blockers.');
  }

  if (
    releaseReadiness === 'ready' &&
    (missingFiles !== 0 ||
      invalidFiles !== 0 ||
      sentryReactNativeCurrent !== 'yes' ||
      sentryCliCurrent !== 'yes' ||
      androidReleaseEvidenceReady !== 'yes' ||
      androidReleaseSmokeEvidenceReady !== 'yes' ||
      sentryReleaseCreateWalletEvidenceReady !== 'yes' ||
      iosReleaseStaticReadinessValid !== 'yes' ||
      iosMacArchiveValidationReady !== 'yes' ||
      iosPodfileLockRefreshRequired !== 'no' ||
      iosPodfileLockDriftEvidence.count !== 0 ||
      iosMacValidationPrerequisitesReady !== 'yes' ||
      iosMacValidationBlockerEvidence.count !== 0)
  ) {
    errors.push('Ready Sentry release credential plan requires credentials, current Sentry packages, Android release/full-smoke/create-wallet evidence, and macOS iOS validation readiness.');
  }

  [
    '1. Set SENTRY_AUTH_TOKEN in the local shell or CI secret store.',
    '2. Set SENTRY_RELEASE_PROFILE to nonprod or prod; use SENTRY_ORG, SENTRY_ANDROID_PROJECT, and SENTRY_IOS_PROJECT overrides only for a confirmed Sentry project move.',
    '3. Run corepack yarn sentry:release:create-properties.',
    '4. Run corepack yarn sentry:release:prereq-audit.',
    '5. Run corepack yarn sentry:release:prereq-check-summary.',
    '6. Run corepack yarn sentry:release:validation:handoff after Android release and smoke evidence are current.',
  ].forEach(step => {
    if (!plan.includes(step)) {
      errors.push(`Plan must include required step: ${step}`);
    }
  });

  const requiredAction = getLineValue(plan, 'Required action');
  const requiredActionSnippets = [
    'SENTRY',
    'sentry.properties',
    'android/sentry.properties',
    'ios/sentry.properties',
    'Android release',
    'create-wallet',
    'ios/Podfile.lock',
    'macOS',
    'Xcode',
  ];

  if (!requiredActionSnippets.every(snippet => requiredAction.includes(snippet))) {
    errors.push('Plan must include the credential handoff required action.');
  }

  return [...new Set(errors)];
};
