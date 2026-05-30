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
  'Java executable: D:\\tmp\\jdks\\temurin17\\jdk-17.0.19+10\\bin\\java.exe',
  'Java version: openjdk version "17.0.19" 2026-04-15',
  'Sentry auto upload disabled for local build: yes',
  'Sentry release upload validation: not claimed',
  `Release APK: ${fixtureApkRelativePath}`,
  'Release APK exists: yes',
  'Release APK bytes: 7',
  'Release APK sha256: cd55d3e698d289f2af888a257d8d3bd6dee07bc8d972a902d355bfe1167c31a0',
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
  'Bad Java version fixture',
  validSummary.replace(
    'Java version: openjdk version "17.0.19" 2026-04-15',
    'Java version: openjdk version "11.0.28" 2026-07-15',
  ),
  'JDK 17',
);
assertRejected(
  'Bad APK sha fixture',
  validSummary.replace(
    'Release APK sha256: cd55d3e698d289f2af888a257d8d3bd6dee07bc8d972a902d355bfe1167c31a0',
    'Release APK sha256: missing',
  ),
  'SHA-256',
);
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
