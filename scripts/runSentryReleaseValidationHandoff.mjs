import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidReleaseNoNetworkSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidReleaseSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getAndroidNoNetworkSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';
import { getSentryReleaseCredentialPlanErrors } from './sentryReleaseCredentialPlanGuard.mjs';
import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';
import { getSentryReleaseValidationHandoffSummaryErrors } from './sentryReleaseValidationHandoffSummaryGuard.mjs';
import { getSentryRnBundleTaskCompatibilitySummaryErrors } from './sentryRnBundleTaskCompatibilitySummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidReleaseSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-summary.txt');
const androidReleaseNoNetworkSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-no-network-summary.txt');
const androidReleaseCreateWalletSmokeSummaryPath = path.join(root, 'local-docs', 'android-create-wallet-smoke-dev-release-summary.txt');
const androidReleaseSignedSmokeApkPath = path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk');
const sentryReleasePrereqSummaryPath = path.join(root, 'local-docs', 'sentry-release-prereq-summary.txt');
const sentryReleaseCredentialPlanPath = path.join(root, 'local-docs', 'sentry-release-credential-plan.txt');
const sentryAndroidWarningSummaryPath = path.join(root, 'local-docs', 'sentry-android-warning-summary.txt');
const sentryRnBundleTaskCompatibilitySummaryPath = path.join(root, 'local-docs', 'sentry-rn-bundle-task-compatibility-summary.txt');
const sentryReleaseValidationHandoffSummaryPath = path.join(root, 'local-docs', 'sentry-release-validation-handoff-summary.txt');

const defaultOptions = {
  dryRun: false,
  preflightOnly: false,
  summaryOnly: false,
  skipAndroidRelease: false,
};

const usage = [
  'Usage: node scripts/runSentryReleaseValidationHandoff.mjs [--dry-run] [--preflight-only] [--summary-only] [--skip-android-release]',
  '',
  'Examples:',
  '  node scripts/runSentryReleaseValidationHandoff.mjs --dry-run',
  '  node scripts/runSentryReleaseValidationHandoff.mjs --preflight-only --skip-android-release',
  '  node scripts/runSentryReleaseValidationHandoff.mjs --summary-only --skip-android-release',
  '  node scripts/runSentryReleaseValidationHandoff.mjs --skip-android-release',
].join('\n');

const quoteArg = arg => {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
};

const getSpawnInvocation = step => {
  if (process.platform !== 'win32') {
    return { command: step.command, args: step.args };
  }

  return { command: 'cmd.exe', args: ['/d', '/s', '/c', step.command, ...step.args] };
};

export const renderSentryReleaseValidationCommand = step => {
  const command = [step.command, ...step.args].map(quoteArg).join(' ');
  const cwd = step.cwd === root ? '.' : path.relative(root, step.cwd).replace(/\\/g, '/');
  const env = step.env ? Object.entries(step.env).map(([key, value]) => `${key}=${value}`).join(' ') : null;
  const requiredEnv = step.requiredEnv ? `requires-env=${step.requiredEnv.join(',')}` : null;

  return [`cwd=${cwd}`, env, requiredEnv, command].filter(Boolean).join(' ');
};

const yarnStep = (label, script, scriptArgsOrExtra = [], maybeExtra = {}) => {
  const scriptArgs = Array.isArray(scriptArgsOrExtra) ? scriptArgsOrExtra : [];
  const extra = Array.isArray(scriptArgsOrExtra) ? maybeExtra : scriptArgsOrExtra;

  return {
    label,
    command: 'corepack',
    args: ['yarn', script, ...scriptArgs],
    cwd: root,
    ...extra,
  };
};

