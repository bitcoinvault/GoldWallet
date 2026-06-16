export const expectedFirebaseMessagingModularUsage = new Map([
  [
    'src/navigators/Navigator.tsx',
    ['getMessaging', 'setBackgroundMessageHandler', 'onMessage', 'getInitialNotification', 'onNotificationOpenedApp'],
  ],
  ['src/services/NotificationServices.tsx', ['AuthorizationStatus', 'getMessaging', 'getToken', 'requestPermission']],
]);

const blockedPatterns = [
  {
    label: 'Default messaging import is not allowed',
    pattern: /import\s+messaging\s+from\s+['"]@react-native-firebase\/messaging['"]/,
  },
  {
    label: 'Namespaced messaging() calls are not allowed',
    pattern: /\bmessaging\s*\(/,
  },
  {
    label: 'Namespaced messaging.AuthorizationStatus is not allowed',
    pattern: /messaging\.AuthorizationStatus/,
  },
];

export const getFirebaseMessagingModularUsageErrors = sources => {
  const sourceMap = sources instanceof Map ? sources : new Map(Object.entries(sources));
  const errors = [];

  expectedFirebaseMessagingModularUsage.forEach((requiredSnippets, filePath) => {
    const source = sourceMap.get(filePath);

    if (source === undefined) {
      errors.push(`${filePath} is missing from Firebase messaging modular usage input.`);
      return;
    }

    blockedPatterns.forEach(({ label, pattern }) => {
      if (pattern.test(source)) {
        errors.push(`${filePath}: ${label}.`);
      }
    });

    requiredSnippets.forEach(snippet => {
      if (!source.includes(snippet)) {
        errors.push(`${filePath} is missing modular messaging snippet: ${snippet}`);
      }
    });
  });

  return errors;
};
