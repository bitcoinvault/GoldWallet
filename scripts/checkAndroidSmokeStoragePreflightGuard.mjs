import {
  getAndroidDataStoragePreflight,
  parseAndroidDfAvailableKilobytes,
  renderAndroidDataStorageFailure,
} from './androidDataStoragePreflight.mjs';

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

console.log('Android smoke storage preflight guard checks are valid.');

