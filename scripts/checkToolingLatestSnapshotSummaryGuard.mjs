import { getToolingLatestSnapshotSummaryErrors } from './toolingLatestSnapshotSummaryGuard.mjs';

const validSummary = [
  'Tooling latest snapshot audit',
  'Generated at: 2026-05-31T00:00:00.000Z',
  'Node version: v24.16.0',
  'Expected Node version: v24.16.0',
  'Entries: 24',
  '- typescript: package 6.0.3, installed 6.0.3, latest 6.0.3, decision current - latest TypeScript compiler verified with the RN/test baseline validation gates',
  '- jest: package 30.4.2, installed 30.4.2, latest 30.4.2, decision current - latest Jest runtime verified with RN preset environment resolutions and focused suites',
  '- babel-jest: package 30.4.1, installed 30.4.1, latest 30.4.1, decision current - latest Jest transformer verified with the Jest 30 runtime',
  '- jest-circus: package 30.4.2, installed 30.4.2, latest 30.4.2, decision current - latest Jest runner verified with the Jest 30 runtime',
  '- jest-environment-node: package 30.4.1, installed 30.4.1, latest 30.4.1, decision current - latest Jest environment required to keep the RN preset compatible with Jest 30 runtime',
  '- jest-junit: package 17.0.0, installed 17.0.0, latest 17.0.0, decision current - latest report tooling verified separately from the Jest runtime',
  '- junit-report-merger: package 9.0.4, installed 9.0.4, latest 9.0.4, decision current - latest JUnit report merge tooling verified with the Detox report script',
  '- babel-plugin-istanbul: package 8.0.0, installed 8.0.0, latest 8.0.0, decision current - latest coverage instrumentation verified with Jest coverage',
  '- mailosaur: package 11.1.1, installed 11.1.1, latest 11.1.1, decision current - latest E2E mail helper verified with TypeScript',
  '- jsdom: package 29.1.1, installed 29.1.1, latest 29.1.1, decision current - latest E2E mail DOM parser verified with TypeScript and helper probe',
  '- jetifier: package 2.0.0, installed 2.0.0, latest 2.0.0, decision current - latest AndroidX migration helper verified with postinstall, Android build, and emulator smoke',
  '- @typescript-eslint/eslint-plugin: package 8.62.0, installed 8.62.0, latest 8.62.0, decision current - parser/plugin pair verified through the ESLint 10 flat-config bridge',
  '- @typescript-eslint/parser: package 8.62.0, installed 8.62.0, latest 8.62.0, decision current - parser/plugin pair verified through the ESLint 10 flat-config bridge',
  '- eslint: package 10.5.0, installed 10.5.0, latest 10.5.0, decision current - latest ESLint 10 runtime verified through eslint.config.mjs while preserving the existing lint baseline',
  '- @eslint/js: package 10.0.1, installed 10.0.1, latest 10.0.1, decision current - latest ESLint recommended config package required by the ESLint 10 flat-config bridge',
  '- @eslint/eslintrc: package 3.3.5, installed 3.3.5, latest 3.3.5, decision current - latest FlatCompat package used to bridge the legacy .eslintrc baseline into ESLint 10',
  '- @eslint/compat: package 2.1.0, installed 2.1.0, latest 2.1.0, decision current - latest compatibility helpers used to patch legacy plugin rules for ESLint 10',
  '- jiti: package 2.7.0, installed 2.7.0, latest 2.7.0, decision current - latest ESLint 10 peer dependency installed explicitly for config loading',
  '- prettier: package 3.8.4, installed 3.8.4, latest 3.8.4, decision current - latest Prettier 3 formatting runtime verified against the existing lint baseline without mass formatting',
  '- eslint-plugin-prettier: package 5.5.6, installed 5.5.6, latest 5.5.6, decision current - latest Prettier ESLint plugin verified with Prettier 3 and the ESLint 10 flat-config bridge',
  '- eslint-config-prettier: package 10.1.8, installed 10.1.8, latest 10.1.8, decision current - latest Prettier ESLint config verified with the ESLint 10 flat-config bridge',
  '- lint-staged: package 17.0.8, installed 17.0.8, latest 17.0.8, decision current - latest lint-staged verified on the Node 24 tooling baseline',
  '- husky: package 9.1.7, installed 9.1.7, latest 9.1.7, decision current - latest hook runner verified with repo-owned .husky hooks and precommit/prepush scripts',
  '- detox: package 20.51.4, installed 20.51.4, latest 20.51.4, decision current - latest Detox runner version is guarded by check:detox-readiness; Android Detox build passed and iOS runtime validation remains a macOS follow-up',
  'Deferred entries: 0',
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
assertRejected(
  'Missing header fixture',
  validSummary.replace('Tooling latest snapshot audit', 'Bad header'),
  'summary header',
);
assertRejected(
  'Bad timestamp fixture',
  validSummary.replace('Generated at: 2026-05-31T00:00:00.000Z', 'Generated at: now'),
  'ISO timestamp',
);
assertRejected(
  'Missing expected Node fixture',
  validSummary.replace('Expected Node version: v24.16.0', 'Expected Node version: '),
  'Expected Node version',
);
assertRejected(
  'Wrong Node fixture',
  validSummary.replace('Node version: v24.16.0', 'Node version: v22.18.0'),
  'repo .nvmrc baseline',
);
assertRejected('Bad entry count fixture', validSummary.replace('Entries: 24', 'Entries: 2'), 'Entries count');
assertRejected(
  'Unexpected tooling package fixture',
  validSummary.replace('Entries: 24', 'Entries: 25').replace(
    'Deferred entries: 0',
    '- extra-tooling: package 1.0.0, installed 1.0.0, latest 1.0.0, decision current - latest extra tooling\nDeferred entries: 0',
  ),
  'Unexpected tooling latest entry for extra-tooling',
);
assertRejected(
  'Duplicate tooling package fixture',
  validSummary.replace(
    '- detox: package 20.51.4, installed 20.51.4, latest 20.51.4, decision current - latest Detox runner version is guarded by check:detox-readiness; Android Detox build passed and iOS runtime validation remains a macOS follow-up',
    '- husky: package 9.1.7, installed 9.1.7, latest 9.1.7, decision current - latest hook runner verified with repo-owned .husky hooks and precommit/prepush scripts',
  ),
  'Duplicate tooling latest entry for husky',
);
assertRejected(
  'Deferred tooling fixture',
  validSummary
    .replace('Deferred entries: 0', 'Deferred entries: 1')
    .replace('decision blocked - precommit tooling patch drift requires', 'decision deferred - precommit tooling patch drift requires'),
  'deferred entries',
);
assertRejected(
  'Non-current marked current fixture',
  validSummary.replace(
    '- lint-staged: package 17.0.8, installed 17.0.8, latest 17.0.8, decision current - latest lint-staged verified on the Node 24 tooling baseline',
    '- lint-staged: package 17.0.8, installed 17.0.7, latest 17.0.8, decision current - latest lint-staged verified on the Node 24 tooling baseline',
  ),
  'must not be marked current',
);
assertRejected(
  'Missing required action fixture',
  validSummary.replace('tooling dependency branches', 'future work'),
  'Required action',
);
assertRejected(
  'Missing Husky tooling fixture',
  validSummary.replace(
    '- husky: package 9.1.7, installed 9.1.7, latest 9.1.7, decision current - latest hook runner verified with repo-owned .husky hooks and precommit/prepush scripts',
    '- hook-runner: package 9.1.7, installed 9.1.7, latest 9.1.7, decision current - latest hook runner verified with repo-owned hooks and precommit/prepush scripts',
  ),
  'Husky tooling',
);
assertRejected(
  'Missing report tooling fixture',
  validSummary.replace('- jest-junit:', '- missing-junit:'),
  'Jest JUnit report tooling',
);
assertRejected(
  'Missing Jest environment fixture',
  validSummary.replace('- jest-environment-node:', '- missing-jest-env:'),
  'Jest environment tooling',
);
assertRejected(
  'Missing merge tooling fixture',
  validSummary.replace('- junit-report-merger:', '- missing-report-merger:'),
  'JUnit report merge tooling',
);
assertRejected(
  'Missing coverage tooling fixture',
  validSummary.replace('- babel-plugin-istanbul:', '- missing-coverage:'),
  'coverage instrumentation tooling',
);
assertRejected(
  'Missing E2E mail tooling fixture',
  validSummary.replace('- mailosaur:', '- missing-mail:'),
  'E2E mail tooling',
);
assertRejected(
  'Missing E2E mail DOM parser fixture',
  validSummary.replace('- jsdom:', '- missing-dom-parser:'),
  'E2E mail DOM parser tooling',
);
assertRejected(
  'Missing AndroidX tooling fixture',
  validSummary.replace('- jetifier:', '- missing-androidx-tool:'),
  'AndroidX migration tooling',
);
assertRejected(
  'Missing Detox runner tooling fixture',
  validSummary.replace('- detox:', '- missing-runner:'),
  'Detox runner tooling',
);
assertRejected(
  'Missing ESLint flat config tooling fixture',
  validSummary.replace('- @eslint/js:', '- missing-eslint-js:'),
  'ESLint flat config tooling',
);

console.log('Tooling latest snapshot summary guard checks are valid.');
