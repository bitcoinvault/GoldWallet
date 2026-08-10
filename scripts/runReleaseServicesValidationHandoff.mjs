import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  getReleaseServicesSummaryArtifactErrors,
  getReleaseServicesSummaryArtifactState,
} from './checkReleaseServicesSummaryArtifacts.mjs';
import { getAndroidImportWalletSmokeStepStatus } from './checkAndroidImportWalletSmokeSummary.mjs';
import { getSentryAndroidReleaseEvidenceConfig } from './sentryAndroidReleaseEvidenceVariant.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const defaultOptions = {
  dryRun: false,
  skipAndroidRelease: false,
  codePushDecision: 'remove',
  codePushReplacementTarget: 'none',
  codePushBetaStrategy: 'beta-has-no-ota',
};

const usage = [
  'Usage: node scripts/runReleaseServicesValidationHandoff.mjs [--dry-run] [--skip-android-release] [--codepush-decision pending|remove|replace|temporary-legacy] [--codepush-replacement-target <name>] [--codepush-beta-strategy unconfirmed|beta-has-ota-keys|beta-has-no-ota|beta-out-of-scope]',
  '',
  'Examples:',
  '  node scripts/runReleaseServicesValidationHandoff.mjs --dry-run',
  '  node scripts/runReleaseServicesValidationHandoff.mjs --codepush-decision remove --codepush-beta-strategy beta-has-no-ota',
  '  node scripts/runReleaseServicesValidationHandoff.mjs',
].join('\n');

const codePushDecisions = new Set(['pending', 'remove', 'replace', 'temporary-legacy']);
const codePushBetaStrategies = new Set(['unconfirmed', 'beta-has-ota-keys', 'beta-has-no-ota', 'beta-out-of-scope']);

const getSpawnInvocation = step => {
  if (process.platform !== 'win32') {
    return { command: step.command, args: step.args };
  }

  return { command: 'cmd.exe', args: ['/d', '/s', '/c', step.command, ...step.args] };
};

const quoteArg = arg => {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
};

export const renderReleaseServicesValidationCommand = step => {
  const command = [step.command, ...step.args].map(quoteArg).join(' ');
  const cwd = step.cwd === root ? '.' : path.relative(root, step.cwd).replace(/\\/g, '/');
  const env = step.env ? Object.entries(step.env).map(([key, value]) => `${key}=${value}`).join(' ') : null;

  return [`cwd=${cwd}`, env, command].filter(Boolean).join(' ');
};

const yarnStep = (label, script, scriptArgs = [], extra = {}) => ({
  label,
  command: 'corepack',
  args: ['yarn', script, ...scriptArgs],
  cwd: root,
  ...extra,
});

