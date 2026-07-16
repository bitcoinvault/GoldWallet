import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

console.log('Android release versioning guard checks passed.');
