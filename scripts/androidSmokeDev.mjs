import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const outputPath = path.join(outputDir, 'android-smoke-dev.log');
const uiOutputPath = path.join(outputDir, 'android-smoke-dev-ui.xml');
const packageName = process.env.ANDROID_SMOKE_PACKAGE || 'io.goldwallet.wallet.dev';
const apkPath =
  process.env.ANDROID_SMOKE_APK || path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'dev', 'debug', 'app-dev-debug.apk');
const startupWaitMs = Number(process.env.ANDROID_SMOKE_WAIT_MS || 8000);
const expectedTexts = (process.env.ANDROID_SMOKE_EXPECT_TEXTS ?? 'Wallets,E2EWalletTypeTest,Send,Receive')
  .split(',')
  .map(text => text.trim())
  .filter(Boolean);

const sdkRoots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')].filter(
  Boolean,
);
const adbCandidates = [
  ...sdkRoots.map(sdkRoot => path.join(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')),
  'adb',
];
const adbCommand = adbCandidates.find(candidate => candidate === 'adb' || existsSync(candidate));
const log = [];

mkdirSync(outputDir, { recursive: true });

const append = line => {
  log.push(line);
  console.log(line);
};

const record = line => {
  log.push(line);
};

const run = (label, args, options = {}) => {
  append(`\n> ${label}`);
  const { printOutput = true, recordOutput = true, ...spawnOptions } = options;
  const result = spawnSync(adbCommand, args, {
    cwd: root,
    encoding: 'utf8',
    shell: adbCommand === 'adb' && process.platform === 'win32',
    ...spawnOptions,
  });

  if (result.stdout) {
    if (printOutput) {
      append(result.stdout.trimEnd());
    } else if (recordOutput) {
      record(result.stdout.trimEnd());
    }
  }

  if (result.stderr) {
    if (printOutput) {
      append(result.stderr.trimEnd());
    } else if (recordOutput) {
      record(result.stderr.trimEnd());
    }
  }

  if (result.error || result.status !== 0) {
    const reason = result.error?.message || `exit ${result.status}`;
    throw new Error(`${label} failed: ${reason}`);
  }

  return result.stdout || '';
};

const finish = exitCode => {
  writeFileSync(outputPath, `${log.join('\n')}\n`);
  process.exit(exitCode);
};

const sleep = milliseconds => {
  spawnSync(process.execPath, ['-e', `setTimeout(() => {}, ${milliseconds})`], { stdio: 'ignore' });
};

try {
  if (!adbCommand) {
    throw new Error('adb not found. Set ANDROID_HOME, ANDROID_SDK_ROOT, or add adb to PATH.');
  }

  if (!existsSync(apkPath)) {
    throw new Error(`APK not found: ${apkPath}. Run corepack yarn android:dev:assemble first.`);
  }

  append(`Using adb: ${adbCommand}`);
  append(`Using APK: ${apkPath}`);
  append(`Using package: ${packageName}`);

  const devicesOutput = run('adb devices', ['devices']);
  const devices = devicesOutput
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim())
    .filter(line => /\tdevice$/.test(line));

  if (devices.length === 0) {
    throw new Error('No connected Android device/emulator in device state.');
  }

  run('install dev APK', ['install', '-r', apkPath]);
  run('reverse Metro port', ['reverse', 'tcp:8081', 'tcp:8081']);
  run('clear logcat', ['logcat', '-c']);
  run('force-stop app', ['shell', 'am', 'force-stop', packageName]);
  run('launch app', ['shell', 'monkey', '-p', packageName, '-c', 'android.intent.category.LAUNCHER', '1']);

  append(`\nWaiting ${startupWaitMs}ms for startup logs...`);
  sleep(startupWaitMs);

  const pidOutput = run('read app pid', ['shell', 'pidof', packageName], { printOutput: false }).trim();
  const appPid = pidOutput.split(/\s+/).find(Boolean);

  if (!appPid) {
    throw new Error(`Unable to find running process for ${packageName} after launch.`);
  }

  append(`App PID: ${appPid}`);

  const logcat = run('read app startup logcat', ['logcat', '-d', '--pid', appPid, '-t', '400'], { printOutput: false });
  append(`Captured ${logcat.split(/\r?\n/).filter(Boolean).length} recent logcat lines.`);
  const failingLines = logcat
    .split(/\r?\n/)
    .filter(line => /AndroidRuntime|FATAL EXCEPTION|ReactNativeJS.*(Error|TypeError|ReferenceError)|E ReactNative/.test(line));

  if (failingLines.length > 0) {
    append('\nStartup smoke found fatal/runtime logcat lines:');
    failingLines.forEach(line => append(line));
    finish(1);
  }

  const windowOutput = run('read focused window', ['shell', 'dumpsys', 'window'], { printOutput: false, recordOutput: false });

  if (!windowOutput.includes(packageName)) {
    throw new Error(`Focused window output does not include ${packageName}.`);
  }

  append(`Focused window includes ${packageName}.`);

  run('dump UI hierarchy', ['shell', 'uiautomator', 'dump', '/sdcard/goldwallet-window.xml']);
  const uiHierarchy = run('read UI hierarchy', ['exec-out', 'cat', '/sdcard/goldwallet-window.xml'], { printOutput: false, recordOutput: false });
  writeFileSync(uiOutputPath, uiHierarchy);
  append(`UI hierarchy written to ${uiOutputPath}`);

  const missingTexts = expectedTexts.filter(text => !uiHierarchy.includes(`text="${text}"`));

  if (missingTexts.length > 0) {
    throw new Error(`UI hierarchy is missing expected text(s): ${missingTexts.join(', ')}`);
  }

  if (expectedTexts.length > 0) {
    append(`Found expected UI text(s): ${expectedTexts.join(', ')}`);
  }

  append('\nAndroid dev smoke helper completed without fatal/runtime logcat findings.');
  finish(0);
} catch (error) {
  append(`\n${error.message}`);
  finish(1);
}
