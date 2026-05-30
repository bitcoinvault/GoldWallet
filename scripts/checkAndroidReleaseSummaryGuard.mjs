import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fixtureApkPath = path.join(root, 'local-docs', 'android-release-summary-fixture.apk');
const fixtureApkRelativePath = 'local-docs\\android-release-summary-fixture.apk';

mkdirSync(path.dirname(fixtureApkPath), { recursive: true });
writeFileSync(fixtureApkPath, 'fixture');

const validSummary = [
  'Android dev release validation',
  'Generated at: 2026-05-30T12:24:20.279Z',
  'Started at: 2026-05-30T12:23:15.004Z',
  'Gradle task: :app:assembleDevRelease',
  'Exit code: 0',
  'Sentry auto upload disabled for local build: yes',
  'Sentry release upload validation: not claimed',
  `Release APK: ${fixtureApkRelativePath}`,
  'Release APK exists: yes',
  'Release APK bytes: 7',
  'Required Sentry upload follow-up: provide sentry.properties/defaults.org/defaults.project/auth.token or SENTRY_AUTH_TOKEN before claiming source-map upload validation.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getAndroidReleaseSummaryErrors(summary, root, { expectedApkRelativePath: fixtureApkRelativePath });

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getAndroidReleaseSummaryErrors(summary, root, { expectedApkRelativePath: fixtureApkRelativePath });

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Android dev release summary fixture', validSummary);
assertRejected(
  'Bad header fixture',
  validSummary.replace('Android dev release validation', 'Bad header'),
  'summary header',
);
assertRejected(
  'Bad timestamp fixture',
  validSummary.replace('Generated at: 2026-05-30T12:24:20.279Z', 'Generated at: now'),
  'ISO timestamp',
);
assertRejected('Failed exit fixture', validSummary.replace('Exit code: 0', 'Exit code: 1'), 'Exit code: 0');
assertRejected(
  'Sentry upload claimed fixture',
  validSummary.replace('Sentry release upload validation: not claimed', 'Sentry release upload validation: claimed'),
  'not claimed',
);
assertRejected(
  'Missing Sentry required action fixture',
  validSummary.replace('SENTRY_AUTH_TOKEN', 'auth token'),
  'SENTRY_AUTH_TOKEN',
);

console.log('Android dev release summary guard checks are valid.');
