import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidReleaseSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';
import { getCodePushMigrationReadinessSummaryErrors } from './codePushMigrationReadinessSummaryGuard.mjs';
import { getCodePushRemovalReadinessSummaryErrors } from './codePushRemovalReadinessSummaryGuard.mjs';
import { getCodePushUpdateValidationHandoffSummaryErrors } from './codePushUpdateValidationHandoffSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const releasePathSummaryPath = path.join(root, 'local-docs', 'codepush-release-path-summary.txt');
const migrationReadinessSummaryPath = path.join(root, 'local-docs', 'codepush-migration-readiness-summary.txt');
const removalReadinessSummaryPath = path.join(root, 'local-docs', 'codepush-removal-readiness-summary.txt');
const updateValidationHandoffSummaryPath = path.join(root, 'local-docs', 'codepush-update-validation-handoff-summary.txt');
const androidReleaseSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-summary.txt');
const androidReleaseCreateWalletSmokeSummaryPath = path.join(root, 'local-docs', 'android-create-wallet-smoke-dev-release-summary.txt');
const androidReleaseSignedSmokeApkPath = path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk');

const defaultOptions = {
  dryRun: false,
  summaryOnly: false,
  skipAndroidRelease: false,
};

const usage = [
  'Usage: node scripts/runCodePushUpdateValidationHandoff.mjs [--dry-run] [--summary-only] [--skip-android-release]',
  '',
  'Examples:',
  '  node scripts/runCodePushUpdateValidationHandoff.mjs --dry-run',
  '  node scripts/runCodePushUpdateValidationHandoff.mjs --summary-only --skip-android-release',
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

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const yesNoFromLine = value => (['yes', 'no'].includes(value) ? value : 'no');

export const getCodePushUpdateValidationCommands = (options = defaultOptions) => {
  const steps = [];

  if (!options.skipAndroidRelease) {
    steps.push(
      yarnStep('Refresh Android release create-wallet evidence without upload', 'android:dev:release:create-wallet-verify', {
        env: {
          SENTRY_DISABLE_AUTO_UPLOAD: 'true',
        },
      }),
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
  options = { ...defaultOptions, ...options };
  const errors = [];

  if (typeof options.skipAndroidRelease !== 'boolean') {
    errors.push('skipAndroidRelease must be a boolean');
  }

  if (typeof options.summaryOnly !== 'boolean') {
    errors.push('summaryOnly must be a boolean');
  }

  return errors;
};

export const getCodePushUpdateValidationHandoffSummary = ({
  options = defaultOptions,
  generatedAt = new Date().toISOString(),
  releasePathSummaryText,
  migrationReadinessSummaryText,
  removalReadinessSummaryText,
}) => {
  const releasePathErrors = releasePathSummaryText ? getCodePushReleasePathSummaryErrors(releasePathSummaryText) : ['missing release path summary'];
  const migrationReadinessErrors = migrationReadinessSummaryText
    ? getCodePushMigrationReadinessSummaryErrors(migrationReadinessSummaryText)
    : ['missing migration readiness summary'];
  const removalReadinessErrors = removalReadinessSummaryText
    ? getCodePushRemovalReadinessSummaryErrors(removalReadinessSummaryText)
    : ['missing removal readiness summary'];
  const releasePathSummaryValid = releasePathErrors.length === 0;
  const migrationReadinessSummaryValid = migrationReadinessErrors.length === 0;
  const removalReadinessSummaryValid = removalReadinessErrors.length === 0;
  const releasePathReady = yesNoFromLine(getLineValue(releasePathSummaryText || '', 'Release path ready for update validation'));
  const codePushRemoved = yesNoFromLine(
    getLineValue(migrationReadinessSummaryText || '', 'CodePush removed') || getLineValue(releasePathSummaryText || '', 'CodePush removed'),
  );
  const migrationRequired = yesNoFromLine(
    getLineValue(migrationReadinessSummaryText || '', 'CodePush migration required') ||
      getLineValue(releasePathSummaryText || '', 'CodePush migration required'),
  );
  const releaseBuildReady = yesNoFromLine(
    getLineValue(migrationReadinessSummaryText || '', 'CodePush release build evidence ready') ||
      getLineValue(releasePathSummaryText || '', 'CodePush release build evidence ready'),
  );
  const releaseSmokeReady = yesNoFromLine(getLineValue(migrationReadinessSummaryText || '', 'CodePush release smoke evidence ready'));
  const releaseCreateWalletReady = yesNoFromLine(
    getLineValue(migrationReadinessSummaryText || '', 'CodePush release create-wallet evidence ready'),
  );
  const controlledBlockerOutcome = getLineValue(migrationReadinessSummaryText || '', 'Controlled release blocker outcome') || 'not-applicable';
  const releaseRuntimeProofState = getLineValue(migrationReadinessSummaryText || '', 'CodePush release runtime proof state') || 'not ready';
  const readinessErrors = [];

  if (!releasePathSummaryValid) {
    readinessErrors.push(`CodePush release path summary invalid: ${releasePathErrors.length} error(s)`);
  }

  if (!migrationReadinessSummaryValid) {
    readinessErrors.push(`CodePush migration readiness summary invalid: ${migrationReadinessErrors.length} error(s)`);
  }

  if (!removalReadinessSummaryValid) {
    readinessErrors.push(`CodePush removal readiness summary invalid: ${removalReadinessErrors.length} error(s)`);
  }

  if (codePushRemoved === 'yes') {
    readinessErrors.push('CodePush is removed; OTA update validation requires a maintained replacement before a real delivery test can be claimed.');
  } else if (releasePathReady !== 'yes') {
    readinessErrors.push('CodePush release path is not ready for update validation.');
  }

  if (codePushRemoved !== 'yes' && releaseRuntimeProofState === 'blocked-by-electrum-certificate-expired') {
    readinessErrors.push('Full Android release runtime proof is blocked by the controlled dev/testnet Electrum certificate issue.');
  } else if (codePushRemoved !== 'yes' && (releaseSmokeReady !== 'yes' || releaseCreateWalletReady !== 'yes')) {
    readinessErrors.push('Full Android release smoke and release create-wallet evidence must pass before a real OTA delivery test.');
  }

  const handoffOutcome = readinessErrors.length === 0 ? 'ready-for-real-ota-test' : 'blocked';
  const blockerType =
    handoffOutcome === 'ready-for-real-ota-test'
      ? 'none'
      : releasePathErrors.length > 0 || migrationReadinessErrors.length > 0 || removalReadinessErrors.length > 0
        ? 'summary-invalid'
        : codePushRemoved === 'yes'
          ? 'codepush-removed'
          : releaseRuntimeProofState === 'blocked-by-electrum-certificate-expired'
            ? 'blocked-by-electrum-certificate-expired'
            : 'release-evidence-not-ready';
  const requiredAction =
    blockerType === 'codepush-removed'
      ? 'keep CodePush removed; do not claim OTA update validation until a maintained replacement and real delivery test are available.'
      : blockerType === 'blocked-by-electrum-certificate-expired'
        ? 'renew the dev/testnet Electrum TLS certificate, rerun full release smoke/create-wallet validation, and do not claim OTA update validation until a real delivery test passes.'
        : handoffOutcome === 'ready-for-real-ota-test'
          ? 'run a real OTA delivery test with deployment keys in a maintained replacement path; do not claim OTA update validation before that test passes.'
          : 'refresh CodePush release-path, migration, removal, and Android release evidence; do not claim OTA update validation until a real delivery test passes.';

  return [
    'CodePush update validation handoff summary',
    `Generated at: ${generatedAt}`,
    `Android release evidence refresh skipped: ${options.skipAndroidRelease ? 'yes' : 'no'}`,
    `Release path summary valid: ${releasePathSummaryValid ? 'yes' : 'no'}`,
    `Migration readiness summary valid: ${migrationReadinessSummaryValid ? 'yes' : 'no'}`,
    `Removal readiness summary valid: ${removalReadinessSummaryValid ? 'yes' : 'no'}`,
    `Release path ready for update validation: ${releasePathReady}`,
    `CodePush removed: ${codePushRemoved}`,
    `CodePush migration required: ${migrationRequired}`,
    'CodePush update validation: not claimed',
    `CodePush release build evidence ready: ${releaseBuildReady}`,
    `CodePush release smoke evidence ready: ${releaseSmokeReady}`,
    `CodePush release create-wallet evidence ready: ${releaseCreateWalletReady}`,
    `Controlled release blocker outcome: ${controlledBlockerOutcome}`,
    `CodePush release runtime proof state: ${releaseRuntimeProofState}`,
    `Handoff outcome: ${handoffOutcome}`,
    `Handoff blocker type: ${blockerType}`,
    'iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming iOS delivery.',
    `Readiness errors: ${readinessErrors.length}`,
    ...readinessErrors.map(error => `- ${error}`),
    'Secret values printed: no',
    `Required action: ${requiredAction}`,
    '',
  ].join('\n');
};

export const getCodePushUpdateValidationReadinessErrors = ({
  releasePathSummaryText,
  migrationReadinessSummaryText,
  removalReadinessSummaryText,
  androidReleaseCreateWalletSmokeSummaryText,
  androidReleaseSmokeSummaryText,
  createWalletEvidenceOptions = {
    expectedApkPath: androidReleaseSignedSmokeApkPath,
    expectedArtifactBase: 'android-create-wallet-smoke-dev-release',
  },
  smokeEvidenceOptions = getAndroidReleaseSmokeEvidenceOptions(root),
}) => {
  const errors = [];

  if (!releasePathSummaryText) {
    errors.push('CodePush release path summary is missing; run codepush:release:path-audit first');
  } else {
    getCodePushReleasePathSummaryErrors(releasePathSummaryText).forEach(error => {
      errors.push(`CodePush release path summary is invalid: ${error}`);
    });

    if (!releasePathSummaryText.includes('Secret values printed: no')) {
      errors.push('CodePush handoff summary must prove that deployment-key values were not printed');
    }

    const codePushRemoved = releasePathSummaryText.includes('CodePush removed: yes');

    if (codePushRemoved) {
      errors.push('CodePush is removed; OTA update validation requires a maintained replacement before a real delivery test can be claimed');
    }

    if (!codePushRemoved && !releasePathSummaryText.includes('Release path ready for update validation: yes')) {
      errors.push(
        'CodePush release path is not ready for update validation; provide non-empty blocked deployment keys and confirm the beta strategy before claiming update validation',
      );
    }

    if (!releasePathSummaryText.includes('CodePush update validation: not claimed')) {
      errors.push('CodePush handoff must keep runtime update validation unclaimed until a real OTA delivery test runs');
    }

    if (codePushRemoved) {
      if (!releasePathSummaryText.includes('CodePush migration required: no')) {
        errors.push('Removed CodePush handoff must report CodePush migration required: no');
      }
    } else if (!releasePathSummaryText.includes('CodePush migration required: yes')) {
      errors.push('CodePush handoff must keep the App Center retirement migration requirement visible');
    }
  }

  if (!migrationReadinessSummaryText) {
    errors.push('CodePush migration readiness summary is missing; run codepush:migration:readiness-audit first');
  } else {
    getCodePushMigrationReadinessSummaryErrors(migrationReadinessSummaryText).forEach(error => {
      errors.push(`CodePush migration readiness summary is invalid: ${error}`);
    });
  }

  if (!removalReadinessSummaryText) {
    errors.push('CodePush removal readiness summary is missing; run codepush:removal-readiness:audit first');
  } else {
    getCodePushRemovalReadinessSummaryErrors(removalReadinessSummaryText).forEach(error => {
      errors.push(`CodePush removal readiness summary is invalid: ${error}`);
    });
  }

  if (!androidReleaseSmokeSummaryText) {
    errors.push('Android release smoke summary is missing; run android:dev:release:smoke:embedded first');
  } else {
    const smokeErrors = getAndroidEmbeddedSmokeSummaryErrors(androidReleaseSmokeSummaryText, smokeEvidenceOptions);

    smokeErrors.forEach(error => errors.push(`Android release smoke summary is invalid: ${error}`));
  }

  if (!androidReleaseCreateWalletSmokeSummaryText) {
    errors.push('Android release create-wallet smoke summary is missing; run android:dev:release:create-wallet-smoke:embedded first');
  } else {
    const createWalletErrors = getAndroidCreateWalletSmokeSummaryErrors(
      androidReleaseCreateWalletSmokeSummaryText,
      createWalletEvidenceOptions,
    );

    createWalletErrors.forEach(error => errors.push(`Android release create-wallet smoke summary is invalid: ${error}`));
  }

  return errors;
};

const readSummary = summaryPath => {
  if (!existsSync(summaryPath)) {
    return null;
  }

  return readFileSync(summaryPath, 'utf8');
};

const buildSummaryFromCurrentArtifacts = options =>
  getCodePushUpdateValidationHandoffSummary({
    options,
    releasePathSummaryText: readSummary(releasePathSummaryPath),
    migrationReadinessSummaryText: readSummary(migrationReadinessSummaryPath),
    removalReadinessSummaryText: readSummary(removalReadinessSummaryPath),
  });

const writeSummaryArtifact = summary => {
  const errors = getCodePushUpdateValidationHandoffSummaryErrors(summary);

  if (errors.length > 0) {
    console.error('CodePush update-validation handoff summary is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  mkdirSync(path.dirname(updateValidationHandoffSummaryPath), { recursive: true });
  writeFileSync(updateValidationHandoffSummaryPath, summary);
  console.log(summary.trim());
  console.log(`CodePush update-validation handoff summary written to ${path.relative(root, updateValidationHandoffSummaryPath)}`);
  return 0;
};

const parseArgs = argv => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--summary-only') {
      options.summaryOnly = true;
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

  if (options.summaryOnly) {
    return writeSummaryArtifact(buildSummaryFromCurrentArtifacts(options));
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
    console.log('Dry run complete. Run without --dry-run only for a maintained replacement path; removed CodePush cannot claim OTA delivery.');
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
    migrationReadinessSummaryText: readSummary(migrationReadinessSummaryPath),
    removalReadinessSummaryText: readSummary(removalReadinessSummaryPath),
    androidReleaseCreateWalletSmokeSummaryText: readSummary(androidReleaseCreateWalletSmokeSummaryPath),
    androidReleaseSmokeSummaryText: readSummary(androidReleaseSmokeSummaryPath),
  });
  const summaryStatus = writeSummaryArtifact(buildSummaryFromCurrentArtifacts(options));

  if (summaryStatus !== 0) {
    return summaryStatus;
  }

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
