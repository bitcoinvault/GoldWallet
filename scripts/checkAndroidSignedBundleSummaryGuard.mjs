import assert from 'assert';
import { createHash } from 'crypto';
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import { getAndroidSignedBundleSummaryErrors } from './androidSignedBundleSummary.mjs';
import {
  collectSentryAndroidCandidateEvidence,
  getSentryAndroidCandidateEvidenceConfig,
  renderSentryAndroidCandidateEvidenceManifest,
} from './sentryAndroidCandidateEvidence.mjs';

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-signed-bundle-summary-${process.pid}`);
const aabPath = path.join(fixtureRoot, 'candidate.aab');
const apkPath = path.join(fixtureRoot, 'candidate.apk');
const smokePath = path.join(fixtureRoot, 'smoke-summary.txt');
const hash = filePath => createHash('sha256').update(filePath === aabPath ? 'aab' : filePath === apkPath ? 'apk' : 'smoke').digest('hex');

try {
  mkdirSync(fixtureRoot, { recursive: true });
  writeFileSync(aabPath, 'aab');
  writeFileSync(apkPath, 'apk');
  writeFileSync(smokePath, 'smoke');
  const sentryCandidateConfig = getSentryAndroidCandidateEvidenceConfig(fixtureRoot, {
    aabPath,
    artifactBase: 'local-proof-sentry',
  });
  mkdirSync(sentryCandidateConfig.candidateDirectory, { recursive: true });
  const buildStartedAtMs = Date.now() - 1000;
  mkdirSync(path.dirname(sentryCandidateConfig.sourceGeneratedBundlePath), { recursive: true });
  mkdirSync(path.dirname(sentryCandidateConfig.sourceGeneratedSourceMapPath), { recursive: true });
  writeFileSync(sentryCandidateConfig.sourceGeneratedBundlePath, 'bundle');
  writeFileSync(sentryCandidateConfig.sourceGeneratedSourceMapPath, JSON.stringify({ version: 3, sources: ['index.tsx'], mappings: 'AAAA' }));
  writeFileSync(sentryCandidateConfig.embeddedBundlePath, 'bundle');
  writeFileSync(sentryCandidateConfig.generatedBundlePath, 'bundle');
  writeFileSync(
    sentryCandidateConfig.sourceMapPath,
    JSON.stringify({ version: 3, sources: ['index.tsx'], mappings: 'AAAA' }),
  );
  const sentryEvidence = collectSentryAndroidCandidateEvidence({
    config: sentryCandidateConfig,
    metadata: { versionCode: '14', versionName: '6.5.1' },
    candidateType: 'local-signing-proof',
    generatedReactOutputsCleaned: true,
    buildStartedAtMs,
    sentryAutoUploadDisabled: true,
    sentryUploadAttempted: false,
    secretValuesPrinted: false,
  });
  const sentryManifestContent = renderSentryAndroidCandidateEvidenceManifest(sentryEvidence);
  writeFileSync(sentryCandidateConfig.manifestPath, sentryManifestContent);
  const summary = [
    'Android upload signing local proof',
    'Variant: prodRelease',
    'Gradle signing requirement: enforced',
    'Configured alias certificate match: passed',
    'AAB JAR signature: verified',
    'Bundle validation: passed',
    'AAB page alignment: PAGE_ALIGNMENT_16K',
    'Version code: 14',
    'Version name: 6.5.1',
    'AAB version metadata match: passed',
    `AAB bytes: ${statSync(aabPath).size}`,
    `AAB SHA-256: ${hash(aabPath)}`,
    `Certificate SHA-256: ${'d'.repeat(64)}`,
    'Candidate-bound emulator smoke: passed',
    'Runtime universal APK 16 KB ZIP alignment: passed',
    'Runtime universal APK 16 KB 64-bit ELF alignment: passed',
    'Runtime 16 KB native libraries checked: 58',
    'Runtime 16 KB ELF LOAD segments checked: 170',
    `Runtime source AAB SHA-256: ${hash(aabPath)}`,
    `Runtime universal APK bytes: ${statSync(apkPath).size}`,
    `Runtime universal APK SHA-256: ${hash(apkPath)}`,
    `Runtime smoke summary SHA-256: ${hash(smokePath)}`,
    'Sentry candidate type: local-signing-proof',
    `Sentry candidate release: ${sentryEvidence.sentryRelease}`,
    `Sentry candidate dist: ${sentryEvidence.sentryDist}`,
    `Sentry embedded bundle SHA-256: ${sentryEvidence.embeddedBundle.sha256}`,
    `Sentry generated bundle SHA-256: ${sentryEvidence.generatedBundle.sha256}`,
    `Sentry source map SHA-256: ${sentryEvidence.sourceMap.sha256}`,
    `Sentry candidate identity: ${sentryEvidence.candidateIdentity}`,
    `Sentry candidate manifest SHA-256: ${createHash('sha256').update(readFileSync(sentryCandidateConfig.manifestPath)).digest('hex')}`,
    'Sentry candidate bundle digest match: passed',
    'Sentry generated React outputs cleaned before build: yes',
    'Sentry automatic upload disabled: yes',
    'Sentry upload attempted: no',
    'Sentry upload validation: not claimed',
    'Certificate identity: GoldWallet Local Signing Proof',
    'Temporary keystore retained: no',
    'Production upload key used: no',
    'Production release version ready: not-required-for-local-proof',
    'Production Play upload readiness: not claimed',
    'Sentry upload: independently gated',
    'Secret values printed: no',
    '',
  ].join('\n');
  const options = {
    aabPath,
    runtimeUniversalApkPath: apkPath,
    runtimeSmokeSummaryPath: smokePath,
    sentryCandidateConfig,
    sentryCandidateType: 'local-signing-proof',
    metadata: { versionCode: '14', versionName: '6.5.1' },
    localProof: true,
  };

  assert.deepStrictEqual(getAndroidSignedBundleSummaryErrors({ ...options, summary }), []);
  assert(
    getAndroidSignedBundleSummaryErrors({
      ...options,
      summary: summary.replace(`Runtime source AAB SHA-256: ${hash(aabPath)}`, `Runtime source AAB SHA-256: ${'f'.repeat(64)}`),
    }).some(error => error.includes('Runtime source AAB SHA-256')),
  );
  assert(
    getAndroidSignedBundleSummaryErrors({
      ...options,
      summary: `${summary}\nSentry upload validation: passed\n`,
    }).some(error => error.includes('duplicate label: Sentry upload validation')),
  );
  writeFileSync(sentryCandidateConfig.generatedBundlePath, 'stale-bundle');
  assert(
    getAndroidSignedBundleSummaryErrors({ ...options, summary }).some(error => error.includes('Sentry candidate evidence')),
  );
  writeFileSync(sentryCandidateConfig.generatedBundlePath, 'bundle');
  writeFileSync(sentryCandidateConfig.manifestPath, '{}');
  assert(
    getAndroidSignedBundleSummaryErrors({ ...options, summary }).some(error => error.includes('Sentry candidate evidence')),
  );
  writeFileSync(sentryCandidateConfig.manifestPath, sentryManifestContent);
  assert(
    getAndroidSignedBundleSummaryErrors({
      ...options,
      summary: summary.replace('Candidate-bound emulator smoke: passed', 'Candidate-bound emulator smoke: skipped'),
    }).some(error => error.includes('Candidate-bound emulator smoke')),
  );
  assert(
    getAndroidSignedBundleSummaryErrors({
      ...options,
      summary: summary.replace('Secret values printed: no', 'Secret values printed: yes'),
    }).some(error => error.includes('Secret values printed')),
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android signed bundle summary guard checks passed.');
