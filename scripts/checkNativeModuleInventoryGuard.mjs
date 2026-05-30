import {
  expectedNativeModuleDependencies,
  formatNativeModuleInventoryErrors,
  getNativeModuleInventoryErrors,
} from './nativeModuleInventoryGuard.mjs';

const expectedDependencies = Object.fromEntries(expectedNativeModuleDependencies);
const missingDependencyFixture = { ...expectedDependencies };
delete missingDependencyFixture['react-native-camera-kit'];

const changedDependencyFixture = {
  ...expectedDependencies,
  '@sentry/react-native': '5.36.0',
};

const assertAccepted = (label, dependencies) => {
  const errors = getNativeModuleInventoryErrors(dependencies);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    console.error(formatNativeModuleInventoryErrors(errors));
    process.exit(1);
  }
};

const assertRejected = (label, dependencies) => {
  const errors = getNativeModuleInventoryErrors(dependencies);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Known native module inventory', expectedDependencies);
assertRejected('Missing native module dependency', missingDependencyFixture);
assertRejected('Changed native module dependency version', changedDependencyFixture);

console.log('Native module inventory guard checks are valid.');
