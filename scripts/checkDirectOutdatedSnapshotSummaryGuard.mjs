import { getDirectOutdatedSnapshotSummaryErrors } from './directOutdatedSnapshotSummaryGuard.mjs';

const validSummary = [
  'Direct dependency outdated snapshot audit',
  'Generated at: 2026-06-05T00:00:00.000Z',
  'Node version: v24.16.0',
  'Expected Node version: v24.16.0',
  'Entries: 9',
  '- bitcoinjs-lib: current 5.1.6, wanted exotic, latest exotic, type dependencies, decision exotic - BitcoinVault fork is tracked by git dependency snapshot; do not replace with upstream npm without wallet compatibility proof',
  '- bl: current 6.1.6, wanted 6.1.6, latest 7.0.3, type resolutionDependencies, decision blocked - CommonJS transitive consumers still require the validated bl 6 resolution before the ESM/export-map v7 line',
  '- electrum-client: current 2.0.0, wanted exotic, latest exotic, type dependencies, decision exotic - BitcoinVault Electrum fork is tracked by git dependency snapshot; keep network compatibility changes in a dedicated branch',
  '- node-fetch: current 2.7.0, wanted 2.7.0, latest 3.3.2, type resolutionDependencies, decision blocked - ESM-only v3 remains incompatible with guarded CommonJS transitive consumers',
  '- react: current 19.2.3, wanted 19.2.3, latest 19.2.7, type dependencies, decision blocked - React Native renderer exact-version coupling requires React to stay aligned with the RN target snapshot',
  '- react-native-gesture-handler: current 3.0.0, wanted 3.0.0, latest 3.0.1, type dependencies, decision blocked - gesture runtime patch drift requires a dedicated navigation/gesture smoke branch before bumping',
  '- react-native-prompt-android: current 0.3.6, wanted exotic, latest exotic, type dependencies, decision exotic - prompt fork remains wallet-critical for encrypted storage startup; keep Android native prompt linkage guarded',
  '- react-test-renderer: current 19.2.3, wanted 19.2.3, latest 19.2.7, type devDependencies, decision blocked - React Native renderer exact-version coupling requires test renderer to stay aligned with React and RN',
  '- rn-nodeify: current 10.3.0, wanted exotic, latest exotic, type devDependencies, decision exotic - GitHub pin is guarded by rn-nodeify shim checks and git dependency snapshot',
  'Known blocked entries: 5',
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
assertRejected('Bad entry count fixture', validSummary.replace('Entries: 9', 'Entries: 7'), 'Entries count');
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
  validSummary.replace('dedicated navigation/gesture smoke branch', 'generic patch update'),
  'dedicated navigation/gesture smoke branch',
);
assertRejected(
  'Missing bl blocker fixture',
  validSummary.replace('CommonJS transitive consumers', 'generic major update'),
  'CommonJS transitive consumer',
);
assertRejected(
  'Missing node-fetch blocker fixture',
  validSummary.replace('ESM-only v3', 'generic major update'),
  'ESM-only v3',
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
