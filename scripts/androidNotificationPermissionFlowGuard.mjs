const requiredSourceSnippets = [
  'export const POST_NOTIFICATIONS_PERMISSION',
  "'android.permission.POST_NOTIFICATIONS'",
  'requestAndroidPostNotificationsPermission',
  'Number(platformVersion) < 33',
  'permissionsAndroid.check(permission)',
  'permissionsAndroid.request(permission)',
  'requestAndroidPostNotificationsPermission()',
  'messaging().requestPermission',
  'getFcmToken()',
];

const requiredManifestSnippets = ['android.permission.POST_NOTIFICATIONS'];

const requiredTestSnippets = [
  'does not request POST_NOTIFICATIONS outside Android',
  'does not request POST_NOTIFICATIONS before Android 13',
  'keeps existing Android 13 notification permission without requesting again',
  'requests Android 13 notification permission and returns true when granted',
  'returns false when Android 13 notification permission is denied',
];

const getMissingSnippets = (content, snippets) => snippets.filter(snippet => !content.includes(snippet));

export const getAndroidNotificationPermissionFlowErrors = ({
  notificationServiceSource,
  androidManifestSource,
  notificationServiceTestSource,
}) => {
  const errors = [];
  const missingSourceSnippets = getMissingSnippets(notificationServiceSource, requiredSourceSnippets);
  const missingManifestSnippets = getMissingSnippets(androidManifestSource, requiredManifestSnippets);
  const missingTestSnippets = getMissingSnippets(notificationServiceTestSource, requiredTestSnippets);

  missingSourceSnippets.forEach(snippet => {
    errors.push(`NotificationServices.tsx is missing "${snippet}"`);
  });
  missingManifestSnippets.forEach(snippet => {
    errors.push(`AndroidManifest.xml is missing "${snippet}"`);
  });
  missingTestSnippets.forEach(snippet => {
    errors.push(`NotificationServices.test.tsx is missing "${snippet}"`);
  });

  const permissionRequestIndex = notificationServiceSource.indexOf('requestAndroidPostNotificationsPermission()');
  const firebasePermissionRequestIndex = notificationServiceSource.indexOf('messaging().requestPermission');

  if (
    permissionRequestIndex !== -1 &&
    firebasePermissionRequestIndex !== -1 &&
    permissionRequestIndex > firebasePermissionRequestIndex
  ) {
    errors.push('NotificationServices.tsx must request Android POST_NOTIFICATIONS before Firebase Messaging permission');
  }

  return errors;
};
