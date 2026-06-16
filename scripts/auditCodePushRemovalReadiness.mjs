import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  expectedCodePushNativeUsageFiles,
  expectedCodePushRuntimeUsageFiles,
} from './codePushUsageGuard.mjs';
import { codePushEnvFiles, codePushIosInfoPlists, collectCodePushReleasePathAudit } from './auditCodePushReleasePath.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';
import { getCodePushDecisionHandoffErrors } from './codePushDecisionHandoffGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-removal-readiness-summary.txt');
const androidReleaseSmokeSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-release-summary.txt');
const androidReleaseCreateWalletSmokeSummaryPath = path.join(root, 'local-docs', 'android-create-wallet-smoke-dev-release-summary.txt');
const decisionHandoffPath = path.join(root, 'local-docs', 'codepush-decision-handoff.txt');
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

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const collectDecisionHandoff = () => {
  if (!existsSync(decisionHandoffPath)) {
    return {
      present: false,
      valid: false,
      decision: 'missing',
      betaStrategy: 'missing',
      errors: ['missing CodePush decision handoff'],
    };
  }

  const content = readFileSync(decisionHandoffPath, 'utf8');
  const errors = getCodePushDecisionHandoffErrors(content);

  return {
    present: true,
    valid: errors.length === 0,
    decision: getLineValue(content, 'Decision') || 'missing',
    betaStrategy: getLineValue(content, 'Beta deployment-key strategy') || 'missing',
    errors,
  };
};

export const collectCodePushRemovalReadinessAudit = () => {
  const packageJson = JSON.parse(read('package.json'));
  const releasePathAudit = collectCodePushReleasePathAudit();
  const decisionHandoff = collectDecisionHandoff();
  let androidReleaseSmokeSummaryValid = false;
  let androidReleaseSmokeSummaryErrors = ['missing Android release smoke summary'];
  let androidReleaseCreateWalletSmokeSummaryValid = false;
  let androidReleaseCreateWalletSmokeSummaryErrors = ['missing Android release create-wallet smoke summary'];
  const packageInstalled = Boolean(packageJson.dependencies?.['react-native-code-push'] || packageJson.devDependencies?.['react-native-code-push']);
  const envFilesCarryingCodePushKeys = codePushEnvFiles.filter(relativePath => {
    if (!existsSync(path.join(root, relativePath))) {
      return false;
    }

    const content = read(relativePath);
    return /CODEPUSH_ENABLED|CODEPUSH_DEPLOYMENT_KEY_ANDROID|CODEPUSH_DEPLOYMENT_KEY_IOS/.test(content);
  });
  const iosPlistPlaceholders = codePushIosInfoPlists.filter(relativePath =>
    existsSync(path.join(root, relativePath)) && read(relativePath).includes('CodePushDeploymentKey'),
  );

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

  const removalDecisionAvailable = decisionHandoff.valid && decisionHandoff.decision === 'remove';
  const replacementDecisionAvailable = decisionHandoff.valid && decisionHandoff.decision === 'replace';
  const safeToRemoveNow =
    !releasePathAudit.codePushRemoved &&
    removalDecisionAvailable &&
    releasePathAudit.releaseBuildEvidenceReady &&
    androidReleaseSmokeSummaryValid &&
    androidReleaseCreateWalletSmokeSummaryValid &&
    releasePathAudit.migrationRequired &&
    releasePathAudit.runtimeGatePresent &&
    releasePathAudit.nativeBundleGatePresent;

  return {
    packageInstalled,
    codePushRemoved: releasePathAudit.codePushRemoved,
    packageLatestVersion: releasePathAudit.packageLatestVersion,
    packageLatestPublishedAt: releasePathAudit.packageLatestPublishedAt,
    packageRepositoryUrl: releasePathAudit.packageRepositoryUrl,
    codePushUpstreamRepository: releasePathAudit.codePushUpstreamRepository,
    codePushUpstreamArchivedDate: releasePathAudit.codePushUpstreamArchivedDate,
    upstreamArchived: releasePathAudit.upstreamArchived,
    upstreamNewArchitectureSupported: releasePathAudit.upstreamNewArchitectureSupported,
    codePushNewArchitectureUnsupportedReactNativeRange: releasePathAudit.codePushNewArchitectureUnsupportedReactNativeRange,
    androidNewArchitectureEnabled: releasePathAudit.androidNewArchitectureEnabled,
    migrationRequired: releasePathAudit.migrationRequired,
    releaseBuildEvidenceReady: releasePathAudit.releaseBuildEvidenceReady,
    androidReleaseSmokeSummaryValid,
    androidReleaseSmokeSummaryErrors,
    releaseSmokeEvidenceReady: androidReleaseSmokeSummaryValid,
    androidReleaseCreateWalletSmokeSummaryValid,
    androidReleaseCreateWalletSmokeSummaryErrors,
    releaseCreateWalletEvidenceReady: androidReleaseCreateWalletSmokeSummaryValid,
    runtimeUsageFiles: [...expectedCodePushRuntimeUsageFiles],
    nativeIntegrationFiles: [...expectedCodePushNativeUsageFiles],
    envFilesCarryingCodePushKeys,
    iosPlistPlaceholders,
    androidNativeIntegrationPresent:
      releasePathAudit.nativeBundleGatePresent &&
      releasePathAudit.errors.every(error => !error.includes('MainApplication.java') && !error.includes('android/app/build.gradle')),
    iosNativeIntegrationPresent:
      releasePathAudit.nativeBundleGatePresent &&
      releasePathAudit.errors.every(error => !error.includes('ios/GoldWallet/AppDelegate.m')),
    runtimeGatedOffByDefault: releasePathAudit.runtimeGatePresent && releasePathAudit.nativeBundleGatePresent && !releasePathAudit.runtimeDefaultEnabled,
    decisionHandoffPresent: decisionHandoff.present,
    decisionHandoffValid: decisionHandoff.valid,
    decision: decisionHandoff.decision,
    betaStrategy: decisionHandoff.betaStrategy,
    decisionHandoffErrors: decisionHandoff.errors,
    removalDecisionAvailable,
    replacementDecisionAvailable,
    safeToRemoveNow,
  };
};

export const formatCodePushRemovalReadinessSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'CodePush removal readiness audit',
    `Generated at: ${generatedAt}`,
    `CodePush package installed: ${audit.packageInstalled ? 'yes' : 'no'}`,
    `CodePush removed: ${audit.codePushRemoved ? 'yes' : 'no'}`,
    `CodePush package latest version: ${audit.packageLatestVersion || 'missing'}`,
    `CodePush package latest published at: ${audit.packageLatestPublishedAt || 'missing'}`,
    `CodePush npm repository: ${audit.packageRepositoryUrl || 'missing'}`,
    `CodePush upstream repository: ${audit.codePushUpstreamRepository || 'missing'}`,
    `CodePush upstream archived: ${audit.upstreamArchived ? 'yes' : 'no'}`,
    `CodePush upstream archived date: ${audit.codePushUpstreamArchivedDate}`,
    `CodePush upstream New Architecture support: ${audit.upstreamNewArchitectureSupported ? 'yes' : 'no'}`,
    `CodePush upstream New Architecture unsupported RN range: ${audit.codePushNewArchitectureUnsupportedReactNativeRange}`,
    `Android New Architecture enabled: ${audit.androidNewArchitectureEnabled ? 'yes' : 'no'}`,
    `CodePush migration required: ${audit.migrationRequired ? 'yes' : 'no'}`,
    `CodePush release build evidence ready: ${audit.releaseBuildEvidenceReady ? 'yes' : 'no'}`,
    `Android release smoke summary valid: ${audit.androidReleaseSmokeSummaryValid ? 'yes' : 'no'}`,
    `Android release smoke summary errors: ${audit.androidReleaseSmokeSummaryErrors.length}`,
    ...audit.androidReleaseSmokeSummaryErrors.map(error => `- ${error}`),
    `CodePush release smoke evidence ready: ${audit.releaseSmokeEvidenceReady ? 'yes' : 'no'}`,
    `Android release create-wallet smoke summary valid: ${audit.androidReleaseCreateWalletSmokeSummaryValid ? 'yes' : 'no'}`,
    `Android release create-wallet smoke summary errors: ${audit.androidReleaseCreateWalletSmokeSummaryErrors.length}`,
    ...audit.androidReleaseCreateWalletSmokeSummaryErrors.map(error => `- ${error}`),
    `CodePush release create-wallet evidence ready: ${audit.releaseCreateWalletEvidenceReady ? 'yes' : 'no'}`,
    `Runtime usage files: ${audit.runtimeUsageFiles.length}`,
    ...audit.runtimeUsageFiles.map(filePath => `- ${filePath}`),
    `Native integration files: ${audit.nativeIntegrationFiles.length}`,
    ...audit.nativeIntegrationFiles.map(filePath => `- ${filePath}`),
    `Env files carrying CodePush keys: ${audit.envFilesCarryingCodePushKeys.length}`,
    ...audit.envFilesCarryingCodePushKeys.map(filePath => `- ${filePath}`),
    `iOS plist placeholders: ${audit.iosPlistPlaceholders.length}`,
    `Android native integration present: ${audit.androidNativeIntegrationPresent ? 'yes' : 'no'}`,
    `iOS native integration present: ${audit.iosNativeIntegrationPresent ? 'yes' : 'no'}`,
    `CodePush runtime gated off by default: ${audit.runtimeGatedOffByDefault ? 'yes' : 'no'}`,
    `Decision handoff present: ${audit.decisionHandoffPresent ? 'yes' : 'no'}`,
    `Decision handoff valid: ${audit.decisionHandoffValid ? 'yes' : 'no'}`,
    `Decision: ${audit.decision}`,
    `Beta deployment-key strategy: ${audit.betaStrategy}`,
    `Decision handoff errors: ${audit.decisionHandoffErrors.length}`,
    ...audit.decisionHandoffErrors.map(error => `- ${error}`),
    `Removal decision available: ${audit.removalDecisionAvailable ? 'yes' : 'no'}`,
    `Replacement decision available: ${audit.replacementDecisionAvailable ? 'yes' : 'no'}`,
    `Safe to remove now: ${audit.safeToRemoveNow ? 'yes' : 'no'}`,
    'Secret values printed: no',
    audit.codePushRemoved
      ? 'Required action: keep CodePush removed; do not claim OTA update validation, and clean stale env keys only without exposing values.'
      : audit.safeToRemoveNow
      ? 'Required action: start the CodePush removal implementation branch; do not claim OTA update validation, and leave iOS runtime/archive validation unclaimed unless it runs on macOS/Xcode.'
      : 'Required action: choose remove or replace before deleting CodePush runtime, native integration, plist placeholders, and env keys.',
  ];

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('CodePush removal readiness audit');
  console.log(`CodePush package installed: ${audit.packageInstalled ? 'yes' : 'no'}`);
  console.log(`CodePush removed: ${audit.codePushRemoved ? 'yes' : 'no'}`);
  console.log(`CodePush package latest version: ${audit.packageLatestVersion || 'missing'}`);
  console.log(`CodePush package latest published at: ${audit.packageLatestPublishedAt || 'missing'}`);
  console.log(`CodePush npm repository: ${audit.packageRepositoryUrl || 'missing'}`);
  console.log(`CodePush upstream repository: ${audit.codePushUpstreamRepository || 'missing'}`);
  console.log(`CodePush upstream archived: ${audit.upstreamArchived ? 'yes' : 'no'}`);
  console.log(`CodePush upstream archived date: ${audit.codePushUpstreamArchivedDate}`);
  console.log(`CodePush upstream New Architecture support: ${audit.upstreamNewArchitectureSupported ? 'yes' : 'no'}`);
  console.log(`CodePush upstream New Architecture unsupported RN range: ${audit.codePushNewArchitectureUnsupportedReactNativeRange}`);
  console.log(`Android New Architecture enabled: ${audit.androidNewArchitectureEnabled ? 'yes' : 'no'}`);
  console.log(`CodePush migration required: ${audit.migrationRequired ? 'yes' : 'no'}`);
  console.log(`CodePush release build evidence ready: ${audit.releaseBuildEvidenceReady ? 'yes' : 'no'}`);
  console.log(`CodePush release smoke evidence ready: ${audit.releaseSmokeEvidenceReady ? 'yes' : 'no'}`);
  console.log(`CodePush release create-wallet evidence ready: ${audit.releaseCreateWalletEvidenceReady ? 'yes' : 'no'}`);
  console.log(`Runtime usage files: ${audit.runtimeUsageFiles.length}`);
  console.log(`Native integration files: ${audit.nativeIntegrationFiles.length}`);
  console.log(`Env files carrying CodePush keys: ${audit.envFilesCarryingCodePushKeys.length}`);
  console.log(`iOS plist placeholders: ${audit.iosPlistPlaceholders.length}`);
  console.log(`CodePush runtime gated off by default: ${audit.runtimeGatedOffByDefault ? 'yes' : 'no'}`);
  console.log(`Decision handoff valid: ${audit.decisionHandoffValid ? 'yes' : 'no'}`);
  console.log(`Decision: ${audit.decision}`);
  console.log(`Safe to remove now: ${audit.safeToRemoveNow ? 'yes' : 'no'}`);
  console.log(
    audit.codePushRemoved
      ? 'Required action: keep CodePush removed.'
      : audit.safeToRemoveNow
      ? 'Required action: start the CodePush removal implementation branch.'
      : 'Required action: choose remove or replace before deleting CodePush integration.',
  );
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectCodePushRemovalReadinessAudit();
  const summary = formatCodePushRemovalReadinessSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`CodePush removal readiness summary written to ${path.relative(root, summaryPath)}`);
}
