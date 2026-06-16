import { createHash } from 'crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  androidReleaseFingerprintInputs,
  getAndroidReleaseInputFingerprint,
  getAndroidReleaseInputFingerprintFileCount,
  getAndroidReleaseInputFingerprintFiles,
  getAndroidReleaseSummaryErrors,
  normalizeAndroidReleaseFingerprintContent,
} from './androidReleaseSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const variants = ['dev', 'stage', 'prod', 'beta'];
const fixtureApkRelativePath = variant => path.join('local-docs', `android-release-summary-${variant}-fixture.apk`);
const fixtureBundleRelativePath = variant => path.join('local-docs', `android-release-summary-${variant}-fixture.bundle`);
const fixtureSourcemapRelativePath = variant => path.join('local-docs', `android-release-summary-${variant}-fixture.map`);
const expectedApkRelativePaths = Object.fromEntries(
  variants.map(variant => [variant, fixtureApkRelativePath(variant)]),
);
const expectedBundleRelativePaths = Object.fromEntries(
  variants.map(variant => [variant, fixtureBundleRelativePath(variant)]),
);
const expectedSourcemapRelativePaths = Object.fromEntries(
  variants.map(variant => [variant, fixtureSourcemapRelativePath(variant)]),
);
const releaseInputFingerprint = getAndroidReleaseInputFingerprint(root);
const releaseInputFingerprintFileCount = getAndroidReleaseInputFingerprintFileCount(root);
const fixtureBundleContent = variant => `bundle-${variant}`;
const fixtureSourcemapContent = JSON.stringify({
  version: 3,
  sources: ['index.js'],
  names: [],
  mappings: 'AAAA',
  file: 'index.android.bundle',
});
const byteLength = value => Buffer.byteLength(value);
const sha256 = value => createHash('sha256').update(value).digest('hex');

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

assert(
  normalizeAndroidReleaseFingerprintContent('one\r\ntwo\rthree\n') === 'one\ntwo\nthree\n',
  'Android release fingerprint content normalization must convert CRLF and CR to LF',
);

variants.forEach(variant => {
  const fixtureApkPath = path.join(root, fixtureApkRelativePath(variant));
  const fixtureBundlePath = path.join(root, fixtureBundleRelativePath(variant));
  const fixtureSourcemapPath = path.join(root, fixtureSourcemapRelativePath(variant));

  mkdirSync(path.dirname(fixtureApkPath), { recursive: true });
  writeFileSync(fixtureApkPath, `fixture-${variant}`);
  writeFileSync(fixtureBundlePath, fixtureBundleContent(variant));
  writeFileSync(fixtureSourcemapPath, fixtureSourcemapContent);
});

const lineEndingFixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-release-fingerprint-'));

try {
  androidReleaseFingerprintInputs.forEach(relativePath => {
    const fixturePath = path.join(lineEndingFixtureRoot, relativePath);

    mkdirSync(path.dirname(fixturePath), { recursive: true });
    writeFileSync(fixturePath, 'release-input\nline-two\n');
  });

  const lfFingerprint = getAndroidReleaseInputFingerprint(lineEndingFixtureRoot);

  androidReleaseFingerprintInputs.forEach(relativePath => {
    writeFileSync(path.join(lineEndingFixtureRoot, relativePath), 'release-input\r\nline-two\r\n');
  });

  assert(
    getAndroidReleaseInputFingerprint(lineEndingFixtureRoot) === lfFingerprint,
    'Android release input fingerprint must be stable across LF and CRLF working-tree line endings',
  );
} finally {
  rmSync(lineEndingFixtureRoot, { recursive: true, force: true });
}

const sourceFingerprintFixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-release-source-fingerprint-'));

