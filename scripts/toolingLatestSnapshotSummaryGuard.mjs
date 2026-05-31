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

export const getToolingLatestSnapshotSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const nodeVersion = getLineValue(summary, 'Node version');
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

  if (!isNonNegativeInteger(entries)) {
    errors.push(`Entries must be a non-negative integer. Received: ${entries || 'missing'}`);
  } else if (Number(entries) !== entryLines.length) {
    errors.push(`Entries count is ${entries}, but listed ${entryLines.length}`);
  }

  if (!isNonNegativeInteger(deferredEntries)) {
    errors.push(`Deferred entries must be a non-negative integer. Received: ${deferredEntries || 'missing'}`);
  } else {
    const listedDeferredEntries = entryLines.filter(line => line.includes('decision deferred')).length;

    if (Number(deferredEntries) !== listedDeferredEntries) {
      errors.push(`Deferred entries count is ${deferredEntries}, but listed ${listedDeferredEntries}`);
    }
  }

  if (!entryLines.every(line => line.includes('package ') && line.includes('installed ') && line.includes('latest ') && line.includes('decision '))) {
    errors.push('summary entry lines must include package, installed, latest, and decision fields');
  }

  if (!entryLines.some(line => line.includes('lint-staged'))) {
    errors.push('summary must include lint-staged');
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

  if (!entryLines.some(line => line.includes('typescript'))) {
    errors.push('summary must include TypeScript');
  }

  if (!requiredAction.includes('tooling dependency branches') || !requiredAction.includes('no package versions are changed')) {
    errors.push('Required action must mention tooling dependency branches and that no package versions are changed');
  }

  return errors;
};
