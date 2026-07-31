import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import { getAndroidAppBundleProjectMetadata } from './androidAppBundleValidation.mjs';
import {
  getAndroid16KbRuntimeProofConfig,
  getAndroid16KbRuntimeProofSummaryErrors,
} from './android16KbRuntimeProofSummary.mjs';
import { getLineValue } from './androidSmokeSummaryGuard.mjs';
import {
  getSentryAndroidCandidateEvidenceConfig,
  getSentryAndroidCandidateEvidenceErrors,
  parseSentryAndroidCandidateEvidenceManifest,
} from './sentryAndroidCandidateEvidence.mjs';
import {
  getSentryAndroidCanaryProjectEndpoint,
  getSentryAndroidCanaryProjectIdentityErrors,
  getSentryAndroidCanarySummaryErrors,
  getSentryAndroidCanaryUploadEvidence,
  getSentryAndroidCanaryUploadArgs,
  getSentryAndroidUploadCanaryConfig,
  prepareSentryAndroidCanaryArtifacts,
  renderSentryAndroidCanaryCommand,
  renderSentryAndroidCanarySummary,
} from './sentryAndroidUploadCanary.mjs';
import { resolveSentryManagedCredential } from './sentryManagedCredential.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execute = process.argv.slice(2).includes('--execute');
const unknownArgs = process.argv.slice(2).filter(arg => arg !== '--execute');
const cliPath = path.join(root, 'node_modules', '@sentry', 'cli', 'bin', 'sentry-cli');

const runCli = (label, args, env) => {
  console.log(`\n> ${label}`);
  const invocation = { command: process.execPath, args: [cliPath, ...args] };
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: root,
    env,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  const token = env.SENTRY_AUTH_TOKEN || '';
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const safeOutput = token ? output.replaceAll(token, '[REDACTED]') : output;
  if (result.error || result.status !== 0) {
    if (safeOutput) process.stderr.write(safeOutput);
    throw new Error(`${label} failed with exit ${result.status ?? 'spawn-error'}; credential redacted`);
  }
  if (safeOutput) process.stdout.write(safeOutput);
  return safeOutput;
};

try {
  if (unknownArgs.length > 0) throw new Error(`Unsupported argument(s): ${unknownArgs.join(', ')}`);
  const proofConfig = getAndroid16KbRuntimeProofConfig(root);
  if (!existsSync(proofConfig.summaryPath)) {
    throw new Error('Android 16 KB runtime proof is missing; run android:16kb:runtime:verify first');
  }
  const proofSummary = readFileSync(proofConfig.summaryPath, 'utf8');
  const proofErrors = getAndroid16KbRuntimeProofSummaryErrors({ summary: proofSummary, config: proofConfig });
  if (proofErrors.length > 0) throw new Error(`Android 16 KB runtime proof is stale: ${proofErrors.join('; ')}`);

  const aabPath = getLineValue(proofSummary, 'Signed AAB path');
  const candidateConfig = getSentryAndroidCandidateEvidenceConfig(root, {
    aabPath,
    artifactBase: 'android-upload-signing-proof-prod-release-sentry',
  });
  const manifestContent = readFileSync(candidateConfig.manifestPath, 'utf8');
  const evidence = parseSentryAndroidCandidateEvidenceManifest(manifestContent, candidateConfig);
  const evidenceErrors = getSentryAndroidCandidateEvidenceErrors({
    manifestContent,
    config: candidateConfig,
    metadata: getAndroidAppBundleProjectMetadata(root),
    candidateType: 'local-signing-proof',
    generatedReactOutputsCleaned: true,
    sentryAutoUploadDisabled: true,
    sentryUploadAttempted: false,
    secretValuesPrinted: false,
  });
  if (evidenceErrors.length > 0)
    throw new Error(`Sentry Android candidate evidence is stale: ${evidenceErrors.join('; ')}`);

  const config = getSentryAndroidUploadCanaryConfig({ root, evidence });
  const artifacts = prepareSentryAndroidCanaryArtifacts(config);
  const uploadArgs = getSentryAndroidCanaryUploadArgs(config);
  console.log(`Sentry canary upload command: ${renderSentryAndroidCanaryCommand('sentry-cli', uploadArgs)}`);
  console.log('Sentry credential value printed: no');

  let uploadEvidence = null;
  let projectIdentityVerified = false;
  if (execute) {
    const credential = resolveSentryManagedCredential();
    const childEnv = { ...process.env, SENTRY_AUTH_TOKEN: credential.token };
    const projectResponse = await fetch(getSentryAndroidCanaryProjectEndpoint(config), {
      headers: { Authorization: `Bearer ${credential.token}` },
    });
    if (!projectResponse.ok)
      throw new Error(`Unable to verify Sentry canary project identity: HTTP ${projectResponse.status}`);
    const projectIdentityErrors = getSentryAndroidCanaryProjectIdentityErrors({
      project: await projectResponse.json(),
      config,
    });
    if (projectIdentityErrors.length > 0) {
      throw new Error(`Sentry canary project identity is invalid: ${projectIdentityErrors.join('; ')}`);
    }
    projectIdentityVerified = true;
    rmSync(config.summaryPath, { force: true });
    const uploadOutput = runCli('upload exact-candidate Android bundle and source map canary', uploadArgs, childEnv);
    uploadEvidence = getSentryAndroidCanaryUploadEvidence({ output: uploadOutput, config });
    if (!uploadEvidence.passed)
      throw new Error(`Sentry canary upload evidence is invalid: ${uploadEvidence.errors.join('; ')}`);
  }

  const summary = renderSentryAndroidCanarySummary({
    config,
    artifacts,
    executed: execute,
    uploadEvidence,
    projectIdentityVerified,
  });
  const summaryErrors = getSentryAndroidCanarySummaryErrors({
    summary,
    config,
    artifacts,
    executed: execute,
    uploadEvidence,
    projectIdentityVerified,
  });
  if (summaryErrors.length > 0)
    throw new Error(`Sentry Android canary summary is invalid: ${summaryErrors.join('; ')}`);
  const summaryPath = execute ? config.summaryPath : config.dryRunSummaryPath;
  writeFileSync(summaryPath, summary);
  console.log(`Sentry Android canary summary written to ${path.relative(root, summaryPath)}`);
  console.log(
    execute
      ? 'Sentry Android source-map transport canary passed.'
      : 'Dry run only; no Sentry release or files were written.',
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
