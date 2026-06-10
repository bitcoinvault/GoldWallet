import { getWalletCryptoLatestSnapshotSummaryErrors } from './walletCryptoLatestSnapshotSummaryGuard.mjs';

const validSummary = [
  'Wallet crypto latest snapshot audit',
  'Generated at: 2026-06-05T00:00:00.000Z',
  'Node version: v24.16.0',
  'Expected Node version: v24.16.0',
  'Entries: 15',
  '- bitcoinjs-lib: package git+https://github.com/bitcoinvault/bitcoinjs-lib.git#0854f675114fada32348d51c80a6ccdb33afc360, installed 2.0.3, latest 7.0.1, decision fork-pinned - do not replace the BitcoinVault fork with upstream npm without a dedicated wallet compatibility branch',
  '- bip39: package 3.1.0, installed 3.1.0, latest 3.1.0, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- bip32: package 5.0.1, installed 5.0.1, latest 5.0.1, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- @bitcoinerlab/secp256k1: package 1.2.0, installed 1.2.0, latest 1.2.0, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- coinselect: package 3.1.13, installed 3.1.13, latest 3.1.13, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- ecurve: package 1.0.6, installed 1.0.6, latest 1.0.6, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- bigi: package 1.4.2, installed 1.4.2, latest 1.4.2, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- pbkdf2: package 3.1.6, installed 3.1.6, latest 3.1.6, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- wif: package 5.0.0, installed 5.0.0, latest 5.0.0, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- react-native-get-random-values: package 2.0.0, installed 2.0.0, latest 2.0.0, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- crypto-js: package 4.2.0, installed 4.2.0, latest 4.2.0, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- @types/bigi: package 1.4.5, installed 1.4.5, latest 1.4.5, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- @types/crypto-js: package 4.2.2, installed 4.2.2, latest 4.2.2, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- @types/ecurve: package 1.0.3, installed 1.0.3, latest 1.0.3, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  '- @types/pbkdf2: package 3.1.2, installed 3.1.2, latest 3.1.2, decision current - latest npm package is installed and pinned for the wallet crypto baseline',
  'Deferred entries: 0',
  'Direct bech32 dependency: absent',
  'Secret values printed: no',
  'Required action: use this snapshot before wallet/crypto dependency branches; package changes require offline wallet tests, Android assemble, and emulator smoke.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getWalletCryptoLatestSnapshotSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getWalletCryptoLatestSnapshotSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid wallet crypto latest snapshot summary fixture', validSummary);
assertRejected(
  'Bad header fixture',
  validSummary.replace('Wallet crypto latest snapshot audit', 'Bad header'),
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
assertRejected('Bad entry count fixture', validSummary.replace('Entries: 15', 'Entries: 14'), 'Entries count');
assertRejected(
  'Missing BTCV fork fixture',
  validSummary.replace('bitcoinvault/bitcoinjs-lib', 'bitcoinjs/bitcoinjs-lib'),
  'BitcoinVault fork',
);
assertRejected(
  'Direct bech32 fixture',
  validSummary.replace('Direct bech32 dependency: absent', 'Direct bech32 dependency: 2.0.0'),
  'Direct bech32 dependency',
);
assertRejected(
  'Secret printed fixture',
  validSummary.replace('Secret values printed: no', 'Secret values printed: yes'),
  'must not print secret values',
);
assertRejected(
  'Missing required action fixture',
  validSummary.replace('Android assemble, and emulator smoke', 'manual review'),
  'Required action',
);
assertRejected(
  'Missing wif entry fixture',
  validSummary.replace('- wif: package 5.0.0, installed 5.0.0, latest 5.0.0, decision current - latest npm package is installed and pinned for the wallet crypto baseline', '- missing-wif: package 5.0.0, installed 5.0.0, latest 5.0.0, decision current - latest npm package is installed and pinned for the wallet crypto baseline'),
  'Missing wallet crypto latest entry for wif',
);

console.log('Wallet crypto latest snapshot summary guard checks are valid.');
