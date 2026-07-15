import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidReleaseSmokeVariantConfig } from './androidReleaseSmokeVariant.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const summaryPath = path.join(outputDir, 'secure-storage-upgrade-in-place-summary.txt');
const logPath = path.join(outputDir, 'secure-storage-upgrade-in-place.log');
const baselineApkPath = path.join(outputDir, 'secure-storage-upgrade-baseline-prod-release.apk');
const candidateApkPath = path.join(outputDir, 'secure-storage-upgrade-candidate-prod-release.apk');
const runtimeArtifactBase = 'secure-storage-upgrade-in-place-runtime';
const runtimeSummaryPath = path.join(outputDir, `${runtimeArtifactBase}-summary.txt`);
const releaseConfig = getAndroidReleaseSmokeVariantConfig(root, 'prod');
const resumeCandidate = process.argv.includes('--resume-candidate');
const previousSummary = resumeCandidate && existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '';
const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}:`));

  return line ? line.slice(label.length + 1).trim() : '';
};
const generatedAutolinkingRoot = path.join(root, 'android', 'build', 'generated', 'autolinking');
const generatedAutolinkingApp = path.join(root, 'android', 'app', 'build', 'generated', 'autolinking');
const generatedPackageListPath = path.join(
  generatedAutolinkingApp,
  'src',
  'main',
  'java',
  'com',
  'facebook',
  'react',
  'PackageList.java',
);
const packageName = releaseConfig.packageName;
const activityName = `${packageName}/io.goldwallet.wallet.MainActivity`;
const walletName =
  process.env.ANDROID_SECURE_STORAGE_UPGRADE_WALLET_NAME ||
  getLineValue(previousSummary, 'Persisted wallet name') ||
  `Upgrade${new Date().toISOString().replace(/\D/g, '').slice(8, 14)}`;
const pin = process.env.ANDROID_SMOKE_PIN || '1111';
const localReleaseBuildEnv = { SENTRY_DISABLE_AUTO_UPLOAD: 'true' };
const sdkRoot =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
const adbCommand = sdkRoot
  ? path.join(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')
  : 'adb';
const log = [];
let selectedSerial = process.env.ANDROID_SERIAL?.trim() || getLineValue(previousSummary, 'Android serial');
let outcome = 'failed';
let reason = 'not completed';
let baselineLegacyLinked = getLineValue(previousSummary, 'Baseline legacy native package linked') === 'yes';
let candidateLegacyLinked = true;
let candidateInstalledWithReplace = false;
let dataPreserved = false;
let preUpdatePid = getLineValue(previousSummary, 'Pre-update App PID');
let postUpdatePid = '';
let runtimeSummary = '';

mkdirSync(outputDir, { recursive: true });

const append = line => {
  log.push(line);
  console.log(line);
};

const run = (label, command, args, { env = {}, capture = false } = {}) => {
  append(`\n> ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    shell: process.platform === 'win32' && /\.(bat|cmd)$/i.test(command),
    stdio: capture ? 'pipe' : 'inherit',
  });

  if (capture) {
    if (result.stdout?.trim()) append(result.stdout.trim());
    if (result.stderr?.trim()) append(result.stderr.trim());
  }

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.error?.message || `exit ${result.status}`}`);
  }

  return result.stdout?.trim() || '';
};

const runNode = (label, script, args = [], env = {}) =>
  run(label, process.execPath, [path.join(root, script), ...args], { env });

const runAdb = (label, args, options = {}) =>
  run(label, adbCommand, [...(selectedSerial ? ['-s', selectedSerial] : []), ...args], options);

const fileEvidence = filePath => ({
  path: filePath,
  bytes: existsSync(filePath) ? statSync(filePath).size : 0,
  sha256: existsSync(filePath) ? createHash('sha256').update(readFileSync(filePath)).digest('hex') : '<missing>',
});

const writeSummary = exitCode => {
  const baseline = fileEvidence(baselineApkPath);
  const candidate = fileEvidence(candidateApkPath);
  const summary = [
    `Generated at: ${new Date().toISOString()}`,
    `Secure-storage upgrade-in-place outcome: ${outcome}`,
    `Secure-storage upgrade-in-place exit code: ${exitCode}`,
    `Secure-storage upgrade-in-place reason: ${reason}`,
    `Android serial: ${selectedSerial || 'not selected'}`,
    `Android package: ${packageName}`,
    `Persisted wallet name: ${walletName}`,
    `Baseline APK path: ${baseline.path}`,
    `Baseline APK bytes: ${baseline.bytes}`,
    `Baseline APK sha256: ${baseline.sha256}`,
    `Candidate APK path: ${candidate.path}`,
    `Candidate APK bytes: ${candidate.bytes}`,
    `Candidate APK sha256: ${candidate.sha256}`,
    `Baseline legacy native package linked: ${baselineLegacyLinked ? 'yes' : 'no'}`,
    `Candidate legacy native package linked: ${candidateLegacyLinked ? 'yes' : 'no'}`,
    `Candidate installed with adb install -r: ${candidateInstalledWithReplace ? 'yes' : 'no'}`,
    `Application data preserved across APK update: ${dataPreserved ? 'yes' : 'no'}`,
    `Unlock screen reached after APK update: ${getLineValue(runtimeSummary, 'Unlock screen reached after restart') || 'not checked'}`,
    `Incorrect PIN rejected after APK update: ${getLineValue(runtimeSummary, 'Incorrect PIN rejected after restart') || 'not checked'}`,
    `Correct PIN accepted after APK update: ${getLineValue(runtimeSummary, 'Correct PIN accepted after restart') || 'not checked'}`,
    `Persisted wallet card visible after APK update: ${getLineValue(runtimeSummary, 'Standard wallet persisted after restart') || 'not checked'}`,
    `App process changed across APK update: ${preUpdatePid && postUpdatePid && preUpdatePid !== postUpdatePid ? 'yes' : 'no'}`,
    `Secure window flag after APK update: ${getLineValue(runtimeSummary, 'Secure window flag after restart') || 'not checked'}`,
    `Fatal/runtime logcat findings: ${getLineValue(runtimeSummary, 'Fatal/runtime logcat findings') || 'not checked'}`,
    `Pre-update App PID: ${preUpdatePid || 'not available'}`,
    `Post-update App PID: ${postUpdatePid || 'not available'}`,
    `Captured logcat lines: ${getLineValue(runtimeSummary, 'Captured logcat lines') || '0'}`,
    `Screenshot bytes: ${getLineValue(runtimeSummary, 'Screenshot bytes') || '0'}`,
  ].join('\n');

  writeFileSync(summaryPath, `${summary}\n`);
  writeFileSync(logPath, `${log.join('\n')}\n`);
};

const clearGeneratedAutolinking = () => {
  rmSync(generatedAutolinkingRoot, { recursive: true, force: true });
  rmSync(generatedAutolinkingApp, { recursive: true, force: true });
};

try {
  if (!/^[A-Za-z][A-Za-z0-9_-]{2,40}$/.test(walletName)) {
    throw new Error('ANDROID_SECURE_STORAGE_UPGRADE_WALLET_NAME must be shell-safe and contain no spaces.');
  }

  const devicesOutput = run('list Android devices', adbCommand, ['devices'], { capture: true });
  const devices = devicesOutput
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim())
    .filter(line => /\tdevice$/.test(line))
    .map(line => line.split(/\s+/)[0]);

  if (selectedSerial && !devices.includes(selectedSerial)) {
    throw new Error(`ANDROID_SERIAL=${selectedSerial} is not connected.`);
  }
  if (!selectedSerial && devices.length !== 1) {
    throw new Error(`Expected exactly one connected Android device; found ${devices.length}. Set ANDROID_SERIAL.`);
  }
  selectedSerial ||= devices[0];

  if (!resumeCandidate) {
    if (!existsSync(baselineApkPath)) {
      throw new Error(`Missing retained legacy baseline APK: ${baselineApkPath}`);
    }
    baselineLegacyLinked = true;
    runNode(
      'install and onboard retained legacy prodRelease baseline',
      'scripts/androidSmokeDevEmbedded.mjs',
      [],
      {
        ANDROID_SERIAL: selectedSerial,
        ANDROID_SMOKE_APK: baselineApkPath,
        ANDROID_SMOKE_PACKAGE: packageName,
        ANDROID_SMOKE_ACTIVITY: activityName,
        ANDROID_SMOKE_OUTPUT_BASENAME: 'secure-storage-upgrade-baseline-runtime',
      },
    );
    runNode(
      'seed wallet in retained legacy prodRelease baseline',
      'scripts/androidCreateWalletSmoke.mjs',
      [],
      {
        ANDROID_SERIAL: selectedSerial,
        ANDROID_SMOKE_APK: baselineApkPath,
        ANDROID_SMOKE_PACKAGE: packageName,
        ANDROID_SMOKE_ACTIVITY: activityName,
        ANDROID_SMOKE_PIN: pin,
        ANDROID_CREATE_WALLET_STANDARD_NAME: walletName,
        ANDROID_CREATE_WALLET_VAULT_NAME: `Vault${walletName}`.slice(0, 40),
        ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME: 'secure-storage-upgrade-baseline-wallet',
      },
    );
    preUpdatePid = runAdb('read pre-update app PID', ['shell', 'pidof', packageName], { capture: true }).split(
      /\s+/,
    )[0];
    if (!preUpdatePid) {
      throw new Error('Unable to capture the baseline application PID before APK update.');
    }
  } else {
    const previousOutcome = getLineValue(previousSummary, 'Secure-storage upgrade-in-place outcome');
    const previousCandidateInstalled = getLineValue(previousSummary, 'Candidate installed with adb install -r');

    if (previousOutcome !== 'failed' || previousCandidateInstalled !== 'no') {
      throw new Error(
        'Candidate resume is allowed only after a failed validation that did not install the candidate APK.',
      );
    }
    if (!existsSync(baselineApkPath) || !baselineLegacyLinked || !preUpdatePid) {
      throw new Error('Cannot resume candidate validation without a valid baseline APK, legacy-link proof, and PID.');
    }
    const currentBaselinePid = runAdb('confirm preserved baseline app PID', ['shell', 'pidof', packageName], {
      capture: true,
    }).split(/\s+/)[0];

    if (!currentBaselinePid) {
      throw new Error('Cannot resume candidate validation because the baseline application is not running.');
    }
    preUpdatePid = currentBaselinePid;
    append(`Resuming candidate validation for preserved wallet ${walletName}.`);
  }

  clearGeneratedAutolinking();
  runNode(
    'build current Keychain-only prodRelease candidate',
    'scripts/runAndroidGradle.mjs',
    ['clean', 'assembleProdRelease', '--no-build-cache', '--rerun-tasks'],
    localReleaseBuildEnv,
  );
  if (!existsSync(generatedPackageListPath)) {
    throw new Error(`Missing generated candidate PackageList.java: ${generatedPackageListPath}`);
  }
  candidateLegacyLinked = readFileSync(generatedPackageListPath, 'utf8').includes('RNSecureKeyStorePackage');
  if (candidateLegacyLinked) {
    throw new Error('Keychain-only candidate still links RNSecureKeyStorePackage.');
  }

  runNode(
    'prepare signed Keychain-only candidate',
    'scripts/androidSmokeDevReleaseEmbedded.mjs',
    ['--variant=prod', '--prepare-only'],
    localReleaseBuildEnv,
  );
  copyFileSync(releaseConfig.signedApkPath, candidateApkPath);

  const baselineEvidence = fileEvidence(baselineApkPath);
  const candidateEvidence = fileEvidence(candidateApkPath);

  if (baselineEvidence.sha256 === candidateEvidence.sha256) {
    throw new Error('Normal baseline and fallback-disabled candidate APK digests are identical.');
  }

  runAdb('install Keychain-only candidate over baseline data', ['install', '-r', candidateApkPath]);
  candidateInstalledWithReplace = true;

  runNode('verify persisted wallet on the Keychain-only candidate', 'scripts/androidCreateWalletSmoke.mjs', [], {
    ANDROID_SERIAL: selectedSerial,
    ANDROID_SMOKE_APK: candidateApkPath,
    ANDROID_SMOKE_PACKAGE: packageName,
    ANDROID_SMOKE_ACTIVITY: activityName,
    ANDROID_SMOKE_PIN: pin,
    ANDROID_CREATE_WALLET_STANDARD_NAME: walletName,
    ANDROID_CREATE_WALLET_VAULT_NAME: `Vault${walletName}`.slice(0, 40),
    ANDROID_CREATE_WALLET_VERIFY_EXISTING_ONLY: 'true',
    ANDROID_CREATE_WALLET_PRE_RESTART_PID: preUpdatePid,
    ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME: runtimeArtifactBase,
  });
  runtimeSummary = readFileSync(runtimeSummaryPath, 'utf8');
  postUpdatePid = getLineValue(runtimeSummary, 'App PID');
  dataPreserved = getLineValue(runtimeSummary, 'Standard wallet persisted after restart') === 'yes';

  outcome = 'passed';
  reason = 'Keychain-only prodRelease unlocked migrated PIN and wallet data after adb install -r';
  writeSummary(0);
  append(`\nSecure-storage upgrade-in-place summary written to ${summaryPath}`);
  writeFileSync(logPath, `${log.join('\n')}\n`);
  clearGeneratedAutolinking();
} catch (error) {
  reason = error.message;
  append(`\n${error.message}`);
  if (existsSync(runtimeSummaryPath)) {
    runtimeSummary = readFileSync(runtimeSummaryPath, 'utf8');
    postUpdatePid = getLineValue(runtimeSummary, 'App PID');
  }
  writeSummary(1);
  clearGeneratedAutolinking();
  process.exit(1);
}
