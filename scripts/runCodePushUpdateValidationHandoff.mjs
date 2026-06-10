import { existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidReleaseSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const releasePathSummaryPath = path.join(root, 'local-docs', 'codepush-release-path-summary.txt');
const androidReleaseSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-summary.txt');

const defaultOptions = {
  dryRun: false,
  skipAndroidRelease: false,
};

const usage = [
  'Usage: node scripts/runCodePushUpdateValidationHandoff.mjs [--dry-run] [--skip-android-release]',
  '',
  'Examples:',
  '  node scripts/runCodePushUpdateValidationHandoff.mjs --dry-run',
  '  node scripts/runCodePushUpdateValidationHandoff.mjs --skip-android-release',
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

export const renderCodePushUpdateValidationCommand = step => {
  const command = [step.command, ...step.args].map(quoteArg).join(' ');
  const cwd = step.cwd === root ? '.' : path.relative(root, step.cwd).replace(/\\/g, '/');
  const env = step.env ? Object.entries(step.env).map(([key, value]) => `${key}=${value}`).join(' ') : null;

  return [`cwd=${cwd}`, env, command].filter(Boolean).join(' ');
};

const yarnStep = (label, script, extra = {}) => ({
  label,
  command: 'corepack',
  args: ['yarn', script],
  cwd: root,
  ...extra,
});

export const getCodePushUpdateValidationCommands = (options = defaultOptions) => {
  const steps = [];

  if (!options.skipAndroidRelease) {
    steps.push(
      yarnStep('Refresh Android release APK evidence without upload', 'android:dev:release:verify-local', {
        env: {
          SENTRY_DISABLE_AUTO_UPLOAD: 'true',
        },
      }),
      yarnStep('Run Android release APK embedded smoke', 'android:dev:release:smoke:embedded'),
      yarnStep('Validate Android release smoke summary', 'android:dev:release:check-smoke-summary'),
    );
  }

  steps.push(
    yarnStep('Audit CodePush release path', 'codepush:release:path-audit'),
    yarnStep('Validate CodePush release path summary', 'codepush:release:path-check-summary'),
    yarnStep('Audit CodePush migration readiness', 'codepush:migration:readiness-audit'),
    yarnStep('Validate CodePush migration readiness summary', 'codepush:migration:readiness-check-summary'),
    yarnStep('Audit CodePush removal readiness', 'codepush:removal-readiness:audit'),
    yarnStep('Validate CodePush removal readiness summary', 'codepush:removal-readiness:check-summary'),
    yarnStep('Validate aggregate release-services summary artifacts', 'release-services:check-summaries'),
  );

  return steps;
};

export const getCodePushUpdateValidationHandoffErrors = options => {
  const errors = [];

  if (typeof options.skipAndroidRelease !== 'boolean') {
    errors.push('skipAndroidRelease must be a boolean');
  }

  return errors;
};

export const getCodePushUpdateValidationReadinessErrors = ({
  releasePathSummaryText,
  androidReleaseSmokeSummaryText,
  smokeEvidenceOptions = getAndroidReleaseSmokeEvidenceOptions(root),
}) => {
  const errors = [];

  if (!releasePathSummaryText) {
    errors.push('CodePush release path summary is missing; run codepush:release:path-audit first');
  } else {
    if (!releasePathSummaryText.includes('Secret values printed: no')) {
      errors.push('CodePush handoff summary must prove that deployment-key values were not printed');
    }

    if (!releasePathSummaryText.includes('Release path ready for update validation: yes')) {
      errors.push(
        'CodePush release path is not ready for update validation; provide non-empty blocked deployment keys and confirm the beta strategy before claiming update validation',
      );
    }

    if (!releasePathSummaryText.includes('CodePush update validation: not claimed')) {
      errors.push('CodePush handoff must keep runtime update validation unclaimed until a real OTA delivery test runs');
    }

    if (!releasePathSummaryText.includes('CodePush migration required: yes')) {
      errors.push('CodePush handoff must keep the App Center retirement migration requirement visible');
    }
  }

  if (!androidReleaseSmokeSummaryText) {
    errors.push('Android release smoke summary is missing; run android:dev:release:smoke:embedded first');
  } else {
    const smokeErrors = getAndroidEmbeddedSmokeSummaryErrors(androidReleaseSmokeSummaryText, smokeEvidenceOptions);

    smokeErrors.forEach(error => errors.push(`Android release smoke summary is invalid: ${error}`));
  }

  return errors;
};

const readSummary = summaryPath => {
  if (!existsSync(summaryPath)) {
    return null;
  }

  return readFileSync(summaryPath, 'utf8');
};

const parseArgs = argv => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--skip-android-release') {
      options.skipAndroidRelease = true;
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
  console.log(renderCodePushUpdateValidationCommand(step));

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

  const errors = getCodePushUpdateValidationHandoffErrors(options);

  if (errors.length > 0) {
    errors.forEach(error => console.error(error));
    return 1;
  }

  const commands = getCodePushUpdateValidationCommands(options);

  if (options.dryRun) {
    console.log('CodePush update validation handoff dry run');
    console.log(`Android release evidence refresh: ${options.skipAndroidRelease ? 'skipped' : 'included'}`);
    console.log('Deployment-key values are never rendered; readiness is read from env-file audits only.');
    commands.forEach((step, index) => {
      console.log(`${index + 1}. ${step.label}`);
      console.log(`   ${renderCodePushUpdateValidationCommand(step)}`);
    });
    console.log('Dry run complete. Run without --dry-run after deployment keys and beta strategy are available.');
    return 0;
  }

  for (const step of commands) {
    const status = runStep(step);

    if (status !== 0) {
      return status;
    }
  }

  const readinessErrors = getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readSummary(releasePathSummaryPath),
    androidReleaseSmokeSummaryText: readSummary(androidReleaseSmokeSummaryPath),
  });

  if (readinessErrors.length > 0) {
    console.error('\nCodePush update validation handoff is blocked:');
    readinessErrors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  console.log('\nCodePush update validation handoff is ready for a real OTA delivery test.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
