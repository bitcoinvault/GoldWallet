import { existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const requiredAndroidPlatform = 'android-36';
const requiredAndroidBuildTools = '36.0.0';

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const run = (command, args = []) =>
  spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });

const trimOutput = result => `${result.stdout || ''}${result.stderr || ''}`.trim();

export const requiredAndroidDevFiles = [
  ['android/gradlew.bat', 'Windows Gradle wrapper'],
  ['android/gradlew', 'Unix Gradle wrapper'],
  ['scripts/runAndroidGradle.mjs', 'guarded Gradle runner'],
  ['scripts/androidSmokeDev.mjs', 'Android emulator smoke helper'],
  ['scripts/auditAndroidGradleWarnings.mjs', 'Android warning audit helper'],
  ['scripts/auditNodeRuntimeTransition.mjs', 'Node runtime transition audit helper'],
  ['scripts/checkNodeRuntimeTransitionGuard.mjs', 'Node runtime transition guard helper'],
  ['scripts/auditReactNativeUpgradePath.mjs', 'React Native upgrade path audit helper'],
  ['scripts/checkReactNativeUpgradePathGuard.mjs', 'React Native upgrade path audit guard helper'],
  ['scripts/auditReactNativeTargetSnapshot.mjs', 'React Native target snapshot audit helper'],
  ['scripts/checkReactNativeTargetSnapshotGuard.mjs', 'React Native target snapshot audit guard helper'],
  ['scripts/checkReactNativeTargetSnapshotCurrent.mjs', 'React Native target snapshot live npm check helper'],
  ['scripts/checkReactNativeTargetSnapshotCurrentGuard.mjs', 'React Native target snapshot live npm guard helper'],
  ['scripts/reactNativeTargetSnapshotSummaryGuard.mjs', 'React Native target snapshot summary guard helper'],
  ['scripts/checkReactNativeTargetSnapshotSummary.mjs', 'React Native target snapshot summary artifact checker'],
  ['scripts/checkReactNativeTargetSnapshotSummaryGuard.mjs', 'React Native target snapshot summary guard self-check helper'],
  ['scripts/gitDependencySnapshotSummaryGuard.mjs', 'git dependency snapshot summary guard helper'],
  ['scripts/auditGitDependencySnapshot.mjs', 'git dependency snapshot audit helper'],
  ['scripts/checkGitDependencySnapshotSummary.mjs', 'git dependency snapshot summary artifact checker'],
  ['scripts/checkGitDependencySnapshotSummaryGuard.mjs', 'git dependency snapshot summary guard self-check helper'],
  ['scripts/nodeFetchResolutionSummaryGuard.mjs', 'node-fetch resolution summary guard helper'],
  ['scripts/auditNodeFetchResolution.mjs', 'node-fetch resolution audit helper'],
  ['scripts/checkNodeFetchResolutionSummary.mjs', 'node-fetch resolution summary artifact checker'],
  ['scripts/checkNodeFetchResolutionSummaryGuard.mjs', 'node-fetch resolution summary guard self-check helper'],
  ['scripts/auditReact19Impact.mjs', 'React 19 impact audit helper'],
  ['scripts/checkReact19ImpactGuard.mjs', 'React 19 impact audit guard helper'],
  ['scripts/auditReactPackageCoupling.mjs', 'React package coupling audit helper'],
  ['scripts/checkReactPackageCouplingGuard.mjs', 'React package coupling guard helper'],
  ['scripts/auditTestTypeCoupling.mjs', 'test/type coupling audit helper'],
  ['scripts/checkTestTypeCouplingGuard.mjs', 'test/type coupling guard helper'],
  ['scripts/auditCameraCandidates.mjs', 'camera candidate audit helper'],
  ['scripts/cameraCandidateSummaryGuard.mjs', 'camera candidate summary guard helper'],
  ['scripts/checkCameraCandidateSummary.mjs', 'camera candidate summary artifact checker'],
  ['scripts/checkCameraCandidateSummaryGuard.mjs', 'camera candidate summary guard self-check helper'],
  ['scripts/auditCameraQrMigration.mjs', 'camera QR migration audit helper'],
  ['scripts/cameraQrMigrationSummaryGuard.mjs', 'camera QR migration summary guard helper'],
  ['scripts/checkCameraQrMigrationSummary.mjs', 'camera QR migration summary artifact checker'],
  ['scripts/checkCameraQrMigrationSummaryGuard.mjs', 'camera QR migration summary guard self-check helper'],
  ['scripts/auditMaskedViewMigration.mjs', 'masked-view migration audit helper'],
  ['scripts/maskedViewMigrationSummaryGuard.mjs', 'masked-view migration summary guard helper'],
  ['scripts/checkMaskedViewMigrationSummary.mjs', 'masked-view migration summary artifact checker'],
  ['scripts/checkMaskedViewMigrationSummaryGuard.mjs', 'masked-view migration summary guard self-check helper'],
  ['scripts/auditSecureStorageMigration.mjs', 'secure-storage migration audit helper'],
  ['scripts/secureStorageMigrationSummaryGuard.mjs', 'secure-storage migration summary guard helper'],
  ['scripts/checkSecureStorageMigrationSummary.mjs', 'secure-storage migration summary artifact checker'],
  ['scripts/checkSecureStorageMigrationSummaryGuard.mjs', 'secure-storage migration summary guard self-check helper'],
  ['scripts/secureStorageRemovalReadinessSummaryGuard.mjs', 'secure-storage removal readiness summary guard helper'],
  ['scripts/auditSecureStorageRemovalReadiness.mjs', 'secure-storage removal readiness audit helper'],
  ['scripts/checkSecureStorageRemovalReadinessSummary.mjs', 'secure-storage removal readiness summary artifact checker'],
  ['scripts/checkSecureStorageRemovalReadinessSummaryGuard.mjs', 'secure-storage removal readiness summary guard self-check helper'],
  ['scripts/auditSentryAndroidWarning.mjs', 'Sentry Android warning audit helper'],
  ['scripts/sentryAndroidWarningSummaryGuard.mjs', 'Sentry Android warning summary guard helper'],
  ['scripts/checkSentryAndroidWarningSummary.mjs', 'Sentry Android warning summary artifact checker'],
  ['scripts/checkSentryAndroidWarningSummaryGuard.mjs', 'Sentry Android warning summary guard self-check helper'],
  ['scripts/checkAndroidWarningSourceSummaries.mjs', 'Android warning-source summary aggregate checker'],
  ['scripts/checkAndroidWarningSourceSummariesGuard.mjs', 'Android warning-source summary aggregate guard self-check helper'],
  ['scripts/androidRemainingWarningPlanGuard.mjs', 'Android remaining-warning plan guard helper'],
  ['scripts/checkAndroidRemainingWarningPlan.mjs', 'Android remaining-warning plan checker'],
  ['scripts/checkAndroidRemainingWarningPlanGuard.mjs', 'Android remaining-warning plan guard self-check helper'],
  ['scripts/checkAndroidWarningAuditSummary.mjs', 'Android warning audit summary checker'],
  ['scripts/checkAndroidWarningAuditSummaryGuard.mjs', 'Android warning audit summary guard self-check helper'],
  ['scripts/androidSmokeSummaryGuard.mjs', 'Android smoke summary guard helper'],
  ['scripts/checkAndroidSmokeSummary.mjs', 'Android smoke summary artifact checker'],
  ['scripts/checkAndroidSmokeSummaryGuard.mjs', 'Android smoke summary guard self-check helper'],
  ['scripts/sentryReleasePrereqSummaryGuard.mjs', 'Sentry release prerequisite summary guard helper'],
  ['scripts/checkSentryReleasePrereqSummary.mjs', 'Sentry release prerequisite summary artifact checker'],
  ['scripts/checkSentryReleasePrereqSummaryGuard.mjs', 'Sentry release prerequisite summary guard self-check helper'],
  ['scripts/runSentryReleaseValidationHandoff.mjs', 'Sentry release validation handoff helper'],
  ['scripts/checkSentryReleaseValidationHandoffGuard.mjs', 'Sentry release validation handoff guard self-check helper'],
  ['scripts/codePushReleasePathSummaryGuard.mjs', 'CodePush release path summary guard helper'],
  ['scripts/checkCodePushReleasePathSummary.mjs', 'CodePush release path summary artifact checker'],
  ['scripts/checkCodePushReleasePathSummaryGuard.mjs', 'CodePush release path summary guard self-check helper'],
  ['scripts/codePushMigrationReadinessSummaryGuard.mjs', 'CodePush migration readiness summary guard helper'],
  ['scripts/auditCodePushMigrationReadiness.mjs', 'CodePush migration readiness audit helper'],
  ['scripts/checkCodePushMigrationReadinessSummary.mjs', 'CodePush migration readiness summary artifact checker'],
  ['scripts/checkCodePushMigrationReadinessSummaryGuard.mjs', 'CodePush migration readiness summary guard self-check helper'],
  ['scripts/runCodePushUpdateValidationHandoff.mjs', 'CodePush update validation handoff helper'],
  ['scripts/checkCodePushUpdateValidationHandoffGuard.mjs', 'CodePush update validation handoff guard self-check helper'],
  ['scripts/firebaseReleaseServicesSummaryGuard.mjs', 'Firebase release-services summary guard helper'],
  ['scripts/checkFirebaseReleaseServicesSummary.mjs', 'Firebase release-services summary artifact checker'],
  ['scripts/checkFirebaseReleaseServicesSummaryGuard.mjs', 'Firebase release-services summary guard self-check helper'],
  ['scripts/runFirebaseRuntimeDeliveryHandoff.mjs', 'Firebase runtime delivery handoff helper'],
  ['scripts/checkFirebaseRuntimeDeliveryHandoffGuard.mjs', 'Firebase runtime delivery handoff guard self-check helper'],
  ['scripts/pushNotificationBridgeSummaryGuard.mjs', 'push notification bridge summary guard helper'],
  ['scripts/checkPushNotificationBridgeSummary.mjs', 'push notification bridge summary artifact checker'],
  ['scripts/checkPushNotificationBridgeSummaryGuard.mjs', 'push notification bridge summary guard self-check helper'],
  ['scripts/runIosMacValidationHandoff.mjs', 'iOS macOS validation handoff helper'],
  ['scripts/checkIosMacValidationHandoffGuard.mjs', 'iOS macOS validation handoff guard self-check helper'],
  ['scripts/checkReleaseServicesSummaryArtifacts.mjs', 'release-services summary artifact checker'],
  ['scripts/checkReleaseServicesSummaryGuard.mjs', 'release-services summary guard self-check helper'],
];

