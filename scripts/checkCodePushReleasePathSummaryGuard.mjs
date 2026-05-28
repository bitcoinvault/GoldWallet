import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';

const notReadySummary = [
  'CodePush release path audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release path wiring valid: yes',
  'Release path ready for update validation: no',
  'Warnings: 2',
  '- .env.beta.testnet does not define CODEPUSH_DEPLOYMENT_KEY_ANDROID; beta release update strategy is still unconfirmed',
  '- .env.beta.testnet does not define CODEPUSH_DEPLOYMENT_KEY_IOS; beta release update strategy is still unconfirmed',
  'Readiness issues: 2',
  '- .env.dev.testnet has a blank CODEPUSH_DEPLOYMENT_KEY_ANDROID',
  '- .env.dev.testnet has a blank CODEPUSH_DEPLOYMENT_KEY_IOS',
  'Wiring errors: 0',
  'Secret values printed: no',
  'Required action: provide non-empty non-beta CodePush deployment keys before claiming release update validation.',
  '',
].join('\n');

const readySummary = [
  'CodePush release path audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'Release path wiring valid: yes',
  'Release path ready for update validation: yes',
  'Warnings: 0',
  'Readiness issues: 0',
  'Wiring errors: 0',
  'Secret values printed: no',
  'Required action: none; non-beta CodePush release path env keys are present locally.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getCodePushReleasePathSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCodePushReleasePathSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid not-ready CodePush release path summary fixture', notReadySummary);
assertAccepted('Valid ready CodePush release path summary fixture', readySummary);
assertRejected('Missing header fixture', notReadySummary.replace('CodePush release path audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', notReadySummary.replace('Generated at: 2026-05-28T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad warning count fixture', notReadySummary.replace('Warnings: 2', 'Warnings: 1'), 'Warnings count');
assertRejected('Secret value leak fixture', notReadySummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');
assertRejected(
  'Missing required action fixture',
  notReadySummary.replace(
    'Required action: provide non-empty non-beta CodePush deployment keys before claiming release update validation.',
    'Required action: provide release update values before validation.',
  ),
  'CodePush deployment key required action',
);

console.log('CodePush release path summary guard checks are valid.');
