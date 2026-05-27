export const expectedNativeModuleDependencies = new Map([
  ['@react-native-async-storage/async-storage', '1.24.0'],
  ['@react-native-clipboard/clipboard', '1.11.2'],
  ['@react-native-community/blur', '^4.3.0'],
  ['@react-native-community/netinfo', '^6.0.2'],
  ['@react-native-community/push-notification-ios', '^1.8.0'],
  ['@react-native-firebase/analytics', '12.7'],
  ['@react-native-firebase/app', '12.7'],
  ['@react-native-firebase/crashlytics', '12.7'],
  ['@react-native-firebase/messaging', '12.7'],
  ['@sentry/react-native', '5.36.0'],
  ['react-native-biometrics', '3.0.1'],
  ['react-native-bootsplash', '^3.2.4'],
  ['react-native-camera', '^3.33.0'],
  ['react-native-code-push', '^7.0.2'],
  ['react-native-config', '1.4.4'],
  ['react-native-device-info', '^6.0.2'],
  ['react-native-fast-image', '^8.1.5'],
  ['react-native-gesture-handler', '^1.6.1'],
  ['react-native-localize', '^1.4.0'],
  ['react-native-randombytes', '3.5.3'],
  ['react-native-safe-area-context', '^3.0.6'],
  ['react-native-screens', '3.22.1'],
  ['react-native-secure-key-store', '^2.0.10'],
  ['react-native-share', '7.9.1'],
  ['react-native-svg', '9.5.1'],
  ['react-native-tcp-socket', '^6.0.6'],
  ['react-native-vector-icons', '6.6.0'],
  ['react-native-webview', '^11.26.1'],
]);

export const getNativeModuleInventoryErrors = dependencies => {
  const errors = [];
  const dependencyMap = dependencies || {};

  expectedNativeModuleDependencies.forEach((expectedVersion, packageName) => {
    const actualVersion = dependencyMap[packageName];

    if (actualVersion === undefined) {
      errors.push({
        label: 'Expected native module dependency is missing',
        packageName,
        expectedVersion,
        actualVersion: '<missing>',
      });
      return;
    }

    if (actualVersion !== expectedVersion) {
      errors.push({
        label: 'Native module dependency version changed',
        packageName,
        expectedVersion,
        actualVersion,
      });
    }
  });

  return errors;
};

export const formatNativeModuleInventoryErrors = errors =>
  errors
    .map(error => `${error.label}: ${error.packageName} expected ${error.expectedVersion}, got ${error.actualVersion}`)
    .join('\n');
