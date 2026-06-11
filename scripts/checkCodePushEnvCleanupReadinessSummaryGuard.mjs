import { getCodePushEnvCleanupReadinessSummaryErrors } from './codePushEnvCleanupReadinessSummaryGuard.mjs';

const validSummary = [
  'CodePush env cleanup readiness audit',
  'Generated at: 2026-06-11T00:00:00.000Z',
  'CodePush removed: yes',
  'Tracked env files scanned: 5',
  'Env files carrying CodePush keys: 2',
  '- .env.prod.mainnet',
  '- .env.stage.mainnet',
  'CodePush env key entries: 6',
  'Non-empty deployment key entries: 4',
  'Blank deployment key entries: 0',
  'Enabled flag entries: 2',
  'Files with non-empty deployment keys: 2',
  '- .env.prod.mainnet',
  '- .env.stage.mainnet',
  'Cleanup safe through normal text diff: no',
  'Secret values printed: no',
  'Required action: perform a secrets-safe cleanup or secure env regeneration that does not expose historical deployment-key values in review diffs or logs.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getCodePushEnvCleanupReadinessSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getCodePushEnvCleanupReadinessSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid CodePush env cleanup readiness summary fixture', validSummary);
assertAccepted(
  'Valid empty CodePush env cleanup summary fixture',
  validSummary
    .replace('Env files carrying CodePush keys: 2\n- .env.prod.mainnet\n- .env.stage.mainnet', 'Env files carrying CodePush keys: 0')
    .replace('CodePush env key entries: 6', 'CodePush env key entries: 0')
    .replace('Non-empty deployment key entries: 4', 'Non-empty deployment key entries: 0')
    .replace('Enabled flag entries: 2', 'Enabled flag entries: 0')
    .replace('Files with non-empty deployment keys: 2\n- .env.prod.mainnet\n- .env.stage.mainnet', 'Files with non-empty deployment keys: 0')
    .replace('Cleanup safe through normal text diff: no', 'Cleanup safe through normal text diff: yes')
    .replace(
      'Required action: perform a secrets-safe cleanup or secure env regeneration that does not expose historical deployment-key values in review diffs or logs.',
      'Required action: none; no tracked CodePush env keys remain; do not expose historical deployment-key values.',
    ),
);
assertRejected('Missing header fixture', validSummary.replace('CodePush env cleanup readiness audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-06-11T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('CodePush not removed fixture', validSummary.replace('CodePush removed: yes', 'CodePush removed: no'), 'only valid after CodePush runtime/native removal');
assertRejected('Bad file count fixture', validSummary.replace('Env files carrying CodePush keys: 2', 'Env files carrying CodePush keys: 3'), 'count is 3');
assertRejected('Bad deployment file count fixture', validSummary.replace('Files with non-empty deployment keys: 2', 'Files with non-empty deployment keys: 1'), 'count is 1');
assertRejected('Unsafe normal diff fixture', validSummary.replace('Cleanup safe through normal text diff: no', 'Cleanup safe through normal text diff: yes'), 'Normal text diff cleanup');
assertRejected('Secret value fixture', validSummary.replace('Secret values printed: no', 'CODEPUSH_DEPLOYMENT_KEY_ANDROID=secret\nSecret values printed: no'), 'key assignments');
assertRejected('Missing safe cleanup action fixture', validSummary.replace('secrets-safe cleanup', 'cleanup'), 'secrets-safe cleanup');
assertRejected('Missing no-exposure wording fixture', validSummary.replace('does not expose historical deployment-key values', 'is careful'), 'historical deployment-key values');

console.log('CodePush env cleanup readiness summary guard checks are valid.');
