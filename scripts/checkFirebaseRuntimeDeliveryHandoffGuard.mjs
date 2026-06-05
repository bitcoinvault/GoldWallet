import {
  getFirebaseRuntimeDeliveryCommands,
  getFirebaseRuntimeDeliveryHandoffErrors,
  getFirebaseRuntimeDeliveryReadinessErrors,
  renderFirebaseRuntimeDeliveryCommand,
} from './runFirebaseRuntimeDeliveryHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getFirebaseRuntimeDeliveryCommands({ skipAndroidRelease: false });
const fullRendered = fullCommands.map(renderFirebaseRuntimeDeliveryCommand).join('\n');
const skippedCommands = getFirebaseRuntimeDeliveryCommands({ skipAndroidRelease: true });
const skippedRendered = skippedCommands.map(renderFirebaseRuntimeDeliveryCommand).join('\n');

[
  'corepack yarn android:dev:release:verify-local',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn firebase:release-services:audit',
  'corepack yarn firebase:release-services:check-summary',
  'corepack yarn push-notification:bridge-audit',
  'corepack yarn push-notification:bridge-check-summary',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected Firebase handoff commands to include: ${expected}`);
});

assert(
  !skippedRendered.includes('android:dev:release:verify-local'),
  'Skipped Firebase runtime handoff must omit Android release evidence refresh',
);
assert(
  skippedRendered.includes('corepack yarn firebase:release-services:audit'),
  'Skipped Firebase runtime handoff must still refresh Firebase release-services readiness',
);
assert(
  skippedRendered.includes('corepack yarn push-notification:bridge-audit'),
  'Skipped Firebase runtime handoff must still refresh push notification bridge readiness',
);
assert(
  skippedCommands[skippedCommands.length - 1].args.includes('release-services:check-summaries'),
  'Release-services aggregate check must be the final Firebase runtime handoff command',
);
assert(
  getFirebaseRuntimeDeliveryHandoffErrors({ skipAndroidRelease: 'false' }).some(error =>
    error.includes('skipAndroidRelease must be a boolean'),
  ),
  'Invalid skipAndroidRelease option must be rejected',
);

const readyFirebaseSummary = [
  'React Native Firebase package current: yes',
  'Firebase release-services wiring valid: yes',
  'Android release summary present: yes',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release APK manifest valid: yes',
  'Firebase runtime delivery validation: not claimed',
  'Wiring errors: 0',
  'Required action: none; Firebase release-services wiring is present locally.',
].join('\n');

const readyPushBridgeSummary = [
  'Push notification package current: yes',
  'Push notification bridge wiring valid: yes',
  'Push notification runtime delivery validation: not claimed',
  'Static readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none; static push notification bridge wiring is present locally.',
].join('\n');

assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary,
    pushBridgeSummaryText: readyPushBridgeSummary,
  }).length === 0,
  'Ready Firebase runtime handoff summary fixtures must pass readiness checks',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary.replace('Firebase runtime delivery validation: not claimed', 'Firebase runtime delivery validation: claimed'),
    pushBridgeSummaryText: readyPushBridgeSummary,
  }).some(error => error.includes('must stay unclaimed')),
  'Firebase runtime readiness check must reject claimed delivery without a real runtime handoff',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary.replace('Android release summary current inputs covered: yes', 'Android release summary current inputs covered: no'),
    pushBridgeSummaryText: readyPushBridgeSummary,
  }).some(error => error.includes('current release inputs')),
  'Firebase runtime readiness check must require fresh Android release inputs',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: readyFirebaseSummary,
    pushBridgeSummaryText: readyPushBridgeSummary.replace('Static readiness issues: 0', 'Static readiness issues: 1'),
  }).some(error => error.includes('0 static readiness issues')),
  'Firebase runtime readiness check must require push notification static readiness',
);
assert(
  getFirebaseRuntimeDeliveryReadinessErrors({
    firebaseSummaryText: '',
    pushBridgeSummaryText: readyPushBridgeSummary,
  }).some(error => error.includes('Firebase release-services summary is missing')),
  'Firebase runtime readiness check must report a missing Firebase summary',
);

console.log('Firebase runtime delivery handoff guard checks are valid.');
