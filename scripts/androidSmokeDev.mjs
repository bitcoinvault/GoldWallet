import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const requestedOutputBaseName = process.env.ANDROID_SMOKE_OUTPUT_BASENAME || 'android-smoke-dev';
const isSafeOutputBaseName = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(requestedOutputBaseName);
const outputBaseName = isSafeOutputBaseName ? requestedOutputBaseName : 'android-smoke-dev';
const outputPath = path.join(outputDir, `${outputBaseName}.log`);
const summaryOutputPath = path.join(outputDir, `${outputBaseName}-summary.txt`);
const uiOutputPath = path.join(outputDir, `${outputBaseName}-ui.xml`);
const screenshotOutputPath = path.join(outputDir, `${outputBaseName}.png`);
const packageName = process.env.ANDROID_SMOKE_PACKAGE || 'io.goldwallet.wallet.dev';
const activityName = process.env.ANDROID_SMOKE_ACTIVITY || `${packageName}/io.goldwallet.wallet.MainActivity`;
const androidSerial = process.env.ANDROID_SERIAL?.trim();
let selectedAndroidSerial = androidSerial;
const apkPath =
  process.env.ANDROID_SMOKE_APK ||
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'dev', 'debug', 'app-dev-debug.apk');
const sourceApkPath = process.env.ANDROID_SMOKE_SOURCE_APK || '';
const startupWaitMs = Number(process.env.ANDROID_SMOKE_WAIT_MS || 20000);
const uiWaitMs = Number(process.env.ANDROID_SMOKE_UI_WAIT_MS || 90000);
const uiPollIntervalMs = Number(process.env.ANDROID_SMOKE_UI_POLL_INTERVAL_MS || 1000);
const logcatLineLimit = Number(process.env.ANDROID_SMOKE_LOGCAT_LINES || 400);
const adbCommandTimeoutMs = Number(process.env.ANDROID_SMOKE_ADB_TIMEOUT_MS || 60000);
const postInstallSettleMs = Number(process.env.ANDROID_SMOKE_POST_INSTALL_SETTLE_MS || 8000);
const compilePackage = process.env.ANDROID_SMOKE_COMPILE_PACKAGE !== 'false';
const compilePackageTimeoutMs = Number(
  process.env.ANDROID_SMOKE_COMPILE_TIMEOUT_MS || Math.max(adbCommandTimeoutMs, 180000),
);
const metroHost = process.env.ANDROID_SMOKE_METRO_HOST || '127.0.0.1';
const metroPort = Number(process.env.ANDROID_SMOKE_METRO_PORT || 8081);
const metroTimeoutMs = Number(process.env.ANDROID_SMOKE_METRO_TIMEOUT_MS || 3000);
const metroRequired = process.env.ANDROID_SMOKE_REQUIRE_METRO !== 'false';
const clearAppData = process.env.ANDROID_SMOKE_CLEAR_APP_DATA === 'true';
const validateEmptyDashboardCtas = process.env.ANDROID_SMOKE_VALIDATE_EMPTY_DASHBOARD_CTAS === 'true';
const validateEmptyTabNavigation = process.env.ANDROID_SMOKE_VALIDATE_EMPTY_TAB_NAVIGATION === 'true';
const firstRunTransactionPassword = process.env.ANDROID_SMOKE_TRANSACTION_PASSWORD || 'testpass123';
const expectedTexts = (process.env.ANDROID_SMOKE_EXPECT_TEXTS ?? 'Wallets,E2EWalletTypeTest,Send,Receive')
  .split(',')
  .map(text => text.trim())
  .filter(Boolean);
const expectedResourceIds = (process.env.ANDROID_SMOKE_EXPECT_RESOURCE_IDS ?? '')
  .split(',')
  .map(resourceId => resourceId.trim())
  .filter(Boolean);

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
let capturedLogcatLines = 0;
let uiAttempts = 0;
let screenshotBytes = 0;
let metroReachable = false;
let acceptedFirstRunTerms = false;
let completedFirstRunPin = false;
let completedFirstRunTransactionPassword = false;
let skippedFirstRunEmail = false;
let closedFirstRunSuccess = false;
let validatedEmptyDashboardCtaFlow = false;
let validatedEmptyTabNavigation = false;

