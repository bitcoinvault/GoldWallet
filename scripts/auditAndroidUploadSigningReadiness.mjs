import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { resolveAndroidUploadSigningConfiguration, uploadSigningFields } from './androidUploadSigningReadiness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'local-docs', 'android-upload-signing-readiness-summary.txt');
const requireReady = process.argv.includes('--require-ready');
const noSummary = process.argv.includes('--no-summary');
const resolved = resolveAndroidUploadSigningConfiguration({ root });
const { safe, credentials } = resolved;
const keytoolCommand =
  process.env.JAVA_HOME && path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool');
let aliasVerification = 'not-run';
let aliasVerificationReason = safe.configured ? 'keystore file is missing' : 'signing configuration is not complete';

if (safe.ready) {
  const passwordEnvironmentName = 'GOLDWALLET_KEYTOOL_STORE_PASSWORD';
  const result = spawnSync(keytoolCommand || 'keytool', [
    '-list',
    '-keystore',
    safe.storeFilePath,
    '-alias',
    credentials.keyAlias,
    '-storepass:env',
    passwordEnvironmentName,
  ], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, [passwordEnvironmentName]: credentials.storePassword },
  });
  aliasVerification = result.status === 0 ? 'passed' : 'failed';
  aliasVerificationReason = result.status === 0 ? 'configured alias exists in keystore' : 'keytool could not verify configured alias';
}

const sourceLines = uploadSigningFields.map(
  field => `Field ${field.property} source: ${safe.sources[field.property]}`,
);
const productionReady = safe.ready && aliasVerification === 'passed';
const requiredAction = productionReady
  ? 'Run the guarded production bundle command and complete Play Console upload validation.'
  : safe.partial
    ? `Complete the missing signing fields: ${safe.missingFields.join(', ')}.`
    : safe.configured
      ? 'Provide a readable upload keystore containing the configured alias.'
      : 'Provide android/keystore.properties or all four GOLDWALLET_UPLOAD_* environment variables.';
const summary = [
  'Android upload signing readiness',
  `Configuration state: ${safe.state}`,
  `Properties file present: ${safe.propertiesFileExists ? 'yes' : 'no'}`,
  ...sourceLines,
  `Keystore file present: ${safe.storeFileExists ? 'yes' : 'no'}`,
  `Alias verification: ${aliasVerification}`,
  `Alias verification reason: ${aliasVerificationReason}`,
  `Production signing ready: ${productionReady ? 'yes' : 'no'}`,
  'Secret values printed: no',
  `Required action: ${requiredAction}`,
  '',
].join('\n');

console.log(summary);
if (!noSummary) {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, summary);
  console.log(`Summary written to ${outputPath}`);
}

if (requireReady && !productionReady) process.exit(1);
