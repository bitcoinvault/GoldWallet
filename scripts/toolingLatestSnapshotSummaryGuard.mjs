const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));

  return line ? line.slice(label.length + 2).trim() : '';
};

const getBulletLinesAfter = (content, label) => {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.startsWith(`${label}: `));
  const bulletLines = [];

  if (startIndex === -1) {
    return bulletLines;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (!lines[index].startsWith('- ')) {
      break;
    }

    bulletLines.push(lines[index].slice(2));
  }

  return bulletLines;
};

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isNonNegativeInteger = value => /^\d+$/.test(value);
const requiredToolingEntries = [
  'typescript',
  'jest',
  'babel-jest',
  'jest-circus',
  'jest-environment-node',
  'jest-junit',
  'junit-report-merger',
  'babel-plugin-istanbul',
  'mailosaur',
  'jsdom',
  'jetifier',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  'eslint',
  '@eslint/js',
  '@eslint/eslintrc',
  '@eslint/compat',
  'jiti',
  'prettier',
  'eslint-plugin-prettier',
  'eslint-config-prettier',
  'lint-staged',
  'husky',
  'detox',
];

export const getToolingLatestSnapshotSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const nodeVersion = getLineValue(summary, 'Node version');
  const expectedNodeVersion = getLineValue(summary, 'Expected Node version');
  const entries = getLineValue(summary, 'Entries');
  const deferredEntries = getLineValue(summary, 'Deferred entries');
  const entryLines = getBulletLinesAfter(summary, 'Entries');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Tooling latest snapshot audit')) {
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

  if (isNonNegativeInteger(entries) && Number(entries) !== requiredToolingEntries.length) {
    errors.push(`Entries must cover exactly ${requiredToolingEntries.length} tooling packages. Received: ${entries}`);
  }

  const entryNames = entryLines.map(line => line.slice(0, line.indexOf(': ')));
  const duplicateEntryNames = entryNames.filter((name, index) => entryNames.indexOf(name) !== index);
  duplicateEntryNames.forEach(name => {
    errors.push(`Duplicate tooling latest entry for ${name}`);
  });

  entryNames.forEach(name => {
    if (!requiredToolingEntries.includes(name)) {
      errors.push(`Unexpected tooling latest entry for ${name}`);
    }
  });

  requiredToolingEntries.forEach(name => {
    if (!entryNames.includes(name)) {
      errors.push(`Missing tooling latest entry for ${name}`);
    }
  });

  if (!isNonNegativeInteger(deferredEntries)) {
    errors.push(`Deferred entries must be a non-negative integer. Received: ${deferredEntries || 'missing'}`);
  } else {
    const listedDeferredEntries = entryLines.filter(line => line.includes('decision deferred')).length;

    if (Number(deferredEntries) !== listedDeferredEntries) {
      errors.push(`Deferred entries count is ${deferredEntries}, but listed ${listedDeferredEntries}`);
    }
  }

  if (deferredEntries !== '0') {
    errors.push('Tooling latest snapshot has deferred entries; update the tooling upgrade decision before passing baseline');
  }

  if (
    !entryLines.every(
      line =>
        line.includes('package ') &&
        line.includes('installed ') &&
        line.includes('latest ') &&
        line.includes('decision '),
    )
  ) {
    errors.push('summary entry lines must include package, installed, latest, and decision fields');
  }

  if (!entryLines.some(line => line.includes('lint-staged'))) {
    errors.push('summary must include lint-staged');
  }

  if (!entryLines.some(line => line.includes('husky'))) {
    errors.push('summary must include Husky tooling');
  }

  if (!entryLines.some(line => line.includes('jest'))) {
    errors.push('summary must include Jest tooling');
  }

  if (!entryLines.some(line => line.includes('jest-environment-node'))) {
    errors.push('summary must include Jest environment tooling');
  }

  if (!entryLines.some(line => line.includes('jest-junit'))) {
    errors.push('summary must include Jest JUnit report tooling');
  }

  if (!entryLines.some(line => line.includes('junit-report-merger'))) {
    errors.push('summary must include JUnit report merge tooling');
  }

  if (!entryLines.some(line => line.includes('babel-plugin-istanbul'))) {
    errors.push('summary must include coverage instrumentation tooling');
  }

  if (!entryLines.some(line => line.includes('mailosaur'))) {
    errors.push('summary must include E2E mail tooling');
  }

  if (!entryLines.some(line => line.includes('jsdom'))) {
    errors.push('summary must include E2E mail DOM parser tooling');
  }

  if (!entryLines.some(line => line.includes('jetifier'))) {
    errors.push('summary must include AndroidX migration tooling');
  }

  if (!entryLines.some(line => line.startsWith('detox: package '))) {
    errors.push('summary must include Detox runner tooling');
  }

  if (!entryLines.some(line => line.includes('typescript'))) {
    errors.push('summary must include TypeScript');
  }

  if (!entryLines.some(line => line.includes('@eslint/js'))) {
    errors.push('summary must include ESLint flat config tooling');
  }

  if (
    !requiredAction.includes('tooling dependency branches') ||
    !requiredAction.includes('no package versions are changed')
  ) {
    errors.push('Required action must mention tooling dependency branches and that no package versions are changed');
  }

  return errors;
};