export const requiredAndroidDevPackageScripts = [
  'android:dev:assemble',
  'android:dev:smoke',
  'android:dev:verify',
  'android:dev:audit-smoke',
  'android:dev:audit-warnings',
  'android:dev:check-light',
  'node:runtime-transition:audit',
  'check:node-runtime-transition-guard',
  'check:rn-upgrade-path-audit-guard',
  'rn:upgrade-path:audit',
  'check:rn-target-snapshot-guard',
  'rn:target-snapshot:audit',
  'rn:target-snapshot:current',
  'check:rn-target-snapshot-current-guard',
  'rn:target-snapshot:check-summary',
  'check:rn-target-snapshot-summary-guard',
  'git-deps:snapshot:audit',
  'git-deps:snapshot:check-summary',
  'check:git-deps-snapshot-summary-guard',
  'node-fetch:resolution:audit',
  'node-fetch:resolution:check-summary',
  'check:node-fetch-resolution-summary-guard',
  'react19:impact:audit',
  'check:react19-impact-guard',
  'react:package-coupling:audit',
  'check:react-package-coupling-guard',
  'test:type-coupling:audit',
  'check:test-type-coupling-guard',
  'camera:candidate:audit',
  'camera:candidate:check-summary',
  'check:camera-candidate-summary-guard',
  'camera:qr-migration:audit',
  'camera:qr-migration:check-summary',
  'check:camera-qr-migration-summary-guard',
  'masked-view:migration:audit',
  'masked-view:migration:check-summary',
  'check:masked-view-migration-summary-guard',
  'secure-storage:migration:audit',
  'secure-storage:migration:check-summary',
  'check:secure-storage-migration-summary-guard',
  'secure-storage:removal-readiness:audit',
  'secure-storage:removal-readiness:check-summary',
  'check:secure-storage-removal-readiness-summary-guard',
  'sentry:android-warning:audit',
  'sentry:android-warning:check-summary',
  'check:sentry-android-warning-summary-guard',
  'android:dev:check-warning-source-summaries',
  'check:android-warning-source-summaries-guard',
  'check:android-remaining-warning-plan',
  'check:android-remaining-warning-plan-guard',
  'android:dev:check-warning-audit-summary',
  'check:android-warning-audit-summary-guard',
  'android:dev:check-smoke-summary',
  'check:android-smoke-summary-guard',
  'sentry:release:prereq-check-summary',
  'check:sentry-release-prereq-summary-guard',
  'sentry:release:validation:handoff',
  'sentry:release:validation:handoff:dry-run',
  'check:sentry-release-validation-handoff-guard',
  'codepush:release:path-check-summary',
  'check:codepush-release-path-summary-guard',
  'codepush:migration:readiness-audit',
  'codepush:migration:readiness-check-summary',
  'check:codepush-migration-readiness-summary-guard',
  'codepush:update:validation:handoff',
  'codepush:update:validation:handoff:dry-run',
  'check:codepush-update-validation-handoff-guard',
  'firebase:release-services:check-summary',
  'check:firebase-release-services-summary-guard',
  'firebase:runtime:delivery:handoff',
  'firebase:runtime:delivery:handoff:dry-run',
  'check:firebase-runtime-delivery-handoff-guard',
  'push-notification:bridge-check-summary',
  'check:push-notification-bridge-summary-guard',
  'ios:mac-validation:handoff',
  'ios:mac-validation:handoff:dry-run',
  'check:ios-mac-validation-handoff-guard',
  'release-services:check-summaries',
  'check:release-services-summary-guard',
  'rn:baseline:preflight',
];

