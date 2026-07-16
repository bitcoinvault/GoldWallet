import { createReadStream, existsSync, statSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

import { resolveAndroidPlayReleaseReadiness } from './androidReleaseVersioning.mjs';
import { resolveAndroidUploadSigningConfiguration } from './androidUploadSigningReadiness.mjs';

export const PLAY_PACKAGE_NAME = 'io.goldwallet.wallet';
export const PLAY_TRACK = 'internal';
export const PLAY_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
export const PLAY_RELEASE_STATUSES = new Set(['draft', 'completed']);

const isInsideRoot = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

const isGitIgnored = (root, candidate) =>
  spawnSync('git', ['check-ignore', '--quiet', '--', candidate], { cwd: root, stdio: 'ignore' }).status === 0;

export const parseAndroidPlayHandoffArgs = args => {
  const execute = args.includes('--execute');
  const commit = args.includes('--commit');
  const unknown = args.filter(argument => !['--execute', '--commit'].includes(argument));
  if (unknown.length > 0) throw new Error(`Unsupported Android Play handoff argument(s): ${unknown.join(', ')}`);
  if (commit && !execute) throw new Error('--commit requires --execute');
  return { execute, commit, mode: commit ? 'execute-commit' : execute ? 'execute-validate' : 'dry-run' };
};

export const resolveAndroidPlayInternalHandoff = ({ root, env = process.env, options, ignoredPathCheck = isGitIgnored }) => {
  const release = resolveAndroidPlayReleaseReadiness({ root, env });
  const signing = resolveAndroidUploadSigningConfiguration({ root, env });
  const status = env.GOLDWALLET_PLAY_RELEASE_STATUS || 'draft';
  if (!PLAY_RELEASE_STATUSES.has(status)) {
    throw new Error(`GOLDWALLET_PLAY_RELEASE_STATUS must be one of: ${[...PLAY_RELEASE_STATUSES].join(', ')}`);
  }
  const serviceAccountSetting = env.GOLDWALLET_PLAY_SERVICE_ACCOUNT_JSON || '';
  const serviceAccountPath = serviceAccountSetting
    ? path.isAbsolute(serviceAccountSetting)
      ? serviceAccountSetting
      : path.resolve(root, serviceAccountSetting)
    : '';
  const serviceAccountPresent = Boolean(
    serviceAccountPath && existsSync(serviceAccountPath) && statSync(serviceAccountPath).isFile(),
  );
  const serviceAccountLocationSafe = Boolean(
    serviceAccountPresent && (!isInsideRoot(root, serviceAccountPath) || ignoredPathCheck(root, serviceAccountPath)),
  );
  const expectedConfirmation = `${PLAY_PACKAGE_NAME}:${release.release.versionCode}:${PLAY_TRACK}:${status}`;
  const confirmationMatches = env.GOLDWALLET_PLAY_COMMIT_CONFIRMATION === expectedConfirmation;
  const blockers = [];
  if (!release.ready) blockers.push(release.requiredAction);
  if (!signing.safe.ready) blockers.push('Provide a complete upload-signing configuration with an existing keystore.');
  if (!serviceAccountPresent) {
    blockers.push('Set GOLDWALLET_PLAY_SERVICE_ACCOUNT_JSON to an existing ignored service-account JSON file.');
  } else if (!serviceAccountLocationSafe) {
    blockers.push('Move the service-account JSON outside the repository or to a path confirmed by git check-ignore.');
  }
  if (options.commit && !confirmationMatches) {
    blockers.push(`Set GOLDWALLET_PLAY_COMMIT_CONFIRMATION to ${expectedConfirmation}.`);
  }

  return {
    options,
    release,
    signing,
    status,
    serviceAccountPath,
    serviceAccountPresent,
    serviceAccountLocationSafe,
    expectedConfirmation,
    confirmationMatches,
    ready: blockers.length === 0,
    blockers,
    signedAabPath: path.join(root, 'local-docs', 'android-prod-signed-bundle.aab'),
  };
};

export const runAndroidPlayEditWorkflow = async ({
  client,
  aabPath,
  packageName = PLAY_PACKAGE_NAME,
  versionCode,
  versionName,
  status,
  commit,
  streamFactory = createReadStream,
}) => {
  let editId = '';
  let finalized = false;
  const cleanup = async () => {
    if (!editId || finalized) return false;
    await client.edits.delete({ packageName, editId });
    finalized = true;
    return true;
  };

  try {
    const inserted = await client.edits.insert({ packageName, requestBody: {} });
    editId = inserted.data.id || '';
    if (!editId) throw new Error('Google Play edits.insert response did not contain an edit id');

    const uploaded = await client.edits.bundles.upload({
      packageName,
      editId,
      media: { mimeType: 'application/octet-stream', body: streamFactory(aabPath) },
    });
    const uploadedVersionCode = Number(uploaded.data.versionCode);
    if (uploadedVersionCode !== versionCode) {
      throw new Error(`Google Play uploaded versionCode ${uploadedVersionCode || 'missing'}; expected ${versionCode}`);
    }

    await client.edits.tracks.update({
      packageName,
      editId,
      track: PLAY_TRACK,
      requestBody: {
        track: PLAY_TRACK,
        releases: [{ name: versionName, versionCodes: [String(versionCode)], status }],
      },
    });
    await client.edits.validate({ packageName, editId });

    if (commit) {
      await client.edits.commit({ packageName, editId });
      finalized = true;
      return { editValidated: true, editCommitted: true, editDeleted: false, uploadedVersionCode };
    }

    const editDeleted = await cleanup();
    return { editValidated: true, editCommitted: false, editDeleted, uploadedVersionCode };
  } catch (error) {
    try {
      await cleanup();
    } catch (cleanupError) {
      error.message = `${error.message}; Play edit cleanup also failed: ${cleanupError.message}`;
    }
    throw error;
  }
};

export const getAndroidPlayInternalHandoffSummaryErrors = (summary, readiness) => {
  const requiredLines = [
    'Android Google Play internal handoff',
    `Mode: ${readiness.options.mode}`,
    `Package: ${PLAY_PACKAGE_NAME}`,
    `Track: ${PLAY_TRACK}`,
    `Release status: ${readiness.status}`,
    `Candidate version code: ${readiness.release.release.versionCode}`,
    `Candidate version name: ${readiness.release.release.versionName}`,
    `Release version ready: ${readiness.release.ready ? 'yes' : 'no'}`,
    `Upload signing ready: ${readiness.signing.safe.ready ? 'yes' : 'no'}`,
    `Service account file present: ${readiness.serviceAccountPresent ? 'yes' : 'no'}`,
    `Service account location safe: ${readiness.serviceAccountLocationSafe ? 'yes' : 'no'}`,
    `Commit confirmation matches: ${readiness.confirmationMatches ? 'yes' : 'no'}`,
    `Execution ready: ${readiness.ready ? 'yes' : 'no'}`,
    'Service account values printed: no',
  ];
  const errors = requiredLines
    .filter(line => !summary.includes(line))
    .map(line => `Android Play internal handoff summary is missing: ${line}`);
  if (/private_key|client_email|BEGIN PRIVATE KEY/i.test(summary)) {
    errors.push('Android Play internal handoff summary contains service-account material');
  }
  return errors;
};