export const getReleaseServicesValidationCommands = (options = defaultOptions) => {
  options = { ...defaultOptions, ...options };
  const steps = [];
  const androidReleaseEvidenceConfig = getSentryAndroidReleaseEvidenceConfig(root);
  const controlledImportEvidence = {
    variant: androidReleaseEvidenceConfig.variant,
    summaryPath: androidReleaseEvidenceConfig.importWalletSmokeSummaryPath,
    evidenceOptions: {
      expectedActivityName: androidReleaseEvidenceConfig.activityName,
      expectedApkPath: androidReleaseEvidenceConfig.signedSmokeApkPath,
      expectedArtifactBase: androidReleaseEvidenceConfig.importWalletArtifactBase,
      expectedPackageName: androidReleaseEvidenceConfig.packageName,
    },
  };
  const codePushDecisionArgs = ['--decision', options.codePushDecision || defaultOptions.codePushDecision];

  if (options.codePushReplacementTarget && options.codePushReplacementTarget !== 'none') {
    codePushDecisionArgs.push('--replacement-target', options.codePushReplacementTarget);
  }

  codePushDecisionArgs.push('--beta-strategy', options.codePushBetaStrategy || defaultOptions.codePushBetaStrategy);

  if (!options.skipAndroidRelease) {
    steps.push(
      yarnStep(
        `Refresh ${androidReleaseEvidenceConfig.variant}Release create-wallet evidence`,
        `android:${androidReleaseEvidenceConfig.variant}:release:create-wallet-verify`,
        [],
        {
          env: {
            SENTRY_DISABLE_AUTO_UPLOAD: 'true',
          },
        },
      ),
      yarnStep(
        `Refresh ${androidReleaseEvidenceConfig.variant}Release import-wallet evidence`,
        `android:${androidReleaseEvidenceConfig.variant}:release:import-wallet-smoke:embedded`,
        [],
        {
          controlledImportEvidence,
          startsControlledImportEvidence: true,
        },
      ),
      yarnStep(
        `Validate ${androidReleaseEvidenceConfig.variant}Release import-wallet evidence`,
        `android:${androidReleaseEvidenceConfig.variant}:release:check-import-wallet-smoke-summary`,
        [],
        { controlledImportEvidence },
      ),
    );
  }

  steps.push(
    yarnStep('Validate Sentry properties generator', 'check:sentry-properties-generator'),
    yarnStep('Audit Sentry Android warning surface', 'sentry:android-warning:audit'),
    yarnStep('Validate Sentry Android warning summary', 'sentry:android-warning:check-summary'),
    yarnStep('Audit Sentry RN bundle task compatibility', 'sentry:rn-bundle-task-compat:audit'),
    yarnStep('Validate Sentry RN bundle task compatibility summary', 'sentry:rn-bundle-task-compat:check-summary'),
    yarnStep('Audit Sentry release prerequisites', 'sentry:release:prereq-audit'),
    yarnStep('Validate Sentry release prerequisite summary', 'sentry:release:prereq-check-summary'),
    yarnStep('Plan Sentry release credential evidence', 'sentry:release:credential-plan'),
    yarnStep('Validate Sentry release credential plan', 'sentry:release:credential-plan:check'),
    yarnStep('Validate Sentry release validation handoff summary guard', 'check:sentry-release-validation-handoff-summary-guard'),
    yarnStep('Refresh Sentry release validation handoff summary', 'sentry:release:validation:handoff-summary', [
      '--skip-android-release',
    ]),
    yarnStep('Validate Sentry release validation handoff summary', 'sentry:release:validation:handoff-summary:check'),
    yarnStep('Audit Firebase release-services surface', 'firebase:release-services:audit'),
    yarnStep('Validate Firebase release-services summary', 'firebase:release-services:check-summary'),
    yarnStep('Validate CodePush update-validation handoff guard', 'check:codepush-update-validation-handoff-guard'),
    yarnStep('Audit CodePush release path', 'codepush:release:path-audit'),
    yarnStep('Validate CodePush release path summary', 'codepush:release:path-check-summary'),
    yarnStep('Audit CodePush migration readiness', 'codepush:migration:readiness-audit'),
    yarnStep('Validate CodePush migration readiness summary', 'codepush:migration:readiness-check-summary'),
    yarnStep('Audit CodePush removal readiness', 'codepush:removal-readiness:audit'),
    yarnStep('Validate CodePush removal readiness summary', 'codepush:removal-readiness:check-summary'),
    yarnStep('Validate CodePush env cleanup readiness summary guard', 'check:codepush-env-cleanup-summary-guard'),
    yarnStep('Audit CodePush env cleanup readiness', 'codepush:env-cleanup:audit'),
    yarnStep('Validate CodePush env cleanup readiness summary', 'codepush:env-cleanup:check-summary'),
    yarnStep('Refresh CodePush decision handoff', 'codepush:decision:handoff', codePushDecisionArgs),
    yarnStep('Validate CodePush decision handoff summary guard', 'check:codepush-decision-handoff-summary-guard'),
    yarnStep('Validate CodePush update-validation handoff summary guard', 'check:codepush-update-validation-handoff-summary-guard'),
    yarnStep('Refresh CodePush update-validation handoff summary', 'codepush:update:validation:handoff-summary', [
      '--skip-android-release',
    ]),
    yarnStep('Validate CodePush update-validation handoff summary', 'codepush:update:validation:handoff-summary:check'),
    yarnStep('Audit push notification bridge readiness', 'push-notification:bridge-audit'),
    yarnStep('Validate push notification bridge summary', 'push-notification:bridge-check-summary'),
    yarnStep('Audit static iOS release readiness', 'ios:release:readiness:audit'),
    yarnStep('Validate static iOS release readiness summary', 'ios:release:readiness:check-summary'),
    yarnStep('Audit iOS macOS validation prerequisites', 'ios:mac-validation-prereq:audit'),
    yarnStep('Validate iOS macOS validation prerequisite summary', 'ios:mac-validation-prereq:check-summary'),
    yarnStep('Validate iOS Podfile refresh plan guard', 'check:ios-podfile-refresh-plan-guard'),
    yarnStep('Refresh iOS Podfile refresh plan', 'ios:podfile-refresh:plan'),
    yarnStep('Validate iOS Podfile refresh plan', 'ios:podfile-refresh:check-plan'),
    yarnStep('Validate iOS validation handoff summary guard', 'check:ios-validation-handoff-summary-guard'),
    yarnStep('Refresh iOS validation handoff summary', 'ios:validation:handoff-summary'),
    yarnStep('Validate iOS validation handoff summary artifact', 'ios:validation:handoff-summary:check'),
    yarnStep('Validate iOS macOS validation handoff guard', 'check:ios-mac-validation-handoff-guard'),
    yarnStep('Render all-scheme iOS macOS validation handoff dry run', 'ios:mac-validation:handoff:dry-run', ['--all-schemes']),
    yarnStep('Validate aggregate release-services summary artifacts', 'release-services:check-summaries'),
  );

  return steps;
};

