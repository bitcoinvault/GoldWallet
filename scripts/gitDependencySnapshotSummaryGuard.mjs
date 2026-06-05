const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getEntryBlocks = summary =>
  summary
    .split(/\r?\n/)
    .filter(line => line.startsWith('- '))
    .map(line => line.trim());

const requiredEntries = [
  {
    name: 'bitcoinjs-lib',
    packageSpecPrefix: 'git+https://github.com/bitcoinvault/bitcoinjs-lib.git#',
    remote: 'https://github.com/bitcoinvault/bitcoinjs-lib.git',
    ref: 'refs/heads/master',
    walletCritical: 'yes',
  },
  {
    name: 'electrum-client',
    packageSpecPrefix: 'git+https://github.com/bitcoinvault/rn-electrum-client.git#',
    remote: 'https://github.com/bitcoinvault/rn-electrum-client.git',
    ref: 'refs/heads/master',
    walletCritical: 'yes',
  },
  {
    name: 'react-native-prompt-android',
    packageSpecPrefix: 'git+https://github.com/marcosrdz/react-native-prompt-android.git#',
    remote: 'https://github.com/marcosrdz/react-native-prompt-android.git',
    ref: 'refs/heads/master',
    walletCritical: 'yes',
  },
  {
    name: 'rn-nodeify',
    packageSpecPrefix: 'github:tradle/rn-nodeify#',
    remote: 'https://github.com/tradle/rn-nodeify.git',
    ref: 'refs/heads/master',
    walletCritical: 'no',
  },
];

export const getGitDependencySnapshotSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const entriesCount = getLineValue(summary, 'Entries');
  const mismatches = getLineValue(summary, 'Mismatches');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const entryBlocks = getEntryBlocks(summary);

  if (!summary.startsWith('Git dependency snapshot audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (entriesCount !== String(requiredEntries.length)) {
    errors.push(`Entries must be ${requiredEntries.length}. Received: ${entriesCount || 'missing'}`);
  }

  if (!/^\d+$/.test(mismatches)) {
    errors.push(`Mismatches must be a non-negative integer. Received: ${mismatches || 'missing'}`);
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('Git dependency snapshot summary must not print secret values');
  }

  requiredEntries.forEach(entry => {
    const { name } = entry;
    const block = entryBlocks.find(candidate => candidate.startsWith(`- ${name}: `));

    if (!block) {
      errors.push(`Missing git dependency entry for ${name}`);
      return;
    }

    [
      'package spec:',
      'package hash:',
      'lock hash:',
      'remote:',
      'remote ref:',
      'remote hash:',
      'wallet critical:',
      'status:',
    ].forEach(snippet => {
      if (!block.includes(snippet)) {
        errors.push(`${name} entry is missing ${snippet}`);
      }
    });

    if (!block.includes(`package spec: ${entry.packageSpecPrefix}`)) {
      errors.push(`${name} package spec must use ${entry.packageSpecPrefix}`);
    }

    if (!block.includes(`remote: ${entry.remote};`)) {
      errors.push(`${name} remote must be ${entry.remote}`);
    }

    if (!block.includes(`remote ref: ${entry.ref};`)) {
      errors.push(`${name} remote ref must be ${entry.ref}`);
    }

    if (!block.includes(`wallet critical: ${entry.walletCritical};`)) {
      errors.push(`${name} wallet critical flag must be ${entry.walletCritical}`);
    }

    if (!block.includes('status: current')) {
      errors.push(`${name} entry must be current before the snapshot can pass`);
    }

    const packageHash = block.match(/package hash: ([a-f0-9]{40}|<missing>)/)?.[1] || '';
    const lockHash = block.match(/lock hash: ([a-f0-9]{40}|<missing>)/)?.[1] || '';
    const remoteHash = block.match(/remote hash: ([a-f0-9]{40}|<missing>)/)?.[1] || '';

    if (!/^[a-f0-9]{40}$/.test(packageHash)) {
      errors.push(`${name} entry must include a pinned package hash`);
    }

    if (/^[a-f0-9]{40}$/.test(packageHash) && /^[a-f0-9]{40}$/.test(lockHash) && packageHash !== lockHash) {
      errors.push(`${name} package hash must match the lock hash`);
    }

    if (/^[a-f0-9]{40}$/.test(lockHash) && /^[a-f0-9]{40}$/.test(remoteHash) && lockHash !== remoteHash) {
      errors.push(`${name} lock hash must match the remote hash`);
    }
  });

  if (!requiredAction.includes('review the mismatched git dependency')) {
    errors.push('Required action must describe reviewing mismatched git dependency pins');
  }

  return errors;
};
