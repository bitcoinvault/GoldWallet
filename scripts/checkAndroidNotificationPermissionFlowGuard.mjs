import { getAndroidNotificationPermissionFlowErrors } from './androidNotificationPermissionFlowGuard.mjs';

const validFixture = {
  notificationServiceSource: [
    'export const POST_NOTIFICATIONS_PERMISSION',
    "'android.permission.POST_NOTIFICATIONS'",
    'requestAndroidPostNotificationsPermission',
    'Number(platformVersion) < 33',
    'permissionsAndroid.check(permission)',
    'permissionsAndroid.request(permission)',
    'requestAndroidPostNotificationsPermission()',
    'requestPermission(firebaseMessaging',
    'getFcmToken()',
  ].join('\n'),
  androidManifestSource: '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  notificationServiceTestSource: [
    'does not request POST_NOTIFICATIONS outside Android',
    'does not request POST_NOTIFICATIONS before Android 13',
    'keeps existing Android 13 notification permission without requesting again',
    'requests Android 13 notification permission and returns true when granted',
    'returns false when Android 13 notification permission is denied',
  ].join('\n'),
};

const assertAccepted = (label, fixture) => {
  const errors = getAndroidNotificationPermissionFlowErrors(fixture);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, fixture, expectedError) => {
  const errors = getAndroidNotificationPermissionFlowErrors(fixture);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Android notification permission flow fixture', validFixture);
assertRejected(
  'Missing service permission constant fixture',
  {
    ...validFixture,
    notificationServiceSource: validFixture.notificationServiceSource.replace("'android.permission.POST_NOTIFICATIONS'", ''),
  },
  'NotificationServices.tsx',
);
assertRejected(
  'Missing manifest permission fixture',
  {
    ...validFixture,
    androidManifestSource: '<manifest />',
  },
  'AndroidManifest.xml',
);
assertRejected(
  'Missing denied-permission test fixture',
  {
    ...validFixture,
    notificationServiceTestSource: validFixture.notificationServiceTestSource.replace(
      'returns false when Android 13 notification permission is denied',
      '',
    ),
  },
  'NotificationServices.test.tsx',
);
assertRejected(
  'Permission requested after Firebase fixture',
  {
    ...validFixture,
    notificationServiceSource: validFixture.notificationServiceSource
      .replace('requestAndroidPostNotificationsPermission()', 'TEMP_MARKER')
      .replace('requestPermission(firebaseMessaging', 'requestAndroidPostNotificationsPermission()')
      .replace('TEMP_MARKER', 'requestPermission(firebaseMessaging'),
  },
  'before Firebase Messaging permission',
);

console.log('Android notification permission flow guard checks are valid.');
