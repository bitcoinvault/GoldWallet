import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { formatAdbFailureReason, runAdbProcessWithRetry } from './androidAdbRetry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const requestedOutputBaseName =
  process.env.ANDROID_IMPORT_WALLET_SMOKE_OUTPUT_BASENAME || 'android-import-wallet-smoke';
const isSafeOutputBaseName = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(requestedOutputBaseName);
const outputBaseName = isSafeOutputBaseName ? requestedOutputBaseName : 'android-import-wallet-smoke';
const outputPath = path.join(outputDir, `${outputBaseName}.log`);
const summaryOutputPath = path.join(outputDir, `${outputBaseName}-summary.txt`);
const uiOutputPath = path.join(outputDir, `${outputBaseName}-ui.xml`);
const logcatOutputPath = path.join(outputDir, `${outputBaseName}-logcat.txt`);
const screenshotOutputPath = path.join(outputDir, `${outputBaseName}.png`);
const packageName = process.env.ANDROID_SMOKE_PACKAGE || 'io.goldwallet.wallet.dev';
const activityName = process.env.ANDROID_SMOKE_ACTIVITY || `${packageName}/io.goldwallet.wallet.MainActivity`;
const apkPath =
  process.env.ANDROID_SMOKE_APK ||
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'dev', 'debug', 'app-dev-debug.apk');
const fixtureAddress = 'royale1q3c4dwjwr4k9f40tdy373zy4mmuwd52p95ell7u';
const walletName =
  process.env.ANDROID_IMPORT_WALLET_NAME || `ImportSmoke${new Date().toISOString().replace(/\D/g, '').slice(8, 14)}`;
const androidSerial = process.env.ANDROID_SERIAL?.trim();
let selectedAndroidSerial = androidSerial;
const adbCommandTimeoutMs = Number(process.env.ANDROID_SMOKE_ADB_TIMEOUT_MS || 60000);
const uiWaitMs = Number(process.env.ANDROID_IMPORT_WALLET_SMOKE_UI_WAIT_MS || 150000);
const uiPollIntervalMs = Number(process.env.ANDROID_IMPORT_WALLET_SMOKE_UI_POLL_INTERVAL_MS || 1500);
const logcatLineLimit = Number(process.env.ANDROID_IMPORT_WALLET_SMOKE_LOGCAT_LINES || 1600);
const unlockPin = process.env.ANDROID_SMOKE_PIN || '1111';

