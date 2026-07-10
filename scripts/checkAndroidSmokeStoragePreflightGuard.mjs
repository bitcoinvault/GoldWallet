import {
  readFileSync,
} from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAndroidDataStoragePreflight,
  parseAndroidDfAvailableKilobytes,
  renderAndroidDataStorageFailure,
} from './androidDataStoragePreflight.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const fail = message => {
  console.error(`Android smoke storage preflight guard failed: ${message}`);
  process.exit(1);
};

const assert = (condition, message) => {
  if (!condition) {
    fail(message);
  }
};

const dfOutput = [
  'Filesystem       1K-blocks    Used Available Use% Mounted on',
  '/dev/block/dm-55   6099200 3620412   2478788  60% /data/user/0',
].join('\n');

assert(parseAndroidDfAvailableKilobytes(dfOutput) === 2478788, 'df parser should read Available KiB');

const passed = getAndroidDataStoragePreflight({
  dfOutput,
  apkBytes: 489107121,
  multiplier: 3,
});

assert(passed.passed, 'preflight should pass when /data has enough room for the APK plus reserve');
assert(passed.requiredKilobytes === 1432932, 'required KiB should be APK bytes multiplied and rounded up');

const insufficient = getAndroidDataStoragePreflight({
  dfOutput: dfOutput.replace('2478788', '1100000'),
  apkBytes: 489107121,
  multiplier: 3,
});

assert(!insufficient.passed, 'preflight should fail when /data has insufficient room');

const message = renderAndroidDataStorageFailure({
  ...insufficient,
  apkBytes: 489107121,
  multiplier: 3,
});

assert(message.includes('emulator /data has'), 'failure message should name emulator /data');
assert(message.includes('requires at least'), 'failure message should include required free space');
assert(message.includes('uninstall old test packages'), 'failure message should include the remediation');

const smokeHelper = readFileSync(path.join(root, 'scripts', 'androidSmokeDev.mjs'), 'utf8');
const noNetworkEmbeddedWrapper = readFileSync(path.join(root, 'scripts', 'androidSmokeDevNoNetworkEmbedded.mjs'), 'utf8');
const noNetworkMetroWrapper = readFileSync(path.join(root, 'scripts', 'androidSmokeDevMetroNoNetwork.mjs'), 'utf8');

assert(
  smokeHelper.includes('ANDROID_SMOKE_UNINSTALL_BEFORE_INSTALL'),
  'smoke helper should expose the uninstall-before-install toggle',
);
assert(
  smokeHelper.includes('ANDROID_SMOKE_TRIM_CACHES_BEFORE_PREFLIGHT'),
  'smoke helper should expose the trim-caches-before-preflight toggle',
);
assert(
  smokeHelper.includes('ANDROID_SMOKE_INSTALL_TIMEOUT_MS'),
  'smoke helper should expose a dedicated APK install timeout',
);
assert(
  smokeHelper.includes('Math.max(adbCommandTimeoutMs, 180000)'),
  'smoke helper should default the APK install timeout above the global ADB command timeout',
);
assert(
  smokeHelper.includes('Using APK install timeout: ${installTimeoutMs}ms'),
  'smoke helper should log the APK install timeout',
);
assert(
  smokeHelper.includes("ANDROID_SMOKE_TRIM_CACHES_AMOUNT || '2G'"),
  'smoke helper should default trim-caches to 2G',
);
assert(
  smokeHelper.includes('Uninstalled before install: ${uninstallBeforeInstall ?'),
  'smoke summary should record whether the package was uninstalled before install',
);
assert(
  smokeHelper.includes('Package cleanup before preflight: ${packageCleanupBeforePreflight}'),
  'smoke summary should record the package cleanup result before storage preflight',
);
assert(
  smokeHelper.includes('Trimmed caches before preflight: ${trimCachesBeforePreflight ?'),
  'smoke summary should record whether package caches were trimmed before preflight',
);
assert(
  smokeHelper.includes("run('force-stop existing package before storage preflight'"),
  'smoke helper should force-stop the existing package before uninstall attempts',
);
assert(
  smokeHelper.includes("run('user-uninstall existing package before storage preflight'") &&
    smokeHelper.includes("'pm',") &&
    smokeHelper.includes("'uninstall',") &&
    smokeHelper.includes("'--user',") &&
    smokeHelper.includes("'0',"),
  'smoke helper should fall back to pm uninstall --user 0 when adb uninstall fails',
);
assert(
  smokeHelper.includes("run('clear existing package data before storage preflight'"),
  'smoke helper should fall back to pm clear when uninstall attempts fail',
);
assert(
  smokeHelper.indexOf("run('uninstall existing package before storage preflight'") <
    smokeHelper.indexOf("run('trim Android package caches before storage preflight'"),
  'smoke helper should uninstall the existing package before trimming caches',
);
assert(
  smokeHelper.indexOf("run('trim Android package caches before storage preflight'") <
    smokeHelper.indexOf('verifyDataStorageBeforeInstall();'),
  'smoke helper should trim package caches before storage preflight',
);
assert(
  smokeHelper.indexOf('verifyDataStorageBeforeInstall();') < smokeHelper.indexOf("run('install APK'"),
  'smoke helper should run storage preflight before installing the APK',
);
assert(
  /run\('install APK', \['install', '-r', apkPath\], \{\s*timeoutMs: installTimeoutMs,\s*\}\);/s.test(smokeHelper),
  'smoke helper should use the dedicated APK install timeout for adb install',
);
assert(
  noNetworkEmbeddedWrapper.includes("ANDROID_SMOKE_DATA_STORAGE_MULTIPLIER ??= '2.5'"),
  'embedded no-network smoke wrapper should use a reduced storage reserve for blocker proof',
);
assert(
  noNetworkMetroWrapper.includes("ANDROID_SMOKE_DATA_STORAGE_MULTIPLIER ??= '2.5'"),
  'Metro no-network smoke wrapper should use a reduced storage reserve for blocker proof',
);

console.log('Android smoke storage preflight guard checks are valid.');

