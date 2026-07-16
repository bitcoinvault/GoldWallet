import { createHash } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import {
  BUNDLETOOL_SHA256,
  BUNDLETOOL_VERSION,
  getAndroidAppBundleProjectMetadata,
  getAndroidAppBundleVariantConfig,
} from './androidAppBundleValidation.mjs';
import { requireAndroidReleaseCandidateReadiness } from './androidReleaseVersioning.mjs';
import { resolveAndroidUploadSigningConfiguration } from './androidUploadSigningReadiness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localProof = process.argv.includes('--local-proof');
const config = getAndroidAppBundleVariantConfig(root, 'prod');
const resolved = resolveAndroidUploadSigningConfiguration({ root });
const { safe, credentials } = resolved;
const outputDir = path.join(root, 'local-docs');
const outputAab = path.join(
  outputDir,
  localProof ? 'android-upload-signing-proof-prod-release.aab' : 'android-prod-signed-bundle.aab',
);
const summaryPath = path.join(
  outputDir,
  localProof ? 'android-upload-signing-proof-summary.txt' : 'android-prod-signed-bundle-summary.txt',
);
const javaHome = process.env.JAVA_HOME;
const javaBin = executable =>
  javaHome ? path.join(javaHome, 'bin', `${executable}${process.platform === 'win32' ? '.exe' : ''}`) : executable;
const keytoolCommand = javaBin('keytool');
const jarsignerCommand = javaBin('jarsigner');
const javaCommand = javaBin('java');
const bundletoolJar =
  process.env.BUNDLETOOL_JAR || path.join(outputDir, 'tools', `bundletool-all-${BUNDLETOOL_VERSION}.jar`);
const passwordEnvironmentName = 'GOLDWALLET_SIGNED_BUNDLE_STORE_PASSWORD';
const hashFile = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

const run = (label, command, args, options = {}) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    env: options.env || process.env,
    shell: process.platform === 'win32' && /\.(bat|cmd)$/i.test(command),
    stdio: options.capture ? 'pipe' : 'inherit',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    if (options.capture) {
      process.stdout.write(result.stdout || '');
      process.stderr.write(result.stderr || '');
    }
    throw new Error(`${label} failed: ${result.error?.message || `exit ${result.status}`}`);
  }
  return `${result.stdout || ''}${result.stderr || ''}`;
};

const certificateSha256 = output => output.match(/SHA256:\s*([A-F0-9:]+)/i)?.[1]?.replaceAll(':', '').toLowerCase();

