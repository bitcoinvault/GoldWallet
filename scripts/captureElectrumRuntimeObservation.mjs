import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'local-docs');
const outputPath = path.join(outputDir, 'electrum-runtime-observation.txt');
const uiOutputPath = path.join(outputDir, 'electrum-runtime-observation-ui.xml');
const packageName = process.env.ELECTRUM_OBSERVATION_PACKAGE || 'io.goldwallet.wallet.dev';
const requestedSerial = process.env.ANDROID_SERIAL?.trim();
const logcatLineLimit = Number(process.env.ELECTRUM_OBSERVATION_LOGCAT_LINES || 1200);
const waitMs = Number(process.env.ELECTRUM_OBSERVATION_WAIT_MS || 20000);
const appPidWaitMs = Number(process.env.ELECTRUM_OBSERVATION_PID_WAIT_MS || 60000);
const pollIntervalMs = Number(process.env.ELECTRUM_OBSERVATION_POLL_INTERVAL_MS || 1000);
const requireSuccess = process.env.ELECTRUM_OBSERVATION_REQUIRE_SUCCESS === 'true';

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

const runAdb = (label, args, options = {}) => {
  const { selectedSerial, allowFailure = false } = options;
  const adbArgs = selectedSerial ? ['-s', selectedSerial, ...args] : args;
  const result = spawnSync(adbCommand, adbArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: adbCommand === 'adb' && process.platform === 'win32',
    timeout: Number(process.env.ELECTRUM_OBSERVATION_ADB_TIMEOUT_MS || 60000),
  });

  if (!allowFailure && (result.error || result.status !== 0)) {
    const reason = result.error?.message || result.stderr?.trim() || `exit ${result.status}`;
    throw new Error(`${label} failed: ${reason}`);
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
  };
};

const sleep = milliseconds => {
  spawnSync(process.execPath, ['-e', `setTimeout(() => {}, ${milliseconds})`], { stdio: 'ignore' });
};

const selectDevice = () => {
  const devicesOutput = runAdb('adb devices', ['devices']).stdout;
  const devices = devicesOutput
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim())
    .filter(line => /\tdevice$/.test(line));
  const serials = devices.map(line => line.split(/\s+/)[0]).filter(Boolean);

  if (serials.length === 0) {
    throw new Error('No connected Android device/emulator in device state.');
  }

  if (requestedSerial) {
    if (!serials.includes(requestedSerial)) {
      throw new Error(`ANDROID_SERIAL=${requestedSerial} is not connected. Connected device(s): ${serials.join(', ')}`);
    }
    return requestedSerial;
  }

  if (serials.length > 1) {
    throw new Error(`Multiple Android devices/emulators connected: ${serials.join(', ')}. Set ANDROID_SERIAL.`);
  }

  return serials[0];
};

const waitForPid = selectedSerial => {
  const deadline = Date.now() + appPidWaitMs;

  do {
    const pidOutput = runAdb('read app pid', ['shell', 'pidof', packageName], {
      selectedSerial,
      allowFailure: true,
    }).stdout.trim();
    const pid = pidOutput.split(/\s+/).find(Boolean);

    if (pid) {
      return pid;
    }

    sleep(pollIntervalMs);
  } while (Date.now() < deadline);

  throw new Error(`Unable to find running process for ${packageName}. Run android:dev:smoke:embedded first.`);
};

export const sanitizeLine = line =>
  line
    .replace(/(SENTRY_DSN_(?:IOS|ANDROID)=)[^\s,]+/g, '$1<redacted>')
    .replace(/(CODEPUSH_DEPLOYMENT_KEY_(?:IOS|ANDROID)=)[^\s,]+/g, '$1<redacted>');

const fileSha256 = content => createHash('sha256').update(content).digest('hex');

