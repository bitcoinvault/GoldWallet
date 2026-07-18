import assert from 'assert';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidUploadSigningSummaryErrors,
  resolveAndroidUploadSigningConfiguration,
} from './androidUploadSigningReadiness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const appGradle = read('android/app/build.gradle');
const gitignore = read('.gitignore');
const packageJson = JSON.parse(read('package.json'));
const signingScriptPath = path.join(root, 'android', 'upload-signing.gradle');
const readinessModulePath = path.join(root, 'scripts', 'androidUploadSigningReadiness.mjs');
const readinessAuditPath = path.join(root, 'scripts', 'auditAndroidUploadSigningReadiness.mjs');
const proofRunnerPath = path.join(root, 'scripts', 'runAndroidUploadSigningProof.mjs');
const appBundleRunner = read('scripts/runAndroidAppBundleValidation.mjs');

assert(existsSync(signingScriptPath), 'android/upload-signing.gradle must own secret-safe upload signing resolution');
assert(existsSync(readinessModulePath), 'Android upload signing readiness module must exist');
assert(existsSync(readinessAuditPath), 'Android upload signing readiness audit must exist');
assert(existsSync(proofRunnerPath), 'Android upload signing proof runner must exist');
assert(existsSync(path.join(root, 'scripts', 'runAndroidSignedBundle.mjs')), 'Shared signed-bundle runner must exist');
assert(existsSync(path.join(root, 'scripts', 'androidSignedBundleSummary.mjs')), 'Signed-bundle summary validator must exist');
assert(
  existsSync(path.join(root, 'scripts', 'checkAndroidProductionSignedBundleSummary.mjs')),
  'Production signed-bundle summary checker must exist',
);
assert(appBundleRunner.includes('rmSync(config.aabPath, { force: true })'), 'Unsigned AAB validation must remove stale signed output');
for (const snippet of ['--source-aab', '--artifact-base', '--signed-source']) {
  assert(appBundleRunner.includes(snippet), `AAB validator must support ${snippet} for candidate-bound runtime proof`);
}
const signedBundleRunner = read('scripts/runAndroidSignedBundle.mjs');
for (const snippet of [
  'validate runtime from the exact signed AAB',
  'Candidate-bound emulator smoke: passed',
  'Runtime source AAB SHA-256',
  'getAndroidEmbeddedSmokeSummaryErrors',
]) {
  assert(signedBundleRunner.includes(snippet), `Signed-bundle runner must retain ${snippet}`);
}

const signingScript = read('android/upload-signing.gradle');
for (const key of ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']) {
  assert(signingScript.includes(key), `Upload signing Gradle script must support ${key}`);
}
for (const key of [
  'GOLDWALLET_UPLOAD_STORE_FILE',
  'GOLDWALLET_UPLOAD_STORE_PASSWORD',
  'GOLDWALLET_UPLOAD_KEY_ALIAS',
  'GOLDWALLET_UPLOAD_KEY_PASSWORD',
]) {
  assert(signingScript.includes(key), `Upload signing Gradle script must support ${key}`);
}
assert(signingScript.includes('goldwalletRequireUploadSigning'), 'Gradle signing must expose a fail-fast production requirement');
assert(signingScript.includes('Incomplete GoldWallet upload signing configuration'), 'Partial signing configuration must fail clearly');
assert(appGradle.includes('apply from: rootProject.file("upload-signing.gradle")'));
assert(appGradle.includes('signingConfigs.upload'));
assert(/^\*\.jks$/m.test(gitignore), 'Git ignore must reject Java keystore files');
assert(/^\*\.p12$/m.test(gitignore), 'Git ignore must reject PKCS12 keystore files');
assert(/^keystore\.properties$/m.test(gitignore), 'Git ignore must reject local keystore properties');

assert.strictEqual(packageJson.scripts['android:upload-signing:audit'], 'node scripts/auditAndroidUploadSigningReadiness.mjs');
assert.strictEqual(packageJson.scripts['android:upload-signing:proof'], 'node scripts/runAndroidUploadSigningProof.mjs');
assert.strictEqual(
  packageJson.scripts['android:prod:bundle:signed'],
  'node scripts/runAndroidSignedBundle.mjs',
);
assert.strictEqual(
  packageJson.scripts['android:prod:bundle:check-signed-summary'],
  'node scripts/checkAndroidProductionSignedBundleSummary.mjs',
);
assert.strictEqual(
  packageJson.scripts['check:android-signed-bundle-summary-guard'],
  'node scripts/checkAndroidSignedBundleSummaryGuard.mjs',
);
assert.strictEqual(
  packageJson.scripts['android:upload-signing:check-summary'],
  'node scripts/checkAndroidUploadSigningSummary.mjs',
);

const fixtureRoot = path.join(os.tmpdir(), `goldwallet-upload-signing-${process.pid}`);
const androidRoot = path.join(fixtureRoot, 'android');
const fixtureKeystore = path.join(androidRoot, 'fixture-upload.p12');

try {
  mkdirSync(androidRoot, { recursive: true });
  const absent = resolveAndroidUploadSigningConfiguration({ root: fixtureRoot, env: {} });
  assert.strictEqual(absent.safe.state, 'absent');
  assert.deepStrictEqual(absent.safe.missingFields, ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']);

  const partial = resolveAndroidUploadSigningConfiguration({
    root: fixtureRoot,
    env: { GOLDWALLET_UPLOAD_STORE_FILE: fixtureKeystore },
  });
  assert.strictEqual(partial.safe.state, 'partial');
  assert.deepStrictEqual(partial.safe.missingFields, ['storePassword', 'keyAlias', 'keyPassword']);

  writeFileSync(fixtureKeystore, 'fixture');
  writeFileSync(
    path.join(androidRoot, 'keystore.properties'),
    ['storeFile=fixture-upload.p12', 'storePassword=fixture-store-secret', 'keyAlias=fixture', 'keyPassword=fixture-key-secret', ''].join('\n'),
  );
  const configured = resolveAndroidUploadSigningConfiguration({ root: fixtureRoot, env: {} });
  assert.strictEqual(configured.safe.state, 'configured');
  assert.strictEqual(configured.safe.ready, true);
  assert.strictEqual(configured.safe.sources.storePassword, 'properties');

  const validSummary = [
    'Android upload signing readiness',
    'Configuration state: configured',
    'Properties file present: yes',
    'Keystore file present: yes',
    'Alias verification: passed',
    'Production signing ready: yes',
    'Secret values printed: no',
    '',
  ].join('\n');
  assert.deepStrictEqual(getAndroidUploadSigningSummaryErrors(validSummary, configured), []);
  assert(
    getAndroidUploadSigningSummaryErrors(`${validSummary}fixture-store-secret`, configured).some(error =>
      error.includes('leaks storePassword'),
    ),
  );
  assert(
    getAndroidUploadSigningSummaryErrors(validSummary.replace('Alias verification: passed', 'Alias verification: failed'), configured).some(
      error => error.includes('does not match alias verification'),
    ),
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android upload signing guard checks passed.');
