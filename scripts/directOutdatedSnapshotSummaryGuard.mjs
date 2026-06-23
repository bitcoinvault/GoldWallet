const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getEntryLines = summary => summary.split(/\r?\n/).filter(line => line.startsWith('- '));

const requiredKnownEntries = [
  ['@babel/cli', 'devDependencies'],
  ['@babel/core', 'resolutionDependencies'],
  ['@babel/core', 'devDependencies'],
  ['@babel/plugin-transform-runtime', 'devDependencies'],
  ['@babel/preset-env', 'devDependencies'],
  ['@babel/preset-react', 'devDependencies'],
  ['@babel/preset-typescript', 'devDependencies'],
  ['@babel/runtime', 'devDependencies'],
  ['@typescript-eslint/eslint-plugin', 'devDependencies'],
  ['@typescript-eslint/parser', 'devDependencies'],
  ['@babel/traverse', 'resolutionDependencies'],
  ['axios', 'dependencies'],
  ['babel-plugin-polyfill-regenerator', 'devDependencies'],
  ['bitcoinjs-lib', 'dependencies'],
  ['bl', 'resolutionDependencies'],
  ['electrum-client', 'dependencies'],
  ['lint-staged', 'devDependencies'],
  ['react', 'dependencies'],
  ['react-native-gesture-handler', 'dependencies'],
  ['react-native-prompt-android', 'dependencies'],
  ['react-test-renderer', 'devDependencies'],
  ['rn-nodeify', 'devDependencies'],
  ['semver', 'resolutionDependencies'],
  ['semver', 'dependencies'],
  ['uuid', 'dependencies'],
];
const requiredKnownEntryKeys = requiredKnownEntries.map(([name, type]) => `${name}|${type}`);

const parseEntryLine = line => {
  const match = /^- (?<name>.*?): .* type (?<type>[^,]+), decision /.exec(line);
  return {
    name: match?.groups?.name || line.slice(2, line.indexOf(': ')),
    type: match?.groups?.type || '<missing>',
  };
};

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

  const entryInfos = entryLines.map(parseEntryLine);
  const entryKeys = entryInfos.map(entry => `${entry.name}|${entry.type}`);
  const duplicateEntryKeys = entryKeys.filter((key, index) => entryKeys.indexOf(key) !== index);
  duplicateEntryKeys.forEach(key => {
    const [name, type] = key.split('|');
    errors.push(`Duplicate direct outdated entry for ${name} (${type})`);
  });

  entryInfos.forEach(entry => {
    const key = `${entry.name}|${entry.type}`;

    if (!requiredKnownEntryKeys.includes(key)) {
      errors.push(`Unexpected direct outdated entry for ${entry.name} (${entry.type})`);
    }
  });

  requiredKnownEntries.forEach(([name, type]) => {
    const entry = entryLines.find(line => line.startsWith(`- ${name}: `) && line.includes(` type ${type},`));

    if (!entry) {
      errors.push(`Missing direct outdated entry for ${name} (${type})`);
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

  const babelEntryLines = entryLines.filter(line => line.startsWith('- @babel/'));
  if (
    babelEntryLines.length > 0 &&
    !babelEntryLines.every(
      line =>
        line.includes('Babel 8 is a major Metro/RN transform migration') &&
        line.includes('current RN 0.86 Babel preset depends on the Babel 7 plugin stack') &&
        line.includes('dedicated RN/Metro/Babel branch'),
    )
  ) {
    errors.push('Babel 8 drift must remain tied to a dedicated RN/Metro/Babel branch decision');
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