const captureUiHierarchy = selectedSerial => {
  const devicePath = '/sdcard/goldwallet-electrum-runtime-window.xml';
  const dumpResult = runAdb('dump UI hierarchy', ['shell', 'uiautomator', 'dump', devicePath], {
    selectedSerial,
    allowFailure: true,
  });

  if (dumpResult.status !== 0) {
    return {
      captured: false,
      hierarchy: '',
      error: sanitizeLine(dumpResult.stderr.trim() || dumpResult.stdout.trim() || `exit ${dumpResult.status}`),
    };
  }

  const readResult = runAdb('read UI hierarchy', ['exec-out', 'cat', devicePath], {
    selectedSerial,
    allowFailure: true,
  });

  if (readResult.status !== 0 || !readResult.stdout.trim()) {
    return {
      captured: false,
      hierarchy: '',
      error: sanitizeLine(readResult.stderr.trim() || readResult.stdout.trim() || `exit ${readResult.status}`),
    };
  }

  writeFileSync(uiOutputPath, readResult.stdout);

  return {
    captured: true,
    hierarchy: readResult.stdout,
    error: '',
  };
};

export const parseUiHierarchy = hierarchy => {
  const connectionIssueMarkers = [
    'No internet connection',
    'Ensure that WI-FI or mobile data are turned on, then try again.',
    "You're offline",
    'Connect to the internet to restore full functionality.',
    'Connect to the internet to continue using these functions.',
    'No network',
    'Your internet works, but you are not connected to the network.',
    'Electrum client is not connected',
  ];
  const runtimeUiMarkers = [
    'dashboard-header',
    'navigation-tab-0',
    'create-wallet-button',
    'import-wallet-button',
    'scan-public-key-code-button',
    'Wallets',
    'No wallets',
    'Create new wallet',
    'Import wallet',
    'Add new wallet',
    'Add Fast Key',
  ];

  return {
    appPackageVisible: hierarchy.includes(`package="${packageName}"`),
    connectionIssueMarkers: connectionIssueMarkers.filter(marker => hierarchy.includes(marker)),
    runtimeUiMarkers: runtimeUiMarkers.filter(marker => hierarchy.includes(marker)),
  };
};

export const parseObservation = logcat => {
  const lines = logcat.split(/\r?\n/).filter(Boolean);
  const electrumLines = lines
    .filter(line => /BlueElectrum|ElectrumX|Electrum|electrum|connected to server|begin connection|bad connection/.test(line))
    .map(sanitizeLine);
  const fatalLines = lines.filter(line =>
    /AndroidRuntime|FATAL EXCEPTION|ReactNativeJS.*(Error|TypeError|ReferenceError)|E ReactNative/.test(line),
  );
  const successfulLines = electrumLines.filter(line =>
    /connected to server|connected to, ElectrumX|ElectrumX [0-9]|server.version/i.test(line),
  );
  const failureLines = electrumLines.filter(line => /bad connection|failed|timeout|ECONN|EHOST|ENOTFOUND/i.test(line));

  return {
    lines,
    electrumLines,
    fatalLines,
    successfulLines,
    failureLines,
  };
};

