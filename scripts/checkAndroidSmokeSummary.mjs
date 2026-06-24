import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidDevNoNetworkSmokeEvidenceOptions } from './androidDevSmokeEvidence.mjs';
import { getAndroidDevNetworkBlockerSummaryErrors } from './androidDevNetworkBlockerSummaryGuard.mjs';
import { getAndroidNoNetworkSmokeSummaryErrors, getAndroidSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-smoke-dev-summary.txt');
const noNetworkSummaryPath = path.join(root, 'local-docs', 'android-smoke-dev-no-network-summary.txt');
const networkBlockerSummaryPath = path.join(root, 'local-docs', 'android-dev-network-blocker-summary.txt');
const debugApkPath = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'dev', 'debug', 'app-dev-debug.apk');
const controlledNetworkBlockerOutcome = 'blocked-by-electrum-certificate-expired';
const allowedControlledNetworkBlockerErrors = [
  'Expected line not found: Android smoke outcome: passed',
  'Expected line not found: Android smoke exit code: 0',
  'Expected line not found: Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Data storage preflight must be passed. Received: missing',
  'Data storage available KiB must be a positive integer. Received: missing',
  'Data storage required KiB must be a positive integer. Received: missing',
  'Data storage multiplier must be a positive number. Received: missing',
];

const readSummary = artifactPath => (existsSync(artifactPath) ? readFileSync(artifactPath, 'utf8') : '');

const getControlledNetworkBlockerErrors = () => {
  const errors = [];
  const noNetworkSummary = readSummary(noNetworkSummaryPath);
  const networkBlockerSummary = readSummary(networkBlockerSummaryPath);

  if (!noNetworkSummary) {
    errors.push(`Android dev no-network smoke summary is missing at ${noNetworkSummaryPath}`);
  } else {
    getAndroidNoNetworkSmokeSummaryErrors(noNetworkSummary, getAndroidDevNoNetworkSmokeEvidenceOptions(root)).forEach(error => {
      errors.push(`Android dev no-network smoke: ${error}`);
    });
  }

  if (!networkBlockerSummary) {
    errors.push(`Android dev network blocker summary is missing at ${networkBlockerSummaryPath}`);
  } else {
    getAndroidDevNetworkBlockerSummaryErrors(networkBlockerSummary).forEach(error => {
      errors.push(`Android dev network blocker: ${error}`);
    });

    if (!networkBlockerSummary.includes(`Dev blocker outcome: ${controlledNetworkBlockerOutcome}`)) {
      errors.push(`Android dev network blocker outcome must be ${controlledNetworkBlockerOutcome}`);
    }
  }

  return errors;
};

const isAllowedControlledNetworkBlockerError = error =>
  allowedControlledNetworkBlockerErrors.some(allowedError => error.includes(allowedError));

if (!existsSync(summaryPath)) {
  console.error(`Missing Android smoke summary artifact: ${summaryPath}`);
  process.exit(1);
}

const errors = getAndroidSmokeSummaryErrors(readFileSync(summaryPath, 'utf8'), {
  requireDataStoragePreflight: true,
  requireSmokeApkDigest: true,
  expectedSmokeApkPath: debugApkPath,
  requireSourceApkDigest: true,
  expectedSourceApkPath: debugApkPath,
});

if (errors.length > 0) {
  const unexpectedErrors = errors.filter(error => !isAllowedControlledNetworkBlockerError(error));
  const blockerErrors = unexpectedErrors.length === 0 ? getControlledNetworkBlockerErrors() : [];

  if (unexpectedErrors.length === 0 && blockerErrors.length === 0) {
    console.log(`Android smoke summary artifact is valid under controlled blocker: ${controlledNetworkBlockerOutcome}.`);
    console.log('Full Android dev runtime proof remains unclaimed until the dev/testnet Electrum TLS certificate is fixed.');
    process.exit(0);
  }

  console.error('Android smoke summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  blockerErrors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android smoke summary artifact is valid.');
