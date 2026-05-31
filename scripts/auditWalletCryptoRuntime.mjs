import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));

const expectedDependencies = new Map([
  ['bitcoinjs-lib', 'git+https://github.com/bitcoinvault/bitcoinjs-lib.git'],
  ['bip39', '3.1.0'],
  ['bip32', '2.0.6'],
  ['coinselect', '3.1.13'],
  ['ecurve', '^1.0.6'],
  ['bigi', '^1.4.2'],
  ['pbkdf2', '3.1.6'],
  ['wif', '2.0.6'],
  ['react-native-randombytes', '3.6.2'],
  ['crypto-js', '4.2.0'],
]);

const expectedDevDependencies = new Map([
  ['@types/bigi', '1.4.5'],
  ['@types/ecurve', '1.0.3'],
  ['@types/pbkdf2', '3.1.2'],
]);

const requiredDocsSnippets = [
  ['docs/wallet-crypto-runtime-audit.md', 'bitcoinvault/bitcoinjs-lib'],
  ['docs/wallet-crypto-runtime-audit.md', 'Latest npm checked on 2026-05-31'],
  ['docs/wallet-crypto-runtime-audit.md', 'Funded transaction flow remains blocked until a funded BTCV testnet wallet is available'],
  ['docs/wallet-crypto-runtime-audit.md', 'Do not replace the BitcoinVault fork with upstream `bitcoinjs-lib`'],
  ['docs/dependency-upgrade-strategy.md', 'corepack yarn wallet:crypto-runtime:audit'],
];

const requiredSourceSnippets = [
  ['class/abstract-hd-wallet.js', "import * as bip39 from 'bip39'"],
  ['class/abstract-hd-segwit-p2sh-wallet.js', "require('bip32')"],
  ['class/hd-segwit-bech32-wallet.js', "require('coinselect/accumulative')"],
  ['class/hd-segwit-bech32-wallet.js', "require('coinselect/split')"],
  ['class/authenticator.ts', "from 'bitcoinjs-lib'"],
  ['src/config/index.ts', "from 'bitcoinjs-lib'"],
  ['tests/integration/App.offline.test.js', 'wallet core offline flows'],
  ['tests/integration/App.offline.test.js', 'single-key wallets derive stable BTCV addresses from the same compressed WIF'],
  ['tests/integration/HDWallet.offline.test.js', 'HD wallet offline flows'],
  ['tests/integration/HDWallet.offline.test.js', '_getWifForAddress'],
  ['tests/integration/HDWallet.offline.test.js', 'can create signed Segwit HD BIP49 transactions from offline UTXO fixtures'],
  ['tests/integration/HDWallet.offline.test.js', 'can create signed Bech32 Segwit HD transactions from offline UTXO fixtures'],
  ['tests/unit/signer.test.js', "require('bitcoinjs-lib')"],
];

const scanRoots = ['class', 'src', 'tests'];
const scanExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const trackedRuntimePackages = ['bitcoinjs-lib', 'bip39', 'bip32', 'coinselect', 'crypto-js'];

const walk = directory => {
  const absoluteDirectory = path.join(root, directory);
  const files = [];

  readdirSync(absoluteDirectory).forEach(entry => {
    const absolutePath = path.join(absoluteDirectory, entry);
    const relativePath = path.relative(root, absolutePath).replace(/\\/g, '/');
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...walk(relativePath));
    } else if (scanExtensions.has(path.extname(entry))) {
      files.push(relativePath);
    }
  });

  return files;
};

const errors = [];

expectedDependencies.forEach((expectedVersion, packageName) => {
  const actualVersion = packageJson.dependencies?.[packageName];
  if (actualVersion !== expectedVersion) {
    errors.push(`package.json has ${packageName}@${actualVersion || '<missing>'}; expected ${expectedVersion}`);
  }
});

expectedDevDependencies.forEach((expectedVersion, packageName) => {
  const actualVersion = packageJson.devDependencies?.[packageName];
  if (actualVersion !== expectedVersion) {
    errors.push(`package.json has ${packageName}@${actualVersion || '<missing>'}; expected ${expectedVersion}`);
  }
});

requiredDocsSnippets.forEach(([relativePath, snippet]) => {
  const content = read(relativePath);
  if (!content.includes(snippet)) {
    errors.push(`${relativePath} is missing "${snippet}"`);
  }
});

requiredSourceSnippets.forEach(([relativePath, snippet]) => {
  const content = read(relativePath);
  if (!content.includes(snippet)) {
    errors.push(`${relativePath} is missing "${snippet}"`);
  }
});

const packageUsage = new Map(trackedRuntimePackages.map(packageName => [packageName, []]));
scanRoots.flatMap(walk).forEach(relativePath => {
  const content = read(relativePath);
  trackedRuntimePackages.forEach(packageName => {
    if (content.includes(`'${packageName}'`) || content.includes(`"${packageName}"`) || content.includes(`'${packageName}/`) || content.includes(`"${packageName}/`)) {
      packageUsage.get(packageName).push(relativePath);
    }
  });
});

packageUsage.forEach((files, packageName) => {
  if (files.length === 0) {
    errors.push(`No source/test usage found for tracked wallet runtime package ${packageName}`);
  }
});

if (errors.length > 0) {
  console.error('Wallet crypto runtime audit failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Wallet crypto runtime audit');
expectedDependencies.forEach((expectedVersion, packageName) => {
  console.log(`${packageName}: ${expectedVersion}`);
});
packageUsage.forEach((files, packageName) => {
  console.log(`${packageName} usage files: ${files.length}`);
});
