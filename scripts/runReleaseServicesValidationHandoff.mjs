import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getReleaseServicesSummaryArtifactErrors } from './checkReleaseServicesSummaryArtifacts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const defaultOptions = {
  dryRun: false,
  skipAndroidRelease: false,
};

const usage = [
  'Usage: node scripts/runReleaseServicesValidationHandoff.mjs [--dry-run] [--skip-android-release]',
  '',
  'Examples:',
  '  node scripts/runReleaseServicesValidationHandoff.mjs --dry-run',
  '  node scripts/runReleaseServicesValidationHandoff.mjs',
].join('\n');

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
  const steps = [];

  if (!options.skipAndroidRelease) {
    steps.push(
      yarnStep('Refresh Android release APK evidence', 'android:dev:release:verify-local', [], {
        env: {
          SENTRY_DISABLE_AUTO_UPLOAD: 'true',
        },
      }),
      yarnStep('Run Android release APK embedded smoke', 'android:dev:release:smoke:embedded'),
      yarnStep('Validate Android release smoke summary', 'android:dev:release:check-smoke-summary'),
    );
  }

  steps.push(
    yarnStep('Validate Sentry properties generator', 'check:sentry-properties-generator'),
    yarnStep('Audit Sentry Android warning surface', 'sentry:android-warning:audit'),
    yarnStep('Validate Sentry Android warning summary', 'sentry:android-warning:check-summary'),
    yarnStep('Audit Sentry release prerequisites', 'sentry:release:prereq-audit'),
    yarnStep('Validate Sentry release prerequisite summary', 'sentry:release:prereq-check-summary'),
    yarnStep('Audit Firebase release-services surface', 'firebase:release-services:audit'),
    yarnStep('Validate Firebase release-services summary', 'firebase:release-services:check-summary'),
    yarnStep('Audit CodePush release path', 'codepush:release:path-audit'),
    yarnStep('Validate CodePush release path summary', 'codepush:release:path-check-summary'),
    yarnStep('Audit CodePush migration readiness', 'codepush:migration:readiness-audit'),
    yarnStep('Validate CodePush migration readiness summary', 'codepush:migration:readiness-check-summary'),
    yarnStep('Audit CodePush removal readiness', 'codepush:removal-readiness:audit'),
    yarnStep('Validate CodePush removal readiness summary', 'codepush:removal-readiness:check-summary'),
    yarnStep('Audit push notification bridge readiness', 'push-notification:bridge-audit'),
    yarnStep('Validate push notification bridge summary', 'push-notification:bridge-check-summary'),
    yarnStep('Audit static iOS release readiness', 'ios:release:readiness:audit'),
    yarnStep('Validate static iOS release readiness summary', 'ios:release:readiness:check-summary'),
    yarnStep('Audit iOS macOS validation prerequisites', 'ios:mac-validation-prereq:audit'),
    yarnStep('Validate iOS macOS validation prerequisite summary', 'ios:mac-validation-prereq:check-summary'),
    yarnStep('Validate iOS macOS validation handoff guard', 'check:ios-mac-validation-handoff-guard'),
    yarnStep('Render all-scheme iOS macOS validation handoff dry run', 'ios:mac-validation:handoff:dry-run', ['--all-schemes']),
    yarnStep('Validate aggregate release-services summary artifacts', 'release-services:check-summaries'),
  );

  return steps;
};

export const getReleaseServicesValidationHandoffErrors = options => {
  const errors = [];

  if (typeof options.skipAndroidRelease !== 'boolean') {
    errors.push('skipAndroidRelease must be a boolean');
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

  const errors = getReleaseServicesValidationHandoffErrors(options);

  if (errors.length > 0) {
    errors.forEach(error => console.error(error));
    return 1;
  }

  const commands = getReleaseServicesValidationCommands(options);

  if (options.dryRun) {
    console.log('Release-services validation handoff dry run');
    console.log(`Android release evidence refresh: ${options.skipAndroidRelease ? 'skipped' : 'included'}`);
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

  console.log('\nRelease-services validation handoff completed.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
