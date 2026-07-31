import { getSentryPropertiesReadiness } from './auditSentryReleasePrerequisites.mjs';

const content = ({
  url = 'https://sentry.io/',
  org = 'decentraplanet',
  project = 'goldwallet',
  token = 'fixture-token',
} = {}) =>
  [`defaults.url=${url}`, `defaults.org=${org}`, `defaults.project=${project}`, `auth.token=${token}`, ''].join('\n');

const assertStatus = (label, options, expectedStatus) => {
  const result = getSentryPropertiesReadiness(options);
  if (result.status !== expectedStatus) {
    console.error(`${label}: expected ${expectedStatus}, received ${result.status}`);
    process.exit(1);
  }
};

assertStatus('Persisted custom target without inherited env', { content: content() }, 'ready');
assertStatus(
  'Persisted custom target with matching env',
  { content: content(), env: { SENTRY_ORG: 'decentraplanet', SENTRY_PROJECT: 'goldwallet' } },
  'ready',
);
assertStatus(
  'Persisted target with conflicting explicit env',
  { content: content(), env: { SENTRY_ORG: 'different-org' } },
  'invalid',
);
assertStatus('Unexpected Sentry URL', { content: content({ url: 'https://example.invalid/' }) }, 'invalid');
assertStatus('Blank organization', { content: content({ org: ' ' }) }, 'invalid');
assertStatus('Blank project', { content: content({ project: ' ' }) }, 'invalid');
assertStatus('Blank token', { content: content({ token: ' ' }) }, 'invalid');
assertStatus(
  'Missing required key',
  { content: content().replace('defaults.project=goldwallet\n', '') },
  'invalid',
);

console.log('Sentry properties readiness guard checks are valid.');
