import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import {
  getReleaseServicesValidationCommands,
  getReleaseServicesValidationHandoffErrors,
  getReleaseServicesValidationReadinessErrors,
  renderReleaseServicesValidationCommand,
} from './runReleaseServicesValidationHandoff.mjs';
import { getAndroidReleaseNetworkBlockerSummaryErrors } from './androidReleaseNetworkBlockerSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const networkBlockerSummaryPath = path.join(root, 'local-docs', 'android-release-network-blocker-summary.txt');

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const allowedControlledNetworkBlockerErrors = [
  'Android release smoke: Expected line not found: Android smoke outcome: passed',
  'Android release smoke: Expected line not found: Android smoke exit code: 0',
  'Android release smoke: Expected line not found: Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android release smoke: Closed first-run success must be yes. Received: no',
  'Android release smoke: Validated empty-dashboard CTA flow must be yes. Received: no',
  'Android release smoke: Validated empty-tab navigation must be yes. Received: no',
  'Android release smoke: Validated QR scanner screen must be yes. Received: no',
  'Android release smoke: Validated settings Terms WebView must be yes. Received: no',
  'Android release create-wallet smoke: Source APK bytes does not match the current file size',
  'Android release create-wallet smoke: Source APK sha256 does not match the current file digest',
];

const getCurrentNetworkBlockerSummaryErrors = () => {
  if (!existsSync(networkBlockerSummaryPath)) {
    return ['Android release network blocker summary is missing'];
  }

  return getAndroidReleaseNetworkBlockerSummaryErrors(readFileSync(networkBlockerSummaryPath, 'utf8'));
};

