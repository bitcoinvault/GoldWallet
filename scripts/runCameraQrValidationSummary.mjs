import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidReleaseSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getCameraCandidateSummaryErrors } from './cameraCandidateSummaryGuard.mjs';
import { getCameraQrMigrationSummaryErrors } from './cameraQrMigrationSummaryGuard.mjs';
import { getCameraQrValidationSummaryErrors } from './cameraQrValidationSummaryGuard.mjs';
import { collectControlledAndroidReleaseBlocker } from './androidControlledReleaseBlocker.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'local-docs', 'camera-qr-validation-summary.txt');
const candidateSummaryPath = path.join(root, 'local-docs', 'camera-candidate-summary.txt');
const migrationSummaryPath = path.join(root, 'local-docs', 'camera-qr-migration-summary.txt');
const androidSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-summary.txt');
const androidReleaseSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-summary.txt');
const androidReleaseCreateWalletSmokeSummaryPath = path.join(root, 'local-docs', 'android-create-wallet-smoke-dev-release-summary.txt');
const androidReleaseSignedSmokeApkPath = path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk');

const readSummary = summaryPath => {
  if (!existsSync(summaryPath)) {
    return '';
  }

  return readFileSync(summaryPath, 'utf8');
};

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getBulletLinesAfter = (content, label) => {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.startsWith(`${label}: `));
  const bulletLines = [];

  if (startIndex === -1) {
    return bulletLines;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (!lines[index].startsWith('- ')) {
      break;
    }

    bulletLines.push(lines[index]);
  }

  return bulletLines;
};

const yesNo = value => (value === 'yes' ? 'yes' : 'no');

const collectEvidence = () => {
  const candidateSummary = readSummary(candidateSummaryPath);
  const migrationSummary = readSummary(migrationSummaryPath);
  const androidSmokeSummary = readSummary(androidSmokeSummaryPath);
  const androidReleaseSmokeSummary = readSummary(androidReleaseSmokeSummaryPath);
  const androidReleaseCreateWalletSmokeSummary = readSummary(androidReleaseCreateWalletSmokeSummaryPath);
  const controlledReleaseBlocker = collectControlledAndroidReleaseBlocker(root);
  const candidateErrors = candidateSummary ? getCameraCandidateSummaryErrors(candidateSummary) : ['missing Camera candidate summary'];
  const migrationErrors = migrationSummary ? getCameraQrMigrationSummaryErrors(migrationSummary) : ['missing Camera QR migration summary'];
  const androidSmokeErrors = androidSmokeSummary
    ? getAndroidEmbeddedSmokeSummaryErrors(androidSmokeSummary, { expectedArtifactBase: 'android-smoke-dev' })
    : ['missing Android dev smoke summary'];
  const androidReleaseSmokeErrors = androidReleaseSmokeSummary
    ? getAndroidEmbeddedSmokeSummaryErrors(androidReleaseSmokeSummary, getAndroidReleaseSmokeEvidenceOptions(root))
    : ['missing Android release smoke summary'];
  const androidReleaseCreateWalletSmokeErrors = androidReleaseCreateWalletSmokeSummary
    ? getAndroidCreateWalletSmokeSummaryErrors(androidReleaseCreateWalletSmokeSummary, {
        expectedApkPath: androidReleaseSignedSmokeApkPath,
        expectedArtifactBase: 'android-create-wallet-smoke-dev-release',
      })
    : ['missing Android release create-wallet smoke summary'];

  return {
    candidateSummary,
    migrationSummary,
    androidSmokeSummary,
    androidReleaseSmokeSummary,
    androidReleaseCreateWalletSmokeSummary,
    controlledReleaseBlocker,
    candidateErrors,
    migrationErrors,
    androidSmokeErrors,
    androidReleaseSmokeErrors,
    androidReleaseCreateWalletSmokeErrors,
  };
};

