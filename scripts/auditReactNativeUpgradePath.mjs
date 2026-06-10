import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const androidBuildGradle = read('android/build.gradle');
const gradleWrapperProperties = read('android/gradle/wrapper/gradle-wrapper.properties');
const nvmrc = read('.nvmrc').trim();

export const expectedReactNativeUpgradePathBaseline = {
  reactNative: '0.86.0',
  react: '19.2.3',
  babelPreset: '0.86.0',
  metroConfig: '0.86.0',
  nodeRuntime: '24.16.0',
  buildToolsVersion: '36.0.0',
  compileSdkVersion: '36',
  targetSdkVersion: '36',
  androidGradlePlugin: '8.13.2',
  gradleWrapper: '8.13',
};

export const expectedReactNativeBaselinePreflight =
  'yarn check:node-runtime-version && yarn android:dev:check-light && yarn metro:dev-runtime:audit && yarn check:node-runtime-transition-guard && yarn node:runtime-transition:audit && yarn lint-staged:tooling:audit && yarn husky:tooling:audit && yarn prettier:tooling:audit && yarn jest:tooling:audit && yarn upgrade:strategy:audit && yarn rn:upgrade-path:audit && yarn rn:076-foundation:audit && yarn check:foundation-target-summary-guard && yarn check:rn-target-snapshot-guard && yarn check:rn-target-snapshot-current-guard && yarn rn:target-snapshot:audit && yarn check:react19-impact-guard && yarn react19:impact:audit && yarn check:react-package-coupling-guard && yarn react:package-coupling:audit && yarn check:react-renderer-version-guard && yarn react:renderer-version:audit && yarn check:test-type-coupling-guard && yarn test:type-coupling:audit && yarn check:detox-readiness && yarn wallet:crypto-runtime:audit && yarn crypto-js:runtime:audit && yarn state:runtime:audit && yarn lodash:runtime:audit && yarn check:wallet-crypto-latest-snapshot-summary-guard && yarn check:direct-outdated-snapshot-summary-guard && yarn camera:candidate:audit && yarn camera:candidate:check-summary && yarn camera:qr-migration:audit && yarn camera:qr-migration:check-summary && yarn check:camera-qr-validation-handoff-guard && yarn masked-view:migration:audit && yarn masked-view:migration:check-summary && yarn check:secure-storage-release-validation-handoff-guard && yarn secure-storage:migration:audit && yarn secure-storage:migration:check-summary && yarn secure-storage:removal-readiness:audit && yarn secure-storage:removal-readiness:check-summary && yarn check:explorer-env-config-readiness-guard && yarn check:explorer-env-config-readiness && yarn check:store-metadata-readiness-guard && yarn check:store-metadata-readiness && yarn sentry:android-warning:audit && yarn sentry:android-warning:check-summary && yarn check:android-warning-source-summaries-guard && yarn android:dev:check-warning-source-summaries && yarn check:android-warning-audit-summary-guard && yarn android:dev:check-warning-audit-summary && yarn check:android-smoke-summary-guard && yarn android:dev:check-smoke-summary && yarn check:sentry-properties-generator && yarn check:sentry-release-validation-handoff-guard && yarn check:sentry-credential-handoff-guard && yarn sentry:release:prereq-audit && yarn sentry:release:prereq-check-summary && yarn firebase:release-services:audit && yarn firebase:release-services:check-summary && yarn check:firebase-runtime-delivery-handoff-guard && yarn check:codepush-update-validation-handoff-guard && yarn codepush:release:path-audit && yarn codepush:release:path-check-summary && yarn codepush:migration:readiness-audit && yarn codepush:migration:readiness-check-summary && yarn codepush:removal-readiness:audit && yarn codepush:removal-readiness:check-summary && yarn check:codepush-decision-handoff-guard && yarn push-notification:bridge-audit && yarn push-notification:bridge-check-summary && yarn check:ios-release-readiness-audit-guard && yarn check:ios-release-readiness-summary-guard && yarn ios:release:readiness:audit && yarn ios:release:readiness:check-summary && yarn check:ios-mac-validation-prereq-summary-guard && yarn ios:mac-validation-prereq:audit && yarn ios:mac-validation-prereq:check-summary && yarn check:ios-mac-validation-handoff-guard && yarn check:android-release-apk-manifest-guard && yarn check:release-services-validation-handoff-guard && yarn check:release-services-summary-guard && yarn release-services:check-summaries';