export const renderSummary = ({
  selectedSerial,
  pid,
  logcat,
  observation,
  uiCapture,
  uiObservation,
  generatedAt = new Date().toISOString(),
}) => {
  const logcatSha256 = fileSha256(logcat);
  const uiHierarchySha256 = uiCapture.captured ? fileSha256(uiCapture.hierarchy) : '<missing>';
  const uiReady =
    uiCapture.captured &&
    uiObservation.appPackageVisible &&
    uiObservation.connectionIssueMarkers.length === 0 &&
    uiObservation.runtimeUiMarkers.length > 0;
  const outcome =
    observation.fatalLines.length > 0
      ? 'failed'
      : observation.successfulLines.length > 0
        ? 'passed'
        : observation.electrumLines.length > 0
          ? 'observed-without-success'
          : 'inconclusive';
  const reason =
    outcome === 'passed'
      ? 'Electrum connection success evidence found and no fatal/runtime logcat findings'
      : outcome === 'observed-without-success'
        ? 'Electrum log lines found but no connection success evidence'
        : outcome === 'inconclusive'
          ? 'No Electrum log lines found in the captured process logcat'
          : 'fatal/runtime logcat findings found';

  const summaryLines = [
    `Generated at: ${generatedAt}`,
    `Electrum observation outcome: ${outcome}`,
    `Electrum observation reason: ${reason}`,
    `Android serial: ${selectedSerial}`,
    `Android package: ${packageName}`,
    `App PID: ${pid}`,
    `Wait before capture ms: ${waitMs}`,
    `Captured logcat line limit: ${logcatLineLimit}`,
    `Captured logcat lines: ${observation.lines.length}`,
    `Captured logcat sha256: ${logcatSha256}`,
    `Electrum log lines: ${observation.electrumLines.length}`,
    `Electrum success lines: ${observation.successfulLines.length}`,
    `Electrum failure lines: ${observation.failureLines.length}`,
    `Fatal/runtime logcat lines: ${observation.fatalLines.length}`,
    'Secret values printed: no',
    `Require success: ${requireSuccess ? 'yes' : 'no'}`,
    `UI hierarchy path: ${uiOutputPath}`,
    `UI hierarchy captured: ${uiCapture.captured ? 'yes' : 'no'}`,
    `UI hierarchy bytes: ${uiCapture.hierarchy.length}`,
    `UI hierarchy sha256: ${uiHierarchySha256}`,
    `UI capture error: ${uiCapture.error || '<none>'}`,
    `App UI package visible: ${uiObservation.appPackageVisible ? 'yes' : 'no'}`,
    `Connection issue UI visible: ${uiObservation.connectionIssueMarkers.length > 0 ? 'yes' : 'no'}`,
    `Connection issue UI markers: ${
      uiObservation.connectionIssueMarkers.length > 0 ? uiObservation.connectionIssueMarkers.join(', ') : '<none>'
    }`,
    `Runtime UI evidence: ${uiReady ? 'ready' : 'not ready'}`,
    `Runtime UI markers: ${uiObservation.runtimeUiMarkers.length > 0 ? uiObservation.runtimeUiMarkers.join(', ') : '<none>'}`,
    '',
    'Electrum evidence lines:',
    ...(observation.electrumLines.length > 0 ? observation.electrumLines : ['<none>']),
  ];

  return {
    outcome,
    summary: `${summaryLines.join('\n')}\n`,
  };
};

export const runElectrumRuntimeObservation = () => {
  if (!adbCommand) {
    throw new Error('adb not found. Set ANDROID_HOME, ANDROID_SDK_ROOT, or add adb to PATH.');
  }

  if (!Number.isInteger(logcatLineLimit) || logcatLineLimit <= 0) {
    throw new Error(`ELECTRUM_OBSERVATION_LOGCAT_LINES must be a positive integer. Received: ${logcatLineLimit}`);
  }

  mkdirSync(outputDir, { recursive: true });

  const selectedSerial = selectDevice();
  const pid = waitForPid(selectedSerial);
  sleep(waitMs);

  const uiCapture = captureUiHierarchy(selectedSerial);
  const uiObservation = parseUiHierarchy(uiCapture.hierarchy);
  const logcat = runAdb('read process logcat', ['logcat', '-d', '--pid', pid, '-t', String(logcatLineLimit)], {
    selectedSerial,
  }).stdout;
  const observation = parseObservation(logcat);
  const { outcome, summary } = renderSummary({ selectedSerial, pid, logcat, observation, uiCapture, uiObservation });

  writeFileSync(outputPath, summary);
  console.log(`Electrum runtime observation written to ${path.relative(root, outputPath)}`);
  console.log(`Electrum observation outcome: ${outcome}`);

  if (outcome === 'failed' || (requireSuccess && outcome !== 'passed')) {
    return 1;
  }

  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(runElectrumRuntimeObservation());
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