mkdirSync(outputDir, { recursive: true });

const append = line => {
  log.push(line);
  console.log(line);
};

const record = line => {
  log.push(line);
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
  const { printOutput = true, recordOutput = true, useSelectedDevice = true, ...spawnOptions } = options;
  const adbArgs = useSelectedDevice && selectedAndroidSerial ? ['-s', selectedAndroidSerial, ...args] : args;
  const result = spawnSync(adbCommand, adbArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: adbCommand === 'adb' && process.platform === 'win32',
    timeout: adbCommandTimeoutMs,
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

const writeSummary = exitCode => {
  const smokeApkEvidence = fileEvidence(apkPath);
  const sourceApkEvidence = fileEvidence(sourceApkPath);
  const summary = [
    `Generated at: ${new Date().toISOString()}`,
    `Android smoke outcome: ${smokeOutcome}`,
    `Android smoke exit code: ${exitCode}`,
    `Android smoke reason: ${smokeReason}`,
    `Android serial: ${selectedAndroidSerial || 'not selected'}`,
    `Android package: ${packageName}`,
    `Android activity: ${activityName}`,
    `Artifact base: ${outputBaseName}`,
    `Smoke APK path: ${smokeApkEvidence.path}`,
    `Smoke APK bytes: ${smokeApkEvidence.bytes}`,
    `Smoke APK sha256: ${smokeApkEvidence.sha256}`,
    `Source APK path: ${sourceApkEvidence.path}`,
    `Source APK bytes: ${sourceApkEvidence.bytes}`,
    `Source APK sha256: ${sourceApkEvidence.sha256}`,
    `Metro required: ${metroRequired ? 'yes' : 'no'}`,
    `Metro endpoint: ${metroHost}:${metroPort}`,
    `Metro reachable: ${metroReachable ? 'yes' : 'no'}`,
    `Cleared app data: ${clearAppData ? 'yes' : 'no'}`,
    `Expected UI texts: ${expectedTexts.length > 0 ? expectedTexts.join(', ') : 'none'}`,
    `Expected resource IDs: ${expectedResourceIds.length > 0 ? expectedResourceIds.join(', ') : 'none'}`,
    `App PID: ${appPid || 'not available'}`,
    `Captured logcat lines: ${capturedLogcatLines}`,
    `Accepted first-run terms: ${acceptedFirstRunTerms ? 'yes' : 'no'}`,
    `Completed first-run PIN: ${completedFirstRunPin ? 'yes' : 'no'}`,
    `Completed first-run transaction password: ${completedFirstRunTransactionPassword ? 'yes' : 'no'}`,
    `Skipped first-run email: ${skippedFirstRunEmail ? 'yes' : 'no'}`,
    `Closed first-run success: ${closedFirstRunSuccess ? 'yes' : 'no'}`,
    `Validated empty-dashboard CTA flow: ${validatedEmptyDashboardCtaFlow ? 'yes' : 'no'}`,
    `Validated empty-tab navigation: ${validatedEmptyTabNavigation ? 'yes' : 'no'}`,
    `UI hierarchy attempts: ${uiAttempts}`,
    `UI hierarchy path: ${uiOutputPath}`,
    `Screenshot path: ${screenshotOutputPath}`,
    `Screenshot bytes: ${screenshotBytes}`,
  ].join('\n');

  writeFileSync(summaryOutputPath, `${summary}\n`);
};

const finish = exitCode => {
  writeSummary(exitCode);
  append(`Android dev smoke summary written to ${summaryOutputPath}`);
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

const runBinary = (label, args, outputFile) => {
  append(`\n> ${label}`);
  const adbArgs = selectedAndroidSerial ? ['-s', selectedAndroidSerial, ...args] : args;
  const result = spawnSync(adbCommand, adbArgs, {
    cwd: root,
    encoding: 'buffer',
    shell: adbCommand === 'adb' && process.platform === 'win32',
    timeout: adbCommandTimeoutMs,
  });

  if (result.error || result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString('utf8').trim() : '';
    const reason = result.error?.message || stderr || `exit ${result.status}`;

    throw new Error(`${label} failed: ${reason}`);
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

const sleep = milliseconds => {
  spawnSync(process.execPath, ['-e', `setTimeout(() => {}, ${milliseconds})`], { stdio: 'ignore' });
};

const readUiHierarchy = label => {
  run(`dump UI hierarchy ${label}`, ['shell', 'uiautomator', 'dump', '/sdcard/goldwallet-window.xml']);
  return run(`read UI hierarchy ${label}`, ['exec-out', 'cat', '/sdcard/goldwallet-window.xml'], {
    printOutput: false,
    recordOutput: false,
  });
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
    checked: /checked="true"/.test(node),
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

const waitForResourceIds = (label, resourceIds) => {
  const deadline = Date.now() + uiWaitMs;
  let attempt = 0;
  let hierarchy = '';
  let missingResourceIds = resourceIds;

  do {
    attempt += 1;
    hierarchy = readUiHierarchy(`${label} attempt ${attempt}`);
    writeFileSync(uiOutputPath, hierarchy);
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

const validateEmptyDashboardCtaFlowIfEnabled = dashboardHierarchy => {
  if (!validateEmptyDashboardCtas) {
    return dashboardHierarchy;
  }

  append('\nValidating empty-dashboard CTA navigation flow...');

  tapResourceId('Create-wallet CTA', dashboardHierarchy, 'create-wallet-button');
  sleep(3000);
  const createWalletScreen = waitForResourceIds('create-wallet screen', [
    'back-button',
    'create-wallet-name-input',
    'creates-wallet-button',
    'imports-wallet-button',
    'create-2-key-vault-radio',
    'create-3-key-vault-radio',
  ]);

  tapResourceId('Create-wallet screen back button', createWalletScreen, 'back-button');
  sleep(3000);
  const dashboardAfterCreate = waitForResourceIds('dashboard after create-wallet back', [
    'dashboard-header',
    'create-wallet-button',
    'import-wallet-button',
    'navigation-tab-0',
  ]);

  tapResourceId('Import-wallet CTA', dashboardAfterCreate, 'import-wallet-button');
  sleep(3000);
  const importTypeScreen = waitForResourceIds('import-wallet type screen', [
    'back-button',
    'confirm-import-button',
    'import-2-key-vault-radio',
    'import-3-key-vault-radio',
    'import-standard-wallet-radio',
  ]);

  tapResourceId('Import-wallet type proceed', importTypeScreen, 'confirm-import-button');
  sleep(3000);
  const importFormScreen = waitForResourceIds('import-wallet form', [
    'back-button',
    'import-wallet-name',
    'import-wallet-seed-phrase-input',
    'submit-import-wallet-button',
    'scan-import-wallet-qr-code-button',
  ]);

  tapResourceId('Import-wallet form back button', importFormScreen, 'back-button');
  sleep(3000);
  const importTypeScreenAfterFormBack = waitForResourceIds('import-wallet type screen after form back', [
    'back-button',
    'confirm-import-button',
    'import-2-key-vault-radio',
    'import-3-key-vault-radio',
    'import-standard-wallet-radio',
  ]);

  tapResourceId('Import-wallet type back button', importTypeScreenAfterFormBack, 'back-button');
  sleep(3000);
  const finalDashboardHierarchy = waitForResourceIds('dashboard after import-wallet back', [
    'dashboard-header',
    'create-wallet-button',
    'import-wallet-button',
    'navigation-tab-0',
  ]);

  validatedEmptyDashboardCtaFlow = true;
  append('Empty-dashboard CTA navigation flow validated.');

  return finalDashboardHierarchy;
};

const validateEmptyTabNavigationIfEnabled = dashboardHierarchy => {
  if (!validateEmptyTabNavigation) {
    return dashboardHierarchy;
  }

  append('\nValidating empty-state tab navigation flow...');

  const tabScreens = [
    {
      label: 'authenticators tab',
      tabResourceId: 'navigation-tab-1',
      expectedResourceIds: [
        'dashboard-header',
        'create-authenticator-button',
        'no-authenticators-icon',
        'navigation-tab-0',
        'navigation-tab-1',
        'navigation-tab-2',
        'navigation-tab-3',
      ],
    },
    {
      label: 'address-book tab',
      tabResourceId: 'navigation-tab-2',
      expectedResourceIds: [
        'contacts-searchbar',
        'create-contact-button',
        'no-contacts-icon',
        'navigation-tab-0',
        'navigation-tab-1',
        'navigation-tab-2',
        'navigation-tab-3',
      ],
    },
    {
      label: 'settings tab',
      tabResourceId: 'navigation-tab-3',
      expectedResourceIds: [
        'dashboard-header',
        'goldwallet-logo',
        'language-settings-item',
        'advanced-options-settings-item',
        'change-pin-settings-item',
        'about-us-settings-item',
        'navigation-tab-0',
        'navigation-tab-1',
        'navigation-tab-2',
        'navigation-tab-3',
      ],
    },
  ];

  let currentHierarchy = dashboardHierarchy;

  for (const screen of tabScreens) {
    tapResourceId(screen.label, currentHierarchy, screen.tabResourceId);
    sleep(3000);
    currentHierarchy = waitForResourceIds(screen.label, screen.expectedResourceIds);
  }

  tapResourceId('wallets tab', currentHierarchy, 'navigation-tab-0');
  sleep(3000);
  const finalDashboardHierarchy = waitForResourceIds('dashboard after tab navigation', [
    'dashboard-header',
    'no-wallets-icon',
    'create-wallet-button',
    'import-wallet-button',
    'navigation-tab-0',
    'navigation-tab-1',
    'navigation-tab-2',
    'navigation-tab-3',
  ]);

  validatedEmptyTabNavigation = true;
  append('Empty-state tab navigation flow validated.');

  return finalDashboardHierarchy;
};

const isNodeFullyVisible = node => {
  if (!node?.bounds) {
    return false;
  }

  const [, top, , bottom] = node.bounds;

  return top >= 165 && bottom <= 2222;
};

const acceptFirstRunTermsIfNeeded = () => {
  let termsHierarchy = readUiHierarchy('for first-run terms');

  if (!termsHierarchy.includes('resource-id="terms-conditions-screen"')) {
    append('First-run terms screen not present.');
    return;
  }

  append('First-run terms screen detected; scrolling to enable agreement.');

  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const agreeNode = getNodeByResourceId(termsHierarchy, 'agree-button');

    if (agreeNode?.enabled) {
      tapNodeCenter(agreeNode);
      acceptedFirstRunTerms = true;
      append('Accepted first-run terms.');
      sleep(3000);
      return;
    }

    const termsCheckbox = getNodeByResourceId(termsHierarchy, 'terms-and-conditions-checkbox');
    const privacyCheckbox = getNodeByResourceId(termsHierarchy, 'privacy-policy-checkbox');

    if (isNodeFullyVisible(termsCheckbox) && isNodeFullyVisible(privacyCheckbox)) {
      if (!termsCheckbox.checked) {
        tapNodeCenter(termsCheckbox);
        sleep(500);
      }
      if (!privacyCheckbox.checked) {
        tapNodeCenter(privacyCheckbox);
        sleep(500);
      }

      termsHierarchy = readUiHierarchy('for first-run terms after checking boxes');
      continue;
    }

    run(`scroll first-run terms attempt ${attempt}`, ['shell', 'input', 'swipe', '540', '2050', '540', '260', '250']);
    sleep(250);
    termsHierarchy = readUiHierarchy(`for first-run terms after scroll ${attempt}`);
  }

  throw new Error('First-run terms screen is present, but the agreement button did not become enabled.');
};

const completeFirstRunPinIfNeeded = () => {
  let pinHierarchy = readUiHierarchy('for first-run PIN');
  let didEnterPin = false;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const hasCreatePin = pinHierarchy.includes('resource-id="create-pin-input"');
    const hasConfirmPin = pinHierarchy.includes('resource-id="confirm-pin-input"');

    if (!hasCreatePin && !hasConfirmPin) {
      if (didEnterPin) {
        completedFirstRunPin = true;
        append('Completed first-run PIN setup.');
      } else {
        append('First-run PIN screen not present.');
      }
      return;
    }

    append(hasCreatePin ? 'First-run Create PIN screen detected.' : 'First-run Confirm PIN screen detected.');
    run(`enter first-run PIN attempt ${attempt}`, ['shell', 'input', 'keyevent', '8', '8', '8', '8']);
    didEnterPin = true;
    sleep(3000);
    pinHierarchy = readUiHierarchy(`for first-run PIN after entry ${attempt}`);
  }

  throw new Error('First-run PIN screen is still present after entering and confirming a test PIN.');
};

const completeFirstRunTransactionPasswordIfNeeded = () => {
  let passwordHierarchy = readUiHierarchy('for first-run transaction password');
  let didEnterPassword = false;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const hasCreatePassword = passwordHierarchy.includes('resource-id="create-transaction-password"');
    const hasConfirmPassword = passwordHierarchy.includes('resource-id="confirm-transaction-password"');

    if (!hasCreatePassword && !hasConfirmPassword) {
      if (didEnterPassword) {
        completedFirstRunTransactionPassword = true;
        append('Completed first-run transaction password setup.');
      } else {
        append('First-run transaction password screen not present.');
      }
      return;
    }

    append(
      hasCreatePassword
        ? 'First-run Create transaction password screen detected.'
        : 'First-run Confirm transaction password screen detected.',
    );
    const passwordInputNode = getNodeByResourceId(
      passwordHierarchy,
      hasCreatePassword ? 'create-transaction-password' : 'confirm-transaction-password',
    );
    tapNodeCenter(passwordInputNode);
    sleep(500);
    run(`enter first-run transaction password attempt ${attempt}`, [
      'shell',
      'input',
      'text',
      firstRunTransactionPassword,
    ]);
    didEnterPassword = true;
    sleep(1000);

    passwordHierarchy = readUiHierarchy(`for first-run transaction password after entry ${attempt}`);
    const submitNode = getNodeByResourceId(
      passwordHierarchy,
      hasCreatePassword ? 'submit-create-transaction-password' : 'submit-transaction-password-confirmation',
    );

    if (!submitNode?.enabled) {
      throw new Error('First-run transaction password save button did not become enabled.');
    }

    run('hide keyboard before saving transaction password', ['shell', 'input', 'keyevent', '111']);
    sleep(500);
    passwordHierarchy = readUiHierarchy(`for first-run transaction password before save ${attempt}`);
    const visibleSubmitNode = getNodeByResourceId(
      passwordHierarchy,
      hasCreatePassword ? 'submit-create-transaction-password' : 'submit-transaction-password-confirmation',
    );

    if (!visibleSubmitNode?.enabled) {
      throw new Error('First-run transaction password save button is not enabled after hiding the keyboard.');
    }
    tapNodeCenter(visibleSubmitNode);
    sleep(5000);
    passwordHierarchy = readUiHierarchy(`for first-run transaction password after save ${attempt}`);
  }

  sleep(5000);
  passwordHierarchy = readUiHierarchy('for first-run transaction password final check');
  if (
    !passwordHierarchy.includes('resource-id="create-transaction-password"') &&
    !passwordHierarchy.includes('resource-id="confirm-transaction-password"')
  ) {
    completedFirstRunTransactionPassword = true;
    append('Completed first-run transaction password setup after final transition wait.');
    return;
  }

  throw new Error(
    'First-run transaction password screen is still present after entering and confirming a test password.',
  );
};

const skipFirstRunEmailIfNeeded = () => {
  const emailHierarchy = readUiHierarchy('for first-run email');
  const skipNode = getNodeByResourceId(emailHierarchy, 'skip-adding-email-button');

  if (!skipNode) {
    append('First-run email screen not present.');
    return;
  }

  if (!skipNode.enabled) {
    throw new Error('First-run email skip button is not enabled.');
  }

  tapNodeCenter(skipNode);
  skippedFirstRunEmail = true;
  append('Skipped first-run email step.');
  sleep(3000);
};

const closeFirstRunSuccessIfNeeded = () => {
  const successHierarchy = readUiHierarchy('for first-run success');
  const closeNode = getNodeByResourceId(successHierarchy, 'message-close-button');

  if (!closeNode) {
    append('First-run success screen not present.');
    return;
  }

  if (!closeNode.enabled) {
    throw new Error('First-run success close button is not enabled.');
  }

  tapNodeCenter(closeNode);
  closedFirstRunSuccess = true;
  append('Closed first-run success screen.');
  sleep(5000);
};

const completeFirstRunFlowIfNeeded = () => {
  acceptFirstRunTermsIfNeeded();
  completeFirstRunPinIfNeeded();
  completeFirstRunTransactionPasswordIfNeeded();
  skipFirstRunEmailIfNeeded();
  closeFirstRunSuccessIfNeeded();
};

const hasFirstRunFlow = uiHierarchy =>
  [
    'resource-id="terms-conditions-screen"',
    'resource-id="create-pin-input"',
    'resource-id="confirm-pin-input"',
    'resource-id="create-password-input"',
    'resource-id="confirm-password-input"',
    'resource-id="email-input"',
    'resource-id="success-modal"',
  ].some(marker => uiHierarchy.includes(marker));

const checkTcpPort = (host, port, timeoutMs) =>
  new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      cleanup();
      resolve();
    });
    socket.once('timeout', () => {
      cleanup();
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    });
    socket.once('error', error => {
      cleanup();
      reject(error);
    });
  });

const verifyMetro = async () => {
  append(`Checking Metro at ${metroHost}:${metroPort} with timeout ${metroTimeoutMs}ms`);

  try {
    await checkTcpPort(metroHost, metroPort, metroTimeoutMs);
    metroReachable = true;
  } catch (error) {
    throw new Error(`Metro is not reachable at ${metroHost}:${metroPort}: ${error.message}`);
  }
};

try {
  if (!adbCommand) {
    throw new Error('adb not found. Set ANDROID_HOME, ANDROID_SDK_ROOT, or add adb to PATH.');
  }

  if (!isSafeOutputBaseName) {
    throw new Error(
      `ANDROID_SMOKE_OUTPUT_BASENAME must be a safe file basename. Received: ${requestedOutputBaseName}`,
    );
  }

  if (!Number.isFinite(startupWaitMs) || startupWaitMs < 0) {
    throw new Error(
      `ANDROID_SMOKE_WAIT_MS must be a non-negative number of milliseconds. Received: ${process.env.ANDROID_SMOKE_WAIT_MS}`,
    );
  }

  if (!Number.isFinite(uiWaitMs) || uiWaitMs < 0) {
    throw new Error(
      `ANDROID_SMOKE_UI_WAIT_MS must be a non-negative number of milliseconds. Received: ${process.env.ANDROID_SMOKE_UI_WAIT_MS}`,
    );
  }

  if (!Number.isFinite(uiPollIntervalMs) || uiPollIntervalMs <= 0) {
    throw new Error(
      `ANDROID_SMOKE_UI_POLL_INTERVAL_MS must be a positive number of milliseconds. Received: ${process.env.ANDROID_SMOKE_UI_POLL_INTERVAL_MS}`,
    );
  }

  if (!Number.isInteger(logcatLineLimit) || logcatLineLimit <= 0) {
    throw new Error(
      `ANDROID_SMOKE_LOGCAT_LINES must be a positive integer. Received: ${process.env.ANDROID_SMOKE_LOGCAT_LINES}`,
    );
  }

  if (!Number.isInteger(adbCommandTimeoutMs) || adbCommandTimeoutMs <= 0) {
    throw new Error(
      `ANDROID_SMOKE_ADB_TIMEOUT_MS must be a positive integer. Received: ${process.env.ANDROID_SMOKE_ADB_TIMEOUT_MS}`,
    );
  }

  if (!Number.isInteger(metroPort) || metroPort <= 0 || metroPort > 65535) {
    throw new Error(
      `ANDROID_SMOKE_METRO_PORT must be an integer between 1 and 65535. Received: ${process.env.ANDROID_SMOKE_METRO_PORT}`,
    );
  }

  if (!Number.isInteger(metroTimeoutMs) || metroTimeoutMs <= 0) {
    throw new Error(
      `ANDROID_SMOKE_METRO_TIMEOUT_MS must be a positive integer. Received: ${process.env.ANDROID_SMOKE_METRO_TIMEOUT_MS}`,
    );
  }

  if (!existsSync(apkPath)) {
    throw new Error(
      `APK not found: ${apkPath}. Run corepack yarn android:dev:verify to rebuild and smoke-test the dev APK.`,
    );
  }

  append(`Using adb: ${adbCommand}`);
  append(`Using APK: ${apkPath}`);
  append(`Using package: ${packageName}`);
  append(`Using artifact base: ${outputBaseName}`);
  append(`Using startup wait: ${startupWaitMs}ms`);
  append(`Using UI readiness wait: ${uiWaitMs}ms`);
  append(`Using UI poll interval: ${uiPollIntervalMs}ms`);
  append(`Using logcat line limit: ${logcatLineLimit}`);
  append(`Using adb command timeout: ${adbCommandTimeoutMs}ms`);
  append(`Using post-install settle: ${postInstallSettleMs}ms`);
  append(`Using package compile: ${compilePackage ? 'yes' : 'no'}`);
  if (compilePackage) {
    append(`Using package compile timeout: ${compilePackageTimeoutMs}ms`);
  }
  append(`Using Metro required: ${metroRequired ? 'yes' : 'no'}`);
  append(`Using Metro endpoint: ${metroHost}:${metroPort}`);
  append(`Using Metro check timeout: ${metroTimeoutMs}ms`);
  append(`Using app-data clear: ${clearAppData ? 'yes' : 'no'}`);
  append(
    expectedTexts.length > 0
      ? `Using expected UI text(s): ${expectedTexts.join(', ')}`
      : 'Using expected UI text(s): none',
  );
  append(
    expectedResourceIds.length > 0
      ? `Using expected resource ID(s): ${expectedResourceIds.join(', ')}`
      : 'Using expected resource ID(s): none',
  );
  append(`Using empty-dashboard CTA flow validation: ${validateEmptyDashboardCtas ? 'yes' : 'no'}`);
  append(`Using empty-tab navigation validation: ${validateEmptyTabNavigation ? 'yes' : 'no'}`);
  if (androidSerial) {
    append(`Requested Android serial: ${androidSerial}`);
  }

  if (metroRequired) {
    await verifyMetro();
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
    throw new Error(
      `ANDROID_SERIAL=${androidSerial} is not connected. Connected device(s): ${deviceSerials.join(', ')}`,
    );
  }

  if (!androidSerial && deviceSerials.length > 1) {
    throw new Error(
      `Multiple Android devices/emulators connected: ${deviceSerials.join(', ')}. Set ANDROID_SERIAL to choose one.`,
    );
  }

  selectedAndroidSerial = androidSerial || deviceSerials[0];
  append(`Using Android serial: ${selectedAndroidSerial}`);

  run('install APK', ['install', '-r', apkPath]);
  if (compilePackage) {
    run('compile installed package', ['shell', 'cmd', 'package', 'compile', '-m', 'speed', '-f', packageName], {
      timeout: compilePackageTimeoutMs,
    });
  }
  if (clearAppData) {
    run('clear app data', ['shell', 'pm', 'clear', packageName]);
  }
  try {
    run('grant notification permission', [
      'shell',
      'pm',
      'grant',
      packageName,
      'android.permission.POST_NOTIFICATIONS',
    ]);
  } catch (permissionError) {
    append(`grant notification permission skipped: ${permissionError.message}`);
  }
  if (metroRequired) {
    run('reverse Metro port', ['reverse', 'tcp:8081', 'tcp:8081']);
  }
  if (postInstallSettleMs > 0) {
    append(`Waiting ${postInstallSettleMs}ms for package manager and services to settle...`);
    sleep(postInstallSettleMs);
  }
  run('clear logcat', ['logcat', '-c']);
  run('force-stop app', ['shell', 'am', 'force-stop', packageName]);
  run('launch app', ['shell', 'am', 'start', '-W', '-n', activityName]);

  append(`\nWaiting ${startupWaitMs}ms for startup logs...`);
  sleep(startupWaitMs);

  const pidOutput = run('read app pid', ['shell', 'pidof', packageName], { printOutput: false }).trim();

  appPid = pidOutput.split(/\s+/).find(Boolean);

  if (!appPid) {
    throw new Error(`Unable to find running process for ${packageName} after launch.`);
  }

  append(`App PID: ${appPid}`);

  const logcat = run('read app startup logcat', ['logcat', '-d', '--pid', appPid, '-t', String(logcatLineLimit)], {
    printOutput: false,
  });

  capturedLogcatLines = logcat.split(/\r?\n/).filter(Boolean).length;
  append(`Captured ${capturedLogcatLines} recent logcat lines.`);
  const failingLines = logcat
    .split(/\r?\n/)
    .filter(line =>
      /AndroidRuntime|FATAL EXCEPTION|ReactNativeJS.*(Error|TypeError|ReferenceError)|E ReactNative/.test(line),
    );

  if (failingLines.length > 0) {
    append('\nStartup smoke found fatal/runtime logcat lines:');
    failingLines.forEach(line => append(line));
    finish(1);
  }

  acceptFirstRunTermsIfNeeded();
  completeFirstRunPinIfNeeded();
  completeFirstRunTransactionPasswordIfNeeded();
  skipFirstRunEmailIfNeeded();
  closeFirstRunSuccessIfNeeded();

  const windowOutput = run('read focused window', ['shell', 'dumpsys', 'window'], {
    printOutput: false,
    recordOutput: false,
  });

  if (!windowOutput.includes(packageName)) {
    throw new Error(`Focused window output does not include ${packageName}.`);
  }

  append(`Focused window includes ${packageName}.`);

  let uiHierarchy = '';
  let missingTexts = expectedTexts;
  let uiDeadline = Date.now() + uiWaitMs;
  let uiAttempt = 0;

  do {
    uiAttempt += 1;
    uiAttempts = uiAttempt;
    uiHierarchy = readUiHierarchy(`attempt ${uiAttempt}`);
    writeFileSync(uiOutputPath, uiHierarchy);

    if (hasFirstRunFlow(uiHierarchy)) {
      append(`UI hierarchy attempt ${uiAttempt} is still in first-run flow; completing onboarding and retrying...`);
      completeFirstRunFlowIfNeeded();
      uiDeadline = Date.now() + uiWaitMs;
      sleep(uiPollIntervalMs);
      continue;
    }

    missingTexts = expectedTexts.filter(text => !uiHierarchy.includes(`text="${text}"`));

    if (missingTexts.length === 0) {
      break;
    }

    if (Date.now() < uiDeadline) {
      append(`UI hierarchy attempt ${uiAttempt} missing expected text(s): ${missingTexts.join(', ')}; retrying...`);
      sleep(uiPollIntervalMs);
    }
  } while (Date.now() < uiDeadline);

  append(`UI hierarchy written to ${uiOutputPath}`);

  if (missingTexts.length > 0) {
    throw new Error(`UI hierarchy is missing expected text(s): ${missingTexts.join(', ')}`);
  }

  if (expectedTexts.length > 0) {
    append(`Found expected UI text(s): ${expectedTexts.join(', ')}`);
  }

  const missingResourceIds = expectedResourceIds.filter(resourceId => !uiHierarchy.includes(`resource-id="${resourceId}"`));

  if (missingResourceIds.length > 0) {
    throw new Error(`UI hierarchy is missing expected resource ID(s): ${missingResourceIds.join(', ')}`);
  }

  if (expectedResourceIds.length > 0) {
    append(`Found expected resource ID(s): ${expectedResourceIds.join(', ')}`);
  }

  uiHierarchy = validateEmptyDashboardCtaFlowIfEnabled(uiHierarchy);
  uiHierarchy = validateEmptyTabNavigationIfEnabled(uiHierarchy);

  runBinary('capture screenshot', ['exec-out', 'screencap', '-p'], screenshotOutputPath);

  smokeOutcome = 'passed';
  smokeReason = 'expected UI texts found and no fatal/runtime logcat findings';
  append('\nAndroid dev smoke helper completed without fatal/runtime logcat findings.');
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