export const getReleaseServicesValidationHandoffErrors = options => {
  options = { ...defaultOptions, ...options };
  const errors = [];

  if (typeof options.skipAndroidRelease !== 'boolean') {
    errors.push('skipAndroidRelease must be a boolean');
  }

  if (!codePushDecisions.has(options.codePushDecision)) {
    errors.push(`codePushDecision must be one of ${[...codePushDecisions].join(', ')}`);
  }

  if (!codePushBetaStrategies.has(options.codePushBetaStrategy)) {
    errors.push(`codePushBetaStrategy must be one of ${[...codePushBetaStrategies].join(', ')}`);
  }

  if (options.codePushDecision === 'replace' && (!options.codePushReplacementTarget || options.codePushReplacementTarget === 'none')) {
    errors.push('codePushReplacementTarget is required when codePushDecision is replace');
  }

  if (options.codePushDecision !== 'replace' && options.codePushReplacementTarget !== 'none') {
    errors.push('codePushReplacementTarget must be none unless codePushDecision is replace');
  }

  if (options.codePushReplacementTarget !== 'none' && /CODEPUSH_DEPLOYMENT_KEY|auth\.token|=/.test(options.codePushReplacementTarget)) {
    errors.push('codePushReplacementTarget must not contain secret-looking assignments');
  }

  return errors;
};

export const getReleaseServicesValidationReadinessErrors = ({ rootPath = root } = {}) =>
  getReleaseServicesSummaryArtifactErrors({ rootPath }).map(error => `Release-services summary artifact is invalid: ${error}`);

const parseArgs = argv => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--skip-android-release') {
      options.skipAndroidRelease = true;
    } else if (arg === '--codepush-decision') {
      options.codePushDecision = argv[++index] || '';
    } else if (arg === '--codepush-replacement-target') {
      options.codePushReplacementTarget = argv[++index] || '';
    } else if (arg === '--codepush-beta-strategy') {
      options.codePushBetaStrategy = argv[++index] || '';
    } else if (arg === '--') {
      continue;
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
  console.log(renderReleaseServicesValidationCommand(step));

  if (step.startsControlledImportEvidence) {
    step.controlledImportEvidence.minimumGeneratedAtMs = Date.now();
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

  const status = result.status ?? 1;

  if (status !== 0 && step.controlledImportEvidence) {
    const summaryPath = step.controlledImportEvidence.summaryPath;
    const deferredStatus = getAndroidImportWalletSmokeStepStatus({
      status,
      summary: existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '',
      evidenceVariant: step.controlledImportEvidence.variant,
      evidenceOptions: {
        ...step.controlledImportEvidence.evidenceOptions,
        minimumGeneratedAtMs: step.controlledImportEvidence.minimumGeneratedAtMs,
      },
    });

    if (deferredStatus === 0) {
      console.log(
        'Import-wallet smoke reported the controlled no-network UI; deferring final acceptance to the classified Electrum blocker gates.',
      );
    }

    return deferredStatus;
  }

  return status;
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

  const errors = getReleaseServicesValidationHandoffErrors(options);

  if (errors.length > 0) {
    errors.forEach(error => console.error(error));
    return 1;
  }

  const commands = getReleaseServicesValidationCommands(options);

  if (options.dryRun) {
    console.log('Release-services validation handoff dry run');
    console.log(`Android release evidence refresh: ${options.skipAndroidRelease ? 'skipped' : 'included'}`);
    console.log(`CodePush decision: ${options.codePushDecision}`);
    console.log(`CodePush replacement target: ${options.codePushReplacementTarget}`);
    console.log(`CodePush beta strategy: ${options.codePushBetaStrategy}`);
    commands.forEach((step, index) => {
      console.log(`${index + 1}. ${step.label}`);
      console.log(`   ${renderReleaseServicesValidationCommand(step)}`);
    });
    console.log('Dry run complete. Run without --dry-run to execute the release-services validation sequence.');
    return 0;
  }

  for (const step of commands) {
    const status = runStep(step);

    if (status !== 0) {
      return status;
    }
  }

  const readinessErrors = getReleaseServicesValidationReadinessErrors();

  if (readinessErrors.length > 0) {
    console.error('\nRelease-services validation handoff artifacts are blocked:');
    readinessErrors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  const releaseServicesState = getReleaseServicesSummaryArtifactState();

  if (releaseServicesState.status === 'blocked-by-electrum-certificate-expired') {
    console.log(
      '\nRelease-services validation handoff completed with controlled Electrum certificate blocker evidence. Full release runtime proof remains unclaimed until the dev/testnet Electrum TLS certificate is fixed.',
    );
    return 0;
  }

  console.log('\nRelease-services validation handoff completed.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
