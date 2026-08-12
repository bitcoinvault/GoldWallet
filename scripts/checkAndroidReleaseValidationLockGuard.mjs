import assert from 'assert';
import { EventEmitter } from 'events';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { PassThrough } from 'stream';

import {
  acquireAndroidReleaseValidationLock,
  readAndroidReleaseValidationLock,
} from './androidReleaseValidationLock.mjs';
import { runStreamingChildProcess } from './streamChildProcess.mjs';

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-release-lock-${process.pid}`);
const lockPath = path.join(fixtureRoot, 'release.lock');

try {
  rmSync(fixtureRoot, { recursive: true, force: true });
  mkdirSync(fixtureRoot, { recursive: true });

  const activeLock = acquireAndroidReleaseValidationLock({ lockPath });
  assert.strictEqual(readAndroidReleaseValidationLock(lockPath).ownerPid, process.pid);
  assert.throws(() => acquireAndroidReleaseValidationLock({ lockPath }), /already running/);
  assert.throws(() => activeLock.setChildPid(0), /child PID is invalid/);

  const childResult = await runStreamingChildProcess({
    command: process.execPath,
    args: ['-e', "process.stdout.write('child-out'); process.stderr.write('child-err')"],
    cwd: fixtureRoot,
    env: process.env,
    forwardOutput: false,
    onSpawn: childPid => activeLock.setChildPid(childPid),
  });
  assert.strictEqual(childResult.status, 0);
  assert.strictEqual(childResult.signal, null);
  assert.strictEqual(childResult.stdout, 'child-out');
  assert.strictEqual(childResult.stderr, 'child-err');
  activeLock.setChildPid(null);
  activeLock.release();
  assert(!existsSync(lockPath));

  const staleLock = acquireAndroidReleaseValidationLock({ lockPath });
  const staleToken = staleLock.token;
  const recoveredLock = acquireAndroidReleaseValidationLock({ lockPath, processAlive: () => false });
  assert.notStrictEqual(recoveredLock.token, staleToken);
  assert.throws(() => staleLock.release(), /ownership changed/);
  recoveredLock.release();

  const staleRaceLock = acquireAndroidReleaseValidationLock({ lockPath, ownerPid: 2147483647 });
  let staleRaceWinner;
  assert.throws(
    () =>
      acquireAndroidReleaseValidationLock({
        lockPath,
        onStaleLockObserved: () => {
          if (!staleRaceWinner) staleRaceWinner = acquireAndroidReleaseValidationLock({ lockPath });
        },
      }),
    /already running/,
  );
  assert(staleRaceWinner, 'One stale-lock contender must acquire the recovered lock.');
  assert.strictEqual(readAndroidReleaseValidationLock(lockPath).token, staleRaceWinner.token);
  assert(!existsSync(path.join(lockPath, `.reclaim-${staleRaceLock.token}`)));
  assert.throws(() => staleRaceLock.release(), /ownership changed/);
  staleRaceWinner.release();

  const childOwnedLock = acquireAndroidReleaseValidationLock({ lockPath, ownerPid: 2147483647 });
  childOwnedLock.setChildPid(process.pid);
  assert.throws(() => acquireAndroidReleaseValidationLock({ lockPath }), /active PID: .*release\.lock/);
  childOwnedLock.release();

  mkdirSync(lockPath);
  writeFileSync(path.join(lockPath, 'owner.json'), '{broken-json');
  assert.throws(() => acquireAndroidReleaseValidationLock({ lockPath }), /state is unreadable/);
  rmSync(lockPath, { recursive: true });

  const overflow = await runStreamingChildProcess({
    command: process.execPath,
    args: ['-e', "process.stdout.write('too-long')"],
    cwd: fixtureRoot,
    env: process.env,
    maxBuffer: 3,
    forwardOutput: false,
  });
  assert.match(overflow.error?.message || '', /output exceeded 3 bytes/);
  assert.strictEqual(overflow.status, 0);
  assert.strictEqual(overflow.stdout, '');

  const missingPid = await runStreamingChildProcess({
    command: 'unused',
    args: [],
    cwd: fixtureRoot,
    env: process.env,
    forwardOutput: false,
    spawnProcess: () => {
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      child.kill = () => {
        queueMicrotask(() => child.emit('close', null, 'SIGTERM'));
        return true;
      };
      return child;
    },
  });
  assert.match(missingPid.error?.message || '', /did not provide a valid PID/);

  const validatorSource = readFileSync('scripts/runAndroidReleaseValidation.mjs', 'utf8');
  const lockAcquisitionIndex = validatorSource.indexOf('acquireAndroidReleaseValidationLock({ lockPath })');
  const generatedOutputRemovalIndex = validatorSource.indexOf(
    'rmSync(generatedPath, { recursive: true, force: true })',
  );
  assert(lockAcquisitionIndex >= 0, 'Android release validator must acquire the single-writer lock.');
  assert(
    generatedOutputRemovalIndex > lockAcquisitionIndex,
    'Android release validator must acquire the lock before deleting generated release outputs.',
  );
  assert.match(validatorSource, /await runGradleTaskWithBoundedRetry\(task, validationLock\)/);
  assert.match(validatorSource, /onSpawn: childPid => \{[\s\S]*validationLock\.setChildPid\(childPid\)/);
  assert.match(validatorSource, /finally \{[\s\S]*validationLock\.setChildPid\(null\)/);
  assert.match(validatorSource, /finally \{[\s\S]*validationLock\.release\(\)/);
  assert.match(validatorSource, /result\.status !== 0 \|\|[\s\S]*result\.error \|\|/);

  console.log('Android release validation single-writer lock guard checks passed.');
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
