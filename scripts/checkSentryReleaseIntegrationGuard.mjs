import {
  expectedSentryAndroidSnippets,
  expectedSentryIosSnippets,
  getSentryReleaseIntegrationErrors,
} from './sentryReleaseIntegrationGuard.mjs';

const validFixture = {
  androidBuildGradle: expectedSentryAndroidSnippets.join('\n'),
  iosProject: [
    ...expectedSentryIosSnippets,
    ...Array.from({ length: 2 }, () => '../node_modules/@sentry/cli/bin/sentry-cli react-native xcode'),
    ...Array.from({ length: 2 }, () => '../node_modules/@sentry/cli/bin/sentry-cli upload-dsym'),
  ].join('\n'),
};

const assertAccepted = (label, fixture) => {
  const errors = getSentryReleaseIntegrationErrors(fixture);

  if (errors.length > 0) {
    console.error(`${label} should be accepted:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, fixture) => {
  const errors = getSentryReleaseIntegrationErrors(fixture);

  if (errors.length === 0) {
    console.error(`${label} should be rejected.`);
    process.exit(1);
  }
};

assertAccepted('Known Sentry release integration', validFixture);
assertRejected('Missing Android sentry.gradle integration', {
  ...validFixture,
  androidBuildGradle: 'project.ext.sentryCli',
});
assertRejected('Missing iOS dSYM upload phases', {
  ...validFixture,
  iosProject: expectedSentryIosSnippets.join('\n'),
});

console.log('Sentry release integration guard checks are valid.');
