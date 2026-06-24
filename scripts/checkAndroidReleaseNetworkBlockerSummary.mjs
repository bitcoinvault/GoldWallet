import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLineValue } from './androidSmokeSummaryGuard.mjs';
import { getAndroidReleaseNetworkBlockerSummaryErrors } from './androidReleaseNetworkBlockerSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-release-network-blocker-summary.txt');
const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

if (!existsSync(summaryPath)) {
  console.error(`Missing Android release network blocker summary: ${summaryPath}`);
  process.exit(1);
}

const summary = readFileSync(summaryPath, 'utf8');
const errors = getAndroidReleaseNetworkBlockerSummaryErrors(summary);
const releaseLogPath = getLineValue(summary, 'Release log path');

if (!releaseLogPath || !existsSync(releaseLogPath)) {
  errors.push('Release log path must point to an existing local file');
} else {
  const expectedBytes = getLineValue(summary, 'Release log bytes');
  const expectedSha256 = getLineValue(summary, 'Release log sha256');

  if (String(statSync(releaseLogPath).size) !== expectedBytes) {
    errors.push('Release log bytes does not match the current file size');
  }

  if (fileSha256(releaseLogPath) !== expectedSha256) {
    errors.push('Release log sha256 does not match the current file digest');
  }
}

if (errors.length > 0) {
  console.error('Android release network blocker summary is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android release network blocker summary is valid.');
