import {
  expectedSentryAndroidSnippets,
  expectedSentryIosSnippets,
  expectedSentryMetroSnippets,
  getSentryReleaseIntegrationErrors,
} from './sentryReleaseIntegrationGuard.mjs';

const validFixture = {
  androidBuildGradle: expectedSentryAndroidSnippets.join('\n'),
  metroConfig: expectedSentryMetroSnippets.join('\n'),
  iosProject: [
    ...expectedSentryIosSnippets,
    ...Array.from({ length: 3 }, () => '../node_modules/@sentry/react-native/scripts/sentry-xcode.sh'),
    ...Array.from({ length: 2 }, () => '../node_modules/@sentry/react-native/scripts/sentry-xcode-debug-files.sh'),
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
assertRejected('Unsafe Android Sentry debug logging', {
  ...validFixture,
  androidBuildGradle: validFixture.androidBuildGradle.replace('logLevel: "info"', 'logLevel: "debug"'),
});
assertRejected('Missing Sentry Metro serializer', {
  ...validFixture,
  metroConfig: '',
});
assertRejected('Missing iOS dSYM upload phases', {
  ...validFixture,
  iosProject: expectedSentryIosSnippets.join('\n'),
});

console.log('Sentry release integration guard checks are valid.');
