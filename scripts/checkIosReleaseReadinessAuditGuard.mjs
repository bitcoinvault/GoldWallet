import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  collectIosReleaseReadiness,
  formatIosReleaseReadinessSummary,
  writeIosReleaseReadinessSummary,
} from './auditIosReleaseReadiness.mjs';
import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

assert(typeof collectIosReleaseReadiness === 'function', 'auditIosReleaseReadiness must export collectIosReleaseReadiness');
assert(typeof formatIosReleaseReadinessSummary === 'function', 'auditIosReleaseReadiness must export formatIosReleaseReadinessSummary');
assert(typeof writeIosReleaseReadinessSummary === 'function', 'auditIosReleaseReadiness must export writeIosReleaseReadinessSummary');

const source = readFileSync(path.join(root, 'scripts', 'auditIosReleaseReadiness.mjs'), 'utf8');

[
  'pathToFileURL',
  'import.meta.url === pathToFileURL(process.argv[1]).href',
  'export const collectIosReleaseReadiness',
  'export const formatIosReleaseReadinessSummary',
  'export const writeIosReleaseReadinessSummary',
].forEach(snippet => {
  assert(source.includes(snippet), `auditIosReleaseReadiness.mjs must include: ${snippet}`);
});

const readyAudit = {
  ready: true,
  staticReady: true,
  errors: [],
  warnings: [],
  podfileLockDriftIssues: [],
  removedPodfileLockDriftIssues: [],
  reactNativeVersion: '0.86.0',
  rnMinIosVersion: '15.1',
  rnMinXcodeVersion: '16.1',
  podfilePlatform: '15.1',
  deploymentTargets: ['15.1'],
  schemeCount: 8,
  sentryBundlePhaseCount: 4,
  sentryDsymPhaseCount: 3,
  codePushPlistPlaceholderCount: 3,
  remoteNotificationPlistCount: 4,
  xcodebuildVersion: 'Xcode 16.1; Build version 16B40',
};
const readySummary = formatIosReleaseReadinessSummary(readyAudit, '2026-06-10T00:00:00.000Z');
const readySummaryErrors = getIosReleaseReadinessSummaryErrors(readySummary);

assert(
  readySummaryErrors.length === 0,
  `Ready iOS release readiness summary fixture should pass, got: ${readySummaryErrors.join('; ')}`,
);
assert(
  readySummary.includes('iOS runtime delivery validation: not claimed'),
  'Formatted iOS release readiness summary must keep runtime delivery not claimed',
);
assert(
  readySummary.includes('Required action: run pod install and iOS archive/simulator validation on macOS before claiming iOS runtime delivery.'),
  'Ready iOS release readiness summary must keep macOS validation required action',
);

console.log('iOS release readiness audit guard checks are valid.');
