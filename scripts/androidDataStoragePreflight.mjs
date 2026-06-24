export const parseAndroidDfAvailableKilobytes = output => {
  const lines = output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !/^Filesystem\b/i.test(line));

  const dataLine = lines.find(line => /\s\/data(?:\/user\/0)?$/.test(line)) || lines[0];

  if (!dataLine) {
    throw new Error('Unable to parse Android data storage: df output is empty');
  }

  const parts = dataLine.split(/\s+/);
  const available = Number(parts[3]);

  if (!Number.isFinite(available) || available <= 0) {
    throw new Error(`Unable to parse Android data storage available KiB from df line: ${dataLine}`);
  }

  return available;
};

export const getRequiredDataKilobytes = (apkBytes, multiplier) => {
  if (!Number.isFinite(apkBytes) || apkBytes <= 0) {
    throw new Error(`APK bytes must be a positive number. Received: ${apkBytes}`);
  }

  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new Error(`Storage multiplier must be a positive number. Received: ${multiplier}`);
  }

  return Math.ceil((apkBytes * multiplier) / 1024);
};

export const formatKibAsMib = kib => `${(kib / 1024).toFixed(1)} MiB`;

export const getAndroidDataStoragePreflight = ({ dfOutput, apkBytes, multiplier }) => {
  const availableKilobytes = parseAndroidDfAvailableKilobytes(dfOutput);
  const requiredKilobytes = getRequiredDataKilobytes(apkBytes, multiplier);
  const passed = availableKilobytes >= requiredKilobytes;

  return {
    passed,
    availableKilobytes,
    requiredKilobytes,
    availableLabel: formatKibAsMib(availableKilobytes),
    requiredLabel: formatKibAsMib(requiredKilobytes),
  };
};

export const renderAndroidDataStorageFailure = ({ availableLabel, requiredLabel, apkBytes, multiplier }) =>
  [
    `Android data storage preflight failed: emulator /data has ${availableLabel} free,`,
    `but this ${(apkBytes / 1024 / 1024).toFixed(1)} MiB APK requires at least ${requiredLabel} free`,
    `(multiplier ${multiplier}). Free emulator storage or uninstall old test packages before rerunning smoke.`,
  ].join(' ');

