import {
  getSentryReleaseValidationCommands,
  getSentryReleaseValidationHandoffErrors,
  renderSentryReleaseValidationCommand,
} from './runSentryReleaseValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getSentryReleaseValidationCommands({ skipAndroidRelease: false });
const fullRendered = fullCommands.map(renderSentryReleaseValidationCommand).join('\n');
const skippedCommands = getSentryReleaseValidationCommands({ skipAndroidRelease: true });
const skippedRendered = skippedCommands.map(renderSentryReleaseValidationCommand).join('\n');

[
  'corepack yarn check:sentry-properties-generator',
  'corepack yarn android:dev:release:verify-local',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn sentry:release:create-properties',
  'requires-env=SENTRY_AUTH_TOKEN',
  'corepack yarn sentry:release:prereq-audit',
  'corepack yarn sentry:release:prereq-check-summary',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected Sentry handoff commands to include: ${expected}`);
});

assert(
  !fullRendered.includes('SENTRY_AUTH_TOKEN=') && !skippedRendered.includes('SENTRY_AUTH_TOKEN='),
  'Sentry handoff rendered commands must not print SENTRY_AUTH_TOKEN assignments',
);
assert(
  !skippedRendered.includes('android:dev:release:verify-local'),
  'Skipped Sentry handoff must omit Android release evidence refresh',
);
assert(
  skippedRendered.includes('corepack yarn sentry:release:create-properties'),
  'Skipped Sentry handoff must still generate Sentry release properties',
);
assert(
  fullCommands[0].args.includes('check:sentry-properties-generator'),
  'Sentry properties generator guard must run before properties are generated',
);
assert(
  fullCommands[fullCommands.length - 1].args.includes('release-services:check-summaries'),
  'Release-services aggregate check must be the final Sentry handoff command',
);
assert(
  getSentryReleaseValidationHandoffErrors({ skipAndroidRelease: 'false' }).some(error =>
    error.includes('skipAndroidRelease must be a boolean'),
  ),
  'Invalid skipAndroidRelease option must be rejected',
);

console.log('Sentry release validation handoff guard checks are valid.');
