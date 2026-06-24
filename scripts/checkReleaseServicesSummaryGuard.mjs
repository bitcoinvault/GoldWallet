import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { releaseServicesSummaryArtifacts } from './checkReleaseServicesSummaryArtifacts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const checkerPath = path.join(root, 'scripts', 'checkReleaseServicesSummaryArtifacts.mjs');
const checkerSource = readFileSync(checkerPath, 'utf8');

const requiredSnippets = [
  "import { fileURLToPath, pathToFileURL } from 'url';",
  'getAndroidReleaseNoNetworkSmokeEvidenceOptions',
  'getAndroidReleaseSmokeEvidenceOptions',
  "import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';",
  "import { getAndroidReleaseApkManifestErrors } from './checkAndroidReleaseApkManifest.mjs';",
  "import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';",
  'getAndroidEmbeddedSmokeSummaryErrors',
  'getAndroidNoNetworkSmokeSummaryErrors',
  "import { getAndroidReleaseNetworkBlockerSummaryErrors } from './androidReleaseNetworkBlockerSummaryGuard.mjs';",
  "import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';",
  "import { getFirebaseReleaseServicesSummaryErrors } from './firebaseReleaseServicesSummaryGuard.mjs';",
  "import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';",
  "import { getCodePushMigrationReadinessSummaryErrors } from './codePushMigrationReadinessSummaryGuard.mjs';",
  "import { getCodePushRemovalReadinessSummaryErrors } from './codePushRemovalReadinessSummaryGuard.mjs';",
  "import { getCodePushEnvCleanupReadinessSummaryErrors } from './codePushEnvCleanupReadinessSummaryGuard.mjs';",
  "import { getCodePushDecisionHandoffErrors } from './codePushDecisionHandoffGuard.mjs';",
  "import { getPushNotificationBridgeSummaryErrors } from './pushNotificationBridgeSummaryGuard.mjs';",
  "import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';",
  "import { getIosMacValidationPrereqSummaryErrors } from './iosMacValidationPrereqSummaryGuard.mjs';",
  "import { getIosPodfileRefreshPlanErrors } from './iosPodfileRefreshPlanGuard.mjs';",
  "import { getIosValidationHandoffSummaryErrors } from './iosValidationHandoffSummaryGuard.mjs';",
  "import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';",
  "import { getSentryRnBundleTaskCompatibilitySummaryErrors } from './sentryRnBundleTaskCompatibilitySummaryGuard.mjs';",
  'export const releaseServicesSummaryArtifacts = [',
  'export const getReleaseServicesSummaryArtifactState =',
  'export const getReleaseServicesSummaryArtifactErrors =',
  "status: 'ready'",
  'blocked-by-electrum-certificate-expired',
  'Full release runtime proof remains unclaimed until the dev/testnet Electrum TLS certificate is fixed.',
  "label: 'Android release summary'",
  "relativePath: 'local-docs/android-release-dev-summary.txt'",
  'getAndroidReleaseSummaryErrors(summary, rootPath)',
  "label: 'Android release APK manifest'",
  'getAndroidReleaseApkManifestErrors({ root: rootPath })',
  "label: 'Android release smoke'",
  "relativePath: 'local-docs/android-smoke-dev-release-summary.txt'",
  'getAndroidEmbeddedSmokeSummaryErrors(summary, getAndroidReleaseSmokeEvidenceOptions(rootPath))',
  "label: 'Android release create-wallet smoke'",
  "relativePath: 'local-docs/android-create-wallet-smoke-dev-release-summary.txt'",
  'getAndroidCreateWalletSmokeSummaryErrors(summary, {',
  "label: 'Sentry release prerequisite'",
  "relativePath: 'local-docs/sentry-release-prereq-summary.txt'",
  "label: 'Sentry Android warning'",
  "relativePath: 'local-docs/sentry-android-warning-summary.txt'",
  "label: 'Sentry RN bundle task compatibility'",
  "relativePath: 'local-docs/sentry-rn-bundle-task-compatibility-summary.txt'",
  "label: 'Firebase release-services'",
  "relativePath: 'local-docs/firebase-release-services-summary.txt'",
  "label: 'CodePush release path'",
  "relativePath: 'local-docs/codepush-release-path-summary.txt'",
  "label: 'CodePush migration readiness'",
  "relativePath: 'local-docs/codepush-migration-readiness-summary.txt'",
  "label: 'CodePush removal readiness'",
  "relativePath: 'local-docs/codepush-removal-readiness-summary.txt'",
  "label: 'CodePush env cleanup readiness'",
  "relativePath: 'local-docs/codepush-env-cleanup-readiness-summary.txt'",
  "label: 'CodePush decision handoff'",
  "relativePath: 'local-docs/codepush-decision-handoff.txt'",
  "label: 'push notification bridge'",
  "relativePath: 'local-docs/push-notification-bridge-summary.txt'",
  "label: 'iOS release readiness'",
  "relativePath: 'local-docs/ios-release-static-readiness-summary.txt'",
  "label: 'iOS macOS validation prerequisites'",
  "relativePath: 'local-docs/ios-mac-validation-prereqs-summary.txt'",
  "label: 'iOS Podfile refresh plan'",
  "relativePath: 'local-docs/ios-podfile-refresh-plan.txt'",
  "label: 'iOS validation handoff'",
  "relativePath: 'local-docs/ios-validation-handoff-summary.txt'",
  'Release-services summary artifacts are invalid:',
  'Release-services summary artifacts are valid.',
  'import.meta.url === pathToFileURL(process.argv[1]).href',
];

