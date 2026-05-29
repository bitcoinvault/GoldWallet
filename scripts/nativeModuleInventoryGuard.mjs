export const expectedNativeModuleDependencies = new Map([
  ['@react-native-async-storage/async-storage', '2.2.0'],
  ['@react-native-clipboard/clipboard', '1.11.2'],
  ['@react-native-community/blur', '4.4.1'],
  ['@react-native-community/masked-view', '0.1.11'],
  ['@react-native-community/netinfo', '6.2.1'],
  ['@react-native-community/push-notification-ios', '1.12.0'],
  ['@react-native-community/toolbar-android', '0.2.1'],
  ['@react-native-firebase/analytics', '12.7'],
  ['@react-native-firebase/app', '12.7'],
  ['@react-native-firebase/crashlytics', '12.7'],
  ['@react-native-firebase/messaging', '12.7'],
  ['@sentry/react-native', '5.36.0'],
  ['react-native-background-timer', '2.4.1'],
  ['react-native-biometrics', '3.0.1'],
  ['react-native-bootsplash', '3.2.7'],
  ['react-native-camera', '^3.33.0'],
  ['react-native-code-push', '7.0.2'],
  ['react-native-config', '1.5.9'],
  ['react-native-device-info', '6.2.1'],
  ['react-native-exit-app', '2.0.0'],
  ['react-native-fast-image', '8.6.3'],
  ['react-native-gesture-handler', '1.10.3'],
  ['react-native-localize', '3.7.0'],
  ['react-native-randombytes', '3.6.2'],
  ['react-native-safe-area-context', '5.8.0'],
  ['react-native-screens', '4.5.0'],
  ['react-native-secure-key-store', '2.0.10'],
  ['react-native-share', '7.9.1'],
  ['react-native-svg', '15.15.5'],
  ['react-native-tcp-socket', '6.4.1'],
  ['react-native-vector-icons', '6.7.0'],
  ['react-native-version-number', '0.3.6'],
  ['react-native-webview', '11.26.1'],
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
