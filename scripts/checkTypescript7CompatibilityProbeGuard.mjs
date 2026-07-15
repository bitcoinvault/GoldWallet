import { getTypescript7CompatibilityProbeSummaryErrors } from './typescript7CompatibilityProbeSummaryGuard.mjs';

const validSummary = [
  'TypeScript 7 compatibility probe',
  'Generated at: 2026-07-11T00:00:00.000Z',
  'Node version: v24.16.0',
  'Expected Node version: v24.16.0',
  'Repo TypeScript: 6.0.3',
  'Target TypeScript: 7.0.2',
  'Target TypeScript Node engine: >=16.20.0',
  'Target TypeScript Node engine satisfied: yes',
  'Checked peer packages: 3',
  '- @typescript-eslint/parser: package 8.64.0, latest 8.64.0, TypeScript peer >=4.8.4 <6.1.0, target compatible no',
  '- @typescript-eslint/eslint-plugin: package 8.64.0, latest 8.64.0, TypeScript peer >=4.8.4 <6.1.0, target compatible no',
  '- ts-jest: package 29.4.11, latest 29.4.11, TypeScript peer >=4.3 <7, target compatible no',
  'Isolated latest install status: failed',
  'Isolated latest install error: ERESOLVE',
  'Isolated legacy-peer install status: ok',
  'Isolated legacy-peer install error: none',
  'Isolated installed TypeScript: 7.0.2',
  'Isolated checked peer packages: 3',
  '- @typescript-eslint/parser: installed 8.64.0, TypeScript peer >=4.8.4 <6.1.0, target compatible no',
  '- @typescript-eslint/eslint-plugin: installed 8.64.0, TypeScript peer >=4.8.4 <6.1.0, target compatible no',
  '- ts-jest: installed 29.4.11, TypeScript peer >=4.3 <7, target compatible no',
  'Isolated install blockers: 1',
  '- normal npm install of the latest TypeScript/tooling cohort fails with ERESOLVE',
  'Compatibility blockers: 3',
  '- @typescript-eslint/parser TypeScript peer >=4.8.4 <6.1.0 does not include TypeScript 7.0.2',
  '- @typescript-eslint/eslint-plugin TypeScript peer >=4.8.4 <6.1.0 does not include TypeScript 7.0.2',
  '- ts-jest TypeScript peer >=4.3 <7 does not include TypeScript 7.0.2',
  'TypeScript 7 package bump allowed: no',
  'Blocker classification: tooling-peer-range-blocker',
  'Required action: keep typescript pinned to 6.0.3 until a dedicated compiler/RN/Metro branch moves TypeScript, @typescript-eslint, and Jest transform tooling together and proves TypeScript check, Jest, lint baseline, Android build, and emulator smoke.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getTypescript7CompatibilityProbeSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getTypescript7CompatibilityProbeSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid TypeScript 7 compatibility probe summary fixture', validSummary);
assertRejected('Bad header fixture', validSummary.replace('TypeScript 7 compatibility probe', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-07-11T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Wrong Node fixture', validSummary.replace('Node version: v24.16.0', 'Node version: v22.18.0'), 'repo .nvmrc baseline');
assertRejected('Wrong repo TypeScript fixture', validSummary.replace('Repo TypeScript: 6.0.3', 'Repo TypeScript: 7.0.2'), 'must stay 6.0.3');
assertRejected('Wrong target TypeScript fixture', validSummary.replace('Target TypeScript: 7.0.2', 'Target TypeScript: 6.0.3'), 'TypeScript 7 line');
assertRejected('Bad peer package count fixture', validSummary.replace('Checked peer packages: 3', 'Checked peer packages: 2'), 'Checked peer packages count');
assertRejected(
  'Missing parser peer ceiling fixture',
  validSummary.replace('TypeScript peer >=4.8.4 <6.1.0', 'TypeScript peer >=4.8.4'),
  '@typescript-eslint/parser peer range',
);
assertRejected(
  'Successful isolated install fixture',
  validSummary.replace('Isolated latest install status: failed', 'Isolated latest install status: ok'),
  'Isolated latest install status',
);
assertRejected(
  'Missing isolated ERESOLVE fixture',
  validSummary.replace('Isolated latest install error: ERESOLVE', 'Isolated latest install error: none'),
  'Isolated latest install error',
);
assertRejected(
  'Bad isolated TypeScript fixture',
  validSummary.replace('Isolated installed TypeScript: 7.0.2', 'Isolated installed TypeScript: 6.0.3'),
  'Isolated installed TypeScript',
);
assertRejected(
  'Missing isolated blocker fixture',
  validSummary.replace('Isolated install blockers: 1', 'Isolated install blockers: 0'),
  'Isolated install blockers count',
);
assertRejected(
  'Allowed package bump fixture',
  validSummary.replace('TypeScript 7 package bump allowed: no', 'TypeScript 7 package bump allowed: yes'),
  'package bump allowed must be no',
);
assertRejected(
  'Missing blocker fixture',
  validSummary.replace('Compatibility blockers: 3', 'Compatibility blockers: 0'),
  'Compatibility blockers count',
);
assertRejected(
  'Missing required action fixture',
  validSummary.replace('keep typescript pinned to 6.0.3', 'upgrade typescript immediately'),
  'Required action',
);

console.log('TypeScript 7 compatibility probe guard checks are valid.');
