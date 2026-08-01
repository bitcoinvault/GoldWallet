import { createReadStream, existsSync, readFileSync, statSync } from 'fs';
import { createPrivateKey } from 'crypto';
import path from 'path';
import { spawnSync } from 'child_process';

import { resolveAndroidPlayReleaseReadiness } from './androidReleaseVersioning.mjs';
import { resolveAndroidUploadSigningConfiguration } from './androidUploadSigningReadiness.mjs';
import {
  createAndroidPlayCandidateUpload,
  hashAndroidPlayCandidate,
  resolveAndroidPlaySharedPaths,
} from './androidPlayCandidateArtifact.mjs';

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
  const expectedConfirmationPrefix = `${PLAY_PACKAGE_NAME}:${release.release.versionCode}:${PLAY_TRACK}:${status}`;
  const sharedPaths = resolveAndroidPlaySharedPaths(root);
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
  return {
    options,
    release,
    signing,
    status,
    serviceAccountPath,
    serviceAccountPresent,
    serviceAccountLocationSafe,
    serviceAccountValidation,
    expectedConfirmationPrefix,
    ready: blockers.length === 0,
    blockers,
    signedAabPath: path.join(root, 'local-docs', 'android-prod-signed-bundle.aab'),
    ...sharedPaths,
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
  candidateUploadFactory = createAndroidPlayCandidateUpload,
  expectedAabSha256 = '',
  expectedAabBytes = 0,
  fileHasher = hashAndroidPlayCandidate,
}) => {
  let editId = '';
  let finalized = false;
  let editCleanupStatus = 'not-applicable';
  const cleanup = async () => {
    if (!editId || finalized || editCleanupStatus !== 'not-applicable') return editCleanupStatus;
    editCleanupStatus = 'attempted';
    try {
      await client.edits.delete({ packageName, editId });
      finalized = true;
      editCleanupStatus = 'succeeded';
    } catch (error) {
      editCleanupStatus = 'failed';
      throw error;
    }
    return editCleanupStatus;
  };

  try {
    if (expectedAabSha256 && fileHasher(aabPath) !== expectedAabSha256) {
      throw new Error('Android Play candidate snapshot digest changed before upload');
    }
    const inserted = await client.edits.insert({ packageName, requestBody: {} });
    editId = inserted.data.id || '';
    if (!editId) throw new Error('Google Play edits.insert response did not contain an edit id');

    const candidateUpload = expectedAabSha256
      ? candidateUploadFactory(aabPath)
      : { stream: streamFactory(aabPath), evidence: Promise.resolve(null), destroy() {} };
    let uploaded;
    try {
      uploaded = await client.edits.bundles.upload({
        packageName,
        editId,
        media: { mimeType: 'application/octet-stream', body: candidateUpload.stream },
      });
    } catch (error) {
      candidateUpload.destroy();
      throw error;
    }
    const uploadedEvidence = await candidateUpload.evidence;
    const uploadedAabSha256 = uploadedEvidence?.sha256 || '';
    const uploadedAabBytes = uploadedEvidence?.bytes || 0;
    if (
      expectedAabSha256 &&
      (uploadedAabSha256 !== expectedAabSha256 || uploadedAabBytes !== expectedAabBytes)
    ) {
      throw new Error('Android Play candidate upload stream does not match the immutable snapshot manifest');
    }
    const uploadedVersionCode = Number(uploaded.data.versionCode);
    if (uploadedVersionCode !== versionCode) {
      throw new Error(`Google Play uploaded versionCode ${uploadedVersionCode || 'missing'}; expected ${versionCode}`);
    }

    const currentTrack = await client.edits.tracks.get({ packageName, editId, track: PLAY_TRACK });
    const currentReleases = currentTrack.data.releases || [];
    const retainedVersionCodes = [
      ...new Set(
        currentReleases
          .flatMap(release => release.versionCodes || [])
          .map(candidate => String(candidate)),
      ),
    ].sort((left, right) => Number(left) - Number(right));
    if (retainedVersionCodes.some(candidate => !/^[1-9]\d*$/.test(candidate))) {
      throw new Error('Google Play internal track contains an invalid active versionCode');
    }
    if (retainedVersionCodes.includes(String(versionCode))) {
      throw new Error(`Google Play internal track already contains candidate versionCode ${versionCode}`);
    }
    const submittedVersionCodes = [...new Set([...retainedVersionCodes, String(versionCode)])].sort(
      (left, right) => Number(left) - Number(right),
    );
    const preservedReleases = currentReleases.map(release => {
      const preserved = {};
      for (const field of [
        'name',
        'versionCodes',
        'releaseNotes',
        'status',
        'userFraction',
        'countryTargeting',
        'inAppUpdatePriority',
      ]) {
        if (release[field] !== undefined) preserved[field] = release[field];
      }
      return preserved;
    });

    await client.edits.tracks.update({
      packageName,
      editId,
      track: PLAY_TRACK,
      requestBody: {
        track: PLAY_TRACK,
        releases: [...preservedReleases, { name: versionName, versionCodes: [String(versionCode)], status }],
      },
    });
    await client.edits.validate({ packageName, editId });

    if (commit) {
      await client.edits.commit({ packageName, editId });
      finalized = true;
      return {
        editValidated: true,
        editCommitted: true,
        editDeleted: false,
        editCleanupStatus: 'not-applicable',
        uploadedVersionCode,
        retainedVersionCodes,
        submittedVersionCodes,
        ...(uploadedAabSha256 ? { uploadedAabSha256, uploadedAabBytes } : {}),
      };
    }

    await cleanup();
    return {
      editValidated: true,
      editCommitted: false,
      editDeleted: editCleanupStatus === 'succeeded',
      editCleanupStatus,
      uploadedVersionCode,
      retainedVersionCodes,
      submittedVersionCodes,
      ...(uploadedAabSha256 ? { uploadedAabSha256, uploadedAabBytes } : {}),
    };
  } catch (error) {
    try {
      await cleanup();
    } catch (cleanupError) {
      error.message = `${error.message}; Play edit cleanup also failed: ${cleanupError.message}`;
    }
    error.playEditCleanupStatus = editCleanupStatus;
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
  const commitConfirmationMatches = summary.match(/^Commit confirmation matches: (yes|no)$/m)?.[1];
  if (!commitConfirmationMatches) {
    errors.push('Android Play internal handoff summary has invalid candidate commit confirmation evidence');
  } else if (/^API edit committed: yes$/m.test(summary) && commitConfirmationMatches !== 'yes') {
    errors.push('Committed Play edit must confirm the exact immutable candidate digest');
  } else if (readiness.options.mode !== 'execute-commit' && commitConfirmationMatches !== 'no') {
    errors.push('Non-commit Play handoff must not claim candidate commit confirmation');
  }
  const handoffLockAcquired = summary.match(/^Handoff lock acquired: (yes|not-claimed)$/m)?.[1];
  const candidateSnapshotReady = summary.match(/^Candidate snapshot ready: (yes|not-claimed)$/m)?.[1];
  const candidateSnapshotBytes = summary.match(/^Candidate snapshot bytes: (\d+)$/m)?.[1];
  const candidateSnapshotSha256 = summary.match(/^Candidate snapshot SHA-256: ([a-f0-9]{64}|not-claimed)$/m)?.[1];
  const candidateManifestReady = summary.match(/^Candidate manifest ready: (yes|not-claimed)$/m)?.[1];
  const uploadedAabBytes = summary.match(/^Uploaded AAB bytes: (\d+)$/m)?.[1];
  const uploadedAabSha256 = summary.match(/^Uploaded AAB SHA-256: ([a-f0-9]{64}|not-claimed)$/m)?.[1];
  if (
    !handoffLockAcquired ||
    !candidateSnapshotReady ||
    candidateSnapshotBytes === undefined ||
    !candidateSnapshotSha256 ||
    !candidateManifestReady ||
    uploadedAabBytes === undefined ||
    !uploadedAabSha256
  ) {
    errors.push('Android Play handoff summary has invalid candidate lock or snapshot evidence');
  } else if (apiEditValidated) {
    if (
      handoffLockAcquired !== 'yes' ||
      candidateSnapshotReady !== 'yes' ||
      candidateManifestReady !== 'yes' ||
      !/^[1-9]\d*$/.test(candidateSnapshotBytes) ||
      uploadedAabBytes !== candidateSnapshotBytes ||
      candidateSnapshotSha256 === 'not-claimed' ||
      uploadedAabSha256 !== candidateSnapshotSha256
    ) {
      errors.push('Validated Play upload must use one locked immutable candidate snapshot');
    }
  } else if (
    readiness.options.mode === 'dry-run' &&
    (handoffLockAcquired !== 'not-claimed' ||
      candidateSnapshotReady !== 'not-claimed' ||
      candidateSnapshotBytes !== '0' ||
      candidateSnapshotSha256 !== 'not-claimed' ||
      candidateManifestReady !== 'not-claimed' ||
      uploadedAabBytes !== '0' ||
      uploadedAabSha256 !== 'not-claimed')
  ) {
    errors.push('Android Play dry-run must not claim candidate lock, snapshot, or upload evidence');
  }
  const cleanupEvidence = [...summary.matchAll(/^Uncommitted edit cleanup: (not-applicable|attempted|succeeded|failed)$/gm)].map(
    match => match[1],
  );
  if (cleanupEvidence.length !== 1) {
    errors.push('Android Play internal handoff summary must contain exactly one edit-cleanup record');
  } else if (apiEditValidated && readiness.options.mode === 'execute-validate' && cleanupEvidence[0] !== 'succeeded') {
    errors.push('Validated uncommitted Play edit must have succeeded cleanup evidence');
  } else if (/^API edit committed: yes$/m.test(summary) && cleanupEvidence[0] !== 'not-applicable') {
    errors.push('Committed Play edit must not claim uncommitted-edit cleanup');
  }
  const retainedEvidence = [...summary.matchAll(/^Previous active version codes retained: (.+)$/gm)].map(match => match[1]);
  const submittedEvidence = [...summary.matchAll(/^Track version codes submitted: (.+)$/gm)].map(match => match[1]);
  if (retainedEvidence.length !== 1 || submittedEvidence.length !== 1) {
    errors.push('Android Play internal handoff summary must contain exactly one track-version preservation record');
  } else if (apiEditValidated) {
    const retainedCodes = retainedEvidence[0] === 'none' ? [] : retainedEvidence[0].split(',');
    const submittedCodes = submittedEvidence[0].split(',');
    const canonicalRetained = [...new Set(retainedCodes)].sort((left, right) => Number(left) - Number(right));
    const expectedSubmitted = [...new Set([...canonicalRetained, String(readiness.release.release.versionCode)])].sort(
      (left, right) => Number(left) - Number(right),
    );
    if (
      retainedCodes.some(code => !/^[1-9]\d*$/.test(code)) ||
      submittedCodes.some(code => !/^[1-9]\d*$/.test(code)) ||
      retainedCodes.join(',') !== canonicalRetained.join(',') ||
      submittedCodes.join(',') !== expectedSubmitted.join(',')
    ) {
      errors.push('Android Play internal handoff summary has invalid track-version preservation evidence');
    }
  } else if (retainedEvidence[0] !== 'not-claimed' || submittedEvidence[0] !== 'not-claimed') {
    errors.push('Android Play handoff without API validation must not claim track-version preservation');
  }
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
