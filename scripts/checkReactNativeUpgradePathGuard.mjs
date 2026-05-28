import {
  expectedReactNativeBaselinePreflight,
  expectedReactNativeUpgradePathBaseline,
  getReactNativeUpgradePathIssues,
  requiredReactNativeUpgradePathDocs,
  requiredReactNativeUpgradePathSnippets,
} from './auditReactNativeUpgradePath.mjs';

const validDocs = requiredReactNativeUpgradePathSnippets.reduce((docs, [relativePath, snippet]) => {
  docs[relativePath] = docs[relativePath] ? `${docs[relativePath]}\n${snippet}` : snippet;
  return docs;
}, {});

const validEnvironment = {
  dependencies: {
    react: expectedReactNativeUpgradePathBaseline.react,
    'react-native': expectedReactNativeUpgradePathBaseline.reactNative,
  },
  devDependencies: {
    'metro-react-native-babel-preset': expectedReactNativeUpgradePathBaseline.metroPreset,
  },
  scripts: {
    'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
    'rn:target-snapshot:audit': 'node scripts/auditReactNativeTargetSnapshot.mjs',
    'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
    'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
    'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
    'rn:baseline:preflight': expectedReactNativeBaselinePreflight,
  },
  nvmrc: expectedReactNativeUpgradePathBaseline.nodeRuntime,
  androidBuildGradle: `
    buildToolsVersion = "${expectedReactNativeUpgradePathBaseline.buildToolsVersion}"
    compileSdkVersion = ${expectedReactNativeUpgradePathBaseline.compileSdkVersion}
    targetSdkVersion = ${expectedReactNativeUpgradePathBaseline.targetSdkVersion}
    classpath("com.android.tools.build:gradle:${expectedReactNativeUpgradePathBaseline.androidGradlePlugin}")
  `,
  gradleWrapperProperties: `distributionUrl=https\\://services.gradle.org/distributions/gradle-${expectedReactNativeUpgradePathBaseline.gradleWrapper}-all.zip`,
  docs: validDocs,
  existingDocs: new Set(requiredReactNativeUpgradePathDocs),
};

const assertAccepted = (label, environment) => {
  const { errors } = getReactNativeUpgradePathIssues(environment);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, environment, expectedError) => {
  const { errors } = getReactNativeUpgradePathIssues(environment);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid React Native upgrade path fixture', validEnvironment);

assertRejected(
  'Wrong React Native fixture',
  { ...validEnvironment, dependencies: { ...validEnvironment.dependencies, 'react-native': '0.69.0' } },
  'react-native@0.69.0',
);
assertRejected('Wrong Node runtime fixture', { ...validEnvironment, nvmrc: '18.20.0' }, '.nvmrc is 18.20.0');
assertRejected(
  'Wrong target SDK fixture',
  {
    ...validEnvironment,
    androidBuildGradle: validEnvironment.androidBuildGradle.replace('targetSdkVersion = 33', 'targetSdkVersion = 34'),
  },
  'targetSdkVersion is 34',
);
assertRejected(
  'Wrong Gradle wrapper fixture',
  { ...validEnvironment, gradleWrapperProperties: 'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.0-all.zip' },
  'Gradle wrapper 7.5.1',
);
assertRejected(
  'Missing RN baseline preflight package script fixture',
  {
    ...validEnvironment,
    scripts: {
      'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
      'rn:target-snapshot:audit': 'node scripts/auditReactNativeTargetSnapshot.mjs',
      'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
      'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
      'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
    },
  },
  'rn:baseline:preflight',
);
assertRejected(
  'Missing RN target snapshot package script fixture',
  {
    ...validEnvironment,
    scripts: {
      'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
      'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
      'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
      'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
      'rn:baseline:preflight': expectedReactNativeBaselinePreflight,
    },
  },
  'rn:target-snapshot:audit',
);
assertRejected(
  'Missing React 19 impact package script fixture',
  {
    ...validEnvironment,
    scripts: {
      'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
      'rn:target-snapshot:audit': 'node scripts/auditReactNativeTargetSnapshot.mjs',
      'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
      'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
      'rn:baseline:preflight': expectedReactNativeBaselinePreflight,
    },
  },
  'react19:impact:audit',
);
assertRejected(
  'Missing docs fixture',
  { ...validEnvironment, existingDocs: new Set(requiredReactNativeUpgradePathDocs.filter(relativePath => relativePath !== 'docs/react-native-upgrade-path.md')) },
  'docs/react-native-upgrade-path.md is missing',
);
assertRejected(
  'Missing documentation snippet fixture',
  { ...validEnvironment, docs: { ...validEnvironment.docs, 'docs/react-native-upgrade-path.md': '' } },
  'docs/react-native-upgrade-path.md is missing',
);

console.log('React Native upgrade path audit guard checks are valid.');