export const requiredAndroidDevPackageScriptSnippets = [
  ['android:dev:verify', 'android:dev:assemble', 'dev verification must rebuild the dev APK'],
  ['android:dev:verify', 'android:dev:env-audit', 'dev verification must verify the local Android toolchain before Gradle runs'],
  ['android:dev:verify', 'android:dev:smoke', 'dev verification must run emulator smoke'],
  ['android:dev:verify', 'android:dev:check-smoke-summary', 'dev verification must validate the smoke summary artifact'],
  ['android:dev:audit-smoke', 'android:dev:env-audit', 'audit-smoke must verify the local Android toolchain before Gradle runs'],
  ['android:dev:audit-smoke', 'android:dev:audit-warnings', 'audit-smoke must refresh the Android warning audit'],
  ['android:dev:audit-smoke', 'android:dev:smoke', 'audit-smoke must run emulator smoke'],
  ['android:dev:audit-smoke', 'android:dev:check-artifacts', 'audit-smoke must validate generated Android artifacts'],
];

export const getAndroidDevEnvironmentIssues = ({
  javaCommand,
  javaMajor,
  javaDetected,
  javaHome,
  nodeVersion,
  nvmrc,
  androidSdkRoot,
  androidSdkRootExists,
  androidPlatformDirExists,
  androidBuildToolsDirExists,
  adbCandidate,
  adbReady,
  existingFiles,
  packageScripts,
  packageScriptCommands = new Map(),
}) => {
  const errors = [];
  const warnings = [];
  const nodeMajor = Number((nodeVersion || '').split('.')[0]);

  if (!javaDetected || !javaMajor) {
    errors.push(`Unable to detect Java version from ${javaCommand}`);
  } else if (Number(javaMajor) !== 17) {
    errors.push(`Android Gradle build requires JDK 17 after the AGP 8.13 upgrade; current Java major is ${javaMajor}`);
  }

  if (!javaHome) {
    warnings.push('JAVA_HOME is not set; Gradle runner will fall back to java from PATH.');
  }

  if (nodeMajor !== 24) {
    warnings.push(`Current Node is ${nodeVersion}; Metro/dev runtime is documented for Node 24 (${nvmrc || 'no .nvmrc found'}).`);
  }

  if (!androidSdkRoot) {
    warnings.push('ANDROID_SDK_ROOT/ANDROID_HOME is not set; adb lookup will fall back to LOCALAPPDATA or PATH.');
  } else if (!androidSdkRootExists) {
    errors.push(`Android SDK root does not exist: ${androidSdkRoot}`);
  } else {
    if (!androidPlatformDirExists) {
      errors.push(`Android SDK platform ${requiredAndroidPlatform} is missing under ${path.join(androidSdkRoot, 'platforms')}`);
    }

    if (!androidBuildToolsDirExists) {
      errors.push(`Android SDK build tools ${requiredAndroidBuildTools} are missing under ${path.join(androidSdkRoot, 'build-tools')}`);
    }
  }

  if (!adbCandidate || !adbReady) {
    errors.push('Unable to run adb version from Android SDK, LOCALAPPDATA, or PATH.');
  }

  requiredAndroidDevFiles.forEach(([relativePath, label]) => {
    if (!existingFiles.has(relativePath)) {
      errors.push(`${label} is missing at ${relativePath}`);
    }
  });

  requiredAndroidDevPackageScripts.forEach(scriptName => {
    if (!packageScripts.has(scriptName)) {
      errors.push(`package.json is missing ${scriptName}`);
    }
  });

  requiredAndroidDevPackageScriptSnippets.forEach(([scriptName, snippet, label]) => {
    const command = packageScriptCommands.get(scriptName) || '';
    if (!command.includes(snippet)) {
      errors.push(`package.json script ${scriptName} must include ${snippet} (${label})`);
    }
  });

  return { errors, warnings };
};

