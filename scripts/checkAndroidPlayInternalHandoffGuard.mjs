import assert from 'assert';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidPlayInternalHandoffSummaryErrors,
  parseAndroidPlayHandoffArgs,
  resolveAndroidPlayInternalHandoff,
  runAndroidPlayEditWorkflow,
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
assert(electrumReleaseGateIndex > playDryRunIndex, 'Play dry-run must finish before the live Electrum release gate');
assert(electrumReleaseGateIndex < signedBundleIndex, 'Electrum release gate must pass before the signed AAB build');

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

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-play-handoff-${process.pid}`);
const androidRoot = path.join(fixtureRoot, 'android');
const keystorePath = path.join(androidRoot, 'upload.p12');
const serviceAccountPath = path.join(fixtureRoot, 'play-service-account.json');
const baseEnvironment = {
  GOLDWALLET_PLAY_LATEST_VERSION_CODE: '14',
  GOLDWALLET_PLAY_SERVICE_ACCOUNT_JSON: serviceAccountPath,
  GOLDWALLET_UPLOAD_STORE_FILE: keystorePath,
  GOLDWALLET_UPLOAD_STORE_PASSWORD: 'fixture-store-password',
  GOLDWALLET_UPLOAD_KEY_ALIAS: 'fixture',
  GOLDWALLET_UPLOAD_KEY_PASSWORD: 'fixture-key-password',
};

const createFakeClient = ({ uploadedVersionCode = 15, failValidate = false } = {}) => {
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
        update: async request => {
          calls.push(['track', request]);
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
        return { data: {} };
      },
    },
  };
  return { client, calls };
};

try {
  mkdirSync(androidRoot, { recursive: true });
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
  writeFileSync(serviceAccountPath, '{}');

  const validateOptions = parseAndroidPlayHandoffArgs(['--execute']);
  const validateReadiness = resolveAndroidPlayInternalHandoff({
    root: fixtureRoot,
    env: baseEnvironment,
    options: validateOptions,
    ignoredPathCheck: () => true,
  });
  assert.strictEqual(validateReadiness.ready, true);
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
  assert.deepStrictEqual(validateFake.calls.map(([name]) => name), ['insert', 'upload', 'track', 'validate', 'delete']);
  assert.deepStrictEqual(validateResult, {
    editValidated: true,
    editCommitted: false,
    editDeleted: true,
    uploadedVersionCode: 15,
  });
  assert.strictEqual(validateFake.calls[2][1].track, 'internal');
  assert.deepStrictEqual(validateFake.calls[2][1].requestBody.releases[0].versionCodes, ['15']);

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
  assert.deepStrictEqual(commitFake.calls.map(([name]) => name), ['insert', 'upload', 'track', 'validate', 'commit']);
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
    'Commit confirmation matches: no',
    'Execution ready: yes',
    'Electrum release gate required: yes',
    'Electrum release gate result: passed',
    'Service account values printed: no',
    '',
  ].join('\n');
  assert.deepStrictEqual(getAndroidPlayInternalHandoffSummaryErrors(safeSummary, validateReadiness), []);
  assert(
    getAndroidPlayInternalHandoffSummaryErrors(
      safeSummary.replace('Electrum release gate result: passed\n', ''),
      validateReadiness,
    ).some(error => error.includes('Electrum release gate result')),
    'Play summary must require Electrum release-gate evidence',
  );
  assert(
    getAndroidPlayInternalHandoffSummaryErrors(`${safeSummary}client_email`, validateReadiness).some(error =>
      error.includes('service-account material'),
    ),
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android Play internal handoff guard checks passed.');
