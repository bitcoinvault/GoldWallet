import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export const expectedAndroidToolchainCurrentState = {
  javaMajor: 17,
  agp: '8.13.2',
  gradle: '8.13',
  kotlin: '2.1.20',
  buildTools: '36.0.0',
  minSdk: '26',
  compileSdk: '36',
  targetSdk: '36',
  ndk: '27.1.12297006',
  rnGradlePlugin: '0.86.0',
  newArchEnabled: 'true',
  hermesEnabled: 'true',
};

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const readJson = relativePath => JSON.parse(read(relativePath));

const getQuotedGradleValue = (content, name) => content.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`))?.[1] || '';
const getNumericGradleValue = (content, name) => content.match(new RegExp(`${name}\\s*=\\s*(\\d+)`))?.[1] || '';
const getClasspathVersion = (content, artifact) =>
  content.match(new RegExp(`${artifact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:([0-9][^"')]+)`))?.[1] || '';
const getGradleWrapperVersion = content => content.match(/gradle-([0-9.]+)-(?:all|bin)\.zip/)?.[1] || '';
const getProperty = (content, name) => content.match(new RegExp(`^${name}=([^\\r\\n]+)`, 'm'))?.[1]?.trim() || '';

const getJavaCommand = () =>
  process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';

const getJavaMajorVersion = javaCommand => {
  const result = spawnSync(javaCommand, ['-version'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  const output = `${result.stderr || ''}${result.stdout || ''}`;

  return {
    command: javaCommand,
    major: output.match(/version "(\d+)/)?.[1] || '',
    error: result.error?.message || '',
  };
};

export const collectAndroidToolchainCurrentState = () => {
  const androidBuildGradle = read('android/build.gradle');
  const gradleWrapper = read('android/gradle/wrapper/gradle-wrapper.properties');
  const gradleProperties = read('android/gradle.properties');
  const packageJson = readJson('package.json');
  const java = getJavaMajorVersion(getJavaCommand());

  const values = {
    javaCommand: java.command,
    javaMajor: java.major,
    agp: getClasspathVersion(androidBuildGradle, 'com.android.tools.build:gradle'),
    gradle: getGradleWrapperVersion(gradleWrapper),
    kotlin: getQuotedGradleValue(androidBuildGradle, 'kotlinVersion'),
    buildTools: getQuotedGradleValue(androidBuildGradle, 'buildToolsVersion'),
    minSdk: getNumericGradleValue(androidBuildGradle, 'minSdkVersion'),
    compileSdk: getNumericGradleValue(androidBuildGradle, 'compileSdkVersion'),
    targetSdk: getNumericGradleValue(androidBuildGradle, 'targetSdkVersion'),
    ndk: getQuotedGradleValue(androidBuildGradle, 'ndkVersion'),
    rnGradlePlugin:
      packageJson.dependencies?.['@react-native/gradle-plugin'] || packageJson.devDependencies?.['@react-native/gradle-plugin'] || '',
    newArchEnabled: getProperty(gradleProperties, 'newArchEnabled'),
    hermesEnabled: getProperty(gradleProperties, 'hermesEnabled'),
    jdkGuardPresent:
      androidBuildGradle.includes('currentJavaMajorVersion != 17') &&
      androidBuildGradle.includes('GoldWallet Android build requires JDK 17 after the AGP 8.13 upgrade'),
    javaError: java.error,
  };

  const errors = getAndroidToolchainCurrentStateErrors(values);

  return { values, errors };
};

export const getAndroidToolchainCurrentStateErrors = (values, expected = expectedAndroidToolchainCurrentState) => {
  const errors = [];

  Object.entries(expected).forEach(([key, expectedValue]) => {
    if (String(values[key] || '') !== String(expectedValue)) {
      errors.push(`${key} is ${values[key] || '<missing>'}; expected ${expectedValue}`);
    }
  });

  if (!values.jdkGuardPresent) {
    errors.push('android/build.gradle is missing the JDK 17 Gradle guard');
  }

  if (values.javaError) {
    errors.push(`unable to run Java version check from ${values.javaCommand}: ${values.javaError}`);
  }

  return errors;
};

const printReport = audit => {
  console.log('Android toolchain current-state check');
  console.log(`Java executable: ${audit.values.javaCommand}`);
  console.log(`Java major version: ${audit.values.javaMajor || '<missing>'}`);
  console.log(`Android Gradle Plugin: ${audit.values.agp || '<missing>'}`);
  console.log(`Gradle wrapper: ${audit.values.gradle || '<missing>'}`);
  console.log(`Kotlin Gradle Plugin: ${audit.values.kotlin || '<missing>'}`);
  console.log(`Build tools: ${audit.values.buildTools || '<missing>'}`);
  console.log(`SDK levels: min ${audit.values.minSdk || '<missing>'}, compile ${audit.values.compileSdk || '<missing>'}, target ${audit.values.targetSdk || '<missing>'}`);
  console.log(`NDK: ${audit.values.ndk || '<missing>'}`);
  console.log(`React Native Gradle plugin: ${audit.values.rnGradlePlugin || '<missing>'}`);
  console.log(`New Architecture enabled: ${audit.values.newArchEnabled || '<missing>'}`);
  console.log(`Hermes enabled: ${audit.values.hermesEnabled || '<missing>'}`);
  console.log(`JDK 17 Gradle guard present: ${audit.values.jdkGuardPresent ? 'yes' : 'no'}`);

  if (audit.errors.length > 0) {
    console.log('Android toolchain current-state check failed:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log('Android toolchain current state matches the validated AGP 8.13 / Gradle 8.13 / JDK 17 baseline.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectAndroidToolchainCurrentState());
}
