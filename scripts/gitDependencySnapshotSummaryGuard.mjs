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
  'bitcoinjs-lib',
  'electrum-client',
  'react-native-prompt-android',
  'rn-nodeify',
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

  requiredEntries.forEach(name => {
    const block = entryBlocks.find(candidate => candidate.startsWith(`- ${name}: `));

    if (!block) {
      errors.push(`Missing git dependency entry for ${name}`);
      return;
    }

    [
      'package spec:',
      'lock hash:',
      'remote:',
      'remote ref:',
      'remote hash:',
      'status:',
    ].forEach(snippet => {
      if (!block.includes(snippet)) {
        errors.push(`${name} entry is missing ${snippet}`);
      }
    });

    if (!block.includes('status: current')) {
      errors.push(`${name} entry must be current before the snapshot can pass`);
    }
  });

  if (!requiredAction.includes('review the mismatched git dependency')) {
    errors.push('Required action must describe reviewing mismatched git dependency pins');
  }

  return errors;
};
