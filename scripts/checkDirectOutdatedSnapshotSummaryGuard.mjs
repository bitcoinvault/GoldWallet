import { formatDirectOutdatedSnapshotSummary } from './auditDirectOutdatedSnapshot.mjs';
import { getDirectOutdatedSnapshotSummaryErrors } from './directOutdatedSnapshotSummaryGuard.mjs';

const validEntries = [
  {
    name: '@babel/cli',
    current: '7.29.7',
    wanted: '7.29.7',
    latest: '8.0.1',
    type: 'devDependencies',
    decision:
      'blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  },
  {
    name: '@babel/core',
    current: '7.29.7',
    wanted: '7.29.7',
    latest: '8.0.1',
    type: 'resolutionDependencies',
    decision:
      'blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  },
  {
    name: '@babel/core',
    current: '7.29.7',
    wanted: '7.29.7',
    latest: '8.0.1',
    type: 'devDependencies',
    decision:
      'blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  },
  {
    name: '@babel/plugin-transform-runtime',
    current: '7.29.7',
    wanted: '7.29.7',
    latest: '8.0.1',
    type: 'devDependencies',
    decision:
      'blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  },
  {
    name: '@babel/preset-env',
    current: '7.29.7',
    wanted: '7.29.7',
    latest: '8.0.2',
    type: 'devDependencies',
    decision:
      'blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  },
  {
    name: '@babel/preset-react',
    current: '7.29.7',
    wanted: '7.29.7',
    latest: '8.0.1',
    type: 'devDependencies',
    decision:
      'blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  },
  {
    name: '@babel/preset-typescript',
    current: '7.29.7',
    wanted: '7.29.7',
    latest: '8.0.1',
    type: 'devDependencies',
    decision:
      'blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  },
  {
    name: '@babel/runtime',
    current: '7.29.7',
    wanted: '7.29.7',
    latest: '8.0.0',
    type: 'devDependencies',
    decision:
      'blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  },
  {
    name: '@babel/traverse',
    current: '7.29.7',
    wanted: '7.29.7',
    latest: '8.0.4',
    type: 'resolutionDependencies',
    decision:
      'blocked - Babel 8 is a major Metro/RN transform migration; current RN 0.86 Babel preset depends on the Babel 7 plugin stack and needs a dedicated RN/Metro/Babel branch',
  },
  {
    name: '@react-navigation/bottom-tabs',
    current: '7.18.7',
    wanted: '7.18.7',
    latest: '7.18.8',
    type: 'dependencies',
    decision: 'blocked - React Navigation patch drift requires a dedicated navigation smoke branch with tab navigation and Android emulator proof',
  },
  {
    name: '@react-navigation/native',
    current: '7.3.7',
    wanted: '7.3.7',
    latest: '7.3.8',
    type: 'dependencies',
    decision: 'blocked - React Navigation patch drift requires a dedicated navigation smoke branch with tab navigation and Android emulator proof',
  },
  {
    name: '@react-navigation/stack',
    current: '7.10.10',
    wanted: '7.10.10',
    latest: '7.10.11',
    type: 'dependencies',
    decision: 'blocked - React Navigation patch drift requires a dedicated navigation smoke branch with tab navigation and Android emulator proof',
  },
  {
    name: '@sentry/react-native',
    current: '8.17.1',
    wanted: '8.17.1',
    latest: '8.18.0',
    type: 'dependencies',
    decision:
      'blocked - Sentry SDK patch drift requires a dedicated release-services branch with Sentry prerequisite summaries and no source-map upload claim without credentials',
  },
  {
    name: '@typescript-eslint/eslint-plugin',
    current: '8.62.1',
    wanted: '8.62.1',
    latest: '8.63.0',
    type: 'devDependencies',
    decision: 'blocked - TypeScript ESLint patch drift requires a dedicated lint/tooling branch with precommit, lint-staged, TypeScript, and baseline audit proof',
  },
  {
    name: '@typescript-eslint/parser',
    current: '8.62.1',
    wanted: '8.62.1',
    latest: '8.63.0',
    type: 'devDependencies',
    decision: 'blocked - TypeScript ESLint patch drift requires a dedicated lint/tooling branch with precommit, lint-staged, TypeScript, and baseline audit proof',
  },
  {
    name: 'babel-plugin-polyfill-regenerator',
    current: '0.6.8',
    wanted: '0.6.8',
    latest: '1.0.0',
    type: 'devDependencies',
    decision: 'blocked - polyfill plugin major drift belongs with a dedicated RN/Metro/Babel branch so Babel runtime and bundle transforms stay aligned',
  },
  {
    name: 'bignumber.js',
    current: '11.1.4',
    wanted: '11.1.4',
    latest: '11.1.5',
    type: 'dependencies',
    decision: 'blocked - numeric runtime patch drift requires a dedicated wallet amount branch with unit tests, transaction fixtures, and Android emulator proof',
  },
  {
    name: 'bitcoinjs-lib',
    current: '5.1.6',
    wanted: 'exotic',
    latest: 'exotic',
    type: 'dependencies',
    decision: 'exotic - BitcoinVault fork is tracked by git dependency snapshot; do not replace with upstream npm without wallet compatibility proof',
  },
  {
    name: 'bl',
    current: '6.1.6',
    wanted: '6.1.6',
    latest: '7.0.6',
    type: 'resolutionDependencies',
    decision: 'blocked - CommonJS transitive consumers still require the validated bl 6 resolution before the ESM/export-map v7 line',
  },
  {
    name: 'caniuse-lite',
    current: '1.0.30001799',
    wanted: '1.0.30001799',
    latest: '1.0.30001803',
    type: 'resolutionDependencies',
    decision: 'blocked - Browserslist data resolution drift requires a dedicated tooling/resolution branch with lockfile, baseline audit, and bundle-transform proof',
  },
  {
    name: 'electrum-client',
    current: '2.0.0',
    wanted: 'exotic',
    latest: 'exotic',
    type: 'dependencies',
    decision: 'exotic - BitcoinVault Electrum fork is tracked by git dependency snapshot; keep network compatibility changes in a dedicated branch',
  },
  {
    name: 'prettier',
    current: '3.9.4',
    wanted: '3.9.4',
    latest: '3.9.5',
    type: 'devDependencies',
    decision: 'blocked - Prettier patch drift requires a dedicated formatting/tooling branch with no broad formatting churn, precommit, TypeScript, and baseline audit proof',
  },
  {
    name: 'react',
    current: '19.2.3',
    wanted: '19.2.3',
    latest: '19.2.7',
    type: 'dependencies',
    decision: 'blocked - React Native renderer exact-version coupling requires React to stay aligned with the RN target snapshot',
  },
  {
    name: 'react-native-prompt-android',
    current: '0.3.6',
    wanted: 'exotic',
    latest: 'exotic',
    type: 'dependencies',
    decision: 'exotic - prompt fork remains wallet-critical for encrypted storage startup; keep Android native prompt linkage guarded',
  },
  {
    name: 'react-native-toast-message',
    current: '2.3.3',
    wanted: '2.3.3',
    latest: '2.4.0',
    type: 'dependencies',
    decision: 'blocked - toast UI runtime drift requires a dedicated notification UI branch with Android emulator proof',
  },
  {
    name: 'react-test-renderer',
    current: '19.2.3',
    wanted: '19.2.3',
    latest: '19.2.7',
    type: 'devDependencies',
    decision: 'blocked - React Native renderer exact-version coupling requires test renderer to stay aligned with React and RN',
  },
  {
    name: 'rn-nodeify',
    current: '10.3.0',
    wanted: 'exotic',
    latest: 'exotic',
    type: 'devDependencies',
    decision: 'exotic - GitHub pin is guarded by rn-nodeify shim checks and git dependency snapshot',
  },
  {
    name: 'typescript',
    current: '6.0.3',
    wanted: '6.0.3',
    latest: '7.0.2',
    type: 'devDependencies',
    decision: 'blocked - TypeScript 7 major drift requires a dedicated compiler branch with TypeScript check, Jest, lint baseline, and RN/Metro proof',
  },
];

const validSummary = formatDirectOutdatedSnapshotSummary(validEntries, '2026-07-05T00:00:00.000Z');

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
  validSummary.replace('Generated at: 2026-07-05T00:00:00.000Z', 'Generated at: now'),
  'ISO timestamp',
);
assertRejected(
  'Wrong Node fixture',
  validSummary.replace(`Node version: ${process.version}`, 'Node version: v22.18.0'),
  'repo .nvmrc baseline',
);
assertRejected('Bad entry count fixture', validSummary.replace('Entries: 28', 'Entries: 27'), 'Entries count');
assertRejected(
  'Unexpected direct outdated entry fixture',
  validSummary.replace('Entries: 28', 'Entries: 29').replace(
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
  'Missing caniuse-lite blocker fixture',
  validSummary.replace('dedicated tooling/resolution branch with lockfile', 'generic caniuse patch branch'),
  'dedicated tooling/resolution branch',
);
assertRejected(
  'Missing React Navigation blocker fixture',
  validSummary.replace('dedicated navigation smoke branch with tab navigation', 'generic navigation patch branch'),
  'dedicated navigation smoke branch',
);
assertRejected(
  'Missing Sentry blocker fixture',
  validSummary.replace('Sentry prerequisite summaries', 'generic sentry patch branch'),
  'dedicated release-services branch',
);
assertRejected(
  'Missing bignumber blocker fixture',
  validSummary.replace('dedicated wallet amount branch with unit tests', 'generic numeric patch branch'),
  'dedicated wallet amount branch',
);
assertRejected(
  'Missing toast blocker fixture',
  validSummary.replace('dedicated notification UI branch', 'generic toast patch branch'),
  'dedicated notification UI branch',
);
assertRejected(
  'Missing TypeScript blocker fixture',
  validSummary.replace('TypeScript 7 major drift', 'generic TypeScript patch'),
  'TypeScript major drift',
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
