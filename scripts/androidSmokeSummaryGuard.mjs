import { existsSync, statSync } from 'fs';

export const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}:`));
  return line ? line.slice(label.length + 1).trim() : '';
};

const hasLine = (content, expectedLine) => content.split(/\r?\n/).includes(expectedLine);

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);

const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;

const isExistingFile = (filePath, requireNonEmpty = false) => {
  if (!filePath || !existsSync(filePath)) {
    return false;
  }

  return !requireNonEmpty || statSync(filePath).size > 0;
};

export const getAndroidSmokeSummaryErrors = summary => {
  const errors = [];

  if (!isIsoTimestamp(getLineValue(summary, 'Generated at'))) {
    errors.push('Generated at must be an ISO timestamp');
  }

  [
    'Android smoke outcome: passed',
    'Android smoke exit code: 0',
    'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
    'Metro reachable: yes',
  ].forEach(expectedLine => {
    if (!hasLine(summary, expectedLine)) {
      errors.push(`Expected line not found: ${expectedLine}`);
    }
  });

  ['App PID', 'Captured logcat lines', 'UI hierarchy attempts', 'Screenshot bytes'].forEach(label => {
    if (!isPositiveInteger(getLineValue(summary, label))) {
      errors.push(`${label} must be a positive integer`);
    }
  });

  if (!getLineValue(summary, 'Android serial')) {
    errors.push('Android serial is missing');
  }

  if (!getLineValue(summary, 'Android package')) {
    errors.push('Android package is missing');
  }

  if (!getLineValue(summary, 'Expected UI texts')) {
    errors.push('Expected UI texts are missing');
  }

  if (!isExistingFile(getLineValue(summary, 'UI hierarchy path'), true)) {
    errors.push('UI hierarchy path must point to a non-empty file');
  }

  if (!isExistingFile(getLineValue(summary, 'Screenshot path'), true)) {
    errors.push('Screenshot path must point to a non-empty file');
  }

  return errors;
};

export const assertAndroidSmokeSummary = summary => {
  const errors = getAndroidSmokeSummaryErrors(summary);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
};
