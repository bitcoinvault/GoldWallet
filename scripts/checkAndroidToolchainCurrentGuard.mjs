import {
  expectedAndroidToolchainCurrentState,
  getAndroidToolchainCurrentStateErrors,
} from './checkAndroidToolchainCurrent.mjs';

const validValues = {
  ...expectedAndroidToolchainCurrentState,
  javaCommand: 'fixture-java',
  jdkGuardPresent: true,
  javaError: '',
};

const assertAccepted = (label, values) => {
  const errors = getAndroidToolchainCurrentStateErrors(values);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, values, expectedError) => {
  const errors = getAndroidToolchainCurrentStateErrors(values);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Android toolchain current-state fixture', validValues);
assertRejected('Bad Java fixture', { ...validValues, javaMajor: '21' }, 'javaMajor');
assertRejected('Bad AGP fixture', { ...validValues, agp: '9.2.1' }, 'agp');
assertRejected('Bad Gradle fixture', { ...validValues, gradle: '9.5.1' }, 'gradle');
assertRejected('Bad Kotlin fixture', { ...validValues, kotlin: '2.4.0' }, 'kotlin');
assertRejected('Bad build tools fixture', { ...validValues, buildTools: '35.0.0' }, 'buildTools');
assertRejected('Bad min SDK fixture', { ...validValues, minSdk: '23' }, 'minSdk');
assertRejected('Bad compile SDK fixture', { ...validValues, compileSdk: '35' }, 'compileSdk');
assertRejected('Bad target SDK fixture', { ...validValues, targetSdk: '35' }, 'targetSdk');
assertRejected('Bad NDK fixture', { ...validValues, ndk: '26.1.10909125' }, 'ndk');
assertRejected('Bad RN Gradle plugin fixture', { ...validValues, rnGradlePlugin: '0.87.0' }, 'rnGradlePlugin');
assertRejected('Disabled New Architecture fixture', { ...validValues, newArchEnabled: 'false' }, 'newArchEnabled');
assertRejected('Disabled Hermes fixture', { ...validValues, hermesEnabled: 'false' }, 'hermesEnabled');
assertRejected('Missing JDK guard fixture', { ...validValues, jdkGuardPresent: false }, 'JDK 17 Gradle guard');
assertRejected('Java execution error fixture', { ...validValues, javaError: 'ENOENT' }, 'unable to run Java version check');

console.log('Android toolchain current-state guard checks are valid.');
