import {
  expectedStorageNetworkUsage,
  formatStorageNetworkUsageErrors,
  getStorageNetworkUsageErrors,
} from './storageNetworkUsageGuard.mjs';

const cloneExpectedUsage = () => new Map([...expectedStorageNetworkUsage.entries()].map(([key, value]) => [key, new Set(value)]));
const completeFixture = cloneExpectedUsage();
const missingUsageFixture = cloneExpectedUsage();
missingUsageFixture.get('@react-native-async-storage/async-storage').delete('src/services/StoreService.ts');
const unexpectedUsageFixture = cloneExpectedUsage();
unexpectedUsageFixture.get('react-native-webview').add('src/screens/NewWebViewScreen.tsx');
const unexpectedPackageFixture = cloneExpectedUsage();
unexpectedPackageFixture.set('react-native-new-storage', new Set(['src/services/NewStorage.ts']));

const assertAccepted = (label, usageByPackage) => {
  const errors = getStorageNetworkUsageErrors(usageByPackage);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    console.error(formatStorageNetworkUsageErrors(errors));
    process.exit(1);
  }
};

const assertRejected = (label, usageByPackage) => {
  const errors = getStorageNetworkUsageErrors(usageByPackage);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Known storage/network usage scope', completeFixture);
assertRejected('Missing storage/network usage scope', missingUsageFixture);
assertRejected('Unexpected storage/network usage scope', unexpectedUsageFixture);
assertRejected('Unexpected storage/network package scope', unexpectedPackageFixture);

if (expectedStorageNetworkUsage.size !== 9) {
  console.error(`Expected 9 storage/network tracked packages, got ${expectedStorageNetworkUsage.size}.`);
  process.exit(1);
}

console.log('Storage/network usage guard checks are valid.');
