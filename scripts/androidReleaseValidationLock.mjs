import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import path from 'path';

const stateFileName = 'owner.json';

export const isProcessAlive = (pid, kill = process.kill) => {
  if (!Number.isInteger(pid) || pid <= 0) return false;

  try {
    kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
};

const getStatePath = lockPath => path.join(lockPath, stateFileName);

export const readAndroidReleaseValidationLock = lockPath => {
  const statePath = getStatePath(lockPath);
  let state;

  try {
    state = JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    throw new Error(`Android release validation lock state is unreadable: ${statePath}`);
  }

  if (
    typeof state?.token !== 'string' ||
    !state.token ||
    !Number.isInteger(state.ownerPid) ||
    state.ownerPid <= 0 ||
    (state.childPid !== null && (!Number.isInteger(state.childPid) || state.childPid <= 0)) ||
    typeof state.startedAt !== 'string'
  ) {
    throw new Error(`Android release validation lock state is invalid: ${statePath}`);
  }

  return state;
};

const writeState = (lockPath, state) => {
  const statePath = getStatePath(lockPath);
  const temporaryPath = path.join(lockPath, `owner-${state.token}.tmp`);
  writeFileSync(temporaryPath, `${JSON.stringify(state)}\n`, { mode: 0o600 });
  renameSync(temporaryPath, statePath);
};

export const acquireAndroidReleaseValidationLock = ({
  lockPath,
  ownerPid = process.pid,
  startedAt = new Date(),
  processAlive = isProcessAlive,
  onStaleLockObserved = () => {},
}) => {
  mkdirSync(path.dirname(lockPath), { recursive: true });

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const token = randomUUID();

    try {
      mkdirSync(lockPath);
      writeState(lockPath, {
        ownerPid,
        childPid: null,
        startedAt: startedAt.toISOString(),
        token,
      });

      let released = false;
      const assertOwnership = () => {
        const current = readAndroidReleaseValidationLock(lockPath);
        if (current.token !== token) {
          throw new Error(`Android release validation lock ownership changed: ${lockPath}`);
        }
        return current;
      };

      return {
        lockPath,
        token,
        setChildPid(childPid) {
          const current = assertOwnership();
          if (childPid !== null && (!Number.isInteger(childPid) || childPid <= 0)) {
            throw new Error(`Android release validation child PID is invalid: ${childPid}`);
          }
          writeState(lockPath, { ...current, childPid });
        },
        release() {
          if (released) return;
          assertOwnership();
          rmSync(lockPath, { recursive: true });
          released = true;
        },
      };
    } catch (error) {
      if (error?.code !== 'EEXIST') {
        if (existsSync(lockPath) && !existsSync(getStatePath(lockPath))) {
          rmSync(lockPath, { recursive: true, force: true });
        }
        throw error;
      }

      const existing = readAndroidReleaseValidationLock(lockPath);
      const activePids = [existing.ownerPid, existing.childPid]
        .filter(pid => pid !== null)
        .filter(pid => processAlive(pid));

      if (activePids.length > 0) {
        throw new Error(
          `Android release validation is already running (active PID${activePids.length === 1 ? '' : 's'}: ${activePids.join(', ')}): ${lockPath}`,
        );
      }

      onStaleLockObserved(existing);

      const reclaimPath = path.join(lockPath, `.reclaim-${existing.token}`);
      try {
        mkdirSync(reclaimPath);
      } catch (reclaimError) {
        if (reclaimError?.code === 'EEXIST' || reclaimError?.code === 'ENOENT') continue;
        throw reclaimError;
      }

      let staleGenerationRemoved = false;
      try {
        const current = readAndroidReleaseValidationLock(lockPath);
        if (current.token !== existing.token) continue;

        const recheckedActivePids = [current.ownerPid, current.childPid]
          .filter(pid => pid !== null)
          .filter(pid => processAlive(pid));
        if (recheckedActivePids.length > 0) {
          throw new Error(
            `Android release validation became active during stale recovery (active PID${recheckedActivePids.length === 1 ? '' : 's'}: ${recheckedActivePids.join(', ')}): ${lockPath}`,
          );
        }

        rmSync(lockPath, { recursive: true });
        staleGenerationRemoved = true;
      } finally {
        if (!staleGenerationRemoved) rmSync(reclaimPath, { recursive: true, force: true });
      }
    }
  }

  throw new Error(`Android release validation lock could not be acquired: ${lockPath}`);
};
