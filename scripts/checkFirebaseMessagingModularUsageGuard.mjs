import {
  expectedFirebaseMessagingModularUsage,
  getFirebaseMessagingModularUsageErrors,
} from './firebaseMessagingModularUsageGuard.mjs';

const baseSources = new Map([
  [
    'src/navigators/Navigator.tsx',
    [
      "import { getInitialNotification, getMessaging, onMessage, onNotificationOpenedApp, setBackgroundMessageHandler } from '@react-native-firebase/messaging';",
      'const firebaseMessaging = getMessaging();',
      'setBackgroundMessageHandler(firebaseMessaging, async remoteMessage => remoteMessage);',
      'onMessage(firebaseMessaging, async remoteMessage => remoteMessage);',
      'getInitialNotification(firebaseMessaging);',
      'onNotificationOpenedApp(firebaseMessaging, remoteMessage => remoteMessage);',
    ].join('\n'),
  ],
  [
    'src/services/NotificationServices.tsx',
    [
      "import { AuthorizationStatus, getMessaging, getToken, requestPermission } from '@react-native-firebase/messaging';",
      'const firebaseMessaging = getMessaging();',
      'getToken(firebaseMessaging);',
      'requestPermission(firebaseMessaging, { sound: true, badge: true });',
      'AuthorizationStatus.AUTHORIZED;',
      'AuthorizationStatus.PROVISIONAL;',
    ].join('\n'),
  ],
]);

const assertAccepted = (label, sources) => {
  const errors = getFirebaseMessagingModularUsageErrors(sources);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, sources) => {
  const errors = getFirebaseMessagingModularUsageErrors(sources);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Complete Firebase messaging modular usage fixture', baseSources);

const defaultImportFixture = new Map(baseSources);
defaultImportFixture.set(
  'src/services/NotificationServices.tsx',
  "import messaging from '@react-native-firebase/messaging';\nconst firebaseMessaging = getMessaging();",
);
assertRejected('Default messaging import fixture', defaultImportFixture);

const namespacedCallFixture = new Map(baseSources);
namespacedCallFixture.set(
  'src/navigators/Navigator.tsx',
  `${baseSources.get('src/navigators/Navigator.tsx')}\nmessaging().onMessage(() => undefined);`,
);
assertRejected('Namespaced messaging call fixture', namespacedCallFixture);

const missingRequiredSnippetFixture = new Map(baseSources);
missingRequiredSnippetFixture.set(
  'src/navigators/Navigator.tsx',
  baseSources.get('src/navigators/Navigator.tsx').replaceAll('onNotificationOpenedApp', 'legacyNotificationOpenedApp'),
);
assertRejected('Missing modular function fixture', missingRequiredSnippetFixture);

if (expectedFirebaseMessagingModularUsage.size !== 2) {
  console.error(`Expected 2 Firebase messaging modular usage files, got ${expectedFirebaseMessagingModularUsage.size}.`);
  process.exit(1);
}

console.log('Firebase messaging modular usage guard checks are valid.');
