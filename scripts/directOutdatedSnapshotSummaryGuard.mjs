const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getEntryLines = summary => summary.split(/\r?\n/).filter(line => line.startsWith('- '));

const requiredKnownEntries = [
  'bitcoinjs-lib',
  'bl',
  'electrum-client',
  'node-fetch',
  'react',
  'react-native-prompt-android',
  'react-test-renderer',
  'rn-nodeify',
];

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value);

export const getDirectOutdatedSnapshotSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const nodeVersion = getLineValue(summary, 'Node version');
  const expectedNodeVersion = getLineValue(summary, 'Expected Node version');
  const entries = getLineValue(summary, 'Entries');
  const knownBlockedEntries = getLineValue(summary, 'Known blocked entries');
  const exoticEntries = getLineValue(summary, 'Exotic entries');
  const reviewRequiredEntries = getLineValue(summary, 'Review-required entries');
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const entryLines = getEntryLines(summary);

  if (!summary.startsWith('Direct dependency outdated snapshot audit')) {
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
  } else if (Number(entries) !== requiredKnownEntries.length) {
    errors.push(`Entries must cover exactly ${requiredKnownEntries.length} direct outdated packages. Received: ${entries}`);
  }

  [
    ['Known blocked entries', knownBlockedEntries],
    ['Exotic entries', exoticEntries],
    ['Review-required entries', reviewRequiredEntries],
  ].forEach(([label, value]) => {
    if (!isNonNegativeInteger(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    }
  });

  const entryNames = entryLines.map(line => line.slice(2, line.indexOf(': ')));
  const duplicateEntryNames = entryNames.filter((name, index) => entryNames.indexOf(name) !== index);
  duplicateEntryNames.forEach(name => {
    errors.push(`Duplicate direct outdated entry for ${name}`);
  });

  entryNames.forEach(name => {
    if (!requiredKnownEntries.includes(name)) {
      errors.push(`Unexpected direct outdated entry for ${name}`);
    }
  });

  requiredKnownEntries.forEach(name => {
    const entry = entryLines.find(line => line.startsWith(`- ${name}: `));

    if (!entry) {
      errors.push(`Missing direct outdated entry for ${name}`);
      return;
    }

    ['current ', 'wanted ', 'latest ', 'type ', 'decision '].forEach(snippet => {
      if (!entry.includes(snippet)) {
        errors.push(`${name} entry is missing ${snippet.trim()}`);
      }
    });
  });

  const listedKnownBlockedEntries = entryLines.filter(line => line.includes('decision blocked')).length;
  if (isNonNegativeInteger(knownBlockedEntries) && Number(knownBlockedEntries) !== listedKnownBlockedEntries) {
    errors.push(`Known blocked entries count is ${knownBlockedEntries}, but listed ${listedKnownBlockedEntries}`);
  }

  const listedExoticEntries = entryLines.filter(line => line.includes('decision exotic')).length;
  if (isNonNegativeInteger(exoticEntries) && Number(exoticEntries) !== listedExoticEntries) {
    errors.push(`Exotic entries count is ${exoticEntries}, but listed ${listedExoticEntries}`);
  }

  const listedReviewRequiredEntries = entryLines.filter(line => line.includes('decision review-required')).length;
  if (isNonNegativeInteger(reviewRequiredEntries) && Number(reviewRequiredEntries) !== listedReviewRequiredEntries) {
    errors.push(`Review-required entries count is ${reviewRequiredEntries}, but listed ${listedReviewRequiredEntries}`);
  }

  if (reviewRequiredEntries !== '0') {
    errors.push('Direct outdated snapshot has review-required entries; update the upgrade decision before passing baseline');
  }

  if (!entryLines.some(line => line.startsWith('- react: ') && line.includes('React Native renderer exact-version coupling'))) {
    errors.push('React patch drift must remain tied to the React Native renderer exact-version coupling decision');
  }

  if (
    entryLines.some(line => line.startsWith('- react-native-gesture-handler: ')) &&
    !entryLines.some(line => line.startsWith('- react-native-gesture-handler: ') && line.includes('dedicated navigation/gesture smoke branch'))
  ) {
    errors.push('react-native-gesture-handler drift must remain tied to a dedicated navigation/gesture smoke branch decision');
  }

  if (!entryLines.some(line => line.startsWith('- bl: ') && line.includes('CommonJS transitive consumers'))) {
    errors.push('bl drift must remain tied to the CommonJS transitive consumer blocker');
  }

  if (!entryLines.some(line => line.startsWith('- node-fetch: ') && line.includes('ESM-only v3'))) {
    errors.push('node-fetch drift must remain tied to the ESM-only v3 blocker');
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('Direct outdated snapshot must not print secret values');
  }

  if (
    !requiredAction.includes('do not blindly bump') ||
    !requiredAction.includes('dedicated compatibility branch')
  ) {
    errors.push('Required action must mention not blindly bumping and using dedicated compatibility branches');
  }

  return errors;
};
