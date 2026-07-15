import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidReleaseSmokeVariantConfig } from './androidReleaseSmokeVariant.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const summaryPath = path.join(outputDir, 'secure-storage-historical-migration-summary.txt');
const logPath = path.join(outputDir, 'secure-storage-historical-migration.log');
const seedApkPath = path.join(outputDir, 'secure-storage-historical-seed-prod-release.apk');
const migrationApkPath = path.join(outputDir, 'secure-storage-historical-migration-prod-release.apk');
const fallbackFreeApkPath = path.join(outputDir, 'secure-storage-historical-fallback-free-prod-release.apk');
const releaseConfig = getAndroidReleaseSmokeVariantConfig(root, 'prod');
const resumeSeedBuild = process.argv.includes('--resume-seed-build');
const packageName = releaseConfig.packageName;
const activityName = `${packageName}/io.goldwallet.wallet.MainActivity`;
const seedEntry = 'validation/legacySecureStorageSeedEntry.js';
const migrationProbeEntry = 'validation/legacySecureStorageMigrationProbeEntry.js';
const bundlePath = path.join(
  root,
  'android',
  'app',
  'build',
  'generated',
  'assets',
  'react',
  'prodRelease',
  'index.android.bundle',
);
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
const walletName =
  process.env.ANDROID_SECURE_STORAGE_HISTORICAL_WALLET_NAME ||
  `Historical${new Date().toISOString().replace(/\D/g, '').slice(8, 14)}`;