const sdkRoots = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
].filter(Boolean);
const adbCandidates = [
  ...sdkRoots.map(sdkRoot => path.join(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')),
  'adb',
];
const adbCommand = adbCandidates.find(candidate => candidate === 'adb' || existsSync(candidate));

const log = [];
let smokeOutcome = 'failed';
let smokeReason = 'not completed';
let appPid = '';
let preRestartAppPid = '';
let importSuccessScreenReached = false;
let importedWalletVisible = false;
let appProcessRestartCompleted = false;
let unlockScreenReachedAfterRestart = false;
let incorrectPinRejectedAfterRestart = false;
let importedWalletVisibleAfterRestart = false;
let noErrorUi = false;
let secureWindowFlagAfterImport = 'not checked';
let secureWindowFlagAfterRestart = 'not checked';
let fatalRuntimeLogcatFindings = 'not checked';
let screenshotBytes = 0;
let capturedLogcatLines = 0;

mkdirSync(outputDir, { recursive: true });

const append = line => {
  log.push(line);
  console.log(line);
};

const sleep = milliseconds => {
  spawnSync(process.execPath, ['-e', `setTimeout(() => {}, ${milliseconds})`], { stdio: 'ignore' });
};

const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

const fileEvidence = filePath => {
  if (!filePath || !existsSync(filePath)) {
    return { path: filePath || '<missing>', bytes: 0, sha256: '<missing>' };
  }

  return { path: filePath, bytes: statSync(filePath).size, sha256: fileSha256(filePath) };
};

const run = (label, args, options = {}) => {
  append(`\n> ${label}`);
  const { allowDumpSuccessOutput = false, printOutput = true, useSelectedDevice = true, ...spawnOptions } = options;
  const result = runAdbProcessWithRetry({
    adbCommand,
    args,
    root,
    selectedAndroidSerial,
    useSelectedDevice,
    timeoutMs: adbCommandTimeoutMs,
    spawnOptions,
    append,
  });

  if (result.stdout && printOutput) {
    append(result.stdout.trimEnd());
  }
  if (result.stderr && printOutput) {
    append(result.stderr.trimEnd());
  }

  if (result.error || result.status !== 0) {
    if (allowDumpSuccessOutput && /UI hier\S* dumped to:/i.test(result.stdout || '')) {
      append(`${label} returned non-zero after writing the hierarchy; reading the dumped file.`);
      return result.stdout || '';
    }

    throw new Error(`${label} failed: ${formatAdbFailureReason(result)}`);
  }

  return result.stdout || '';
};

const runBinary = (label, args, outputFile) => {
  append(`\n> ${label}`);
  const result = runAdbProcessWithRetry({
    adbCommand,
    args,
    root,
    selectedAndroidSerial,
    timeoutMs: adbCommandTimeoutMs,
    encoding: 'buffer',
    append,
  });

  if (result.error || result.status !== 0 || !result.stdout?.length) {
    throw new Error(`${label} failed: ${formatAdbFailureReason(result)}`);
  }

  writeFileSync(outputFile, result.stdout);
  screenshotBytes = result.stdout.length;
  append(`${label} written to ${outputFile} (${result.stdout.length} bytes)`);
};

const writeSummary = exitCode => {
  const apkEvidence = fileEvidence(apkPath);
  const summary = [
    `Generated at: ${new Date().toISOString()}`,
    `Android import-wallet smoke outcome: ${smokeOutcome}`,
    `Android import-wallet smoke exit code: ${exitCode}`,
    `Android import-wallet smoke reason: ${smokeReason}`,
    `Android serial: ${selectedAndroidSerial || 'not selected'}`,
    `Android package: ${packageName}`,
    `Android activity: ${activityName}`,
    `Artifact base: ${outputBaseName}`,
    `Source APK path: ${apkEvidence.path}`,
    `Source APK bytes: ${apkEvidence.bytes}`,
    `Source APK sha256: ${apkEvidence.sha256}`,
    'Import fixture type: public-watch-only-address',
    `Import fixture address: ${fixtureAddress}`,
    `Imported wallet name: ${walletName}`,
    `Import success screen reached: ${importSuccessScreenReached ? 'yes' : 'no'}`,
    `Imported wallet visible on dashboard: ${importedWalletVisible ? 'yes' : 'no'}`,
    `App process restart completed: ${appProcessRestartCompleted ? 'yes' : 'no'}`,
    `Unlock screen reached after restart: ${unlockScreenReachedAfterRestart ? 'yes' : 'no'}`,
    `Incorrect PIN rejected after restart: ${incorrectPinRejectedAfterRestart ? 'yes' : 'no'}`,
    `Imported wallet visible after restart: ${importedWalletVisibleAfterRestart ? 'yes' : 'no'}`,
    `No import-wallet error UI: ${noErrorUi ? 'yes' : 'no'}`,
    `Secure window flag after import: ${secureWindowFlagAfterImport}`,
    `Secure window flag after restart: ${secureWindowFlagAfterRestart}`,
    `Fatal/runtime logcat findings: ${fatalRuntimeLogcatFindings}`,
    `Pre-restart App PID: ${preRestartAppPid || 'not available'}`,
    `App PID: ${appPid || 'not available'}`,
    `Captured logcat lines: ${capturedLogcatLines}`,
    `UI hierarchy path: ${uiOutputPath}`,
    `Logcat path: ${logcatOutputPath}`,
    `Screenshot path: ${screenshotOutputPath}`,
    `Screenshot bytes: ${screenshotBytes}`,
  ].join('\n');

  writeFileSync(summaryOutputPath, `${summary}\n`);
};

const finish = exitCode => {
  writeSummary(exitCode);
  append(`Android import-wallet smoke summary written to ${summaryOutputPath}`);
  writeFileSync(outputPath, `${log.join('\n')}\n`);
  process.exit(exitCode);
};

const selectDevice = () => {
  if (selectedAndroidSerial) {
    return;
  }

  const output = run('list Android devices', ['devices'], { useSelectedDevice: false });
  const devices = output
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(([, state]) => state === 'device')
    .map(([serial]) => serial);

  if (devices.length !== 1) {
    throw new Error(`Expected exactly one online Android device, found ${devices.length}. Set ANDROID_SERIAL.`);
  }

  [selectedAndroidSerial] = devices;
  append(`Selected Android device: ${selectedAndroidSerial}`);
};

const readUiHierarchy = label => {
  run(`dump UI hierarchy ${label}`, ['shell', 'uiautomator', 'dump', '/sdcard/goldwallet-import-wallet-window.xml'], {
    allowDumpSuccessOutput: true,
  });
  const hierarchy = run(
    `read UI hierarchy ${label}`,
    ['exec-out', 'cat', '/sdcard/goldwallet-import-wallet-window.xml'],
    { printOutput: false },
  );

  writeFileSync(uiOutputPath, hierarchy);
  return hierarchy;
};

const getNodeByMarker = (uiHierarchy, marker) => {
  const markerIndex = uiHierarchy.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const nodeStart = uiHierarchy.lastIndexOf('<node', markerIndex);
  const nodeEnd = uiHierarchy.indexOf('>', markerIndex);

  if (nodeStart === -1 || nodeEnd === -1) {
    return null;
  }

  const node = uiHierarchy.slice(nodeStart, nodeEnd + 1);
  const boundsMatch = node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);

  return {
    enabled: /enabled="true"/.test(node),
    bounds: boundsMatch ? boundsMatch.slice(1).map(Number) : null,
  };
};

const getNodeByResourceId = (uiHierarchy, resourceId) => getNodeByMarker(uiHierarchy, `resource-id="${resourceId}"`);
const getNodeByContentDescription = (uiHierarchy, description) =>
  getNodeByMarker(uiHierarchy, `content-desc="${String(description).replace(/"/g, '&quot;')}"`);

const tapNodeCenter = node => {
  if (!node?.bounds) {
    throw new Error('Unable to tap UI node without bounds.');
  }
  const [left, top, right, bottom] = node.bounds;

  run('tap UI node', [
    'shell',
    'input',
    'tap',
    String(Math.round((left + right) / 2)),
    String(Math.round((top + bottom) / 2)),
  ]);
};

const tapResourceId = (label, hierarchy, resourceId) => {
  const node = getNodeByResourceId(hierarchy, resourceId);

  if (!node) {
    throw new Error(`${label} cannot find resource ID: ${resourceId}`);
  }
  if (!node.enabled) {
    throw new Error(`${label} resource ID is disabled: ${resourceId}`);
  }
  append(`${label}: tapping ${resourceId}`);
  tapNodeCenter(node);
};

const hasImportError = hierarchy =>
  [
    'resource-id="error-message"',
    'text="Error"',
    'Wrong mnemonic',
    'No transactions found on the wallet',
    'No network',
    'TypeError',
    'ReferenceError',
    'SyntaxError',
  ].some(marker => hierarchy.includes(marker));

const assertNoImportError = hierarchy => {
  if (hasImportError(hierarchy)) {
    throw new Error('Import-wallet error UI is visible.');
  }
};

const waitForResourceIds = (label, resourceIds, { failOnImportError = true } = {}) => {
  const deadline = Date.now() + uiWaitMs;
  let attempt = 0;
  let hierarchy = '';
  let missingResourceIds = resourceIds;

  do {
    attempt += 1;
    hierarchy = readUiHierarchy(`${label} attempt ${attempt}`);
    if (failOnImportError) {
      assertNoImportError(hierarchy);
    }
    missingResourceIds = resourceIds.filter(resourceId => !hierarchy.includes(`resource-id="${resourceId}"`));
    if (missingResourceIds.length === 0) {
      append(`Found ${label} resource ID(s): ${resourceIds.join(', ')}`);
      return hierarchy;
    }
    if (Date.now() < deadline) {
      append(`${label} missing resource ID(s): ${missingResourceIds.join(', ')}; retrying...`);
      sleep(uiPollIntervalMs);
    }
  } while (Date.now() < deadline);

  throw new Error(`${label} is missing expected resource ID(s): ${missingResourceIds.join(', ')}`);
};

const waitForImportSuccessScreen = () => {
  const deadline = Date.now() + uiWaitMs;
  let attempt = 0;
  let hierarchy = '';

  do {
    attempt += 1;
    hierarchy = readUiHierarchy(`import success screen attempt ${attempt}`);
    assertNoImportError(hierarchy);
    const hasImportSuccessText = hierarchy.includes('You have successfully imported your wallet.');
    const hasSuccessImage = hierarchy.includes('resource-id="success-message"');
    const hasCloseButton = hierarchy.includes('resource-id="message-close-button"');

    if (hasImportSuccessText && hasSuccessImage && hasCloseButton) {
      append('Found the import-specific success message and close button.');
      return hierarchy;
    }

    if (Date.now() < deadline) {
      append('Import-specific success screen is not visible yet; retrying...');
      sleep(uiPollIntervalMs);
    }
  } while (Date.now() < deadline);

  throw new Error('Import-specific success screen did not become visible.');
};

const enterText = (label, hierarchy, resourceId, value) => {
  tapResourceId(label, hierarchy, resourceId);
  sleep(400);
  run(`${label}: enter text`, ['shell', 'input', 'text', value], { printOutput: false });
  sleep(500);
  run(`${label}: hide keyboard`, ['shell', 'input', 'keyevent', '111'], { printOutput: false });
  sleep(600);
};

const unlockIfNeeded = (hierarchy, { requireUnlock = false } = {}) => {
  if (!hierarchy.includes('resource-id="unlock-screen-logo"')) {
    if (requireUnlock) {
      throw new Error('Unlock screen was not reached after restarting the app process.');
    }
    return hierarchy;
  }

  if (requireUnlock) {
    unlockScreenReachedAfterRestart = true;

    const wrongFinalDigit = unlockPin.at(-1) === '9' ? '0' : String(Number(unlockPin.at(-1)) + 1);
    const incorrectPin = `${unlockPin.slice(0, -1)}${wrongFinalDigit}`;

    append('Unlock screen detected; verifying that an incorrect PIN is rejected.');
    for (const digit of incorrectPin) {
      const node = getNodeByContentDescription(hierarchy, digit);

      if (!node?.enabled) {
        throw new Error(`Unable to find enabled incorrect PIN digit ${digit}.`);
      }
      tapNodeCenter(node);
      sleep(250);
      hierarchy = readUiHierarchy(`after incorrect unlock digit ${digit}`);
    }
    sleep(500);
    hierarchy = readUiHierarchy('after incorrect unlock PIN');
    if (!hierarchy.includes('resource-id="unlock-screen-logo"')) {
      throw new Error('App left the unlock screen after an incorrect test PIN.');
    }
    incorrectPinRejectedAfterRestart = true;
  }

  append('Entering the configured test PIN.');
  for (const digit of unlockPin) {
    if (!/^\d$/.test(digit)) {
      throw new Error('ANDROID_SMOKE_PIN must contain digits only.');
    }
    const node = getNodeByContentDescription(hierarchy, digit);

    if (!node?.enabled) {
      throw new Error(`Unable to find enabled PIN digit ${digit}.`);
    }
    tapNodeCenter(node);
    sleep(250);
    hierarchy = readUiHierarchy(`after unlock digit ${digit}`);
  }
  sleep(2500);
  const unlockedHierarchy = readUiHierarchy('after unlock PIN');

  if (unlockedHierarchy.includes('resource-id="unlock-screen-logo"')) {
    throw new Error('Unlock screen is still visible after entering the test PIN.');
  }

  return unlockedHierarchy;
};

const readAppPid = label => {
  const pid = run(label, ['shell', 'pidof', packageName], { printOutput: false }).trim().split(/\s+/)[0] || '';

  if (!pid) {
    throw new Error(`Unable to find running process for ${packageName}.`);
  }

  return pid;
};

const captureLogcat = () => {
  appPid = readAppPid('read app pid');

  const logcat = run('read import-wallet logcat', ['logcat', '-d', '--pid', appPid, '-t', String(logcatLineLimit)], {
    printOutput: false,
  });

  writeFileSync(logcatOutputPath, logcat);
  capturedLogcatLines = logcat.split(/\r?\n/).filter(Boolean).length;
  const failingLines = logcat
    .split(/\r?\n/)
    .filter(line =>
      /AndroidRuntime|FATAL EXCEPTION|ReactNativeJS.*(TypeError|ReferenceError|SyntaxError)|E ReactNative|EmptyParameterException/.test(
        line,
      ),
    );

  if (failingLines.length > 0) {
    fatalRuntimeLogcatFindings = 'yes';
    failingLines.forEach(line => append(line));
    throw new Error('Import-wallet smoke found fatal/runtime logcat findings.');
  }
  fatalRuntimeLogcatFindings = 'no';
};

const assertSecureWindowFlagCleared = phase => {
  const windowState = run('read Android window state', ['shell', 'dumpsys', 'window', 'windows'], {
    printOutput: false,
  });
  const activityIndex = windowState.indexOf(activityName);

  if (activityIndex === -1) {
    throw new Error(`Unable to find ${activityName} in Android window state.`);
  }

  const nextWindowIndex = windowState.indexOf('\n  Window #', activityIndex + activityName.length);
  const activityWindow = windowState.slice(activityIndex, nextWindowIndex === -1 ? undefined : nextWindowIndex);

  if (/\bSECURE\b/.test(activityWindow)) {
    if (phase === 'restart') {
      secureWindowFlagAfterRestart = 'yes';
    } else {
      secureWindowFlagAfterImport = 'yes';
    }
    throw new Error(`Android FLAG_SECURE remained enabled after the import-wallet ${phase}.`);
  }

  if (phase === 'restart') {
    secureWindowFlagAfterRestart = 'no';
  } else {
    secureWindowFlagAfterImport = 'no';
  }
};

const restartAppAndRequirePersistedWallet = walletCardResourceId => {
  preRestartAppPid = readAppPid('read pre-restart app pid');
  run('force-stop app after wallet import', ['shell', 'am', 'force-stop', packageName]);
  sleep(1000);
  run('restart app after wallet import', ['shell', 'am', 'start', '-W', '-n', activityName]);
  sleep(6000);

  let hierarchy = unlockIfNeeded(readUiHierarchy('unlock screen after import restart'), { requireUnlock: true });

  if (!hierarchy.includes('resource-id="dashboard-header"')) {
    hierarchy = waitForResourceIds('dashboard after import restart', ['dashboard-header', walletCardResourceId]);
  }
  assertNoImportError(hierarchy);
  if (!hierarchy.includes(`resource-id="${walletCardResourceId}"`)) {
    hierarchy = waitForResourceIds('persisted wallet after import restart', ['dashboard-header', walletCardResourceId]);
  }

  appPid = readAppPid('read restarted app pid');
  if (appPid === preRestartAppPid) {
    throw new Error(`App PID did not change after force-stop: ${appPid}.`);
  }

  importedWalletVisibleAfterRestart = true;
  appProcessRestartCompleted = true;
  assertSecureWindowFlagCleared('restart');
};

try {
  if (!adbCommand) {
    throw new Error('adb not found. Set ANDROID_HOME, ANDROID_SDK_ROOT, or add adb to PATH.');
  }
  if (!isSafeOutputBaseName) {
    throw new Error(`ANDROID_IMPORT_WALLET_SMOKE_OUTPUT_BASENAME must be a safe file basename.`);
  }
  if (!existsSync(apkPath)) {
    throw new Error(`Source APK not found: ${apkPath}`);
  }
  if (!/^[A-Za-z][A-Za-z0-9_-]{2,40}$/.test(walletName)) {
    throw new Error('ANDROID_IMPORT_WALLET_NAME must be a shell-safe wallet name without spaces.');
  }
  if (!Number.isInteger(adbCommandTimeoutMs) || adbCommandTimeoutMs <= 0 || uiWaitMs <= 0 || uiPollIntervalMs <= 0) {
    throw new Error('Android import-wallet smoke timeout values must be positive numbers.');
  }

  selectDevice();
  run('clear logcat', ['logcat', '-c']);
  run('launch app', ['shell', 'am', 'start', '-W', '-n', activityName]);
  sleep(3500);

  let dashboard = unlockIfNeeded(readUiHierarchy('initial dashboard'));

  if (!dashboard.includes('resource-id="dashboard-header"')) {
    dashboard = waitForResourceIds('dashboard', ['dashboard-header']);
  }

  if (dashboard.includes('resource-id="import-wallet-button"')) {
    tapResourceId('Open import-wallet type screen', dashboard, 'import-wallet-button');
  } else if (dashboard.includes('resource-id="add-wallet-button"')) {
    tapResourceId('Open add-wallet screen', dashboard, 'add-wallet-button');
    const addWallet = waitForResourceIds('add-wallet screen', ['imports-wallet-button']);

    tapResourceId('Open import-wallet type screen', addWallet, 'imports-wallet-button');
  } else {
    throw new Error('Dashboard does not expose an import-wallet entry point.');
  }

  let importType = waitForResourceIds('import-wallet type screen', [
    'import-standard-wallet-radio',
    'confirm-import-button',
  ]);

  tapResourceId('Select standard wallet', importType, 'import-standard-wallet-radio');
  sleep(500);
  importType = waitForResourceIds('selected standard import type', ['confirm-import-button']);
  tapResourceId('Proceed to import form', importType, 'confirm-import-button');

  let importForm = waitForResourceIds('import-wallet form', [
    'import-wallet-name',
    'import-wallet-seed-phrase-input',
    'submit-import-wallet-button',
  ]);

  enterText('Import wallet name', importForm, 'import-wallet-name', walletName);
  importForm = waitForResourceIds('import form after wallet name', [
    'import-wallet-seed-phrase-input',
    'submit-import-wallet-button',
  ]);
  enterText('Public watch-only address', importForm, 'import-wallet-seed-phrase-input', fixtureAddress);
  importForm = waitForResourceIds('completed import form', ['submit-import-wallet-button']);
  tapResourceId('Submit wallet import', importForm, 'submit-import-wallet-button');

  const success = waitForImportSuccessScreen();

  importSuccessScreenReached = true;
  assertNoImportError(success);
  tapResourceId('Return to dashboard', success, 'message-close-button');

  const walletCardResourceId = `wallet-${walletName}-card`;
  const importedDashboard = waitForResourceIds('dashboard with imported wallet', [
    'dashboard-header',
    walletCardResourceId,
  ]);

  assertNoImportError(importedDashboard);
  importedWalletVisible = true;
  noErrorUi = true;

  sleep(2500);
  assertSecureWindowFlagCleared('import');
  restartAppAndRequirePersistedWallet(walletCardResourceId);
  runBinary('capture import-wallet screenshot', ['exec-out', 'screencap', '-p'], screenshotOutputPath);
  captureLogcat();
  smokeOutcome = 'passed';
  smokeReason = 'completed';
  finish(0);
} catch (error) {
  smokeReason = error.message;
  append(`\nAndroid import-wallet smoke failed: ${error.message}`);
  try {
    runBinary('capture import-wallet failure screenshot', ['exec-out', 'screencap', '-p'], screenshotOutputPath);
  } catch (captureError) {
    append(`Failure screenshot skipped: ${captureError.message}`);
  }
  try {
    captureLogcat();
  } catch (logcatError) {
    append(`Failure logcat capture incomplete: ${logcatError.message}`);
  }
  finish(1);
}
