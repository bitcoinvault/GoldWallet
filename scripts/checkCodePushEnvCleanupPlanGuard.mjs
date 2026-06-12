import { getCodePushEnvCleanupPlanErrors } from './codePushEnvCleanupPlanGuard.mjs';

const validPlan = [
  'CodePush env cleanup plan',
  'Generated at: 2026-06-12T00:00:00.000Z',
  'CodePush removed: yes',
  'Tracked env files scanned: 5',
  'Files needing cleanup: 2',
  'File: .env.prod.mainnet',
  '- CODEPUSH_DEPLOYMENT_KEY_ANDROID: deployment key, non-empty, secure regeneration required',
  '- CODEPUSH_ENABLED: flag, non-empty, normal cleanup allowed after secure regeneration',
  'File: .env.stage.mainnet',
  '- CODEPUSH_DEPLOYMENT_KEY_IOS: deployment key, non-empty, secure regeneration required',
  'CodePush env key entries: 3',
  'Non-empty deployment key entries: 2',
  'Normal text diff cleanup allowed: no',
  'Secure env regeneration required: yes',
  'Review-safe evidence: file paths and key names only',
  'Secret values printed: no',
  'Required action: perform a secrets-safe cleanup or secure env regeneration that does not expose historical deployment-key values in review diffs or logs.',
  '',
].join('\n');

const assertAccepted = (label, plan) => {
  const errors = getCodePushEnvCleanupPlanErrors(plan);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, plan, expectedError) => {
  const errors = getCodePushEnvCleanupPlanErrors(plan);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid CodePush env cleanup plan fixture', validPlan);
assertRejected('Missing header fixture', validPlan.replace('CodePush env cleanup plan', 'Bad plan'), 'header');
assertRejected('Bad timestamp fixture', validPlan.replace('Generated at: 2026-06-12T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('CodePush not removed fixture', validPlan.replace('CodePush removed: yes', 'CodePush removed: no'), 'runtime/native removal');
assertRejected('Bad file count fixture', validPlan.replace('Files needing cleanup: 2', 'Files needing cleanup: 3'), 'file sections');
assertRejected('Secret assignment fixture', validPlan.replace('Secret values printed: no', 'CODEPUSH_DEPLOYMENT_KEY_ANDROID=secret\nSecret values printed: no'), 'assignments');
assertRejected('Missing no-secret line fixture', validPlan.replace('Secret values printed: no', 'Secret values printed: maybe'), 'secret values');
assertRejected('Missing review-safe evidence fixture', validPlan.replace('Review-safe evidence: file paths and key names only', 'Review-safe evidence: unknown'), 'file paths and key names');
assertRejected('Missing cleanup decision fixture', validPlan.replace('Normal text diff cleanup allowed: no', 'Normal text diff cleanup allowed: maybe'), 'decision');

console.log('CodePush env cleanup plan guard checks are valid.');
