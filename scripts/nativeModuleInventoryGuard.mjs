export const expectedNativeModuleDependencies = new Map([
  ['@react-native-async-storage/async-storage', '3.1.1'],
  ['@react-native-clipboard/clipboard', '1.16.3'],
  ['@react-native-community/blur', '4.4.1'],
  ['@react-native-community/netinfo', '12.0.1'],
  ['@react-native-community/push-notification-ios', '1.12.0'],
  ['@react-native-community/slider', '5.2.0'],
  ['@react-native-firebase/analytics', '24.1.0'],
  ['@react-native-firebase/app', '24.1.0'],
  ['@react-native-firebase/crashlytics', '24.1.0'],
  ['@react-native-firebase/messaging', '24.1.0'],
  ['@sentry/react-native', '8.13.0'],
  ['jail-monkey', '3.0.0'],
  ['react-native-background-timer', '2.4.1'],
  ['react-native-biometrics', '3.0.1'],
  ['react-native-bootsplash', '7.3.1'],
  ['react-native-camera-kit', '18.0.0'],
  ['react-native-code-push', '9.0.1'],
  ['react-native-config', '1.6.1'],
  ['react-native-device-info', '15.0.2'],
  ['react-native-exit-app', '2.0.0'],
  ['react-native-fast-image', '8.6.3'],
  ['react-native-gesture-handler', '3.0.0'],
  ['react-native-localize', '3.7.0'],
  ['react-native-get-random-values', '2.0.0'],
  ['react-native-safe-area-context', '5.8.0'],
  ['react-native-screens', '4.25.2'],
  ['react-native-secure-key-store', '2.0.10'],
  ['react-native-keychain', '10.0.0'],
  ['react-native-share', '12.3.1'],
  ['react-native-svg', '15.15.5'],
  ['react-native-tcp-socket', '6.4.1'],
  ['react-native-vector-icons', '10.3.0'],
  ['react-native-version-number', '0.3.6'],
  ['react-native-webview', '13.16.1'],
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
