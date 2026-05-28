import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';
import { getFirebaseReleaseServicesSummaryErrors } from './firebaseReleaseServicesSummaryGuard.mjs';
import { getPushNotificationBridgeSummaryErrors } from './pushNotificationBridgeSummaryGuard.mjs';
import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const summaries = [
  {
    label: 'Sentry release prerequisite',
    relativePath: 'local-docs/sentry-release-prereq-summary.txt',
    getErrors: getSentryReleasePrereqSummaryErrors,
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
    label: 'push notification bridge',
    relativePath: 'local-docs/push-notification-bridge-summary.txt',
    getErrors: getPushNotificationBridgeSummaryErrors,
  },
];

const errors = [];

summaries.forEach(summary => {
  const summaryPath = path.join(root, summary.relativePath);

  if (!existsSync(summaryPath)) {
    errors.push(`${summary.label} summary artifact is missing at ${summary.relativePath}`);
    return;
  }

  const summaryContent = readFileSync(summaryPath, 'utf8');
  summary.getErrors(summaryContent).forEach(error => {
    errors.push(`${summary.label}: ${error}`);
  });
});

if (errors.length > 0) {
  console.error('Release-services summary artifacts are invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Release-services summary artifacts are valid.');
