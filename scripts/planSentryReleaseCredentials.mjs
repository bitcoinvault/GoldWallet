import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { collectSentryReleasePrerequisites } from './auditSentryReleasePrerequisites.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'local-docs', 'sentry-release-credential-plan.txt');

const formatInvalidFile = file => {
  const issues = [];

  if (file.missingKeys.length > 0) {
    issues.push(`missing keys: ${file.missingKeys.join(', ')}`);
  }

  if (file.invalidStaticKeys.length > 0) {
    issues.push(`unexpected static keys: ${file.invalidStaticKeys.join(', ')}`);
  }

  if (file.hasBlankToken) {
    issues.push('blank auth.token');
  }

  return `- invalid file: ${file.relativePath} (${issues.join('; ')})`;
};

export const formatSentryReleaseCredentialPlan = (audit, generatedAt = new Date().toISOString()) => [
  'Sentry release credential plan',
  `Generated at: ${generatedAt}`,
  `@sentry/react-native version: ${audit.sentryReactNativeVersion}`,
  `@sentry/react-native latest: ${audit.sentryReactNativeLatest}`,
  `@sentry/react-native current: ${audit.sentryReactNativeCurrent ? 'yes' : 'no'}`,
  `@sentry/cli package version: ${audit.sentryCliPackageVersion}`,
  `@sentry/cli latest: ${audit.sentryCliLatest}`,
  `@sentry/cli current: ${audit.sentryCliCurrent ? 'yes' : 'no'}`,
  `Release source-map prerequisites: ${audit.ready ? 'ready' : 'not ready'}`,
  `SENTRY_AUTH_TOKEN available in current shell: ${audit.envHasToken ? 'yes' : 'no'}`,
  'Properties file readiness:',
  ...audit.propertiesFileReadiness.map(file => `- ${file.relativePath}: ${file.status}`),
  `Missing properties files: ${audit.missingFiles.length}`,
  ...audit.missingFiles.map(relativePath => `- missing file: ${relativePath}`),
  `Invalid properties files: ${audit.invalidFiles.length}`,
  ...audit.invalidFiles.map(formatInvalidFile),
  `Android release summary present: ${audit.hasAndroidReleaseSummary ? 'yes' : 'no'}`,
  `Android release summary variants: ${audit.androidReleaseSummaryVariants.join(', ') || 'none'}`,
  `Android release summary required variants covered: ${audit.androidReleaseSummaryRequiredVariantsCovered ? 'yes' : 'no'}`,
  `Android release summary current inputs covered: ${audit.androidReleaseSummaryCurrentInputsCovered ? 'yes' : 'no'}`,
  `Android release summary errors: ${audit.androidReleaseSummaryErrors.length}`,
  ...audit.androidReleaseSummaryErrors.map(error => `- ${error}`),
  `Android release APK manifest valid: ${audit.androidReleaseApkManifestErrors.length === 0 ? 'yes' : 'no'}`,
  `Android release APK manifest errors: ${audit.androidReleaseApkManifestErrors.length}`,
  ...audit.androidReleaseApkManifestErrors.map(error => `- ${error}`),
  `Android release evidence ready: ${audit.androidReleaseEvidenceReady ? 'yes' : 'no'}`,
  `Android release smoke summary present: ${audit.hasAndroidReleaseSmokeSummary ? 'yes' : 'no'}`,
  `Android release smoke summary valid: ${audit.androidReleaseSmokeSummaryErrors.length === 0 ? 'yes' : 'no'}`,
  `Android release smoke summary errors: ${audit.androidReleaseSmokeSummaryErrors.length}`,
  ...audit.androidReleaseSmokeSummaryErrors.map(error => `- ${error}`),
  `Android release smoke evidence ready: ${audit.androidReleaseSmokeEvidenceReady ? 'yes' : 'no'}`,
  `Android release no-network smoke summary present: ${audit.hasAndroidReleaseNoNetworkSmokeSummary ? 'yes' : 'no'}`,
  `Android release no-network smoke summary valid: ${audit.androidReleaseNoNetworkSmokeSummaryErrors.length === 0 ? 'yes' : 'no'}`,
  `Android release no-network smoke summary errors: ${audit.androidReleaseNoNetworkSmokeSummaryErrors.length}`,
  ...audit.androidReleaseNoNetworkSmokeSummaryErrors.map(error => `- ${error}`),
  `Sentry release no-network blocker evidence ready: ${audit.androidReleaseNoNetworkSmokeEvidenceReady ? 'yes' : 'no'}`,
  `Android release network blocker summary present: ${audit.hasAndroidReleaseNetworkBlockerSummary ? 'yes' : 'no'}`,
  `Android release network blocker summary valid: ${audit.androidReleaseNetworkBlockerSummaryErrors.length === 0 ? 'yes' : 'no'}`,
  `Android release network blocker outcome: ${audit.androidReleaseNetworkBlockerOutcome}`,
  `Android release network blocker summary errors: ${audit.androidReleaseNetworkBlockerSummaryErrors.length}`,
  ...audit.androidReleaseNetworkBlockerSummaryErrors.map(error => `- ${error}`),
  `Sentry release network blocker classified: ${audit.androidReleaseNetworkBlockerEvidenceReady ? 'yes' : 'no'}`,
  `Android release create-wallet smoke summary present: ${audit.hasAndroidReleaseCreateWalletSmokeSummary ? 'yes' : 'no'}`,
  `Android release create-wallet smoke summary valid: ${audit.androidReleaseCreateWalletSmokeSummaryErrors.length === 0 ? 'yes' : 'no'}`,
  `Android release create-wallet smoke summary errors: ${audit.androidReleaseCreateWalletSmokeSummaryErrors.length}`,
  ...audit.androidReleaseCreateWalletSmokeSummaryErrors.map(error => `- ${error}`),
  `Sentry release create-wallet evidence ready: ${audit.androidReleaseCreateWalletSmokeEvidenceReady ? 'yes' : 'no'}`,
  `iOS release static readiness valid: ${audit.iosReleaseStaticReady ? 'yes' : 'no'}`,
  `iOS macOS archive validation ready: ${audit.iosMacArchiveReady ? 'yes' : 'no'}`,
  `iOS Sentry bundle/source-map phases: ${audit.iosSentryBundlePhaseCount}`,
  `iOS Sentry dSYM upload phases: ${audit.iosSentryDsymPhaseCount}`,
  `iOS Podfile.lock refresh required: ${audit.iosPodfileLockRefreshRequired ? 'yes' : 'no'}`,
  `iOS Podfile.lock drift issues: ${audit.iosPodfileLockDriftIssues.length}`,
  ...audit.iosPodfileLockDriftIssues.map(issue => `- ${issue}`),
  `iOS macOS validation prerequisites ready: ${audit.iosMacValidationPrereqsReady ? 'yes' : 'no'}`,
  `iOS macOS validation blockers: ${audit.iosMacValidationBlockers.length}`,
  ...audit.iosMacValidationBlockers.map(blocker => `- ${blocker}`),
  'Sentry release upload validation: not claimed',
  'Credential handoff steps:',
  '1. Set SENTRY_AUTH_TOKEN in the local shell or CI secret store.',
  '2. Optional: set SENTRY_ORG and SENTRY_PROJECT only when the target differs from cloudbest/goldwallet.',
  '3. Run corepack yarn sentry:release:create-properties.',
  '4. Run corepack yarn sentry:release:prereq-audit.',
  '5. Run corepack yarn sentry:release:prereq-check-summary.',
  '6. Run corepack yarn sentry:release:validation:handoff after Android release and smoke evidence are current.',
  'Review-safe evidence: file paths, env variable names, and command names only',
  'Secret values printed: no',
  'Required action: provide SENTRY_AUTH_TOKEN, generate local-only sentry.properties, android/sentry.properties, and ios/sentry.properties, refresh current Android release/full-smoke/create-wallet evidence, refresh ios/Podfile.lock on macOS with Xcode/CocoaPods, and run iOS archive/simulator validation before claiming source-map upload validation.',
  '',
].join('\n');

const main = () => {
  const audit = collectSentryReleasePrerequisites();
  const plan = formatSentryReleaseCredentialPlan(audit);

  mkdirSync(path.dirname(planPath), { recursive: true });
  writeFileSync(planPath, plan);

  console.log('Sentry release credential plan');
  console.log(`Release source-map prerequisites: ${audit.ready ? 'ready' : 'not ready'}`);
  console.log(`SENTRY_AUTH_TOKEN available in current shell: ${audit.envHasToken ? 'yes' : 'no'}`);
  console.log(`Missing properties files: ${audit.missingFiles.length}`);
  console.log(`Invalid properties files: ${audit.invalidFiles.length}`);
  console.log('Review-safe evidence: file paths, env variable names, and command names only');
  console.log('Secret values printed: no');
  console.log(`Sentry release credential plan written to ${path.relative(root, planPath)}`);
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
