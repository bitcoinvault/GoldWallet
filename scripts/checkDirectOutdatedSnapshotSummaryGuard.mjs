import { getDirectOutdatedSnapshotSummaryErrors } from './directOutdatedSnapshotSummaryGuard.mjs';

const validSummary = [
  'Direct dependency outdated snapshot audit',
  'Generated at: 2026-06-05T00:00:00.000Z',
  'Node version: v24.16.0',
  'Expected Node version: v24.16.0',
  'Entries: 17',
  '- @babel/cli: current 7.29.7, wanted 7.29.7, latest 8.0.1, type devDependencies, decision blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  '- @babel/core: current 7.29.7, wanted 7.29.7, latest 8.0.1, type resolutionDependencies, decision blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  '- @babel/core: current 7.29.7, wanted 7.29.7, latest 8.0.1, type devDependencies, decision blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  '- @babel/plugin-transform-runtime: current 7.29.7, wanted 7.29.7, latest 8.0.1, type devDependencies, decision blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  '- @babel/preset-env: current 7.29.7, wanted 7.29.7, latest 8.0.2, type devDependencies, decision blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  '- @babel/preset-react: current 7.29.7, wanted 7.29.7, latest 8.0.1, type devDependencies, decision blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  '- @babel/preset-typescript: current 7.29.7, wanted 7.29.7, latest 8.0.1, type devDependencies, decision blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  '- @babel/runtime: current 7.29.7, wanted 7.29.7, latest 8.0.0, type devDependencies, decision blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  '- @babel/traverse: current 7.29.7, wanted 7.29.7, latest 8.0.0, type resolutionDependencies, decision blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  '- babel-plugin-polyfill-regenerator: current 0.6.8, wanted 0.6.8, latest 1.0.0, type devDependencies, decision blocked - polyfill plugin major drift belongs with a dedicated RN/Metro/Babel branch so Babel runtime and bundle transforms stay aligned',
  '- bitcoinjs-lib: current 5.1.6, wanted exotic, latest exotic, type dependencies, decision exotic - BitcoinVault fork is tracked by git dependency snapshot; do not replace with upstream npm without wallet compatibility proof',
  '- bl: current 6.1.6, wanted 6.1.6, latest 7.0.4, type resolutionDependencies, decision blocked - CommonJS transitive consumers still require the validated bl 6 resolution before the ESM/export-map v7 line',
  '- electrum-client: current 2.0.0, wanted exotic, latest exotic, type dependencies, decision exotic - BitcoinVault Electrum fork is tracked by git dependency snapshot; keep network compatibility changes in a dedicated branch',
  '- react: current 19.2.3, wanted 19.2.3, latest 19.2.7, type dependencies, decision blocked - React Native renderer exact-version coupling requires React to stay aligned with the RN target snapshot',
  '- react-native-prompt-android: current 0.3.6, wanted exotic, latest exotic, type dependencies, decision exotic - prompt fork remains wallet-critical for encrypted storage startup; keep Android native prompt linkage guarded',
  '- react-test-renderer: current 19.2.3, wanted 19.2.3, latest 19.2.7, type devDependencies, decision blocked - React Native renderer exact-version coupling requires test renderer to stay aligned with React and RN',
  '- rn-nodeify: current 10.3.0, wanted exotic, latest exotic, type devDependencies, decision exotic - GitHub pin is guarded by rn-nodeify shim checks and git dependency snapshot',
  'Known blocked entries: 13',
  'Exotic entries: 4',
  'Review-required entries: 0',
  'Secret values printed: no',
  'Required action: do not blindly bump direct outdated entries; use the recorded decision and open a dedicated compatibility branch for each blocker or new review-required package.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getDirectOutdatedSnapshotSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getDirectOutdatedSnapshotSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid direct outdated snapshot summary fixture', validSummary);