const pin = process.env.ANDROID_SMOKE_PIN || '1111';
const storagePassword = 'GoldWalletHistoricalMigrationFixture';
const localReleaseBuildEnv = { SENTRY_DISABLE_AUTO_UPLOAD: 'true' };
const fallbackFreeEnv = {
  ...localReleaseBuildEnv,
  GOLDWALLET_DISABLE_LEGACY_SECURE_STORAGE: '1',
};
const sdkRoot =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
const adbCommand = sdkRoot
  ? path.join(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')
  : 'adb';
const log = [];
let selectedSerial = process.env.ANDROID_SERIAL?.trim() || '';
let outcome = 'failed';
let reason = 'not completed';
let seedLegacyLinked = false;
let seedEntrySelected = false;
let seedWalletCreatedLegacyOnly = false;
let migrationLegacyLinked = false;
let migrationProductionEntryLoaded = false;
let migrationInstalled = false;
let fallbackFreeLegacyLinked = true;
let fallbackFreeNormalEntry = false;
let fallbackFreeInstalled = false;
let seedRuntimeSummary = '';
let migrationRuntimeSummary = '';
let fallbackFreeRuntimeSummary = '';
let migrationLogcat = '';

mkdirSync(outputDir, { recursive: true });

const append = line => {
  log.push(line);
  console.log(line);
};

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}:`));

  return line ? line.slice(label.length + 1).trim() : '';
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
const clearGeneratedAutolinking = () => {
  rmSync(generatedAutolinkingRoot, { recursive: true, force: true });
  rmSync(generatedAutolinkingApp, { recursive: true, force: true });
};
const fileEvidence = filePath => ({
  path: filePath,
  bytes: existsSync(filePath) ? statSync(filePath).size : 0,
  sha256: existsSync(filePath) ? createHash('sha256').update(readFileSync(filePath)).digest('hex') : '<missing>',
});
const packageListHasLegacy = () => {
  if (!existsSync(generatedPackageListPath)) {
    throw new Error(`Missing generated PackageList.java: ${generatedPackageListPath}`);
  }

  return readFileSync(generatedPackageListPath, 'utf8').includes('RNSecureKeyStorePackage');
};
const bundleContains = marker => {
  if (!existsSync(bundlePath)) throw new Error(`Missing generated release bundle: ${bundlePath}`);

  return readFileSync(bundlePath).includes(marker);
};
const buildRelease = (label, { entryFile, env = localReleaseBuildEnv } = {}) => {
  clearGeneratedAutolinking();
  const entryArgument = entryFile ? [`-PgoldwalletEntryFile=${entryFile}`] : [];

  runNode(
    label,
    'scripts/runAndroidGradle.mjs',
    ['clean', 'assembleProdRelease', '--no-build-cache', '--rerun-tasks', ...entryArgument],
    env,
  );
};
const prepareAndCopyApk = (label, destination, env = localReleaseBuildEnv) => {
  runNode(label, 'scripts/androidSmokeDevReleaseEmbedded.mjs', ['--variant=prod', '--prepare-only'], env);
  copyFileSync(releaseConfig.signedApkPath, destination);
};
const runtimeEnv = (apkPath, outputBaseName, preUpdatePid) => ({
  ANDROID_SERIAL: selectedSerial,
  ANDROID_SMOKE_APK: apkPath,
  ANDROID_SMOKE_PACKAGE: packageName,
  ANDROID_SMOKE_ACTIVITY: activityName,
  ANDROID_SMOKE_PIN: pin,
  ANDROID_CREATE_WALLET_STORAGE_PASSWORD: storagePassword,
  ANDROID_CREATE_WALLET_SMOKE_LOGCAT_LINES: '3000',
  ANDROID_CREATE_WALLET_STANDARD_NAME: walletName,
  ANDROID_CREATE_WALLET_VAULT_NAME: `Vault${walletName}`.slice(0, 40),
  ANDROID_CREATE_WALLET_VERIFY_EXISTING_ONLY: 'true',
  ANDROID_CREATE_WALLET_PRE_RESTART_PID: preUpdatePid,
  ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME: outputBaseName,
});
const runtimeSummaryPath = outputBaseName => path.join(outputDir, `${outputBaseName}-summary.txt`);
const runtimeLogcatPath = outputBaseName => path.join(outputDir, `${outputBaseName}-logcat.txt`);
const migratedAndRemoved = key => migrationLogcat.includes(`${key} has not been set`);

const writeSummary = exitCode => {
  const seed = fileEvidence(seedApkPath);
  const migration = fileEvidence(migrationApkPath);
  const fallbackFree = fileEvidence(fallbackFreeApkPath);
  const summary = [
    `Generated at: ${new Date().toISOString()}`,
    `Historical legacy migration outcome: ${outcome}`,
    `Historical legacy migration exit code: ${exitCode}`,
    `Historical legacy migration reason: ${reason}`,
    `Android serial: ${selectedSerial || 'not selected'}`,
    `Android package: ${packageName}`,
    `Persisted wallet name: ${walletName}`,
    `Seed APK path: ${seed.path}`,
    `Seed APK bytes: ${seed.bytes}`,
    `Seed APK sha256: ${seed.sha256}`,
    `Migration APK path: ${migration.path}`,
    `Migration APK bytes: ${migration.bytes}`,
    `Migration APK sha256: ${migration.sha256}`,
    `Fallback-free APK path: ${fallbackFree.path}`,
    `Fallback-free APK bytes: ${fallbackFree.bytes}`,
    `Fallback-free APK sha256: ${fallbackFree.sha256}`,
    `Seed legacy native package linked: ${seedLegacyLinked ? 'yes' : 'no'}`,
    `Seed validation entry selected: ${seedEntrySelected ? 'yes' : 'no'}`,
    `Seed wallet created in legacy backend only: ${seedWalletCreatedLegacyOnly ? 'yes' : 'no'}`,
    `Migration legacy native package linked: ${migrationLegacyLinked ? 'yes' : 'no'}`,
    `Migration production entry loaded: ${migrationProductionEntryLoaded ? 'yes' : 'no'}`,
    `Migration installed with adb install -r: ${migrationInstalled ? 'yes' : 'no'}`,
    `Legacy pin migrated and removed: ${migratedAndRemoved('pin') ? 'yes' : 'no'}`,
    `Legacy transactionPassword migrated and removed: ${migratedAndRemoved('transactionPassword') ? 'yes' : 'no'}`,
    `Legacy data_encrypted migrated and removed: ${migratedAndRemoved('data_encrypted') ? 'yes' : 'no'}`,
    `Legacy data migrated and removed: ${migratedAndRemoved('data') ? 'yes' : 'no'}`,
    `Migration unlock screen reached: ${getLineValue(migrationRuntimeSummary, 'Unlock screen reached after restart') || 'not checked'}`,
    `Migration incorrect PIN rejected: ${getLineValue(migrationRuntimeSummary, 'Incorrect PIN rejected after restart') || 'not checked'}`,
    `Migration correct PIN accepted: ${getLineValue(migrationRuntimeSummary, 'Correct PIN accepted after restart') || 'not checked'}`,
    `Migration storage password accepted: ${getLineValue(migrationRuntimeSummary, 'Storage password prompt completed') || 'not checked'}`,
    `Migration wallet card visible: ${getLineValue(migrationRuntimeSummary, 'Standard wallet persisted after restart') || 'not checked'}`,
    `Fallback-free legacy native package linked: ${fallbackFreeLegacyLinked ? 'yes' : 'no'}`,
    `Fallback-free normal entry selected: ${fallbackFreeNormalEntry ? 'yes' : 'no'}`,
    `Fallback-free installed with adb install -r: ${fallbackFreeInstalled ? 'yes' : 'no'}`,
    `Fallback-free application data preserved: ${getLineValue(fallbackFreeRuntimeSummary, 'Standard wallet persisted after restart') || 'not checked'}`,
    `Fallback-free unlock screen reached: ${getLineValue(fallbackFreeRuntimeSummary, 'Unlock screen reached after restart') || 'not checked'}`,
    `Fallback-free incorrect PIN rejected: ${getLineValue(fallbackFreeRuntimeSummary, 'Incorrect PIN rejected after restart') || 'not checked'}`,
    `Fallback-free correct PIN accepted: ${getLineValue(fallbackFreeRuntimeSummary, 'Correct PIN accepted after restart') || 'not checked'}`,
    `Fallback-free storage password accepted: ${getLineValue(fallbackFreeRuntimeSummary, 'Storage password prompt completed') || 'not checked'}`,
    `Fallback-free wallet card visible: ${getLineValue(fallbackFreeRuntimeSummary, 'Standard wallet persisted after restart') || 'not checked'}`,
    `Secure window flag after fallback-free update: ${getLineValue(fallbackFreeRuntimeSummary, 'Secure window flag after restart') || 'not checked'}`,
    `Fatal/runtime logcat findings: ${
      getLineValue(migrationRuntimeSummary, 'Fatal/runtime logcat findings') === 'no' &&
      getLineValue(fallbackFreeRuntimeSummary, 'Fatal/runtime logcat findings') === 'no'
        ? 'no'
        : 'yes'
    }`,
    `Seed App PID: ${getLineValue(seedRuntimeSummary, 'App PID') || 'not available'}`,
    `Migration App PID: ${getLineValue(migrationRuntimeSummary, 'App PID') || 'not available'}`,
    `Fallback-free App PID: ${getLineValue(fallbackFreeRuntimeSummary, 'App PID') || 'not available'}`,
  ].join('\n');

  writeFileSync(summaryPath, `${summary}\n`);
  writeFileSync(logPath, `${log.join('\n')}\n`);
};

try {
  if (!/^[A-Za-z][A-Za-z0-9_-]{2,40}$/.test(walletName)) {
    throw new Error('ANDROID_SECURE_STORAGE_HISTORICAL_WALLET_NAME must be shell-safe and contain no spaces.');
  }

  const devicesOutput = run('list Android devices', adbCommand, ['devices'], { capture: true });
  const devices = devicesOutput
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim())
    .filter(line => /\tdevice$/.test(line))
    .map(line => line.split(/\s+/)[0]);

  if (selectedSerial && !devices.includes(selectedSerial))
    throw new Error(`ANDROID_SERIAL=${selectedSerial} is not connected.`);
  if (!selectedSerial && devices.length !== 1) {
    throw new Error(`Expected exactly one connected Android device; found ${devices.length}. Set ANDROID_SERIAL.`);
  }
  selectedSerial ||= devices[0];

  if (resumeSeedBuild) {
    if (!existsSync(releaseConfig.unsignedApkPath)) {
      throw new Error('Cannot resume seed build because the unsigned prodRelease APK is missing.');
    }
    append('Resuming from the existing historical legacy-only seed prodRelease build.');
  } else {
    buildRelease('build historical legacy-only seed prodRelease', { entryFile: seedEntry });
  }
  seedLegacyLinked = packageListHasLegacy();
  seedEntrySelected = bundleContains('GOLDWALLET_LEGACY_STORAGE_SEED_ENTRY');
  if (!seedLegacyLinked || !seedEntrySelected)
    throw new Error('Seed APK does not contain the required legacy package and seed entry.');
  runNode(
    'install seed APK and create historical wallet',
    'scripts/androidCreateWalletSmokeDevReleaseEmbedded.mjs',
    ['--variant=prod'],
    {
      ANDROID_SERIAL: selectedSerial,
      ANDROID_SMOKE_PIN: pin,
      ANDROID_CREATE_WALLET_STANDARD_NAME: walletName,
      ANDROID_CREATE_WALLET_VAULT_NAME: `Vault${walletName}`.slice(0, 40),
    },
  );
  copyFileSync(releaseConfig.signedApkPath, seedApkPath);
  seedRuntimeSummary = readFileSync(runtimeSummaryPath('android-create-wallet-smoke-prod-release'), 'utf8');
  seedWalletCreatedLegacyOnly = getLineValue(seedRuntimeSummary, 'Standard wallet persisted after restart') === 'yes';
  const seedPid = getLineValue(seedRuntimeSummary, 'App PID');

  if (!seedWalletCreatedLegacyOnly || !seedPid) throw new Error('Seed release did not persist the historical wallet.');

  buildRelease('build current migration prodRelease with observation entry', { entryFile: migrationProbeEntry });
  migrationLegacyLinked = packageListHasLegacy();
  migrationProductionEntryLoaded = bundleContains('GOLDWALLET_LEGACY_STORAGE_MIGRATION_PROBE_ENTRY');
  if (!migrationLegacyLinked || !migrationProductionEntryLoaded) {
    throw new Error('Migration APK does not contain the legacy package and production-entry probe.');
  }
  prepareAndCopyApk('prepare signed current migration APK', migrationApkPath);
  runAdb('install migration APK over historical data', ['install', '-r', migrationApkPath]);
  migrationInstalled = true;
  runNode(
    'verify current release migration',
    'scripts/androidCreateWalletSmoke.mjs',
    [],
    runtimeEnv(migrationApkPath, 'secure-storage-historical-migration-runtime', seedPid),
  );
  migrationRuntimeSummary = readFileSync(runtimeSummaryPath('secure-storage-historical-migration-runtime'), 'utf8');
  migrationLogcat = readFileSync(runtimeLogcatPath('secure-storage-historical-migration-runtime'), 'utf8');
  for (const key of ['pin', 'transactionPassword', 'data_encrypted', 'data']) {
    if (!migratedAndRemoved(key)) throw new Error(`Missing successful migration removal marker for ${key}.`);
  }
  const migrationPid = getLineValue(migrationRuntimeSummary, 'App PID');

  buildRelease('build fallback-free current prodRelease', { env: fallbackFreeEnv });
  fallbackFreeLegacyLinked = packageListHasLegacy();
  fallbackFreeNormalEntry =
    !bundleContains('GOLDWALLET_LEGACY_STORAGE_SEED_ENTRY') &&
    !bundleContains('GOLDWALLET_LEGACY_STORAGE_MIGRATION_PROBE_ENTRY');
  if (fallbackFreeLegacyLinked || !fallbackFreeNormalEntry) {
    throw new Error('Fallback-free APK still links legacy storage or does not use the normal entry.');
  }
  prepareAndCopyApk('prepare signed fallback-free APK', fallbackFreeApkPath, fallbackFreeEnv);
  runAdb('install fallback-free APK over migrated data', ['install', '-r', fallbackFreeApkPath]);
  fallbackFreeInstalled = true;
  runNode(
    'verify migrated wallet without legacy fallback',
    'scripts/androidCreateWalletSmoke.mjs',
    [],
    runtimeEnv(fallbackFreeApkPath, 'secure-storage-historical-fallback-free-runtime', migrationPid),
  );
  fallbackFreeRuntimeSummary = readFileSync(
    runtimeSummaryPath('secure-storage-historical-fallback-free-runtime'),
    'utf8',
  );

  const digests = [seedApkPath, migrationApkPath, fallbackFreeApkPath].map(filePath => fileEvidence(filePath).sha256);

  if (new Set(digests).size !== digests.length) throw new Error('The three validation APK digests must differ.');

  outcome = 'passed';
  reason = 'historical legacy-only wallet migrated to Keychain and survived a fallback-free release update';
  writeSummary(0);
  clearGeneratedAutolinking();
} catch (error) {
  reason = error.message;
  append(`\n${error.message}`);
  writeSummary(1);
  clearGeneratedAutolinking();
  process.exit(1);
}
