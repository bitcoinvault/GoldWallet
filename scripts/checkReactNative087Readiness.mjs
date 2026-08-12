import { existsSync, readFileSync } from 'fs';

const read = path => readFileSync(path, 'utf8');
const errors = [];
const packageJson = JSON.parse(read('package.json'));
const packageVersions = {
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
};
const appBuildGradle = read('android/app/build.gradle');
const rootBuildGradle = read('android/build.gradle');
const gradleWrapper = read('android/gradle/wrapper/gradle-wrapper.properties');
const gradleProperties = read('android/gradle.properties');
const yarnLock = read('yarn.lock');
const readinessDocPath = 'docs/react-native-087-readiness.md';

const stableReactNativeCohort = [
  'react-native',
  '@react-native/babel-preset',
  '@react-native/codegen',
  '@react-native/gradle-plugin',
  '@react-native/jest-preset',
  '@react-native/metro-config',
  '@react-native/typescript-config',
];

stableReactNativeCohort.forEach(packageName => {
  if (packageVersions[packageName] !== '0.87.0') {
    errors.push(`Production ${packageName} must match the stable React Native 0.87.0 cohort.`);
  }
});

if (packageJson.dependencies?.['@react-native-async-storage/async-storage'] !== '3.1.1') {
  errors.push('The RN 0.87 blocker evidence expects latest AsyncStorage 3.1.1.');
}

if (!rootBuildGradle.includes('classpath("com.android.tools.build:gradle:9.2.1")')) {
  errors.push('React Native 0.87 requires the validated Android Gradle Plugin 9.2.1 baseline.');
}

if (!rootBuildGradle.includes("kotlinVersion = '2.2.10'")) {
  errors.push('React Native 0.87 and AGP 9.2 require the validated Kotlin 2.2.10 baseline.');
}

if (!rootBuildGradle.includes("kspVersion = '2.2.10-2.0.2'")) {
  errors.push('AsyncStorage must use KSP 2.2.10-2.0.2 aligned with the Kotlin 2.2.10 application baseline.');
}

if (!gradleWrapper.includes('distributionUrl=https\\://services.gradle.org/distributions/gradle-9.4.1-all.zip')) {
  errors.push('React Native 0.87 requires the validated Gradle 9.4.1 wrapper baseline.');
}

['android.builtInKotlin', 'android.newDsl'].forEach(propertyName => {
  if (!new RegExp(`^\\s*${propertyName.replace('.', '\\.') }\\s*=\\s*false\\s*$`, 'm').test(gradleProperties)) {
    errors.push(`${propertyName}=false is required by the current AGP 9 compatibility checkpoint.`);
  }
});

if (!/^\s*edgeToEdgeEnabled\s*=\s*true\s*$/m.test(gradleProperties)) {
  errors.push('edgeToEdgeEnabled=true is required by the stable React Native 0.87 Android template baseline.');
}

if (yarnLock.includes('0.87.0-rc.4')) {
  errors.push('yarn.lock still contains the RN 0.87 RC4 probe cohort.');
}

[
  'src/screens/ConnectionIssues/ConnectionIssuesScreen.tsx',
  'src/screens/ScanQrCodeScreen.tsx',
  'src/screens/UnlockScreen.tsx',
].forEach(path => {
  if (read(path).includes('...StyleSheet.absoluteFill')) {
    errors.push(`${path} still spreads StyleSheet.absoluteFill, which fails the RN 0.87 generated types.`);
  }
});

if (appBuildGradle.includes('com.android.build.OutputFile')) {
  errors.push('android/app/build.gradle still imports the removed legacy OutputFile API.');
}

if (appBuildGradle.includes('applicationVariants')) {
  errors.push('android/app/build.gradle still uses the removed applicationVariants API.');
}

if (
  appBuildGradle.includes('enableSeparateBuildPerCPUArchitecture') ||
  /splits\s*\{\s*abi\s*\{/s.test(appBuildGradle)
) {
  errors.push('android/app/build.gradle still carries disabled per-ABI split configuration.');
}

if (/getDefaultProguardFile\(["']proguard-android\.txt["']\)/.test(appBuildGradle)) {
  errors.push('android/app/build.gradle still uses the ProGuard baseline removed by AGP 9.');
}

if ((appBuildGradle.match(/proguard-android-optimize\.txt/g) || []).length !== 2) {
  errors.push('android/app/build.gradle must use the optimized ProGuard baseline for debug and release.');
}

const requiredDocSnippets = [
  'Current stable target: `react-native@0.87.0`',
  'Previous probe target: `react-native@0.87.0-rc.4`',
  'Required Android cohort: AGP `9.2.1`, Gradle `9.4.1`, Kotlin `2.2.10`',
  'Required temporary AGP compatibility flags: `android.builtInKotlin=false`, `android.newDsl=false`',
  'Production upgrade decision: Android acceptance passed; macOS iOS validation remains required',
  'all `14` unit suites (`68` tests)',
  'The signed `prodRelease` APK passed onboarding',
  'migrated PIN, transaction password, encrypted flag, and wallet data into Keychain',
  'The full `rn:baseline:preflight` passed',
  '`ios/Podfile.lock` has `13` dependency-drift entries',
  'allows `assembleDevDebug` to complete',
  'all `795` executed Gradle tasks',
  'external dev/testnet Electrum certificate expired on 2026-06-23',
  'The production cohort contains no prerelease RN package',
];

if (!existsSync(readinessDocPath)) {
  errors.push(`${readinessDocPath} is missing.`);
} else {
  const readinessDoc = read(readinessDocPath);

  requiredDocSnippets.forEach(snippet => {
    if (!readinessDoc.includes(snippet)) errors.push(`${readinessDocPath} is missing "${snippet}".`);
  });
}

if (errors.length > 0) {
  console.error('React Native 0.87 readiness check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('React Native 0.87 stable cohort, Android toolchain, compatibility flags, and readiness evidence are guarded.');
