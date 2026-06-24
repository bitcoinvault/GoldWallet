import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidReleaseNoNetworkSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidReleaseSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getAndroidNoNetworkSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidReleaseSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-summary.txt');
const androidReleaseNoNetworkSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-no-network-summary.txt');
const androidReleaseCreateWalletSmokeSummaryPath = path.join(root, 'local-docs', 'android-create-wallet-smoke-dev-release-summary.txt');
const androidReleaseSignedSmokeApkPath = path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk');
const sentryReleasePrereqSummaryPath = path.join(root, 'local-docs', 'sentry-release-prereq-summary.txt');

const defaultOptions = {
  dryRun: false,
  preflightOnly: false,
  skipAndroidRelease: false,
};

const usage = [
  'Usage: node scripts/runSentryReleaseValidationHandoff.mjs [--dry-run] [--preflight-only] [--skip-android-release]',
  '',
  'Examples:',
  '  node scripts/runSentryReleaseValidationHandoff.mjs --dry-run',
  '  node scripts/runSentryReleaseValidationHandoff.mjs --preflight-only --skip-android-release',
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

const yarnStep = (label, script, extra = {}) => ({
  label,
  command: 'corepack',
  args: ['yarn', script],
  cwd: root,
  ...extra,
});

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
    console.error('\nSentry release validation handoff prerequisites are blocked:');
    readinessErrors.forEach(error => console.error(`- ${error}`));
    return 1;
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