const missingSnippets = requiredSnippets.filter(snippet => !checkerSource.includes(snippet));
const expectedArtifacts = [
  ['Android release summary', 'local-docs/android-release-dev-summary.txt'],
  ['Android release APK manifest', 'local-docs/android-release-dev-summary.txt'],
  ['Android release smoke', 'local-docs/android-smoke-dev-release-summary.txt'],
  ['Android release create-wallet smoke', 'local-docs/android-create-wallet-smoke-dev-release-summary.txt'],
  ['Sentry release prerequisite', 'local-docs/sentry-release-prereq-summary.txt'],
  ['Sentry Android warning', 'local-docs/sentry-android-warning-summary.txt'],
  ['Sentry RN bundle task compatibility', 'local-docs/sentry-rn-bundle-task-compatibility-summary.txt'],
  ['Firebase release-services', 'local-docs/firebase-release-services-summary.txt'],
  ['CodePush release path', 'local-docs/codepush-release-path-summary.txt'],
  ['CodePush migration readiness', 'local-docs/codepush-migration-readiness-summary.txt'],
  ['CodePush removal readiness', 'local-docs/codepush-removal-readiness-summary.txt'],
  ['CodePush env cleanup readiness', 'local-docs/codepush-env-cleanup-readiness-summary.txt'],
  ['CodePush decision handoff', 'local-docs/codepush-decision-handoff.txt'],
  ['push notification bridge', 'local-docs/push-notification-bridge-summary.txt'],
  ['iOS release readiness', 'local-docs/ios-release-static-readiness-summary.txt'],
  ['iOS macOS validation prerequisites', 'local-docs/ios-mac-validation-prereqs-summary.txt'],
  ['iOS Podfile refresh plan', 'local-docs/ios-podfile-refresh-plan.txt'],
  ['iOS validation handoff', 'local-docs/ios-validation-handoff-summary.txt'],
];
const artifactErrors = [];
const actualArtifactKeys = releaseServicesSummaryArtifacts.map(artifact => `${artifact.label}|${artifact.relativePath}`);
const expectedArtifactKeys = expectedArtifacts.map(([label, relativePath]) => `${label}|${relativePath}`);
const duplicateArtifactKeys = actualArtifactKeys.filter((key, index) => actualArtifactKeys.indexOf(key) !== index);

if (releaseServicesSummaryArtifacts.length !== expectedArtifacts.length) {
  artifactErrors.push(`Expected ${expectedArtifacts.length} release-services summary artifacts, found ${releaseServicesSummaryArtifacts.length}`);
}

expectedArtifactKeys.forEach(expectedKey => {
  if (!actualArtifactKeys.includes(expectedKey)) {
    artifactErrors.push(`Missing release-services summary artifact export: ${expectedKey}`);
  }
});

actualArtifactKeys.forEach(actualKey => {
  if (!expectedArtifactKeys.includes(actualKey)) {
    artifactErrors.push(`Unexpected release-services summary artifact export: ${actualKey}`);
  }
});

duplicateArtifactKeys.forEach(duplicateKey => {
  artifactErrors.push(`Duplicate release-services summary artifact export: ${duplicateKey}`);
});

releaseServicesSummaryArtifacts.forEach(artifact => {
  if (typeof artifact.getErrors !== 'function') {
    artifactErrors.push(`Release-services summary artifact ${artifact.label || '<missing label>'} must expose a getErrors function`);
  }
});

if (missingSnippets.length > 0 || artifactErrors.length > 0) {
  console.error('Release-services summary aggregate checker guard failed:');
  missingSnippets.forEach(snippet => console.error(`- Missing checker snippet: ${snippet}`));
  artifactErrors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Release-services summary aggregate checker guard checks are valid.');
