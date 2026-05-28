import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';

const validSummary = [
  'Sentry Android warning audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  '@sentry/react-native manifest version: 5.36.0',
  'Sentry Gradle getProperties() references: 48, 376, 396',
  'Sentry Android warning wiring valid: yes',
  'Sentry Android warning baseline stable: yes',
  'Warnings: 1',
  '- Sentry remains on 5.36.0; removing the execResult warning safely requires a dedicated release/source-map validation branch.',
  'Readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none; Sentry Android warning baseline is stable for a dedicated release/source-map cleanup branch.',
  '',
].join('\n');

const invalidSummary = [
  'Sentry Android warning audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  '@sentry/react-native manifest version: 8.12.0',
  'Sentry Gradle getProperties() references: <none>',
  'Sentry Android warning wiring valid: no',
  'Sentry Android warning baseline stable: no',
  'Warnings: 0',
  'Readiness issues: 1',
  '- Expected Sentry Gradle warning source at sentry.gradle:48 was not found; refresh the Android warning baseline.',
  'Wiring errors: 1',
  '- sentry.gradle is missing "bundleTask.getProperties()"',
  'Required action: restore Sentry Android warning baseline before changing Sentry release tooling.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getSentryAndroidWarningSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getSentryAndroidWarningSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Sentry Android warning summary fixture', validSummary);
assertAccepted('Invalid-baseline Sentry Android warning summary fixture', invalidSummary);
assertRejected('Missing header fixture', validSummary.replace('Sentry Android warning audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-05-28T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad warning count fixture', validSummary.replace('Warnings: 1', 'Warnings: 0'), 'Warnings count');
assertRejected(
  'Missing required action fixture',
  invalidSummary.replace(
    'Required action: restore Sentry Android warning baseline before changing Sentry release tooling.',
    'Required action: restore Sentry.',
  ),
  'Sentry Android warning restoration required action',
);

console.log('Sentry Android warning summary guard checks are valid.');
