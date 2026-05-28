import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertWarningSummarySources, getLineValue } from './androidValidationArtifactsGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-warning-audit-summary.txt');

const assertIsoTimestamp = (label, value) => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new Error(`${label} must be an ISO timestamp. Received: ${value || 'missing'}`);
  }
};

const assertLine = (content, expectedLine) => {
  if (!content.split(/\r?\n/).includes(expectedLine)) {
    throw new Error(`Expected line not found: ${expectedLine}`);
  }
};

const assertNonNegativeInteger = (label, value) => {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
  }
};

const assertExistingFile = (label, filePath, requireNonEmpty = false) => {
  if (!filePath) {
    throw new Error(`${label} is missing from warning audit summary.`);
  }

  if (!existsSync(filePath)) {
    throw new Error(`${label} does not exist: ${filePath}`);
  }

  if (requireNonEmpty && statSync(filePath).size <= 0) {
    throw new Error(`${label} is empty: ${filePath}`);
  }
};

if (!existsSync(summaryPath)) {
  console.error(`Missing Android warning audit summary artifact: ${summaryPath}`);
  process.exit(1);
}

try {
  const summary = readFileSync(summaryPath, 'utf8');

  assertIsoTimestamp('Warning audit summary Generated at', getLineValue(summary, 'Generated at'));
  assertLine(summary, 'Android Gradle audit exit code: 0');
  assertLine(summary, 'Android Gradle warning baseline guard exit code: 0');
  assertNonNegativeInteger('Targeted Android Gradle warnings', getLineValue(summary, 'Targeted Android Gradle warnings'));
  assertLine(summary, 'Unexpected targeted Android Gradle warnings: 0');
  assertExistingFile('Android Gradle audit log path', getLineValue(summary, 'Android Gradle audit log path'), true);
  assertWarningSummarySources(summary);
} catch (error) {
  console.error('Android warning audit summary artifact is invalid:');
  console.error(`- ${error.message}`);
  process.exit(1);
}

console.log('Android warning audit summary artifact is valid.');
