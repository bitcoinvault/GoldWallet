import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { collectCodePushReleasePathAudit } from './auditCodePushReleasePath.mjs';
import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-migration-readiness-summary.txt');
const releasePathSummaryPath = path.join(root, 'local-docs', 'codepush-release-path-summary.txt');
const decisionDocPath = path.join(root, 'docs', 'codepush-retirement-migration-plan.md');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const collectCodePushMigrationReadinessAudit = () => {
  const releasePathAudit = collectCodePushReleasePathAudit();
  const decisionDocumentPresent = existsSync(decisionDocPath);
  const decisionDocument = decisionDocumentPresent ? read('docs/codepush-retirement-migration-plan.md') : '';
  let releasePathSummaryValid = false;
  let releasePathSummaryErrors = ['missing CodePush release path summary'];

  if (existsSync(releasePathSummaryPath)) {
    releasePathSummaryErrors = getCodePushReleasePathSummaryErrors(readFileSync(releasePathSummaryPath, 'utf8'));
    releasePathSummaryValid = releasePathSummaryErrors.length === 0;
  }

  return {
    packageCurrent: releasePathAudit.packageCurrent,
    appCenterRetirementDate: releasePathAudit.appCenterRetirementDate,
    upstreamArchived: releasePathAudit.upstreamArchived,
    upstreamNewArchitectureSupported: releasePathAudit.upstreamNewArchitectureSupported,
    androidNewArchitectureEnabled: releasePathAudit.androidNewArchitectureEnabled,
    runtimeGatedOffByDefault: releasePathAudit.runtimeGatePresent && releasePathAudit.nativeBundleGatePresent && !releasePathAudit.runtimeDefaultEnabled,
    updateValidation: 'not claimed',
    migrationRequired: releasePathAudit.migrationRequired,
    currentPosture: 'temporary legacy compatibility',
    longTermOptions: 'remove or replace',
    decisionDocumentPresent,
    decisionDocumentCoversRemoval: decisionDocument.includes('If removing CodePush:'),
    decisionDocumentCoversReplacement: decisionDocument.includes('If replacing CodePush:'),
    decisionDocumentRejectsBlindPackageUpgrade: decisionDocument.includes('Do not plan another blind CodePush package upgrade'),
    releasePathSummaryValid,
    releasePathSummaryErrors,
  };
};

export const formatCodePushMigrationReadinessSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'CodePush migration readiness audit',
    `Generated at: ${generatedAt}`,
    `CodePush package current: ${audit.packageCurrent ? 'yes' : 'no'}`,
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
    'Secret values printed: no',
    'Required action: choose remove or replace before treating OTA updates as a supported release capability.',
  ];

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('CodePush migration readiness audit');
  console.log(`CodePush package current: ${audit.packageCurrent ? 'yes' : 'no'}`);
  console.log(`App Center CodePush retirement date: ${audit.appCenterRetirementDate}`);
  console.log(`CodePush upstream archived: ${audit.upstreamArchived ? 'yes' : 'no'}`);
  console.log(`CodePush upstream New Architecture support: ${audit.upstreamNewArchitectureSupported ? 'yes' : 'no'}`);
  console.log(`Android New Architecture enabled: ${audit.androidNewArchitectureEnabled ? 'yes' : 'no'}`);
  console.log(`CodePush runtime gated off by default: ${audit.runtimeGatedOffByDefault ? 'yes' : 'no'}`);
  console.log(`CodePush migration required: ${audit.migrationRequired ? 'yes' : 'no'}`);
  console.log(`Current posture: ${audit.currentPosture}`);
  console.log(`Long-term options: ${audit.longTermOptions}`);
  console.log(`Release path summary valid: ${audit.releasePathSummaryValid ? 'yes' : 'no'}`);
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
