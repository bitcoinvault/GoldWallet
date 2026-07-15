import { existsSync, readFileSync } from 'fs';

const read = path => readFileSync(path, 'utf8');
const errors = [];
const packageJson = JSON.parse(read('package.json'));
const appBuildGradle = read('android/app/build.gradle');
const readinessDocPath = 'docs/react-native-087-readiness.md';

if (packageJson.dependencies?.['react-native'] !== '0.86.0') {
  errors.push('Production React Native must remain on stable 0.86.0 until the 0.87 blocker is cleared.');
}

if (packageJson.dependencies?.['@react-native-async-storage/async-storage'] !== '3.1.1') {
  errors.push('The RN 0.87 blocker evidence expects latest AsyncStorage 3.1.1.');
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

if (!appBuildGradle.includes('com.android.build.api.variant.FilterConfiguration')) {
  errors.push('android/app/build.gradle is missing the stable FilterConfiguration API.');
}

if (!appBuildGradle.includes('androidComponents') || !appBuildGradle.includes('output.versionCode.set')) {
  errors.push('android/app/build.gradle is missing androidComponents ABI version-code configuration.');
}

if (/getDefaultProguardFile\(["']proguard-android\.txt["']\)/.test(appBuildGradle)) {
  errors.push('android/app/build.gradle still uses the ProGuard baseline removed by AGP 9.');
}

if ((appBuildGradle.match(/proguard-android-optimize\.txt/g) || []).length !== 2) {
  errors.push('android/app/build.gradle must use the optimized ProGuard baseline for debug and release.');
}

const requiredDocSnippets = [
  'Current stable target: `react-native@0.86.0`',
  'Probed next target: `react-native@0.87.0-rc.1`',
  'Required Android cohort: AGP `9.2.1`, Gradle `9.4.1`, Kotlin `2.2.0`',
  'Blocking dependency: `@react-native-async-storage/async-storage@3.1.1`',
  'Production upgrade decision: blocked',
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

console.log('React Native 0.87 readiness prerequisites are guarded; production upgrade remains blocked upstream.');