const collectEnvironment = () => {
  const javaCommand = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
    : 'java';
  const javaVersion = run(javaCommand, ['-version']);
  const javaOutput = trimOutput(javaVersion);
  const javaMajor = javaOutput.match(/version "(\d+)/)?.[1];
  const nodeVersion = process.versions.node;
  const androidSdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || '';
  const androidPlatformDir = androidSdkRoot ? path.join(androidSdkRoot, 'platforms', requiredAndroidPlatform) : '';
  const androidBuildToolsDir = androidSdkRoot ? path.join(androidSdkRoot, 'build-tools', requiredAndroidBuildTools) : '';
  const adbCandidates = [
    androidSdkRoot ? path.join(androidSdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : '',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe') : '',
    'adb',
  ].filter(Boolean);
  const adbCandidate = adbCandidates.find(candidate => candidate === 'adb' || existsSync(candidate));
  const adbVersion = adbCandidate ? run(adbCandidate, ['version']) : null;
  const packageJson = JSON.parse(read('package.json'));
  const nvmrc = exists('.nvmrc') ? read('.nvmrc').trim() : '';
  const existingFiles = new Set(requiredAndroidDevFiles.map(([relativePath]) => relativePath).filter(exists));
  const packageScripts = new Set(Object.keys(packageJson.scripts || {}));
  const packageScriptCommands = new Map(Object.entries(packageJson.scripts || {}));

  return {
    javaCommand,
    javaMajor,
    javaDetected: !javaVersion.error && Boolean(javaMajor),
    javaHome: process.env.JAVA_HOME || '',
    nodeVersion,
    nvmrc,
    androidSdkRoot,
    androidSdkRootExists: androidSdkRoot ? existsSync(androidSdkRoot) : false,
    androidPlatformDirExists: androidPlatformDir ? existsSync(androidPlatformDir) : false,
    androidBuildToolsDirExists: androidBuildToolsDir ? existsSync(androidBuildToolsDir) : false,
    adbCandidate,
    adbReady: Boolean(adbCandidate && !adbVersion?.error && adbVersion?.status === 0),
    existingFiles,
    packageScripts,
    packageScriptCommands,
  };
};

const printReport = environment => {
  const { errors, warnings } = getAndroidDevEnvironmentIssues(environment);

  console.log('Android dev environment audit');
  console.log(`Node.js: ${environment.nodeVersion}`);
  console.log(`.nvmrc: ${environment.nvmrc || '<missing>'}`);
  console.log(`JAVA_HOME: ${environment.javaHome || '<unset>'}`);
  console.log(`Java executable: ${environment.javaCommand}`);
  console.log(`Java major: ${environment.javaMajor || '<unknown>'}`);
  console.log(`Android SDK root: ${environment.androidSdkRoot || '<unset>'}`);
  console.log(`Required Android platform: ${requiredAndroidPlatform}`);
  console.log(`Required Android build tools: ${requiredAndroidBuildTools}`);
  console.log(`ADB executable: ${environment.adbCandidate || '<missing>'}`);

  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.log('Android dev environment is not ready:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('Android dev environment has the required Java version, Android SDK 36 platform/build tools, adb access, Gradle wrappers, and validation scripts.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}
