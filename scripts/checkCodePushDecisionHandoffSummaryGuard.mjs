import { getCodePushDecisionHandoffErrors } from './codePushDecisionHandoffGuard.mjs';

const validSummary = [
  'CodePush decision handoff',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'Decision: pending',
  'Implementation ready: no',
  'CodePush removed: no',
  'Replacement target: none',
  'Beta deployment-key strategy: unconfirmed',
  'Release path summary valid: yes',
  'Migration readiness summary valid: yes',
  'Removal readiness summary valid: yes',
  'CodePush migration required: yes',
  'CodePush update validation: not claimed',
  'CodePush runtime gated off by default: yes',
  'CodePush release build evidence ready: yes',
  'CodePush release smoke evidence ready: yes',
  'CodePush release create-wallet evidence ready: yes',
  'iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming iOS delivery.',
  'Release path summary errors: 0',
  'Migration readiness summary errors: 0',
  'Removal readiness summary errors: 0',
  'Secret values printed: no',
  'Required action: choose remove or replace before implementation; do not claim OTA update validation until deployment keys and a real delivery test are available.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getCodePushDecisionHandoffErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCodePushDecisionHandoffErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid pending CodePush decision handoff fixture', validSummary);
assertAccepted(
  'Valid removed CodePush decision handoff fixture',
  validSummary
    .replace('Decision: pending', 'Decision: remove')
    .replace('Implementation ready: no', 'Implementation ready: yes')
    .replace('CodePush removed: no', 'CodePush removed: yes')
    .replace('CodePush migration required: yes', 'CodePush migration required: no'),
);
assertAccepted(
  'Valid pending post-removal CodePush decision handoff fixture',
  validSummary
    .replace('CodePush removed: no', 'CodePush removed: yes')
    .replace('CodePush migration required: yes', 'CodePush migration required: no'),
);
assertAccepted(
  'Valid remove CodePush decision handoff fixture',
  validSummary
    .replace('Decision: pending', 'Decision: remove')
    .replace('Implementation ready: no', 'Implementation ready: yes')
    .replace(
      'Required action: choose remove or replace before implementation; do not claim OTA update validation until deployment keys and a real delivery test are available.',
      'Required action: start the selected implementation branch only after reviewing this handoff; do not claim OTA update validation until deployment keys and a real delivery test are available.',
    ),
);
assertAccepted(
  'Valid replace CodePush decision handoff fixture',
  validSummary
    .replace('Decision: pending', 'Decision: replace')
    .replace('Replacement target: none', 'Replacement target: self-hosted-ota')
    .replace('Beta deployment-key strategy: unconfirmed', 'Beta deployment-key strategy: beta has OTA keys')
    .replace(
      'Required action: choose remove or replace before implementation; do not claim OTA update validation until deployment keys and a real delivery test are available.',
      'Required action: start the selected implementation branch only after reviewing this handoff; do not claim OTA update validation until deployment keys and a real delivery test are available.',
    ),
);
assertRejected(
  'Bad timestamp fixture',
  validSummary.replace('Generated at: 2026-06-11T00:00:00.000Z', 'Generated at: now'),
  'ISO timestamp',
);
assertRejected(
  'Replace without target fixture',
  validSummary
    .replace('Decision: pending', 'Decision: replace')
    .replace('Beta deployment-key strategy: unconfirmed', 'Beta deployment-key strategy: beta has OTA keys'),
  'Replace decision must name a replacement target',
);
assertRejected(
  'Replace without beta strategy fixture',
  validSummary.replace('Decision: pending', 'Decision: replace').replace('Replacement target: none', 'Replacement target: self-hosted-ota'),
  'explicit beta deployment-key strategy',
);
assertRejected(
  'Claimed OTA fixture',
  validSummary.replace('CodePush update validation: not claimed', 'CodePush update validation: passed'),
  'not claimed',
);
assertRejected(
  'Missing release create-wallet evidence fixture',
  validSummary.replace('CodePush release create-wallet evidence ready: yes', 'CodePush release create-wallet evidence ready: no'),
  'release create-wallet evidence',
);
assertRejected(
  'Secret assignment fixture',
  validSummary.replace('Secret values printed: no', 'CODEPUSH_DEPLOYMENT_KEY_ANDROID=abc\nSecret values printed: no'),
  'deployment key assignments',
);
assertRejected(
  'Missing iOS blocker fixture',
  validSummary.replace('iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming iOS delivery.', 'iOS runtime validation: passed'),
  'iOS runtime validation',
);

console.log('CodePush decision handoff summary guard checks are valid.');
