import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatAdbFailureReason, runAdbProcessWithRetry } from './androidAdbRetry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const requestedOutputBaseName = process.env.ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME || 'android-create-wallet-smoke';
const isSafeOutputBaseName = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(requestedOutputBaseName);
const outputBaseName = isSafeOutputBaseName ? requestedOutputBaseName : 'android-create-wallet-smoke';
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
const androidSerial = process.env.ANDROID_SERIAL?.trim();
let selectedAndroidSerial = androidSerial;
const adbCommandTimeoutMs = Number(process.env.ANDROID_SMOKE_ADB_TIMEOUT_MS || 60000);
const uiWaitMs = Number(process.env.ANDROID_CREATE_WALLET_SMOKE_UI_WAIT_MS || 90000);
const uiPollIntervalMs = Number(process.env.ANDROID_CREATE_WALLET_SMOKE_UI_POLL_INTERVAL_MS || 1000);
const logcatLineLimit = Number(process.env.ANDROID_CREATE_WALLET_SMOKE_LOGCAT_LINES || 1200);
const unlockPin = process.env.ANDROID_SMOKE_PIN || '1111';
const standardWalletName = process.env.ANDROID_CREATE_WALLET_STANDARD_NAME || `Std${new Date().toISOString().replace(/\D/g, '').slice(8, 14)}`;
const vaultWalletName = process.env.ANDROID_CREATE_WALLET_VAULT_NAME || `Vault${new Date().toISOString().replace(/\D/g, '').slice(8, 14)}`;

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
let standardWalletCreated = false;
let standardMnemonicReached = false;
let vaultNextStepReached = false;
let noErrorUi = false;
let fatalRuntimeLogcatFindings = 'not checked';
let screenshotBytes = 0;
let capturedLogcatLines = 0;

mkdirSync(outputDir, { recursive: true });

const append = line => {
  log.push(line);
  console.log(line);
};

const record = line => {
  log.push(line);
};

const sleep = milliseconds => {
  spawnSync(process.execPath, ['-e', `setTimeout(() => {}, ${milliseconds})`], { stdio: 'ignore' });
};

const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

const fileEvidence = filePath => {
  if (!filePath || !existsSync(filePath)) {
    return {
      path: filePath || '<missing>',
      bytes: 0,
      sha256: '<missing>',
    };
  }

  return {
    path: filePath,
    bytes: statSync(filePath).size,
    sha256: fileSha256(filePath),
  };
};

