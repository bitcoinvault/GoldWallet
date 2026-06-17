import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidReleaseSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getSecureStorageMigrationSummaryErrors } from './secureStorageMigrationSummaryGuard.mjs';
import { getSecureStorageRemovalReadinessSummaryErrors } from './secureStorageRemovalReadinessSummaryGuard.mjs';
import { getSecureStorageReleaseValidationSummaryErrors } from './secureStorageReleaseValidationSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'local-docs', 'secure-storage-release-validation-summary.txt');
const migrationSummaryPath = path.join(root, 'local-docs', 'secure-storage-migration-summary.txt');
const removalSummaryPath = path.join(root, 'local-docs', 'secure-storage-removal-readiness-summary.txt');
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

const yesNo = value => (value === 'yes' ? 'yes' : 'no');

const collectEvidence = () => {
  const migrationSummary = readSummary(migrationSummaryPath);
  const removalSummary = readSummary(removalSummaryPath);
  const androidSmokeSummary = readSummary(androidSmokeSummaryPath);
  const androidReleaseSmokeSummary = readSummary(androidReleaseSmokeSummaryPath);
  const androidReleaseCreateWalletSmokeSummary = readSummary(androidReleaseCreateWalletSmokeSummaryPath);
  const migrationErrors = migrationSummary ? getSecureStorageMigrationSummaryErrors(migrationSummary) : ['missing secure-storage migration summary'];
  const removalErrors = removalSummary
    ? getSecureStorageRemovalReadinessSummaryErrors(removalSummary)
    : ['missing secure-storage removal readiness summary'];
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
    migrationSummary,
    removalSummary,
    androidSmokeSummary,
    androidReleaseSmokeSummary,
    androidReleaseCreateWalletSmokeSummary,
    migrationErrors,
    removalErrors,
    androidSmokeErrors,
    androidReleaseSmokeErrors,
    androidReleaseCreateWalletSmokeErrors,
  };
};

