import assert from 'assert';
import { readFileSync } from 'fs';

import {
  SENTRY_PRODUCTION_ANDROID_ENVIRONMENT,
  SENTRY_PRODUCTION_ANDROID_TAG,
  SENTRY_PRODUCTION_ANDROID_WALLET_DATA_TAG,
  getBundleDebugId,
  getProductionSymbolicationEvidence,
  getReferenceProductionEventErrors,
  getSentryProductionAndroidConfig,
  getSentryProductionCliEnvironment,
  getSentryProductionAndroidProjectErrors,
  getSentryProductionAndroidUploadArgs,
  getSentryProductionAndroidReleaseGateErrors,
  getSourceMapDebugEvidence,
  parseSentryProductionAndroidArgs,
  pollSentryProductionDiagnostics,
  renderSentryProductionAndroidSummary,
  validateReferenceEventId,
} from './sentryProductionAndroidSymbolication.mjs';

const debugId = '1c3098e1-96d8-49f7-9fa1-70c975b32642';
const eventId = '1c4ded379f8643469d6311f0b8e84e44';
assert.strictEqual(getBundleDebugId(Buffer.from(`prefix sentry-dbid-${debugId} suffix`)), debugId);
assert.throws(() => getBundleDebugId(Buffer.from('missing')), /exactly one/);
assert.throws(
  () => getBundleDebugId(Buffer.from(`sentry-dbid-${debugId} sentry-dbid-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`)),
  /exactly one/,
);

const config = getSentryProductionAndroidConfig({
  root: 'D:\\repo',
  metadata: { versionName: '6.5.3', versionCode: '15' },
});
assert.strictEqual(config.project, 'goldwallet-prod-android');
assert.strictEqual(config.projectId, '5875213');
assert.strictEqual(config.release, 'io.goldwallet.wallet@6.5.3+15');
assert.strictEqual(config.dist, '15');
assert.throws(
  () => getSentryProductionAndroidConfig({ root: 'D:\\repo', metadata: { versionName: '', versionCode: 'x' } }),
  /metadata is invalid/,
);

const artifacts = { debugId };
const uploadArgs = getSentryProductionAndroidUploadArgs({ config, artifacts });
assert(uploadArgs.includes('--debug-id-reference'));
assert(uploadArgs.includes('--strict'));
assert(uploadArgs.includes('--wait'));
assert.strictEqual(uploadArgs[uploadArgs.indexOf('--project') + 1], '5875213');
assert.strictEqual(uploadArgs[uploadArgs.indexOf('--release') + 1], 'io.goldwallet.wallet@6.5.3+15');
assert.strictEqual(uploadArgs[uploadArgs.indexOf('--dist') + 1], '15');

const cliEnvironment = getSentryProductionCliEnvironment({
  env: {
    Path: 'safe-path',
    sentry_url: 'https://attacker.invalid',
    SENTRY_HOST: 'https://wrong.invalid',
    SENTRY_RELEASE: 'wrong',
    SENTRY_DIST: '999',
    SENTRY_AUTH_TOKEN: 'old-token',
  },
  token: 'managed-token',
  config,
});
assert.strictEqual(cliEnvironment.Path, 'safe-path');
assert.strictEqual(cliEnvironment.SENTRY_URL, 'https://sentry.io');
assert.strictEqual(cliEnvironment.SENTRY_HOST, 'https://sentry.io');
assert.strictEqual(cliEnvironment.SENTRY_ORG, 'decentraplanet');
assert.strictEqual(cliEnvironment.SENTRY_PROJECT, 'goldwallet-prod-android');
assert.strictEqual(cliEnvironment.SENTRY_RELEASE, 'io.goldwallet.wallet@6.5.3+15');
assert.strictEqual(cliEnvironment.SENTRY_DIST, '15');
assert.strictEqual(cliEnvironment.SENTRY_AUTH_TOKEN, 'managed-token');
assert.strictEqual(cliEnvironment.sentry_url, undefined);

