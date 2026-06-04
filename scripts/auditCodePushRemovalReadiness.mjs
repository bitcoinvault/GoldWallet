import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  expectedCodePushNativeUsageFiles,
  expectedCodePushRuntimeUsageFiles,
} from './codePushUsageGuard.mjs';
import { codePushEnvFiles, codePushIosInfoPlists, collectCodePushReleasePathAudit } from './auditCodePushReleasePath.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-removal-readiness-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const collectCodePushRemovalReadinessAudit = () => {
  const packageJson = JSON.parse(read('package.json'));
  const releasePathAudit = collectCodePushReleasePathAudit();
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

  return {
    packageInstalled,
    packageLatestVersion: releasePathAudit.packageLatestVersion,
    packageLatestPublishedAt: releasePathAudit.packageLatestPublishedAt,
    packageRepositoryUrl: releasePathAudit.packageRepositoryUrl,
    codePushUpstreamRepository: releasePathAudit.codePushUpstreamRepository,
    upstreamArchived: releasePathAudit.upstreamArchived,
    upstreamNewArchitectureSupported: releasePathAudit.upstreamNewArchitectureSupported,
    androidNewArchitectureEnabled: releasePathAudit.androidNewArchitectureEnabled,
    migrationRequired: releasePathAudit.migrationRequired,
    releaseBuildEvidenceReady: releasePathAudit.releaseBuildEvidenceReady,
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
    removalDecisionAvailable: false,
    replacementDecisionAvailable: false,
    safeToRemoveNow: false,
  };
};

export const formatCodePushRemovalReadinessSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'CodePush removal readiness audit',
    `Generated at: ${generatedAt}`,
    `CodePush package installed: ${audit.packageInstalled ? 'yes' : 'no'}`,
    `CodePush package latest version: ${audit.packageLatestVersion || 'missing'}`,
    `CodePush package latest published at: ${audit.packageLatestPublishedAt || 'missing'}`,
    `CodePush npm repository: ${audit.packageRepositoryUrl || 'missing'}`,
    `CodePush upstream repository: ${audit.codePushUpstreamRepository || 'missing'}`,
    `CodePush upstream archived: ${audit.upstreamArchived ? 'yes' : 'no'}`,
    `CodePush upstream New Architecture support: ${audit.upstreamNewArchitectureSupported ? 'yes' : 'no'}`,
    `Android New Architecture enabled: ${audit.androidNewArchitectureEnabled ? 'yes' : 'no'}`,
    `CodePush migration required: ${audit.migrationRequired ? 'yes' : 'no'}`,
    `CodePush release build evidence ready: ${audit.releaseBuildEvidenceReady ? 'yes' : 'no'}`,
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
    `Removal decision available: ${audit.removalDecisionAvailable ? 'yes' : 'no'}`,
    `Replacement decision available: ${audit.replacementDecisionAvailable ? 'yes' : 'no'}`,
    `Safe to remove now: ${audit.safeToRemoveNow ? 'yes' : 'no'}`,
    'Secret values printed: no',
    'Required action: choose remove or replace before deleting CodePush runtime, native integration, plist placeholders, and env keys.',
  ];

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('CodePush removal readiness audit');
  console.log(`CodePush package installed: ${audit.packageInstalled ? 'yes' : 'no'}`);
  console.log(`CodePush package latest version: ${audit.packageLatestVersion || 'missing'}`);
  console.log(`CodePush package latest published at: ${audit.packageLatestPublishedAt || 'missing'}`);
  console.log(`CodePush npm repository: ${audit.packageRepositoryUrl || 'missing'}`);
  console.log(`CodePush upstream repository: ${audit.codePushUpstreamRepository || 'missing'}`);
  console.log(`CodePush upstream archived: ${audit.upstreamArchived ? 'yes' : 'no'}`);
  console.log(`CodePush upstream New Architecture support: ${audit.upstreamNewArchitectureSupported ? 'yes' : 'no'}`);
  console.log(`Android New Architecture enabled: ${audit.androidNewArchitectureEnabled ? 'yes' : 'no'}`);
  console.log(`CodePush migration required: ${audit.migrationRequired ? 'yes' : 'no'}`);
  console.log(`CodePush release build evidence ready: ${audit.releaseBuildEvidenceReady ? 'yes' : 'no'}`);
  console.log(`Runtime usage files: ${audit.runtimeUsageFiles.length}`);
  console.log(`Native integration files: ${audit.nativeIntegrationFiles.length}`);
  console.log(`Env files carrying CodePush keys: ${audit.envFilesCarryingCodePushKeys.length}`);
  console.log(`iOS plist placeholders: ${audit.iosPlistPlaceholders.length}`);
  console.log(`CodePush runtime gated off by default: ${audit.runtimeGatedOffByDefault ? 'yes' : 'no'}`);
  console.log(`Safe to remove now: ${audit.safeToRemoveNow ? 'yes' : 'no'}`);
  console.log('Required action: choose remove or replace before deleting CodePush integration.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectCodePushRemovalReadinessAudit();
  const summary = formatCodePushRemovalReadinessSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`CodePush removal readiness summary written to ${path.relative(root, summaryPath)}`);
}
