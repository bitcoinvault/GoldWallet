import { spawnSync } from 'child_process';
import { randomUUID } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidReleaseSmokeVariantConfig } from './androidReleaseSmokeVariant.mjs';
import { getFileEvidence, sha256File, sha256MigrationInputs } from './secureStorageFirstPartyMigrationEvidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'local-docs');
const summaryPath = path.join(outputDir, 'secure-storage-first-party-migration-summary.txt');
const logPath = path.join(outputDir, 'secure-storage-first-party-migration.log');
const candidateApkPath = path.join(outputDir, 'secure-storage-first-party-migration-prod-release.apk');
const checkpointPath = path.join(outputDir, 'secure-storage-first-party-migration-checkpoint.json');
const seedApkPath = path.resolve(process.env.ANDROID_SECURE_STORAGE_HISTORICAL_SEED_APK || '');
const releaseConfig = getAndroidReleaseSmokeVariantConfig(root, 'prod');
const packageName = releaseConfig.packageName;
const activityName = `${packageName}/io.goldwallet.wallet.MainActivity`;
const candidateEntry = 'validation/legacySecureStorageMigrationProbeEntry.js';
const resumeCandidateInstall = process.argv.includes('--resume-candidate-install');
const candidateBundlePath = path.join(root, 'android', 'app', 'build', 'generated', 'assets', 'react', 'prodRelease', 'index.android.bundle');
const packageListPath = path.join(
  root,
  'android',
  'app',
  'build',
  'generated',
  'autolinking',
  'src',
  'main',
  'java',
  'com',
  'facebook',
  'react',
  'PackageList.java',
);
let walletName = process.env.ANDROID_SECURE_STORAGE_HISTORICAL_WALLET_NAME || `Bridge${Date.now().toString().slice(-8)}`;
const pin = process.env.ANDROID_SMOKE_PIN || '1111';
const storagePassword = 'GoldWalletHistoricalMigrationFixture';
const sdkRoot =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
const adb = sdkRoot ? path.join(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : 'adb';
const log = [];
let selectedSerial = process.env.ANDROID_SERIAL?.trim() || '';
let outcome = 'failed';
let reason = 'not completed';
let candidateInstalled = false;
let seedWalletPersisted = false;
let candidateUsesBridge = false;
let candidateExcludesThirdParty = false;
let candidateRuntimeSummary = '';
let candidateRuntimeLogcat = '';
let seedPid = '';
let validationRunId = randomUUID();
const migrationSourceSha256 = sha256MigrationInputs(root);

mkdirSync(outputDir, { recursive: true });

const append = line => {
  log.push(line);
  console.log(line);
};

const lineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const run = (label, command, args, env = {}, capture = false) => {
  append(`\n> ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    shell: process.platform === 'win32' && /\.(bat|cmd)$/i.test(command),
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (capture && result.stdout?.trim()) append(result.stdout.trim());
  if (capture && result.stderr?.trim()) append(result.stderr.trim());
  if (result.error || result.status !== 0) throw new Error(`${label} failed: ${result.error?.message || `exit ${result.status}`}`);
  return result.stdout?.trim() || '';
};

const runNode = (label, script, args = [], env = {}) => run(label, process.execPath, [path.join(root, script), ...args], env);
const runAdb = (label, args, capture = false) => run(label, adb, [...(selectedSerial ? ['-s', selectedSerial] : []), ...args], {}, capture);
const migratedAndRemoved = key =>
  candidateRuntimeLogcat.includes(`GOLDWALLET_LEGACY_MIGRATION_REMOVED:${key}`) &&
  candidateRuntimeLogcat.includes(`GOLDWALLET_LEGACY_MIGRATION_ABSENT:${key}:yes`);
const migrationInstrumented = key =>
  candidateRuntimeLogcat.includes(`GOLDWALLET_LEGACY_MIGRATION_FOUND:${key}`) &&
  candidateRuntimeLogcat.includes(`GOLDWALLET_LEGACY_MIGRATION_MIGRATED:${key}`) &&
  migratedAndRemoved(key);
const migrationKeys = ['pin', 'transactionPassword', 'data_encrypted', 'data'];

const installedPackageSha256 = () => {
  const packagePaths = runAdb('read installed historical seed APK path', ['shell', 'pm', 'path', packageName], true)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('package:'));
  const baseApk = packagePaths.map(line => line.slice('package:'.length)).find(candidate => candidate.endsWith('/base.apk'));

  if (!baseApk) throw new Error('Installed historical seed base APK path is unavailable.');
  const output = runAdb('hash installed historical seed APK', ['shell', 'sha256sum', baseApk], true);
  const installedSha256 = output.split(/\s+/)[0]?.toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(installedSha256 || '')) {
    throw new Error('Installed historical seed APK SHA-256 is unavailable.');
  }

  return installedSha256;
};

const ensureSeedProcess = () => {
  let pid = runAdb('read historical seed app PID', ['shell', 'pidof', packageName], true).trim();

  if (!pid) {
    runAdb('launch historical seed app for migration handoff', ['shell', 'am', 'start', '-W', '-n', activityName], true);
    pid = runAdb('read launched historical seed app PID', ['shell', 'pidof', packageName], true).trim();
  }

  if (!pid) throw new Error('Historical seed app process is unavailable after launch.');
  return pid;
};

const writeSummary = exitCode => {
  const seed = getFileEvidence(seedApkPath);
  const candidate = getFileEvidence(candidateApkPath);
  const summary = [
    'Secure-storage first-party migration validation',
    `Generated at: ${new Date().toISOString()}`,
    `Outcome: ${outcome}`,
    `Exit code: ${exitCode}`,
    `Validation run id: ${validationRunId}`,
    `Migration source sha256: ${migrationSourceSha256}`,
    `Reason: ${reason}`,
    `Android serial: ${selectedSerial || '<not selected>'}`,
    `Android package: ${packageName}`,
    `Seed APK present: ${seed.present ? 'yes' : 'no'}`,
    `Seed APK bytes: ${seed.bytes}`,
    `Seed APK sha256: ${seed.sha256}`,
    `Candidate APK present: ${candidate.present ? 'yes' : 'no'}`,
    `Candidate APK bytes: ${candidate.bytes}`,
    `Candidate APK sha256: ${candidate.sha256}`,
    `Seed wallet persisted: ${seedWalletPersisted ? 'yes' : 'no'}`,
    `Candidate installed with adb install -r: ${candidateInstalled ? 'yes' : 'no'}`,
    `Candidate uses first-party migration bridge: ${candidateUsesBridge ? 'yes' : 'no'}`,
    `Candidate excludes third-party legacy package: ${candidateExcludesThirdParty ? 'yes' : 'no'}`,
    `PIN migrated and removed: ${migratedAndRemoved('pin') ? 'yes' : 'no'}`,
    `Transaction password migrated and removed: ${migratedAndRemoved('transactionPassword') ? 'yes' : 'no'}`,
    `Encrypted flag migrated and removed: ${migratedAndRemoved('data_encrypted') ? 'yes' : 'no'}`,
    `Wallet data migrated and removed: ${migratedAndRemoved('data') ? 'yes' : 'no'}`,
    `Wallet accessible after candidate update: ${lineValue(candidateRuntimeSummary, 'Standard wallet persisted after restart') || 'no'}`,
    `Incorrect PIN rejected after candidate update: ${lineValue(candidateRuntimeSummary, 'Incorrect PIN rejected after restart') || 'no'}`,
    `Correct PIN accepted after candidate update: ${lineValue(candidateRuntimeSummary, 'Correct PIN accepted after restart') || 'no'}`,
    `Storage password accepted after candidate update: ${lineValue(candidateRuntimeSummary, 'Storage password prompt completed') || 'no'}`,
    `Legacy cleanup evidence derived from runtime: ${migrationKeys.every(migratedAndRemoved) ? 'yes' : 'no'}`,
    `Legacy fallback instrumentation observed: ${migrationKeys.every(migrationInstrumented) ? 'yes' : 'no'}`,
    `Fatal/runtime logcat findings: ${lineValue(candidateRuntimeSummary, 'Fatal/runtime logcat findings') || 'not checked'}`,
    `Secret values printed: ${[pin, storagePassword].some(secret => `${log.join('\n')}\n${candidateRuntimeLogcat}`.includes(secret)) ? 'yes' : 'no'}`,
    'Required action: keep the first-party migration bridge through a validated cross-platform rollout window.',
    '',
  ].join('\n');
  writeFileSync(summaryPath, summary);
  writeFileSync(logPath, `${log.join('\n')}\n`);
};

try {
  if (!process.env.ANDROID_SECURE_STORAGE_HISTORICAL_SEED_APK) {
    throw new Error('Set ANDROID_SECURE_STORAGE_HISTORICAL_SEED_APK to the ignored historical seed APK.');
  }
  if (!existsSync(seedApkPath)) throw new Error(`Historical seed APK does not exist: ${seedApkPath}`);
  if (!/^[a-f0-9]{64}$/.test(migrationSourceSha256)) throw new Error('Migration input hash could not be calculated.');
  if (!/^[A-Za-z][A-Za-z0-9_-]{2,40}$/.test(walletName)) throw new Error('Historical wallet name must be shell-safe.');

  const devices = run('list Android devices', adb, ['devices'], {}, true)
    .split(/\r?\n/)
    .slice(1)
    .filter(line => /\tdevice$/.test(line))
    .map(line => line.trim().split(/\s+/)[0]);
  if (!selectedSerial && devices.length !== 1) throw new Error(`Expected one connected Android device; found ${devices.length}.`);
  selectedSerial ||= devices[0];
  if (!devices.includes(selectedSerial)) throw new Error(`ANDROID_SERIAL=${selectedSerial} is not connected.`);

  if (resumeCandidateInstall) {
    append('Resuming from a verified historical-seed checkpoint and existing migration candidate.');
    const seedSummaryPath = path.join(outputDir, 'secure-storage-first-party-seed-wallet-summary.txt');
    if (!existsSync(seedSummaryPath) || !existsSync(candidateApkPath) || !existsSync(checkpointPath)) {
      throw new Error('Resume requires the seed wallet summary, checkpoint, and migration candidate APK from a previous run.');
    }
    const checkpoint = JSON.parse(readFileSync(checkpointPath, 'utf8'));
    const expectedCheckpoint = {
      stage: 'candidate-built-seed-installed',
      androidSerial: selectedSerial,
      androidPackage: packageName,
      seedApkSha256: sha256File(seedApkPath),
      candidateApkSha256: sha256File(candidateApkPath),
      migrationSourceSha256,
    };

    for (const [field, expectedValue] of Object.entries(expectedCheckpoint)) {
      if (checkpoint[field] !== expectedValue) throw new Error(`Resume checkpoint ${field} does not match current evidence.`);
    }
    if (!/^[a-f0-9-]{36}$/.test(checkpoint.validationRunId || '')) throw new Error('Resume checkpoint run id is invalid.');
    validationRunId = checkpoint.validationRunId;
    const seedSummary = readFileSync(seedSummaryPath, 'utf8');
    seedWalletPersisted = lineValue(seedSummary, 'Standard wallet persisted after restart') === 'yes';
    walletName = checkpoint.walletName;
    if (!seedWalletPersisted || lineValue(seedSummary, 'Standard wallet name') !== walletName) {
      throw new Error('Persisted historical seed wallet does not match the resume checkpoint.');
    }
    if (installedPackageSha256() !== checkpoint.seedApkSha256) {
      throw new Error('Installed app is not the historical seed APK recorded by the resume checkpoint.');
    }
    seedPid = ensureSeedProcess();
  } else {
    runNode('install and smoke historical seed APK', 'scripts/androidSmokeDevReleaseEmbedded.mjs', ['--variant=prod'], {
      ANDROID_SERIAL: selectedSerial,
      ANDROID_SMOKE_APK: seedApkPath,
      ANDROID_SMOKE_SOURCE_APK: seedApkPath,
      ANDROID_SMOKE_OUTPUT_BASENAME: 'secure-storage-first-party-seed-smoke',
    });
    runNode('create legacy-only wallet fixture', 'scripts/androidCreateWalletSmoke.mjs', [], {
      ANDROID_SERIAL: selectedSerial,
      ANDROID_SMOKE_APK: seedApkPath,
      ANDROID_SMOKE_PACKAGE: packageName,
      ANDROID_SMOKE_ACTIVITY: activityName,
      ANDROID_SMOKE_PIN: pin,
      ANDROID_CREATE_WALLET_STANDARD_NAME: walletName,
      ANDROID_CREATE_WALLET_VAULT_NAME: `Vault${walletName}`.slice(0, 40),
      ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME: 'secure-storage-first-party-seed-wallet',
    });
    const seedSummary = readFileSync(path.join(outputDir, 'secure-storage-first-party-seed-wallet-summary.txt'), 'utf8');
    seedWalletPersisted = lineValue(seedSummary, 'Standard wallet persisted after restart') === 'yes';
    seedPid = lineValue(seedSummary, 'App PID');
    if (!seedWalletPersisted || !seedPid) throw new Error('Historical seed wallet did not persist.');

    runNode(
      'build current prodRelease migration candidate',
      'scripts/runAndroidGradle.mjs',
      [':app:assembleProdRelease', '-x', 'lint', '--rerun-tasks', `-PgoldwalletEntryFile=${candidateEntry}`],
      { SENTRY_DISABLE_AUTO_UPLOAD: 'true' },
    );
    runNode('prepare signed current migration candidate', 'scripts/androidSmokeDevReleaseEmbedded.mjs', ['--variant=prod', '--prepare-only'], {
      SENTRY_DISABLE_AUTO_UPLOAD: 'true',
    });
    copyFileSync(releaseConfig.signedApkPath, candidateApkPath);
    if (sha256MigrationInputs(root) !== migrationSourceSha256) {
      throw new Error('Migration inputs changed while the candidate APK was being built.');
    }
    const seedApkSha256 = sha256File(seedApkPath);
    if (installedPackageSha256() !== seedApkSha256) {
      throw new Error('Installed app does not match the historical seed APK.');
    }
    writeFileSync(
      checkpointPath,
      `${JSON.stringify(
        {
          stage: 'candidate-built-seed-installed',
          validationRunId,
          androidSerial: selectedSerial,
          androidPackage: packageName,
          walletName,
          seedApkSha256,
          candidateApkSha256: sha256File(candidateApkPath),
          migrationSourceSha256,
        },
        null,
        2,
      )}\n`,
    );
  }

  const packageList = readFileSync(packageListPath, 'utf8');
  const candidateBundle = readFileSync(candidateBundlePath, 'utf8');
  candidateUsesBridge = candidateBundle.includes('GOLDWALLET_LEGACY_STORAGE_MIGRATION_PROBE_ENTRY');
  candidateExcludesThirdParty = !packageList.includes('RNSecureKeyStorePackage');
  if (!candidateUsesBridge || !candidateExcludesThirdParty) throw new Error('Candidate bridge/package linkage is invalid.');

  runAdb('trim package caches before migration update', ['shell', 'pm', 'trim-caches', '2G'], true);
  runAdb('install migration candidate over historical data', ['install', '-r', candidateApkPath], true);
  candidateInstalled = true;
  runNode('verify migrated wallet through the current release', 'scripts/androidCreateWalletSmoke.mjs', [], {
    ANDROID_SERIAL: selectedSerial,
    ANDROID_SMOKE_APK: candidateApkPath,
    ANDROID_SMOKE_PACKAGE: packageName,
    ANDROID_SMOKE_ACTIVITY: activityName,
    ANDROID_SMOKE_PIN: pin,
    ANDROID_CREATE_WALLET_STORAGE_PASSWORD: storagePassword,
    ANDROID_CREATE_WALLET_STANDARD_NAME: walletName,
    ANDROID_CREATE_WALLET_VAULT_NAME: `Vault${walletName}`.slice(0, 40),
    ANDROID_CREATE_WALLET_VERIFY_EXISTING_ONLY: 'true',
    ANDROID_CREATE_WALLET_PRE_RESTART_PID: seedPid,
    ANDROID_CREATE_WALLET_SMOKE_LOGCAT_LINES: '3000',
    ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME: 'secure-storage-first-party-migration-runtime',
  });
  candidateRuntimeSummary = readFileSync(path.join(outputDir, 'secure-storage-first-party-migration-runtime-summary.txt'), 'utf8');
  candidateRuntimeLogcat = readFileSync(path.join(outputDir, 'secure-storage-first-party-migration-runtime-logcat.txt'), 'utf8');

  for (const key of migrationKeys) {
    if (!migratedAndRemoved(key)) throw new Error(`Missing migration and cleanup evidence for ${key}.`);
  }
  if (lineValue(candidateRuntimeSummary, 'Standard wallet persisted after restart') !== 'yes') {
    throw new Error('Migrated wallet is not accessible after the candidate update.');
  }

  outcome = 'passed';
  reason = 'historical Android secure-storage values migrated through the first-party bridge';
  writeSummary(0);
  console.log(`Secure-storage first-party migration summary written to ${path.relative(root, summaryPath)}`);
} catch (error) {
  reason = error.message;
  append(`\nValidation failed: ${reason}`);
  writeSummary(1);
  console.error(`Secure-storage first-party migration validation failed: ${reason}`);
  process.exit(1);
}
