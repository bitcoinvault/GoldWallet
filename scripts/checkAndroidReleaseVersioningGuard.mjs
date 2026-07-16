import assert from 'assert';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidReleaseVersionSummaryErrors,
  requireAndroidReleaseCandidateReadiness,
  resolveAndroidPlayReleaseReadiness,
} from './androidReleaseVersioning.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const appGradle = read('android/app/build.gradle');

for (const relativePath of [
  'android/release-version.properties',
  'android/release-version.gradle',
  'android/play-release-baseline.json',
  'scripts/androidReleaseVersioning.mjs',
  'scripts/auditAndroidReleaseVersionReadiness.mjs',
  'scripts/checkAndroidReleaseVersionSummary.mjs',
]) {
  assert(existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
}

assert(appGradle.includes('apply from: rootProject.file("release-version.gradle")'));
assert(appGradle.includes('versionCode goldwalletReleaseVersion.versionCode'));
assert(appGradle.includes('versionName goldwalletReleaseVersion.versionName'));
assert(!/versionCode\s+14/.test(appGradle), 'Android versionCode must not be duplicated in app/build.gradle');
assert(!/versionName\s+["']6\.5\.1["']/.test(appGradle), 'Android versionName must not be duplicated in app/build.gradle');

assert.strictEqual(
  packageJson.scripts['android:release-version:audit'],
  'node scripts/auditAndroidReleaseVersionReadiness.mjs',
);
assert.strictEqual(
  packageJson.scripts['android:release-version:check-summary'],
  'node scripts/checkAndroidReleaseVersionSummary.mjs',
);

const signedBundleRunner = read('scripts/runAndroidSignedBundle.mjs');
assert(
  signedBundleRunner.includes('requireAndroidReleaseCandidateReadiness'),
  'Production signed AAB runner must enforce release-candidate version readiness',
);
assert(
  signedBundleRunner.includes('getAndroidAppBundleProjectMetadata'),
  'Signed AAB evidence must use the resolved release version metadata',
);

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-release-version-${process.pid}`);
const fixtureAndroidRoot = path.join(fixtureRoot, 'android');
try {
  mkdirSync(fixtureAndroidRoot, { recursive: true });
  writeFileSync(path.join(fixtureAndroidRoot, 'release-version.properties'), 'versionCode=15\nversionName=6.5.3\n');
  writeFileSync(
    path.join(fixtureAndroidRoot, 'play-release-baseline.json'),
    JSON.stringify({
      packageName: 'io.goldwallet.wallet',
      publicVersionName: '6.5.2',
      observedAt: '2026-07-16',
      source: 'https://play.google.com/store/apps/details?id=io.goldwallet.wallet',
    }),
  );

  const ready = requireAndroidReleaseCandidateReadiness({
    root: fixtureRoot,
    env: { GOLDWALLET_PLAY_LATEST_VERSION_CODE: '14' },
  });
  assert.strictEqual(ready.ready, true);
  assert.strictEqual(ready.versionNameAhead, true);
  assert.strictEqual(ready.versionCodeAhead, true);

  const missingConsoleCode = resolveAndroidPlayReleaseReadiness({ root: fixtureRoot, env: {} });
  assert.strictEqual(missingConsoleCode.ready, false);
  assert.match(missingConsoleCode.requiredAction, /GOLDWALLET_PLAY_LATEST_VERSION_CODE/);
  assert.throws(
    () => requireAndroidReleaseCandidateReadiness({ root: fixtureRoot, env: {} }),
    /Android production release version is not ready/,
  );

  const staleCode = resolveAndroidPlayReleaseReadiness({
    root: fixtureRoot,
    env: { GOLDWALLET_PLAY_LATEST_VERSION_CODE: '15' },
  });
  assert.strictEqual(staleCode.versionCodeAhead, false);
  assert.match(staleCode.requiredAction, /versionCode above Play Console versionCode 15/);

  const validSummary = [
    'Android release version readiness',
    'Package: io.goldwallet.wallet',
    'Candidate version code: 15',
    'Candidate version name: 6.5.3',
    'Public Play version name: 6.5.2',
    'Public Play baseline observed: 2026-07-16',
    'Latest Play version code input: 14',
    'Version name ahead of public Play: yes',
    'Version code ahead of Play Console: yes',
    'Production release version ready: yes',
    'Play upload validation: not claimed',
    'Required action: Build the signed AAB and upload it to an internal Play track for external validation.',
    '',
  ].join('\n');
  assert.deepStrictEqual(getAndroidReleaseVersionSummaryErrors(validSummary, ready), []);

  writeFileSync(path.join(fixtureAndroidRoot, 'release-version.properties'), 'versionCode=15\nversionName=invalid\n');
  assert.throws(() => resolveAndroidPlayReleaseReadiness({ root: fixtureRoot, env: {} }), /valid semantic version/);
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android release versioning guard checks passed.');
