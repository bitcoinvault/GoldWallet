import { createHash, randomUUID } from 'crypto';
import {
  chmodSync,
  closeSync,
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  constants,
  fsyncSync,
} from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { Transform } from 'stream';

export const hashAndroidPlayCandidate = filePath =>
  createHash('sha256').update(readFileSync(filePath)).digest('hex');

const requireRegularFile = (filePath, label) => {
  if (!existsSync(filePath) || !statSync(filePath).isFile() || statSync(filePath).size === 0) {
    throw new Error(`${label} must be a non-empty regular file: ${filePath}`);
  }
};

export const resolveAndroidPlaySharedPaths = root => {
  const result = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    if (existsSync(path.join(root, '.git'))) {
      throw new Error('Unable to resolve the shared Git directory for the Android Play handoff lock');
    }
    return {
      runLockPath: path.join(root, 'local-docs', 'android-play-internal-handoff.lock'),
      candidateSnapshotDirectory: path.join(root, 'local-docs', 'android-play-candidates'),
    };
  }
  const gitCommonDirectory = path.resolve(root, result.stdout.trim());
  const primaryRoot = path.dirname(gitCommonDirectory);
  return {
    runLockPath: path.join(gitCommonDirectory, 'goldwallet-locks', 'android-play-internal.lock'),
    candidateSnapshotDirectory: path.join(primaryRoot, 'local-docs', 'android-play-candidates'),
  };
};

export const assertAndroidPlayRunLockOwnership = ({ lockPath, token }) => {
  if (!existsSync(lockPath)) {
    throw new Error(`Android Play handoff lock is missing: ${lockPath}`);
  }
  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  } catch {
    throw new Error(`Android Play handoff lock is unreadable: ${lockPath}`);
  }
  if (!token || lock.token !== token) {
    throw new Error(`Android Play handoff lock is owned by another process: ${lockPath}`);
  }
};

export const acquireAndroidPlayRunLock = ({ lockPath, pid = process.pid, startedAt = new Date() }) => {
  mkdirSync(path.dirname(lockPath), { recursive: true });
  const token = randomUUID();
  let descriptor;
  try {
    descriptor = openSync(lockPath, 'wx', 0o600);
    writeFileSync(descriptor, `${JSON.stringify({ pid, startedAt: startedAt.toISOString(), token })}\n`);
  } catch (error) {
    const lockWasCreated = descriptor !== undefined;
    if (lockWasCreated) closeSync(descriptor);
    if (error.code === 'EEXIST') {
      throw new Error(`Android Play handoff is already locked: ${lockPath}`);
    }
    if (lockWasCreated) rmSync(lockPath, { force: true });
    throw error;
  }
  closeSync(descriptor);

  let released = false;
  return {
    lockPath,
    token,
    release() {
      if (released) return;
      const current = JSON.parse(readFileSync(lockPath, 'utf8'));
      if (current.token !== token) throw new Error(`Android Play handoff lock ownership changed: ${lockPath}`);
      rmSync(lockPath);
      released = true;
    },
  };
};