export const getSentryReleaseValidationCommands = (options = defaultOptions) => {
  const resolvedOptions = { ...defaultOptions, ...options };
  const steps = [yarnStep('Validate Sentry properties generator', 'check:sentry-properties-generator')];

  if (!resolvedOptions.skipAndroidRelease) {
    steps.push(
      yarnStep('Refresh Android release create-wallet evidence without upload', 'android:dev:release:create-wallet-verify', {
        env: {
          SENTRY_DISABLE_AUTO_UPLOAD: 'true',
        },
      }),
    );
  }

  steps.push(
    yarnStep('Audit Sentry Android warning surface', 'sentry:android-warning:audit'),
    yarnStep('Validate Sentry Android warning summary', 'sentry:android-warning:check-summary'),
    yarnStep('Audit Sentry RN bundle task compatibility', 'sentry:rn-bundle-task-compat:audit'),
    yarnStep('Validate Sentry RN bundle task compatibility summary', 'sentry:rn-bundle-task-compat:check-summary'),
  );

  if (!resolvedOptions.preflightOnly) {
    steps.push(
      yarnStep('Generate Sentry release properties from local env', 'sentry:release:create-properties', {
        requiredEnv: ['SENTRY_AUTH_TOKEN'],
      }),
    );
  }

  steps.push(
    yarnStep('Audit Sentry release prerequisites', 'sentry:release:prereq-audit'),
    yarnStep('Validate Sentry release prerequisite summary', 'sentry:release:prereq-check-summary'),
    yarnStep('Validate Sentry release credential plan guard', 'check:sentry-release-credential-plan-guard'),
    yarnStep('Plan Sentry release credential evidence', 'sentry:release:credential-plan'),
    yarnStep('Validate Sentry release credential plan', 'sentry:release:credential-plan:check'),
    yarnStep('Validate Sentry release validation handoff summary guard', 'check:sentry-release-validation-handoff-summary-guard'),
    yarnStep('Refresh Sentry release validation handoff summary', 'sentry:release:validation:handoff-summary', [
      ...(resolvedOptions.skipAndroidRelease ? ['--skip-android-release'] : []),
    ]),
    yarnStep('Validate Sentry release validation handoff summary', 'sentry:release:validation:handoff-summary:check'),
  );

  if (!resolvedOptions.preflightOnly) {
    steps.push(yarnStep('Validate aggregate release-services summary artifacts', 'release-services:check-summaries'));
  }

  return steps;
};

export const getSentryReleaseValidationHandoffErrors = options => {
  const resolvedOptions = { ...defaultOptions, ...options };
  const errors = [];

  if (typeof resolvedOptions.preflightOnly !== 'boolean') {
    errors.push('preflightOnly must be a boolean');
  }

  if (typeof resolvedOptions.summaryOnly !== 'boolean') {
    errors.push('summaryOnly must be a boolean');
  }

  if (typeof resolvedOptions.skipAndroidRelease !== 'boolean') {
    errors.push('skipAndroidRelease must be a boolean');
  }

  return errors;
};

const readSummary = summaryPath => {
  if (!existsSync(summaryPath)) {
    return null;
  }

  return readFileSync(summaryPath, 'utf8');
};

const getSummaryLineValue = (summary, label) => {
  const line = summary.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};

const yesNoFromLine = value => (['yes', 'no'].includes(value) ? value : 'no');

const getSummaryErrors = (summaryText, getErrors, missingError) => (summaryText ? getErrors(summaryText) : [missingError]);

