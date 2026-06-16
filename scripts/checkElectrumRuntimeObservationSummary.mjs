import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'electrum-runtime-observation.txt');

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}:`));
  return line ? line.slice(label.length + 1).trim() : '';
};

const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;
const isNonNegativeInteger = value => /^\d+$/.test(value) && Number(value) >= 0;

if (!existsSync(summaryPath)) {
  console.error(`Missing Electrum runtime observation summary: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = [];

if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(getLineValue(summary, 'Generated at'))) {
  errors.push('Generated at must be an ISO timestamp');
}

if (getLineValue(summary, 'Electrum observation outcome') !== 'passed') {
  errors.push(`Electrum observation outcome must be passed. Received: ${getLineValue(summary, 'Electrum observation outcome') || 'missing'}`);
}

if (
  getLineValue(summary, 'Electrum observation reason') !==
  'Electrum connection success evidence found and no fatal/runtime logcat findings'
) {
  errors.push('Electrum observation reason is not the expected success reason');
}

['Android serial', 'Android package', 'Captured logcat sha256', 'Global logcat sha256'].forEach(label => {
  if (!getLineValue(summary, label)) {
    errors.push(`${label} is missing`);
  }
});

[
  'App PID',
  'ADB max buffer bytes',
  'Captured logcat line limit',
  'Captured logcat lines',
  'Global logcat line limit',
  'Electrum log lines',
  'Electrum success lines',
].forEach(label => {
  if (!isPositiveInteger(getLineValue(summary, label))) {
    errors.push(`${label} must be a positive integer`);
  }
});

[
  'Global logcat lines',
  'Process Electrum log lines',
  'Process Electrum success lines',
  'Process Electrum failure lines',
  'Global Electrum log lines',
  'Global Electrum success lines',
  'Global Electrum failure lines',
  'Electrum failure lines',
  'Fatal/runtime logcat lines',
].forEach(label => {
  if (!isNonNegativeInteger(getLineValue(summary, label))) {
    errors.push(`${label} must be a non-negative integer`);
  }
});

if (getLineValue(summary, 'Fatal/runtime logcat lines') !== '0') {
  errors.push('Fatal/runtime logcat lines must be 0');
}

if (getLineValue(summary, 'Secret values printed') !== 'no') {
  errors.push('Secret values printed must be no');
}

if (!summary.includes('Electrum evidence lines:') || summary.includes('Electrum evidence lines:\n<none>')) {
  errors.push('Electrum evidence lines must be present');
}

if (errors.length > 0) {
  console.error('Electrum runtime observation summary is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Electrum runtime observation summary is valid.');
