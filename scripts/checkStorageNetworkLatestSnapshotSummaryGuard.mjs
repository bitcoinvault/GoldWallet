import { getStorageNetworkLatestSnapshotSummaryErrors } from './storageNetworkLatestSnapshotSummaryGuard.mjs';

const validSummary = [
  'Storage/network latest snapshot audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Node version: v24.16.0',
  'Expected Node version: v24.16.0',
  'Entries: 9',
  '- @react-native-async-storage/async-storage: package 3.1.1, installed 3.1.1, latest 3.1.1, peers react@*, react-native@*, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
  '- @react-native-community/netinfo: package 12.0.1, installed 12.0.1, latest 12.0.1, peers react@*, react-native@>=0.59, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
  '- react-native-device-info: package 15.0.2, installed 15.0.2, latest 15.0.2, peers react-native@*, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
  '- react-native-config: package 1.6.1, installed 1.6.1, latest 1.6.1, peers react@*, react-native@*, react-native-windows@>=0.61, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
  '- react-native-localize: package 3.7.0, installed 3.7.0, latest 3.7.0, peers @expo/config-plugins@*, react@*, react-native@*, react-native-macos@*, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
  '- react-native-get-random-values: package 2.0.0, installed 2.0.0, latest 2.0.0, peers react-native@>=0.81, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
  '- react-native-keychain: package 10.0.0, installed 10.0.0, latest 10.0.0, peers none, engines node@>=16, decision current - latest npm package is installed and pinned for the storage/network baseline',
  '- react-native-tcp-socket: package 6.4.2, installed 6.4.2, latest 6.4.2, peers react-native@>=0.60.0, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
  '- react-native-webview: package 14.0.1, installed 14.0.1, latest 14.0.1, peers react@*, react-native@*, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
  'Current entries: 9',
  'Deferred entries: 0',
  'Secret values printed: no',
  'Required action: use this snapshot before storage/network dependency branches; package changes require focused tests, Android build, and emulator smoke.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getStorageNetworkLatestSnapshotSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getStorageNetworkLatestSnapshotSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid storage/network latest snapshot summary fixture', validSummary);
assertRejected('Bad header fixture', validSummary.replace('Storage/network latest snapshot audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-06-10T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected('Missing expected Node fixture', validSummary.replace('Expected Node version: v24.16.0', 'Expected Node version: '), 'Expected Node version');
assertRejected('Wrong Node fixture', validSummary.replace('Node version: v24.16.0', 'Node version: v22.18.0'), 'repo .nvmrc baseline');
assertRejected('Bad entry count fixture', validSummary.replace('Entries: 9', 'Entries: 8'), 'Entries count');
assertRejected(
  'Unexpected package fixture',
  validSummary.replace('Entries: 9', 'Entries: 10').replace(
    'Current entries: 9',
    '- react-native-extra-storage: package 1.0.0, installed 1.0.0, latest 1.0.0, peers none, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline\nCurrent entries: 10',
  ),
  'Unexpected storage/network latest entry for react-native-extra-storage',
);
assertRejected(
  'Duplicate package fixture',
  validSummary.replace(
    '- react-native-webview: package 14.0.1, installed 14.0.1, latest 14.0.1, peers react@*, react-native@*, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
    '- react-native-tcp-socket: package 6.4.2, installed 6.4.2, latest 6.4.2, peers react-native@>=0.60.0, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
  ),
  'Duplicate storage/network latest entry for react-native-tcp-socket',
);
assertRejected(
  'Missing AsyncStorage fixture',
  validSummary.replace('- @react-native-async-storage/async-storage:', '- missing-async-storage:'),
  'Missing storage/network latest entry for @react-native-async-storage/async-storage',
);
assertRejected(
  'Changed NetInfo latest fixture',
  validSummary.replace('@react-native-community/netinfo: package 12.0.1, installed 12.0.1, latest 12.0.1', '@react-native-community/netinfo: package 12.0.1, installed 12.0.1, latest 13.0.0'),
  '@react-native-community/netinfo entry must include latest 12.0.1',
);
assertRejected(
  'Changed random values peer fixture',
  validSummary.replace('react-native-get-random-values: package 2.0.0, installed 2.0.0, latest 2.0.0, peers react-native@>=0.81', 'react-native-get-random-values: package 2.0.0, installed 2.0.0, latest 2.0.0, peers react-native@>=0.86'),
  'react-native-get-random-values entry must include peers react-native@>=0.81',
);
assertRejected(
  'Missing WebView blocker fixture',
  validSummary.replace(
    'react-native-webview: package 14.0.1, installed 14.0.1, latest 14.0.1, peers react@*, react-native@*, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
    'react-native-webview: package 14.0.1, installed 14.0.1, latest 14.0.1, peers react@*, react-native@*, engines none, decision blocked - generic WebView update review',
  ).replace('Current entries: 10', 'Current entries: 9'),
  'dedicated Terms WebView branch',
);
assertRejected(
  'Deferred entry fixture',
  validSummary.replace(
    'react-native-webview: package 14.0.1, installed 14.0.1, latest 14.0.1, peers react@*, react-native@*, engines none, decision current - latest npm package is installed and pinned for the storage/network baseline',
    'react-native-webview: package 14.0.1, installed 14.0.1, latest 14.0.1, peers react@*, react-native@*, engines none, decision deferred - open a dedicated storage/network compatibility branch before changing this package',
  )
    .replace('Current entries: 10', 'Current entries: 9')
    .replace('Deferred entries: 0', 'Deferred entries: 1'),
  'deferred entries',
);
assertRejected(
  'Secret printed fixture',
  validSummary.replace('Secret values printed: no', 'Secret values printed: yes'),
  'must not print secret values',
);
assertRejected(
  'Missing required action fixture',
  validSummary.replace('focused tests, Android build, and emulator smoke', 'manual review'),
  'Required action',
);

console.log('Storage/network latest snapshot summary guard checks are valid.');
