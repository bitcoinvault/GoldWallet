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
  reactNative: '0.68.7',
  react: '17.0.2',
  metroPreset: '0.67.0',
  nodeRuntime: '16.20.2',
  buildToolsVersion: '34.0.0',
  compileSdkVersion: '34',
  targetSdkVersion: '33',
  androidGradlePlugin: '7.4.2',
  gradleWrapper: '7.5.1',
};

export const expectedReactNativeBaselinePreflight =
  'yarn android:dev:check-light && yarn metro:dev-runtime:audit && yarn rn:upgrade-path:audit && yarn check:rn-target-snapshot-guard && yarn rn:target-snapshot:audit && yarn camera:qr-migration:audit && yarn sentry:android-warning:audit && yarn sentry:release:prereq-audit && yarn firebase:release-services:audit && yarn codepush:release:path-audit && yarn push-notification:bridge-audit';

export const requiredReactNativeUpgradePathDocs = [
  'docs/react-native-upgrade-path.md',
  'docs/react-native-target-snapshot.md',
  'docs/wallet-modernization-baseline.md',
  'docs/native-module-upgrade-plan.md',
  'docs/android-modernization-workflow.md',
];

export const requiredReactNativeUpgradePathSnippets = [
  ['docs/react-native-upgrade-path.md', 'React Native: `0.68.7`'],
  ['docs/react-native-upgrade-path.md', 'React: `17.0.2`'],
  ['docs/react-native-upgrade-path.md', 'Metro Babel preset: `0.67.0`'],
  ['docs/react-native-upgrade-path.md', 'Metro/dev Node runtime: `16.20.2`'],
  ['docs/react-native-upgrade-path.md', 'Android compile SDK: `34`'],
  ['docs/react-native-upgrade-path.md', 'Android target SDK: `33`'],
  ['docs/react-native-upgrade-path.md', 'Android Gradle Plugin: `7.4.2`'],
  ['docs/react-native-upgrade-path.md', 'Gradle wrapper: `7.5.1`'],
  ['docs/react-native-upgrade-path.md', 'The current branch does not target a direct jump to the latest React Native release'],
  ['docs/react-native-upgrade-path.md', 'current supported React Native line'],
  ['docs/react-native-upgrade-path.md', 'Keep `targetSdkVersion 34` deferred'],
  ['docs/react-native-upgrade-path.md', 'Current Android template/toolchain baseline'],
  ['docs/react-native-upgrade-path.md', 'React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`'],
  ['docs/react-native-upgrade-path.md', 'Re-check the latest stable React Native release during the actual RN baseline branch'],
  ['docs/react-native-upgrade-path.md', 'corepack yarn rn:upgrade-path:audit'],
  ['docs/react-native-upgrade-path.md', 'corepack yarn rn:baseline:preflight'],
  ['docs/wallet-modernization-baseline.md', 'Continue RN stepwise from `0.68` toward newer supported lines'],
  ['docs/wallet-modernization-baseline.md', 'React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`'],
  ['docs/wallet-modernization-baseline.md', 'React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`'],
  ['docs/wallet-modernization-baseline.md', 'corepack yarn rn:baseline:preflight'],
  ['docs/native-module-upgrade-plan.md', 'React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`'],
  ['docs/native-module-upgrade-plan.md', 'corepack yarn rn:baseline:preflight'],
  ['docs/android-modernization-workflow.md', 'corepack yarn rn:upgrade-path:audit'],
  ['docs/android-modernization-workflow.md', 'corepack yarn rn:baseline:preflight'],
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

  if (devDependencies['metro-react-native-babel-preset'] !== expectedReactNativeUpgradePathBaseline.metroPreset) {
    errors.push(
      `package.json has metro-react-native-babel-preset@${
        devDependencies['metro-react-native-babel-preset'] || '<missing>'
      }; expected current Metro preset baseline ${expectedReactNativeUpgradePathBaseline.metroPreset}`,
    );
  }

  if (scripts['rn:upgrade-path:audit'] !== 'node scripts/auditReactNativeUpgradePath.mjs') {
    errors.push('package.json is missing rn:upgrade-path:audit script');
  }

  if (scripts['rn:target-snapshot:audit'] !== 'node scripts/auditReactNativeTargetSnapshot.mjs') {
    errors.push('package.json is missing rn:target-snapshot:audit script');
  }

  if (scripts['check:rn-target-snapshot-guard'] !== 'node scripts/checkReactNativeTargetSnapshotGuard.mjs') {
    errors.push('package.json is missing check:rn-target-snapshot-guard script');
  }

  if (scripts['rn:baseline:preflight'] !== expectedReactNativeBaselinePreflight) {
    errors.push('package.json is missing rn:baseline:preflight script with the expected RN baseline preflight command');
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
      }; expected ${expectedReactNativeUpgradePathBaseline.targetSdkVersion} until the RN/toolchain path supports target 34`,
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
  console.log(`metro-react-native-babel-preset: ${environment.devDependencies['metro-react-native-babel-preset'] || '<missing>'}`);
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