const project = { id: '5875213', slug: 'goldwallet-prod-android', organization: { slug: 'decentraplanet' } };
assert.deepStrictEqual(getSentryProductionAndroidProjectErrors(project), []);
for (const mutation of [{ id: '1' }, { slug: 'wrong' }, { organization: { slug: 'wrong' } }]) {
  assert(getSentryProductionAndroidProjectErrors({ ...project, ...mutation }).length > 0);
}

const referenceEvent = {
  eventID: eventId,
  projectID: '5875213',
  release: 'io.goldwallet.wallet@6.5.3+15',
  dist: '15',
  debugMeta: { images: [{ debugId }] },
  errors: [{ type: 'js_no_source' }],
  entries: [
    {
      type: 'exception',
      data: { values: [{ stacktrace: { frames: [{ absPath: 'app:///index.android.bundle', lineNo: 1 }] } }] },
    },
  ],
};
const expectedReference = {
  eventId,
  projectId: '5875213',
  release: 'io.goldwallet.wallet@6.5.3+15',
  dist: '15',
  debugId,
};
assert.deepStrictEqual(getReferenceProductionEventErrors({ event: referenceEvent, expected: expectedReference }), []);
for (const mutation of [
  { eventID: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
  { projectID: '1' },
  { release: 'wrong' },
  { dist: '14' },
  { entries: [] },
  { errors: [] },
]) {
  assert(
    getReferenceProductionEventErrors({ event: { ...referenceEvent, ...mutation }, expected: expectedReference })
      .length > 0,
  );
}

const debugResponse = {
  has_debug_ids: true,
  project_has_some_artifact_bundle: true,
  exceptions: [
    {
      frames: [
        {
          debug_id_process: {
            debug_id: debugId,
            uploaded_source_file_with_correct_debug_id: true,
            uploaded_source_map_with_correct_debug_id: true,
          },
        },
      ],
    },
  ],
};
assert.deepStrictEqual(getSourceMapDebugEvidence({ response: debugResponse, debugId }), {
  hasDebugIds: true,
  matchingDebugId: true,
  artifactBundlePresent: true,
  sourceFilePresent: true,
  sourceMapPresent: true,
});

const syntheticEventId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const processedEvent = {
  eventID: syntheticEventId,
  projectID: '5875213',
  release: 'io.goldwallet.wallet@6.5.3+15',
  dist: '15',
  user: { ipAddress: '0.0.0.0' },
  tags: [
    { key: 'environment', value: SENTRY_PRODUCTION_ANDROID_ENVIRONMENT },
    { key: 'goldwallet.canary', value: SENTRY_PRODUCTION_ANDROID_TAG },
    { key: 'goldwallet.wallet_data', value: SENTRY_PRODUCTION_ANDROID_WALLET_DATA_TAG },
  ],
  entries: [
    {
      type: 'exception',
      data: { values: [{ stacktrace: { frames: [{ filename: 'D:\\q987\\App.tsx', lineNo: 41 }] } }] },
    },
  ],
};
const symbolicationExpected = {
  eventId: syntheticEventId,
  projectId: '5875213',
  release: 'io.goldwallet.wallet@6.5.3+15',
  dist: '15',
  source: 'App.tsx',
  originalLine: 41,
};
const symbolication = getProductionSymbolicationEvidence({ event: processedEvent, expected: symbolicationExpected });
assert(symbolication.passed);
assert.strictEqual(symbolication.actualSource, 'App.tsx');
assert(
  !getProductionSymbolicationEvidence({
    event: { ...processedEvent, user: { email: 'should-not-exist@example.invalid' } },
    expected: symbolicationExpected,
  }).passed,
);
assert(
  !getProductionSymbolicationEvidence({
    event: { ...processedEvent, entries: referenceEvent.entries },
    expected: symbolicationExpected,
  }).passed,
);
assert.strictEqual(validateReferenceEventId(eventId), eventId);
assert.throws(() => validateReferenceEventId('wrong'), /valid --reference-event-id/);

const diagnosticResponse = (status, body = {}, retryAfter = '') => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: name => (name.toLowerCase() === 'retry-after' ? retryAfter : null) },
  json: async () => body,
});
const diagnosticResponses = [
  diagnosticResponse(404, {}, '0'),
  diagnosticResponse(200, { complete: false }),
  diagnosticResponse(200, { complete: true }),
];
const diagnosticWaits = [];
const diagnosticResult = await pollSentryProductionDiagnostics({
  fetchResponse: async () => diagnosticResponses.shift(),
  toEvidence: value => value,
  isComplete: value => value.complete,
  wait: async milliseconds => diagnosticWaits.push(milliseconds),
  attempts: 3,
});
assert.deepStrictEqual(diagnosticResult, { complete: true });
assert.deepStrictEqual(diagnosticWaits, [0, 2000]);
await assert.rejects(
  pollSentryProductionDiagnostics({
    fetchResponse: async () => diagnosticResponse(401),
    toEvidence: value => value,
    isComplete: () => false,
    wait: async () => {},
    attempts: 2,
  }),
  /HTTP 401/,
);
await assert.rejects(
  pollSentryProductionDiagnostics({
    fetchResponse: async () => diagnosticResponse(503),
    toEvidence: value => value,
    isComplete: () => false,
    wait: async () => {},
    attempts: 2,
  }),
  /did not become ready before timeout/,
);
assert.deepStrictEqual(parseSentryProductionAndroidArgs([]), {
  execute: false,
  releaseGate: false,
  referenceEventId: null,
  expectedAabSha256: null,
});
assert.deepStrictEqual(
  parseSentryProductionAndroidArgs(['--execute', '--release-gate', `--expected-aab-sha256=${'a'.repeat(64)}`]),
  {
    execute: true,
    releaseGate: true,
    referenceEventId: null,
    expectedAabSha256: 'a'.repeat(64),
  },
);
assert.throws(() => parseSentryProductionAndroidArgs(['--release-gate']), /require --execute/);
assert.throws(() => parseSentryProductionAndroidArgs(['--execute', '--release-gate']), /valid --expected-aab-sha256/);
assert.throws(
  () =>
    parseSentryProductionAndroidArgs([
      '--execute',
      '--release-gate',
      `--expected-aab-sha256=${'a'.repeat(64)}`,
      `--reference-event-id=${eventId}`,
    ]),
  /does not accept --reference-event-id/,
);