export const expectedReactNativeOnlinePreflight =
  'yarn check:node-runtime-version && yarn rn:target-snapshot:current && yarn rn:target-snapshot:check-summary && yarn direct-outdated:snapshot:audit && yarn direct-outdated:snapshot:check-summary && yarn git-deps:snapshot:audit && yarn git-deps:snapshot:check-summary && yarn wallet:crypto-latest-snapshot:audit && yarn wallet:crypto-latest-snapshot:check-summary && yarn storage-network:latest-snapshot:audit && yarn storage-network:latest-snapshot:check-summary && yarn tooling:latest-snapshot:audit && yarn tooling:latest-snapshot:check-summary && yarn android:toolchain-target:audit && yarn android:toolchain-target:check-summary && yarn bl:resolution:audit && yarn bl:resolution:check-summary && yarn node-fetch:resolution:audit && yarn node-fetch:resolution:check-summary && yarn foundation:target:check-summaries && yarn rn:baseline:preflight';

export const requiredReactNativeUpgradePathDocs = [
  'docs/react-native-upgrade-path.md',
  'docs/dependency-upgrade-strategy.md',
  'docs/react-native-foundation-target-matrix.md',
  'docs/react-native-076-foundation-plan.md',
  'docs/node-runtime-transition-audit.md',
  'docs/react-native-target-snapshot.md',
  'docs/react19-impact-audit.md',
  'docs/react-package-coupling-audit.md',
  'docs/direct-outdated-snapshot.md',
  'docs/test-type-coupling-audit.md',
  'docs/wallet-modernization-baseline.md',
  'docs/native-module-upgrade-plan.md',
  'docs/android-modernization-workflow.md',
];

