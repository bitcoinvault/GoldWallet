import {
  getAndroidDevEnvironmentIssues,
  requiredAndroidDevFiles,
  requiredAndroidDevPackageScripts,
  requiredAndroidDevPackageScriptSnippets,
} from './auditAndroidDevEnvironment.mjs';

const requiredPackageScriptCommands = new Map(
  requiredAndroidDevPackageScripts.map(scriptName => [
    scriptName,
    requiredAndroidDevPackageScriptSnippets
      .filter(([snippetScriptName]) => snippetScriptName === scriptName)
      .map(([, snippet]) => snippet)
      .join(' && ') || `yarn ${scriptName}`,
  ]),
);

const validEnvironment = {
  javaCommand: 'D:\\tmp\\jdks\\temurin17\\jdk-17.0.19+10\\bin\\java.exe',
  javaMajor: '17',
  javaDetected: true,
  javaHome: 'D:\\tmp\\jdks\\temurin17\\jdk-17.0.19+10',
  nodeVersion: '22.18.0',
  nvmrc: '22.18.0',
  androidSdkRoot: 'C:\\Users\\User\\AppData\\Local\\Android\\Sdk',
  androidSdkRootExists: true,
  androidPlatformDirExists: true,
  androidBuildToolsDirExists: true,
  adbCandidate: 'C:\\Users\\User\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe',
  adbReady: true,
  existingFiles: new Set(requiredAndroidDevFiles.map(([relativePath]) => relativePath)),
  packageScripts: new Set(requiredAndroidDevPackageScripts),
  packageScriptCommands: requiredPackageScriptCommands,
};

const assertAccepted = (label, environment) => {
  const { errors } = getAndroidDevEnvironmentIssues(environment);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, environment, expectedError) => {
  const { errors } = getAndroidDevEnvironmentIssues(environment);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertMissingFileRejected = (label, relativePath, expectedError) =>
  assertRejected(
    label,
    {
      ...validEnvironment,
      existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== relativePath)),
    },
    expectedError,
  );

const assertMissingPackageScriptRejected = (label, scriptName) =>
  assertRejected(
    label,
    {
      ...validEnvironment,
      packageScripts: new Set([...validEnvironment.packageScripts].filter(candidate => candidate !== scriptName)),
    },
    `package.json is missing ${scriptName}`,
  );

assertAccepted('Valid Android dev environment fixture', validEnvironment);

