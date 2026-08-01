import assert from 'assert';
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

import {
  acquireAndroidPlayRunLock,
  assertAndroidPlayRunLockOwnership,
  createAndroidPlayCandidateSnapshot,
  createAndroidPlayCandidateUpload,
  hashAndroidPlayCandidate,
  resolveAndroidPlaySharedPaths,
} from './androidPlayCandidateArtifact.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(os.tmpdir(), `goldwallet-play-candidate-${process.pid}`);
const lockPath = path.join(fixtureRoot, 'handoff.lock');
const sourcePath = path.join(fixtureRoot, 'signed.aab');
const snapshotDirectory = path.join(fixtureRoot, 'candidates');

try {
  mkdirSync(fixtureRoot, { recursive: true });
  const sharedPaths = resolveAndroidPlaySharedPaths(repositoryRoot);
  assert(sharedPaths.runLockPath.includes(`${path.sep}.git${path.sep}goldwallet-locks${path.sep}`));
  assert(!sharedPaths.runLockPath.startsWith(path.join(repositoryRoot, 'local-docs')));
  const primaryRepositoryRoot = path.dirname(path.dirname(sharedPaths.candidateSnapshotDirectory));
  assert.strictEqual(resolveAndroidPlaySharedPaths(primaryRepositoryRoot).runLockPath, sharedPaths.runLockPath);

  const lock = acquireAndroidPlayRunLock({ lockPath, pid: 1234, startedAt: new Date('2026-08-01T10:00:00.000Z') });
  assert(existsSync(lockPath));
  assertAndroidPlayRunLockOwnership({ lockPath, token: lock.token });
  assert.throws(() => assertAndroidPlayRunLockOwnership({ lockPath, token: 'different-token' }), /owned by another process/);
  assert.throws(() => acquireAndroidPlayRunLock({ lockPath }), /already locked/);
  lock.release();
  assert(!existsSync(lockPath));
  assert.throws(() => assertAndroidPlayRunLockOwnership({ lockPath, token: lock.token }), /lock is missing/);
  lock.release();

  writeFileSync(sourcePath, 'signed-aab-one');
  const snapshot = createAndroidPlayCandidateSnapshot({
    sourcePath,
    snapshotDirectory,
    packageName: 'io.goldwallet.wallet',
    track: 'internal',
    versionCode: 15,
    versionName: '6.5.3',
    certificateSha256: 'c'.repeat(64),
  });
  assert.strictEqual(snapshot.bytes, Buffer.byteLength('signed-aab-one'));
  assert.strictEqual(snapshot.sha256, hashAndroidPlayCandidate(sourcePath));
  assert(existsSync(snapshot.snapshotPath));
  assert(existsSync(snapshot.manifestPath));

  const upload = createAndroidPlayCandidateUpload(snapshot.snapshotPath);
  const chunks = [];
  for await (const chunk of upload.stream) chunks.push(chunk);
  const uploadEvidence = await upload.evidence;
  assert.strictEqual(Buffer.concat(chunks).toString('utf8'), 'signed-aab-one');
  assert.deepStrictEqual(uploadEvidence, { bytes: snapshot.bytes, sha256: snapshot.sha256 });

  const failedUpload = createAndroidPlayCandidateUpload(snapshot.snapshotPath, {
    sourceFactory: () =>
      new Readable({
        read() {
          this.destroy(new Error('fixture source failure'));
        },
      }),
  });
  await assert.rejects(async () => {
    for await (const _chunk of failedUpload.stream) {
      // Consume the guarded stream so the source error must propagate.
    }
  }, /fixture source failure/);
  await assert.rejects(failedUpload.evidence, /fixture source failure/);
  assert.strictEqual(failedUpload.stream.destroyed, true);

  const repeated = createAndroidPlayCandidateSnapshot({
    sourcePath,
    snapshotDirectory,
    packageName: 'io.goldwallet.wallet',
    track: 'internal',
    versionCode: 15,
    versionName: '6.5.3',
    certificateSha256: 'c'.repeat(64),
  });
  assert.deepStrictEqual(repeated, snapshot);

  chmodSync(snapshot.snapshotPath, 0o644);
  writeFileSync(sourcePath, 'signed-aab-two');
  assert.throws(
    () =>
      createAndroidPlayCandidateSnapshot({
        sourcePath,
        snapshotDirectory,
        packageName: 'io.goldwallet.wallet',
        track: 'internal',
        versionCode: 15,
        versionName: '6.5.3',
        certificateSha256: 'c'.repeat(64),
      }),
    /already has a different immutable candidate snapshot/,
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android Play candidate artifact guard checks passed.');
