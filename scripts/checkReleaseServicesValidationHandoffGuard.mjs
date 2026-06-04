import {
  getReleaseServicesValidationCommands,
  getReleaseServicesValidationHandoffErrors,
  renderReleaseServicesValidationCommand,
} from './runReleaseServicesValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getReleaseServicesValidationCommands({ skipAndroidRelease: false });
const fullRendered = fullCommands.map(renderReleaseServicesValidationCommand).join('\n');
const skippedCommands = getReleaseServicesValidationCommands({ skipAndroidRelease: true });
const skippedRendered = skippedCommands.map(renderReleaseServicesValidationCommand).join('\n');

[
  'corepack yarn android:dev:release:verify-local',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn sentry:android-warning:audit',
  'corepack yarn sentry:android-warning:check-summary',
  'corepack yarn sentry:release:prereq-audit',
  'corepack yarn sentry:release:prereq-check-summary',
  'corepack yarn firebase:release-services:audit',
  'corepack yarn firebase:release-services:check-summary',
  'corepack yarn codepush:release:path-audit',
  'corepack yarn codepush:release:path-check-summary',
  'corepack yarn codepush:migration:readiness-audit',
  'corepack yarn codepush:migration:readiness-check-summary',
  'corepack yarn codepush:removal-readiness:audit',
  'corepack yarn codepush:removal-readiness:check-summary',
  'corepack yarn push-notification:bridge-audit',
  'corepack yarn push-notification:bridge-check-summary',
  'corepack yarn ios:release:readiness:audit',
  'corepack yarn ios:release:readiness:check-summary',
  'corepack yarn ios:mac-validation-prereq:audit',
  'corepack yarn ios:mac-validation-prereq:check-summary',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected release-services handoff commands to include: ${expected}`);
});

assert(
  !skippedRendered.includes('android:dev:release:verify-local'),
  'Skipped release-services handoff must omit Android release evidence refresh',
);
assert(
  skippedRendered.includes('corepack yarn sentry:release:prereq-audit'),
  'Skipped release-services handoff must still include Sentry prereq audit',
);
assert(
  skippedCommands[skippedCommands.length - 1].args.includes('release-services:check-summaries'),
  'Release-services aggregate check must be the final handoff command',
);
assert(
  getReleaseServicesValidationHandoffErrors({ skipAndroidRelease: 'false' }).some(error =>
    error.includes('skipAndroidRelease must be a boolean'),
  ),
  'Invalid skipAndroidRelease option must be rejected',
);

console.log('Release-services validation handoff guard checks are valid.');
