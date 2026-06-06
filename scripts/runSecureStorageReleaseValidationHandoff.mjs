import { existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const migrationSummaryPath = path.join(root, 'local-docs', 'secure-storage-migration-summary.txt');
const removalSummaryPath = path.join(root, 'local-docs', 'secure-storage-removal-readiness-summary.txt');

const defaultOptions = {
  dryRun: false,
  skipAndroidSmoke: false,
};

const usage = [
  'Usage: node scripts/runSecureStorageReleaseValidationHandoff.mjs [--dry-run] [--skip-android-smoke]',
  '',
  'Examples:',
  '  node scripts/runSecureStorageReleaseValidationHandoff.mjs --dry-run',
  '  node scripts/runSecureStorageReleaseValidationHandoff.mjs --skip-android-smoke',
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

export const renderSecureStorageReleaseValidationCommand = step => {
  const command = [step.command, ...step.args].map(quoteArg).join(' ');
  const cwd = step.cwd === root ? '.' : path.relative(root, step.cwd).replace(/\\/g, '/');

  return [`cwd=${cwd}`, command].join(' ');
};

const yarnStep = (label, script) => ({
  label,
  command: 'corepack',
  args: ['yarn', script],
  cwd: root,
});

export const getSecureStorageReleaseValidationCommands = (options = defaultOptions) => {
  const steps = [
    yarnStep('Audit secure-storage migration posture', 'secure-storage:migration:audit'),
    yarnStep('Validate secure-storage migration summary', 'secure-storage:migration:check-summary'),
    yarnStep('Audit secure-storage removal readiness', 'secure-storage:removal-readiness:audit'),
    yarnStep('Validate secure-storage removal readiness summary', 'secure-storage:removal-readiness:check-summary'),
    yarnStep('Run focused secure-storage unit contract', 'test:secure-storage:unit'),
    yarnStep('Run wallet storage integration contract', 'test:storage'),
    yarnStep('Run authenticator storage contract', 'test:authenticator'),
    yarnStep('Run offline wallet core storage contract', 'test:wallet-core:offline'),
  ];

  if (!options.skipAndroidSmoke) {
    steps.push(yarnStep('Run Android dev build and emulator smoke', 'android:dev:verify'));
  }

  return steps;
};

export const getSecureStorageReleaseValidationHandoffErrors = options => {
  const errors = [];

  if (typeof options.skipAndroidSmoke !== 'boolean') {
    errors.push('skipAndroidSmoke must be a boolean');
  }

  return errors;
};

const readSummary = summaryPath => {
  if (!existsSync(summaryPath)) {
    return null;
  }

  return readFileSync(summaryPath, 'utf8');
};

export const getSecureStorageReleaseValidationReadinessErrors = ({ migrationSummary, removalSummary }) => {
  const errors = [];

  if (!migrationSummary) {
    errors.push('Secure-storage migration summary is missing; run secure-storage:migration:audit first');
  } else {
    [
      'Keychain primary write: yes',
      'Legacy secure-storage writes disabled: yes',
      'Legacy secure-storage fallback reads active: yes',
      'Secure-storage migration baseline stable: yes',
    ].forEach(expected => {
      if (!migrationSummary.includes(expected)) {
        errors.push(`Secure-storage migration summary must include: ${expected}`);
      }
    });
  }

  if (!removalSummary) {
    errors.push('Secure-storage removal readiness summary is missing; run secure-storage:removal-readiness:audit first');
  } else {
    [
      'Removal release validation claimed: no',
      'Legacy package removal ready: no',
      'Required action: keep react-native-secure-key-store installed until release validation is claimed for migrated secure values.',
    ].forEach(expected => {
      if (!removalSummary.includes(expected)) {
        errors.push(`Secure-storage removal readiness summary must include: ${expected}`);
      }
    });
  }

  return errors;
};

const parseArgs = argv => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--skip-android-smoke') {
      options.skipAndroidSmoke = true;
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
  console.log(renderSecureStorageReleaseValidationCommand(step));

  const invocation = getSpawnInvocation(step);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: step.cwd,
    env: process.env,
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

  const errors = getSecureStorageReleaseValidationHandoffErrors(options);

  if (errors.length > 0) {
    errors.forEach(error => console.error(error));
    return 1;
  }

  const commands = getSecureStorageReleaseValidationCommands(options);

  if (options.dryRun) {
    console.log('Secure-storage release validation handoff dry run');
    console.log(`Android dev build and emulator smoke: ${options.skipAndroidSmoke ? 'skipped' : 'included'}`);
    console.log('This handoff validates the migration posture but does not claim legacy package removal readiness.');
    commands.forEach((step, index) => {
      console.log(`${index + 1}. ${step.label}`);
      console.log(`   ${renderSecureStorageReleaseValidationCommand(step)}`);
    });
    console.log('Dry run complete. Run without --dry-run to execute the secure-storage validation sequence.');
    return 0;
  }

  for (const step of commands) {
    const status = runStep(step);

    if (status !== 0) {
      return status;
    }
  }

  const readinessErrors = getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readSummary(migrationSummaryPath),
    removalSummary: readSummary(removalSummaryPath),
  });

  if (readinessErrors.length > 0) {
    console.error('\nSecure-storage release validation handoff failed:');
    readinessErrors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  console.log('\nSecure-storage release validation handoff completed.');
  console.log('Legacy secure-storage removal is still not claimed; keep react-native-secure-key-store installed.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
