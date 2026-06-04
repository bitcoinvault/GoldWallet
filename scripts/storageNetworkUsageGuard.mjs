export const expectedStorageNetworkUsage = new Map([
  [
    '@react-native-async-storage/async-storage',
    new Set([
      'class/app-storage.js',
      'src/helpers/fees.ts',
      'src/helpers/reduxPersist.ts',
      'src/navigators/Navigator.tsx',
      'src/services/StoreService.ts',
      'tests/integration/Storage.test.js',
      'tests/setup.js',
    ]),
  ],
  ['@react-native-community/netinfo', new Set(['src/state/electrumX/sagas.ts'])],
  [
    'react-native-device-info',
    new Set([
      'src/navigators/Navigator.tsx',
      'src/screens/Settings/AboutUsScreen.tsx',
      'src/services/DeviceSecurityService.ts',
    ]),
  ],
  ['react-native-config', new Set(['src/config/index.ts'])],
  ['react-native-localize', new Set(['tests/setup.js'])],
  [
    'react-native-keychain',
    new Set([
      'class/app-storage.js',
      'src/services/SecureStorageService.ts',
      'tests/integration/Storage.test.js',
      'tests/unit/SecureStorageService.test.js',
    ]),
  ],
  [
    'react-native-secure-key-store',
    new Set([
      'class/app-storage.js',
      'src/services/SecureStorageService.ts',
      'tests/integration/Storage.test.js',
      'tests/unit/SecureStorageService.test.js',
    ]),
  ],
  ['react-native-tcp-socket', new Set(['src/network/socket.tsx'])],
  [
    'react-native-webview',
    new Set(['src/screens/Settings/TermsConditionsSettingsScreen.tsx', 'src/screens/TermsConditionsScreen.tsx']),
  ],
]);

const toSet = value => (value instanceof Set ? value : new Set(value));

export const getStorageNetworkUsageErrors = usageByPackage => {
  const usageMap = usageByPackage instanceof Map ? usageByPackage : new Map(Object.entries(usageByPackage));
  const errors = [];

  expectedStorageNetworkUsage.forEach((expectedFiles, packageName) => {
    const actualFiles = toSet(usageMap.get(packageName) || []);
    const missingUsage = [...expectedFiles].filter(filePath => !actualFiles.has(filePath));
    const unexpectedUsage = [...actualFiles].filter(filePath => !expectedFiles.has(filePath));

    if (unexpectedUsage.length > 0) {
      errors.push({
        label: `Unexpected ${packageName} usage found`,
        files: unexpectedUsage,
      });
    }

    if (missingUsage.length > 0) {
      errors.push({
        label: `Expected ${packageName} usage is missing`,
        files: missingUsage,
      });
    }
  });

  usageMap.forEach((actualFiles, packageName) => {
    if (!expectedStorageNetworkUsage.has(packageName) && toSet(actualFiles).size > 0) {
      errors.push({
        label: `Unexpected tracked storage/network package ${packageName} found`,
        files: [...toSet(actualFiles)],
      });
    }
  });

  return errors;
};

export const formatStorageNetworkUsageErrors = errors =>
  errors.map(error => `${error.label}:\n${error.files.map(filePath => `- ${filePath}`).join('\n')}`).join('\n');