export const getSentryReleaseValidationHandoffSummary = ({
  options = defaultOptions,
  generatedAt = new Date().toISOString(),
  sentryAndroidWarningSummaryText,
  sentryRnBundleTaskCompatibilitySummaryText,
  sentryReleaseCredentialPlanText,
  sentryReleasePrereqSummaryText,
}) => {
  const androidWarningErrors = getSummaryErrors(
    sentryAndroidWarningSummaryText,
    getSentryAndroidWarningSummaryErrors,
    'missing Sentry Android warning summary',
  );
  const rnBundleTaskCompatibilityErrors = getSummaryErrors(
    sentryRnBundleTaskCompatibilitySummaryText,
    getSentryRnBundleTaskCompatibilitySummaryErrors,
    'missing Sentry RN bundle task compatibility summary',
  );
  const prereqErrors = getSummaryErrors(
    sentryReleasePrereqSummaryText,
    getSentryReleasePrereqSummaryErrors,
    'missing Sentry release prerequisite summary',
  );
  const credentialPlanErrors = getSummaryErrors(
    sentryReleaseCredentialPlanText,
    getSentryReleaseCredentialPlanErrors,
    'missing Sentry release credential plan',
  );
  const androidWarningSummaryValid = androidWarningErrors.length === 0;
  const rnBundleTaskCompatibilitySummaryValid = rnBundleTaskCompatibilityErrors.length === 0;
  const prereqSummaryValid = prereqErrors.length === 0;
  const credentialPlanValid = credentialPlanErrors.length === 0;
  const releaseSourceMapPrereqs =
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'Release source-map prerequisites') || 'not ready';
  const sentryReactNativeCurrent = yesNoFromLine(getSummaryLineValue(sentryReleasePrereqSummaryText || '', '@sentry/react-native current'));
  const sentryCliCurrent = yesNoFromLine(getSummaryLineValue(sentryReleasePrereqSummaryText || '', '@sentry/cli current'));
  const sentryPackagesCurrent = sentryReactNativeCurrent === 'yes' && sentryCliCurrent === 'yes' ? 'yes' : 'no';
  const sentryAuthTokenAvailable = yesNoFromLine(
    getSummaryLineValue(sentryReleaseCredentialPlanText || '', 'SENTRY_AUTH_TOKEN available in current shell'),
  );
  const sentryPropertiesReady =
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'sentry.properties files present') === 'yes' &&
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'Missing files') === '0' &&
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'Invalid files') === '0'
      ? 'yes'
      : 'no';
  const releaseSmokeEvidenceReady = yesNoFromLine(
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'Sentry release smoke evidence ready'),
  );
  const releaseNoNetworkBlockerReady = yesNoFromLine(
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'Sentry release no-network blocker evidence ready'),
  );
  const releaseNetworkBlockerClassified = yesNoFromLine(
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'Sentry release network blocker classified'),
  );
  const releaseCreateWalletEvidenceReady = yesNoFromLine(
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'Sentry release create-wallet evidence ready'),
  );
  const controlledBlockerOutcome =
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'Android release network blocker outcome') || 'not-applicable';
  const iosMacValidationPrereqsReady = yesNoFromLine(
    getSummaryLineValue(sentryReleasePrereqSummaryText || '', 'iOS macOS validation prerequisites ready'),
  );
  const releaseRuntimeProofState =
    releaseSmokeEvidenceReady === 'yes' && releaseCreateWalletEvidenceReady === 'yes'
      ? 'ready'
      : releaseNoNetworkBlockerReady === 'yes' && releaseNetworkBlockerClassified === 'yes'
        ? 'blocked-by-electrum-certificate-expired'
        : 'not ready';
  const readinessErrors = [];

  if (!androidWarningSummaryValid) {
    readinessErrors.push(`Sentry Android warning summary invalid: ${androidWarningErrors.length} error(s)`);
  }

  if (!rnBundleTaskCompatibilitySummaryValid) {
    readinessErrors.push(`Sentry RN bundle task compatibility summary invalid: ${rnBundleTaskCompatibilityErrors.length} error(s)`);
  }

  if (!prereqSummaryValid) {
    readinessErrors.push(`Sentry release prerequisite summary invalid: ${prereqErrors.length} error(s)`);
  }

  if (!credentialPlanValid) {
    readinessErrors.push(`Sentry release credential plan invalid: ${credentialPlanErrors.length} error(s)`);
  }

  if (sentryAuthTokenAvailable !== 'yes') {
    readinessErrors.push('SENTRY_AUTH_TOKEN is not available in the current shell or CI secret store.');
  }

  if (sentryPropertiesReady !== 'yes') {
    readinessErrors.push('Sentry properties files are not ready.');
  }

  if (releaseRuntimeProofState === 'blocked-by-electrum-certificate-expired') {
    readinessErrors.push('Full Android release runtime proof is blocked by the controlled dev/testnet Electrum certificate issue.');
  } else if (releaseRuntimeProofState !== 'ready') {
    readinessErrors.push('Full Android release smoke and release create-wallet evidence must pass before Sentry upload validation.');
  }

  if (iosMacValidationPrereqsReady !== 'yes') {
    readinessErrors.push('iOS archive/simulator validation is not ready on this Windows host.');
  }

  const handoffOutcome = readinessErrors.length === 0 ? 'ready-for-credentialed-upload-test' : 'blocked';
  const blockerType =
    handoffOutcome === 'ready-for-credentialed-upload-test'
      ? 'none'
      : !androidWarningSummaryValid || !rnBundleTaskCompatibilitySummaryValid || !prereqSummaryValid || !credentialPlanValid
        ? 'summary-invalid'
        : sentryAuthTokenAvailable !== 'yes' || sentryPropertiesReady !== 'yes'
          ? 'missing-sentry-credentials'
          : releaseRuntimeProofState === 'blocked-by-electrum-certificate-expired'
            ? 'blocked-by-electrum-certificate-expired'
            : iosMacValidationPrereqsReady !== 'yes'
              ? 'ios-validation-not-ready'
              : 'release-evidence-not-ready';
  const requiredAction =
    handoffOutcome === 'ready-for-credentialed-upload-test'
      ? 'run credentialed Android and iOS source-map/dSYM release validation and do not claim Sentry release upload validation until the upload proof passes.'
      : 'provide SENTRY_AUTH_TOKEN, generate local-only sentry.properties files, renew the dev/testnet Electrum TLS certificate, refresh full Android release smoke/create-wallet evidence, refresh iOS pods on macOS/Xcode, and do not claim Sentry release upload validation until credentialed release validation passes.';

  return [
    'Sentry release validation handoff summary',
    `Generated at: ${generatedAt}`,
    `Android release evidence refresh skipped: ${options.skipAndroidRelease ? 'yes' : 'no'}`,
    `Android warning summary valid: ${androidWarningSummaryValid ? 'yes' : 'no'}`,
    `RN bundle task compatibility summary valid: ${rnBundleTaskCompatibilitySummaryValid ? 'yes' : 'no'}`,
    `Release prerequisite summary valid: ${prereqSummaryValid ? 'yes' : 'no'}`,
    `Credential plan valid: ${credentialPlanValid ? 'yes' : 'no'}`,
    `Release source-map prerequisites: ${releaseSourceMapPrereqs}`,
    `Sentry packages current: ${sentryPackagesCurrent}`,
    `SENTRY_AUTH_TOKEN available: ${sentryAuthTokenAvailable}`,
    `Sentry properties files ready: ${sentryPropertiesReady}`,
    'Sentry release upload validation: not claimed',
    `Sentry release smoke evidence ready: ${releaseSmokeEvidenceReady}`,
    `Sentry release no-network blocker evidence ready: ${releaseNoNetworkBlockerReady}`,
    `Sentry release network blocker classified: ${releaseNetworkBlockerClassified}`,
    `Sentry release create-wallet evidence ready: ${releaseCreateWalletEvidenceReady}`,
    `Controlled release blocker outcome: ${controlledBlockerOutcome}`,
    `Sentry release runtime proof state: ${releaseRuntimeProofState}`,
    `iOS macOS validation prerequisites ready: ${iosMacValidationPrereqsReady}`,
    'iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming Sentry release delivery.',
    `Handoff outcome: ${handoffOutcome}`,
    `Handoff blocker type: ${blockerType}`,
    `Readiness errors: ${readinessErrors.length}`,
    ...readinessErrors.map(error => `- ${error}`),
    'Secret values printed: no',
    `Required action: ${requiredAction}`,
    '',
  ].join('\n');
};