export const requiredReactNativeUpgradePathSnippets = [
  ['docs/react-native-upgrade-path.md', 'React Native: `0.86.0`'],
  ['docs/react-native-upgrade-path.md', 'React: `19.2.3`'],
  ['docs/react-native-upgrade-path.md', 'RN Babel preset: `0.86.0`'],
  ['docs/react-native-upgrade-path.md', 'RN Metro config: `0.86.0`'],
  ['docs/react-native-upgrade-path.md', 'Metro/dev Node runtime: `24.16.0`'],
  ['docs/react-native-upgrade-path.md', 'Android compile SDK: `36`'],
  ['docs/react-native-upgrade-path.md', 'Android target SDK: `36`'],
  ['docs/react-native-upgrade-path.md', 'Android build tools: `36.0.0`'],
  ['docs/react-native-upgrade-path.md', 'Android Gradle Plugin: `8.13.2`'],
  ['docs/react-native-upgrade-path.md', 'Gradle wrapper: `8.13`'],
  ['docs/react-native-upgrade-path.md', 'The current baseline is the first RN foundation checkpoint, not the final modernization target'],
  ['docs/react-native-upgrade-path.md', 'milestone-jump path'],
  ['docs/react-native-upgrade-path.md', 'React Native foundation milestone targets are tracked in `docs/react-native-foundation-target-matrix.md`'],
  ['docs/react-native-upgrade-path.md', 'Current milestone target is the validated `0.86.x` line'],
  ['docs/react-native-upgrade-path.md', 'current supported React Native line'],
  ['docs/react-native-upgrade-path.md', 'Current Android template/toolchain baseline compiles and targets SDK 36'],
  ['docs/react-native-upgrade-path.md', 'Current Android template/toolchain baseline'],
  ['docs/react-native-upgrade-path.md', 'React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`'],
  ['docs/react-native-upgrade-path.md', 'Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`'],
  ['docs/react-native-upgrade-path.md', 'React 19 impact audit is tracked in `docs/react19-impact-audit.md`'],
  ['docs/react-native-upgrade-path.md', 'React package coupling audit is tracked in `docs/react-package-coupling-audit.md`'],
  ['docs/react-native-upgrade-path.md', 'React Native renderer exact-version audit is tracked in `docs/react-package-coupling-audit.md`'],
  ['docs/react-native-upgrade-path.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
  ['docs/react-native-upgrade-path.md', 'Re-check the latest stable React Native release during the actual RN baseline branch'],
  ['docs/react-native-upgrade-path.md', 'corepack yarn rn:upgrade-path:audit'],
  ['docs/react-native-upgrade-path.md', 'corepack yarn rn:076-foundation:audit'],
  ['docs/react-native-upgrade-path.md', 'corepack yarn rn:baseline:preflight'],
  ['docs/react-native-upgrade-path.md', 'corepack yarn rn:baseline:preflight:online'],
  ['docs/react-native-upgrade-path.md', 'corepack yarn foundation:target:check-summaries'],
  ['docs/react-native-upgrade-path.md', 'full target evidence set'],
  ['docs/dependency-upgrade-strategy.md', 'Try the latest target first when the change is feasible'],
  ['docs/dependency-upgrade-strategy.md', 'foundation:target:check-summaries'],
  ['docs/react-native-076-foundation-plan.md', 'react-native@0.86.0'],
  ['docs/react-native-076-foundation-plan.md', 'Do not repeat a package-only RN 0.76 branch'],
  ['docs/react-native-076-foundation-plan.md', 'Metro restart with Node 24 and `--reset-cache`'],
  ['docs/react-native-foundation-target-matrix.md', 'Milestone A: RN 0.85.3 Foundation'],
  ['docs/react-native-foundation-target-matrix.md', 'Milestone B: RN 0.86.0 Latest Foundation'],
  ['docs/react-native-foundation-target-matrix.md', 'Milestone C: Future current line'],
  ['docs/wallet-modernization-baseline.md', 'continue with milestone jumps from RN `0.86.0` toward a current supported line'],
  ['docs/wallet-modernization-baseline.md', 'Continue from RN `0.86.0` on the current supported line'],
  ['docs/wallet-modernization-baseline.md', 'React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`'],
  ['docs/wallet-modernization-baseline.md', 'React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`'],
  ['docs/wallet-modernization-baseline.md', 'Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'React 19 impact audit is tracked in `docs/react19-impact-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'React package coupling audit is tracked in `docs/react-package-coupling-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'React Native renderer exact-version audit is tracked in `docs/react-package-coupling-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`'],
  ['docs/wallet-modernization-baseline.md', 'corepack yarn rn:baseline:preflight'],
  ['docs/wallet-modernization-baseline.md', 'corepack yarn rn:baseline:preflight:online'],
  ['docs/wallet-modernization-baseline.md', 'corepack yarn foundation:target:check-summaries'],
  ['docs/wallet-modernization-baseline.md', 'direct outdated snapshot audit'],
  ['docs/wallet-modernization-baseline.md', 'wallet/crypto latest snapshot audit'],
  ['docs/native-module-upgrade-plan.md', 'React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`'],
  ['docs/native-module-upgrade-plan.md', 'corepack yarn rn:baseline:preflight'],
  ['docs/android-modernization-workflow.md', 'corepack yarn rn:upgrade-path:audit'],
  ['docs/android-modernization-workflow.md', 'corepack yarn rn:baseline:preflight'],
  ['docs/android-modernization-workflow.md', 'corepack yarn rn:baseline:preflight:online'],
  ['docs/android-modernization-workflow.md', 'foundation:target:check-summaries'],
  ['docs/android-modernization-workflow.md', 'direct outdated snapshot'],
  ['docs/android-modernization-workflow.md', 'wallet/crypto latest snapshot'],
  ['docs/dependency-upgrade-strategy.md', 'corepack yarn direct-outdated:snapshot:audit'],
  ['docs/dependency-upgrade-strategy.md', 'corepack yarn wallet:crypto-latest-snapshot:audit'],
];

const readGradleExtString = (androidBuildGradleContent, propertyName) =>
  androidBuildGradleContent.match(new RegExp(`${propertyName}\\s*=\\s*["']([^"']+)["']`))?.[1];
const readGradleExtNumber = (androidBuildGradleContent, propertyName) =>
  androidBuildGradleContent.match(new RegExp(`${propertyName}\\s*=\\s*(\\d+)`))?.[1];

export const getReactNativeUpgradePathIssues = ({
  dependencies,
  devDependencies,
  scripts,
  nvmrc,
  androidBuildGradle,
  gradleWrapperProperties,
  docs,
  existingDocs,
}) => {
  const errors = [];
  const buildToolsVersion = readGradleExtString(androidBuildGradle, 'buildToolsVersion');
  const compileSdkVersion = readGradleExtNumber(androidBuildGradle, 'compileSdkVersion');
  const targetSdkVersion = readGradleExtNumber(androidBuildGradle, 'targetSdkVersion');

  if (dependencies['react-native'] !== expectedReactNativeUpgradePathBaseline.reactNative) {
    errors.push(
      `package.json has react-native@${dependencies['react-native'] || '<missing>'}; expected current RN baseline ${
        expectedReactNativeUpgradePathBaseline.reactNative
      }`,
    );
  }

  if (dependencies.react !== expectedReactNativeUpgradePathBaseline.react) {
    errors.push(`package.json has react@${dependencies.react || '<missing>'}; expected current React baseline ${expectedReactNativeUpgradePathBaseline.react}`);
  }

  if (devDependencies['@react-native/babel-preset'] !== expectedReactNativeUpgradePathBaseline.babelPreset) {
    errors.push(
      `package.json has @react-native/babel-preset@${
        devDependencies['@react-native/babel-preset'] || '<missing>'
      }; expected current RN Babel preset baseline ${expectedReactNativeUpgradePathBaseline.babelPreset}`,
    );
  }

  if (devDependencies['@react-native/metro-config'] !== expectedReactNativeUpgradePathBaseline.metroConfig) {
    errors.push(
      `package.json has @react-native/metro-config@${
        devDependencies['@react-native/metro-config'] || '<missing>'
      }; expected current RN Metro config baseline ${expectedReactNativeUpgradePathBaseline.metroConfig}`,
    );
  }

  if (scripts['rn:upgrade-path:audit'] !== 'node scripts/auditReactNativeUpgradePath.mjs') {
    errors.push('package.json is missing rn:upgrade-path:audit script');
  }

  if (scripts['node:runtime-transition:audit'] !== 'node scripts/auditNodeRuntimeTransition.mjs') {
    errors.push('package.json is missing node:runtime-transition:audit script');
  }

  if (scripts['check:node-runtime-transition-guard'] !== 'node scripts/checkNodeRuntimeTransitionGuard.mjs') {
    errors.push('package.json is missing check:node-runtime-transition-guard script');
  }

  if (scripts['rn:target-snapshot:audit'] !== 'node scripts/auditReactNativeTargetSnapshot.mjs') {
    errors.push('package.json is missing rn:target-snapshot:audit script');
  }

  if (scripts['check:rn-target-snapshot-guard'] !== 'node scripts/checkReactNativeTargetSnapshotGuard.mjs') {
    errors.push('package.json is missing check:rn-target-snapshot-guard script');
  }

  if (scripts['react19:impact:audit'] !== 'node scripts/auditReact19Impact.mjs') {
    errors.push('package.json is missing react19:impact:audit script');
  }

  if (scripts['check:react19-impact-guard'] !== 'node scripts/checkReact19ImpactGuard.mjs') {
    errors.push('package.json is missing check:react19-impact-guard script');
  }

  if (scripts['react:package-coupling:audit'] !== 'node scripts/auditReactPackageCoupling.mjs') {
    errors.push('package.json is missing react:package-coupling:audit script');
  }

  if (scripts['check:react-package-coupling-guard'] !== 'node scripts/checkReactPackageCouplingGuard.mjs') {
    errors.push('package.json is missing check:react-package-coupling-guard script');
  }

  if (scripts['react:renderer-version:audit'] !== 'node scripts/auditReactNativeRendererVersion.mjs') {
    errors.push('package.json is missing react:renderer-version:audit script');
  }

  if (scripts['check:react-renderer-version-guard'] !== 'node scripts/checkReactNativeRendererVersionGuard.mjs') {
    errors.push('package.json is missing check:react-renderer-version-guard script');
  }

  if (scripts['test:type-coupling:audit'] !== 'node scripts/auditTestTypeCoupling.mjs') {
    errors.push('package.json is missing test:type-coupling:audit script');
  }

  if (scripts['wallet:crypto-runtime:audit'] !== 'node scripts/auditWalletCryptoRuntime.mjs') {
    errors.push('package.json is missing wallet:crypto-runtime:audit script');
  }

  if (scripts['husky:tooling:audit'] !== 'node scripts/auditHuskyTooling.mjs') {
    errors.push('package.json is missing husky:tooling:audit script');
  }

  if (scripts['prettier:tooling:audit'] !== 'node scripts/auditPrettierTooling.mjs') {
    errors.push('package.json is missing prettier:tooling:audit script');
  }

  if (scripts['jest:tooling:audit'] !== 'node scripts/auditJestTooling.mjs') {
    errors.push('package.json is missing jest:tooling:audit script');
  }

  if (scripts['crypto-js:runtime:audit'] !== 'node scripts/auditCryptoJsRuntime.mjs') {
    errors.push('package.json is missing crypto-js:runtime:audit script');
  }

  if (scripts['state:runtime:audit'] !== 'node scripts/auditStateRuntime.mjs') {
    errors.push('package.json is missing state:runtime:audit script');
  }

  if (scripts['lodash:runtime:audit'] !== 'node scripts/auditLodashRuntime.mjs') {
    errors.push('package.json is missing lodash:runtime:audit script');
  }

  if (scripts['wallet:crypto-latest-snapshot:audit'] !== 'node scripts/auditWalletCryptoLatestSnapshot.mjs') {
    errors.push('package.json is missing wallet:crypto-latest-snapshot:audit script');
  }

  if (scripts['wallet:crypto-latest-snapshot:check-summary'] !== 'node scripts/checkWalletCryptoLatestSnapshotSummary.mjs') {
    errors.push('package.json is missing wallet:crypto-latest-snapshot:check-summary script');
  }

  if (scripts['check:wallet-crypto-latest-snapshot-summary-guard'] !== 'node scripts/checkWalletCryptoLatestSnapshotSummaryGuard.mjs') {
    errors.push('package.json is missing check:wallet-crypto-latest-snapshot-summary-guard script');
  }

  if (scripts['storage-network:latest-snapshot:audit'] !== 'node scripts/auditStorageNetworkLatestSnapshot.mjs') {
    errors.push('package.json is missing storage-network:latest-snapshot:audit script');
  }

  if (scripts['storage-network:latest-snapshot:check-summary'] !== 'node scripts/checkStorageNetworkLatestSnapshotSummary.mjs') {
    errors.push('package.json is missing storage-network:latest-snapshot:check-summary script');
  }

  if (scripts['check:storage-network-latest-snapshot-summary-guard'] !== 'node scripts/checkStorageNetworkLatestSnapshotSummaryGuard.mjs') {
    errors.push('package.json is missing check:storage-network-latest-snapshot-summary-guard script');
  }

  if (scripts['direct-outdated:snapshot:audit'] !== 'node scripts/auditDirectOutdatedSnapshot.mjs') {
    errors.push('package.json is missing direct-outdated:snapshot:audit script');
  }

  if (scripts['direct-outdated:snapshot:check-summary'] !== 'node scripts/checkDirectOutdatedSnapshotSummary.mjs') {
    errors.push('package.json is missing direct-outdated:snapshot:check-summary script');
  }

  if (scripts['check:direct-outdated-snapshot-summary-guard'] !== 'node scripts/checkDirectOutdatedSnapshotSummaryGuard.mjs') {
    errors.push('package.json is missing check:direct-outdated-snapshot-summary-guard script');
  }

  if (scripts['foundation:target:check-summaries'] !== 'node scripts/checkFoundationTargetSummaryArtifacts.mjs') {
    errors.push('package.json is missing foundation:target:check-summaries script');
  }

  if (scripts['check:foundation-target-summary-guard'] !== 'node scripts/checkFoundationTargetSummaryGuard.mjs') {
    errors.push('package.json is missing check:foundation-target-summary-guard script');
  }

  if (scripts['check:test-type-coupling-guard'] !== 'node scripts/checkTestTypeCouplingGuard.mjs') {
    errors.push('package.json is missing check:test-type-coupling-guard script');
  }

  if (scripts['rn:baseline:preflight'] !== expectedReactNativeBaselinePreflight) {
    errors.push('package.json is missing rn:baseline:preflight script with the expected RN baseline preflight command');
  }

  if (scripts['rn:baseline:preflight:online'] !== expectedReactNativeOnlinePreflight) {
    errors.push('package.json is missing rn:baseline:preflight:online script with the expected live npm RN baseline preflight command');
  }

  if (nvmrc !== expectedReactNativeUpgradePathBaseline.nodeRuntime) {
    errors.push(`.nvmrc is ${nvmrc || '<missing>'}; expected Metro/dev runtime baseline ${expectedReactNativeUpgradePathBaseline.nodeRuntime}`);
  }

  if (buildToolsVersion !== expectedReactNativeUpgradePathBaseline.buildToolsVersion) {
    errors.push(`android/build.gradle buildToolsVersion is ${buildToolsVersion || '<missing>'}; expected ${expectedReactNativeUpgradePathBaseline.buildToolsVersion}`);
  }

  if (compileSdkVersion !== expectedReactNativeUpgradePathBaseline.compileSdkVersion) {
    errors.push(`android/build.gradle compileSdkVersion is ${compileSdkVersion || '<missing>'}; expected ${expectedReactNativeUpgradePathBaseline.compileSdkVersion}`);
  }

  if (targetSdkVersion !== expectedReactNativeUpgradePathBaseline.targetSdkVersion) {
    errors.push(
      `android/build.gradle targetSdkVersion is ${
        targetSdkVersion || '<missing>'
      }; expected ${expectedReactNativeUpgradePathBaseline.targetSdkVersion} for the current RN/toolchain baseline`,
    );
  }

  if (!androidBuildGradle.includes(`com.android.tools.build:gradle:${expectedReactNativeUpgradePathBaseline.androidGradlePlugin}`)) {
    errors.push(`android/build.gradle is missing Android Gradle Plugin ${expectedReactNativeUpgradePathBaseline.androidGradlePlugin} baseline`);
  }

  if (
    !gradleWrapperProperties.includes(`gradle-${expectedReactNativeUpgradePathBaseline.gradleWrapper}-all.zip`) &&
    !gradleWrapperProperties.includes(`gradle-${expectedReactNativeUpgradePathBaseline.gradleWrapper}-bin.zip`)
  ) {
    errors.push(`android/gradle/wrapper/gradle-wrapper.properties is missing Gradle wrapper ${expectedReactNativeUpgradePathBaseline.gradleWrapper} baseline`);
  }

  requiredReactNativeUpgradePathDocs.forEach(relativePath => {
    if (!existingDocs.has(relativePath)) {
      errors.push(`${relativePath} is missing`);
    }
  });

  requiredReactNativeUpgradePathSnippets.forEach(([relativePath, snippet]) => {
    const content = docs[relativePath] || '';
    if (!content.includes(snippet)) {
      errors.push(`${relativePath} is missing "${snippet}"`);
    }
  });

  return { errors, buildToolsVersion, compileSdkVersion, targetSdkVersion };
};

const collectEnvironment = () => {
  const docs = {};
  const existingDocs = new Set();

  requiredReactNativeUpgradePathDocs.forEach(relativePath => {
    try {
      docs[relativePath] = read(relativePath);
      existingDocs.add(relativePath);
    } catch {
      docs[relativePath] = '';
    }
  });

  return {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    scripts: packageJson.scripts || {},
    nvmrc,
    androidBuildGradle,
    gradleWrapperProperties,
    docs,
    existingDocs,
  };
};

const printReport = environment => {
  const { errors, buildToolsVersion, compileSdkVersion, targetSdkVersion } = getReactNativeUpgradePathIssues(environment);

  console.log('React Native upgrade path audit');
  console.log(`react-native: ${environment.dependencies['react-native'] || '<missing>'}`);
  console.log(`react: ${environment.dependencies.react || '<missing>'}`);
  console.log(`@react-native/babel-preset: ${environment.devDependencies['@react-native/babel-preset'] || '<missing>'}`);
  console.log(`@react-native/metro-config: ${environment.devDependencies['@react-native/metro-config'] || '<missing>'}`);
  console.log(`.nvmrc: ${environment.nvmrc || '<missing>'}`);
  console.log(`Android build tools: ${buildToolsVersion || '<missing>'}`);
  console.log(`Android compile SDK: ${compileSdkVersion || '<missing>'}`);
  console.log(`Android target SDK: ${targetSdkVersion || '<missing>'}`);
  console.log('Target direction: staged upgrades toward a current supported React Native line.');

  if (errors.length > 0) {
    console.log('React Native upgrade path documentation is invalid:');
    errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('React Native upgrade path documentation matches the current staged baseline.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectEnvironment());
}
