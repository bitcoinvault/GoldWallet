import {
  getCodePushUpdateValidationCommands,
  getCodePushUpdateValidationHandoffErrors,
  getCodePushUpdateValidationReadinessErrors,
  renderCodePushUpdateValidationCommand,
} from './runCodePushUpdateValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getCodePushUpdateValidationCommands({ skipAndroidRelease: false });
const fullRendered = fullCommands.map(renderCodePushUpdateValidationCommand).join('\n');
const skippedCommands = getCodePushUpdateValidationCommands({ skipAndroidRelease: true });
const skippedRendered = skippedCommands.map(renderCodePushUpdateValidationCommand).join('\n');

[
  'corepack yarn android:dev:release:verify-local',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn codepush:release:path-audit',
  'corepack yarn codepush:release:path-check-summary',
  'corepack yarn codepush:migration:readiness-audit',
  'corepack yarn codepush:migration:readiness-check-summary',
  'corepack yarn codepush:removal-readiness:audit',
  'corepack yarn codepush:removal-readiness:check-summary',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected CodePush handoff commands to include: ${expected}`);
});

assert(
  !fullRendered.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') &&
    !fullRendered.includes('CODEPUSH_DEPLOYMENT_KEY_IOS=') &&
    !skippedRendered.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') &&
    !skippedRendered.includes('CODEPUSH_DEPLOYMENT_KEY_IOS='),
  'CodePush handoff rendered commands must not print deployment-key assignments',
);
assert(
  !skippedRendered.includes('android:dev:release:verify-local'),
  'Skipped CodePush handoff must omit Android release evidence refresh',
);
assert(
  skippedRendered.includes('corepack yarn codepush:release:path-audit'),
  'Skipped CodePush handoff must still refresh CodePush release path readiness',
);
assert(
  skippedCommands[skippedCommands.length - 1].args.includes('release-services:check-summaries'),
  'Release-services aggregate check must be the final CodePush handoff command',
);
assert(
  getCodePushUpdateValidationHandoffErrors({ skipAndroidRelease: 'false' }).some(error =>
    error.includes('skipAndroidRelease must be a boolean'),
  ),
  'Invalid skipAndroidRelease option must be rejected',
);

const readySummary = [
  'Release path ready for update validation: yes',
  'CodePush update validation: not claimed',
  'CodePush migration required: yes',
  'Secret values printed: no',
].join('\n');

const blockedSummary = [
  'Release path ready for update validation: no',
  'CodePush update validation: not claimed',
  'CodePush migration required: yes',
  'Secret values printed: no',
].join('\n');

assert(
  getCodePushUpdateValidationReadinessErrors(readySummary).length === 0,
  'Ready CodePush handoff summary fixture must pass readiness checks',
);
assert(
  getCodePushUpdateValidationReadinessErrors(blockedSummary).some(error =>
    error.includes('not ready for update validation'),
  ),
  'Blocked CodePush handoff summary fixture must report update-validation readiness blocker',
);
assert(
  getCodePushUpdateValidationReadinessErrors('Release path ready for update validation: yes').some(error =>
    error.includes('deployment-key values were not printed'),
  ),
  'CodePush readiness check must require secret-safe summary evidence',
);

console.log('CodePush update validation handoff guard checks are valid.');
