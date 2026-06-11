import path from 'path';
import {
  getReleaseServicesValidationCommands,
  getReleaseServicesValidationHandoffErrors,
  getReleaseServicesValidationReadinessErrors,
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
const removeDecisionCommands = getReleaseServicesValidationCommands({
  skipAndroidRelease: true,
  codePushDecision: 'remove',
  codePushBetaStrategy: 'beta-has-no-ota',
});
const removeDecisionRendered = removeDecisionCommands.map(renderReleaseServicesValidationCommand).join('\n');

[
  'corepack yarn android:dev:release:verify-local',
  'corepack yarn android:dev:release:smoke:embedded',
  'corepack yarn android:dev:release:check-smoke-summary',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn check:sentry-properties-generator',
  'corepack yarn sentry:android-warning:audit',
  'corepack yarn sentry:android-warning:check-summary',
  'corepack yarn sentry:rn-bundle-task-compat:audit',
  'corepack yarn sentry:rn-bundle-task-compat:check-summary',
  'corepack yarn sentry:release:prereq-audit',
  'corepack yarn sentry:release:prereq-check-summary',
  'corepack yarn firebase:release-services:audit',
  'corepack yarn firebase:release-services:check-summary',
  'corepack yarn check:codepush-update-validation-handoff-guard',
  'corepack yarn codepush:release:path-audit',
  'corepack yarn codepush:release:path-check-summary',
  'corepack yarn codepush:migration:readiness-audit',
  'corepack yarn codepush:migration:readiness-check-summary',
  'corepack yarn codepush:removal-readiness:audit',
  'corepack yarn codepush:removal-readiness:check-summary',
  'corepack yarn codepush:decision:handoff --decision pending --beta-strategy unconfirmed',
  'corepack yarn check:codepush-decision-handoff-summary-guard',
  'corepack yarn push-notification:bridge-audit',
  'corepack yarn push-notification:bridge-check-summary',
  'corepack yarn ios:release:readiness:audit',
  'corepack yarn ios:release:readiness:check-summary',
  'corepack yarn ios:mac-validation-prereq:audit',
  'corepack yarn ios:mac-validation-prereq:check-summary',
  'corepack yarn check:ios-mac-validation-handoff-guard',
  'corepack yarn ios:mac-validation:handoff:dry-run',
  'corepack yarn ios:mac-validation:handoff:dry-run --all-schemes',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected release-services handoff commands to include: ${expected}`);
});

assert(
  !skippedRendered.includes('android:dev:release:verify-local'),
  'Skipped release-services handoff must omit Android release evidence refresh',
);
assert(
  !skippedRendered.includes('android:dev:release:smoke:embedded'),
  'Skipped release-services handoff must omit Android release smoke refresh',
);
assert(
  !skippedRendered.includes('android:dev:release:check-smoke-summary'),
  'Skipped release-services handoff must omit Android release smoke summary validation',
);
assert(
  skippedRendered.includes('corepack yarn sentry:release:prereq-audit'),
  'Skipped release-services handoff must still include Sentry prereq audit',
);
assert(
  skippedRendered.includes('corepack yarn check:sentry-properties-generator'),
  'Skipped release-services handoff must still validate the Sentry properties generator',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:sentry-properties-generator')) <
    skippedCommands.findIndex(step => step.args.includes('sentry:release:prereq-audit')),
  'Sentry properties generator guard must run before the Sentry release prerequisite audit',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('sentry:android-warning:check-summary')) <
    skippedCommands.findIndex(step => step.args.includes('sentry:rn-bundle-task-compat:audit')),
  'Sentry RN bundle task compatibility audit must run after the Android warning summary is validated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('sentry:rn-bundle-task-compat:check-summary')) <
    skippedCommands.findIndex(step => step.args.includes('sentry:release:prereq-audit')),
  'Sentry release prerequisite audit must run after RN bundle task compatibility is validated',
);
assert(
  skippedRendered.includes('corepack yarn check:ios-mac-validation-handoff-guard'),
  'Skipped release-services handoff must still validate the iOS macOS validation handoff guard',
);
assert(
  skippedRendered.includes('corepack yarn check:codepush-update-validation-handoff-guard'),
  'Skipped release-services handoff must still validate the CodePush update-validation handoff guard',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:codepush-update-validation-handoff-guard')) <
    skippedCommands.findIndex(step => step.args.includes('codepush:release:path-audit')),
  'CodePush update-validation handoff guard must run before CodePush release path audit',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('codepush:decision:handoff')) >
    skippedCommands.findIndex(step => step.args.includes('codepush:removal-readiness:check-summary')),
  'CodePush decision handoff must run after CodePush release, migration, and removal summaries are refreshed',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:codepush-decision-handoff-summary-guard')) >
    skippedCommands.findIndex(step => step.args.includes('codepush:decision:handoff')),
  'CodePush decision handoff summary guard must run after the decision handoff dry run',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:codepush-decision-handoff-summary-guard')) <
    skippedCommands.findIndex(step => step.args.includes('push-notification:bridge-audit')),
  'CodePush decision handoff must be validated before leaving the CodePush release-service block',
);
assert(
  removeDecisionRendered.includes('corepack yarn codepush:decision:handoff --decision remove --beta-strategy beta-has-no-ota'),
  'Release-services handoff must forward an explicit CodePush remove decision and beta strategy',
);
assert(
  skippedRendered.includes('corepack yarn ios:mac-validation:handoff:dry-run'),
  'Skipped release-services handoff must still render the iOS macOS validation handoff dry run',
);
assert(
  skippedRendered.includes('corepack yarn ios:mac-validation:handoff:dry-run --all-schemes'),
  'Skipped release-services handoff must render the all-scheme iOS macOS validation handoff dry run',
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
assert(
  getReleaseServicesValidationHandoffErrors({ codePushDecision: 'delete' }).some(error =>
    error.includes('codePushDecision must be one of'),
  ),
  'Invalid CodePush decision option must be rejected',
);
assert(
  getReleaseServicesValidationHandoffErrors({ codePushDecision: 'replace' }).some(error =>
    error.includes('codePushReplacementTarget is required'),
  ),
  'Replacement decision without target must be rejected',
);
assert(
  getReleaseServicesValidationHandoffErrors({
    codePushDecision: 'remove',
    codePushReplacementTarget: 'self-hosted-ota',
  }).some(error => error.includes('codePushReplacementTarget must be none')),
  'Replacement target must be rejected for remove decisions',
);
assert(
  getReleaseServicesValidationReadinessErrors().length === 0,
  'Release-services handoff readiness must accept the current validated summary artifacts',
);
assert(
  getReleaseServicesValidationReadinessErrors({
    rootPath: path.resolve('__missing_release_services_summary_root__'),
  }).some(error => error.includes('summary artifact is missing')),
  'Release-services handoff readiness must reject missing summary artifacts',
);

console.log('Release-services validation handoff guard checks are valid.');