try {
  const sourceFilePath = path.join(sourceFingerprintFixtureRoot, 'src', 'releaseInput.ts');
  const ignoredE2eFilePath = path.join(sourceFingerprintFixtureRoot, 'src', 'releaseInput.e2e.tsx');
  const ignoredTestFilePath = path.join(sourceFingerprintFixtureRoot, 'utils', 'tests', 'ignored.test.js');

  mkdirSync(path.dirname(sourceFilePath), { recursive: true });
  mkdirSync(path.dirname(ignoredTestFilePath), { recursive: true });
  writeFileSync(sourceFilePath, 'export const releaseInput = "one";\n');

  const sourceFingerprint = getAndroidReleaseInputFingerprint(sourceFingerprintFixtureRoot);
  const sourceFileCount = getAndroidReleaseInputFingerprintFileCount(sourceFingerprintFixtureRoot);
  const sourceFiles = getAndroidReleaseInputFingerprintFiles(sourceFingerprintFixtureRoot);

  assert(
    sourceFiles.includes('src/releaseInput.ts'),
    'Android release input fingerprint must include app source files under src',
  );

  writeFileSync(sourceFilePath, 'export const releaseInput = "one";\r\n');
  assert(
    getAndroidReleaseInputFingerprint(sourceFingerprintFixtureRoot) === sourceFingerprint,
    'Android release app-source fingerprint must be stable across LF and CRLF working-tree line endings',
  );

  writeFileSync(ignoredTestFilePath, 'it("does not affect release", () => {});\n');
  assert(
    getAndroidReleaseInputFingerprintFileCount(sourceFingerprintFixtureRoot) === sourceFileCount,
    'Android release input fingerprint must ignore nested test directories under included source roots',
  );
  assert(
    getAndroidReleaseInputFingerprint(sourceFingerprintFixtureRoot) === sourceFingerprint,
    'Android release input fingerprint must not change when nested test files under source roots change',
  );

  writeFileSync(ignoredE2eFilePath, 'describe("release input", () => {});\n');
  assert(
    getAndroidReleaseInputFingerprintFileCount(sourceFingerprintFixtureRoot) === sourceFileCount,
    'Android release input fingerprint must ignore named e2e/spec/test files under included source roots',
  );
  assert(
    getAndroidReleaseInputFingerprint(sourceFingerprintFixtureRoot) === sourceFingerprint,
    'Android release input fingerprint must not change when named e2e/spec/test files under source roots change',
  );

  writeFileSync(sourceFilePath, 'export const releaseInput = "two";\n');
  assert(
    getAndroidReleaseInputFingerprint(sourceFingerprintFixtureRoot) !== sourceFingerprint,
    'Android release input fingerprint must change when app source files change',
  );
} finally {
  rmSync(sourceFingerprintFixtureRoot, { recursive: true, force: true });
}

