import { getSentryRnBundleTaskCompatibilitySummaryErrors } from './sentryRnBundleTaskCompatibilitySummaryGuard.mjs';

const validBlockedSummary = [
  'Sentry RN bundle task compatibility audit',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'Sentry RN bundle task compatibility ready: no',
  '@sentry/react-native version: 8.20.0',
  'react-native version: 0.86.0',
  'Sentry expects jsIntermediateSourceMapsDir Directory: yes',
  'Sentry fallback requires args property: yes',
  'RN BundleHermesCTask jsIntermediateSourceMapsDir type: RegularFileProperty',
  'RN BundleHermesCTask exposes args property: no',
  'Repo keeps Sentry root extra property: yes',
  'Repo sets legacy args shim: no',
  'Repo attempts dynamic args workaround: no',
  'Repo-owned args workaround safe: no',
  'Evidence errors: 0',
  'Required action: keep Sentry source-map upload not claimed until an upstream Sentry/RN Gradle compatibility fix or credentialed release-runner proof confirms upload works.',
  '',
].join('\n');

const validReadySummary = validBlockedSummary
  .replace('Sentry RN bundle task compatibility ready: no', 'Sentry RN bundle task compatibility ready: yes')
  .replace('Repo sets legacy args shim: no', 'Repo sets legacy args shim: yes')
  .replace('Repo attempts dynamic args workaround: no', 'Repo attempts dynamic args workaround: yes')
  .replace('Repo-owned args workaround safe: no', 'Repo-owned args workaround safe: yes')
  .replace(
    'Required action: keep Sentry source-map upload not claimed until an upstream Sentry/RN Gradle compatibility fix or credentialed release-runner proof confirms upload works.',
    'Required action: none',
  );

const assertAccepted = (label, summary) => {
  const errors = getSentryRnBundleTaskCompatibilitySummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getSentryRnBundleTaskCompatibilitySummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Blocked compatibility summary fixture', validBlockedSummary);
assertAccepted('Ready compatibility summary fixture', validReadySummary);
assertRejected('Missing header fixture', validBlockedSummary.replace('Sentry RN bundle task compatibility audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validBlockedSummary.replace('Generated at: 2026-06-11T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad required action fixture', validBlockedSummary.replace('upstream Sentry/RN Gradle compatibility fix', 'manual workaround'), 'upstream Sentry/RN Gradle compatibility fix');

console.log('Sentry RN bundle task compatibility summary guard checks are valid.');
