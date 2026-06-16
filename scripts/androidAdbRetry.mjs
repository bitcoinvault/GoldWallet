import { spawnSync } from 'child_process';

const transientAdbFailurePatterns = [
  /cannot connect to daemon/i,
  /daemon not running/i,
  /device offline/i,
  /adb(?:\.exe)?: device offline/i,
  /protocol fault/i,
  /connection closed/i,
  /10060/,
  /timed out/i,
  /ETIMEDOUT/i,
];

const toText = value => {
  if (!value) {
    return '';
  }

  return Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
};

export const formatAdbFailureReason = result => {
  const stderr = toText(result.stderr).trim();
  const stdout = toText(result.stdout).trim();

  return result.error?.message || stderr || stdout || `exit ${result.status}`;
};

export const isTransientAdbFailure = result => {
  if (!result || (!result.error && result.status === 0)) {
    return false;
  }

  const failureText = [
    result.error?.message,
    result.error?.code,
    toText(result.stdout),
    toText(result.stderr),
  ]
    .filter(Boolean)
    .join('\n');

  return transientAdbFailurePatterns.some(pattern => pattern.test(failureText));
};

const runAdbServerCommand = ({
  adbCommand,
  args,
  root,
  shell,
  timeout,
  append,
  spawn = spawnSync,
}) => {
  const result = spawn(adbCommand, args, {
    cwd: root,
    encoding: 'utf8',
    shell,
    timeout,
  });

  if (result.stdout?.trim()) {
    append(result.stdout.trimEnd());
  }

  if (result.stderr?.trim()) {
    append(result.stderr.trimEnd());
  }

  return result;
};

const restartAdbServer = ({ adbCommand, root, shell, timeout, append, spawn }) => {
  append('ADB transport failure detected; restarting adb server before retry...');
  runAdbServerCommand({ adbCommand, args: ['kill-server'], root, shell, timeout, append, spawn });
  const startResult = runAdbServerCommand({
    adbCommand,
    args: ['start-server'],
    root,
    shell,
    timeout,
    append,
    spawn,
  });

  if (startResult.error || startResult.status !== 0) {
    append(`adb start-server returned ${formatAdbFailureReason(startResult)}`);
  }

  runAdbServerCommand({ adbCommand, args: ['devices'], root, shell, timeout, append, spawn });
};

export const runAdbProcessWithRetry = ({
  adbCommand,
  args,
  root,
  selectedAndroidSerial,
  useSelectedDevice = true,
  timeoutMs,
  encoding = 'utf8',
  shell = adbCommand === 'adb' && process.platform === 'win32',
  spawnOptions = {},
  maxRetries = 1,
  append = () => {},
  spawn = spawnSync,
}) => {
  const adbArgs = useSelectedDevice && selectedAndroidSerial ? ['-s', selectedAndroidSerial, ...args] : args;
  const spawnConfig = {
    cwd: root,
    encoding,
    shell,
    timeout: timeoutMs,
    ...spawnOptions,
  };

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const result = spawn(adbCommand, adbArgs, spawnConfig);

    if (!result.error && result.status === 0) {
      return result;
    }

    if (attempt >= maxRetries || !isTransientAdbFailure(result)) {
      return result;
    }

    append(
      `ADB command "${adbArgs.join(' ')}" failed with a transient transport error on attempt ${attempt + 1}/${
        maxRetries + 1
      }: ${formatAdbFailureReason(result)}`,
    );
    restartAdbServer({
      adbCommand,
      root,
      shell,
      timeout: spawnConfig.timeout,
      append,
      spawn,
    });
  }

  return spawn(adbCommand, adbArgs, spawnConfig);
};
