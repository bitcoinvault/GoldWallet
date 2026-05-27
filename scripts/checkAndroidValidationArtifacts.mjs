import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertWarningSummarySources, getLineValue } from './androidValidationArtifactsGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const localDocsDir = path.join(root, 'local-docs');
const smokeSummaryPath = path.join(localDocsDir, 'android-smoke-dev-summary.txt');
const warningSummaryPath = path.join(localDocsDir, 'android-warning-audit-summary.txt');

const readSummary = summaryPath => {
  if (!existsSync(summaryPath)) {
    throw new Error(`Missing validation artifact: ${summaryPath}`);
  }

  return readFileSync(summaryPath, 'utf8');
};

const assertLine = (content, expectedLine) => {
  if (!content.split(/\r?\n/).includes(expectedLine)) {
    throw new Error(`Expected line not found: ${expectedLine}`);
  }
};

const assertIsoTimestamp = (label, value) => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new Error(`${label} must be an ISO timestamp. Received: ${value || 'missing'}`);
  }
};

const assertPositiveInteger = (label, value) => {
  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    throw new Error(`${label} must be a positive integer. Received: ${value || 'missing'}`);
  }
};

const assertNonNegativeInteger = (label, value) => {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
  }
};

const assertExistingFile = (label, filePath, requireNonEmpty = false) => {
  if (!filePath) {
    throw new Error(`${label} is missing from validation summary.`);
  }

  if (!existsSync(filePath)) {
    throw new Error(`${label} does not exist: ${filePath}`);
  }

  if (requireNonEmpty && statSync(filePath).size <= 0) {
    throw new Error(`${label} is empty: ${filePath}`);
  }
};

const smokeSummary = readSummary(smokeSummaryPath);
const warningSummary = readSummary(warningSummaryPath);

assertIsoTimestamp('Smoke summary Generated at', getLineValue(smokeSummary, 'Generated at'));
assertLine(smokeSummary, 'Android smoke outcome: passed');
assertLine(smokeSummary, 'Android smoke exit code: 0');
assertLine(smokeSummary, 'Metro reachable: yes');
assertPositiveInteger('App PID', getLineValue(smokeSummary, 'App PID'));
assertPositiveInteger('Captured logcat lines', getLineValue(smokeSummary, 'Captured logcat lines'));
assertPositiveInteger('UI hierarchy attempts', getLineValue(smokeSummary, 'UI hierarchy attempts'));
assertPositiveInteger('Screenshot bytes', getLineValue(smokeSummary, 'Screenshot bytes'));
assertExistingFile('UI hierarchy path', getLineValue(smokeSummary, 'UI hierarchy path'), true);
assertExistingFile('Screenshot path', getLineValue(smokeSummary, 'Screenshot path'), true);

assertIsoTimestamp('Warning audit summary Generated at', getLineValue(warningSummary, 'Generated at'));
assertLine(warningSummary, 'Android Gradle audit exit code: 0');
assertLine(warningSummary, 'Android Gradle warning baseline guard exit code: 0');
assertNonNegativeInteger('Targeted Android Gradle warnings', getLineValue(warningSummary, 'Targeted Android Gradle warnings'));
assertLine(warningSummary, 'Unexpected targeted Android Gradle warnings: 0');
assertExistingFile('Android Gradle audit log path', getLineValue(warningSummary, 'Android Gradle audit log path'), true);

assertWarningSummarySources(warningSummary);

console.log('Android validation artifacts are consistent.');
