import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import { androidpublisher, auth } from '@googleapis/androidpublisher';

import {
  PLAY_PACKAGE_NAME,
  PLAY_SCOPE,
  PLAY_TRACK,
  parseAndroidPlayHandoffArgs,
  resolveAndroidPlayInternalHandoff,
  runAndroidPlayEditWorkflow,
} from './androidPlayInternalHandoff.mjs';
import { acquireAndroidPlayRunLock, createAndroidPlayCandidateSnapshot } from './androidPlayCandidateArtifact.mjs';
import { assertGoogleApiToolingCohort } from './googleApiToolingCohort.mjs';
import { getSentryProductionAndroidReleaseGateErrors } from './sentryProductionAndroidSymbolication.mjs';
import {
  getSentryAndroidCandidateEvidenceConfig,
  parseSentryAndroidCandidateEvidenceManifest,
} from './sentryAndroidCandidateEvidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'local-docs', 'android-play-internal-handoff-summary.txt');
const run = (label, command, args, env = process.env) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, { cwd: root, env, encoding: 'utf8', stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.error?.message || `exit ${result.status}`}`);
  }
};

const renderSummary = (readiness, result = {}, error = '') =>
  [
    'Android Google Play internal handoff',
    `Mode: ${readiness.options.mode}`,
    `Package: ${PLAY_PACKAGE_NAME}`,
    `Track: ${PLAY_TRACK}`,
    `Release status: ${readiness.status}`,
    `Candidate version code: ${candidateSnapshot?.versionCode ?? readiness.release.release.versionCode}`,
    `Candidate version name: ${candidateSnapshot?.versionName ?? readiness.release.release.versionName}`,
    `Release version ready: ${readiness.release.ready ? 'yes' : 'no'}`,
    `Upload signing ready: ${readiness.signing.safe.ready ? 'yes' : 'no'}`,
    `Service account file present: ${readiness.serviceAccountPresent ? 'yes' : 'no'}`,
    `Service account location safe: ${readiness.serviceAccountLocationSafe ? 'yes' : 'no'}`,
    `Service account structure valid: ${readiness.serviceAccountValidation.valid ? 'yes' : 'no'}`,
    `Service account validation status: ${readiness.serviceAccountValidation.status}`,
    `Commit confirmation matches: ${candidateConfirmationMatches ? 'yes' : 'no'}`,
    `Execution ready: ${readiness.ready ? 'yes' : 'no'}`,
    'Electrum release gate required: yes',
    `Electrum release gate result: ${electrumReleaseGateResult}`,
    'Sentry production release gate required: yes',
    `Sentry production release gate result: ${sentryReleaseGateResult}`,
    `Sentry candidate AAB SHA-256: ${sentryReleaseGateEvidence?.aabSha256 || 'not-claimed'}`,
    `Sentry candidate release: ${sentryReleaseGateEvidence?.release || 'not-claimed'}`,
    `Sentry candidate distribution: ${sentryReleaseGateEvidence?.dist || 'not-claimed'}`,
    `Sentry candidate identity: ${sentryReleaseGateEvidence?.candidateIdentity || 'not-claimed'}`,
    `Sentry candidate manifest SHA-256: ${sentryReleaseGateEvidence?.candidateManifestSha256 || 'not-claimed'}`,
    `Sentry embedded bundle SHA-256: ${sentryReleaseGateEvidence?.embeddedBundleSha256 || 'not-claimed'}`,
    `Sentry generated bundle SHA-256: ${sentryReleaseGateEvidence?.generatedBundleSha256 || 'not-claimed'}`,
    `Sentry source map SHA-256: ${sentryReleaseGateEvidence?.sourceMapSha256 || 'not-claimed'}`,
    `Signed AAB present: ${existsSync(readiness.signedAabPath) ? 'yes' : 'no'}`,
    `Signed AAB bytes: ${existsSync(readiness.signedAabPath) ? statSync(readiness.signedAabPath).size : 0}`,
    `Handoff lock acquired: ${runLock ? 'yes' : 'not-claimed'}`,
    `Candidate snapshot ready: ${candidateSnapshot ? 'yes' : 'not-claimed'}`,
    `Candidate snapshot bytes: ${candidateSnapshot?.bytes || 0}`,
    `Candidate snapshot SHA-256: ${candidateSnapshot?.sha256 || 'not-claimed'}`,
    `Candidate manifest ready: ${candidateSnapshot ? 'yes' : 'not-claimed'}`,
    `Uploaded AAB bytes: ${result.uploadedAabBytes || 0}`,
    `Uploaded AAB SHA-256: ${result.uploadedAabSha256 || 'not-claimed'}`,
    `API edit validated: ${result.editValidated ? 'yes' : 'not-claimed'}`,
    `API edit committed: ${result.editCommitted ? 'yes' : 'not-claimed'}`,
    `Previous active version codes retained: ${result.retainedVersionCodes ? result.retainedVersionCodes.join(',') || 'none' : 'not-claimed'}`,
    `Track version codes submitted: ${result.submittedVersionCodes?.join(',') || 'not-claimed'}`,
    `Uncommitted edit deleted: ${result.editDeleted ? 'yes' : 'not-applicable'}`,
    `Uncommitted edit cleanup: ${result.editCleanupStatus || error?.playEditCleanupStatus || 'not-applicable'}`,
    `Play upload validation: ${result.editValidated ? 'passed' : 'not claimed'}`,
    `Play internal release: ${result.editCommitted ? 'committed' : 'not claimed'}`,
    `Service account Play access: ${result.editValidated ? 'confirmed' : 'not claimed'}`,
    `Failure: ${error ? 'yes; see console output' : 'none'}`,
    `Blockers: ${readiness.blockers.length}`,
    ...readiness.blockers.map(blocker => `- ${blocker}`),
    'Service account values printed: no',
    '',
  ].join('\n');

let readiness;
let electrumReleaseGateResult = 'not-claimed';
let sentryReleaseGateResult = 'not-claimed';
let sentryReleaseGateEvidence;
let runLock;
let candidateSnapshot;
let candidateConfirmationMatches = false;
try {
  const options = parseAndroidPlayHandoffArgs(process.argv.slice(2));
  assertGoogleApiToolingCohort();
  readiness = resolveAndroidPlayInternalHandoff({ root, options });
  mkdirSync(path.dirname(summaryPath), { recursive: true });

  if (!options.execute) {
    const summary = renderSummary(readiness);
    writeFileSync(summaryPath, summary);
    console.log(summary);
    process.exit(0);
  }
  if (!readiness.ready) throw new Error(`Android Play internal handoff is not ready: ${readiness.blockers.join(' ')}`);
  runLock = acquireAndroidPlayRunLock({ lockPath: readiness.runLockPath });

  electrumReleaseGateResult = 'failed';
  run('validate Electrum release gate', process.execPath, [
    'scripts/auditElectrumEndpointReadiness.mjs',
    '--require-ready',
  ]);
  electrumReleaseGateResult = 'passed';
  run('build verified production signed AAB', process.execPath, ['scripts/runAndroidSignedBundle.mjs'], {
    ...process.env,
    GOLDWALLET_PLAY_LOCK_TOKEN: runLock.token,
  });
  run('validate candidate-bound signed AAB runtime evidence', process.execPath, [
    'scripts/checkAndroidProductionSignedBundleSummary.mjs',
  ]);
  if (!existsSync(readiness.signedAabPath) || statSync(readiness.signedAabPath).size === 0) {
    throw new Error('Verified production signed AAB is missing after the signing runner');
  }
  const signedSummary = readFileSync(path.join(root, 'local-docs', 'android-prod-signed-bundle-summary.txt'), 'utf8');
  for (const evidence of [
    'AAB JAR signature: verified',
    'AAB version metadata match: passed',
    'Production release version ready: yes',
  ]) {
    if (!signedSummary.includes(evidence)) throw new Error(`Signed AAB summary is missing: ${evidence}`);
  }
  const signedVersionCode = Number(signedSummary.match(/^Version code: (\d+)$/m)?.[1]);
  const signedVersionName = signedSummary.match(/^Version name: (.+)$/m)?.[1] || '';
  const signedCertificateSha256 = signedSummary.match(/^Certificate SHA-256: ([a-f0-9]{64})$/m)?.[1] || '';
  if (
    signedVersionCode !== readiness.release.release.versionCode ||
    signedVersionName !== readiness.release.release.versionName ||
    !signedCertificateSha256
  ) {
    throw new Error('Signed AAB metadata changed after Play release readiness was resolved');
  }
  candidateSnapshot = createAndroidPlayCandidateSnapshot({
    sourcePath: readiness.signedAabPath,
    snapshotDirectory: readiness.candidateSnapshotDirectory,
    packageName: PLAY_PACKAGE_NAME,
    track: PLAY_TRACK,
    versionCode: signedVersionCode,
    versionName: signedVersionName,
    certificateSha256: signedCertificateSha256,
  });
  if (!signedSummary.includes(`AAB SHA-256: ${candidateSnapshot.sha256}`)) {
    throw new Error('Immutable candidate snapshot digest does not match signed AAB evidence');
  }
  const expectedCandidateConfirmation = `${readiness.expectedConfirmationPrefix}:${candidateSnapshot.sha256}`;
  candidateConfirmationMatches =
    options.commit && process.env.GOLDWALLET_PLAY_COMMIT_CONFIRMATION === expectedCandidateConfirmation;
  if (options.commit && !candidateConfirmationMatches) {
    throw new Error(`Set GOLDWALLET_PLAY_COMMIT_CONFIRMATION to ${expectedCandidateConfirmation}`);
  }

  sentryReleaseGateResult = 'failed';
  const sentryCandidateConfig = getSentryAndroidCandidateEvidenceConfig(root, {
    aabPath: readiness.signedAabPath,
    artifactBase: 'android-prod-signed-bundle-sentry',
  });
  const sentryCandidateManifestContent = readFileSync(sentryCandidateConfig.manifestPath, 'utf8');
  const sentryCandidate = parseSentryAndroidCandidateEvidenceManifest(
    sentryCandidateManifestContent,
    sentryCandidateConfig,
  );
  if (
    sentryCandidate.candidateType !== 'production-signed-candidate' ||
    sentryCandidate.aab.sha256 !== candidateSnapshot.sha256
  ) {
    throw new Error('Production Sentry manifest does not match the immutable Play candidate');
  }
  const sentryCandidateManifestSha256 = createHash('sha256').update(sentryCandidateManifestContent).digest('hex');
  run(
    'validate exact-candidate production Sentry release gate',
    process.execPath,
    [
      'scripts/runSentryProductionAndroidSymbolication.mjs',
      '--execute',
      '--release-gate',
      `--expected-aab-sha256=${candidateSnapshot.sha256}`,
    ],
    { ...process.env, GOLDWALLET_PLAY_LOCK_TOKEN: runLock.token },
  );
  const sentrySummary = readFileSync(
    path.join(root, 'local-docs', 'sentry-production-android-release-gate-summary.txt'),
    'utf8',
  );
  const expectedSentryRelease = `${PLAY_PACKAGE_NAME}@${candidateSnapshot.versionName}+${candidateSnapshot.versionCode}`;
  const sentryErrors = getSentryProductionAndroidReleaseGateErrors({
    summary: sentrySummary,
    expected: {
      release: expectedSentryRelease,
      dist: String(candidateSnapshot.versionCode),
      aabSha256: candidateSnapshot.sha256,
      candidateIdentity: sentryCandidate.candidateIdentity,
      candidateManifestSha256: sentryCandidateManifestSha256,
      embeddedBundleSha256: sentryCandidate.embeddedBundle.sha256,
      generatedBundleSha256: sentryCandidate.generatedBundle.sha256,
      sourceMapSha256: sentryCandidate.sourceMap.sha256,
    },
  });
  if (sentryErrors.length > 0) {
    throw new Error(`Production Sentry release gate failed: ${sentryErrors.join('; ')}`);
  }
  sentryReleaseGateEvidence = {
    aabSha256: candidateSnapshot.sha256,
    release: expectedSentryRelease,
    dist: String(candidateSnapshot.versionCode),
    candidateIdentity: sentryCandidate.candidateIdentity,
    candidateManifestSha256: sentryCandidateManifestSha256,
    embeddedBundleSha256: sentryCandidate.embeddedBundle.sha256,
    generatedBundleSha256: sentryCandidate.generatedBundle.sha256,
    sourceMapSha256: sentryCandidate.sourceMap.sha256,
  };
  sentryReleaseGateResult = 'passed';

  const googleAuth = new auth.GoogleAuth({
    keyFilename: readiness.serviceAccountPath,
    scopes: [PLAY_SCOPE],
  });
  const authClient = await googleAuth.getClient();
  const client = androidpublisher({ version: 'v3', auth: authClient });
  const result = await runAndroidPlayEditWorkflow({
    client,
    aabPath: candidateSnapshot.snapshotPath,
    versionCode: candidateSnapshot.versionCode,
    versionName: candidateSnapshot.versionName,
    status: readiness.status,
    commit: options.commit,
    expectedAabSha256: candidateSnapshot.sha256,
    expectedAabBytes: candidateSnapshot.bytes,
  });
  const summary = renderSummary(readiness, result);
  writeFileSync(summaryPath, summary);
  console.log(summary);
} catch (error) {
  if (readiness) {
    mkdirSync(path.dirname(summaryPath), { recursive: true });
    writeFileSync(summaryPath, renderSummary(readiness, {}, error));
  }
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (runLock) runLock.release();
}
