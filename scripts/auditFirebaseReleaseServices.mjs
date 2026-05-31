import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'firebase-release-services-summary.txt');
const androidReleaseSummaryPath = path.join(root, 'local-docs', 'android-release-dev-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const packageJson = JSON.parse(read('package.json'));
export const firebaseReleasePackages = [
  '@react-native-firebase/app',
  '@react-native-firebase/analytics',
  '@react-native-firebase/crashlytics',
  '@react-native-firebase/messaging',
];
export const requiredFirebaseAndroidFiles = [
  'android/app/src/beta/google-services.json',
  'android/app/src/dev/google-services.json',
  'android/app/src/prod/google-services.json',
  'android/app/src/stage/google-services.json',
];
export const requiredFirebaseIosFiles = [
  'ios/GoogleService-Info-dev.plist',
  'ios/GoogleService-Info-prod.plist',
  'ios/GoogleService-Info-stage.plist',
  'ios/GoogleService-Info.plist',
];
const getSummaryLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};

export const collectFirebaseReleaseServicesAudit = () => {
  const errors = [];
  const warnings = [];
  const dependencies = packageJson.dependencies || {};
  const firebaseVersions = new Map(firebaseReleasePackages.map(packageName => [packageName, dependencies[packageName]]));
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
    ['android/app/build.gradle', androidAppGradle, "apply plugin: 'com.google.firebase.crashlytics'"],
    ['android/app/build.gradle', androidAppGradle, "apply plugin: 'com.google.gms.google-services'"],
  ].forEach(([label, content, snippet]) => {
    if (!content.includes(snippet)) {
      errors.push(`${label} is missing "${snippet}"`);
    }
  });

  [
    ['android/build.gradle', androidRootGradle, 'firebaseVersion = "17.3.4"'],
    ['android/app/build.gradle', androidAppGradle, "implementation 'com.google.firebase:firebase-core:16.0.3'"],
    ['android/app/build.gradle', androidAppGradle, "implementation platform('com.google.firebase:firebase-bom:28.2.0')"],
  ].forEach(([label, content, snippet]) => {
    if (content.includes(snippet)) {
      errors.push(`${label} still contains legacy Firebase dependency wiring "${snippet}"`);
    }
  });

  requiredFirebaseAndroidFiles.forEach(relativePath => {
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

  requiredFirebaseIosFiles.forEach(relativePath => {
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

  let androidReleaseSummaryPresent = false;
  let androidReleaseSummaryVariants = [];
  let androidReleaseSummaryErrors = [];

  try {
    const androidReleaseSummary = readFileSync(androidReleaseSummaryPath, 'utf8');

    androidReleaseSummaryPresent = true;
    androidReleaseSummaryVariants = getSummaryLineValue(androidReleaseSummary, 'Variants')
      .split(',')
      .map(variant => variant.trim())
      .filter(Boolean);
    androidReleaseSummaryErrors = getAndroidReleaseSummaryErrors(androidReleaseSummary, root, {
      expectedVariants: androidReleaseSummaryVariants,
    });
  } catch {
    androidReleaseSummaryPresent = false;
    androidReleaseSummaryVariants = [];
    androidReleaseSummaryErrors = [];
  }

  return {
    errors,
    warnings,
    packageVersions: [...uniqueVersions].filter(Boolean),
    androidReleaseSummaryPresent,
    androidReleaseSummaryVariants,
    androidReleaseSummaryErrors,
    ready: errors.length === 0,
  };
};

export const formatFirebaseReleaseServicesSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Firebase release-services audit',
    `Generated at: ${generatedAt}`,
    `React Native Firebase package version set: ${audit.packageVersions.join(', ') || '<missing>'}`,
    `Firebase release-services wiring valid: ${audit.ready ? 'yes' : 'no'}`,
    `Android release summary present: ${audit.androidReleaseSummaryPresent ? 'yes' : 'no'}`,
    `Android release summary variants: ${audit.androidReleaseSummaryVariants.join(', ') || 'none'}`,
    `Android release summary valid: ${audit.androidReleaseSummaryErrors.length === 0 ? 'yes' : 'no'}`,
    `Android release summary errors: ${audit.androidReleaseSummaryErrors.length}`,
    ...audit.androidReleaseSummaryErrors.map(error => `- ${error}`),
    'Firebase runtime delivery validation: not claimed',
    `Warnings: ${audit.warnings.length}`,
  ];

  audit.warnings.forEach(warning => lines.push(`- ${warning}`));
  lines.push(`Wiring errors: ${audit.errors.length}`);
  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push(
    audit.ready
      ? 'Required action: none; Firebase release-services wiring is present locally.'
      : 'Required action: restore Firebase package, Android, iOS, and Messaging wiring before dependency upgrades.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Firebase release-services audit');
  console.log(`React Native Firebase package version set: ${audit.packageVersions.join(', ') || '<missing>'}`);

  if (audit.warnings.length > 0) {
    console.log('Warnings:');
    audit.warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (audit.errors.length > 0) {
    console.log('Firebase release-services wiring is invalid:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Android release summary present: ${audit.androidReleaseSummaryPresent ? 'yes' : 'no'}`);
  console.log(`Android release summary variants: ${audit.androidReleaseSummaryVariants.join(', ') || 'none'}`);
  console.log(`Android release summary valid: ${audit.androidReleaseSummaryErrors.length === 0 ? 'yes' : 'no'}`);
  console.log(`Android release summary errors: ${audit.androidReleaseSummaryErrors.length}`);
  console.log('Firebase runtime delivery validation: not claimed');
  console.log('Firebase release-services wiring is present for package family alignment, Android config, iOS plist files, and Messaging runtime paths.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectFirebaseReleaseServicesAudit();
  const summary = formatFirebaseReleaseServicesSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Firebase release-services summary written to ${path.relative(root, summaryPath)}`);
}
