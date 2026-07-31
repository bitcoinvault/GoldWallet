import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

export const ANDROID_16_KB_RUNTIME_PAGE_SIZE = 16384;

export const parseAndroidRuntimePageSize = output => {
  const value = typeof output === 'string' ? output.trim() : '';

  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    throw new Error(`Android runtime returned an invalid page size: ${value || 'missing'}`);
  }

  return Number(value);
};

export const assertAndroid16KbRuntimePageSize = pageSize => {
  if (pageSize !== ANDROID_16_KB_RUNTIME_PAGE_SIZE) {
    throw new Error(
      `Android runtime page size must be ${ANDROID_16_KB_RUNTIME_PAGE_SIZE} bytes. Received: ${pageSize}`,
    );
  }
};

export const getRequiredAndroidRuntimePageSize = (env = process.env) => {
  const value = env.ANDROID_SMOKE_REQUIRED_PAGE_SIZE?.trim();

  return value ? parseAndroidRuntimePageSize(value) : null;
};

export const getAndroid16KbRuntimeProofEnvironment = (env = process.env) => ({
  ...env,
  ANDROID_SMOKE_REQUIRED_PAGE_SIZE: String(ANDROID_16_KB_RUNTIME_PAGE_SIZE),
});

export const getAndroidAdbCommand = (env = process.env) => {
  const executable = process.platform === 'win32' ? 'adb.exe' : 'adb';
  const sdkRoots = [
    env.ANDROID_HOME,
    env.ANDROID_SDK_ROOT,
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Android', 'Sdk'),
  ].filter(Boolean);
  const candidate = sdkRoots.map(root => path.join(root, 'platform-tools', executable)).find(existsSync);

  return candidate || 'adb';
};

export const readAndroidRuntimePageSize = ({
  serial,
  env = process.env,
  spawn = spawnSync,
  timeoutMs = 30000,
} = {}) => {
  const selectedSerial = serial?.trim();

  if (!selectedSerial || !/^[a-zA-Z0-9._:-]+$/.test(selectedSerial)) {
    throw new Error('ANDROID_SERIAL must identify one connected Android device');
  }

  const adbCommand = getAndroidAdbCommand(env);
  const run = args =>
    spawn(adbCommand, ['-s', selectedSerial, ...args], {
      encoding: 'utf8',
      env,
      timeout: timeoutMs,
      windowsHide: true,
    });
  const stateResult = run(['get-state']);

  if (stateResult.error || stateResult.status !== 0 || stateResult.stdout?.trim() !== 'device') {
    throw new Error(`Android device ${selectedSerial} is not online`);
  }

  const pageSizeResult = run(['shell', 'getconf', 'PAGE_SIZE']);

  if (pageSizeResult.error || pageSizeResult.status !== 0) {
    throw new Error(`Unable to read Android runtime page size from ${selectedSerial}`);
  }

  return {
    adbCommand,
    serial: selectedSerial,
    pageSize: parseAndroidRuntimePageSize(pageSizeResult.stdout),
  };
};
