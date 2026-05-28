import { getPushNotificationBridgeSummaryErrors } from './pushNotificationBridgeSummaryGuard.mjs';

const validSummary = [
  'Push notification bridge audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Push notification bridge wiring valid: yes',
  'Static readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none; static push notification bridge wiring is present locally.',
  '',
].join('\n');

const invalidSummary = [
  'Push notification bridge audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Push notification bridge wiring valid: no',
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
