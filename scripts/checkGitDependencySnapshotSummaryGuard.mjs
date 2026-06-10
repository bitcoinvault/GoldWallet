import { getGitDependencySnapshotSummaryErrors } from './gitDependencySnapshotSummaryGuard.mjs';

const validSummary = [
  'Git dependency snapshot audit',
  'Generated at: 2026-06-03T00:00:00.000Z',
  'Node version: v24.16.0',
  'Expected Node version: v24.16.0',
  'Entries: 4',
  'Mismatches: 0',
  '- bitcoinjs-lib: package spec: git+https://github.com/bitcoinvault/bitcoinjs-lib.git#0854f675114fada32348d51c80a6ccdb33afc360; lock hash: 0854f675114fada32348d51c80a6ccdb33afc360; package hash: 0854f675114fada32348d51c80a6ccdb33afc360; remote: https://github.com/bitcoinvault/bitcoinjs-lib.git; remote ref: refs/heads/master; remote hash: 0854f675114fada32348d51c80a6ccdb33afc360; wallet critical: yes; status: current',
  '- electrum-client: package spec: git+https://github.com/bitcoinvault/rn-electrum-client.git#d4b653dd9c505b04b3132b9bc49450f00cad0f17; lock hash: d4b653dd9c505b04b3132b9bc49450f00cad0f17; package hash: d4b653dd9c505b04b3132b9bc49450f00cad0f17; remote: https://github.com/bitcoinvault/rn-electrum-client.git; remote ref: refs/heads/master; remote hash: d4b653dd9c505b04b3132b9bc49450f00cad0f17; wallet critical: yes; status: current',
  '- react-native-prompt-android: package spec: git+https://github.com/marcosrdz/react-native-prompt-android.git#87bf3adb5f22b4d1ecaa517e93347101372398f5; lock hash: 87bf3adb5f22b4d1ecaa517e93347101372398f5; package hash: 87bf3adb5f22b4d1ecaa517e93347101372398f5; remote: https://github.com/marcosrdz/react-native-prompt-android.git; remote ref: refs/heads/master; remote hash: 87bf3adb5f22b4d1ecaa517e93347101372398f5; wallet critical: yes; status: current',
  '- rn-nodeify: package spec: github:tradle/rn-nodeify#338d8d6ba8438403093e9409e9a9d88ad884926f; lock hash: 338d8d6ba8438403093e9409e9a9d88ad884926f; package hash: 338d8d6ba8438403093e9409e9a9d88ad884926f; remote: https://github.com/tradle/rn-nodeify.git; remote ref: refs/heads/master; remote hash: 338d8d6ba8438403093e9409e9a9d88ad884926f; wallet critical: no; status: current',
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
assertRejected('Bad entry count fixture', validSummary.replace('Entries: 4', 'Entries: 3'), 'Entries must be 4');
assertRejected('Secret fixture', validSummary.replace('Secret values printed: no', 'Secret values printed: yes'), 'must not print secret values');
assertRejected(
  'Mismatched dependency fixture',
  validSummary.replace('status: current', 'status: review'),
  'entry must be current',
);
assertRejected(
  'Wrong package spec fixture',
  validSummary.replace('package spec: git+https://github.com/bitcoinvault/bitcoinjs-lib.git#', 'package spec: git+https://github.com/example/bitcoinjs-lib.git#'),
  'package spec must use',
);
assertRejected(
  'Wrong remote fixture',
  validSummary.replace('remote: https://github.com/bitcoinvault/bitcoinjs-lib.git;', 'remote: https://github.com/example/bitcoinjs-lib.git;'),
  'remote must be',
);
assertRejected(
  'Wrong wallet critical fixture',
  validSummary.replace('wallet critical: yes; status: current', 'wallet critical: no; status: current'),
  'wallet critical flag must be yes',
);
assertRejected(
  'Missing package hash fixture',
  validSummary.replace('package hash: 0854f675114fada32348d51c80a6ccdb33afc360', 'package hash: <missing>'),
  'pinned package hash',
);
assertRejected(
  'Mismatched package hash fixture',
  validSummary.replace('package hash: 0854f675114fada32348d51c80a6ccdb33afc360', 'package hash: 1854f675114fada32348d51c80a6ccdb33afc360'),
  'package hash must match the lock hash',
);
assertRejected(
  'Mismatched remote hash fixture',
  validSummary.replace('remote hash: 0854f675114fada32348d51c80a6ccdb33afc360', 'remote hash: 1854f675114fada32348d51c80a6ccdb33afc360'),
  'lock hash must match the remote hash',
);

console.log('Git dependency snapshot summary guard checks are valid.');
