import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const packageJson = JSON.parse(read('package.json'));
const firebasePackages = [
  '@react-native-firebase/app',
  '@react-native-firebase/analytics',
  '@react-native-firebase/crashlytics',
  '@react-native-firebase/messaging',
];
const requiredAndroidFiles = [
  'android/app/src/beta/google-services.json',
  'android/app/src/dev/google-services.json',
  'android/app/src/prod/google-services.json',
  'android/app/src/stage/google-services.json',
];
const requiredIosFiles = [
  'ios/GoogleService-Info-dev.plist',
  'ios/GoogleService-Info-prod.plist',
  'ios/GoogleService-Info-stage.plist',
  'ios/GoogleService-Info.plist',
];
const errors = [];
const warnings = [];
const dependencies = packageJson.dependencies || {};
const firebaseVersions = new Map(firebasePackages.map(packageName => [packageName, dependencies[packageName]]));
const uniqueVersions = new Set(firebaseVersions.values());

firebaseVersions.forEach((version, packageName) => {
  if (typeof version !== 'string') {
    errors.push(`${packageName} is missing from package.json dependencies`);
  }
});

if (uniqueVersions.size !== 1) {
  errors.push(
    `React Native Firebase package versions are not aligned: ${[...firebaseVersions]
      .map(([packageName, version]) => `${packageName}@${version || '<missing>'}`)
      .join(', ')}`,
  );
}

const androidRootGradle = read('android/build.gradle');
const androidAppGradle = read('android/app/build.gradle');

[
  ['android/build.gradle', androidRootGradle, "classpath 'com.google.gms:google-services:4.3.15'"],
  ['android/build.gradle', androidRootGradle, "classpath 'com.google.firebase:firebase-crashlytics-gradle:2.9.0'"],
  ['android/build.gradle', androidRootGradle, 'firebaseVersion = "17.3.4"'],
  ['android/app/build.gradle', androidAppGradle, "apply plugin: 'com.google.firebase.crashlytics'"],
  ['android/app/build.gradle', androidAppGradle, "apply plugin: 'com.google.gms.google-services'"],
  ['android/app/build.gradle', androidAppGradle, "implementation 'com.google.firebase:firebase-core:16.0.3'"],
  ['android/app/build.gradle', androidAppGradle, "implementation platform('com.google.firebase:firebase-bom:28.2.0')"],
].forEach(([label, content, snippet]) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
});

requiredAndroidFiles.forEach(relativePath => {
  if (!exists(relativePath)) {
    errors.push(`${relativePath} is missing`);
    return;
  }

  const content = read(relativePath);

  ['project_info', 'mobilesdk_app_id', 'api_key'].forEach(key => {
    if (!content.includes(key)) {
      errors.push(`${relativePath} does not look like a complete google-services.json file; missing ${key}`);
    }
  });
});

requiredIosFiles.forEach(relativePath => {
  if (!exists(relativePath)) {
    errors.push(`${relativePath} is missing`);
    return;
  }

  const content = read(relativePath);

  ['GOOGLE_APP_ID', 'GCM_SENDER_ID', 'BUNDLE_ID'].forEach(key => {
    if (!content.includes(key)) {
      errors.push(`${relativePath} does not look like a complete GoogleService-Info plist; missing ${key}`);
    }
  });
});

const navigatorSource = read('src/navigators/Navigator.tsx');
const notificationServiceSource = read('src/services/NotificationServices.tsx');

[
  ['Navigator.tsx', navigatorSource, "from '@react-native-firebase/messaging'"],
  ['Navigator.tsx', navigatorSource, 'setBackgroundMessageHandler'],
  ['Navigator.tsx', navigatorSource, 'onNotificationOpenedApp'],
  ['NotificationServices.tsx', notificationServiceSource, "from '@react-native-firebase/messaging'"],
  ['NotificationServices.tsx', notificationServiceSource, 'requestPermission'],
  ['NotificationServices.tsx', notificationServiceSource, 'getToken'],
].forEach(([label, content, snippet]) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing Firebase Messaging runtime wiring "${snippet}"`);
  }
});

if (dependencies['@react-native-firebase/app'] === '12.7') {
  warnings.push('React Native Firebase remains on 12.7; current upgrade plan treats the next 23+/24.x move as a major family upgrade.');
}

console.log('Firebase release-services audit');
console.log(`React Native Firebase package version set: ${[...uniqueVersions].join(', ')}`);

if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(warning => console.log(`- ${warning}`));
}

if (errors.length > 0) {
  console.log('Firebase release-services wiring is invalid:');
  errors.forEach(error => console.log(`- ${error}`));
  process.exit(1);
}

console.log('Firebase release-services wiring is present for package family alignment, Android config, iOS plist files, and Messaging runtime paths.');
