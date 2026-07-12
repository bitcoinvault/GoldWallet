import { existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getCameraCandidateSummaryErrors } from './cameraCandidateSummaryGuard.mjs';
import { getCameraQrMigrationSummaryErrors } from './cameraQrMigrationSummaryGuard.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const cameraCandidateSummaryPath = path.join(root, 'local-docs', 'camera-candidate-summary.txt');
const cameraQrMigrationSummaryPath = path.join(root, 'local-docs', 'camera-qr-migration-summary.txt');
const androidSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-summary.txt');
const androidReleaseSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-summary.txt');
const androidReleaseCreateWalletSummaryPath = path.join(root, 'local-docs', 'android-create-wallet-smoke-dev-release-summary.txt');
const signedReleaseApkPath = path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk');
const unsignedDevReleaseApkPath = path.join(
  root,
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'dev',
  'release',
  'app-dev-release-unsigned.apk',
);

const defaultOptions = {
  dryRun: false,
  includeAndroidSmoke: false,
  includeAndroidReleaseSmoke: false,
};

const usage = [
  'Usage: node scripts/runCameraQrValidationHandoff.mjs [--dry-run] [--include-android-smoke] [--include-android-release-smoke]',
  '',
  'Examples:',
  '  node scripts/runCameraQrValidationHandoff.mjs --dry-run',
  '  node scripts/runCameraQrValidationHandoff.mjs --dry-run --include-android-smoke',
  '  node scripts/runCameraQrValidationHandoff.mjs --dry-run --include-android-release-smoke',
  '  node scripts/runCameraQrValidationHandoff.mjs',
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

export const renderCameraQrValidationCommand = step => {
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

export const getCameraQrValidationCommands = (options = defaultOptions) => {
  const commands = [
    yarnStep('Audit Camera/QR candidate metadata', 'camera:candidate:audit'),
    yarnStep('Validate Camera/QR candidate summary', 'camera:candidate:check-summary'),
    yarnStep('Audit CameraKit QR migration wiring', 'camera:qr-migration:audit'),
    yarnStep('Validate CameraKit QR migration summary', 'camera:qr-migration:check-summary'),
    yarnStep('Validate camera usage guard fixtures', 'check:camera-usage-guard'),
    yarnStep('Validate camera runtime usage scope', 'check:camera-usage-scope'),
    yarnStep('Validate QR scanner caller guard fixtures', 'check:qr-scan-caller-guard'),
    yarnStep('Validate QR scanner caller inventory', 'check:qr-scan-callers'),
    yarnStep('Validate QR scanner test guard', 'check:qr-scanner-validation-scripts'),
    yarnStep('Run focused QR scanner unit test', 'test:qr-scanner:unit'),
    yarnStep('Validate QR render usage guard fixtures', 'check:qr-render-usage-guard'),
    yarnStep('Validate QR render usage inventory', 'check:qr-render-usage'),
    yarnStep('Validate QR render test guard', 'check:qr-render-validation-scripts'),
    yarnStep('Run focused QR render unit test', 'test:qr-render:unit'),
  ];

  if (options.includeAndroidSmoke) {
    commands.push(
      yarnStep('Assemble Android dev debug APK for Camera/QR smoke', 'android:dev:assemble'),
      yarnStep('Run Android embedded smoke including QR scanner screen', 'android:dev:smoke:embedded'),
      yarnStep('Validate Android smoke summary', 'android:dev:check-smoke-summary'),
    );
  }

  if (options.includeAndroidReleaseSmoke) {
    commands.push(
      yarnStep('Run Android devRelease build, release smoke, and create-wallet smoke for Camera/QR', 'android:dev:release:create-wallet-verify'),
    );
  }

  commands.push(
    yarnStep('Validate Camera/QR validation summary guard fixtures', 'check:camera-qr-validation-summary-guard'),
    yarnStep('Write Camera/QR validation summary', 'camera:qr-validation:summary'),
    yarnStep('Validate Camera/QR validation summary', 'camera:qr-validation:check-summary'),
  );

  return commands;
};

export const getCameraQrValidationHandoffErrors = options => {
  const errors = [];

  if (typeof options.dryRun !== 'boolean') {
    errors.push('dryRun must be a boolean');
  }

  if (typeof options.includeAndroidSmoke !== 'boolean') {
    errors.push('includeAndroidSmoke must be a boolean');
  }

  if (typeof options.includeAndroidReleaseSmoke !== 'boolean') {
    errors.push('includeAndroidReleaseSmoke must be a boolean');
  }

  return errors;
};

export const getCameraQrValidationReadinessErrors = ({
  candidateSummaryText,
  migrationSummaryText,
  includeAndroidSmoke = false,
  androidSmokeSummaryText,
  includeAndroidReleaseSmoke = false,
  androidReleaseSmokeSummaryText,
  androidReleaseCreateWalletSummaryText,
  androidReleaseSmokeExpectedApkPath = signedReleaseApkPath,
  androidReleaseSmokeExpectedSourceApkPath = unsignedDevReleaseApkPath,
  androidReleaseCreateWalletExpectedApkPath = signedReleaseApkPath,
}) => {
  const errors = [];

  if (!candidateSummaryText) {
    errors.push('Camera candidate summary is missing; run camera:candidate:audit first');
  } else {
    getCameraCandidateSummaryErrors(candidateSummaryText).forEach(error => {
      errors.push(`Camera candidate summary is invalid: ${error}`);
    });
  }

  if (!migrationSummaryText) {
    errors.push('Camera QR migration summary is missing; run camera:qr-migration:audit first');
  } else {
    getCameraQrMigrationSummaryErrors(migrationSummaryText).forEach(error => {
      errors.push(`Camera QR migration summary is invalid: ${error}`);
    });
  }

  if (includeAndroidSmoke) {
    if (!androidSmokeSummaryText) {
      errors.push('Android smoke summary is missing; run android:dev:smoke:embedded first');
    } else {
      getAndroidEmbeddedSmokeSummaryErrors(androidSmokeSummaryText).forEach(error => {
        errors.push(`Android smoke summary is invalid: ${error}`);
      });
    }
  }

  if (includeAndroidReleaseSmoke) {
    if (!androidReleaseSmokeSummaryText) {
      errors.push('Android release smoke summary is missing; run android:dev:release:smoke:embedded first');
    } else {
      getAndroidEmbeddedSmokeSummaryErrors(androidReleaseSmokeSummaryText, {
        expectedArtifactBase: 'android-smoke-dev-release',
        requireSmokeApkDigest: true,
        expectedSmokeApkPath: androidReleaseSmokeExpectedApkPath,
        requireSourceApkDigest: true,
        expectedSourceApkPath: androidReleaseSmokeExpectedSourceApkPath,
      }).forEach(error => {
        errors.push(`Android release smoke summary is invalid: ${error}`);
      });
    }

    if (!androidReleaseCreateWalletSummaryText) {
      errors.push('Android release create-wallet smoke summary is missing; run android:dev:release:create-wallet-smoke:embedded first');
    } else {
      getAndroidCreateWalletSmokeSummaryErrors(androidReleaseCreateWalletSummaryText, {
        expectedApkPath: androidReleaseCreateWalletExpectedApkPath,
        expectedArtifactBase: 'android-create-wallet-smoke-dev-release',
      }).forEach(error => {
        errors.push(`Android release create-wallet smoke summary is invalid: ${error}`);
      });
    }
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
    } else if (arg === '--include-android-smoke') {
      options.includeAndroidSmoke = true;
    } else if (arg === '--include-android-release-smoke') {
      options.includeAndroidReleaseSmoke = true;
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
  console.log(renderCameraQrValidationCommand(step));

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

  const errors = getCameraQrValidationHandoffErrors(options);

  if (errors.length > 0) {
    errors.forEach(error => console.error(error));
    return 1;
  }

  const commands = getCameraQrValidationCommands(options);

  if (options.dryRun) {
    console.log('Camera/QR validation handoff dry run');
    console.log(`Android smoke validation: ${options.includeAndroidSmoke ? 'included' : 'skipped'}`);
    console.log(`Android release smoke validation: ${options.includeAndroidReleaseSmoke ? 'included' : 'skipped'}`);
    commands.forEach((step, index) => {
      console.log(`${index + 1}. ${step.label}`);
      console.log(`   ${renderCameraQrValidationCommand(step)}`);
    });
    console.log('Dry run complete. Run without --dry-run to execute Camera/QR validation.');
    return 0;
  }

  for (const step of commands) {
    const status = runStep(step);

    if (status !== 0) {
      return status;
    }
  }

  const readinessErrors = getCameraQrValidationReadinessErrors({
    candidateSummaryText: readSummary(cameraCandidateSummaryPath),
    migrationSummaryText: readSummary(cameraQrMigrationSummaryPath),
    includeAndroidSmoke: options.includeAndroidSmoke,
    androidSmokeSummaryText: readSummary(androidSmokeSummaryPath),
    includeAndroidReleaseSmoke: options.includeAndroidReleaseSmoke,
    androidReleaseSmokeSummaryText: readSummary(androidReleaseSmokeSummaryPath),
    androidReleaseCreateWalletSummaryText: readSummary(androidReleaseCreateWalletSummaryPath),
  });

  if (readinessErrors.length > 0) {
    console.error('\nCamera/QR validation handoff artifacts are blocked:');
    readinessErrors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  console.log('\nCamera/QR validation handoff completed.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