const validSummary = [
  'Android release validation',
  'Generated at: 2026-05-30T12:24:20.279Z',
  'Started at: 2026-05-30T12:23:15.004Z',
  'Variants: dev, stage, prod, beta',
  'Variant count: 4',
  'Java executable: D:\\tmp\\jdks\\temurin17\\jdk-17.0.19+10\\bin\\java.exe',
  'Java version: openjdk version "17.0.19" 2026-04-15',
  'Android Gradle Plugin: 8.13.2',
  'Gradle wrapper: 8.13',
  'Kotlin Gradle Plugin: 2.1.20',
  'Compile SDK: 36',
  'Target SDK: 36',
  `Release input fingerprint: ${releaseInputFingerprint}`,
  `Release input fingerprint files: ${releaseInputFingerprintFileCount}`,
  'Sentry auto upload disabled for local build: yes',
  'Sentry release upload validation: not claimed',
  'Gradle retry max attempts: 2',
  'Gradle retry exit codes: 1073807364',
  'Variant dev Gradle task: :app:assembleDevRelease',
  'Variant dev exit code: 0',
  'Variant dev Gradle attempts: 1',
  'Variant dev Gradle attempt exit codes: 0',
  'Variant dev Gradle retry reason: none',
  `Variant dev Release APK: ${fixtureApkRelativePath('dev')}`,
  'Variant dev Release APK exists: yes',
  'Variant dev Release APK bytes: 11',
  'Variant dev Release APK sha256: c70965a4a0911a45a45ccad3459a235078f912273a940ac0e62873f0176efa48',
  `Variant dev Release JS bundle: ${fixtureBundleRelativePath('dev')}`,
  'Variant dev Release JS bundle exists: yes',
  `Variant dev Release JS bundle bytes: ${byteLength(fixtureBundleContent('dev'))}`,
  `Variant dev Release JS bundle sha256: ${sha256(fixtureBundleContent('dev'))}`,
  `Variant dev Release source map: ${fixtureSourcemapRelativePath('dev')}`,
  'Variant dev Release source map exists: yes',
  `Variant dev Release source map bytes: ${byteLength(fixtureSourcemapContent)}`,
  `Variant dev Release source map sha256: ${sha256(fixtureSourcemapContent)}`,
  'Variant dev spawn error: none',
  'Variant stage Gradle task: :app:assembleStageRelease',
  'Variant stage exit code: 0',
  'Variant stage Gradle attempts: 1',
  'Variant stage Gradle attempt exit codes: 0',
  'Variant stage Gradle retry reason: none',
  `Variant stage Release APK: ${fixtureApkRelativePath('stage')}`,
  'Variant stage Release APK exists: yes',
  'Variant stage Release APK bytes: 13',
  'Variant stage Release APK sha256: bde4070b5100b4d1ebfa93f73b2612d2502ff26154c2f5418e637720c0122ea2',
  `Variant stage Release JS bundle: ${fixtureBundleRelativePath('stage')}`,
  'Variant stage Release JS bundle exists: yes',
  `Variant stage Release JS bundle bytes: ${byteLength(fixtureBundleContent('stage'))}`,
  `Variant stage Release JS bundle sha256: ${sha256(fixtureBundleContent('stage'))}`,
  `Variant stage Release source map: ${fixtureSourcemapRelativePath('stage')}`,
  'Variant stage Release source map exists: yes',
  `Variant stage Release source map bytes: ${byteLength(fixtureSourcemapContent)}`,
  `Variant stage Release source map sha256: ${sha256(fixtureSourcemapContent)}`,
  'Variant stage spawn error: none',
  'Variant prod Gradle task: :app:assembleProdRelease',
  'Variant prod exit code: 0',
  'Variant prod Gradle attempts: 1',
  'Variant prod Gradle attempt exit codes: 0',
  'Variant prod Gradle retry reason: none',
  `Variant prod Release APK: ${fixtureApkRelativePath('prod')}`,
  'Variant prod Release APK exists: yes',
  'Variant prod Release APK bytes: 12',
  'Variant prod Release APK sha256: 9e2c2dd93a1e7dc43022a3ef8cd707b485c693928e7a918b92914abc957ebfe7',
  `Variant prod Release JS bundle: ${fixtureBundleRelativePath('prod')}`,
  'Variant prod Release JS bundle exists: yes',
  `Variant prod Release JS bundle bytes: ${byteLength(fixtureBundleContent('prod'))}`,
  `Variant prod Release JS bundle sha256: ${sha256(fixtureBundleContent('prod'))}`,
  `Variant prod Release source map: ${fixtureSourcemapRelativePath('prod')}`,
  'Variant prod Release source map exists: yes',
  `Variant prod Release source map bytes: ${byteLength(fixtureSourcemapContent)}`,
  `Variant prod Release source map sha256: ${sha256(fixtureSourcemapContent)}`,
  'Variant prod spawn error: none',
  'Variant beta Gradle task: :app:assembleBetaRelease',
  'Variant beta exit code: 0',
  'Variant beta Gradle attempts: 1',
  'Variant beta Gradle attempt exit codes: 0',
  'Variant beta Gradle retry reason: none',
  `Variant beta Release APK: ${fixtureApkRelativePath('beta')}`,
  'Variant beta Release APK exists: yes',
  'Variant beta Release APK bytes: 12',
  'Variant beta Release APK sha256: 8838022187323bcec6806279a0f9bc0b5a7c18a8f931ee45f49589455ab834b9',
  `Variant beta Release JS bundle: ${fixtureBundleRelativePath('beta')}`,
  'Variant beta Release JS bundle exists: yes',
  `Variant beta Release JS bundle bytes: ${byteLength(fixtureBundleContent('beta'))}`,
  `Variant beta Release JS bundle sha256: ${sha256(fixtureBundleContent('beta'))}`,
  `Variant beta Release source map: ${fixtureSourcemapRelativePath('beta')}`,
  'Variant beta Release source map exists: yes',
  `Variant beta Release source map bytes: ${byteLength(fixtureSourcemapContent)}`,
  `Variant beta Release source map sha256: ${sha256(fixtureSourcemapContent)}`,
  'Variant beta spawn error: none',
  'Required Sentry upload follow-up: provide sentry.properties/defaults.org/defaults.project/auth.token or SENTRY_AUTH_TOKEN before claiming source-map upload validation.',
  '',
].join('\n');

