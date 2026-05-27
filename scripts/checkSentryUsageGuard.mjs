import { expectedSentryUsageFiles, getSentryUsageScopeErrors } from './sentryUsageGuard.mjs';

const expectedUsage = [...expectedSentryUsageFiles];
const missingUsageFixture = expectedUsage.filter(filePath => filePath !== 'logger/index.ts');
const unexpectedUsageFixture = [...expectedUsage, 'src/services/NewSentryReporter.ts'];

const assertAccepted = (label, usageFiles) => {
  const errors = getSentryUsageScopeErrors(usageFiles);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => {
      console.error(`${error.label}:`);
      error.files.forEach(filePath => console.error(`- ${filePath}`));
    });
    process.exit(1);
  }
};

const assertRejected = (label, usageFiles) => {
  const errors = getSentryUsageScopeErrors(usageFiles);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Known Sentry usage scope', expectedUsage);
assertRejected('Missing Sentry usage scope', missingUsageFixture);
assertRejected('Unexpected Sentry usage scope', unexpectedUsageFixture);

console.log('Sentry usage guard checks are valid.');
