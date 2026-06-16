import { formatAdbFailureReason, isTransientAdbFailure, runAdbProcessWithRetry } from './androidAdbRetry.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const transientResult = {
  status: 1,
  stdout: '',
  stderr: 'adb.exe: cannot connect to daemon at tcp:5037: cannot connect to 127.0.0.1:5037',
};
const regularFailureResult = {
  status: 1,
  stdout: '',
  stderr: 'Failure [INSTALL_FAILED_VERSION_DOWNGRADE]',
};

assert(isTransientAdbFailure(transientResult), 'ADB daemon connectivity failures must be treated as transient.');
assert(
  isTransientAdbFailure({ status: null, error: { code: 'ETIMEDOUT', message: 'spawnSync adb ETIMEDOUT' } }),
  'ADB process timeouts must be treated as transient transport failures.',
);
assert(
  isTransientAdbFailure({ status: 1, stderr: 'error: connection closed' }),
  'ADB connection-closed failures must be treated as transient.',
);
assert(!isTransientAdbFailure(regularFailureResult), 'Regular command failures must not be retried.');
assert(
  formatAdbFailureReason(regularFailureResult) === 'Failure [INSTALL_FAILED_VERSION_DOWNGRADE]',
  'ADB failure formatting should preserve stderr details.',
);

const retryCalls = [];
const retryLogs = [];
let originalCommandAttempts = 0;
const retrySpawn = (_command, args) => {
  retryCalls.push(args.join(' '));

  if (args.join(' ') === '-s emulator-5554 shell input text 1111') {
    originalCommandAttempts += 1;

    if (originalCommandAttempts === 1) {
      return transientResult;
    }

    return { status: 0, stdout: 'ok\n', stderr: '' };
  }

  if (['kill-server', 'start-server', 'devices'].includes(args.join(' '))) {
    return { status: 0, stdout: '', stderr: '' };
  }

  return { status: 1, stdout: '', stderr: `unexpected command ${args.join(' ')}` };
};

const retryResult = runAdbProcessWithRetry({
  adbCommand: 'adb',
  args: ['shell', 'input', 'text', '1111'],
  root: process.cwd(),
  selectedAndroidSerial: 'emulator-5554',
  timeoutMs: 1000,
  append: line => retryLogs.push(line),
  spawn: retrySpawn,
});

assert(retryResult.status === 0, 'Transient ADB transport failures should retry the original command.');
assert(originalCommandAttempts === 2, 'The original ADB command should be retried exactly once.');
assert(retryCalls.includes('kill-server'), 'Transient recovery should kill the adb server.');
assert(retryCalls.includes('start-server'), 'Transient recovery should start the adb server.');
assert(retryCalls.includes('devices'), 'Transient recovery should refresh adb devices.');
assert(
  retryLogs.some(line => line.includes('transient transport error')),
  'Transient retry should leave deterministic smoke log evidence.',
);

const noRetryCalls = [];
const noRetryResult = runAdbProcessWithRetry({
  adbCommand: 'adb',
  args: ['install', '-r', 'app.apk'],
  root: process.cwd(),
  selectedAndroidSerial: 'emulator-5554',
  timeoutMs: 1000,
  append: () => {},
  spawn: (_command, args) => {
    noRetryCalls.push(args.join(' '));
    return regularFailureResult;
  },
});

assert(noRetryResult.status === 1, 'Regular ADB command failures should be returned unchanged.');
assert(noRetryCalls.length === 1, 'Regular ADB command failures should not trigger retry or server restart.');

console.log('Android ADB retry guard passed.');
