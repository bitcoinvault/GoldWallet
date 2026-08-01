import { createReadStream, existsSync, readFileSync, statSync } from 'fs';
import { createPrivateKey } from 'crypto';
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

export const validateServiceAccountFile = (serviceAccountPath, fileReader = readFileSync) => {
  if (!serviceAccountPath || !existsSync(serviceAccountPath)) {
    return { valid: false, status: 'missing' };
  }
  try {
    if (!statSync(serviceAccountPath).isFile()) return { valid: false, status: 'missing' };
  } catch {
    return { valid: false, status: 'unreadable' };
  }

  let content;
  try {
    content = fileReader(serviceAccountPath, 'utf8');
  } catch {
    return { valid: false, status: 'unreadable' };
  }

  let credential;
  try {
    credential = JSON.parse(content);
  } catch {
    return { valid: false, status: 'invalid-json' };
  }

  if (!credential || typeof credential !== 'object' || Array.isArray(credential)) {
    return { valid: false, status: 'invalid-schema' };
  }
  if (
    typeof credential.client_email !== 'string' ||
    !credential.client_email.trim() ||
    typeof credential.private_key !== 'string' ||
    !credential.private_key.trim()
  ) {
    return { valid: false, status: 'invalid-schema' };
  }

  try {
    const key = createPrivateKey(credential.private_key);
    if (key.type !== 'private' || key.asymmetricKeyType !== 'rsa') {
      return { valid: false, status: 'invalid-private-key' };
    }
  } catch {
    return { valid: false, status: 'invalid-private-key' };
  }

  return { valid: true, status: 'valid' };
};

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
  const serviceAccountValidation = validateServiceAccountFile(serviceAccountPath);
  const serviceAccountPresent = serviceAccountValidation.status !== 'missing';
  const serviceAccountLocationSafe = Boolean(
    serviceAccountPresent && (!isInsideRoot(root, serviceAccountPath) || ignoredPathCheck(root, serviceAccountPath)),
  );
  const expectedConfirmation = `${PLAY_PACKAGE_NAME}:${release.release.versionCode}:${PLAY_TRACK}:${status}`;
  const confirmationMatches = env.GOLDWALLET_PLAY_COMMIT_CONFIRMATION === expectedConfirmation;
  const blockers = [];
  if (!release.ready) blockers.push(release.requiredAction);
  if (!signing.safe.ready) {
    if (!signing.safe.propertiesPathSafety.safe) {
      blockers.push(
        signing.safe.propertiesPathSafety.state === 'not-regular'
          ? 'Replace the upload-signing properties path with a regular file.'
          : 'Move upload-signing properties outside the repository or to a git-ignored path.',
      );
    } else if (signing.safe.storeFileExists && !signing.safe.storeFilePathSafety.safe) {
      blockers.push('Move the upload keystore outside the repository or to a git-ignored path.');
    } else {
      blockers.push('Provide a complete upload-signing configuration with a regular keystore file.');
    }
  }
  if (!serviceAccountPresent) {
    blockers.push('Set GOLDWALLET_PLAY_SERVICE_ACCOUNT_JSON to an existing ignored service-account JSON file.');
  } else {
    if (!serviceAccountLocationSafe) {
      blockers.push('Move the service-account JSON outside the repository or to a path confirmed by git check-ignore.');
    }
    if (!serviceAccountValidation.valid) {
      blockers.push(`Provide a structurally valid Google service-account credential JSON (${serviceAccountValidation.status}).`);
    }
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
    serviceAccountValidation,
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
    `Service account structure valid: ${readiness.serviceAccountValidation.valid ? 'yes' : 'no'}`,
    `Service account validation status: ${readiness.serviceAccountValidation.status}`,
    `Commit confirmation matches: ${readiness.confirmationMatches ? 'yes' : 'no'}`,
    `Execution ready: ${readiness.ready ? 'yes' : 'no'}`,
    'Electrum release gate required: yes',
    'Service account values printed: no',
  ];
  const errors = requiredLines
    .filter(line => !summary.includes(line))
    .map(line => `Android Play internal handoff summary is missing: ${line}`);
  if (/private_key|client_email|BEGIN PRIVATE KEY/i.test(summary)) {
    errors.push('Android Play internal handoff summary contains service-account material');
  }
  const electrumReleaseGateResult = summary.match(/^Electrum release gate result: (not-claimed|passed|failed)$/m)?.[1];
  if (!electrumReleaseGateResult) {
    errors.push('Android Play internal handoff summary has invalid Electrum release gate result');
  }
  if (readiness.options.mode === 'dry-run' && electrumReleaseGateResult !== 'not-claimed') {
    errors.push('Android Play dry-run must not claim Electrum release-gate execution');
  }
  if (/^API edit validated: yes$/m.test(summary) && electrumReleaseGateResult !== 'passed') {
    errors.push('Google Play API validation requires a passed Electrum release gate');
  }
  const serviceAccountPlayAccess = summary.match(/^Service account Play access: (confirmed|not claimed)$/m)?.[1];
  if (!serviceAccountPlayAccess) {
    errors.push('Android Play internal handoff summary has invalid service-account Play access evidence');
  }
  const apiEditValidated = /^API edit validated: yes$/m.test(summary);
  if ((serviceAccountPlayAccess === 'confirmed') !== apiEditValidated) {
    errors.push('Service-account Play access evidence must match API edit validation');
  }
  if (readiness.options.mode === 'dry-run' && serviceAccountPlayAccess === 'confirmed') {
    errors.push('Android Play dry-run must not claim service-account Play access');
  }
  if (electrumReleaseGateResult === 'failed' && !/^Failure: yes; see console output$/m.test(summary)) {
    errors.push('A failed Electrum release gate must mark the Play handoff as failed');
  }
  return errors;
};
