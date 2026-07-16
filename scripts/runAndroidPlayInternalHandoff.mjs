import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'local-docs', 'android-play-internal-handoff-summary.txt');
const run = (label, command, args) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, { cwd: root, env: process.env, encoding: 'utf8', stdio: 'inherit' });
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
    `Candidate version code: ${readiness.release.release.versionCode}`,
    `Candidate version name: ${readiness.release.release.versionName}`,
    `Release version ready: ${readiness.release.ready ? 'yes' : 'no'}`,
    `Upload signing ready: ${readiness.signing.safe.ready ? 'yes' : 'no'}`,
    `Service account file present: ${readiness.serviceAccountPresent ? 'yes' : 'no'}`,
    `Service account location safe: ${readiness.serviceAccountLocationSafe ? 'yes' : 'no'}`,
    `Commit confirmation matches: ${readiness.confirmationMatches ? 'yes' : 'no'}`,
    `Execution ready: ${readiness.ready ? 'yes' : 'no'}`,
    'Electrum release gate required: yes',
    `Electrum release gate result: ${electrumReleaseGateResult}`,
    `Signed AAB present: ${existsSync(readiness.signedAabPath) ? 'yes' : 'no'}`,
    `Signed AAB bytes: ${existsSync(readiness.signedAabPath) ? statSync(readiness.signedAabPath).size : 0}`,
    `API edit validated: ${result.editValidated ? 'yes' : 'not-claimed'}`,
    `API edit committed: ${result.editCommitted ? 'yes' : 'not-claimed'}`,
    `Uncommitted edit deleted: ${result.editDeleted ? 'yes' : 'not-applicable'}`,
    `Play upload validation: ${result.editValidated ? 'passed' : 'not claimed'}`,
    `Play internal release: ${result.editCommitted ? 'committed' : 'not claimed'}`,
    `Failure: ${error ? 'yes; see console output' : 'none'}`,
    `Blockers: ${readiness.blockers.length}`,
    ...readiness.blockers.map(blocker => `- ${blocker}`),
    'Service account values printed: no',
    '',
  ].join('\n');

let readiness;
let electrumReleaseGateResult = 'not-claimed';
try {
  const options = parseAndroidPlayHandoffArgs(process.argv.slice(2));
  readiness = resolveAndroidPlayInternalHandoff({ root, options });
  mkdirSync(path.dirname(summaryPath), { recursive: true });

  if (!options.execute) {
    const summary = renderSummary(readiness);
    writeFileSync(summaryPath, summary);
    console.log(summary);
    process.exit(0);
  }
  if (!readiness.ready) throw new Error(`Android Play internal handoff is not ready: ${readiness.blockers.join(' ')}`);

  electrumReleaseGateResult = 'failed';
  run('validate Electrum release gate', process.execPath, ['scripts/auditElectrumEndpointReadiness.mjs', '--require-ready']);
  electrumReleaseGateResult = 'passed';
  run('build verified production signed AAB', process.execPath, ['scripts/runAndroidSignedBundle.mjs']);
  if (!existsSync(readiness.signedAabPath) || statSync(readiness.signedAabPath).size === 0) {
    throw new Error('Verified production signed AAB is missing after the signing runner');
  }
  const signedSummary = readFileSync(path.join(root, 'local-docs', 'android-prod-signed-bundle-summary.txt'), 'utf8');
  for (const evidence of ['AAB JAR signature: verified', 'AAB version metadata match: passed', 'Production release version ready: yes']) {
    if (!signedSummary.includes(evidence)) throw new Error(`Signed AAB summary is missing: ${evidence}`);
  }

  const googleAuth = new auth.GoogleAuth({
    keyFilename: readiness.serviceAccountPath,
    scopes: [PLAY_SCOPE],
  });
  const authClient = await googleAuth.getClient();
  const client = androidpublisher({ version: 'v3', auth: authClient });
  const result = await runAndroidPlayEditWorkflow({
    client,
    aabPath: readiness.signedAabPath,
    versionCode: readiness.release.release.versionCode,
    versionName: readiness.release.release.versionName,
    status: readiness.status,
    commit: options.commit,
  });
  const summary = renderSummary(readiness, result);
  writeFileSync(summaryPath, summary);
  console.log(summary);
} catch (error) {
  if (readiness) {
    mkdirSync(path.dirname(summaryPath), { recursive: true });
    writeFileSync(summaryPath, renderSummary(readiness, {}, error.message));
  }
  console.error(error.message);
  process.exit(1);
}
