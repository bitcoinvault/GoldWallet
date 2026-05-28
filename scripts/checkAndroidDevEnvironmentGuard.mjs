import {
  getAndroidDevEnvironmentIssues,
  requiredAndroidDevFiles,
  requiredAndroidDevPackageScripts,
} from './auditAndroidDevEnvironment.mjs';

const validEnvironment = {
  javaCommand: 'D:\\tmp\\jdks\\temurin17\\jdk-17.0.19+10\\bin\\java.exe',
  javaMajor: '17',
  javaDetected: true,
  javaHome: 'D:\\tmp\\jdks\\temurin17\\jdk-17.0.19+10',
  nodeVersion: '16.20.2',
  nvmrc: '16.20.2',
  androidSdkRoot: 'C:\\Users\\User\\AppData\\Local\\Android\\Sdk',
  androidSdkRootExists: true,
  adbCandidate: 'C:\\Users\\User\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe',
  adbReady: true,
  existingFiles: new Set(requiredAndroidDevFiles.map(([relativePath]) => relativePath)),
  packageScripts: new Set(requiredAndroidDevPackageScripts),
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

assertAccepted('Valid Android dev environment fixture', validEnvironment);

assertRejected('Unsupported JDK fixture', { ...validEnvironment, javaMajor: '21' }, 'JDK 11-17');
assertRejected('Missing Java fixture', { ...validEnvironment, javaDetected: false, javaMajor: undefined }, 'Unable to detect Java version');
assertRejected('Missing Android SDK fixture', { ...validEnvironment, androidSdkRootExists: false }, 'Android SDK root does not exist');
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
  'Missing dev verification package script fixture',
  {
    ...validEnvironment,
    packageScripts: new Set([...validEnvironment.packageScripts].filter(scriptName => scriptName !== 'android:dev:verify')),
  },
  'package.json is missing android:dev:verify',
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

console.log('Android dev environment audit guard checks are valid.');