assertRejected(
  'Bad header fixture',
  validSummary.replace('Direct dependency outdated snapshot audit', 'Bad header'),
  'summary header',
);
assertRejected(
  'Bad timestamp fixture',
  validSummary.replace('Generated at: 2026-06-05T00:00:00.000Z', 'Generated at: now'),
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
assertRejected('Bad entry count fixture', validSummary.replace('Entries: 17', 'Entries: 16'), 'Entries count');
assertRejected(
  'Unexpected direct outdated entry fixture',
  validSummary.replace('Entries: 17', 'Entries: 18').replace(
    'Secret values printed: no',
    '- extra-package: current 1.0.0, wanted 1.0.0, latest 1.0.1, type dependencies, decision blocked - dedicated compatibility branch required\nSecret values printed: no',
  ),
  'Unexpected direct outdated entry for extra-package (dependencies)',
);
assertRejected(
  'Duplicate direct outdated entry fixture',
  validSummary.replace(
    '- rn-nodeify: current 10.3.0, wanted exotic, latest exotic, type devDependencies, decision exotic - GitHub pin is guarded by rn-nodeify shim checks and git dependency snapshot',
    '- react: current 19.2.3, wanted 19.2.3, latest 19.2.7, type dependencies, decision blocked - React Native renderer exact-version coupling requires React to stay aligned with the RN target snapshot',
  ),
  'Duplicate direct outdated entry for react (dependencies)',
);
assertRejected(
  'Missing Babel blocker fixture',
  validSummary.replace('Babel 8 is a major Metro/RN transform migration', 'generic Babel major update'),
  'dedicated RN/Metro/Babel branch',
);
assertRejected(
  'Missing polyfill-regenerator blocker fixture',
  validSummary.replace(
    'polyfill plugin major drift belongs with a dedicated RN/Metro/Babel branch so Babel runtime and bundle transforms stay aligned',
    'polyfill plugin major drift can be updated independently',
  ),
  'babel-plugin-polyfill-regenerator drift',
);
assertRejected(
  'Review required fixture',
  validSummary.replace('Review-required entries: 0', 'Review-required entries: 1'),
  'review-required entries',
);
assertRejected(
  'Missing React renderer blocker fixture',
  validSummary.replace('React Native renderer exact-version coupling', 'generic patch update'),
  'React Native renderer exact-version coupling',
);
assertRejected(
  'Missing gesture-handler blocker fixture',
  validSummary
    .replace('Entries: 17', 'Entries: 18')
    .replace('Known blocked entries: 13', 'Known blocked entries: 14')
    .replace(
      'Secret values printed: no',
      '- react-native-gesture-handler: current 3.0.2, wanted 3.0.2, latest 3.0.3, type dependencies, decision blocked - gesture runtime patch drift requires generic patch update before bumping\nSecret values printed: no',
    ),
  'dedicated navigation/gesture smoke branch',
);
assertRejected(
  'Missing axios blocker fixture',
  validSummary
    .replace('Entries: 17', 'Entries: 18')
    .replace('Known blocked entries: 13', 'Known blocked entries: 14')
    .replace(
      'Secret values printed: no',
      '- axios: current 1.18.1, wanted 1.18.1, latest 1.18.2, type dependencies, decision blocked - network client patch drift requires generic runtime proof\nSecret values printed: no',
    ),
  'dedicated storage/network branch',
);
assertRejected(
  'Missing semver blocker fixture',
  validSummary
    .replace('Entries: 17', 'Entries: 19')
    .replace('Known blocked entries: 13', 'Known blocked entries: 15')
    .replace(
      'Secret values printed: no',
      '- semver: current 7.8.5, wanted 7.8.5, latest 7.8.6, type resolutionDependencies, decision blocked - semver patch drift requires generic tooling proof\n- semver: current 7.8.5, wanted 7.8.5, latest 7.8.6, type dependencies, decision blocked - semver patch drift requires generic tooling proof\nSecret values printed: no',
    ),
  'dedicated tooling/runtime branch',
);
assertRejected(
  'Missing TypeScript ESLint blocker fixture',
  validSummary
    .replace('Entries: 17', 'Entries: 18')
    .replace('Known blocked entries: 13', 'Known blocked entries: 14')
    .replace(
      'Secret values printed: no',
      '- @typescript-eslint/parser: current 8.62.0, wanted 8.62.0, latest 8.62.1, type devDependencies, decision blocked - parser patch drift requires generic lint proof\nSecret values printed: no',
    ),
  'dedicated lint/tooling branch',
);
assertRejected(
  'Missing lint-staged blocker fixture',
  validSummary
    .replace('Entries: 17', 'Entries: 18')
    .replace('Known blocked entries: 13', 'Known blocked entries: 14')
    .replace(
      'Secret values printed: no',
      '- lint-staged: current 17.0.8, wanted 17.0.8, latest 17.0.9, type devDependencies, decision blocked - hook patch drift requires generic proof\nSecret values printed: no',
    ),
  'dedicated hook/tooling branch',
);
assertRejected(
  'Missing uuid blocker fixture',
  validSummary
    .replace('Entries: 17', 'Entries: 18')
    .replace('Known blocked entries: 13', 'Known blocked entries: 14')
    .replace(
      'Secret values printed: no',
      '- uuid: current 14.0.1, wanted 14.0.1, latest 14.0.2, type dependencies, decision blocked - uuid patch drift requires generic runtime proof\nSecret values printed: no',
    ),
  'dedicated runtime compatibility branch',
);
assertRejected(
  'Missing bl blocker fixture',
  validSummary.replace('CommonJS transitive consumers', 'generic major update'),
  'CommonJS transitive consumer',
);
assertRejected(
  'Secret printed fixture',
  validSummary.replace('Secret values printed: no', 'Secret values printed: yes'),
  'must not print secret values',
);
assertRejected(
  'Missing required action fixture',
  validSummary.replace('do not blindly bump direct outdated entries', 'upgrade all direct outdated entries'),
  'Required action',
);

console.log('Direct outdated snapshot summary guard checks are valid.');
