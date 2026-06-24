import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidDevNetworkBlockerSummaryErrors } from './androidDevNetworkBlockerSummaryGuard.mjs';
import { getLineValue } from './androidSmokeSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-dev-network-blocker-summary.txt');
const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

if (!existsSync(summaryPath)) {
  console.error(`Missing Android dev network blocker summary: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getAndroidDevNetworkBlockerSummaryErrors(summary);
const devLogPath = getLineValue(summary, 'Dev log path');

if (!devLogPath || !existsSync(devLogPath)) {
  errors.push('Dev log path must point to an existing local file');
} else {
  const expectedBytes = getLineValue(summary, 'Dev log bytes');
  const expectedSha256 = getLineValue(summary, 'Dev log sha256');

  if (String(statSync(devLogPath).size) !== expectedBytes) {
    errors.push('Dev log bytes does not match the current file size');
  }

  if (fileSha256(devLogPath) !== expectedSha256) {
    errors.push('Dev log sha256 does not match the current file digest');
  }
}

if (errors.length > 0) {
  console.error('Android dev network blocker summary is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android dev network blocker summary is valid.');

