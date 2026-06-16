import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { collectCodePushReleasePathAudit } from './auditCodePushReleasePath.mjs';
import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-migration-readiness-summary.txt');
const releasePathSummaryPath = path.join(root, 'local-docs', 'codepush-release-path-summary.txt');
const decisionDocPath = path.join(root, 'docs', 'codepush-retirement-migration-plan.md');
const androidReleaseSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-summary.txt');
const androidReleaseCreateWalletSmokeSummaryPath = path.join(root, 'local-docs', 'android-create-wallet-smoke-dev-release-summary.txt');
const signedReleaseApkPath = path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk');
const unsignedReleaseApkPath = path.join(
  root,
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'dev',
  'release',
  'app-dev-release-unsigned.apk',
);

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const collectCodePushMigrationReadinessAudit = () => {
  const releasePathAudit = collectCodePushReleasePathAudit();
  const decisionDocumentPresent = existsSync(decisionDocPath);
  const decisionDocument = decisionDocumentPresent ? read('docs/codepush-retirement-migration-plan.md') : '';
  let releasePathSummaryValid = false;
  let releasePathSummaryErrors = ['missing CodePush release path summary'];
  let androidReleaseSmokeSummaryValid = false;
  let androidReleaseSmokeSummaryErrors = ['missing Android release smoke summary'];
  let androidReleaseCreateWalletSmokeSummaryValid = false;
  let androidReleaseCreateWalletSmokeSummaryErrors = ['missing Android release create-wallet smoke summary'];

  if (existsSync(releasePathSummaryPath)) {
    releasePathSummaryErrors = getCodePushReleasePathSummaryErrors(readFileSync(releasePathSummaryPath, 'utf8'));
    releasePathSummaryValid = releasePathSummaryErrors.length === 0;
  }

  if (existsSync(androidReleaseSmokeSummaryPath)) {
    androidReleaseSmokeSummaryErrors = getAndroidEmbeddedSmokeSummaryErrors(readFileSync(androidReleaseSmokeSummaryPath, 'utf8'), {
      expectedArtifactBase: 'android-smoke-dev-release',
      requireSmokeApkDigest: true,
      expectedSmokeApkPath: signedReleaseApkPath,
      requireSourceApkDigest: true,
      expectedSourceApkPath: unsignedReleaseApkPath,
    });
    androidReleaseSmokeSummaryValid = androidReleaseSmokeSummaryErrors.length === 0;
  }

  if (existsSync(androidReleaseCreateWalletSmokeSummaryPath)) {
    androidReleaseCreateWalletSmokeSummaryErrors = getAndroidCreateWalletSmokeSummaryErrors(
      readFileSync(androidReleaseCreateWalletSmokeSummaryPath, 'utf8'),
      {
        expectedApkPath: signedReleaseApkPath,
        expectedArtifactBase: 'android-create-wallet-smoke-dev-release',
      },
    );
    androidReleaseCreateWalletSmokeSummaryValid = androidReleaseCreateWalletSmokeSummaryErrors.length === 0;
  }

  return {
    packageCurrent: releasePathAudit.packageCurrent,
    packageLatestVersion: releasePathAudit.packageLatestVersion,
    packageLatestPublishedAt: releasePathAudit.packageLatestPublishedAt,
    packageRepositoryUrl: releasePathAudit.packageRepositoryUrl,
    codePushUpstreamRepository: releasePathAudit.codePushUpstreamRepository,
    appCenterRetirementDate: releasePathAudit.appCenterRetirementDate,
    upstreamArchived: releasePathAudit.upstreamArchived,
    upstreamNewArchitectureSupported: releasePathAudit.upstreamNewArchitectureSupported,
    androidNewArchitectureEnabled: releasePathAudit.androidNewArchitectureEnabled,
    runtimeGatedOffByDefault: releasePathAudit.runtimeGatePresent && releasePathAudit.nativeBundleGatePresent && !releasePathAudit.runtimeDefaultEnabled,
    updateValidation: 'not claimed',
    migrationRequired: releasePathAudit.migrationRequired,
    currentPosture: releasePathAudit.codePushRemoved ? 'removed' : 'temporary legacy compatibility',
    longTermOptions: releasePathAudit.codePushRemoved ? 'removed' : 'remove or replace',
    decisionDocumentPresent,
    decisionDocumentCoversRemoval: decisionDocument.includes('If removing CodePush:'),
    decisionDocumentCoversReplacement: decisionDocument.includes('If replacing CodePush:'),
    decisionDocumentRejectsBlindPackageUpgrade: decisionDocument.includes('Do not plan another blind CodePush package upgrade'),
    releasePathSummaryValid,
    releasePathSummaryErrors,
    releaseBuildEvidenceReady: releasePathAudit.releaseBuildEvidenceReady,
    androidReleaseSmokeSummaryValid,
    androidReleaseSmokeSummaryErrors,
    releaseSmokeEvidenceReady: androidReleaseSmokeSummaryValid,
    androidReleaseCreateWalletSmokeSummaryValid,
    androidReleaseCreateWalletSmokeSummaryErrors,
    releaseCreateWalletEvidenceReady: androidReleaseCreateWalletSmokeSummaryValid,
    readyEnvironmentCount: releasePathAudit.envReadiness.filter(entry => entry.status === 'ready').length,
    blockedEnvironmentCount: releasePathAudit.envReadiness.filter(entry => entry.status === 'blocked').length,
    unconfirmedEnvironmentCount: releasePathAudit.envReadiness.filter(entry => entry.status === 'unconfirmed').length,
    betaStrategyConfirmed: releasePathAudit.codePushRemoved || releasePathAudit.envReadiness
      .filter(entry => entry.envFile.startsWith('.env.beta.'))
      .every(entry => entry.status === 'ready'),
    codePushRemoved: releasePathAudit.codePushRemoved,
  };
};

export const formatCodePushMigrationReadinessSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'CodePush migration readiness audit',
    `Generated at: ${generatedAt}`,
    `CodePush package current: ${audit.packageCurrent ? 'yes' : 'no'}`,
    `CodePush removed: ${audit.codePushRemoved ? 'yes' : 'no'}`,
    `CodePush package latest version: ${audit.packageLatestVersion || 'missing'}`,
    `CodePush package latest published at: ${audit.packageLatestPublishedAt || 'missing'}`,
    `CodePush npm repository: ${audit.packageRepositoryUrl || 'missing'}`,
    `CodePush upstream repository: ${audit.codePushUpstreamRepository || 'missing'}`,
    `App Center CodePush retirement date: ${audit.appCenterRetirementDate}`,
    `CodePush upstream archived: ${audit.upstreamArchived ? 'yes' : 'no'}`,
    `CodePush upstream New Architecture support: ${audit.upstreamNewArchitectureSupported ? 'yes' : 'no'}`,
    `Android New Architecture enabled: ${audit.androidNewArchitectureEnabled ? 'yes' : 'no'}`,
    `CodePush runtime gated off by default: ${audit.runtimeGatedOffByDefault ? 'yes' : 'no'}`,
    `CodePush update validation: ${audit.updateValidation}`,
    `CodePush migration required: ${audit.migrationRequired ? 'yes' : 'no'}`,
    `Current posture: ${audit.currentPosture}`,
    `Long-term options: ${audit.longTermOptions}`,
    `Decision document present: ${audit.decisionDocumentPresent ? 'yes' : 'no'}`,
    `Decision document covers removal: ${audit.decisionDocumentCoversRemoval ? 'yes' : 'no'}`,
    `Decision document covers replacement: ${audit.decisionDocumentCoversReplacement ? 'yes' : 'no'}`,
    `Decision document rejects blind package upgrade: ${audit.decisionDocumentRejectsBlindPackageUpgrade ? 'yes' : 'no'}`,
    `Release path summary valid: ${audit.releasePathSummaryValid ? 'yes' : 'no'}`,
    `Release path summary errors: ${audit.releasePathSummaryErrors.length}`,
    ...audit.releasePathSummaryErrors.map(error => `- ${error}`),
    `CodePush release build evidence ready: ${audit.releaseBuildEvidenceReady ? 'yes' : 'no'}`,
    `Android release smoke summary valid: ${audit.androidReleaseSmokeSummaryValid ? 'yes' : 'no'}`,
    `Android release smoke summary errors: ${audit.androidReleaseSmokeSummaryErrors.length}`,
    ...audit.androidReleaseSmokeSummaryErrors.map(error => `- ${error}`),
    `CodePush release smoke evidence ready: ${audit.releaseSmokeEvidenceReady ? 'yes' : 'no'}`,
    `Android release create-wallet smoke summary valid: ${audit.androidReleaseCreateWalletSmokeSummaryValid ? 'yes' : 'no'}`,
    `Android release create-wallet smoke summary errors: ${audit.androidReleaseCreateWalletSmokeSummaryErrors.length}`,
    ...audit.androidReleaseCreateWalletSmokeSummaryErrors.map(error => `- ${error}`),
    `CodePush release create-wallet evidence ready: ${audit.releaseCreateWalletEvidenceReady ? 'yes' : 'no'}`,
    `Ready CodePush environments: ${audit.readyEnvironmentCount}`,
    `Blocked CodePush environments: ${audit.blockedEnvironmentCount}`,
    `Unconfirmed CodePush environments: ${audit.unconfirmedEnvironmentCount}`,
    `Beta CodePush strategy confirmed: ${audit.betaStrategyConfirmed ? 'yes' : 'no'}`,
    'Secret values printed: no',
    audit.codePushRemoved
      ? 'Required action: keep CodePush removed; do not claim OTA update validation, and clean stale env keys only without exposing values.'
      : 'Required action: choose remove or replace before treating OTA updates as a supported release capability.',
  ];

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('CodePush migration readiness audit');
  console.log(`CodePush package current: ${audit.packageCurrent ? 'yes' : 'no'}`);
  console.log(`CodePush removed: ${audit.codePushRemoved ? 'yes' : 'no'}`);
  console.log(`CodePush package latest version: ${audit.packageLatestVersion || 'missing'}`);
  console.log(`CodePush package latest published at: ${audit.packageLatestPublishedAt || 'missing'}`);
  console.log(`CodePush npm repository: ${audit.packageRepositoryUrl || 'missing'}`);
  console.log(`CodePush upstream repository: ${audit.codePushUpstreamRepository || 'missing'}`);
  console.log(`App Center CodePush retirement date: ${audit.appCenterRetirementDate}`);
  console.log(`CodePush upstream archived: ${audit.upstreamArchived ? 'yes' : 'no'}`);
  console.log(`CodePush upstream New Architecture support: ${audit.upstreamNewArchitectureSupported ? 'yes' : 'no'}`);
  console.log(`Android New Architecture enabled: ${audit.androidNewArchitectureEnabled ? 'yes' : 'no'}`);
  console.log(`CodePush runtime gated off by default: ${audit.runtimeGatedOffByDefault ? 'yes' : 'no'}`);
  console.log(`CodePush migration required: ${audit.migrationRequired ? 'yes' : 'no'}`);
  console.log(`Current posture: ${audit.currentPosture}`);
  console.log(`Long-term options: ${audit.longTermOptions}`);
  console.log(`Release path summary valid: ${audit.releasePathSummaryValid ? 'yes' : 'no'}`);
  console.log(`CodePush release build evidence ready: ${audit.releaseBuildEvidenceReady ? 'yes' : 'no'}`);
  console.log(`CodePush release smoke evidence ready: ${audit.releaseSmokeEvidenceReady ? 'yes' : 'no'}`);
  console.log(`CodePush release create-wallet evidence ready: ${audit.releaseCreateWalletEvidenceReady ? 'yes' : 'no'}`);
  console.log(`Ready CodePush environments: ${audit.readyEnvironmentCount}`);
  console.log(`Blocked CodePush environments: ${audit.blockedEnvironmentCount}`);
  console.log(`Unconfirmed CodePush environments: ${audit.unconfirmedEnvironmentCount}`);
  console.log(`Beta CodePush strategy confirmed: ${audit.betaStrategyConfirmed ? 'yes' : 'no'}`);
  console.log('CodePush update validation: not claimed');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectCodePushMigrationReadinessAudit();
  const summary = formatCodePushMigrationReadinessSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`CodePush migration readiness summary written to ${path.relative(root, summaryPath)}`);
}