const run = (label, args, options = {}) => {
  append(`\n> ${label}`);
  const { allowDumpSuccessOutput = false, printOutput = true, recordOutput = true, useSelectedDevice = true, ...spawnOptions } =
    options;
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
    if (allowDumpSuccessOutput && /UI hier\S* dumped to:/i.test(result.stdout || '')) {
      append(`${label} returned non-zero after writing the hierarchy; reading the dumped file for validation.`);
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

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${formatAdbFailureReason(result)}`);
  }

  if (!result.stdout || result.stdout.length === 0) {
    throw new Error(`${label} produced an empty artifact.`);
  }

  writeFileSync(outputFile, result.stdout);
  if (outputFile === screenshotOutputPath) {
    screenshotBytes = result.stdout.length;
  }
  append(`${label} written to ${outputFile} (${result.stdout.length} bytes)`);
};

const writeSummary = exitCode => {
  const apkEvidence = fileEvidence(apkPath);
  const summary = [
    `Generated at: ${new Date().toISOString()}`,
    `Android create-wallet smoke outcome: ${smokeOutcome}`,
    `Android create-wallet smoke exit code: ${exitCode}`,
    `Android create-wallet smoke reason: ${smokeReason}`,
    `Android serial: ${selectedAndroidSerial || 'not selected'}`,
    `Android package: ${packageName}`,
    `Android activity: ${activityName}`,
    `Artifact base: ${outputBaseName}`,
    `Source APK path: ${apkEvidence.path}`,
    `Source APK bytes: ${apkEvidence.bytes}`,
    `Source APK sha256: ${apkEvidence.sha256}`,
    `Standard wallet name: ${standardWalletName}`,
    `Standard wallet created: ${standardWalletCreated ? 'yes' : 'no'}`,
    `Standard mnemonic screen reached: ${standardMnemonicReached ? 'yes' : 'no'}`,
    `Vault wallet name: ${vaultWalletName}`,
    `Vault next-step reached: ${vaultNextStepReached ? 'yes' : 'no'}`,
    `No create-wallet error UI: ${noErrorUi ? 'yes' : 'no'}`,
    `Fatal/runtime logcat findings: ${fatalRuntimeLogcatFindings}`,
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
  append(`Android create-wallet smoke summary written to ${summaryOutputPath}`);
  writeFileSync(outputPath, `${log.join('\n')}\n`);
  process.exit(exitCode);
};

const tryCaptureFailureScreenshot = () => {
  if (!adbCommand || !selectedAndroidSerial) {
    return;
  }

  try {
    runBinary('capture failure screenshot', ['exec-out', 'screencap', '-p'], screenshotOutputPath);
  } catch (screenshotError) {
    append(`capture failure screenshot skipped: ${screenshotError.message}`);
  }
};

const readUiHierarchy = label => {
  run(`dump UI hierarchy ${label}`, ['shell', 'uiautomator', 'dump', '/sdcard/goldwallet-create-wallet-window.xml'], {
    allowDumpSuccessOutput: true,
  });
  const hierarchy = run(`read UI hierarchy ${label}`, ['exec-out', 'cat', '/sdcard/goldwallet-create-wallet-window.xml'], {
    printOutput: false,
    recordOutput: false,
  });
  writeFileSync(uiOutputPath, hierarchy);

  return hierarchy;
};

const getNodeByResourceId = (uiHierarchy, resourceId) => {
  const resourceMarker = `resource-id="${resourceId}"`;
  const resourceIndex = uiHierarchy.indexOf(resourceMarker);

  if (resourceIndex === -1) {
    return null;
  }

  const nodeStart = uiHierarchy.lastIndexOf('<node', resourceIndex);
  const nodeEnd = uiHierarchy.indexOf('>', resourceIndex);

  if (nodeStart === -1 || nodeEnd === -1) {
    return null;
  }

  const node = uiHierarchy.slice(nodeStart, nodeEnd + 1);
  const boundsMatch = node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);

  return {
    enabled: /enabled="true"/.test(node),
    bounds: boundsMatch ? boundsMatch.slice(1).map(value => Number(value)) : null,
  };
};

const getNodeByContentDescription = (uiHierarchy, contentDescription) => {
  const escapedContentDescription = String(contentDescription).replace(/"/g, '&quot;');
  const contentMarker = `content-desc="${escapedContentDescription}"`;
  const contentIndex = uiHierarchy.indexOf(contentMarker);

  if (contentIndex === -1) {
    return null;
  }

  const nodeStart = uiHierarchy.lastIndexOf('<node', contentIndex);
  const nodeEnd = uiHierarchy.indexOf('>', contentIndex);

  if (nodeStart === -1 || nodeEnd === -1) {
    return null;
  }

  const node = uiHierarchy.slice(nodeStart, nodeEnd + 1);
  const boundsMatch = node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);

  return {
    enabled: /enabled="true"/.test(node),
    bounds: boundsMatch ? boundsMatch.slice(1).map(value => Number(value)) : null,
  };
};

const tapNodeCenter = node => {
  if (!node?.bounds) {
    throw new Error('Unable to tap node without bounds.');
  }

  const [left, top, right, bottom] = node.bounds;
  const x = Math.round((left + right) / 2);
  const y = Math.round((top + bottom) / 2);

  run(`tap UI node at ${x},${y}`, ['shell', 'input', 'tap', String(x), String(y)]);
};

const hasCreateWalletError = uiHierarchy =>
  [
    'text="Error"',
    'Failed to create wallet',
    'Secure random byte generator is unavailable',
    'EmptyParameterException',
    'undefined is not an object',
  ].some(marker => uiHierarchy.includes(marker));

const assertNoCreateWalletError = uiHierarchy => {
  if (hasCreateWalletError(uiHierarchy)) {
    throw new Error('Create-wallet error UI is visible.');
  }
};

const waitForResourceIds = (label, resourceIds, options = {}) => {
  const { failOnCreateWalletError = true } = options;
  const deadline = Date.now() + uiWaitMs;
  let attempt = 0;
  let hierarchy = '';
  let missingResourceIds = resourceIds;

  do {
    attempt += 1;
    hierarchy = readUiHierarchy(`${label} attempt ${attempt}`);

    if (failOnCreateWalletError) {
      assertNoCreateWalletError(hierarchy);
    }

    missingResourceIds = resourceIds.filter(resourceId => !hierarchy.includes(`resource-id="${resourceId}"`));

    if (missingResourceIds.length === 0) {
      append(`Found ${label} resource ID(s): ${resourceIds.join(', ')}`);
      return hierarchy;
    }

    if (Date.now() < deadline) {
      append(`${label} attempt ${attempt} missing resource ID(s): ${missingResourceIds.join(', ')}; retrying...`);
      sleep(uiPollIntervalMs);
    }
  } while (Date.now() < deadline);

  throw new Error(`${label} is missing expected resource ID(s): ${missingResourceIds.join(', ')}`);
};

const tapResourceId = (label, uiHierarchy, resourceId) => {
  const node = getNodeByResourceId(uiHierarchy, resourceId);

  if (!node) {
    throw new Error(`${label} cannot find resource ID: ${resourceId}`);
  }

  if (!node.enabled) {
    throw new Error(`${label} resource ID is not enabled: ${resourceId}`);
  }

  append(`${label}: tapping ${resourceId}`);
  tapNodeCenter(node);
};

const enterText = (label, uiHierarchy, resourceId, value) => {
  tapResourceId(label, uiHierarchy, resourceId);
  sleep(500);
  run(`${label}: enter text`, ['shell', 'input', 'text', value]);
  sleep(500);
  run(`${label}: hide keyboard`, ['shell', 'input', 'keyevent', '111']);
  sleep(500);
};

const assertUnlockDigit = digit => {
  if (!/^\d$/.test(digit)) {
    throw new Error(`Unlock PIN can contain digits only. Received: ${unlockPin}`);
  }
};

const unlockIfNeeded = label => {
  let hierarchy = readUiHierarchy(`${label} unlock check`);

  if (!hierarchy.includes('resource-id="unlock-screen-logo"')) {
    return hierarchy;
  }

  append(`${label}: unlock screen detected; entering test PIN.`);
  for (const digit of unlockPin.split('')) {
    assertUnlockDigit(digit);
    const digitNode = getNodeByContentDescription(hierarchy, digit);

    if (!digitNode?.enabled) {
      throw new Error(`${label}: unable to find enabled unlock PIN digit ${digit}.`);
    }

    tapNodeCenter(digitNode);
    sleep(250);
    hierarchy = readUiHierarchy(`${label} after unlock digit ${digit}`);
  }
  sleep(3000);
  hierarchy = readUiHierarchy(`${label} after unlock PIN`);

  if (hierarchy.includes('resource-id="unlock-screen-logo"')) {
    throw new Error(`${label}: unlock screen is still visible after entering the test PIN.`);
  }

  return hierarchy;
};

const assertReadyDashboard = label => {
  let hierarchy = unlockIfNeeded(label);
  if (!hierarchy.includes('resource-id="dashboard-header"')) {
    hierarchy = waitForResourceIds(label, ['dashboard-header'], { failOnCreateWalletError: false });
  }
  const hasEmptyCreateButton = hierarchy.includes('resource-id="create-wallet-button"');
  const hasHeaderCreateButton = hierarchy.includes('resource-id="add-wallet-button"');

  if (!hasEmptyCreateButton && !hasHeaderCreateButton) {
    if (
      [
        'resource-id="terms-conditions-screen"',
        'resource-id="create-pin-input"',
        'resource-id="confirm-pin-input"',
        'resource-id="create-transaction-password"',
        'resource-id="confirm-transaction-password"',
        'resource-id="skip-adding-email-button"',
      ].some(marker => hierarchy.includes(marker))
    ) {
      throw new Error('App is still in first-run flow. Run android:dev:smoke:embedded before create-wallet smoke.');
    }

    throw new Error(`${label} does not expose create-wallet-button or add-wallet-button.`);
  }

  return hierarchy;
};

const openCreateWallet = dashboardHierarchy => {
  const resourceId = dashboardHierarchy.includes('resource-id="create-wallet-button"')
    ? 'create-wallet-button'
    : 'add-wallet-button';

  tapResourceId('Open create-wallet screen', dashboardHierarchy, resourceId);
  sleep(2500);

  return waitForResourceIds('create-wallet screen', [
    'create-wallet-name-input',
    'creates-wallet-button',
    'create-2-key-vault-radio',
    'create-3-key-vault-radio',
    'create-hd-p2sh-radio',
  ]);
};

const createStandardWallet = dashboardHierarchy => {
  append('\nValidating standard wallet creation...');
  let createScreen = openCreateWallet(dashboardHierarchy);

  enterText('Standard wallet name input', createScreen, 'create-wallet-name-input', standardWalletName);
  createScreen = waitForResourceIds('create-wallet screen after standard name', [
    'create-wallet-name-input',
    'creates-wallet-button',
    'create-hd-p2sh-radio',
  ]);
  tapResourceId('Standard wallet type', createScreen, 'create-hd-p2sh-radio');
  sleep(500);
  createScreen = waitForResourceIds('create-wallet screen after standard type', ['creates-wallet-button']);
  tapResourceId('Create standard wallet', createScreen, 'creates-wallet-button');
  sleep(5000);

  const successScreen = waitForResourceIds('standard wallet mnemonic screen', [
    'create-wallet-mnemonic',
    'mnemonic-word-0',
    'create-wallet-close-button',
  ]);

  assertNoCreateWalletError(successScreen);
  standardWalletCreated = true;
  standardMnemonicReached = true;
  append('Standard wallet reached mnemonic backup screen.');
};

const restartAppAndWaitForDashboard = label => {
  run(`${label}: force-stop app`, ['shell', 'am', 'force-stop', packageName]);
  sleep(1000);
  run(`${label}: launch app`, ['shell', 'am', 'start', '-W', '-n', activityName]);
  sleep(6000);

  return assertReadyDashboard(label);
};

const createVaultWallet = dashboardHierarchy => {
  append('\nValidating default 3-key vault creation path...');
  let createScreen = openCreateWallet(dashboardHierarchy);

  enterText('Vault wallet name input', createScreen, 'create-wallet-name-input', vaultWalletName);
  createScreen = waitForResourceIds('create-wallet screen after vault name', [
    'create-wallet-name-input',
    'creates-wallet-button',
    'create-3-key-vault-radio',
  ]);
  tapResourceId('Vault wallet type', createScreen, 'create-3-key-vault-radio');
  sleep(500);
  createScreen = waitForResourceIds('create-wallet screen after vault type', ['creates-wallet-button']);
  tapResourceId('Create vault wallet', createScreen, 'creates-wallet-button');
  sleep(5000);

  const integrateKeyScreen = waitForResourceIds('vault add public key screen', ['scan-public-key-code-button']);

  assertNoCreateWalletError(integrateKeyScreen);
  vaultNextStepReached = true;
  append('Vault wallet reached public-key integration screen.');
};

const captureLogcatFindings = () => {
  const pidOutput = run('read app pid', ['shell', 'pidof', packageName], { printOutput: false }).trim();

  appPid = pidOutput.split(/\s+/).find(Boolean) || '';
  if (!appPid) {
    throw new Error(`Unable to find running process for ${packageName} after create-wallet flows.`);
  }

  const logcat = run('read create-wallet logcat', ['logcat', '-d', '--pid', appPid, '-t', String(logcatLineLimit)], {
    printOutput: false,
  });

  writeFileSync(logcatOutputPath, logcat);
  capturedLogcatLines = logcat.split(/\r?\n/).filter(Boolean).length;
  append(`Captured ${capturedLogcatLines} recent create-wallet logcat lines.`);

  const failingLines = logcat
    .split(/\r?\n/)
    .filter(line =>
      /AndroidRuntime|FATAL EXCEPTION|ReactNativeJS.*(TypeError|ReferenceError|SyntaxError)|E ReactNative|EmptyParameterException|Secure random byte generator is unavailable/.test(
        line,
      ),
    );

  if (failingLines.length > 0) {
    append('\nCreate-wallet smoke found fatal/runtime logcat lines:');
    failingLines.forEach(line => append(line));
    fatalRuntimeLogcatFindings = 'yes';
    throw new Error('Create-wallet smoke found fatal/runtime logcat findings.');
  }

  fatalRuntimeLogcatFindings = 'no';
};

try {
  if (!adbCommand) {
    throw new Error('adb not found. Set ANDROID_HOME, ANDROID_SDK_ROOT, or add adb to PATH.');
  }

  if (!isSafeOutputBaseName) {
    throw new Error(
      `ANDROID_CREATE_WALLET_SMOKE_OUTPUT_BASENAME must be a safe file basename. Received: ${requestedOutputBaseName}`,
    );
  }

  if (!Number.isInteger(adbCommandTimeoutMs) || adbCommandTimeoutMs <= 0) {
    throw new Error(
      `ANDROID_SMOKE_ADB_TIMEOUT_MS must be a positive integer. Received: ${process.env.ANDROID_SMOKE_ADB_TIMEOUT_MS}`,
    );
  }

  if (!Number.isFinite(uiWaitMs) || uiWaitMs < 0) {
    throw new Error(
      `ANDROID_CREATE_WALLET_SMOKE_UI_WAIT_MS must be a non-negative number of milliseconds. Received: ${process.env.ANDROID_CREATE_WALLET_SMOKE_UI_WAIT_MS}`,
    );
  }

  if (!Number.isFinite(uiPollIntervalMs) || uiPollIntervalMs <= 0) {
    throw new Error(
      `ANDROID_CREATE_WALLET_SMOKE_UI_POLL_INTERVAL_MS must be a positive number of milliseconds. Received: ${process.env.ANDROID_CREATE_WALLET_SMOKE_UI_POLL_INTERVAL_MS}`,
    );
  }

  if (!Number.isInteger(logcatLineLimit) || logcatLineLimit <= 0) {
    throw new Error(
      `ANDROID_CREATE_WALLET_SMOKE_LOGCAT_LINES must be a positive integer. Received: ${process.env.ANDROID_CREATE_WALLET_SMOKE_LOGCAT_LINES}`,
    );
  }

  if (!existsSync(apkPath)) {
    throw new Error(`APK not found: ${apkPath}. Run corepack yarn android:dev:assemble first.`);
  }

  append(`Using adb: ${adbCommand}`);
  append(`Using APK: ${apkPath}`);
  append(`Using package: ${packageName}`);
  append(`Using artifact base: ${outputBaseName}`);
  append(`Using UI readiness wait: ${uiWaitMs}ms`);
  append(`Using UI poll interval: ${uiPollIntervalMs}ms`);
  append(`Using logcat line limit: ${logcatLineLimit}`);
  append(`Using unlock PIN length: ${unlockPin.length}`);
  append(`Using standard wallet name: ${standardWalletName}`);
  append(`Using vault wallet name: ${vaultWalletName}`);
  if (androidSerial) {
    append(`Requested Android serial: ${androidSerial}`);
  }

  const devicesOutput = run('adb devices', ['devices'], { useSelectedDevice: false });
  const devices = devicesOutput
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim())
    .filter(line => /\tdevice$/.test(line));
  const deviceSerials = devices.map(line => line.split(/\s+/)[0]).filter(Boolean);

  if (devices.length === 0) {
    throw new Error('No connected Android device/emulator in device state.');
  }

  if (androidSerial && !deviceSerials.includes(androidSerial)) {
    throw new Error(`ANDROID_SERIAL=${androidSerial} is not connected. Connected device(s): ${deviceSerials.join(', ')}`);
  }

  if (!androidSerial && deviceSerials.length > 1) {
    throw new Error(`Multiple Android devices/emulators connected: ${deviceSerials.join(', ')}. Set ANDROID_SERIAL to choose one.`);
  }

  selectedAndroidSerial = androidSerial || deviceSerials[0];
  append(`Using Android serial: ${selectedAndroidSerial}`);

  run('clear logcat', ['logcat', '-c']);
  const initialDashboard = restartAppAndWaitForDashboard('initial create-wallet smoke launch');

  createStandardWallet(initialDashboard);
  const dashboardAfterStandardWallet = restartAppAndWaitForDashboard('dashboard after standard wallet creation');

  createVaultWallet(dashboardAfterStandardWallet);
  captureLogcatFindings();
  runBinary('capture create-wallet smoke screenshot', ['exec-out', 'screencap', '-p'], screenshotOutputPath);

  noErrorUi = true;
  smokeOutcome = 'passed';
  smokeReason = 'standard wallet and vault create flows reached expected screens without error UI or fatal/runtime logcat findings';
  append('\nAndroid create-wallet smoke helper completed.');
  finish(0);
} catch (error) {
  smokeOutcome = 'failed';
  smokeReason = error.message;
  append(`\n${error.message}`);
  if (error.stack && error.stack !== error.message) {
    record(error.stack);
  }
  tryCaptureFailureScreenshot();
  finish(1);
}
