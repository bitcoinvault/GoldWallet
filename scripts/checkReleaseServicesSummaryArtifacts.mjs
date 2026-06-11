import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidReleaseApkManifestErrors } from './checkAndroidReleaseApkManifest.mjs';
import { getAndroidReleaseSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getCodePushMigrationReadinessSummaryErrors } from './codePushMigrationReadinessSummaryGuard.mjs';
import { getCodePushRemovalReadinessSummaryErrors } from './codePushRemovalReadinessSummaryGuard.mjs';
import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';
import { getCodePushDecisionHandoffErrors } from './codePushDecisionHandoffGuard.mjs';
import { getFirebaseReleaseServicesSummaryErrors } from './firebaseReleaseServicesSummaryGuard.mjs';
import { getIosMacValidationPrereqSummaryErrors } from './iosMacValidationPrereqSummaryGuard.mjs';
import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';
import { getPushNotificationBridgeSummaryErrors } from './pushNotificationBridgeSummaryGuard.mjs';
import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';
import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export const releaseServicesSummaryArtifacts = [
  {
    label: 'Android release summary',
    relativePath: 'local-docs/android-release-dev-summary.txt',
    getErrors: (summary, rootPath) => getAndroidReleaseSummaryErrors(summary, rootPath),
  },
  {
    label: 'Android release APK manifest',
    relativePath: 'local-docs/android-release-dev-summary.txt',
    getErrors: (_summary, rootPath) => getAndroidReleaseApkManifestErrors({ root: rootPath }),
  },
  {
    label: 'Android release smoke',
    relativePath: 'local-docs/android-smoke-dev-release-summary.txt',
    getErrors: (summary, rootPath) => getAndroidEmbeddedSmokeSummaryErrors(summary, getAndroidReleaseSmokeEvidenceOptions(rootPath)),
  },
  {
    label: 'Sentry release prerequisite',
    relativePath: 'local-docs/sentry-release-prereq-summary.txt',
    getErrors: getSentryReleasePrereqSummaryErrors,
  },
  {
    label: 'Sentry Android warning',
    relativePath: 'local-docs/sentry-android-warning-summary.txt',
    getErrors: getSentryAndroidWarningSummaryErrors,
  },
  {
    label: 'Firebase release-services',
    relativePath: 'local-docs/firebase-release-services-summary.txt',
    getErrors: getFirebaseReleaseServicesSummaryErrors,
  },
  {
    label: 'CodePush release path',
    relativePath: 'local-docs/codepush-release-path-summary.txt',
    getErrors: getCodePushReleasePathSummaryErrors,
  },
  {
    label: 'CodePush migration readiness',
    relativePath: 'local-docs/codepush-migration-readiness-summary.txt',
    getErrors: getCodePushMigrationReadinessSummaryErrors,
  },
  {
    label: 'CodePush removal readiness',
    relativePath: 'local-docs/codepush-removal-readiness-summary.txt',
    getErrors: getCodePushRemovalReadinessSummaryErrors,
  },
  {
    label: 'CodePush decision handoff',
    relativePath: 'local-docs/codepush-decision-handoff.txt',
    getErrors: getCodePushDecisionHandoffErrors,
  },
  {
    label: 'push notification bridge',
    relativePath: 'local-docs/push-notification-bridge-summary.txt',
    getErrors: getPushNotificationBridgeSummaryErrors,
  },
  {
    label: 'iOS release readiness',
    relativePath: 'local-docs/ios-release-static-readiness-summary.txt',
    getErrors: getIosReleaseReadinessSummaryErrors,
  },
  {
    label: 'iOS macOS validation prerequisites',
    relativePath: 'local-docs/ios-mac-validation-prereqs-summary.txt',
    getErrors: getIosMacValidationPrereqSummaryErrors,
  },
];

export const getReleaseServicesSummaryArtifactErrors = ({ rootPath = root } = {}) => {
  const errors = [];

  releaseServicesSummaryArtifacts.forEach(summary => {
    const summaryPath = path.join(rootPath, summary.relativePath);

    if (!existsSync(summaryPath)) {
      errors.push(`${summary.label} summary artifact is missing at ${summary.relativePath}`);
      return;
    }

    const summaryContent = readFileSync(summaryPath, 'utf8');
    summary.getErrors(summaryContent, rootPath).forEach(error => {
      errors.push(`${summary.label}: ${error}`);
    });
  });

  return errors;
};

const main = () => {
  const errors = getReleaseServicesSummaryArtifactErrors();

  if (errors.length > 0) {
    console.error('Release-services summary artifacts are invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  console.log('Release-services summary artifacts are valid.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
