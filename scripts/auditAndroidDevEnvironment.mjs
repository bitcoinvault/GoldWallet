import { existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const run = (command, args = []) =>
  spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
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
  ['scripts/auditReact19Impact.mjs', 'React 19 impact audit helper'],
  ['scripts/checkReact19ImpactGuard.mjs', 'React 19 impact audit guard helper'],
  ['scripts/auditReactPackageCoupling.mjs', 'React package coupling audit helper'],
  ['scripts/checkReactPackageCouplingGuard.mjs', 'React package coupling guard helper'],
  ['scripts/auditTestTypeCoupling.mjs', 'test/type coupling audit helper'],
  ['scripts/checkTestTypeCouplingGuard.mjs', 'test/type coupling guard helper'],
  ['scripts/cameraQrMigrationSummaryGuard.mjs', 'camera QR migration summary guard helper'],
  ['scripts/checkCameraQrMigrationSummary.mjs', 'camera QR migration summary artifact checker'],
  ['scripts/checkCameraQrMigrationSummaryGuard.mjs', 'camera QR migration summary guard self-check helper'],
  ['scripts/sentryAndroidWarningSummaryGuard.mjs', 'Sentry Android warning summary guard helper'],
  ['scripts/checkSentryAndroidWarningSummary.mjs', 'Sentry Android warning summary artifact checker'],
  ['scripts/checkSentryAndroidWarningSummaryGuard.mjs', 'Sentry Android warning summary guard self-check helper'],
  ['scripts/sentryReleasePrereqSummaryGuard.mjs', 'Sentry release prerequisite summary guard helper'],
  ['scripts/checkSentryReleasePrereqSummary.mjs', 'Sentry release prerequisite summary artifact checker'],
  ['scripts/checkSentryReleasePrereqSummaryGuard.mjs', 'Sentry release prerequisite summary guard self-check helper'],
  ['scripts/codePushReleasePathSummaryGuard.mjs', 'CodePush release path summary guard helper'],
  ['scripts/checkCodePushReleasePathSummary.mjs', 'CodePush release path summary artifact checker'],
  ['scripts/checkCodePushReleasePathSummaryGuard.mjs', 'CodePush release path summary guard self-check helper'],
  ['scripts/firebaseReleaseServicesSummaryGuard.mjs', 'Firebase release-services summary guard helper'],
  ['scripts/checkFirebaseReleaseServicesSummary.mjs', 'Firebase release-services summary artifact checker'],
  ['scripts/checkFirebaseReleaseServicesSummaryGuard.mjs', 'Firebase release-services summary guard self-check helper'],
  ['scripts/pushNotificationBridgeSummaryGuard.mjs', 'push notification bridge summary guard helper'],
  ['scripts/checkPushNotificationBridgeSummary.mjs', 'push notification bridge summary artifact checker'],
  ['scripts/checkPushNotificationBridgeSummaryGuard.mjs', 'push notification bridge summary guard self-check helper'],
  ['scripts/checkReleaseServicesSummaryArtifacts.mjs', 'release-services summary artifact checker'],
  ['scripts/checkReleaseServicesSummaryGuard.mjs', 'release-services summary guard self-check helper'],
];

export const requiredAndroidDevPackageScripts = [
  'android:dev:assemble',
  'android:dev:smoke',
  'android:dev:verify',
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
  'react19:impact:audit',
  'check:react19-impact-guard',
  'react:package-coupling:audit',
  'check:react-package-coupling-guard',
  'test:type-coupling:audit',
  'check:test-type-coupling-guard',
  'camera:qr-migration:check-summary',
  'check:camera-qr-migration-summary-guard',
  'sentry:android-warning:check-summary',
  'check:sentry-android-warning-summary-guard',
  'sentry:release:prereq-check-summary',
  'check:sentry-release-prereq-summary-guard',
  'codepush:release:path-check-summary',
  'check:codepush-release-path-summary-guard',
  'firebase:release-services:check-summary',
  'check:firebase-release-services-summary-guard',
  'push-notification:bridge-check-summary',
  'check:push-notification-bridge-summary-guard',
  'release-services:check-summaries',
  'check:release-services-summary-guard',
  'rn:baseline:preflight',
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
  adbCandidate,
  adbReady,
  existingFiles,
  packageScripts,
}) => {
  const errors = [];
  const warnings = [];
  const nodeMajor = Number((nodeVersion || '').split('.')[0]);

  if (!javaDetected || !javaMajor) {
    errors.push(`Unable to detect Java version from ${javaCommand}`);
  } else if (Number(javaMajor) < 11 || Number(javaMajor) > 17) {
    errors.push(`Android Gradle build supports JDK 11-17; current Java major is ${javaMajor}`);
  }

  if (!javaHome) {
    warnings.push('JAVA_HOME is not set; Gradle runner will fall back to java from PATH.');
  }

  if (nodeMajor !== 16) {
    warnings.push(`Current Node is ${nodeVersion}; Metro/dev runtime is documented for Node 16 (${nvmrc || 'no .nvmrc found'}).`);
  }

  if (!androidSdkRoot) {
    warnings.push('ANDROID_SDK_ROOT/ANDROID_HOME is not set; adb lookup will fall back to LOCALAPPDATA or PATH.');
  } else if (!androidSdkRootExists) {
    errors.push(`Android SDK root does not exist: ${androidSdkRoot}`);
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

  return {
    javaCommand,
    javaMajor,
    javaDetected: !javaVersion.error && Boolean(javaMajor),
    javaHome: process.env.JAVA_HOME || '',
    nodeVersion,
    nvmrc,
    androidSdkRoot,
    androidSdkRootExists: androidSdkRoot ? existsSync(androidSdkRoot) : false,
    adbCandidate,
    adbReady: Boolean(adbCandidate && !adbVersion?.error && adbVersion?.status === 0),
    existingFiles,
    packageScripts,
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

  console.log('Android dev environment has the required Java range, adb access, Gradle wrappers, and validation scripts.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}
