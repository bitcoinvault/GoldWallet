import { getFirebaseReleaseServicesSummaryErrors } from './firebaseReleaseServicesSummaryGuard.mjs';

const validSummary = [
  'Firebase release-services audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'React Native Firebase package version set: 26.0.0',
  'React Native Firebase latest version: 26.0.0',
  'React Native Firebase latest published at: 2026-07-29T17:35:29.257Z',
  'React Native Firebase npm repository: git+https://github.com/invertase/react-native-firebase.git#main',
  'React Native Firebase Messaging latest version: 26.0.0',
  'React Native Firebase Messaging peer app version: 26.0.0',
  'React Native Firebase package current: yes',
  'Android Google Services Gradle plugin: 4.5.0',
  'Android Firebase Crashlytics Gradle plugin: 3.0.7',
  'Android strict version matcher plugin: 1.2.4',
  'Firebase release-services wiring valid: yes',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release summary errors: 0',
  'Android release APK manifest valid: yes',
  'Android release APK manifest errors: 0',
  'Firebase runtime delivery validation: not claimed',
  'Warnings: 0',
  'Wiring errors: 0',
  'Required action: none; Firebase release-services wiring is present locally.',
  '',
].join('\n');

const invalidSummary = [
  'Firebase release-services audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'React Native Firebase package version set: 26.0.0',
  'React Native Firebase latest version: 26.0.0',
  'React Native Firebase latest published at: 2026-07-29T17:35:29.257Z',
  'React Native Firebase npm repository: git+https://github.com/invertase/react-native-firebase.git#main',
  'React Native Firebase Messaging latest version: 26.0.0',
  'React Native Firebase Messaging peer app version: 26.0.0',
  'React Native Firebase package current: yes',
  'Android Google Services Gradle plugin: 4.5.0',
  'Android Firebase Crashlytics Gradle plugin: 3.0.7',
  'Android strict version matcher plugin: 1.2.4',
  'Firebase release-services wiring valid: no',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release summary errors: 0',
  'Android release APK manifest valid: yes',
  'Android release APK manifest errors: 0',
  'Firebase runtime delivery validation: not claimed',
  'Warnings: 0',
  'Wiring errors: 1',
  '- android/app/build.gradle is missing "apply plugin: \'com.google.gms.google-services\'"',
  'Required action: restore Firebase package, Android, iOS, and Messaging wiring before dependency upgrades.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getFirebaseReleaseServicesSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getFirebaseReleaseServicesSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Firebase release-services summary fixture', validSummary);
assertAccepted('Invalid-wiring Firebase release-services summary fixture', invalidSummary);
assertRejected('Missing header fixture', validSummary.replace('Firebase release-services audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-05-28T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Missing latest Firebase fixture', validSummary.replace('React Native Firebase latest version: 26.0.0', 'React Native Firebase latest version: missing'), 'latest version');
assertRejected(
  'Missing latest publish timestamp fixture',
  validSummary.replace('React Native Firebase latest published at: 2026-07-29T17:35:29.257Z', 'React Native Firebase latest published at: missing'),
  'published timestamp',
);
assertRejected(
  'Wrong Firebase repository fixture',
  validSummary.replace(
    'React Native Firebase npm repository: git+https://github.com/invertase/react-native-firebase.git#main',
    'React Native Firebase npm repository: missing',
  ),
  'npm repository',
);
assertRejected(
  'Messaging latest mismatch fixture',
  validSummary.replace('React Native Firebase Messaging latest version: 26.0.0', 'React Native Firebase Messaging latest version: 23.0.0'),
  'Messaging latest version',
);
assertRejected(
  'Messaging peer mismatch fixture',
  validSummary.replace('React Native Firebase Messaging peer app version: 26.0.0', 'React Native Firebase Messaging peer app version: 23.0.0'),
  'Messaging peer app version',
);
assertRejected('Firebase package not current fixture', validSummary.replace('React Native Firebase package current: yes', 'React Native Firebase package current: no'), 'package current');
assertRejected(
  'Old Google Services Gradle plugin fixture',
  validSummary.replace('Android Google Services Gradle plugin: 4.5.0', 'Android Google Services Gradle plugin: 4.3.15'),
  'Google Services Gradle plugin',
);
assertRejected(
  'Old Crashlytics Gradle plugin fixture',
  validSummary.replace('Android Firebase Crashlytics Gradle plugin: 3.0.7', 'Android Firebase Crashlytics Gradle plugin: 2.9.0'),
  'Crashlytics Gradle plugin',
);
assertRejected(
  'Changed strict version matcher plugin fixture',
  validSummary.replace('Android strict version matcher plugin: 1.2.4', 'Android strict version matcher plugin: 1.2.3'),
  'strict version matcher plugin',
);
assertRejected(
  'Claimed Firebase runtime delivery fixture',
  validSummary.replace('Firebase runtime delivery validation: not claimed', 'Firebase runtime delivery validation: claimed'),
  'not claimed',
);
assertRejected(
  'Missing release variant fixture',
  validSummary.replace('Android release summary variants: dev, stage, prod, beta', 'Android release summary variants: dev, stage, prod'),
  'beta release evidence',
);
assertRejected(
  'Stale Android release inputs fixture',
  validSummary.replace('Android release summary current inputs covered: yes', 'Android release summary current inputs covered: no'),
  'current release inputs',
);
assertRejected(
  'Invalid Android release APK manifest fixture',
  validSummary.replace(
    'Android release APK manifest valid: yes\nAndroid release APK manifest errors: 0',
    'Android release APK manifest valid: yes\nAndroid release APK manifest errors: 1\n- Variant prod package name mismatch: expected io.goldwallet.wallet, received io.goldwallet.wallet.prod',
  ),
  '0 manifest errors',
);
assertRejected(
  'Missing required action fixture',
  invalidSummary.replace(
    'Required action: restore Firebase package, Android, iOS, and Messaging wiring before dependency upgrades.',
    'Required action: restore Firebase wiring.',
  ),
  'Firebase wiring required action',
);

console.log('Firebase release-services summary guard checks are valid.');