const buildSummaryFromCurrentArtifacts = options =>
  getSentryReleaseValidationHandoffSummary({
    options,
    sentryAndroidWarningSummaryText: readSummary(sentryAndroidWarningSummaryPath),
    sentryRnBundleTaskCompatibilitySummaryText: readSummary(sentryRnBundleTaskCompatibilitySummaryPath),
    sentryReleaseCredentialPlanText: readSummary(sentryReleaseCredentialPlanPath),
    sentryReleasePrereqSummaryText: readSummary(sentryReleasePrereqSummaryPath),
  });

const writeSummaryArtifact = summary => {
  const errors = getSentryReleaseValidationHandoffSummaryErrors(summary);

  if (errors.length > 0) {
    console.error('Sentry release validation handoff summary is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  mkdirSync(path.dirname(sentryReleaseValidationHandoffSummaryPath), { recursive: true });
  writeFileSync(sentryReleaseValidationHandoffSummaryPath, summary);
  console.log(summary.trim());
  console.log(`Sentry release validation handoff summary written to ${path.relative(root, sentryReleaseValidationHandoffSummaryPath)}`);
  return 0;
};

export const getSentryReleaseValidationReadinessErrors = ({
  androidReleaseCreateWalletSmokeSummaryText,
  androidReleaseNoNetworkSmokeSummaryText,
  androidReleaseSmokeSummaryText,
  requireReadyPrereqs = true,
  sentryReleasePrereqSummaryText,
  createWalletEvidenceOptions = {
    expectedApkPath: androidReleaseSignedSmokeApkPath,
    expectedArtifactBase: 'android-create-wallet-smoke-dev-release',
  },
  smokeEvidenceOptions = getAndroidReleaseSmokeEvidenceOptions(root),
  noNetworkSmokeEvidenceOptions = getAndroidReleaseNoNetworkSmokeEvidenceOptions(root),
}) => {
  const errors = [];
  const releaseSmokeErrors = [];
  const createWalletErrors = [];
  const noNetworkErrors = androidReleaseNoNetworkSmokeSummaryText
    ? getAndroidNoNetworkSmokeSummaryErrors(androidReleaseNoNetworkSmokeSummaryText, noNetworkSmokeEvidenceOptions)
    : ['Android release no-network smoke summary is missing'];
  const noNetworkBlockerEvidenceReady = noNetworkErrors.length === 0;

  if (!sentryReleasePrereqSummaryText) {
    errors.push('Sentry release prerequisite summary is missing; run sentry:release:prereq-audit first');
  } else {
    getSentryReleasePrereqSummaryErrors(sentryReleasePrereqSummaryText).forEach(error => {
      errors.push(`Sentry release prerequisite summary is invalid: ${error}`);
    });

    if (
      requireReadyPrereqs &&
      getSummaryLineValue(sentryReleasePrereqSummaryText, 'Release source-map prerequisites') !== 'ready'
    ) {
      errors.push(
        'Sentry release prerequisite summary is not ready; run with --preflight-only or provide SENTRY_AUTH_TOKEN and generated sentry.properties files before claiming release upload validation',
      );
    }
  }

  if (!androidReleaseSmokeSummaryText) {
    errors.push('Android release smoke summary is missing; run android:dev:release:smoke:embedded first');
  } else {
    releaseSmokeErrors.push(...getAndroidEmbeddedSmokeSummaryErrors(androidReleaseSmokeSummaryText, smokeEvidenceOptions));
  }

  if (!androidReleaseCreateWalletSmokeSummaryText) {
    errors.push('Android release create-wallet smoke summary is missing; run android:dev:release:create-wallet-smoke:embedded first');
  } else {
    createWalletErrors.push(...getAndroidCreateWalletSmokeSummaryErrors(
      androidReleaseCreateWalletSmokeSummaryText,
      createWalletEvidenceOptions,
    ));
  }

  if (releaseSmokeErrors.length > 0 && !(requireReadyPrereqs === false && noNetworkBlockerEvidenceReady)) {
    releaseSmokeErrors.forEach(error => errors.push(`Android release smoke summary is invalid: ${error}`));
  }

  if (createWalletErrors.length > 0 && !(requireReadyPrereqs === false && noNetworkBlockerEvidenceReady)) {
    createWalletErrors.forEach(error => errors.push(`Android release create-wallet smoke summary is invalid: ${error}`));
  }

  if (requireReadyPrereqs === false && releaseSmokeErrors.length > 0 && !noNetworkBlockerEvidenceReady) {
    noNetworkErrors.forEach(error => errors.push(`Android release no-network smoke summary is invalid: ${error}`));
  }

  return errors;
};

const parseArgs = argv => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--preflight-only') {
      options.preflightOnly = true;
    } else if (arg === '--summary-only') {
      options.summaryOnly = true;
    } else if (arg === '--skip-android-release') {
      options.skipAndroidRelease = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      options.unknown = arg;
    }
  }

  return options;
};

