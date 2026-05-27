import {
  expectedFirebaseNativeUsageFiles,
  expectedFirebaseRuntimeUsageFiles,
  getFirebaseNativeUsageErrors,
  getFirebaseRuntimeUsageErrors,
} from './firebaseUsageGuard.mjs';

const expectedRuntimeUsage = [...expectedFirebaseRuntimeUsageFiles];
const expectedNativeUsage = [...expectedFirebaseNativeUsageFiles];
const missingRuntimeUsageFixture = expectedRuntimeUsage.filter(filePath => filePath !== 'src/navigators/Navigator.tsx');
const unexpectedRuntimeUsageFixture = [...expectedRuntimeUsage, 'src/services/NewFirebaseClient.ts'];
const missingNativeUsageFixture = expectedNativeUsage.filter(filePath => filePath !== 'android/app/build.gradle');
const unexpectedNativeUsageFixture = [...expectedNativeUsage, 'android/app/src/internal/google-services.json'];

const assertAccepted = (label, errors) => {
  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => {
      console.error(`${error.label}:`);
      error.files.forEach(filePath => console.error(`- ${filePath}`));
    });
    process.exit(1);
  }
};

const assertRejected = (label, errors) => {
  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Known Firebase runtime usage scope', getFirebaseRuntimeUsageErrors(expectedRuntimeUsage));
assertAccepted('Known Firebase native usage scope', getFirebaseNativeUsageErrors(expectedNativeUsage));
assertRejected('Missing Firebase runtime usage scope', getFirebaseRuntimeUsageErrors(missingRuntimeUsageFixture));
assertRejected('Unexpected Firebase runtime usage scope', getFirebaseRuntimeUsageErrors(unexpectedRuntimeUsageFixture));
assertRejected('Missing Firebase native usage scope', getFirebaseNativeUsageErrors(missingNativeUsageFixture));
assertRejected('Unexpected Firebase native usage scope', getFirebaseNativeUsageErrors(unexpectedNativeUsageFixture));

console.log('Firebase usage guard checks are valid.');
