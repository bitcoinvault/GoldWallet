import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const appGradle = read('android/app/build.gradle');
const gitignore = read('.gitignore');
const packageJson = JSON.parse(read('package.json'));
const signingScriptPath = path.join(root, 'android', 'upload-signing.gradle');
const readinessModulePath = path.join(root, 'scripts', 'androidUploadSigningReadiness.mjs');
const readinessAuditPath = path.join(root, 'scripts', 'auditAndroidUploadSigningReadiness.mjs');
const proofRunnerPath = path.join(root, 'scripts', 'runAndroidUploadSigningProof.mjs');

assert(existsSync(signingScriptPath), 'android/upload-signing.gradle must own secret-safe upload signing resolution');
assert(existsSync(readinessModulePath), 'Android upload signing readiness module must exist');
assert(existsSync(readinessAuditPath), 'Android upload signing readiness audit must exist');
assert(existsSync(proofRunnerPath), 'Android upload signing proof runner must exist');

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

assert.strictEqual(packageJson.scripts['android:upload-signing:audit'], 'node scripts/auditAndroidUploadSigningReadiness.mjs');
assert.strictEqual(packageJson.scripts['android:upload-signing:proof'], 'node scripts/runAndroidUploadSigningProof.mjs');
assert.strictEqual(
  packageJson.scripts['android:upload-signing:check-summary'],
  'node scripts/checkAndroidUploadSigningSummary.mjs',
);

console.log('Android upload signing guard checks passed.');