assertRejected('Older JDK fixture', { ...validEnvironment, javaMajor: '11' }, 'requires JDK 17');
assertRejected('Unsupported JDK fixture', { ...validEnvironment, javaMajor: '21' }, 'requires JDK 17');
assertRejected('Missing Java fixture', { ...validEnvironment, javaDetected: false, javaMajor: undefined }, 'Unable to detect Java version');
assertRejected('Missing Android SDK fixture', { ...validEnvironment, androidSdkRootExists: false }, 'Android SDK root does not exist');
assertRejected('Missing Android SDK 36 platform fixture', { ...validEnvironment, androidPlatformDirExists: false }, 'Android SDK platform android-36 is missing');
assertRejected('Missing Android build tools 36 fixture', { ...validEnvironment, androidBuildToolsDirExists: false }, 'Android SDK build tools 36.0.0 are missing');
assertRejected('Missing adb fixture', { ...validEnvironment, adbReady: false }, 'Unable to run adb version');
assertRejected(
  'Missing Gradle runner fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/runAndroidGradle.mjs')),
  },
  'guarded Gradle runner is missing',
);
assertRejected(
  'Missing RN upgrade path guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkReactNativeUpgradePathGuard.mjs')),
  },
  'React Native upgrade path audit guard helper is missing',
);
assertRejected(
  'Missing Node runtime transition audit file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/auditNodeRuntimeTransition.mjs')),
  },
  'Node runtime transition audit helper is missing',
);
assertRejected(
  'Missing Node runtime transition guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkNodeRuntimeTransitionGuard.mjs')),
  },
  'Node runtime transition guard helper is missing',
);
assertRejected(
  'Missing RN target snapshot audit file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/auditReactNativeTargetSnapshot.mjs')),
  },
  'React Native target snapshot audit helper is missing',
);
assertRejected(
  'Missing RN target snapshot live npm check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkReactNativeTargetSnapshotCurrent.mjs')),
  },
  'React Native target snapshot live npm check helper is missing',
);
assertRejected(
  'Missing RN target snapshot live npm guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkReactNativeTargetSnapshotCurrentGuard.mjs')),
  },
  'React Native target snapshot live npm guard helper is missing',
);
assertRejected(
  'Missing RN target snapshot summary guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/reactNativeTargetSnapshotSummaryGuard.mjs')),
  },
  'React Native target snapshot summary guard helper is missing',
);
assertRejected(
  'Missing RN target snapshot summary checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkReactNativeTargetSnapshotSummary.mjs')),
  },
  'React Native target snapshot summary artifact checker is missing',
);
assertRejected(
  'Missing RN target snapshot summary guard self-check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkReactNativeTargetSnapshotSummaryGuard.mjs')),
  },
  'React Native target snapshot summary guard self-check helper is missing',
);
assertRejected(
  'Missing React 19 impact audit file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/auditReact19Impact.mjs')),
  },
  'React 19 impact audit helper is missing',
);
assertRejected(
  'Missing React 19 impact guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkReact19ImpactGuard.mjs')),
  },
  'React 19 impact audit guard helper is missing',
);
assertRejected(
  'Missing React package coupling audit file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/auditReactPackageCoupling.mjs')),
  },
  'React package coupling audit helper is missing',
);
assertRejected(
  'Missing React package coupling guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkReactPackageCouplingGuard.mjs')),
  },
  'React package coupling guard helper is missing',
);
assertRejected(
  'Missing test/type coupling audit file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/auditTestTypeCoupling.mjs')),
  },
  'test/type coupling audit helper is missing',
);
assertRejected(
  'Missing test/type coupling guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkTestTypeCouplingGuard.mjs')),
  },
  'test/type coupling guard helper is missing',
);
assertMissingFileRejected('Missing camera candidate audit file fixture', 'scripts/auditCameraCandidates.mjs', 'camera candidate audit helper is missing');
assertMissingFileRejected(
  'Missing camera candidate summary guard file fixture',
  'scripts/cameraCandidateSummaryGuard.mjs',
  'camera candidate summary guard helper is missing',
);
assertMissingFileRejected(
  'Missing camera candidate summary checker file fixture',
  'scripts/checkCameraCandidateSummary.mjs',
  'camera candidate summary artifact checker is missing',
);
assertMissingFileRejected(
  'Missing camera candidate summary guard self-check file fixture',
  'scripts/checkCameraCandidateSummaryGuard.mjs',
  'camera candidate summary guard self-check helper is missing',
);
assertMissingFileRejected('Missing camera QR migration audit file fixture', 'scripts/auditCameraQrMigration.mjs', 'camera QR migration audit helper is missing');
assertRejected(
  'Missing camera QR migration summary guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/cameraQrMigrationSummaryGuard.mjs')),
  },
  'camera QR migration summary guard helper is missing',
);
assertRejected(
  'Missing camera QR migration summary checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkCameraQrMigrationSummary.mjs')),
  },
  'camera QR migration summary artifact checker is missing',
);
assertRejected(
  'Missing camera QR migration summary guard self-check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkCameraQrMigrationSummaryGuard.mjs')),
  },
  'camera QR migration summary guard self-check helper is missing',
);
assertMissingFileRejected('Missing masked-view migration audit file fixture', 'scripts/auditMaskedViewMigration.mjs', 'masked-view migration audit helper is missing');
assertMissingFileRejected(
  'Missing masked-view migration summary guard file fixture',
  'scripts/maskedViewMigrationSummaryGuard.mjs',
  'masked-view migration summary guard helper is missing',
);
assertMissingFileRejected(
  'Missing masked-view migration summary checker file fixture',
  'scripts/checkMaskedViewMigrationSummary.mjs',
  'masked-view migration summary artifact checker is missing',
);
assertMissingFileRejected(
  'Missing masked-view migration summary guard self-check file fixture',
  'scripts/checkMaskedViewMigrationSummaryGuard.mjs',
  'masked-view migration summary guard self-check helper is missing',
);
assertMissingFileRejected('Missing secure-storage migration audit file fixture', 'scripts/auditSecureStorageMigration.mjs', 'secure-storage migration audit helper is missing');
assertMissingFileRejected(
  'Missing secure-storage migration summary guard file fixture',
  'scripts/secureStorageMigrationSummaryGuard.mjs',
  'secure-storage migration summary guard helper is missing',
);
assertMissingFileRejected(
  'Missing secure-storage migration summary checker file fixture',
  'scripts/checkSecureStorageMigrationSummary.mjs',
  'secure-storage migration summary artifact checker is missing',
);
assertMissingFileRejected(
  'Missing secure-storage migration summary guard self-check file fixture',
  'scripts/checkSecureStorageMigrationSummaryGuard.mjs',
  'secure-storage migration summary guard self-check helper is missing',
);
assertMissingFileRejected('Missing Sentry Android warning audit file fixture', 'scripts/auditSentryAndroidWarning.mjs', 'Sentry Android warning audit helper is missing');
assertRejected(
  'Missing Sentry Android warning summary guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/sentryAndroidWarningSummaryGuard.mjs')),
  },
  'Sentry Android warning summary guard helper is missing',
);
assertRejected(
  'Missing Sentry Android warning summary checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkSentryAndroidWarningSummary.mjs')),
  },
  'Sentry Android warning summary artifact checker is missing',
);
assertRejected(
  'Missing Sentry Android warning summary guard self-check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkSentryAndroidWarningSummaryGuard.mjs')),
  },
  'Sentry Android warning summary guard self-check helper is missing',
);
assertRejected(
  'Missing Android warning-source summary aggregate checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkAndroidWarningSourceSummaries.mjs')),
  },
  'Android warning-source summary aggregate checker is missing',
);
assertRejected(
  'Missing Android warning-source summary aggregate guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkAndroidWarningSourceSummariesGuard.mjs')),
  },
  'Android warning-source summary aggregate guard self-check helper is missing',
);
assertMissingFileRejected(
  'Missing Android remaining-warning plan guard file fixture',
  'scripts/androidRemainingWarningPlanGuard.mjs',
  'Android remaining-warning plan guard helper is missing',
);
assertMissingFileRejected(
  'Missing Android remaining-warning plan checker file fixture',
  'scripts/checkAndroidRemainingWarningPlan.mjs',
  'Android remaining-warning plan checker is missing',
);
assertMissingFileRejected(
  'Missing Android remaining-warning plan guard self-check file fixture',
  'scripts/checkAndroidRemainingWarningPlanGuard.mjs',
  'Android remaining-warning plan guard self-check helper is missing',
);
assertRejected(
  'Missing Android warning audit summary checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkAndroidWarningAuditSummary.mjs')),
  },
  'Android warning audit summary checker is missing',
);
assertRejected(
  'Missing Android warning audit summary guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkAndroidWarningAuditSummaryGuard.mjs')),
  },
  'Android warning audit summary guard self-check helper is missing',
);
assertRejected(
  'Missing Android smoke summary guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/androidSmokeSummaryGuard.mjs')),
  },
  'Android smoke summary guard helper is missing',
);
assertRejected(
  'Missing Android smoke summary checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkAndroidSmokeSummary.mjs')),
  },
  'Android smoke summary artifact checker is missing',
);
assertRejected(
  'Missing Android smoke summary guard self-check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkAndroidSmokeSummaryGuard.mjs')),
  },
  'Android smoke summary guard self-check helper is missing',
);
assertRejected(
  'Missing Sentry release prerequisite summary guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/sentryReleasePrereqSummaryGuard.mjs')),
  },
  'Sentry release prerequisite summary guard helper is missing',
);
assertRejected(
  'Missing Sentry release prerequisite summary checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkSentryReleasePrereqSummary.mjs')),
  },
  'Sentry release prerequisite summary artifact checker is missing',
);
assertRejected(
  'Missing Sentry release prerequisite summary guard self-check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkSentryReleasePrereqSummaryGuard.mjs')),
  },
  'Sentry release prerequisite summary guard self-check helper is missing',
);
assertRejected(
  'Missing CodePush release path summary guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/codePushReleasePathSummaryGuard.mjs')),
  },
  'CodePush release path summary guard helper is missing',
);
assertRejected(
  'Missing CodePush release path summary checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkCodePushReleasePathSummary.mjs')),
  },
  'CodePush release path summary artifact checker is missing',
);
assertRejected(
  'Missing CodePush release path summary guard self-check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkCodePushReleasePathSummaryGuard.mjs')),
  },
  'CodePush release path summary guard self-check helper is missing',
);
assertRejected(
  'Missing Firebase release-services summary guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/firebaseReleaseServicesSummaryGuard.mjs')),
  },
  'Firebase release-services summary guard helper is missing',
);
assertRejected(
  'Missing Firebase release-services summary checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkFirebaseReleaseServicesSummary.mjs')),
  },
  'Firebase release-services summary artifact checker is missing',
);
assertRejected(
  'Missing Firebase release-services summary guard self-check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkFirebaseReleaseServicesSummaryGuard.mjs')),
  },
  'Firebase release-services summary guard self-check helper is missing',
);
assertRejected(
  'Missing push notification bridge summary guard file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/pushNotificationBridgeSummaryGuard.mjs')),
  },
  'push notification bridge summary guard helper is missing',
);
assertRejected(
  'Missing push notification bridge summary checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkPushNotificationBridgeSummary.mjs')),
  },
  'push notification bridge summary artifact checker is missing',
);
assertRejected(
  'Missing push notification bridge summary guard self-check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkPushNotificationBridgeSummaryGuard.mjs')),
  },
  'push notification bridge summary guard self-check helper is missing',
);
assertRejected(
  'Missing release-services summary artifact checker file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkReleaseServicesSummaryArtifacts.mjs')),
  },
  'release-services summary artifact checker is missing',
);
assertRejected(
  'Missing release-services summary guard self-check file fixture',
  {
    ...validEnvironment,
    existingFiles: new Set([...validEnvironment.existingFiles].filter(filePath => filePath !== 'scripts/checkReleaseServicesSummaryGuard.mjs')),
  },
  'release-services summary guard self-check helper is missing',
);
assertRejected(
  'Missing dev verification package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'android:dev:verify')),
  },
  'package.json is missing android:dev:verify',
);
assertRejected(
  'Dev verification missing env audit fixture',
  {
    ...validEnvironment,
    packageScriptCommands: new Map([
      ...validEnvironment.packageScriptCommands,
      ['android:dev:verify', 'yarn android:dev:assemble && yarn android:dev:smoke && yarn android:dev:check-smoke-summary'],
    ]),
  },
  'package.json script android:dev:verify must include android:dev:env-audit',
);
assertRejected(
  'Dev verification missing assemble fixture',
  {
    ...validEnvironment,
    packageScriptCommands: new Map([
      ...validEnvironment.packageScriptCommands,
      ['android:dev:verify', 'yarn android:dev:smoke && yarn android:dev:check-smoke-summary'],
    ]),
  },
  'package.json script android:dev:verify must include android:dev:assemble',
);
assertRejected(
  'Dev verification missing smoke fixture',
  {
    ...validEnvironment,
    packageScriptCommands: new Map([
      ...validEnvironment.packageScriptCommands,
      ['android:dev:verify', 'yarn android:dev:assemble && yarn android:dev:check-smoke-summary'],
    ]),
  },
  'package.json script android:dev:verify must include android:dev:smoke',
);
assertRejected(
  'Dev verification missing smoke summary fixture',
  {
    ...validEnvironment,
    packageScriptCommands: new Map([
      ...validEnvironment.packageScriptCommands,
      ['android:dev:verify', 'yarn android:dev:assemble && yarn android:dev:smoke'],
    ]),
  },
  'package.json script android:dev:verify must include android:dev:check-smoke-summary',
);
assertRejected(
  'Audit-smoke missing env audit fixture',
  {
    ...validEnvironment,
    packageScriptCommands: new Map([
      ...validEnvironment.packageScriptCommands,
      ['android:dev:audit-smoke', 'yarn android:dev:audit-warnings && yarn android:dev:smoke && yarn android:dev:check-artifacts'],
    ]),
  },
  'package.json script android:dev:audit-smoke must include android:dev:env-audit',
);
assertRejected(
  'Audit-smoke missing warning audit fixture',
  {
    ...validEnvironment,
    packageScriptCommands: new Map([
      ...validEnvironment.packageScriptCommands,
      ['android:dev:audit-smoke', 'yarn android:dev:smoke && yarn android:dev:check-artifacts'],
    ]),
  },
  'package.json script android:dev:audit-smoke must include android:dev:audit-warnings',
);
assertRejected(
  'Audit-smoke missing smoke fixture',
  {
    ...validEnvironment,
    packageScriptCommands: new Map([
      ...validEnvironment.packageScriptCommands,
      ['android:dev:audit-smoke', 'yarn android:dev:audit-warnings && yarn android:dev:check-artifacts'],
    ]),
  },
  'package.json script android:dev:audit-smoke must include android:dev:smoke',
);
assertRejected(
  'Audit-smoke missing artifact checker fixture',
  {
    ...validEnvironment,
    packageScriptCommands: new Map([
      ...validEnvironment.packageScriptCommands,
      ['android:dev:audit-smoke', 'yarn android:dev:audit-warnings && yarn android:dev:smoke'],
    ]),
  },
  'package.json script android:dev:audit-smoke must include android:dev:check-artifacts',
);
assertRejected(
  'Missing RN upgrade path package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'rn:upgrade-path:audit')),
  },
  'package.json is missing rn:upgrade-path:audit',
);
assertRejected(
  'Missing RN baseline preflight package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'rn:baseline:preflight')),
  },
  'package.json is missing rn:baseline:preflight',
);
assertRejected(
  'Missing Node runtime transition package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'node:runtime-transition:audit')),
  },
  'package.json is missing node:runtime-transition:audit',
);
assertRejected(
  'Missing Node runtime transition guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:node-runtime-transition-guard')),
  },
  'package.json is missing check:node-runtime-transition-guard',
);
assertRejected(
  'Missing RN target snapshot package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'rn:target-snapshot:audit')),
  },
  'package.json is missing rn:target-snapshot:audit',
);
assertRejected(
  'Missing RN target snapshot live npm package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'rn:target-snapshot:current')),
  },
  'package.json is missing rn:target-snapshot:current',
);
assertRejected(
  'Missing RN target snapshot live npm guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:rn-target-snapshot-current-guard')),
  },
  'package.json is missing check:rn-target-snapshot-current-guard',
);
assertRejected(
  'Missing RN target snapshot summary package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'rn:target-snapshot:check-summary')),
  },
  'package.json is missing rn:target-snapshot:check-summary',
);
assertRejected(
  'Missing RN target snapshot summary guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:rn-target-snapshot-summary-guard')),
  },
  'package.json is missing check:rn-target-snapshot-summary-guard',
);
assertRejected(
  'Missing React 19 impact package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'react19:impact:audit')),
  },
  'package.json is missing react19:impact:audit',
);
assertRejected(
  'Missing React 19 impact guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:react19-impact-guard')),
  },
  'package.json is missing check:react19-impact-guard',
);
assertRejected(
  'Missing React package coupling package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'react:package-coupling:audit')),
  },
  'package.json is missing react:package-coupling:audit',
);
assertRejected(
  'Missing React package coupling guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:react-package-coupling-guard')),
  },
  'package.json is missing check:react-package-coupling-guard',
);
assertRejected(
  'Missing test/type coupling package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'test:type-coupling:audit')),
  },
  'package.json is missing test:type-coupling:audit',
);
assertRejected(
  'Missing test/type coupling guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:test-type-coupling-guard')),
  },
  'package.json is missing check:test-type-coupling-guard',
);
assertMissingPackageScriptRejected('Missing camera candidate audit package script fixture', 'camera:candidate:audit');
assertMissingPackageScriptRejected('Missing camera candidate summary package script fixture', 'camera:candidate:check-summary');
assertMissingPackageScriptRejected('Missing camera candidate summary guard package script fixture', 'check:camera-candidate-summary-guard');
assertMissingPackageScriptRejected('Missing camera QR migration audit package script fixture', 'camera:qr-migration:audit');
assertRejected(
  'Missing camera QR migration summary package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'camera:qr-migration:check-summary')),
  },
  'package.json is missing camera:qr-migration:check-summary',
);
assertRejected(
  'Missing camera QR migration summary guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:camera-qr-migration-summary-guard')),
  },
  'package.json is missing check:camera-qr-migration-summary-guard',
);
assertMissingPackageScriptRejected('Missing masked-view migration audit package script fixture', 'masked-view:migration:audit');
assertMissingPackageScriptRejected('Missing masked-view migration summary package script fixture', 'masked-view:migration:check-summary');
assertMissingPackageScriptRejected('Missing masked-view migration summary guard package script fixture', 'check:masked-view-migration-summary-guard');
assertMissingPackageScriptRejected('Missing secure-storage migration audit package script fixture', 'secure-storage:migration:audit');
assertMissingPackageScriptRejected('Missing secure-storage migration summary package script fixture', 'secure-storage:migration:check-summary');
assertMissingPackageScriptRejected('Missing secure-storage migration summary guard package script fixture', 'check:secure-storage-migration-summary-guard');
assertMissingPackageScriptRejected('Missing Sentry Android warning audit package script fixture', 'sentry:android-warning:audit');
assertRejected(
  'Missing Sentry Android warning summary package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'sentry:android-warning:check-summary')),
  },
  'package.json is missing sentry:android-warning:check-summary',
);
assertRejected(
  'Missing Sentry Android warning summary guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:sentry-android-warning-summary-guard')),
  },
  'package.json is missing check:sentry-android-warning-summary-guard',
);
assertRejected(
  'Missing Android warning-source summary aggregate package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'android:dev:check-warning-source-summaries')),
  },
  'package.json is missing android:dev:check-warning-source-summaries',
);
assertRejected(
  'Missing Android warning-source summary aggregate guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:android-warning-source-summaries-guard')),
  },
  'package.json is missing check:android-warning-source-summaries-guard',
);
assertMissingPackageScriptRejected('Missing Android remaining-warning plan package script fixture', 'check:android-remaining-warning-plan');
assertMissingPackageScriptRejected('Missing Android remaining-warning plan guard package script fixture', 'check:android-remaining-warning-plan-guard');
assertRejected(
  'Missing Android warning audit summary package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'android:dev:check-warning-audit-summary')),
  },
  'package.json is missing android:dev:check-warning-audit-summary',
);
assertRejected(
  'Missing Android warning audit summary guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:android-warning-audit-summary-guard')),
  },
  'package.json is missing check:android-warning-audit-summary-guard',
);
assertRejected(
  'Missing Android smoke summary package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'android:dev:check-smoke-summary')),
  },
  'package.json is missing android:dev:check-smoke-summary',
);
assertRejected(
  'Missing Android smoke summary guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:android-smoke-summary-guard')),
  },
  'package.json is missing check:android-smoke-summary-guard',
);
assertRejected(
  'Missing Sentry release prerequisite summary package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'sentry:release:prereq-check-summary')),
  },
  'package.json is missing sentry:release:prereq-check-summary',
);
assertRejected(
  'Missing Sentry release prerequisite summary guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:sentry-release-prereq-summary-guard')),
  },
  'package.json is missing check:sentry-release-prereq-summary-guard',
);
assertRejected(
  'Missing CodePush release path summary package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'codepush:release:path-check-summary')),
  },
  'package.json is missing codepush:release:path-check-summary',
);
assertRejected(
  'Missing CodePush release path summary guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:codepush-release-path-summary-guard')),
  },
  'package.json is missing check:codepush-release-path-summary-guard',
);
assertRejected(
  'Missing Firebase release-services summary package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'firebase:release-services:check-summary')),
  },
  'package.json is missing firebase:release-services:check-summary',
);
assertRejected(
  'Missing Firebase release-services summary guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:firebase-release-services-summary-guard')),
  },
  'package.json is missing check:firebase-release-services-summary-guard',
);
assertRejected(
  'Missing push notification bridge summary package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'push-notification:bridge-check-summary')),
  },
  'package.json is missing push-notification:bridge-check-summary',
);
assertRejected(
  'Missing push notification bridge summary guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:push-notification-bridge-summary-guard')),
  },
  'package.json is missing check:push-notification-bridge-summary-guard',
);
assertRejected(
  'Missing release-services summary aggregate package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'release-services:check-summaries')),
  },
  'package.json is missing release-services:check-summaries',
);
assertRejected(
  'Missing release-services summary aggregate guard package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'check:release-services-summary-guard')),
  },
  'package.json is missing check:release-services-summary-guard',
);

console.log('Android dev environment audit guard checks are valid.');
