import { requiredSentryPropertiesFiles } from './auditSentryReleasePrerequisites.mjs';
import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';

const notReadySummary = [
  'Sentry release prerequisite audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release source-map prerequisites: not ready',
  'sentry.properties files present: no',
  `Missing files: ${requiredSentryPropertiesFiles.length}`,
  ...requiredSentryPropertiesFiles.map(relativePath => `- ${relativePath}`),
  'Invalid files: 0',
  'create-sentry-properties.sh present: yes',
  'create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: yes',
  'SENTRY_AUTH_TOKEN available in current shell: no',
  'Required action: generate sentry.properties with SENTRY_AUTH_TOKEN before claiming Sentry release validation.',
  '',
].join('\n');

const readySummary = [
  'Sentry release prerequisite audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release source-map prerequisites: ready',
  'sentry.properties files present: yes',
  'Missing files: 0',
  'Invalid files: 0',
  'create-sentry-properties.sh present: yes',
  'create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: yes',
  'SENTRY_AUTH_TOKEN available in current shell: yes',
  'Required action: none; release source-map prerequisites are present locally.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getSentryReleasePrereqSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getSentryReleasePrereqSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid not-ready Sentry release prerequisite summary fixture', notReadySummary);
assertAccepted('Valid ready Sentry release prerequisite summary fixture', readySummary);
assertRejected('Missing header fixture', notReadySummary.replace('Sentry release prerequisite audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', notReadySummary.replace('Generated at: 2026-05-28T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad missing count fixture', notReadySummary.replace(`Missing files: ${requiredSentryPropertiesFiles.length}`, 'Missing files: 0'), 'Missing files count');
assertRejected(
  'Missing required action fixture',
  notReadySummary.replace(
    'Required action: generate sentry.properties with SENTRY_AUTH_TOKEN before claiming Sentry release validation.',
    'Required action: generate sentry.properties before claiming Sentry release validation.',
  ),
  'SENTRY_AUTH_TOKEN required action',
);

console.log('Sentry release prerequisite summary guard checks are valid.');
