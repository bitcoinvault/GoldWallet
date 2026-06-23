import { getSentryReleaseCredentialPlanErrors } from './sentryReleaseCredentialPlanGuard.mjs';

const validPlan = [
  'Sentry release credential plan',
  'Generated at: 2026-06-12T00:00:00.000Z',
  '@sentry/react-native version: 8.15.1',
  '@sentry/cli package version: 3.5.1',
  'Release source-map prerequisites: not ready',
  'SENTRY_AUTH_TOKEN available in current shell: no',
  'Properties file readiness:',
  '- sentry.properties: missing',
  '- android/sentry.properties: missing',
  '- ios/sentry.properties: missing',
  'Missing properties files: 3',
  '- missing file: sentry.properties',
  '- missing file: android/sentry.properties',
  '- missing file: ios/sentry.properties',
  'Invalid properties files: 0',
  'Sentry release upload validation: not claimed',
  'Credential handoff steps:',
  '1. Set SENTRY_AUTH_TOKEN in the local shell or CI secret store.',
  '2. Optional: set SENTRY_ORG and SENTRY_PROJECT only when the target differs from cloudbest/goldwallet.',
  '3. Run corepack yarn sentry:release:create-properties.',
  '4. Run corepack yarn sentry:release:prereq-audit.',
  '5. Run corepack yarn sentry:release:prereq-check-summary.',
  '6. Run corepack yarn sentry:release:validation:handoff after Android release and smoke evidence are current.',
  'Review-safe evidence: file paths, env variable names, and command names only',
  'Secret values printed: no',
  'Required action: provide credentials and generate the three local-only Sentry properties files before claiming source-map upload validation.',
  '',
].join('\n');

const assertAccepted = (label, plan) => {
  const errors = getSentryReleaseCredentialPlanErrors(plan);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, plan, expectedError) => {
  const errors = getSentryReleaseCredentialPlanErrors(plan);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Sentry release credential plan fixture', validPlan);
assertRejected('Missing header fixture', validPlan.replace('Sentry release credential plan', 'Bad plan'), 'header');
assertRejected('Bad timestamp fixture', validPlan.replace('Generated at: 2026-06-12T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Token assignment fixture', validPlan.replace('Secret values printed: no', 'SENTRY_AUTH_TOKEN=secret\nSecret values printed: no'), 'secret assignments');
assertRejected('Auth token fixture', validPlan.replace('Secret values printed: no', 'auth.token=secret\nSecret values printed: no'), 'secret assignments');
assertRejected('DSN assignment fixture', validPlan.replace('Secret values printed: no', 'SENTRY_DSN=https://example\nSecret values printed: no'), 'secret assignments');
assertRejected('Missing no-secret line fixture', validPlan.replace('Secret values printed: no', 'Secret values printed: maybe'), 'secret values');
assertRejected('Missing upload claim fixture', validPlan.replace('Sentry release upload validation: not claimed', 'Sentry release upload validation: ready'), 'unclaimed');
assertRejected('Bad missing file count fixture', validPlan.replace('Missing properties files: 3', 'Missing properties files: 2'), 'missing files');
assertRejected('Missing command fixture', validPlan.replace('3. Run corepack yarn sentry:release:create-properties.', '3. Generate files manually.'), 'sentry:release:create-properties');

console.log('Sentry release credential plan guard checks are valid.');