const summary = renderSentryProductionAndroidSummary({
  config,
  artifacts: {
    ...artifacts,
    aabSha256: 'a'.repeat(64),
    sourceBundleSha256: 'b'.repeat(64),
    embeddedBundleSha256: 'b'.repeat(64),
    sourceMapSha256: 'c'.repeat(64),
    uploadBundleSha256: 'b'.repeat(64),
    uploadSourceMapSha256: 'd'.repeat(64),
    candidateIdentity: 'e'.repeat(64),
    candidateManifestSha256: 'f'.repeat(64),
    sourceCount: 3283,
  },
  executed: true,
  referenceEventId: eventId,
  beforeDebug: { sourceFilePresent: false, sourceMapPresent: false },
  afterDebug: {
    hasDebugIds: true,
    matchingDebugId: true,
    artifactBundlePresent: true,
    sourceFilePresent: true,
    sourceMapPresent: true,
  },
  uploadEvidence: { bundleId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', passed: true },
  uploadAttempted: true,
  syntheticEventId,
  symbolicationEvidence: symbolication,
  operation: 'release-gate',
});
assert(summary.includes('Production source-map upload validation: passed'));
assert(summary.includes('Production event symbolication validation: passed'));
assert(summary.includes('iOS symbolication validation: not claimed'));
assert(summary.includes('Wallet data included: no'));
assert(summary.includes('Secret values printed: no'));
assert.deepStrictEqual(
  getSentryProductionAndroidReleaseGateErrors({
    summary,
    expected: {
      release: config.release,
      dist: config.dist,
      aabSha256: 'a'.repeat(64),
      candidateIdentity: 'e'.repeat(64),
      candidateManifestSha256: 'f'.repeat(64),
      embeddedBundleSha256: 'b'.repeat(64),
      generatedBundleSha256: 'b'.repeat(64),
      sourceMapSha256: 'c'.repeat(64),
    },
  }),
  [],
);
assert(
  getSentryProductionAndroidReleaseGateErrors({
    summary,
    expected: {
      release: config.release,
      dist: config.dist,
      aabSha256: 'c'.repeat(64),
      candidateIdentity: 'e'.repeat(64),
      candidateManifestSha256: 'f'.repeat(64),
      embeddedBundleSha256: 'b'.repeat(64),
      generatedBundleSha256: 'b'.repeat(64),
      sourceMapSha256: 'c'.repeat(64),
    },
  }).includes('AAB SHA-256 mismatch'),
);
const releaseGateExpected = {
  release: config.release,
  dist: config.dist,
  aabSha256: 'a'.repeat(64),
  candidateIdentity: 'e'.repeat(64),
  candidateManifestSha256: 'f'.repeat(64),
  embeddedBundleSha256: 'b'.repeat(64),
  generatedBundleSha256: 'b'.repeat(64),
  sourceMapSha256: 'c'.repeat(64),
};
for (const mutated of [
  `${summary}Mode: executed\n`,
  summary.replace('Upload attempted this run: yes', 'Upload attempted this run: no'),
  summary.replace('After upload artifact bundle present: yes', 'After upload artifact bundle present: no'),
  summary.replace('Processed original source: App.tsx', 'Processed original source: index.android.bundle'),
  summary.replace('Processed generated frame removed: yes', 'Processed generated frame removed: no'),
  summary.replace(/Generated at: .+/, 'Generated at: 2020-01-01T00:00:00.000Z'),
]) {
  assert(getSentryProductionAndroidReleaseGateErrors({ summary: mutated, expected: releaseGateExpected }).length > 0);
}

const runner = readFileSync('scripts/runSentryProductionAndroidSymbolication.mjs', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
assert.strictEqual(
  packageJson.scripts['sentry:production-android-symbolication:dry-run'],
  'node scripts/runSentryProductionAndroidSymbolication.mjs',
);
assert.strictEqual(
  packageJson.scripts['sentry:production-android-symbolication:execute'],
  'node scripts/runSentryProductionAndroidSymbolication.mjs --execute',
);
assert.strictEqual(
  packageJson.scripts['check:sentry-production-android-symbolication-guard'],
  'node scripts/checkSentryProductionAndroidSymbolicationGuard.mjs',
);
assert(runner.includes("readFileSync(envPath, 'utf8'), 'SENTRY_DSN_ANDROID'"));
assert(runner.includes("path.join(root, '.env.prod.mainnet')"));
assert(runner.includes("user: { ip_address: '0.0.0.0' }"));
assert(runner.includes("type: 'sourcemap'"));
assert(runner.includes('debug_id: artifacts.debugId'));
assert(runner.includes('beforeDebug.sourceFilePresent !== beforeDebug.sourceMapPresent'));
assert(runner.includes('continuing in verification-only mode'));
assert(runner.includes('getSentryAndroidCandidateEvidenceErrors'));
assert(runner.includes('getSentryProductionCliEnvironment'));
assert(runner.includes('pollSentryProductionDiagnostics'));
assert(runner.includes('artifactBase: releaseGate'));
assert(runner.includes("'android-prod-signed-bundle-sentry'"));
assert(runner.includes("candidateType: releaseGate ? 'production-signed-candidate'"));
assert(runner.includes('assertAndroidPlayRunLockOwnership'));
assert(
  runner.indexOf('assertAndroidPlayRunLockOwnership') <
    runner.indexOf('const metadata = getAndroidAppBundleProjectMetadata'),
);
const invalidation = runner.indexOf('rmSync(outputPath, { force: true });');
const credential = runner.indexOf('const credential = resolveSentryManagedCredential();');
assert(invalidation >= 0 && credential > invalidation);

console.log('Sentry production Android symbolication guard checks passed.');
