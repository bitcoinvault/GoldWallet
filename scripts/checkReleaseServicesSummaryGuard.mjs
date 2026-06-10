import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const checkerPath = path.join(root, 'scripts', 'checkReleaseServicesSummaryArtifacts.mjs');
const checkerSource = readFileSync(checkerPath, 'utf8');

const requiredSnippets = [
  "import { getAndroidReleaseApkManifestErrors } from './checkAndroidReleaseApkManifest.mjs';",
  "import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';",
  "import { getAndroidEmbeddedSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';",
  "import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';",
  "import { getFirebaseReleaseServicesSummaryErrors } from './firebaseReleaseServicesSummaryGuard.mjs';",
  "import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';",
  "import { getCodePushMigrationReadinessSummaryErrors } from './codePushMigrationReadinessSummaryGuard.mjs';",
  "import { getCodePushRemovalReadinessSummaryErrors } from './codePushRemovalReadinessSummaryGuard.mjs';",
  "import { getPushNotificationBridgeSummaryErrors } from './pushNotificationBridgeSummaryGuard.mjs';",
  "import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';",
  "import { getIosMacValidationPrereqSummaryErrors } from './iosMacValidationPrereqSummaryGuard.mjs';",
  "import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';",
  "label: 'Android release summary'",
  "relativePath: 'local-docs/android-release-dev-summary.txt'",
  'getAndroidReleaseSummaryErrors(summary, root)',
  "label: 'Android release APK manifest'",
  'getAndroidReleaseApkManifestErrors({ root })',
  "label: 'Android release smoke'",
  "relativePath: 'local-docs/android-smoke-dev-release-summary.txt'",
  "const signedReleaseSmokeApkPath = path.join(root, 'local-docs', 'android-smoke-dev-release-signed.apk');",
  "const unsignedDevReleaseApkPath = path.join(",
  "expectedArtifactBase: 'android-smoke-dev-release'",
  'requireSmokeApkDigest: true',
  'expectedSmokeApkPath: signedReleaseSmokeApkPath',
  'requireSourceApkDigest: true',
  'expectedSourceApkPath: unsignedDevReleaseApkPath',
  "label: 'Sentry release prerequisite'",
  "relativePath: 'local-docs/sentry-release-prereq-summary.txt'",
  "label: 'Sentry Android warning'",
  "relativePath: 'local-docs/sentry-android-warning-summary.txt'",
  "label: 'Firebase release-services'",
  "relativePath: 'local-docs/firebase-release-services-summary.txt'",
  "label: 'CodePush release path'",
  "relativePath: 'local-docs/codepush-release-path-summary.txt'",
  "label: 'CodePush migration readiness'",
  "relativePath: 'local-docs/codepush-migration-readiness-summary.txt'",
  "label: 'CodePush removal readiness'",
  "relativePath: 'local-docs/codepush-removal-readiness-summary.txt'",
  "label: 'push notification bridge'",
  "relativePath: 'local-docs/push-notification-bridge-summary.txt'",
  "label: 'iOS release readiness'",
  "relativePath: 'local-docs/ios-release-static-readiness-summary.txt'",
  "label: 'iOS macOS validation prerequisites'",
  "relativePath: 'local-docs/ios-mac-validation-prereqs-summary.txt'",
  'Release-services summary artifacts are invalid:',
  'Release-services summary artifacts are valid.',
];

const missingSnippets = requiredSnippets.filter(snippet => !checkerSource.includes(snippet));

if (missingSnippets.length > 0) {
  console.error('Release-services summary aggregate checker guard failed:');
  missingSnippets.forEach(snippet => console.error(`- Missing checker snippet: ${snippet}`));
  process.exit(1);
}

console.log('Release-services summary aggregate checker guard checks are valid.');
