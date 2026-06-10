import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getWalletCryptoLatestSnapshotSummaryErrors } from './walletCryptoLatestSnapshotSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'wallet-crypto-latest-snapshot.txt');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const expectedNodeVersion = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);

const trackedPackages = [
  {
    name: 'bitcoinjs-lib',
    source: 'dependencies',
    forkPinned: true,
    decision: 'fork-pinned - do not replace the BitcoinVault fork with upstream npm without a dedicated wallet compatibility branch',
  },
  { name: 'bip39', source: 'dependencies' },
  { name: 'bip32', source: 'dependencies' },
  { name: '@bitcoinerlab/secp256k1', source: 'dependencies' },
  { name: 'coinselect', source: 'dependencies' },
  { name: 'ecurve', source: 'dependencies' },
  { name: 'bigi', source: 'dependencies' },
  { name: 'pbkdf2', source: 'dependencies' },
  { name: 'wif', source: 'dependencies' },
  { name: 'react-native-get-random-values', source: 'dependencies' },
  { name: 'crypto-js', source: 'dependencies' },
  { name: '@types/bigi', source: 'devDependencies' },
  { name: '@types/crypto-js', source: 'devDependencies' },
  { name: '@types/ecurve', source: 'devDependencies' },
  { name: '@types/pbkdf2', source: 'devDependencies' },
];

const npmViewVersion = packageName =>
  JSON.parse(
    execFileSync(npmCommand, npmArgs(['view', packageName, 'version', '--json']), {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim(),
  );

const manifestPathFor = packageName => path.join(root, 'node_modules', ...packageName.split('/'), 'package.json');

const getInstalledVersion = packageName => {
  const manifestPath = manifestPathFor(packageName);
  if (!existsSync(manifestPath)) {
    return '';
  }

  return JSON.parse(readFileSync(manifestPath, 'utf8')).version || '';
};

const getDecision = ({ current, installed, latest, forkPinned, decision }) => {
  if (forkPinned) {
    return decision;
  }

  if (current === latest && installed === latest) {
    return 'current - latest npm package is installed and pinned for the wallet crypto baseline';
  }

  return 'deferred - latest npm metadata differs; use a dedicated wallet crypto dependency branch with offline tests, Android assemble, and emulator smoke';
};

export const collectWalletCryptoLatestSnapshot = () =>
  trackedPackages.map(entry => {
    const current = packageJson[entry.source]?.[entry.name] || '';
    const installed = getInstalledVersion(entry.name);
    const latest = npmViewVersion(entry.name);

    return {
      ...entry,
      current,
      installed,
      latest,
      decision: getDecision({ ...entry, current, installed, latest }),
    };
  });

export const formatWalletCryptoLatestSnapshotSummary = (entries, generatedAt = new Date().toISOString()) => {
  const deferredEntries = entries.filter(entry => entry.decision.startsWith('deferred'));

  return [
    'Wallet crypto latest snapshot audit',
    `Generated at: ${generatedAt}`,
    `Node version: ${process.version}`,
    `Expected Node version: v${expectedNodeVersion}`,
    `Entries: ${entries.length}`,
    ...entries.map(
      entry =>
        `- ${entry.name}: package ${entry.current || '<missing>'}, installed ${entry.installed || '<missing>'}, latest ${
          entry.latest || '<missing>'
        }, decision ${entry.decision}`,
    ),
    `Deferred entries: ${deferredEntries.length}`,
    `Direct bech32 dependency: ${packageJson.dependencies?.bech32 ? packageJson.dependencies.bech32 : 'absent'}`,
    'Secret values printed: no',
    'Required action: use this snapshot before wallet/crypto dependency branches; package changes require offline wallet tests, Android assemble, and emulator smoke.',
    '',
  ].join('\n');
};

const printReport = entries => {
  const missing = entries.filter(entry => !entry.current);
  if (missing.length > 0) {
    console.error('Wallet crypto latest snapshot audit failed:');
    missing.forEach(entry => console.error(`- ${entry.name} is missing from package.json ${entry.source}`));
    process.exit(1);
  }

  const summary = formatWalletCryptoLatestSnapshotSummary(entries);
  const errors = getWalletCryptoLatestSnapshotSummaryErrors(summary);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  console.log(summary.trim());
  console.log(`Wallet crypto latest snapshot summary written to ${path.relative(root, summaryPath)}`);

  if (errors.length > 0) {
    console.error('Wallet crypto latest snapshot summary is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport(collectWalletCryptoLatestSnapshot());
}