export const createAndroidPlayCandidateSnapshot = ({
  sourcePath,
  snapshotDirectory,
  packageName,
  track,
  versionCode,
  versionName,
  certificateSha256,
}) => {
  requireRegularFile(sourcePath, 'Signed Android App Bundle');
  const sourceBytes = statSync(sourcePath).size;
  const sourceSha256 = hashAndroidPlayCandidate(sourcePath);
  mkdirSync(snapshotDirectory, { recursive: true });

  const prefix = `${packageName}-${versionCode}-`;
  const snapshotName = `${prefix}${sourceSha256}.aab`;
  const snapshotPath = path.join(snapshotDirectory, snapshotName);
  const manifestPath = path.join(snapshotDirectory, `${prefix}${sourceSha256}.json`);
  const candidateNames = new Set([snapshotName, path.basename(manifestPath)]);
  const conflictingSnapshot = readdirSync(snapshotDirectory).find(
    name => name.startsWith(prefix) && ['.aab', '.json'].includes(path.extname(name)) && !candidateNames.has(name),
  );
  if (conflictingSnapshot) {
    throw new Error(`Android Play versionCode ${versionCode} already has a different immutable candidate snapshot`);
  }

  const snapshotCreated = !existsSync(snapshotPath);
  if (snapshotCreated) {
    copyFileSync(sourcePath, snapshotPath, constants.COPYFILE_EXCL);
  }
  const cleanupCreatedSnapshot = () => {
    if (!snapshotCreated) return;
    try {
      chmodSync(snapshotPath, 0o644);
    } catch {
      // The file may already be absent after a failed copy.
    }
    rmSync(snapshotPath, { force: true });
  };
  requireRegularFile(snapshotPath, 'Android Play candidate snapshot');
  const snapshotSha256 = hashAndroidPlayCandidate(snapshotPath);
  if (snapshotSha256 !== sourceSha256 || statSync(snapshotPath).size !== sourceBytes) {
    cleanupCreatedSnapshot();
    throw new Error('Android Play candidate snapshot does not match the verified signed AAB');
  }
  if (hashAndroidPlayCandidate(sourcePath) !== sourceSha256) {
    cleanupCreatedSnapshot();
    throw new Error('Signed Android App Bundle changed while creating the candidate snapshot');
  }
  chmodSync(snapshotPath, 0o444);

  const manifest = {
    packageName,
    track,
    versionCode,
    versionName,
    bytes: sourceBytes,
    sha256: sourceSha256,
    certificateSha256,
  };
  if (!existsSync(manifestPath)) {
    const temporaryManifestPath = `${manifestPath}.${randomUUID()}.tmp`;
    let descriptor;
    try {
      descriptor = openSync(temporaryManifestPath, 'wx', 0o600);
      writeFileSync(descriptor, `${JSON.stringify(manifest, null, 2)}\n`);
      fsyncSync(descriptor);
      closeSync(descriptor);
      descriptor = undefined;
      renameSync(temporaryManifestPath, manifestPath);
    } catch (error) {
      if (descriptor !== undefined) closeSync(descriptor);
      rmSync(temporaryManifestPath, { force: true });
      cleanupCreatedSnapshot();
      throw error;
    }
  }
  let storedManifest;
  try {
    storedManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    cleanupCreatedSnapshot();
    throw error;
  }
  if (JSON.stringify(storedManifest) !== JSON.stringify(manifest)) {
    cleanupCreatedSnapshot();
    throw new Error('Android Play candidate manifest does not match the verified signed AAB');
  }
  chmodSync(manifestPath, 0o444);

  return { snapshotPath, manifestPath, ...manifest };
};

export const createAndroidPlayCandidateUpload = (filePath, { sourceFactory = createReadStream } = {}) => {
  requireRegularFile(filePath, 'Android Play candidate snapshot');
  const hash = createHash('sha256');
  let bytes = 0;
  let resolveEvidence;
  let rejectEvidence;
  const evidence = new Promise((resolve, reject) => {
    resolveEvidence = resolve;
    rejectEvidence = reject;
  });
  evidence.catch(() => {});
  const source = sourceFactory(filePath);
  const stream = new Transform({
    transform(chunk, encoding, callback) {
      hash.update(chunk);
      bytes += chunk.length;
      callback(null, chunk);
    },
    flush(callback) {
      resolveEvidence({ bytes, sha256: hash.digest('hex') });
      callback();
    },
  });
  source.on('error', error => {
    rejectEvidence(error);
    stream.destroy(error);
  });
  stream.on('error', rejectEvidence);
  source.pipe(stream);
  return {
    stream,
    evidence,
    destroy() {
      source.destroy();
      stream.destroy();
    },
  };
};
