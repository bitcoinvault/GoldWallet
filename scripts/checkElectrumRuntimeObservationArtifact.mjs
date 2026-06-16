import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'electrum-runtime-observation.txt');

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}:`));

  return line ? line.slice(label.length + 1).trim() : '';
};

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;
const isNonNegativeInteger = value => /^\d+$/.test(value) && Number(value) >= 0;
const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

if (!existsSync(summaryPath)) {
  console.error(`Missing Electrum runtime observation artifact: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = [];

if (!isIsoTimestamp(getLineValue(summary, 'Generated at'))) {
  errors.push('Generated at must be an ISO timestamp');
}

const outcome = getLineValue(summary, 'Electrum observation outcome');
if (!['passed', 'observed-without-success', 'inconclusive'].includes(outcome)) {
  errors.push(`Electrum observation outcome must be non-fatal. Received: ${outcome || 'missing'}`);
}

['Android serial', 'Android package', 'App PID', 'Captured logcat sha256', 'Global logcat sha256'].forEach(label => {
  if (!getLineValue(summary, label)) {
    errors.push(`${label} is missing`);
  }
});

['ADB max buffer bytes', 'Captured logcat line limit', 'Captured logcat lines', 'Global logcat line limit'].forEach(label => {
  if (!isPositiveInteger(getLineValue(summary, label))) {
    errors.push(`${label} must be a positive integer`);
  }
});

[
  'Electrum log lines',
  'Electrum success lines',
  'Electrum failure lines',
  'Process Electrum log lines',
  'Process Electrum success lines',
  'Process Electrum failure lines',
  'Global logcat lines',
  'Global Electrum log lines',
  'Global Electrum success lines',
  'Global Electrum failure lines',
  'Fatal/runtime logcat lines',
  'UI hierarchy bytes',
].forEach(label => {
  if (!isNonNegativeInteger(getLineValue(summary, label))) {
    errors.push(`${label} must be a non-negative integer`);
  }
});

if (getLineValue(summary, 'Fatal/runtime logcat lines') !== '0') {
  errors.push('Fatal/runtime logcat lines must be 0');
}

if (!/^[a-f0-9]{64}$/.test(getLineValue(summary, 'Global logcat sha256'))) {
  errors.push('Global logcat sha256 must be a lowercase SHA-256 digest');
}

if (getLineValue(summary, 'Secret values printed') !== 'no') {
  errors.push('Secret values printed must be no');
}

if (getLineValue(summary, 'UI hierarchy captured') !== 'yes') {
  errors.push('UI hierarchy captured must be yes');
}

const uiHierarchyPath = getLineValue(summary, 'UI hierarchy path');
if (!uiHierarchyPath || !existsSync(uiHierarchyPath)) {
  errors.push('UI hierarchy path must point to an existing file');
} else if (statSync(uiHierarchyPath).size <= 0) {
  errors.push('UI hierarchy path must point to a non-empty file');
} else {
  const expectedBytes = getLineValue(summary, 'UI hierarchy bytes');
  const expectedSha256 = getLineValue(summary, 'UI hierarchy sha256');

  if (String(statSync(uiHierarchyPath).size) !== expectedBytes) {
    errors.push('UI hierarchy bytes does not match the current file size');
  }

  if (!/^[a-f0-9]{64}$/.test(expectedSha256)) {
    errors.push(`UI hierarchy sha256 must be a lowercase SHA-256 digest. Received: ${expectedSha256 || 'missing'}`);
  } else if (fileSha256(uiHierarchyPath) !== expectedSha256) {
    errors.push('UI hierarchy sha256 does not match the current file digest');
  }
}

if (getLineValue(summary, 'App UI package visible') !== 'yes') {
  errors.push('App UI package visible must be yes');
}

if (getLineValue(summary, 'Connection issue UI visible') !== 'no') {
  errors.push('Connection issue UI visible must be no');
}

if (getLineValue(summary, 'Runtime UI evidence') !== 'ready') {
  errors.push('Runtime UI evidence must be ready');
}

if (!summary.includes('Electrum evidence lines:')) {
  errors.push('Electrum evidence lines section must be present');
}

if (errors.length > 0) {
  console.error('Electrum runtime observation artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

if (outcome !== 'passed') {
  console.log(`Electrum runtime observation artifact is valid, but Electrum success is not confirmed (${outcome}).`);
} else {
  console.log('Electrum runtime observation artifact is valid and includes Electrum success evidence.');
}