const runStep = step => {
  console.log(`\n${step.label}`);
  console.log(renderSentryReleaseValidationCommand(step));

  const missingEnv = (step.requiredEnv || []).filter(key => !process.env[key]);

  if (missingEnv.length > 0) {
    console.error(`Missing required environment variable(s): ${missingEnv.join(', ')}`);
    return 1;
  }

  const invocation = getSpawnInvocation(step);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: step.cwd,
    env: {
      ...process.env,
      ...(step.env || {}),
    },
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usage);
    return 0;
  }

  if (options.unknown) {
    console.error(`Unknown argument: ${options.unknown}`);
    console.error(usage);
    return 1;
  }

  const errors = getSentryReleaseValidationHandoffErrors(options);

  if (errors.length > 0) {
    errors.forEach(error => console.error(error));
    return 1;
  }

  if (options.summaryOnly) {
    return writeSummaryArtifact(buildSummaryFromCurrentArtifacts(options));
  }

  const commands = getSentryReleaseValidationCommands(options);

  if (options.dryRun) {
    console.log('Sentry release validation handoff dry run');
    console.log(`Credentialed upload mode: ${options.preflightOnly ? 'preflight-only' : 'full handoff'}`);
    console.log(`Android release evidence refresh: ${options.skipAndroidRelease ? 'skipped' : 'included'}`);
    console.log('Secret values are not rendered; SENTRY_AUTH_TOKEN is only reported as a required env name.');
    commands.forEach((step, index) => {
      console.log(`${index + 1}. ${step.label}`);
      console.log(`   ${renderSentryReleaseValidationCommand(step)}`);
    });
    console.log('Dry run complete. Run without --dry-run after SENTRY_AUTH_TOKEN is available.');
    return 0;
  }

  for (const step of commands) {
    const status = runStep(step);

    if (status !== 0) {
      return status;
    }
  }

  const readinessErrors = getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: readSummary(androidReleaseCreateWalletSmokeSummaryPath),
    androidReleaseNoNetworkSmokeSummaryText: readSummary(androidReleaseNoNetworkSmokeSummaryPath),
    androidReleaseSmokeSummaryText: readSummary(androidReleaseSmokeSummaryPath),
    requireReadyPrereqs: !options.preflightOnly,
    sentryReleasePrereqSummaryText: readSummary(sentryReleasePrereqSummaryPath),
  });

  if (readinessErrors.length > 0) {
    const summaryStatus = writeSummaryArtifact(buildSummaryFromCurrentArtifacts(options));

    if (summaryStatus !== 0) {
      return summaryStatus;
    }

    console.error('\nSentry release validation handoff prerequisites are blocked:');
    readinessErrors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  const summaryStatus = writeSummaryArtifact(buildSummaryFromCurrentArtifacts(options));

  if (summaryStatus !== 0) {
    return summaryStatus;
  }

  if (options.preflightOnly) {
    console.log(
      '\nSentry release validation preflight completed. Credentialed upload remains unclaimed until SENTRY_AUTH_TOKEN and sentry.properties files are present.',
    );
  } else {
    console.log('\nSentry release validation handoff completed.');
  }

  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
