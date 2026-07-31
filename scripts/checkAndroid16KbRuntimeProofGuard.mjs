import assert from 'assert';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import {
  getAndroid16KbRuntimeProofConfig,
  getAndroid16KbRuntimeProofSummaryErrors,
  renderAndroid16KbRuntimeProofSummary,
} from './android16KbRuntimeProofSummary.mjs';

import {
  ANDROID_16_KB_RUNTIME_PAGE_SIZE,
  assertAndroid16KbRuntimePageSize,
  getAndroid16KbRuntimeProofEnvironment,
  getRequiredAndroidRuntimePageSize,
  parseAndroidRuntimePageSize,
  readAndroidRuntimePageSize,
} from './androidRuntimePageSize.mjs';

assert.strictEqual(ANDROID_16_KB_RUNTIME_PAGE_SIZE, 16384);
assert.strictEqual(parseAndroidRuntimePageSize('16384\r\n'), 16384);
assert.throws(() => parseAndroidRuntimePageSize(''), /invalid page size/);
assert.throws(() => parseAndroidRuntimePageSize('16 KB'), /invalid page size/);
assert.doesNotThrow(() => assertAndroid16KbRuntimePageSize(16384));
assert.throws(() => assertAndroid16KbRuntimePageSize(4096), /must be 16384 bytes/);
assert.strictEqual(getRequiredAndroidRuntimePageSize({}), null);
assert.strictEqual(getRequiredAndroidRuntimePageSize({ ANDROID_SMOKE_REQUIRED_PAGE_SIZE: '16384' }), 16384);
assert.throws(
  () => getRequiredAndroidRuntimePageSize({ ANDROID_SMOKE_REQUIRED_PAGE_SIZE: '16 KB' }),
  /invalid page size/,
);
assert.strictEqual(getAndroid16KbRuntimeProofEnvironment({ FIXTURE: 'yes' }).FIXTURE, 'yes');
assert.strictEqual(getAndroid16KbRuntimeProofEnvironment({}).ANDROID_SMOKE_REQUIRED_PAGE_SIZE, '16384');

const calls = [];
const runtime = readAndroidRuntimePageSize({
  serial: 'emulator-5556',
  env: { ANDROID_HOME: 'C:\\Android' },
  spawn: (command, args, options) => {
    calls.push({ command, args, options });
    return args.at(-1) === 'get-state' ? { status: 0, stdout: 'device\n' } : { status: 0, stdout: '16384\n' };
  },
});
assert.strictEqual(runtime.serial, 'emulator-5556');
assert.strictEqual(runtime.pageSize, 16384);
assert.deepStrictEqual(calls[0].args.slice(-3), ['-s', 'emulator-5556', 'get-state']);
assert.deepStrictEqual(calls[1].args.slice(-5), ['-s', 'emulator-5556', 'shell', 'getconf', 'PAGE_SIZE']);
assert.throws(() => readAndroidRuntimePageSize({ serial: '../invalid', spawn: () => null }), /ANDROID_SERIAL/);
assert.throws(
  () =>
    readAndroidRuntimePageSize({
      serial: 'emulator-5556',
      spawn: () => ({ status: 1, stdout: 'offline' }),
    }),
  /not online/,
);

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const runner = readFileSync('scripts/runAndroid16KbRuntimeProof.mjs', 'utf8');
assert.strictEqual(packageJson.scripts['android:16kb:runtime:verify'], 'node scripts/runAndroid16KbRuntimeProof.mjs');
assert.strictEqual(
  packageJson.scripts['android:16kb:runtime:check-summary'],
  'node scripts/checkAndroid16KbRuntimeProofSummary.mjs',
);
assert(runner.includes('getAndroid16KbRuntimeProofEnvironment'));
assert(runner.includes('runAndroidUploadSigningProof.mjs'));
assert(runner.includes('expectedRuntimePageSize'));
assert(runner.includes('checkAndroid16KbRuntimeProofSummary.mjs'));

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-16kb-runtime-proof-${process.pid}`);
try {
  const config = getAndroid16KbRuntimeProofConfig(fixtureRoot);
  mkdirSync(path.dirname(config.aabPath), { recursive: true });
  writeFileSync(config.aabPath, 'aab');
  writeFileSync(config.universalApkPath, 'apk');
  writeFileSync(config.smokeSummaryPath, 'Android serial: emulator-5556\n');
  const summary = renderAndroid16KbRuntimeProofSummary({
    config,
    serial: 'emulator-5556',
    pageSize: ANDROID_16_KB_RUNTIME_PAGE_SIZE,
    generatedAt: new Date('2026-07-31T12:00:00.000Z'),
  });
  assert.deepStrictEqual(getAndroid16KbRuntimeProofSummaryErrors({ summary, config }), []);
  assert(
    getAndroid16KbRuntimeProofSummaryErrors({
      summary: summary.replace('Observed runtime page size bytes: 16384', 'Observed runtime page size bytes: 4096'),
      config,
    }).some(error => error.includes('Observed runtime page size bytes')),
  );
  writeFileSync(config.aabPath, 'overwritten-aab');
  assert(getAndroid16KbRuntimeProofSummaryErrors({ summary, config }).some(error => error.includes('Signed AAB')));
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android 16 KB runtime proof guard checks passed.');
