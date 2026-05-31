import { getToolingLatestSnapshotSummaryErrors } from './toolingLatestSnapshotSummaryGuard.mjs';

const validSummary = [
  'Tooling latest snapshot audit',
  'Generated at: 2026-05-31T00:00:00.000Z',
  'Node version: v22.18.0',
  'Entries: 3',
  '- lint-staged: package 16.4.0, installed 16.4.0, latest 17.0.7, decision deferred - latest requires a newer Node baseline',
  '- jest: package 29.7.0, installed 29.7.0, latest 30.4.2, decision deferred - React Native Jest preset still owns the Jest 29 environment',
  '- typescript: package 5.4.5, installed 5.4.5, latest 6.0.3, decision deferred - TypeScript belongs with RN/test baseline validation',
  'Deferred entries: 3',
  'Required action: use this snapshot before tooling dependency branches; no package versions are changed by this audit.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getToolingLatestSnapshotSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getToolingLatestSnapshotSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid tooling latest snapshot summary fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('Tooling latest snapshot audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-05-31T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad entry count fixture', validSummary.replace('Entries: 3', 'Entries: 2'), 'Entries count');
assertRejected('Missing required action fixture', validSummary.replace('tooling dependency branches', 'future work'), 'Required action');

console.log('Tooling latest snapshot summary guard checks are valid.');
