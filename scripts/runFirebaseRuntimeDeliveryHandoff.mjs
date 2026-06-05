import { existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const firebaseSummaryPath = path.join(root, 'local-docs', 'firebase-release-services-summary.txt');
const pushBridgeSummaryPath = path.join(root, 'local-docs', 'push-notification-bridge-summary.txt');

const defaultOptions = {
  dryRun: false,
  skipAndroidRelease: false,
};

const usage = [
  'Usage: node scripts/runFirebaseRuntimeDeliveryHandoff.mjs [--dry-run] [--skip-android-release]',
  '',
  'Examples:',
  '  node scripts/runFirebaseRuntimeDeliveryHandoff.mjs --dry-run',
  '  node scripts/runFirebaseRuntimeDeliveryHandoff.mjs --skip-android-release',
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

export const renderFirebaseRuntimeDeliveryCommand = step => {
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

export const getFirebaseRuntimeDeliveryCommands = (options = defaultOptions) => {
  const steps = [];

  if (!options.skipAndroidRelease) {
    steps.push(
      yarnStep('Refresh Android release APK evidence without upload', 'android:dev:release:verify-local', {
        env: {
          SENTRY_DISABLE_AUTO_UPLOAD: 'true',
        },
      }),
    );
  }

  steps.push(
    yarnStep('Audit Firebase release-services surface', 'firebase:release-services:audit'),
    yarnStep('Validate Firebase release-services summary', 'firebase:release-services:check-summary'),
    yarnStep('Audit push notification bridge readiness', 'push-notification:bridge-audit'),
    yarnStep('Validate push notification bridge summary', 'push-notification:bridge-check-summary'),
    yarnStep('Validate aggregate release-services summary artifacts', 'release-services:check-summaries'),
  );

  return steps;
};

export const getFirebaseRuntimeDeliveryHandoffErrors = options => {
  const errors = [];

  if (typeof options.skipAndroidRelease !== 'boolean') {
    errors.push('skipAndroidRelease must be a boolean');
  }

  return errors;
};

const requireSummaryLine = (errors, summaryText, snippet, message) => {
  if (!summaryText.includes(snippet)) {
    errors.push(message);
  }
};

export const getFirebaseRuntimeDeliveryReadinessErrors = ({ firebaseSummaryText, pushBridgeSummaryText }) => {
  const errors = [];

  if (!firebaseSummaryText) {
    errors.push('Firebase release-services summary is missing; run firebase:release-services:audit first');
  } else {
    [
      ['React Native Firebase package current: yes', 'Firebase packages must be current before runtime delivery handoff'],
      ['Firebase release-services wiring valid: yes', 'Firebase release-services wiring must be valid before runtime delivery handoff'],
      ['Android release summary present: yes', 'Firebase handoff must reference Android release evidence'],
      ['Android release summary required variants covered: yes', 'Android release evidence must cover dev, stage, prod, and beta variants'],
      ['Android release summary valid: yes', 'Android release summary must be valid before Firebase runtime delivery handoff'],
      ['Android release summary current inputs covered: yes', 'Android release summary must cover the current release inputs'],
      ['Android release APK manifest valid: yes', 'Android release APK manifest proof must be valid'],
      ['Firebase runtime delivery validation: not claimed', 'Firebase runtime delivery must stay unclaimed until real FCM/Crashlytics/Analytics testing runs'],
      ['Wiring errors: 0', 'Firebase release-services summary must have 0 wiring errors'],
      ['Required action: none; Firebase release-services wiring is present locally.', 'Firebase summary must report no local wiring action'],
    ].forEach(([snippet, message]) => requireSummaryLine(errors, firebaseSummaryText, snippet, message));
  }

  if (!pushBridgeSummaryText) {
    errors.push('Push notification bridge summary is missing; run push-notification:bridge-audit first');
  } else {
    [
      ['Push notification package current: yes', 'Push notification bridge package must be current before runtime delivery handoff'],
      ['Push notification bridge wiring valid: yes', 'Push notification bridge wiring must be valid before runtime delivery handoff'],
      ['Push notification runtime delivery validation: not claimed', 'Push notification runtime delivery must stay unclaimed until real delivery testing runs'],
      ['Static readiness issues: 0', 'Push notification bridge summary must have 0 static readiness issues'],
      ['Wiring errors: 0', 'Push notification bridge summary must have 0 wiring errors'],
      ['Required action: none; static push notification bridge wiring is present locally.', 'Push notification summary must report no local wiring action'],
    ].forEach(([snippet, message]) => requireSummaryLine(errors, pushBridgeSummaryText, snippet, message));
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
  console.log(renderFirebaseRuntimeDeliveryCommand(step));

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

  const errors = getFirebaseRuntimeDeliveryHandoffErrors(options);

  if (errors.length > 0) {
    errors.forEach(error => console.error(error));
    return 1;
  }

  const commands = getFirebaseRuntimeDeliveryCommands(options);

  if (options.dryRun) {
    console.log('Firebase runtime delivery handoff dry run');
    console.log(`Android release evidence refresh: ${options.skipAndroidRelease ? 'skipped' : 'included'}`);
    console.log('Secret values are not rendered; real FCM, Crashlytics, and Analytics delivery remains unclaimed.');
    commands.forEach((step, index) => {
      console.log(`${index + 1}. ${step.label}`);
      console.log(`   ${renderFirebaseRuntimeDeliveryCommand(step)}`);
    });
    console.log('Dry run complete. Run without --dry-run to validate local prerequisites before real runtime delivery testing.');
    return 0;
  }

  for (const step of commands) {
    const status = runStep(step);

    if (status !== 0) {
      return status;
    }
  }

  const readinessErrors = getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readSummary(firebaseSummaryPath),
    pushBridgeSummaryText: readSummary(pushBridgeSummaryPath),
  });

  if (readinessErrors.length > 0) {
    console.error('\nFirebase runtime delivery handoff prerequisites are blocked:');
    readinessErrors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  console.log('\nFirebase runtime delivery handoff prerequisites are ready.');
  console.log('Runtime delivery remains not claimed until real FCM token/notification, Crashlytics upload, and Analytics behavior are tested.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
