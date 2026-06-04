import { getPushNotificationBridgeSummaryErrors } from './pushNotificationBridgeSummaryGuard.mjs';

const validSummary = [
  'Push notification bridge audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Push notification package dependency version: 1.12.0',
  'Push notification package installed version: 1.12.0',
  'Push notification package latest version: 1.12.0',
  'Push notification package latest published at: 2025-12-16T09:38:54.096Z',
  'Push notification package npm repository: git+https://github.com/react-native-community/push-notification-ios.git',
  'Push notification package current: yes',
  'Push notification bridge wiring valid: yes',
  'Push notification runtime delivery validation: not claimed',
  'Static readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none; static push notification bridge wiring is present locally.',
  '',
].join('\n');

const invalidSummary = [
  'Push notification bridge audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Push notification package dependency version: 1.12.0',
  'Push notification package installed version: 1.12.0',
  'Push notification package latest version: 1.12.0',
  'Push notification package latest published at: 2025-12-16T09:38:54.096Z',
  'Push notification package npm repository: git+https://github.com/react-native-community/push-notification-ios.git',
  'Push notification package current: yes',
  'Push notification bridge wiring valid: no',
  'Push notification runtime delivery validation: not claimed',
  'Static readiness issues: 1',
  '- ios/GoldWallet/Info.plist does not declare UIBackgroundModes remote-notification.',
  'Wiring errors: 1',
  '- Navigator.tsx is missing push import',
  'Required action: restore push notification bridge wiring before claiming iOS push readiness.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getPushNotificationBridgeSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getPushNotificationBridgeSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid push notification bridge summary fixture', validSummary);
assertAccepted('Invalid-wiring push notification bridge summary fixture', invalidSummary);
assertRejected('Missing header fixture', validSummary.replace('Push notification bridge audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-05-28T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected(
  'Missing dependency version fixture',
  validSummary.replace('Push notification package dependency version: 1.12.0', 'Push notification package dependency version: missing'),
  'dependency version',
);
assertRejected(
  'Installed version mismatch fixture',
  validSummary.replace('Push notification package installed version: 1.12.0', 'Push notification package installed version: 1.11.0'),
  'installed version',
);
assertRejected(
  'Latest version mismatch fixture',
  validSummary.replace('Push notification package latest version: 1.12.0', 'Push notification package latest version: 1.11.0'),
  'latest version',
);
assertRejected(
  'Missing latest publish timestamp fixture',
  validSummary.replace('Push notification package latest published at: 2025-12-16T09:38:54.096Z', 'Push notification package latest published at: missing'),
  'published timestamp',
);
assertRejected(
  'Wrong repository fixture',
  validSummary.replace(
    'Push notification package npm repository: git+https://github.com/react-native-community/push-notification-ios.git',
    'Push notification package npm repository: missing',
  ),
  'npm repository',
);
assertRejected(
  'Package not current fixture',
  validSummary.replace('Push notification package current: yes', 'Push notification package current: no'),
  'package current',
);
assertRejected(
  'Claimed runtime delivery fixture',
  validSummary.replace('Push notification runtime delivery validation: not claimed', 'Push notification runtime delivery validation: claimed'),
  'not claimed',
);
assertRejected('Bad readiness count fixture', invalidSummary.replace('Static readiness issues: 1', 'Static readiness issues: 0'), 'Static readiness issues count');
assertRejected(
  'Missing required action fixture',
  invalidSummary.replace(
    'Required action: restore push notification bridge wiring before claiming iOS push readiness.',
    'Required action: restore iOS push readiness.',
  ),
  'push notification bridge required action',
);

console.log('Push notification bridge summary guard checks are valid.');