const formatSummary = ({ evidence, generatedAt = new Date().toISOString() }) => {
  const migrationSummaryValid = evidence.migrationErrors.length === 0;
  const removalSummaryValid = evidence.removalErrors.length === 0;
  const androidSmokePresent = evidence.androidSmokeSummary.length > 0;
  const androidSmokeValid = evidence.androidSmokeErrors.length === 0;
  const androidReleaseSmokePresent = evidence.androidReleaseSmokeSummary.length > 0;
  const androidReleaseSmokeValid = evidence.androidReleaseSmokeErrors.length === 0;
  const androidReleaseCreateWalletSmokePresent = evidence.androidReleaseCreateWalletSmokeSummary.length > 0;
  const androidReleaseCreateWalletSmokeValid = evidence.androidReleaseCreateWalletSmokeErrors.length === 0;
  const androidReleaseEvidenceReady =
    androidReleaseSmokePresent &&
    androidReleaseSmokeValid &&
    androidReleaseCreateWalletSmokePresent &&
    androidReleaseCreateWalletSmokeValid;
  const evidenceReady = migrationSummaryValid && removalSummaryValid && androidSmokePresent && androidSmokeValid;

  return [
    'Secure-storage release validation summary',
    `Generated at: ${generatedAt}`,
    `Current secure-storage package: ${getLineValue(evidence.migrationSummary, 'Current secure-storage package') || '<missing>'}`,
    `Legacy secure-storage package: ${getLineValue(evidence.migrationSummary, 'Legacy secure-storage package') || '<missing>'}`,
    `Migration summary valid: ${migrationSummaryValid ? 'yes' : 'no'}`,
    `Removal readiness summary valid: ${removalSummaryValid ? 'yes' : 'no'}`,
    `Android dev smoke summary present: ${androidSmokePresent ? 'yes' : 'no'}`,
    `Android dev smoke summary valid: ${androidSmokeValid ? 'yes' : 'no'}`,
    `Android smoke artifact base: ${getLineValue(evidence.androidSmokeSummary, 'Artifact base') || '<missing>'}`,
    `Android smoke outcome: ${getLineValue(evidence.androidSmokeSummary, 'Android smoke outcome') || '<missing>'}`,
    `Android release smoke summary present: ${androidReleaseSmokePresent ? 'yes' : 'no'}`,
    `Android release smoke summary valid: ${androidReleaseSmokeValid ? 'yes' : 'no'}`,
    `Android release smoke artifact base: ${getLineValue(evidence.androidReleaseSmokeSummary, 'Artifact base') || '<missing>'}`,
    `Android release smoke outcome: ${getLineValue(evidence.androidReleaseSmokeSummary, 'Android smoke outcome') || '<missing>'}`,
    `Android release create-wallet smoke summary present: ${androidReleaseCreateWalletSmokePresent ? 'yes' : 'no'}`,
    `Android release create-wallet smoke summary valid: ${androidReleaseCreateWalletSmokeValid ? 'yes' : 'no'}`,
    `Android release create-wallet smoke artifact base: ${getLineValue(evidence.androidReleaseCreateWalletSmokeSummary, 'Artifact base') || '<missing>'}`,
    `Android release create-wallet smoke outcome: ${
      getLineValue(evidence.androidReleaseCreateWalletSmokeSummary, 'Android create-wallet smoke outcome') || '<missing>'
    }`,
    `Focused validation script: ${getLineValue(evidence.migrationSummary, 'Focused validation script') || '<missing>'}`,
    `Keychain primary write: ${yesNo(getLineValue(evidence.migrationSummary, 'Keychain primary write'))}`,
    `Legacy fallback reads active: ${yesNo(getLineValue(evidence.removalSummary, 'Legacy fallback reads active'))}`,
    `Legacy writes disabled: ${yesNo(getLineValue(evidence.removalSummary, 'Legacy write path disabled'))}`,
    `Legacy cleanup after successful migration: ${yesNo(getLineValue(evidence.removalSummary, 'Legacy cleanup after successful migration'))}`,
    `Legacy fallback instrumentation active: ${yesNo(getLineValue(evidence.removalSummary, 'Legacy fallback instrumentation active'))}`,
    `Removal release validation claimed: ${yesNo(getLineValue(evidence.removalSummary, 'Removal release validation claimed'))}`,
    `Legacy package removal ready: ${yesNo(getLineValue(evidence.removalSummary, 'Legacy package removal ready'))}`,
    `Android warning source still expected: ${yesNo(getLineValue(evidence.removalSummary, 'Android warning source still expected'))}`,
    `Migration summary errors: ${evidence.migrationErrors.length}`,
    ...evidence.migrationErrors.map(error => `- ${error}`),
    `Removal readiness summary errors: ${evidence.removalErrors.length}`,
    ...evidence.removalErrors.map(error => `- ${error}`),
    `Android dev smoke summary errors: ${evidence.androidSmokeErrors.length}`,
    ...evidence.androidSmokeErrors.map(error => `- ${error}`),
    `Android release smoke summary errors: ${evidence.androidReleaseSmokeErrors.length}`,
    ...evidence.androidReleaseSmokeErrors.map(error => `- ${error}`),
    `Android release create-wallet smoke summary errors: ${evidence.androidReleaseCreateWalletSmokeErrors.length}`,
    ...evidence.androidReleaseCreateWalletSmokeErrors.map(error => `- ${error}`),
    `Secure-storage release validation evidence ready: ${evidenceReady ? 'yes' : 'no'}`,
    `Android release evidence ready: ${androidReleaseEvidenceReady ? 'yes' : 'no'}`,
    'Secret values printed: no',
    'Required action: keep react-native-secure-key-store installed until fallback-free validation is claimed for migrated PIN, transaction-password, and encrypted wallet data.',
    '',
  ].join('\n');
};

const main = () => {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const evidence = collectEvidence();
  const summary = formatSummary({ evidence });
  const errors = getSecureStorageReleaseValidationSummaryErrors(summary);

  if (errors.length > 0) {
    console.error('Secure-storage release validation summary is invalid:');
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
  console.log(`Secure-storage release validation summary written to ${path.relative(root, outputPath)}`);
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
