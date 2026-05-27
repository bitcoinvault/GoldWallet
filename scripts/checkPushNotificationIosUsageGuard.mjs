import {
  expectedPushNotificationIosNativeUsageFiles,
  expectedPushNotificationIosRuntimeUsageFiles,
  getPushNotificationIosNativeUsageErrors,
  getPushNotificationIosRuntimeUsageErrors,
} from './pushNotificationIosUsageGuard.mjs';

const expectedRuntimeUsage = [...expectedPushNotificationIosRuntimeUsageFiles];
const expectedNativeUsage = [...expectedPushNotificationIosNativeUsageFiles];
const missingRuntimeUsageFixture = [];
const unexpectedRuntimeUsageFixture = [...expectedRuntimeUsage, 'src/services/NewPushNotificationIosClient.ts'];
const missingNativeUsageFixture = expectedNativeUsage.filter(filePath => filePath !== 'ios/GoldWallet/AppDelegate.m');
const unexpectedNativeUsageFixture = [...expectedNativeUsage, 'ios/GoldWallet/PushNotificationDelegate.m'];

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

assertAccepted(
  'Known iOS push notification runtime usage scope',
  getPushNotificationIosRuntimeUsageErrors(expectedRuntimeUsage),
);
assertAccepted(
  'Known iOS push notification native usage scope',
  getPushNotificationIosNativeUsageErrors(expectedNativeUsage),
);
assertRejected(
  'Missing iOS push notification runtime usage scope',
  getPushNotificationIosRuntimeUsageErrors(missingRuntimeUsageFixture),
);
assertRejected(
  'Unexpected iOS push notification runtime usage scope',
  getPushNotificationIosRuntimeUsageErrors(unexpectedRuntimeUsageFixture),
);
assertRejected(
  'Missing iOS push notification native usage scope',
  getPushNotificationIosNativeUsageErrors(missingNativeUsageFixture),
);
assertRejected(
  'Unexpected iOS push notification native usage scope',
  getPushNotificationIosNativeUsageErrors(unexpectedNativeUsageFixture),
);

console.log('iOS push notification usage guard checks are valid.');
