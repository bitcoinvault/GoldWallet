import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const aggregateScript = 'test:wallet-crypto:offline';
const expectedAggregate =
  'yarn wallet:crypto-runtime:audit && yarn test:hdwallet:offline && yarn test:watchonly:offline && yarn test:wallet-core:offline && yarn test:wallet-crypto:signer';
const signerScript = 'node node_modules/jest/bin/jest.js tests/unit/signer.test.js --forceExit --runInBand';
const expectedTests = [
  'tests/integration/HDWallet.offline.test.js',
  'tests/integration/WatchOnlyWallet.offline.test.js',
  'tests/integration/App.offline.test.js',
  'tests/unit/signer.test.js',
];
const hdWalletTest = 'tests/integration/HDWallet.offline.test.js';
const errors = [];

if (scripts[aggregateScript] !== expectedAggregate) {
  errors.push(`package.json ${aggregateScript} must be "${expectedAggregate}"`);
}

if (scripts['test:wallet-crypto:signer'] !== signerScript) {
  errors.push(`package.json test:wallet-crypto:signer must be "${signerScript}"`);
}

if (!scripts.prepush?.includes(`yarn ${aggregateScript}`)) {
  errors.push(`prepush must include ${aggregateScript}`);
}

if (!scripts['android:dev:check-light']?.includes('yarn check:wallet-crypto-validation-scripts')) {
  errors.push('android:dev:check-light must include check:wallet-crypto-validation-scripts');
}

expectedTests.forEach(testPath => {
  if (!existsSync(path.join(root, testPath))) {
    errors.push(`${testPath} is missing`);
  }
});

if (!existsSync(path.join(root, hdWalletTest))) {
  errors.push(`${hdWalletTest} is missing`);
} else {
  const source = read(hdWalletTest);
  [
    'uses the cached WIF values when signing Segwit HD BIP49 UTXOs',
    'assert.deepStrictEqual(originalUtxos, utxos)',
    'assert.strictEqual(signedUtxo.wif, expectedWif)',
    'assert.throws(() => hd._getWifForAddress(\'RVmissingAddress\'), /Could not find WIF/)',
  ].forEach(snippet => {
    if (!source.includes(snippet)) {
      errors.push(`${hdWalletTest} is missing "${snippet}"`);
    }
  });
}

if (errors.length > 0) {
  console.error('Wallet crypto validation scripts guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Wallet crypto validation scripts are guarded.');