const getCurrentReleaseServicesReadinessState = errors => {
  if (errors.length === 0) {
    return 'ready';
  }

  const unexpectedErrors = errors.filter(
    error => !allowedControlledNetworkBlockerErrors.some(allowedError => error.includes(allowedError)),
  );

  if (unexpectedErrors.length > 0) {
    return `unexpected errors: ${unexpectedErrors.join('; ')}`;
  }

  const networkBlockerErrors = getCurrentNetworkBlockerSummaryErrors();

  if (networkBlockerErrors.length > 0) {
    return `network blocker summary invalid: ${networkBlockerErrors.join('; ')}`;
  }

  return 'blocked-by-electrum-certificate-expired';
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
  'corepack yarn android:dev:release:create-wallet-verify',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn check:sentry-properties-generator',
  'corepack yarn sentry:android-warning:audit',
  'corepack yarn sentry:android-warning:check-summary',
  'corepack yarn sentry:rn-bundle-task-compat:audit',
  'corepack yarn sentry:rn-bundle-task-compat:check-summary',
  'corepack yarn sentry:release:prereq-audit',
  'corepack yarn sentry:release:prereq-check-summary',
  'corepack yarn sentry:release:credential-plan',
  'corepack yarn sentry:release:credential-plan:check',
  'corepack yarn check:sentry-release-validation-handoff-summary-guard',
  'corepack yarn sentry:release:validation:handoff-summary --skip-android-release',
  'corepack yarn sentry:release:validation:handoff-summary:check',
  'corepack yarn firebase:release-services:audit',
  'corepack yarn firebase:release-services:check-summary',
  'corepack yarn check:codepush-update-validation-handoff-guard',
  'corepack yarn codepush:release:path-audit',
  'corepack yarn codepush:release:path-check-summary',
  'corepack yarn codepush:migration:readiness-audit',
  'corepack yarn codepush:migration:readiness-check-summary',
  'corepack yarn codepush:removal-readiness:audit',
  'corepack yarn codepush:removal-readiness:check-summary',
  'corepack yarn check:codepush-env-cleanup-summary-guard',
  'corepack yarn codepush:env-cleanup:audit',
  'corepack yarn codepush:env-cleanup:check-summary',
  'corepack yarn codepush:decision:handoff --decision remove --beta-strategy beta-has-no-ota',
  'corepack yarn check:codepush-decision-handoff-summary-guard',
  'corepack yarn check:codepush-update-validation-handoff-summary-guard',
  'corepack yarn codepush:update:validation:handoff-summary --skip-android-release',
  'corepack yarn codepush:update:validation:handoff-summary:check',
  'corepack yarn push-notification:bridge-audit',
  'corepack yarn push-notification:bridge-check-summary',
  'corepack yarn ios:release:readiness:audit',
  'corepack yarn ios:release:readiness:check-summary',
  'corepack yarn ios:mac-validation-prereq:audit',
  'corepack yarn ios:mac-validation-prereq:check-summary',
  'corepack yarn check:ios-podfile-refresh-plan-guard',
  'corepack yarn ios:podfile-refresh:plan',
  'corepack yarn ios:podfile-refresh:check-plan',
  'corepack yarn check:ios-validation-handoff-summary-guard',
  'corepack yarn ios:validation:handoff-summary',
  'corepack yarn ios:validation:handoff-summary:check',
  'corepack yarn check:ios-mac-validation-handoff-guard',
  'corepack yarn ios:mac-validation:handoff:dry-run',
  'corepack yarn ios:mac-validation:handoff:dry-run --all-schemes',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected release-services handoff commands to include: ${expected}`);
});

assert(
  !skippedRendered.includes('android:dev:release:create-wallet-verify'),
  'Skipped release-services handoff must omit Android release create-wallet evidence refresh',
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
  skippedCommands.findIndex(step => step.args.includes('sentry:release:prereq-check-summary')) <
    skippedCommands.findIndex(step => step.args.includes('sentry:release:credential-plan')),
  'Sentry release credential plan must run after prerequisite summary validation',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('sentry:release:credential-plan')) <
    skippedCommands.findIndex(step => step.args.includes('sentry:release:credential-plan:check')),
  'Sentry release credential plan must be checked after it is generated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('sentry:release:credential-plan:check')) <
    skippedCommands.findIndex(step => step.args.includes('check:sentry-release-validation-handoff-summary-guard')),
  'Sentry release validation handoff summary guard must run after the credential plan is checked',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:sentry-release-validation-handoff-summary-guard')) <
    skippedCommands.findIndex(step => step.args.includes('sentry:release:validation:handoff-summary')),
  'Sentry release validation handoff summary must run after its guard self-check',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('sentry:release:validation:handoff-summary')) <
    skippedCommands.findIndex(step => step.args.includes('sentry:release:validation:handoff-summary:check')),
  'Sentry release validation handoff summary must be checked after it is generated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('sentry:release:validation:handoff-summary:check')) <
    skippedCommands.findIndex(step => step.args.includes('firebase:release-services:audit')),
  'Sentry release validation handoff summary must be checked before leaving the Sentry release-service block',
);
assert(
  skippedRendered.includes('corepack yarn check:ios-mac-validation-handoff-guard'),
  'Skipped release-services handoff must still validate the iOS macOS validation handoff guard',
);
assert(
  skippedRendered.includes('corepack yarn ios:validation:handoff-summary'),
  'Skipped release-services handoff must still refresh the iOS validation handoff summary',
);
assert(
  skippedRendered.includes('corepack yarn check:ios-validation-handoff-summary-guard'),
  'Skipped release-services handoff must still validate the iOS validation handoff summary guard',
);
assert(
  skippedRendered.includes('corepack yarn ios:validation:handoff-summary:check'),
  'Skipped release-services handoff must still validate the generated iOS validation handoff summary artifact',
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
  skippedCommands.findIndex(step => step.args.includes('codepush:env-cleanup:audit')) >
    skippedCommands.findIndex(step => step.args.includes('codepush:removal-readiness:check-summary')),
  'CodePush env cleanup audit must run after CodePush removal readiness is validated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:codepush-env-cleanup-summary-guard')) <
    skippedCommands.findIndex(step => step.args.includes('codepush:env-cleanup:audit')),
  'CodePush env cleanup summary guard must run before CodePush env cleanup audit',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('codepush:decision:handoff')) >
    skippedCommands.findIndex(step => step.args.includes('codepush:env-cleanup:check-summary')),
  'CodePush decision handoff must run after CodePush env cleanup readiness is validated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:codepush-decision-handoff-summary-guard')) >
    skippedCommands.findIndex(step => step.args.includes('codepush:decision:handoff')),
  'CodePush decision handoff summary guard must run after the decision handoff dry run',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:codepush-decision-handoff-summary-guard')) <
    skippedCommands.findIndex(step => step.args.includes('check:codepush-update-validation-handoff-summary-guard')),
  'CodePush decision handoff must be validated before leaving the CodePush release-service block',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:codepush-update-validation-handoff-summary-guard')) >
    skippedCommands.findIndex(step => step.args.includes('check:codepush-decision-handoff-summary-guard')),
  'CodePush update-validation handoff summary guard must run after the decision handoff guard',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('codepush:update:validation:handoff-summary')) >
    skippedCommands.findIndex(step => step.args.includes('check:codepush-update-validation-handoff-summary-guard')),
  'CodePush update-validation handoff summary must run after its guard self-check',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('codepush:update:validation:handoff-summary:check')) >
    skippedCommands.findIndex(step => step.args.includes('codepush:update:validation:handoff-summary')),
  'CodePush update-validation handoff summary must be checked after it is generated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('codepush:update:validation:handoff-summary:check')) <
    skippedCommands.findIndex(step => step.args.includes('push-notification:bridge-audit')),
  'CodePush update-validation handoff summary must be checked before leaving the CodePush release-service block',
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
  skippedCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary')) >
    skippedCommands.findIndex(step => step.args.includes('ios:mac-validation-prereq:check-summary')),
  'iOS validation handoff summary must be refreshed after iOS release and macOS prerequisite summaries are validated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:ios-podfile-refresh-plan-guard')) >
    skippedCommands.findIndex(step => step.args.includes('ios:mac-validation-prereq:check-summary')),
  'iOS Podfile refresh plan guard must run after iOS release and macOS prerequisite summaries are validated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('ios:podfile-refresh:plan')) >
    skippedCommands.findIndex(step => step.args.includes('check:ios-podfile-refresh-plan-guard')),
  'iOS Podfile refresh plan must run after its guard self-check',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('ios:podfile-refresh:check-plan')) >
    skippedCommands.findIndex(step => step.args.includes('ios:podfile-refresh:plan')),
  'iOS Podfile refresh plan must be checked after it is generated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary')) >
    skippedCommands.findIndex(step => step.args.includes('ios:podfile-refresh:check-plan')),
  'iOS validation handoff summary must be refreshed after the Podfile refresh plan is validated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:ios-validation-handoff-summary-guard')) >
    skippedCommands.findIndex(step => step.args.includes('ios:podfile-refresh:check-plan')),
  'iOS validation handoff summary guard must run after the Podfile refresh plan is validated',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:ios-validation-handoff-summary-guard')) <
    skippedCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary')),
  'iOS validation handoff summary guard must run before the summary is refreshed',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary:check')) >
    skippedCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary')),
  'iOS validation handoff summary artifact must be checked after the summary is refreshed',
);
assert(
  skippedCommands.findIndex(step => step.args.includes('check:ios-mac-validation-handoff-guard')) >
    skippedCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary:check')),
  'iOS macOS validation handoff guard must run after the iOS validation handoff summary artifact check',
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
  ['ready', 'blocked-by-electrum-certificate-expired'].includes(
    getCurrentReleaseServicesReadinessState(getReleaseServicesValidationReadinessErrors()),
  ),
  'Release-services handoff readiness guard must accept either fully valid artifacts or the current controlled Electrum certificate blocker state',
);
assert(
  getReleaseServicesValidationReadinessErrors({
    rootPath: path.resolve('__missing_release_services_summary_root__'),
  }).some(error => error.includes('summary artifact is missing')),
  'Release-services handoff readiness must reject missing summary artifacts',
);

console.log('Release-services validation handoff guard checks are valid.');
