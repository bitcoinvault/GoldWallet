const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getEntryLines = summary => summary.split(/\r?\n/).filter(line => line.startsWith('- '));

const requiredStorageNetworkEntries = new Map([
  ['@react-native-async-storage/async-storage', 'latest 3.1.1'],
  ['@react-native-community/netinfo', 'latest 12.0.1'],
  ['react-native-device-info', 'latest 15.0.2'],
  ['react-native-config', 'latest 1.6.1'],
  ['react-native-localize', 'latest 3.7.0'],
  ['react-native-get-random-values', 'latest 2.0.0'],
  ['react-native-keychain', 'latest 10.0.0'],
  ['react-native-secure-key-store', 'latest 2.0.10'],
  ['react-native-tcp-socket', 'latest 6.4.1'],
  ['react-native-webview', 'latest 14.0.1'],
]);

const requiredPeerSnippets = new Map([
  ['@react-native-async-storage/async-storage', 'peers react@*, react-native@*'],
  ['@react-native-community/netinfo', 'peers react@*, react-native@>=0.59'],
  ['react-native-config', 'peers react@*, react-native@*, react-native-windows@>=0.61'],
  ['react-native-get-random-values', 'peers react-native@>=0.81'],
  ['react-native-tcp-socket', 'peers react-native@>=0.60.0'],
  ['react-native-webview', 'peers react@*, react-native@*'],
]);

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value);

export const getStorageNetworkLatestSnapshotSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const nodeVersion = getLineValue(summary, 'Node version');
  const expectedNodeVersion = getLineValue(summary, 'Expected Node version');
  const entries = getLineValue(summary, 'Entries');
  const currentEntries = getLineValue(summary, 'Current entries');
  const deferredEntries = getLineValue(summary, 'Deferred entries');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const entryLines = getEntryLines(summary);

  if (!summary.startsWith('Storage/network latest snapshot audit')) {
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

  [
    ['Entries', entries],
    ['Current entries', currentEntries],
    ['Deferred entries', deferredEntries],
  ].forEach(([label, value]) => {
    if (!isNonNegativeInteger(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    }
  });

  if (isNonNegativeInteger(entries) && Number(entries) !== entryLines.length) {
    errors.push(`Entries count is ${entries}, but listed ${entryLines.length}`);
  }

  if (isNonNegativeInteger(entries) && Number(entries) !== requiredStorageNetworkEntries.size) {
    errors.push(`Entries must cover exactly ${requiredStorageNetworkEntries.size} storage/network packages. Received: ${entries}`);
  }

  const entryNames = entryLines.map(line => line.slice(2, line.indexOf(': ')));
  const duplicateEntryNames = entryNames.filter((name, index) => entryNames.indexOf(name) !== index);
  duplicateEntryNames.forEach(name => {
    errors.push(`Duplicate storage/network latest entry for ${name}`);
  });

  entryNames.forEach(name => {
    if (!requiredStorageNetworkEntries.has(name)) {
      errors.push(`Unexpected storage/network latest entry for ${name}`);
    }
  });

  requiredStorageNetworkEntries.forEach((requiredSnippet, packageName) => {
    const entry = entryLines.find(line => line.startsWith(`- ${packageName}: `));

    if (!entry) {
      errors.push(`Missing storage/network latest entry for ${packageName}`);
      return;
    }

    ['package ', 'installed ', 'latest ', 'decision '].forEach(snippet => {
      if (!entry.includes(snippet)) {
        errors.push(`${packageName} entry is missing ${snippet.trim()}`);
      }
    });

    if (!entry.includes(requiredSnippet)) {
      errors.push(`${packageName} entry must include ${requiredSnippet}`);
    }
  });

  requiredPeerSnippets.forEach((requiredSnippet, packageName) => {
    const entry = entryLines.find(line => line.startsWith(`- ${packageName}: `));

    if (entry && !entry.includes(requiredSnippet)) {
      errors.push(`${packageName} entry must include ${requiredSnippet}`);
    }
  });

  const webviewEntry = entryLines.find(line => line.startsWith('- react-native-webview: '));
  if (
    webviewEntry &&
    (!webviewEntry.includes('WebView major drift') ||
      !webviewEntry.includes('dedicated Terms WebView branch') ||
      !webviewEntry.includes('Android smoke and iOS static readiness proof'))
  ) {
    errors.push('react-native-webview drift must remain tied to a dedicated Terms WebView branch decision');
  }

  const listedCurrentEntries = entryLines.filter(line => line.includes('decision current')).length;
  if (isNonNegativeInteger(currentEntries) && Number(currentEntries) !== listedCurrentEntries) {
    errors.push(`Current entries count is ${currentEntries}, but listed ${listedCurrentEntries}`);
  }

  const listedDeferredEntries = entryLines.filter(line => line.includes('decision deferred')).length;
  if (isNonNegativeInteger(deferredEntries) && Number(deferredEntries) !== listedDeferredEntries) {
    errors.push(`Deferred entries count is ${deferredEntries}, but listed ${listedDeferredEntries}`);
  }

  if (deferredEntries !== '0') {
    errors.push('Storage/network latest snapshot has deferred entries; update the upgrade decision before passing baseline');
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('Storage/network latest snapshot must not print secret values');
  }

  if (
    !requiredAction.includes('use this snapshot before storage/network dependency branches') ||
    !requiredAction.includes('focused tests, Android build, and emulator smoke')
  ) {
    errors.push('Required action must mention storage/network dependency branches and focused tests, Android build, and emulator smoke');
  }

  return errors;
};
