const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getEntryLines = summary => summary.split(/\r?\n/).filter(line => line.startsWith('- '));

const requiredEntries = [
  'bitcoinjs-lib',
  'bip39',
  'bip32',
  '@bitcoinerlab/secp256k1',
  'coinselect',
  'ecurve',
  'bigi',
  'pbkdf2',
  'wif',
  'react-native-get-random-values',
  'crypto-js',
  '@types/bigi',
  '@types/crypto-js',
  '@types/ecurve',
  '@types/pbkdf2',
];
const expectedBitcoinjsForkPackage =
  'git+https://github.com/bitcoinvault/bitcoinjs-lib.git#0854f675114fada32348d51c80a6ccdb33afc360';
const expectedBitcoinjsForkInstalledVersion = '5.1.6';

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value);

export const getWalletCryptoLatestSnapshotSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const nodeVersion = getLineValue(summary, 'Node version');
  const expectedNodeVersion = getLineValue(summary, 'Expected Node version');
  const entries = getLineValue(summary, 'Entries');
  const deferredEntries = getLineValue(summary, 'Deferred entries');
  const directBech32Dependency = getLineValue(summary, 'Direct bech32 dependency');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const entryLines = getEntryLines(summary);

  if (!summary.startsWith('Wallet crypto latest snapshot audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!isIsoTimestamp(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!/^v\d+\.\d+\.\d+/.test(nodeVersion)) {
    errors.push(`Node version must be recorded. Received: ${nodeVersion || 'missing'}`);
  }

  if (!/^v\d+\.\d+\.\d+/.test(expectedNodeVersion)) {
    errors.push(`Expected Node version must be recorded. Received: ${expectedNodeVersion || 'missing'}`);
  } else if (nodeVersion !== expectedNodeVersion) {
    errors.push(`Node version must match the repo .nvmrc baseline. Received: ${nodeVersion || 'missing'}, expected: ${expectedNodeVersion}`);
  }

  if (!isNonNegativeInteger(entries)) {
    errors.push(`Entries must be a non-negative integer. Received: ${entries || 'missing'}`);
  } else if (Number(entries) !== entryLines.length) {
    errors.push(`Entries count is ${entries}, but listed ${entryLines.length}`);
  }

  if (Number(entries) !== requiredEntries.length) {
    errors.push(`Entries must cover ${requiredEntries.length} wallet crypto packages. Received: ${entries || 'missing'}`);
  }

  if (!isNonNegativeInteger(deferredEntries)) {
    errors.push(`Deferred entries must be a non-negative integer. Received: ${deferredEntries || 'missing'}`);
  } else {
    const listedDeferredEntries = entryLines.filter(line => line.includes('decision deferred')).length;

    if (Number(deferredEntries) !== listedDeferredEntries) {
      errors.push(`Deferred entries count is ${deferredEntries}, but listed ${listedDeferredEntries}`);
    }
  }

  requiredEntries.forEach(name => {
    const entry = entryLines.find(line => line.startsWith(`- ${name}: `));

    if (!entry) {
      errors.push(`Missing wallet crypto latest entry for ${name}`);
      return;
    }

    ['package ', 'installed ', 'latest ', 'decision '].forEach(snippet => {
      if (!entry.includes(snippet)) {
        errors.push(`${name} entry is missing ${snippet.trim()}`);
      }
    });
  });

  const forkEntry = entryLines.find(line => line.startsWith('- bitcoinjs-lib: ')) || '';
  if (!forkEntry.includes('bitcoinvault/bitcoinjs-lib') || !forkEntry.includes('decision fork-pinned')) {
    errors.push('bitcoinjs-lib entry must keep the BitcoinVault fork pinned instead of treating upstream npm as the direct target');
  }

  if (!forkEntry.includes(`package ${expectedBitcoinjsForkPackage}`)) {
    errors.push(`bitcoinjs-lib entry must keep the expected BitcoinVault fork ref ${expectedBitcoinjsForkPackage}`);
  }

  if (!forkEntry.includes(`installed ${expectedBitcoinjsForkInstalledVersion}`)) {
    errors.push(`bitcoinjs-lib installed version must stay ${expectedBitcoinjsForkInstalledVersion} for the current BTCV fork baseline`);
  }

  if (!forkEntry.includes('latest 7.0.1')) {
    errors.push('bitcoinjs-lib entry must record the current upstream npm latest 7.0.1 as comparison-only evidence');
  }

  if (directBech32Dependency !== 'absent') {
    errors.push(`Direct bech32 dependency must remain absent. Received: ${directBech32Dependency || 'missing'}`);
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('Wallet crypto latest snapshot must not print secret values');
  }

  if (
    !requiredAction.includes('wallet/crypto dependency branches') ||
    !requiredAction.includes('Android assemble') ||
    !requiredAction.includes('emulator smoke')
  ) {
    errors.push('Required action must mention wallet/crypto dependency branches, Android assemble, and emulator smoke');
  }

  return errors;
};
