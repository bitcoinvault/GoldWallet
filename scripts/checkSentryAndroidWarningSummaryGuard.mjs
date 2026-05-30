import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';

const validSummary = [
  'Sentry Android warning audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  '@sentry/react-native manifest version: 8.13.0',
  'Sentry Gradle getProperties() references: 107, 502, 522',
  'Sentry Android warning wiring valid: yes',
  'Sentry Android warning baseline stable: yes',
  'Warnings: 2',
  '- Latest Android warning audit does not report an active Sentry execResult warning on the RN 0.81 baseline.',
  '- Sentry is on 8.13.0; source-map and dSYM behavior still require release validation with local Sentry credentials.',
  'Readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none for Android warning cleanup; keep Sentry SDK/source-map changes in a dedicated release validation branch.',
  '',
].join('\n');

const invalidSummary = [
  'Sentry Android warning audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  '@sentry/react-native manifest version: 9.0.0',
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
assertRejected('Bad warning count fixture', validSummary.replace('Warnings: 2', 'Warnings: 1'), 'Warnings count');
assertRejected(
  'Missing required action fixture',
  invalidSummary.replace(
    'Required action: restore Sentry Android warning baseline before changing Sentry release tooling.',
    'Required action: restore Sentry.',
  ),
  'Sentry Android warning restoration required action',
);

console.log('Sentry Android warning summary guard checks are valid.');