const formatSummary = ({ evidence, generatedAt = new Date().toISOString() }) => {
  const candidateSummaryValid = evidence.candidateErrors.length === 0;
  const migrationSummaryValid = evidence.migrationErrors.length === 0;
  const androidSmokePresent = evidence.androidSmokeSummary.length > 0;
  const androidSmokeValid = evidence.androidSmokeErrors.length === 0;
  const androidDevQrScannerValidated = yesNo(getLineValue(evidence.androidSmokeSummary, 'Validated QR scanner screen'));
  const androidReleaseSmokePresent = evidence.androidReleaseSmokeSummary.length > 0;
  const androidReleaseSmokeValid = evidence.androidReleaseSmokeErrors.length === 0;
  const androidReleaseQrScannerValidated = yesNo(getLineValue(evidence.androidReleaseSmokeSummary, 'Validated QR scanner screen'));
  const androidReleaseCreateWalletPresent = evidence.androidReleaseCreateWalletSmokeSummary.length > 0;
  const androidReleaseCreateWalletValid = evidence.androidReleaseCreateWalletSmokeErrors.length === 0;
  const androidValidationReady =
    candidateSummaryValid && migrationSummaryValid && androidSmokePresent && androidSmokeValid && androidDevQrScannerValidated === 'yes';
  const androidReleaseEvidenceReady =
    androidReleaseSmokePresent &&
    androidReleaseSmokeValid &&
    androidReleaseQrScannerValidated === 'yes' &&
    androidReleaseCreateWalletPresent &&
    androidReleaseCreateWalletValid;
  const releaseRuntimeProofState = androidReleaseEvidenceReady
    ? 'ready'
    : evidence.controlledReleaseBlocker.valid
    ? evidence.controlledReleaseBlocker.outcome
    : 'not ready';

  return [
    'Camera/QR validation summary',
    `Generated at: ${generatedAt}`,
    `CameraKit package: react-native-camera-kit@${getLineValue(evidence.migrationSummary, 'react-native-camera-kit manifest version') || '<missing>'}`,
    `QR renderer package: react-native-qrcode-svg@${getLineValue(evidence.migrationSummary, 'QR renderer version') || '<missing>'}`,
    `QR native renderer package: react-native-svg@${getLineValue(evidence.migrationSummary, 'QR native renderer version') || '<missing>'}`,
    `QR encoder resolution: qrcode@${getLineValue(evidence.migrationSummary, 'qrcode resolution') || '<missing>'}`,
    `Camera candidate summary valid: ${candidateSummaryValid ? 'yes' : 'no'}`,
    `Camera QR migration summary valid: ${migrationSummaryValid ? 'yes' : 'no'}`,
    `Android dev smoke summary present: ${androidSmokePresent ? 'yes' : 'no'}`,
    `Android dev smoke summary valid: ${androidSmokeValid ? 'yes' : 'no'}`,
    `Android smoke artifact base: ${getLineValue(evidence.androidSmokeSummary, 'Artifact base') || '<missing>'}`,
    `Android smoke outcome: ${getLineValue(evidence.androidSmokeSummary, 'Android smoke outcome') || '<missing>'}`,
    `Android dev QR scanner validated: ${androidDevQrScannerValidated}`,
    `Android release smoke summary present: ${androidReleaseSmokePresent ? 'yes' : 'no'}`,
    `Android release smoke summary valid: ${androidReleaseSmokeValid ? 'yes' : 'no'}`,
    `Android release smoke artifact base: ${getLineValue(evidence.androidReleaseSmokeSummary, 'Artifact base') || '<missing>'}`,
    `Android release smoke outcome: ${getLineValue(evidence.androidReleaseSmokeSummary, 'Android smoke outcome') || '<missing>'}`,
    `Android release QR scanner validated: ${androidReleaseQrScannerValidated}`,
    `Android release create-wallet smoke summary present: ${androidReleaseCreateWalletPresent ? 'yes' : 'no'}`,
    `Android release create-wallet smoke summary valid: ${androidReleaseCreateWalletValid ? 'yes' : 'no'}`,
    `Android release create-wallet smoke artifact base: ${getLineValue(evidence.androidReleaseCreateWalletSmokeSummary, 'Artifact base') || '<missing>'}`,
    `Android release create-wallet smoke outcome: ${
      getLineValue(evidence.androidReleaseCreateWalletSmokeSummary, 'Android create-wallet smoke outcome') || '<missing>'
    }`,
    `Controlled release blocker summary present: ${evidence.controlledReleaseBlocker.present ? 'yes' : 'no'}`,
    `Controlled release blocker valid: ${evidence.controlledReleaseBlocker.valid ? 'yes' : 'no'}`,
    `Controlled release blocker outcome: ${evidence.controlledReleaseBlocker.outcome}`,
    `Controlled release blocker errors: ${evidence.controlledReleaseBlocker.errors.length}`,
    ...evidence.controlledReleaseBlocker.errors.map(error => `- ${error}`),
    `Camera/QR release runtime proof state: ${releaseRuntimeProofState}`,
    `iOS camera Podfile.lock cleanup complete: ${yesNo(getLineValue(evidence.migrationSummary, 'iOS camera Podfile.lock cleanup complete'))}`,
    `iOS broader Podfile.lock refresh required: ${yesNo(getLineValue(evidence.migrationSummary, 'iOS broader Podfile.lock refresh required'))}`,
    `iOS broader Podfile.lock drift issues: ${getLineValue(evidence.migrationSummary, 'iOS broader Podfile.lock drift issues') || '0'}`,
    ...getBulletLinesAfter(evidence.migrationSummary, 'iOS broader Podfile.lock drift issues'),
    `iOS runtime validation claimed: no`,
    `Camera candidate summary errors: ${evidence.candidateErrors.length}`,
    ...evidence.candidateErrors.map(error => `- ${error}`),
    `Camera QR migration summary errors: ${evidence.migrationErrors.length}`,
    ...evidence.migrationErrors.map(error => `- ${error}`),
    `Android dev smoke summary errors: ${evidence.androidSmokeErrors.length}`,
    ...evidence.androidSmokeErrors.map(error => `- ${error}`),
    `Android release smoke summary errors: ${evidence.androidReleaseSmokeErrors.length}`,
    ...evidence.androidReleaseSmokeErrors.map(error => `- ${error}`),
    `Android release create-wallet smoke summary errors: ${evidence.androidReleaseCreateWalletSmokeErrors.length}`,
    ...evidence.androidReleaseCreateWalletSmokeErrors.map(error => `- ${error}`),
    `Camera/QR Android validation evidence ready: ${androidValidationReady ? 'yes' : 'no'}`,
    `Android release evidence ready: ${androidReleaseEvidenceReady ? 'yes' : 'no'}`,
    'Secret values printed: no',
    'Required action: keep Android CameraKit scanner evidence current before scanner-affecting changes; rerun Android dev and release Camera/QR smoke before claiming Android validation; renew the dev/testnet Electrum TLS certificate before relying on full release Camera/QR proof; run pod install on macOS and validate iOS scanner runtime before claiming iOS Camera/QR validation.',
    '',
  ].join('\n');
};

const main = () => {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const evidence = collectEvidence();
  const summary = formatSummary({ evidence });
  const errors = getCameraQrValidationSummaryErrors(summary);

  if (errors.length > 0) {
    console.error('Camera/QR validation summary is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  if (dryRun) {
    console.log(summary.trim());
    return 0;
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, summary);
  console.log(summary.trim());
  console.log(`Camera/QR validation summary written to ${path.relative(root, outputPath)}`);
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
