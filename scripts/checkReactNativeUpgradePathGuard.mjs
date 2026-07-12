import {
  expectedFoundationTargetOnlineRefresh,
  expectedReactNativeBaselinePreflight,
  expectedReactNativeOnlinePreflight,
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
    '@react-native/babel-preset': expectedReactNativeUpgradePathBaseline.babelPreset,
    '@react-native/metro-config': expectedReactNativeUpgradePathBaseline.metroConfig,
  },
  scripts: {
    'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
    'node:runtime-transition:audit': 'node scripts/auditNodeRuntimeTransition.mjs',
    'check:node-runtime-transition-guard': 'node scripts/checkNodeRuntimeTransitionGuard.mjs',
    'rn:target-snapshot:audit': 'node scripts/auditReactNativeTargetSnapshot.mjs',
    'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
    'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
    'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
    'react:package-coupling:audit': 'node scripts/auditReactPackageCoupling.mjs',
    'check:react-package-coupling-guard': 'node scripts/checkReactPackageCouplingGuard.mjs',
    'react:renderer-version:audit': 'node scripts/auditReactNativeRendererVersion.mjs',
    'check:react-renderer-version-guard': 'node scripts/checkReactNativeRendererVersionGuard.mjs',
    'test:type-coupling:audit': 'node scripts/auditTestTypeCoupling.mjs',
    'check:test-type-coupling-guard': 'node scripts/checkTestTypeCouplingGuard.mjs',
    'wallet:crypto-runtime:audit': 'node scripts/auditWalletCryptoRuntime.mjs',
    'husky:tooling:audit': 'node scripts/auditHuskyTooling.mjs',
    'prettier:tooling:audit': 'node scripts/auditPrettierTooling.mjs',
    'jest:tooling:audit': 'node scripts/auditJestTooling.mjs',
    'crypto-js:runtime:audit': 'node scripts/auditCryptoJsRuntime.mjs',
    'state:runtime:audit': 'node scripts/auditStateRuntime.mjs',
    'lodash:runtime:audit': 'node scripts/auditLodashRuntime.mjs',
    'wallet:crypto-latest-snapshot:audit': 'node scripts/auditWalletCryptoLatestSnapshot.mjs',
    'wallet:crypto-latest-snapshot:check-summary': 'node scripts/checkWalletCryptoLatestSnapshotSummary.mjs',
    'check:wallet-crypto-latest-snapshot-summary-guard': 'node scripts/checkWalletCryptoLatestSnapshotSummaryGuard.mjs',
    'storage-network:latest-snapshot:audit': 'node scripts/auditStorageNetworkLatestSnapshot.mjs',
    'storage-network:latest-snapshot:check-summary': 'node scripts/checkStorageNetworkLatestSnapshotSummary.mjs',
    'check:storage-network-latest-snapshot-summary-guard': 'node scripts/checkStorageNetworkLatestSnapshotSummaryGuard.mjs',
    'direct-outdated:snapshot:audit': 'node scripts/auditDirectOutdatedSnapshot.mjs',
    'direct-outdated:snapshot:check-summary': 'node scripts/checkDirectOutdatedSnapshotSummary.mjs',
    'check:direct-outdated-snapshot-summary-guard': 'node scripts/checkDirectOutdatedSnapshotSummaryGuard.mjs',
    'react:patch-blocker:audit': 'node scripts/auditReactPatchBlocker.mjs',
    'react:patch-blocker:check-summary': 'node scripts/checkReactPatchBlockerSummary.mjs',
    'babel8:migration-probe:audit': 'node scripts/auditBabel8MigrationProbe.mjs',
    'babel8:migration-probe:check-summary': 'node scripts/checkBabel8MigrationProbeSummary.mjs',
    'babel8:migration-probe:check': 'node scripts/checkBabel8MigrationProbe.mjs',
    'typescript7:compatibility-probe:audit': 'node scripts/auditTypescript7CompatibilityProbe.mjs',
    'typescript7:compatibility-probe:check-summary': 'node scripts/checkTypescript7CompatibilityProbeSummary.mjs',
    'check:typescript7-compatibility-probe-guard': 'node scripts/checkTypescript7CompatibilityProbeGuard.mjs',
    'plist:major-compatibility:audit': 'node scripts/auditPlistMajorCompatibility.mjs',
    'plist:major-compatibility:check-summary': 'node scripts/checkPlistMajorCompatibilitySummary.mjs',
    'check:plist-major-compatibility-summary-guard': 'node scripts/checkPlistMajorCompatibilitySummaryGuard.mjs',
    'foundation:target:refresh-online': expectedFoundationTargetOnlineRefresh,
    'foundation:target:check-summaries': 'node scripts/checkFoundationTargetSummaryArtifacts.mjs',
    'check:foundation-target-summary-guard': 'node scripts/checkFoundationTargetSummaryGuard.mjs',
    'rn:baseline:preflight': expectedReactNativeBaselinePreflight,
    'rn:baseline:preflight:online': expectedReactNativeOnlinePreflight,
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
assertRejected('Wrong Node runtime fixture', { ...validEnvironment, nvmrc: '20.19.4' }, '.nvmrc is 20.19.4');
assertRejected(
  'Wrong target SDK fixture',
  {
    ...validEnvironment,
    androidBuildGradle: validEnvironment.androidBuildGradle.replace('targetSdkVersion = 36', 'targetSdkVersion = 35'),
  },
  'targetSdkVersion is 35',
);
assertRejected(
  'Wrong Gradle wrapper fixture',
  { ...validEnvironment, gradleWrapperProperties: 'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.0-all.zip' },
  'Gradle wrapper 8.13',
);
assertRejected(
  'Missing foundation target online refresh package script fixture',
  {
    ...validEnvironment,
    scripts: { ...validEnvironment.scripts, 'foundation:target:refresh-online': 'yarn rn:target-snapshot:current' },
  },
  'foundation:target:refresh-online',
);
assertRejected(
  'Missing plist major compatibility package script fixture',
  {
    ...validEnvironment,
    scripts: { ...validEnvironment.scripts, 'plist:major-compatibility:audit': 'node scripts/missingPlistAudit.mjs' },
  },
  'plist:major-compatibility:audit',
);
assertRejected(
  'Missing RN baseline preflight package script fixture',
  {
    ...validEnvironment,
    scripts: {
      'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
      'node:runtime-transition:audit': 'node scripts/auditNodeRuntimeTransition.mjs',
      'check:node-runtime-transition-guard': 'node scripts/checkNodeRuntimeTransitionGuard.mjs',
      'rn:target-snapshot:audit': 'node scripts/auditReactNativeTargetSnapshot.mjs',
      'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
      'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
      'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
      'react:package-coupling:audit': 'node scripts/auditReactPackageCoupling.mjs',
      'check:react-package-coupling-guard': 'node scripts/checkReactPackageCouplingGuard.mjs',
      'test:type-coupling:audit': 'node scripts/auditTestTypeCoupling.mjs',
      'check:test-type-coupling-guard': 'node scripts/checkTestTypeCouplingGuard.mjs',
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
      'node:runtime-transition:audit': 'node scripts/auditNodeRuntimeTransition.mjs',
      'check:node-runtime-transition-guard': 'node scripts/checkNodeRuntimeTransitionGuard.mjs',
      'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
      'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
      'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
      'react:package-coupling:audit': 'node scripts/auditReactPackageCoupling.mjs',
      'check:react-package-coupling-guard': 'node scripts/checkReactPackageCouplingGuard.mjs',
      'test:type-coupling:audit': 'node scripts/auditTestTypeCoupling.mjs',
      'check:test-type-coupling-guard': 'node scripts/checkTestTypeCouplingGuard.mjs',
      'rn:baseline:preflight': expectedReactNativeBaselinePreflight,
      'rn:baseline:preflight:online': expectedReactNativeOnlinePreflight,
    },
  },
  'rn:target-snapshot:audit',
);
assertRejected(
  'Missing Node runtime transition package script fixture',
  {
    ...validEnvironment,
    scripts: {
      'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
      'check:node-runtime-transition-guard': 'node scripts/checkNodeRuntimeTransitionGuard.mjs',
      'rn:target-snapshot:audit': 'node scripts/auditReactNativeTargetSnapshot.mjs',
      'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
      'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
      'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
      'react:package-coupling:audit': 'node scripts/auditReactPackageCoupling.mjs',
      'check:react-package-coupling-guard': 'node scripts/checkReactPackageCouplingGuard.mjs',
      'test:type-coupling:audit': 'node scripts/auditTestTypeCoupling.mjs',
      'check:test-type-coupling-guard': 'node scripts/checkTestTypeCouplingGuard.mjs',
      'rn:baseline:preflight': expectedReactNativeBaselinePreflight,
    },
  },
  'node:runtime-transition:audit',
);
assertRejected(
  'Missing React 19 impact package script fixture',
  {
    ...validEnvironment,
    scripts: {
      'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
      'node:runtime-transition:audit': 'node scripts/auditNodeRuntimeTransition.mjs',
      'check:node-runtime-transition-guard': 'node scripts/checkNodeRuntimeTransitionGuard.mjs',
      'rn:target-snapshot:audit': 'node scripts/auditReactNativeTargetSnapshot.mjs',
      'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
      'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
      'react:package-coupling:audit': 'node scripts/auditReactPackageCoupling.mjs',
      'check:react-package-coupling-guard': 'node scripts/checkReactPackageCouplingGuard.mjs',
      'test:type-coupling:audit': 'node scripts/auditTestTypeCoupling.mjs',
      'check:test-type-coupling-guard': 'node scripts/checkTestTypeCouplingGuard.mjs',
      'rn:baseline:preflight': expectedReactNativeBaselinePreflight,
    },
  },
  'react19:impact:audit',
);
assertRejected(
  'Missing React package coupling package script fixture',
  {
    ...validEnvironment,
    scripts: {
      'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
      'node:runtime-transition:audit': 'node scripts/auditNodeRuntimeTransition.mjs',
      'check:node-runtime-transition-guard': 'node scripts/checkNodeRuntimeTransitionGuard.mjs',
      'rn:target-snapshot:audit': 'node scripts/auditReactNativeTargetSnapshot.mjs',
      'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
      'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
      'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
      'check:react-package-coupling-guard': 'node scripts/checkReactPackageCouplingGuard.mjs',
      'test:type-coupling:audit': 'node scripts/auditTestTypeCoupling.mjs',
      'check:test-type-coupling-guard': 'node scripts/checkTestTypeCouplingGuard.mjs',
      'rn:baseline:preflight': expectedReactNativeBaselinePreflight,
    },
  },
  'react:package-coupling:audit',
);
assertRejected(
  'Missing test/type coupling package script fixture',
  {
    ...validEnvironment,
    scripts: {
      'rn:upgrade-path:audit': 'node scripts/auditReactNativeUpgradePath.mjs',
      'node:runtime-transition:audit': 'node scripts/auditNodeRuntimeTransition.mjs',
      'check:node-runtime-transition-guard': 'node scripts/checkNodeRuntimeTransitionGuard.mjs',
      'rn:target-snapshot:audit': 'node scripts/auditReactNativeTargetSnapshot.mjs',
      'check:rn-target-snapshot-guard': 'node scripts/checkReactNativeTargetSnapshotGuard.mjs',
      'react19:impact:audit': 'node scripts/auditReact19Impact.mjs',
      'check:react19-impact-guard': 'node scripts/checkReact19ImpactGuard.mjs',
      'react:package-coupling:audit': 'node scripts/auditReactPackageCoupling.mjs',
      'check:react-package-coupling-guard': 'node scripts/checkReactPackageCouplingGuard.mjs',
      'check:test-type-coupling-guard': 'node scripts/checkTestTypeCouplingGuard.mjs',
      'rn:baseline:preflight': expectedReactNativeBaselinePreflight,
    },
  },
  'test:type-coupling:audit',
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