const assertAccepted = (label, summary, options = {}) => {
  const errors = getAndroidReleaseSummaryErrors(summary, root, {
    expectedApkRelativePaths,
    expectedBundleRelativePaths,
    expectedSourcemapRelativePaths,
    ...options,
  });

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError, options = {}) => {
  const errors = getAndroidReleaseSummaryErrors(summary, root, {
    expectedApkRelativePaths,
    expectedBundleRelativePaths,
    expectedSourcemapRelativePaths,
    ...options,
  });

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Android dev release summary fixture', validSummary);
assertAccepted(
  'Valid Android dev release summary fixture after a bounded transient retry',
  validSummary
    .replace('Variant stage Gradle attempts: 1', 'Variant stage Gradle attempts: 2')
    .replace('Variant stage Gradle attempt exit codes: 0', 'Variant stage Gradle attempt exit codes: 1073807364, 0')
    .replace(
      'Variant stage Gradle retry reason: none',
      'Variant stage Gradle retry reason: attempt 1 exited with known transient Windows native-build code 1073807364; retrying next attempt',
    ),
);
assertAccepted(
  'Valid Android beta-only release summary fixture',
  [
    'Android release validation',
    'Generated at: 2026-05-30T12:24:20.279Z',
    'Started at: 2026-05-30T12:23:15.004Z',
    'Variants: beta',
    'Variant count: 1',
    'Java executable: D:\\tmp\\jdks\\temurin17\\jdk-17.0.19+10\\bin\\java.exe',
    'Java version: openjdk version "17.0.19" 2026-04-15',
    'Android Gradle Plugin: 8.13.2',
    'Gradle wrapper: 8.13',
    'Kotlin Gradle Plugin: 2.1.20',
    'Compile SDK: 36',
    'Target SDK: 36',
    `Release input fingerprint: ${releaseInputFingerprint}`,
    `Release input fingerprint files: ${releaseInputFingerprintFileCount}`,
    'Sentry auto upload disabled for local build: yes',
    'Sentry release upload validation: not claimed',
    'Gradle retry max attempts: 2',
    'Gradle retry exit codes: 1073807364',
    'Variant beta Gradle task: :app:assembleBetaRelease',
    'Variant beta exit code: 0',
    'Variant beta Gradle attempts: 1',
    'Variant beta Gradle attempt exit codes: 0',
    'Variant beta Gradle retry reason: none',
    `Variant beta Release APK: ${fixtureApkRelativePath('beta')}`,
    'Variant beta Release APK exists: yes',
    'Variant beta Release APK bytes: 12',
    'Variant beta Release APK sha256: 8838022187323bcec6806279a0f9bc0b5a7c18a8f931ee45f49589455ab834b9',
    `Variant beta Release JS bundle: ${fixtureBundleRelativePath('beta')}`,
    'Variant beta Release JS bundle exists: yes',
    `Variant beta Release JS bundle bytes: ${byteLength(fixtureBundleContent('beta'))}`,
    `Variant beta Release JS bundle sha256: ${sha256(fixtureBundleContent('beta'))}`,
    `Variant beta Release source map: ${fixtureSourcemapRelativePath('beta')}`,
    'Variant beta Release source map exists: yes',
    `Variant beta Release source map bytes: ${byteLength(fixtureSourcemapContent)}`,
    `Variant beta Release source map sha256: ${sha256(fixtureSourcemapContent)}`,
    'Variant beta spawn error: none',
    'Required Sentry upload follow-up: provide sentry.properties/defaults.org/defaults.project/auth.token or SENTRY_AUTH_TOKEN before claiming source-map upload validation.',
    '',
  ].join('\n'),
  {
    expectedVariants: ['beta'],
    expectedApkRelativePaths: { beta: fixtureApkRelativePath('beta') },
    expectedBundleRelativePaths: { beta: fixtureBundleRelativePath('beta') },
    expectedSourcemapRelativePaths: { beta: fixtureSourcemapRelativePath('beta') },
  },
);
assertRejected(
  'Bad header fixture',
  validSummary.replace('Android release validation', 'Bad header'),
  'summary header',
);
assertRejected(
  'Bad timestamp fixture',
  validSummary.replace('Generated at: 2026-05-30T12:24:20.279Z', 'Generated at: now'),
  'ISO timestamp',
);
assertRejected(
  'Failed variant exit fixture',
  validSummary.replace('Variant stage exit code: 0', 'Variant stage exit code: 1'),
  'Variant stage exit code: 0',
);
assertRejected(
  'Bad Java version fixture',
  validSummary.replace(
    'Java version: openjdk version "17.0.19" 2026-04-15',
    'Java version: openjdk version "11.0.28" 2026-07-15',
  ),
  'JDK 17',
);
assertRejected(
  'Bad Android Gradle Plugin fixture',
  validSummary.replace('Android Gradle Plugin: 8.13.2', 'Android Gradle Plugin: 9.2.1'),
  'Android Gradle Plugin must be 8.13.2',
);
assertRejected(
  'Bad Gradle wrapper fixture',
  validSummary.replace('Gradle wrapper: 8.13', 'Gradle wrapper: 9.5.1'),
  'Gradle wrapper must be 8.13',
);
assertRejected(
  'Bad Kotlin Gradle Plugin fixture',
  validSummary.replace('Kotlin Gradle Plugin: 2.1.20', 'Kotlin Gradle Plugin: 2.4.0'),
  'Kotlin Gradle Plugin must be 2.1.20',
);
assertRejected('Bad Compile SDK fixture', validSummary.replace('Compile SDK: 36', 'Compile SDK: 35'), 'Compile SDK must be 36');
assertRejected('Bad Target SDK fixture', validSummary.replace('Target SDK: 36', 'Target SDK: 35'), 'Target SDK must be 36');
assertRejected(
  'Missing release input fingerprint fixture',
  validSummary.replace(`Release input fingerprint: ${releaseInputFingerprint}\n`, ''),
  'Release input fingerprint',
);
assertRejected(
  'Missing Gradle retry metadata fixture',
  validSummary.replace('Gradle retry max attempts: 2\n', ''),
  'Gradle retry max attempts',
);
assertRejected(
  'Missing variant Gradle attempt metadata fixture',
  validSummary.replace('Variant dev Gradle attempts: 1\n', ''),
  'Variant dev Gradle attempts',
);
assertRejected(
  'Mismatched variant Gradle attempt metadata fixture',
  validSummary.replace('Variant prod Gradle attempts: 1', 'Variant prod Gradle attempts: 2'),
  'Gradle attempt exit code count',
);
assertRejected(
  'Missing retry reason after retry fixture',
  validSummary
    .replace('Variant beta Gradle attempts: 1', 'Variant beta Gradle attempts: 2')
    .replace('Variant beta Gradle attempt exit codes: 0', 'Variant beta Gradle attempt exit codes: 1073807364, 0'),
  'Gradle retry reason',
);
assertRejected(
  'Stale release input fingerprint fixture',
  validSummary.replace(
    `Release input fingerprint: ${releaseInputFingerprint}`,
    'Release input fingerprint: 0000000000000000000000000000000000000000000000000000000000000000',
  ),
  'Release input fingerprint does not match current release inputs',
);
assertRejected(
  'Bad release input fingerprint file count fixture',
  validSummary.replace(
    `Release input fingerprint files: ${releaseInputFingerprintFileCount}`,
    'Release input fingerprint files: 1',
  ),
  'Release input fingerprint files',
);
assertRejected(
  'Bad APK sha fixture',
  validSummary.replace(
    'Variant prod Release APK sha256: 9e2c2dd93a1e7dc43022a3ef8cd707b485c693928e7a918b92914abc957ebfe7',
    'Variant prod Release APK sha256: missing',
  ),
  'SHA-256',
);
assertRejected(
  'Mismatched APK sha fixture',
  validSummary.replace(
    'Variant prod Release APK sha256: 9e2c2dd93a1e7dc43022a3ef8cd707b485c693928e7a918b92914abc957ebfe7',
    'Variant prod Release APK sha256: 0000000000000000000000000000000000000000000000000000000000000000',
  ),
  'sha256 does not match file digest',
);
assertRejected(
  'Missing release JS bundle fixture',
  validSummary.replace('Variant stage Release JS bundle exists: yes', 'Variant stage Release JS bundle exists: no'),
  'Release JS bundle exists',
);
assertRejected(
  'Bad release source map sha fixture',
  validSummary.replace(
    `Variant beta Release source map sha256: ${sha256(fixtureSourcemapContent)}`,
    'Variant beta Release source map sha256: missing',
  ),
  'Release source map sha256',
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

console.log('Android release summary guard checks are valid.');