try {
  if (!safe.ready) {
    throw new Error(
      `Android upload signing is not ready (${safe.state}). Run corepack yarn android:upload-signing:audit for the required action.`,
    );
  }

  mkdirSync(outputDir, { recursive: true });
  run(
    'require Android upload signing readiness',
    process.execPath,
    [
      'scripts/auditAndroidUploadSigningReadiness.mjs',
      '--require-ready',
      ...(localProof ? ['--no-summary'] : []),
    ],
  );
  const releaseReadiness = localProof ? null : requireAndroidReleaseCandidateReadiness({ root });

  rmSync(config.aabPath, { force: true });
  rmSync(outputAab, { force: true });
  run('build guarded signed prodRelease AAB', process.execPath, [
    'scripts/runAndroidGradle.mjs',
    config.gradleTask,
    '-PgoldwalletRequireUploadSigning=true',
  ], {
    env: { ...process.env, SENTRY_DISABLE_AUTO_UPLOAD: process.env.SENTRY_DISABLE_AUTO_UPLOAD || 'true' },
  });

  if (!existsSync(config.aabPath) || statSync(config.aabPath).size === 0) {
    throw new Error(`Signed prodRelease AAB is missing: ${config.aabPath}`);
  }
  copyFileSync(config.aabPath, outputAab);

  const signatureOutput = run('verify AAB JAR signature', jarsignerCommand, ['-verify', '-verbose', '-certs', outputAab], {
    capture: true,
  });
  if (!/jar verified\./i.test(signatureOutput)) throw new Error('jarsigner did not confirm a verified AAB signature');

  const keytoolEnvironment = { ...process.env, [passwordEnvironmentName]: credentials.storePassword };
  const keystoreCertificateOutput = run('inspect configured upload certificate', keytoolCommand, [
    '-list',
    '-v',
    '-keystore',
    safe.storeFilePath,
    '-alias',
    credentials.keyAlias,
    '-storepass:env',
    passwordEnvironmentName,
  ], { capture: true, env: keytoolEnvironment });
  const aabCertificateOutput = run('inspect AAB signing certificate', keytoolCommand, ['-printcert', '-jarfile', outputAab], {
    capture: true,
  });
  const configuredCertificateSha256 = certificateSha256(keystoreCertificateOutput);
  const aabCertificateSha256 = certificateSha256(aabCertificateOutput);
  if (!configuredCertificateSha256 || !aabCertificateSha256 || configuredCertificateSha256 !== aabCertificateSha256) {
    throw new Error('Signed AAB certificate does not match the configured upload-key alias');
  }
  if (localProof && !aabCertificateOutput.includes('CN=GoldWallet Local Signing Proof')) {
    throw new Error('AAB signing certificate does not match the local proof identity');
  }

  if (!existsSync(bundletoolJar) || hashFile(bundletoolJar) !== BUNDLETOOL_SHA256) {
    throw new Error(`Official bundletool ${BUNDLETOOL_VERSION} is missing or has an unexpected SHA-256`);
  }
  run('validate signed AAB with bundletool', javaCommand, ['-jar', bundletoolJar, 'validate', `--bundle=${outputAab}`], {
    capture: true,
  });
  const builtMetadata = getAndroidAppBundleProjectMetadata(root);
  const manifestOutput = run('inspect signed AAB manifest metadata', javaCommand, [
    '-jar',
    bundletoolJar,
    'dump',
    'manifest',
    `--bundle=${outputAab}`,
    '--module=base',
  ], { capture: true });
  const builtVersionCode = manifestOutput.match(/android:versionCode="(\d+)"/)?.[1];
  const builtVersionName = manifestOutput.match(/android:versionName="([^"]+)"/)?.[1];
  if (builtVersionCode !== builtMetadata.versionCode || builtVersionName !== builtMetadata.versionName) {
    throw new Error(
      `Signed AAB version metadata mismatch: expected ${builtMetadata.versionName} (${builtMetadata.versionCode}), received ${builtVersionName || 'missing'} (${builtVersionCode || 'missing'})`,
    );
  }

  const summary = [
    localProof ? 'Android upload signing local proof' : 'Android production signed bundle evidence',
    'Variant: prodRelease',
    'Gradle signing requirement: enforced',
    'Configured alias certificate match: passed',
    'AAB JAR signature: verified',
    'Bundle validation: passed',
    `Version code: ${builtMetadata.versionCode}`,
    `Version name: ${builtMetadata.versionName}`,
    'AAB version metadata match: passed',
    `AAB bytes: ${statSync(outputAab).size}`,
    `AAB SHA-256: ${hashFile(outputAab)}`,
    `Certificate SHA-256: ${aabCertificateSha256}`,
    ...(localProof ? ['Certificate identity: GoldWallet Local Signing Proof'] : []),
    ...(localProof ? ['Temporary keystore retained: no'] : []),
    `Production upload key used: ${localProof ? 'no' : 'yes'}`,
    `Production release version ready: ${localProof ? 'not-required-for-local-proof' : releaseReadiness.ready ? 'yes' : 'no'}`,
    'Production Play upload readiness: not claimed',
    'Sentry upload: independently gated',
    'Secret values printed: no',
    '',
  ].join('\n');
  writeFileSync(summaryPath, summary);
  console.log(`\n${summary}`);
  console.log(`Signed bundle summary written to ${summaryPath}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
