import assert from 'assert';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import {
  SENTRY_ANDROID_CANARY_PROJECT,
  SENTRY_ANDROID_CANARY_PROJECT_ID,
  getSentryAndroidCanaryDebugId,
  getSentryAndroidCanaryProjectEndpoint,
  getSentryAndroidCanaryProjectIdentityErrors,
  getSentryAndroidCanarySummaryErrors,
  getSentryAndroidCanaryUploadEvidence,
  getSentryAndroidCanaryUploadArgs,
  getSentryAndroidUploadCanaryConfig,
  prepareSentryAndroidCanaryArtifacts,
  renderSentryAndroidCanaryCommand,
  renderSentryAndroidCanarySummary,
} from './sentryAndroidUploadCanary.mjs';

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-sentry-upload-canary-${process.pid}`);
try {
  mkdirSync(fixtureRoot, { recursive: true });
  const sourceBundlePath = path.join(fixtureRoot, 'candidate.bundle');
  const sourceMapPath = path.join(fixtureRoot, 'candidate.bundle.map');
  writeFileSync(sourceBundlePath, Buffer.from([0, 1, 2, 3]));
  writeFileSync(sourceMapPath, JSON.stringify({ version: 3, sources: ['index.tsx'], mappings: 'AAAA' }));
  const candidateIdentity = '215afad411f17504c7d82bb6fc9570b9485be0c21d85668cdc936e1a3ff822b6';
  const evidence = {
    candidateType: 'local-signing-proof',
    candidateIdentity,
    sentryRelease: 'io.goldwallet.wallet@6.5.1+14',
    sentryDist: '14',
    versionName: '6.5.1',
    versionCode: '14',
    generatedBundle: { path: sourceBundlePath },
    sourceMap: { path: sourceMapPath },
  };
  const config = getSentryAndroidUploadCanaryConfig({ root: fixtureRoot, evidence });
  const artifacts = prepareSentryAndroidCanaryArtifacts(config);
  const injectedMap = JSON.parse(readFileSync(config.uploadSourceMapPath, 'utf8'));
  const uploadArgs = getSentryAndroidCanaryUploadArgs(config);
  const renderedUpload = renderSentryAndroidCanaryCommand('sentry-cli', uploadArgs);

  assert.strictEqual(config.project, SENTRY_ANDROID_CANARY_PROJECT);
  assert.notStrictEqual(config.summaryPath, config.dryRunSummaryPath);
  assert.strictEqual(
    getSentryAndroidCanaryProjectEndpoint(config),
    'https://sentry.io/api/0/projects/decentraplanet/goldwallet-dev-android/',
  );
  assert.deepStrictEqual(
    getSentryAndroidCanaryProjectIdentityErrors({
      project: { id: config.projectId, slug: config.project, organization: { slug: config.org } },
      config,
    }),
    [],
  );
  assert(
    getSentryAndroidCanaryProjectIdentityErrors({
      project: { id: 'wrong', slug: config.project, organization: { slug: config.org } },
      config,
    }).includes('Sentry canary project ID mismatch'),
  );
  assert.strictEqual(config.debugId, getSentryAndroidCanaryDebugId(candidateIdentity));
  assert(!config.canaryRelease.startsWith('io.goldwallet.wallet@'));
  assert.strictEqual(injectedMap.debug_id, config.debugId);
  assert.strictEqual(artifacts.sourceBundleSha256, artifacts.uploadBundleSha256);
  assert(uploadArgs.includes(SENTRY_ANDROID_CANARY_PROJECT_ID));
  assert(uploadArgs.includes('--debug-id-reference'));
  assert(uploadArgs.includes('--validate'));
  assert(uploadArgs.includes('--strict'));
  assert(uploadArgs.includes('--wait'));
  assert(!renderedUpload.includes('SENTRY_AUTH_TOKEN'));
  assert(!renderedUpload.includes('auth.token'));
  assert.throws(
    () =>
      getSentryAndroidUploadCanaryConfig({
        root: fixtureRoot,
        evidence: { ...evidence, candidateType: 'production-signed-candidate' },
      }),
    /local-signing-proof/,
  );
  const dryRunSummary = renderSentryAndroidCanarySummary({ config, artifacts, executed: false });
  assert(dryRunSummary.includes('Mode: dry-run'));
  assert(dryRunSummary.includes('Transport upload validation: not claimed'));
  assert(dryRunSummary.includes('Production release upload validation: not claimed'));
  assert.deepStrictEqual(
    getSentryAndroidCanarySummaryErrors({ summary: dryRunSummary, config, artifacts, executed: false }),
    [],
  );
  assert(
    getSentryAndroidCanarySummaryErrors({
      summary: dryRunSummary.replace('Project: goldwallet-dev-android', 'Project: goldwallet-prod-android'),
      config,
      artifacts,
      executed: false,
    }).includes('Project mismatch'),
  );
  const uploadOutput = `
Bundle ID: 29acab0d-9d11-5c7f-a9f4-e05207f96e2d
Uploaded files to Sentry
File processing complete
Organization: ${config.org}
Projects: ${config.projectId}
Release: ${config.canaryRelease}
Dist: ${config.dist}
Upload type: artifact bundle
~/index.android.bundle (sourcemap at index.android.bundle.map, debug id ${config.debugId})
~/index.android.bundle.map (debug id ${config.debugId})
`;
  const uploadEvidence = getSentryAndroidCanaryUploadEvidence({ output: uploadOutput, config });
  assert(uploadEvidence.passed);
  assert.strictEqual(uploadEvidence.bundleId, '29acab0d-9d11-5c7f-a9f4-e05207f96e2d');
  assert(
    !getSentryAndroidCanaryUploadEvidence({ output: uploadOutput.replace(config.debugId, 'wrong'), config }).passed,
  );
  assert(
    getSentryAndroidCanaryUploadEvidence({
      output: uploadOutput.replace('Uploaded files to Sentry', 'Nothing to upload, all files are on the server'),
      config,
    }).passed,
  );
  const executedSummary = renderSentryAndroidCanarySummary({
    config,
    artifacts,
    executed: true,
    uploadEvidence,
    projectIdentityVerified: true,
  });
  assert.deepStrictEqual(
    getSentryAndroidCanarySummaryErrors({
      summary: executedSummary,
      config,
      artifacts,
      executed: true,
      uploadEvidence,
      projectIdentityVerified: true,
    }),
    [],
  );
  assert(
    getSentryAndroidCanarySummaryErrors({
      summary: dryRunSummary.replace(
        'Production release upload validation: not claimed',
        'Production release upload validation: passed',
      ),
      config,
      artifacts,
      executed: false,
    }).includes('Production release upload validation mismatch'),
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const runner = readFileSync('scripts/runSentryAndroidUploadCanary.mjs', 'utf8');
assert.strictEqual(
  packageJson.scripts['sentry:android-upload-canary:dry-run'],
  'node scripts/runSentryAndroidUploadCanary.mjs',
);
assert.strictEqual(
  packageJson.scripts['sentry:android-upload-canary:execute'],
  'node scripts/runSentryAndroidUploadCanary.mjs --execute',
);
assert.strictEqual(
  packageJson.scripts['check:sentry-android-upload-canary-guard'],
  'node scripts/checkSentryAndroidUploadCanaryGuard.mjs',
);
assert(runner.includes('rmSync(config.summaryPath, { force: true })'));
assert(runner.includes('execute ? config.summaryPath : config.dryRunSummaryPath'));
assert(runner.includes('getSentryAndroidCanaryProjectIdentityErrors'));

console.log('Sentry Android upload canary guard checks passed.');
