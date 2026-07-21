import assert from 'assert';
import { appendFileSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import {
  captureSentryAndroidCandidateEvidence,
  cleanSentryAndroidGeneratedOutputs,
  collectSentryAndroidCandidateEvidence,
  getSentryAndroidCandidateEvidenceErrors,
  getSentryAndroidCandidateEvidenceConfig,
  parseSentryAndroidCandidateEvidenceManifest,
  renderSentryAndroidCandidateEvidenceManifest,
} from './sentryAndroidCandidateEvidence.mjs';

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-sentry-candidate-evidence-${process.pid}`);
const aabPath = path.join(fixtureRoot, 'candidate.aab');
const metadata = { versionName: '6.5.1', versionCode: '14' };
const candidateType = 'local-signing-proof';
const bundle = 'globalThis.__candidate = true;\n';
const map = JSON.stringify({ version: 3, sources: ['index.tsx'], names: [], mappings: 'AAAA' });
const processEvidence = {
  generatedReactOutputsCleaned: true,
  sentryAutoUploadDisabled: true,
  sentryUploadAttempted: false,
  secretValuesPrinted: false,
};
const createAab = (content = bundle) => {
  writeFileSync(aabPath, `fixture-aab-container:${content}`);
};

const extractFixtureBundle = ({ aabPath: sourceAabPath, destination, entry }) => {
  assert.strictEqual(sourceAabPath, aabPath);
  assert.strictEqual(entry, 'base/assets/index.android.bundle');
  const extractedPath = path.join(destination, ...entry.split('/'));
  mkdirSync(path.dirname(extractedPath), { recursive: true });
  writeFileSync(extractedPath, bundle);
};

const writeSnapshots = (config, bundleContent = bundle, mapContent = map) => {
  mkdirSync(config.candidateDirectory, { recursive: true });
  mkdirSync(path.dirname(config.sourceGeneratedBundlePath), { recursive: true });
  mkdirSync(path.dirname(config.sourceGeneratedSourceMapPath), { recursive: true });
  writeFileSync(config.sourceGeneratedBundlePath, bundleContent);
  writeFileSync(config.sourceGeneratedSourceMapPath, mapContent);
  writeFileSync(config.embeddedBundlePath, bundleContent);
  writeFileSync(config.generatedBundlePath, bundleContent);
  writeFileSync(config.sourceMapPath, mapContent);
};

const makeFixture = () => {
  createAab();
  const config = getSentryAndroidCandidateEvidenceConfig(fixtureRoot, { aabPath, artifactBase: 'prod-proof' });
  const cleanup = cleanSentryAndroidGeneratedOutputs(fixtureRoot);
  const buildStartedAtMs = Date.now() - 1000;
  mkdirSync(path.dirname(config.sourceGeneratedBundlePath), { recursive: true });
  mkdirSync(path.dirname(config.sourceGeneratedSourceMapPath), { recursive: true });
  writeFileSync(config.sourceGeneratedBundlePath, bundle);
  writeFileSync(config.sourceGeneratedSourceMapPath, map);
  const { evidence, manifestContent } = captureSentryAndroidCandidateEvidence({
    config,
    metadata,
    candidateType,
    jarCommand: 'fixture-jar',
    extractAabBundle: extractFixtureBundle,
    generatedReactOutputsCleaned: cleanup.performed,
    buildStartedAtMs,
    sentryAutoUploadDisabled: true,
    sentryUploadAttempted: false,
    secretValuesPrinted: false,
  });
  return { config, evidence, manifestContent, buildStartedAtMs };
};

const mutateManifest = (manifestContent, mutate) => {
  const value = JSON.parse(manifestContent);
  mutate(value);
  return `${JSON.stringify(value, null, 2)}\n`;
};

const assertRejected = (label, options, expected) => {
  const errors = getSentryAndroidCandidateEvidenceErrors(options);
  assert(errors.some(error => error.includes(expected)), `${label} returned: ${errors.join(' | ')}`);
};

try {
  mkdirSync(fixtureRoot, { recursive: true });
  let fixture = makeFixture();
  let options = { config: fixture.config, metadata, candidateType, buildStartedAtMs: fixture.buildStartedAtMs, ...processEvidence };

  assert.strictEqual(path.basename(fixture.config.candidateDirectory), fixture.config.aabSha256);
  assert.deepStrictEqual(getSentryAndroidCandidateEvidenceErrors({ ...options, manifestContent: fixture.manifestContent }), []);
  assert.deepStrictEqual(parseSentryAndroidCandidateEvidenceManifest(fixture.manifestContent, fixture.config), fixture.evidence);

  assertRejected('Missing field', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => delete value.sentryDist) }, 'missing: sentryDist');
  assertRejected('Unknown root field', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => { value.extra = true; }) }, 'unknown: extra');
  assertRejected('Unknown nested field', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => { value.aab.extra = true; }) }, 'unknown: extra');
  assertRejected('Token assignment', { ...options, manifestContent: fixture.manifestContent.replace('{', '{\n  "token": "secret",') }, 'token or auth.token');
  assertRejected('Sentry auth token text', { ...options, manifestContent: fixture.manifestContent.replace('{', '{\n  "note": "SENTRY_AUTH_TOKEN=secret",') }, 'token or auth.token');
  assertRejected('auth.token text', { ...options, manifestContent: fixture.manifestContent.replace('{', '{\n  "note": "auth.token=secret",') }, 'token or auth.token');
  assertRejected('Wrong candidate type', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => { value.candidateType = 'production-signed-candidate'; }) }, 'candidate type');
  assertRejected('Invalid candidate type', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => { value.candidateType = 'debug'; }) }, 'candidateType is invalid');
  assertRejected('Wrong release', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => { value.sentryRelease = 'io.goldwallet.wallet@0+0'; }) }, 'release is stale');
  assertRejected('Wrong dist', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => { value.sentryDist = '99'; }) }, 'dist is stale');
  assertRejected('Wrong identity', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => { value.candidateIdentity = 'f'.repeat(64); }) }, 'identity');
  assertRejected('Wrong path', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => { value.generatedBundle.path = path.join(fixtureRoot, 'other.bundle'); }) }, 'path does not match');
  assertRejected('Wrong debug ID state', { ...options, manifestContent: mutateManifest(fixture.manifestContent, value => { value.debugIdState = 'present'; }) }, 'does not match');

  writeFileSync(fixture.config.generatedBundlePath, `${bundle}changed`);
  assertRejected('Bundle mismatch', { ...options, manifestContent: fixture.manifestContent }, 'snapshots no longer match');
  writeSnapshots(fixture.config);

  writeSnapshots(fixture.config, bundle, '{not-json');
  assertRejected('Malformed source map', { ...options, manifestContent: fixture.manifestContent }, 'malformed JSON');
  writeSnapshots(fixture.config, bundle, JSON.stringify({ version: 2, sources: ['index.tsx'], mappings: 'AAAA' }));
  assertRejected('Wrong source-map version', { ...options, manifestContent: fixture.manifestContent }, 'version 3');
  writeSnapshots(fixture.config, bundle, JSON.stringify({ version: 3, sources: [], mappings: 'AAAA' }));
  assertRejected('Empty source list', { ...options, manifestContent: fixture.manifestContent }, 'nonempty string sources');
  writeSnapshots(fixture.config, bundle, JSON.stringify({ version: 3, sources: ['index.tsx'], mappings: '' }));
  assertRejected('Empty mappings', { ...options, manifestContent: fixture.manifestContent }, 'nonempty mappings');

  writeSnapshots(fixture.config);
  const staleTime = new Date(fixture.buildStartedAtMs - 1000);
  utimesSync(fixture.config.sourceGeneratedSourceMapPath, staleTime, staleTime);
  assert.throws(() => collectSentryAndroidCandidateEvidence(options), /not both produced after the guarded Gradle build started/);

  fixture = makeFixture();
  options = { config: fixture.config, metadata, candidateType, buildStartedAtMs: fixture.buildStartedAtMs, ...processEvidence };
  const debugBundle = `${bundle}//# debugId=12345678-1234-1234-1234-123456789abc\n`;
  writeSnapshots(fixture.config, debugBundle, JSON.stringify({ version: 3, sources: ['index.tsx'], mappings: 'AAAA' }));
  assertRejected('Inconsistent debug ID', { ...options, manifestContent: fixture.manifestContent }, 'debug IDs are inconsistent');

  fixture = makeFixture();
  options = { config: fixture.config, metadata, candidateType, buildStartedAtMs: fixture.buildStartedAtMs, ...processEvidence };
  appendFileSync(aabPath, 'mutated-signed-aab-candidate');
  assertRejected('Stale AAB', { config: fixture.config, metadata, candidateType, ...processEvidence, manifestContent: fixture.manifestContent }, 'no longer matches');
  fixture = makeFixture();
  writeFileSync(fixture.config.embeddedBundlePath, `${bundle}stale`);
  assertRejected('Stale embedded bundle', { config: fixture.config, metadata, candidateType, ...processEvidence, manifestContent: fixture.manifestContent }, 'do not match');
  fixture = makeFixture();
  writeFileSync(fixture.config.sourceMapPath, JSON.stringify({ version: 3, sources: ['changed.tsx'], mappings: 'BBBB' }));
  assertRejected('Stale source map', { config: fixture.config, metadata, candidateType, ...processEvidence, manifestContent: fixture.manifestContent }, 'snapshots no longer match');

  fixture = makeFixture();
  writeFileSync(fixture.config.sourceGeneratedSourceMapPath, JSON.stringify({ version: 3, sources: ['other.tsx'], mappings: 'CCCC' }));
  assertRejected(
    'Changed Gradle source map output',
    { config: fixture.config, metadata, candidateType, ...processEvidence, manifestContent: fixture.manifestContent },
    'snapshots no longer match',
  );

  fixture = makeFixture();
  options = { config: fixture.config, metadata, candidateType, buildStartedAtMs: fixture.buildStartedAtMs, ...processEvidence };
  const debugId = '12345678-1234-1234-1234-123456789abc';
  const bundleWithDebugId = `${bundle}//# debugId=${debugId}\n`;
  const mapWithDebugId = JSON.stringify({ version: 3, sources: ['index.tsx'], mappings: 'AAAA', debug_id: debugId });
  writeSnapshots(fixture.config, bundleWithDebugId, mapWithDebugId);
  const presentEvidence = collectSentryAndroidCandidateEvidence(options);
  assert.strictEqual(presentEvidence.debugIdState, 'present');
  assert.deepStrictEqual(
    getSentryAndroidCandidateEvidenceErrors({
      config: fixture.config,
      metadata,
      candidateType,
      buildStartedAtMs: fixture.buildStartedAtMs,
      ...processEvidence,
      manifestContent: renderSentryAndroidCandidateEvidenceManifest(presentEvidence),
    }),
    [],
  );

  assert.throws(
    () => collectSentryAndroidCandidateEvidence({ config: fixture.config, metadata, candidateType, sentryAutoUploadDisabled: true, sentryUploadAttempted: false, secretValuesPrinted: false }),
    /not proven clean/,
  );
  assert.throws(
    () => collectSentryAndroidCandidateEvidence({ config: fixture.config, metadata, candidateType, generatedReactOutputsCleaned: true, sentryUploadAttempted: false, secretValuesPrinted: false }),
    /upload was not proven disabled/,
  );
  assert.throws(
    () => collectSentryAndroidCandidateEvidence({ config: fixture.config, metadata, candidateType, generatedReactOutputsCleaned: true, sentryAutoUploadDisabled: true, sentryUploadAttempted: true, secretValuesPrinted: false }),
    /upload was attempted/,
  );
  assert.throws(
    () => collectSentryAndroidCandidateEvidence({ config: fixture.config, metadata, candidateType, generatedReactOutputsCleaned: true, sentryAutoUploadDisabled: true, sentryUploadAttempted: false, secretValuesPrinted: true }),
    /Secret-safe/,
  );
  assert.throws(
    () => getSentryAndroidCandidateEvidenceConfig(fixtureRoot, { aabPath, artifactBase: '../escape' }),
    /Invalid Sentry Android candidate artifact base/,
  );
  assert.throws(
    () => getSentryAndroidCandidateEvidenceConfig(fixtureRoot, { aabPath: path.join(fixtureRoot, '..', 'outside.aab'), artifactBase: 'prod-proof' }),
    /must be inside the repository root/,
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Sentry Android candidate evidence guard checks passed.');
