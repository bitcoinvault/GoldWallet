import assert from 'assert';
import { generateKeyPairSync } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidPlayInternalHandoffSummaryErrors,
  parseAndroidPlayHandoffArgs,
  resolveAndroidPlayInternalHandoff,
  runAndroidPlayEditWorkflow,
  validateServiceAccountFile,
} from './androidPlayInternalHandoff.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));

assert.strictEqual(
  packageJson.devDependencies['@googleapis/androidpublisher'],
  '36.0.0',
  'Use the pinned official Android Publisher API client',
);

for (const relativePath of [
  'scripts/androidPlayInternalHandoff.mjs',
  'scripts/runAndroidPlayInternalHandoff.mjs',
  'scripts/checkAndroidPlayInternalHandoffSummary.mjs',
]) {
  assert(existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
}

assert.strictEqual(
  packageJson.scripts['android:play:internal:dry-run'],
  'node scripts/runAndroidPlayInternalHandoff.mjs',
);
assert.strictEqual(
  packageJson.scripts['android:play:internal:validate-upload'],
  'node scripts/runAndroidPlayInternalHandoff.mjs --execute',
);
assert.strictEqual(
  packageJson.scripts['android:play:internal:commit'],
  'node scripts/runAndroidPlayInternalHandoff.mjs --execute --commit',
);

const runner = read('scripts/runAndroidPlayInternalHandoff.mjs');
assert(runner.includes('runAndroidPlayEditWorkflow'));
assert(!runner.includes('private_key'), 'Runner must not print or parse service-account private key material');
const playDryRunIndex = runner.indexOf('if (!options.execute)');
const electrumReleaseGateIndex = runner.indexOf("['scripts/auditElectrumEndpointReadiness.mjs', '--require-ready']");
const signedBundleIndex = runner.indexOf("['scripts/runAndroidSignedBundle.mjs']");
const signedBundleSummaryIndex = runner.indexOf('scripts/checkAndroidProductionSignedBundleSummary.mjs');
assert(electrumReleaseGateIndex > playDryRunIndex, 'Play dry-run must finish before the live Electrum release gate');
assert(electrumReleaseGateIndex < signedBundleIndex, 'Electrum release gate must pass before the signed AAB build');
assert(signedBundleSummaryIndex > signedBundleIndex, 'Candidate-bound runtime evidence must be checked after the signed AAB build');
assert(
  signedBundleSummaryIndex < runner.indexOf('new auth.GoogleAuth'),
  'Candidate-bound runtime evidence must pass before Google authentication',
);

const workflow = read('scripts/androidPlayInternalHandoff.mjs');
assert(workflow.includes('GOLDWALLET_PLAY_SERVICE_ACCOUNT_JSON'));
assert(workflow.includes('GOLDWALLET_PLAY_COMMIT_CONFIRMATION'));
for (const method of ['edits.insert', 'edits.bundles.upload', 'edits.tracks.update', 'edits.validate', 'edits.commit', 'edits.delete']) {
  assert(workflow.includes(method), `Play workflow must support ${method}`);
}
assert(workflow.includes("PLAY_TRACK = 'internal'"), 'Play workflow must be restricted to the internal track');

assert.deepStrictEqual(parseAndroidPlayHandoffArgs([]), { execute: false, commit: false, mode: 'dry-run' });
assert.deepStrictEqual(parseAndroidPlayHandoffArgs(['--execute']), {
  execute: true,
  commit: false,
  mode: 'execute-validate',
});
assert.deepStrictEqual(parseAndroidPlayHandoffArgs(['--execute', '--commit']), {
  execute: true,
  commit: true,
  mode: 'execute-commit',
});
assert.throws(() => parseAndroidPlayHandoffArgs(['--commit']), /--commit requires --execute/);
assert.throws(() => parseAndroidPlayHandoffArgs(['--production']), /Unsupported Android Play handoff argument/);

const fixtureContainer = path.join(os.tmpdir(), `goldwallet-play-handoff-${process.pid}`);
const fixtureRoot = path.join(fixtureContainer, 'repository');
const androidRoot = path.join(fixtureRoot, 'android');
const keystorePath = path.join(fixtureContainer, 'upload.p12');
const serviceAccountPath = path.join(fixtureRoot, 'play-service-account.json');
const fixturePrivateKey = generateKeyPairSync('rsa', { modulusLength: 1024 }).privateKey.export({
  type: 'pkcs8',
  format: 'pem',
});
const baseEnvironment = {
  GOLDWALLET_PLAY_LATEST_VERSION_CODE: '14',
  GOLDWALLET_PLAY_SERVICE_ACCOUNT_JSON: serviceAccountPath,
  GOLDWALLET_UPLOAD_STORE_FILE: keystorePath,
  GOLDWALLET_UPLOAD_STORE_PASSWORD: 'fixture-store-password',
  GOLDWALLET_UPLOAD_KEY_ALIAS: 'fixture',
  GOLDWALLET_UPLOAD_KEY_PASSWORD: 'fixture-key-password',
};

const createFakeClient = ({
  uploadedVersionCode = 15,
  failValidate = false,
  failTrackGet = false,
  failTrackUpdate = false,
  failDelete = false,
  activeReleases = [{ versionCodes: ['13', '14'], status: 'completed' }],
} = {}) => {
  const calls = [];
  const client = {
    edits: {
      insert: async request => {
        calls.push(['insert', request]);
        return { data: { id: 'fixture-edit' } };
      },
      bundles: {
        upload: async request => {
          calls.push(['upload', request]);
          return { data: { versionCode: uploadedVersionCode } };
        },
      },
      tracks: {
        get: async request => {
          calls.push(['track-get', request]);
          if (failTrackGet) throw new Error('fixture track get failure');
          return { data: { track: 'internal', releases: activeReleases } };
        },
        update: async request => {
          calls.push(['track', request]);
          if (failTrackUpdate) throw new Error('fixture track update failure');
          return { data: {} };
        },
      },
      validate: async request => {
        calls.push(['validate', request]);
        if (failValidate) throw new Error('fixture validation failure');
        return { data: {} };
      },
      commit: async request => {
        calls.push(['commit', request]);
        return { data: {} };
      },
      delete: async request => {
        calls.push(['delete', request]);
        if (failDelete) throw new Error('fixture delete failure');
        return { data: {} };
      },
    },
  };
  return { client, calls };
};

try {
  mkdirSync(androidRoot, { recursive: true });
  copyFileSync(
    path.join(root, 'android', 'release-version-contract.json'),
    path.join(androidRoot, 'release-version-contract.json'),
  );
  writeFileSync(path.join(androidRoot, 'release-version.properties'), 'versionCode=15\nversionName=6.5.3\n');
  writeFileSync(
    path.join(androidRoot, 'play-release-baseline.json'),
    JSON.stringify({
      packageName: 'io.goldwallet.wallet',
      publicVersionName: '6.5.2',
      observedAt: '2026-07-16',
      source: 'https://play.google.com/store/apps/details?id=io.goldwallet.wallet',
    }),
  );
  writeFileSync(keystorePath, 'fixture');
  writeFileSync(
    serviceAccountPath,
    JSON.stringify({
      private_key: fixturePrivateKey,
      client_email: 'fixture@goldwallet-fixture.iam.gserviceaccount.com',
    }),
  );

  const validateOptions = parseAndroidPlayHandoffArgs(['--execute']);
  const validateReadiness = resolveAndroidPlayInternalHandoff({
    root: fixtureRoot,
    env: baseEnvironment,
    options: validateOptions,
    ignoredPathCheck: () => true,
  });
  assert.strictEqual(validateReadiness.ready, true);
  assert.deepStrictEqual(validateReadiness.serviceAccountValidation, { valid: true, status: 'valid' });
  const unsafeCredentialReadiness = resolveAndroidPlayInternalHandoff({
    root: fixtureRoot,
    env: baseEnvironment,
    options: validateOptions,
    ignoredPathCheck: () => false,
  });
  assert.strictEqual(unsafeCredentialReadiness.ready, false);
  assert(
    unsafeCredentialReadiness.blockers.some(blocker => blocker.includes('confirmed by git check-ignore')),
    'Tracked or unignored in-repo service-account files must block execution',
  );
  const directoryCredentialReadiness = resolveAndroidPlayInternalHandoff({
    root: fixtureRoot,
    env: { ...baseEnvironment, GOLDWALLET_PLAY_SERVICE_ACCOUNT_JSON: fixtureRoot },
    options: validateOptions,
    ignoredPathCheck: () => true,
  });
  assert.strictEqual(directoryCredentialReadiness.serviceAccountPresent, false);
  assert.strictEqual(directoryCredentialReadiness.ready, false);
  writeFileSync(serviceAccountPath, '{}');
  const invalidSchemaCredentialReadiness = resolveAndroidPlayInternalHandoff({
    root: fixtureRoot,
    env: baseEnvironment,
    options: validateOptions,
    ignoredPathCheck: () => true,
  });
  assert.deepStrictEqual(invalidSchemaCredentialReadiness.serviceAccountValidation, {
    valid: false,
    status: 'invalid-schema',
  });
  assert.strictEqual(invalidSchemaCredentialReadiness.ready, false);
  assert(
    invalidSchemaCredentialReadiness.blockers.some(blocker => blocker.includes('invalid-schema')),
    'Invalid service-account schema must block execution before build or Google authentication',
  );
  assert.deepStrictEqual(
    validateServiceAccountFile(serviceAccountPath, () => {
      throw new Error('fixture read failure');
    }),
    { valid: false, status: 'unreadable' },
  );
  writeFileSync(serviceAccountPath, '{');
  const invalidJsonCredentialReadiness = resolveAndroidPlayInternalHandoff({
    root: fixtureRoot,
    env: baseEnvironment,
    options: validateOptions,
    ignoredPathCheck: () => true,
  });
  assert.deepStrictEqual(invalidJsonCredentialReadiness.serviceAccountValidation, {
    valid: false,
    status: 'invalid-json',
  });
  writeFileSync(
    serviceAccountPath,
    JSON.stringify({
      private_key: 'not-a-private-key',
      client_email: 'fixture@goldwallet-fixture.iam.gserviceaccount.com',
    }),
  );
  const invalidPrivateKeyReadiness = resolveAndroidPlayInternalHandoff({
    root: fixtureRoot,
    env: baseEnvironment,
    options: validateOptions,
    ignoredPathCheck: () => true,
  });
  assert.deepStrictEqual(invalidPrivateKeyReadiness.serviceAccountValidation, {
    valid: false,
    status: 'invalid-private-key',
  });
  writeFileSync(
    serviceAccountPath,
    JSON.stringify({
      private_key: fixturePrivateKey,
      client_email: 'fixture@goldwallet-fixture.iam.gserviceaccount.com',
    }),
  );
  const validateFake = createFakeClient();
  const validateResult = await runAndroidPlayEditWorkflow({
    client: validateFake.client,
    aabPath: 'fixture.aab',
    versionCode: 15,
    versionName: '6.5.3',
    status: 'draft',
    commit: false,
    streamFactory: () => 'fixture-stream',
  });
  assert.deepStrictEqual(validateFake.calls.map(([name]) => name), ['insert', 'upload', 'track-get', 'track', 'validate', 'delete']);
  assert.deepStrictEqual(validateResult, {
    editValidated: true,
    editCommitted: false,
    editDeleted: true,
    editCleanupStatus: 'succeeded',
    uploadedVersionCode: 15,
    retainedVersionCodes: ['13', '14'],
    submittedVersionCodes: ['13', '14', '15'],
  });
  assert.strictEqual(validateFake.calls[2][1].track, 'internal');
  assert.strictEqual(validateFake.calls[3][1].track, 'internal');
  assert.deepStrictEqual(validateFake.calls[3][1].requestBody.releases, [
    { versionCodes: ['13', '14'], status: 'completed' },
    { name: '6.5.3', versionCodes: ['15'], status: 'draft' },
  ]);

  const mixedReleases = [
    { name: 'served', versionCodes: ['12'], status: 'completed', inAppUpdatePriority: 2 },
    { name: 'paused', versionCodes: ['13'], status: 'halted', userFraction: 0.5 },
    { name: 'pending', versionCodes: ['14'], status: 'draft', releaseNotes: [{ language: 'en-US', text: 'pending' }] },
  ];
  const mixedFake = createFakeClient({ activeReleases: mixedReleases });
  await runAndroidPlayEditWorkflow({
    client: mixedFake.client,
    aabPath: 'fixture.aab',
    versionCode: 15,
    versionName: '6.5.3',
    status: 'draft',
    commit: false,
    streamFactory: () => 'fixture-stream',
  });
  assert.deepStrictEqual(mixedFake.calls[3][1].requestBody.releases, [
    ...mixedReleases,
    { name: '6.5.3', versionCodes: ['15'], status: 'draft' },
  ]);

  const commitOptions = parseAndroidPlayHandoffArgs(['--execute', '--commit']);
  const expectedConfirmation = 'io.goldwallet.wallet:15:internal:completed';
  const commitReadiness = resolveAndroidPlayInternalHandoff({
    root: fixtureRoot,
    env: {
      ...baseEnvironment,
      GOLDWALLET_PLAY_RELEASE_STATUS: 'completed',
      GOLDWALLET_PLAY_COMMIT_CONFIRMATION: expectedConfirmation,
    },
    options: commitOptions,
    ignoredPathCheck: () => true,
  });
  assert.strictEqual(commitReadiness.ready, true);
  assert.strictEqual(commitReadiness.expectedConfirmation, expectedConfirmation);
  const commitFake = createFakeClient();
  const commitResult = await runAndroidPlayEditWorkflow({
    client: commitFake.client,
    aabPath: 'fixture.aab',
    versionCode: 15,
    versionName: '6.5.3',
    status: 'completed',
    commit: true,
    streamFactory: () => 'fixture-stream',
  });
  assert.deepStrictEqual(commitFake.calls.map(([name]) => name), ['insert', 'upload', 'track-get', 'track', 'validate', 'commit']);
  assert.strictEqual(commitResult.editCommitted, true);

  const mismatchFake = createFakeClient({ uploadedVersionCode: 16 });
  await assert.rejects(
    runAndroidPlayEditWorkflow({
      client: mismatchFake.client,
      aabPath: 'fixture.aab',
      versionCode: 15,
      versionName: '6.5.3',
      status: 'draft',
      commit: false,
      streamFactory: () => 'fixture-stream',
    }),
    /uploaded versionCode 16; expected 15/,
  );
  assert.deepStrictEqual(mismatchFake.calls.map(([name]) => name), ['insert', 'upload', 'delete']);

  const invalidTrackFake = createFakeClient({ activeReleases: [{ versionCodes: ['invalid'], status: 'completed' }] });
  await assert.rejects(
    runAndroidPlayEditWorkflow({
      client: invalidTrackFake.client,
      aabPath: 'fixture.aab',
      versionCode: 15,
      versionName: '6.5.3',
      status: 'draft',
      commit: false,
      streamFactory: () => 'fixture-stream',
    }),
    /invalid active versionCode/,
  );
  assert.deepStrictEqual(invalidTrackFake.calls.map(([name]) => name), ['insert', 'upload', 'track-get', 'delete']);

  const trackGetFailureFake = createFakeClient({ failTrackGet: true });
  await assert.rejects(
    runAndroidPlayEditWorkflow({
      client: trackGetFailureFake.client,
      aabPath: 'fixture.aab',
      versionCode: 15,
      versionName: '6.5.3',
      status: 'draft',
      commit: false,
      streamFactory: () => 'fixture-stream',
    }),
    error => error.message.includes('fixture track get failure') && error.playEditCleanupStatus === 'succeeded',
  );
  assert.deepStrictEqual(trackGetFailureFake.calls.map(([name]) => name), ['insert', 'upload', 'track-get', 'delete']);

  const cleanupFailureFake = createFakeClient({ failTrackUpdate: true, failDelete: true });
  await assert.rejects(
    runAndroidPlayEditWorkflow({
      client: cleanupFailureFake.client,
      aabPath: 'fixture.aab',
      versionCode: 15,
      versionName: '6.5.3',
      status: 'draft',
      commit: false,
      streamFactory: () => 'fixture-stream',
    }),
    error => error.message.includes('cleanup also failed') && error.playEditCleanupStatus === 'failed',
  );
  assert.deepStrictEqual(cleanupFailureFake.calls.map(([name]) => name), ['insert', 'upload', 'track-get', 'track', 'delete']);

  const validationFailureFake = createFakeClient({ failValidate: true });
  await assert.rejects(
    runAndroidPlayEditWorkflow({
      client: validationFailureFake.client,
      aabPath: 'fixture.aab',
      versionCode: 15,
      versionName: '6.5.3',
      status: 'draft',
      commit: false,
      streamFactory: () => 'fixture-stream',
    }),
    /fixture validation failure/,
  );
  assert.deepStrictEqual(validationFailureFake.calls.map(([name]) => name), [
    'insert',
    'upload',
    'track-get',
    'track',
    'validate',
    'delete',
  ]);

  const safeSummary = [
    'Android Google Play internal handoff',
    'Mode: execute-validate',
    'Package: io.goldwallet.wallet',
    'Track: internal',
    'Release status: draft',
    'Candidate version code: 15',
    'Candidate version name: 6.5.3',
    'Release version ready: yes',
    'Upload signing ready: yes',
    'Service account file present: yes',
    'Service account location safe: yes',
    'Service account structure valid: yes',
    'Service account validation status: valid',
    'Commit confirmation matches: no',
    'Execution ready: yes',
    'Electrum release gate required: yes',
    'Electrum release gate result: passed',
    'API edit validated: yes',
    'Previous active version codes retained: 13,14',
    'Track version codes submitted: 13,14,15',
    'Uncommitted edit cleanup: succeeded',
    'Service account Play access: confirmed',
    'Service account values printed: no',
    '',
  ].join('\n');
  assert.deepStrictEqual(getAndroidPlayInternalHandoffSummaryErrors(safeSummary, validateReadiness), []);
  for (const mutatedSummary of [
    safeSummary.replace('Previous active version codes retained: 13,14', 'Previous active version codes retained: 14,13'),
    safeSummary.replace('Previous active version codes retained: 13,14', 'Previous active version codes retained: 13,13,14'),
    safeSummary.replace('Track version codes submitted: 13,14,15', 'Track version codes submitted: 13,14,15,99'),
    safeSummary.replace('Track version codes submitted: 13,14,15', 'Track version codes submitted: 13,15'),
  ]) {
    assert(
      getAndroidPlayInternalHandoffSummaryErrors(mutatedSummary, validateReadiness).some(error =>
        error.includes('invalid track-version preservation evidence'),
      ),
    );
  }
  assert(
    getAndroidPlayInternalHandoffSummaryErrors(
      safeSummary.replace('Electrum release gate result: passed\n', ''),
      validateReadiness,
    ).some(error => error.includes('Electrum release gate result')),
    'Play summary must require Electrum release-gate evidence',
  );
  assert(
    getAndroidPlayInternalHandoffSummaryErrors(
      safeSummary.replace('Electrum release gate result: passed', 'Electrum release gate result: failed'),
      validateReadiness,
    ).some(error => error.includes('must mark the Play handoff as failed')),
    'A failed Electrum gate must fail the Play handoff summary',
  );
  assert(
    getAndroidPlayInternalHandoffSummaryErrors(
      safeSummary.replace('Electrum release gate result: passed', 'Electrum release gate result: not-claimed'),
      validateReadiness,
    ).some(error => error.includes('API validation requires a passed Electrum release gate')),
    'Play API validation must require a passed Electrum gate',
  );
  assert(
    getAndroidPlayInternalHandoffSummaryErrors(
      safeSummary.replace('Service account Play access: confirmed', 'Service account Play access: not claimed'),
      validateReadiness,
    ).some(error => error.includes('must match API edit validation')),
    'Play access evidence must match successful API edit validation',
  );
  const dryRunReadiness = resolveAndroidPlayInternalHandoff({
    root: fixtureRoot,
    env: baseEnvironment,
    options: parseAndroidPlayHandoffArgs([]),
    ignoredPathCheck: () => true,
  });
  assert(
    getAndroidPlayInternalHandoffSummaryErrors(
      safeSummary.replace('Mode: execute-validate', 'Mode: dry-run'),
      dryRunReadiness,
    ).some(error => error.includes('dry-run must not claim Electrum release-gate execution')),
    'Play dry-run must keep Electrum execution unclaimed',
  );
  assert(
    getAndroidPlayInternalHandoffSummaryErrors(`${safeSummary}client_email`, validateReadiness).some(error =>
      error.includes('service-account material'),
    ),
  );
} finally {
  rmSync(fixtureContainer, { recursive: true, force: true });
}

console.log('Android Play internal handoff guard checks passed.');
