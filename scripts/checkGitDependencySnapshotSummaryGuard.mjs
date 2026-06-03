import { getGitDependencySnapshotSummaryErrors } from './gitDependencySnapshotSummaryGuard.mjs';

const validSummary = [
  'Git dependency snapshot audit',
  'Generated at: 2026-06-03T00:00:00.000Z',
  'Entries: 4',
  'Mismatches: 0',
  '- bitcoinjs-lib: package spec: git+https://github.com/bitcoinvault/bitcoinjs-lib.git#0854f675114fada32348d51c80a6ccdb33afc360; lock hash: 0854f675114fada32348d51c80a6ccdb33afc360; remote: https://github.com/bitcoinvault/bitcoinjs-lib.git; remote ref: refs/heads/master; remote hash: 0854f675114fada32348d51c80a6ccdb33afc360; wallet critical: yes; status: current',
  '- electrum-client: package spec: git+https://github.com/bitcoinvault/rn-electrum-client.git; lock hash: d4b653dd9c505b04b3132b9bc49450f00cad0f17; remote: https://github.com/bitcoinvault/rn-electrum-client.git; remote ref: refs/heads/master; remote hash: d4b653dd9c505b04b3132b9bc49450f00cad0f17; wallet critical: yes; status: current',
  '- react-native-prompt-android: package spec: git+https://github.com/marcosrdz/react-native-prompt-android.git; lock hash: 87bf3adb5f22b4d1ecaa517e93347101372398f5; remote: https://github.com/marcosrdz/react-native-prompt-android.git; remote ref: refs/heads/master; remote hash: 87bf3adb5f22b4d1ecaa517e93347101372398f5; wallet critical: yes; status: current',
  '- rn-nodeify: package spec: github:tradle/rn-nodeify; lock hash: 338d8d6ba8438403093e9409e9a9d88ad884926f; remote: https://github.com/tradle/rn-nodeify.git; remote ref: refs/heads/master; remote hash: 338d8d6ba8438403093e9409e9a9d88ad884926f; wallet critical: no; status: current',
  'Secret values printed: no',
  'Required action: review the mismatched git dependency pins before changing wallet-critical fork or polyfill packages.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getGitDependencySnapshotSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getGitDependencySnapshotSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid git dependency snapshot fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('Git dependency snapshot audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-06-03T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Bad entry count fixture', validSummary.replace('Entries: 4', 'Entries: 3'), 'Entries must be 4');
assertRejected('Secret fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');
assertRejected(
  'Mismatched dependency fixture',
  validSummary.replace('status: current', 'status: review'),
  'entry must be current',
);

console.log('Git dependency snapshot summary guard checks are valid.');
