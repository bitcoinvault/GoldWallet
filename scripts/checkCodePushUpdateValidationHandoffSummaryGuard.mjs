import { getCodePushUpdateValidationHandoffSummaryErrors } from './codePushUpdateValidationHandoffSummaryGuard.mjs';

const validRemovedSummary = [
  'CodePush update validation handoff summary',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'Android release evidence refresh skipped: yes',
  'Release path summary valid: yes',
  'Migration readiness summary valid: yes',
  'Removal readiness summary valid: yes',
  'Release path ready for update validation: no',
  'CodePush removed: yes',
  'CodePush migration required: no',
  'CodePush update validation: not claimed',
  'CodePush release build evidence ready: yes',
  'CodePush release smoke evidence ready: no',
  'CodePush release create-wallet evidence ready: no',
  'Controlled release blocker outcome: blocked-by-electrum-certificate-expired',
  'CodePush release runtime proof state: blocked-by-electrum-certificate-expired',
  'Handoff outcome: blocked',
  'Handoff blocker type: codepush-removed',
  'iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming iOS delivery.',
  'Readiness errors: 1',
  '- CodePush is removed; OTA update validation requires a maintained replacement before a real delivery test can be claimed.',
  'Secret values printed: no',
  'Required action: keep CodePush removed; do not claim OTA update validation until a maintained replacement and real delivery test are available.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getCodePushUpdateValidationHandoffSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCodePushUpdateValidationHandoffSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid removed CodePush update-validation handoff fixture', validRemovedSummary);
assertAccepted(
  'Valid ready CodePush update-validation handoff fixture',
  validRemovedSummary
    .replace('Android release evidence refresh skipped: yes', 'Android release evidence refresh skipped: no')
    .replace('Release path ready for update validation: no', 'Release path ready for update validation: yes')
    .replace('CodePush removed: yes', 'CodePush removed: no')
    .replace('CodePush migration required: no', 'CodePush migration required: yes')
    .replace('CodePush release smoke evidence ready: no', 'CodePush release smoke evidence ready: yes')
    .replace('CodePush release create-wallet evidence ready: no', 'CodePush release create-wallet evidence ready: yes')
    .replace('Controlled release blocker outcome: blocked-by-electrum-certificate-expired', 'Controlled release blocker outcome: not-applicable')
    .replace('CodePush release runtime proof state: blocked-by-electrum-certificate-expired', 'CodePush release runtime proof state: ready')
    .replace('Handoff outcome: blocked', 'Handoff outcome: ready-for-real-ota-test')
    .replace('Handoff blocker type: codepush-removed', 'Handoff blocker type: none')
    .replace(
      [
        'Readiness errors: 1',
        '- CodePush is removed; OTA update validation requires a maintained replacement before a real delivery test can be claimed.',
      ].join('\n'),
      'Readiness errors: 0',
    )
    .replace(
      'Required action: keep CodePush removed; do not claim OTA update validation until a maintained replacement and real delivery test are available.',
      'Required action: run a real OTA delivery test with deployment keys in a maintained replacement path; do not claim OTA update validation before that test passes.',
    ),
);
assertRejected('Missing header fixture', validRemovedSummary.replace('CodePush update validation handoff summary', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validRemovedSummary.replace('Generated at: 2026-06-11T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Claimed OTA fixture', validRemovedSummary.replace('CodePush update validation: not claimed', 'CodePush update validation: passed'), 'not claimed');
assertRejected('Secret assignment fixture', validRemovedSummary.replace('Secret values printed: no', 'CODEPUSH_DEPLOYMENT_KEY_ANDROID=abc\nSecret values printed: no'), 'deployment key assignments');
assertRejected('Missing iOS blocker fixture', validRemovedSummary.replace('iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming iOS delivery.', 'iOS runtime validation: passed'), 'iOS runtime validation');
assertRejected('Removed but ready fixture', validRemovedSummary.replace('Handoff outcome: blocked', 'Handoff outcome: ready-for-real-ota-test'), 'Removed CodePush');
assertRejected('Bad readiness count fixture', validRemovedSummary.replace('Readiness errors: 1', 'Readiness errors: 2'), 'count is 2');
assertRejected(
  'Electrum blocker hidden fixture',
  validRemovedSummary
    .replace('CodePush removed: yes', 'CodePush removed: no')
    .replace('CodePush migration required: no', 'CodePush migration required: yes')
    .replace('Handoff blocker type: codepush-removed', 'Handoff blocker type: release-evidence-not-ready'),
  'Controlled Electrum blocker',
);

console.log('CodePush update-validation handoff summary guard checks are valid.');
