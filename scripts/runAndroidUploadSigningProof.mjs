import { randomBytes } from 'crypto';
import { mkdirSync, rmSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'local-docs');
const proofKeystore = path.join(outputDir, 'android-upload-signing-proof.p12');
const password = randomBytes(24).toString('hex');
const alias = 'goldwallet-local-proof';
const passwordEnvironmentName = 'GOLDWALLET_PROOF_KEYSTORE_PASSWORD';
const keytoolCommand = process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool')
  : 'keytool';

const run = (label, command, args, env) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, { cwd: root, env, encoding: 'utf8', stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.error?.message || `exit ${result.status}`}`);
  }
};

try {
  mkdirSync(outputDir, { recursive: true });
  rmSync(proofKeystore, { force: true });
  const passwordEnv = { ...process.env, [passwordEnvironmentName]: password };
  run('generate temporary upload-signing proof key', keytoolCommand, [
    '-genkeypair',
    '-v',
    '-keystore',
    proofKeystore,
    '-storetype',
    'PKCS12',
    '-storepass:env',
    passwordEnvironmentName,
    '-keypass:env',
    passwordEnvironmentName,
    '-alias',
    alias,
    '-keyalg',
    'RSA',
    '-keysize',
    '4096',
    '-sigalg',
    'SHA256withRSA',
    '-validity',
    '3650',
    '-dname',
    'CN=GoldWallet Local Signing Proof, OU=Engineering, O=CloudBest, C=PL',
    '-noprompt',
  ], passwordEnv);

  run('execute production signing path with local proof key', process.execPath, [
    'scripts/runAndroidSignedBundle.mjs',
    '--local-proof',
  ], {
    ...process.env,
    GOLDWALLET_UPLOAD_STORE_FILE: proofKeystore,
    GOLDWALLET_UPLOAD_STORE_PASSWORD: password,
    GOLDWALLET_UPLOAD_KEY_ALIAS: alias,
    GOLDWALLET_UPLOAD_KEY_PASSWORD: password,
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  rmSync(proofKeystore, { force: true });
}
