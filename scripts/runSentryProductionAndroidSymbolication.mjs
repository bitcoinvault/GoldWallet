import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import { TraceMap, eachMapping } from '@jridgewell/trace-mapping';

import { getAndroidAppBundleProjectMetadata } from './androidAppBundleValidation.mjs';
import { assertAndroidPlayRunLockOwnership, resolveAndroidPlaySharedPaths } from './androidPlayCandidateArtifact.mjs';
import { getSentryAndroidCanaryUploadEvidence } from './sentryAndroidUploadCanary.mjs';
import {
  getSentryAndroidCandidateEvidenceConfig,
  getSentryAndroidCandidateEvidenceErrors,
  parseSentryAndroidCandidateEvidenceManifest,
} from './sentryAndroidCandidateEvidence.mjs';
import {
  getSentryDsnConfig,
  renderSentryEventEnvelope,
  selectSymbolicationMapping,
} from './sentryEventSymbolicationCanary.mjs';
import { resolveSentryManagedCredential } from './sentryManagedCredential.mjs';
import {
  SENTRY_PRODUCTION_ANDROID_ENVIRONMENT,
  SENTRY_PRODUCTION_ANDROID_TAG,
  SENTRY_PRODUCTION_ANDROID_WALLET_DATA_TAG,
  getProductionSymbolicationEvidence,
  getReferenceProductionEventErrors,
  getSentryProductionAndroidConfig,
  getSentryProductionCliEnvironment,
  getSentryProductionAndroidProjectErrors,
  getSentryProductionAndroidUploadArgs,
  getSourceMapDebugEvidence,
  prepareSentryProductionAndroidArtifacts,
  parseSentryProductionAndroidArgs,
  pollSentryProductionDiagnostics,
  renderSentryProductionAndroidSummary,
} from './sentryProductionAndroidSymbolication.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const getEnvValue = (content, key) =>
  content
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(line => line.startsWith(`${key}=`))
    ?.slice(key.length + 1)
    .trim();

const runCli = ({ cliPath, uploadArgs, token, config }) => {
  const result = spawnSync(process.execPath, [cliPath, ...uploadArgs], {
    cwd: root,
    env: getSentryProductionCliEnvironment({ env: process.env, token, config }),
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const safeOutput = token ? output.replaceAll(token, '[REDACTED]') : output;
  if (result.error || result.status !== 0) {
    if (safeOutput) process.stderr.write(safeOutput);
    throw new Error(`Sentry production Android upload failed with exit ${result.status ?? 'spawn-error'}`);
  }
  if (safeOutput) process.stdout.write(safeOutput);
  return safeOutput;
};

const fetchJson = async ({ url, token, label }) => {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`${label} failed: HTTP ${response.status}`);
  return response.json();
};

try {
  const { execute, releaseGate, referenceEventId, expectedAabSha256 } = parseSentryProductionAndroidArgs(args);
  if (releaseGate) {
    assertAndroidPlayRunLockOwnership({
      lockPath: resolveAndroidPlaySharedPaths(root).runLockPath,
      token: process.env.GOLDWALLET_PLAY_LOCK_TOKEN,
    });
  }
  const metadata = getAndroidAppBundleProjectMetadata(root);
  const defaultConfig = getSentryProductionAndroidConfig({ root, metadata });
  const baseConfig = releaseGate
    ? { ...defaultConfig, aabPath: path.join(root, 'local-docs', 'android-prod-signed-bundle.aab') }
    : defaultConfig;
  const candidateConfig = getSentryAndroidCandidateEvidenceConfig(root, {
    aabPath: baseConfig.aabPath,
    artifactBase: releaseGate
      ? 'android-prod-signed-bundle-sentry'
      : 'android-upload-signing-proof-prod-release-sentry',
  });
  if (!existsSync(candidateConfig.manifestPath)) {
    throw new Error('Fresh candidate-bound Sentry manifest is missing; run android:upload-signing:proof first');
  }
  const manifestContent = readFileSync(candidateConfig.manifestPath, 'utf8');
  const candidateErrors = getSentryAndroidCandidateEvidenceErrors({
    manifestContent,
    config: candidateConfig,
    metadata,
    candidateType: releaseGate ? 'production-signed-candidate' : 'local-signing-proof',
    generatedReactOutputsCleaned: true,
    sentryAutoUploadDisabled: true,
    sentryUploadAttempted: false,
    secretValuesPrinted: false,
  });
  if (candidateErrors.length > 0) {
    throw new Error(`Candidate-bound Sentry evidence is invalid: ${candidateErrors.join('; ')}`);
  }
  const candidate = parseSentryAndroidCandidateEvidenceManifest(manifestContent, candidateConfig);
  const config = {
    ...baseConfig,
    bundlePath: candidate.generatedBundle.path,
    sourceMapPath: candidate.sourceMap.path,
  };
  const outputPath = releaseGate
    ? config.releaseGateSummaryPath
    : execute
      ? config.summaryPath
      : config.dryRunSummaryPath;
  rmSync(outputPath, { force: true });

  const javaHome = process.env.JAVA_HOME;
  if (!javaHome) throw new Error('JAVA_HOME must point to JDK 17 for exact AAB inspection');
  const jarCommand = path.join(javaHome, 'bin', process.platform === 'win32' ? 'jar.exe' : 'jar');
  if (!existsSync(jarCommand)) throw new Error(`JDK jar executable is missing: ${jarCommand}`);
  const artifacts = {
    ...prepareSentryProductionAndroidArtifacts({ config, jarCommand }),
    candidateIdentity: candidate.candidateIdentity,
    candidateManifestSha256: createHash('sha256').update(manifestContent).digest('hex'),
  };
  if (releaseGate && artifacts.aabSha256 !== expectedAabSha256) {
    throw new Error('Production Sentry release gate AAB digest does not match the immutable Play candidate');
  }
  const map = JSON.parse(readFileSync(config.uploadSourceMapPath, 'utf8'));
  const mappings = [];
  eachMapping(new TraceMap(map), mapping => mappings.push(mapping));
  const mapping = selectSymbolicationMapping(mappings);
  const uploadArgs = getSentryProductionAndroidUploadArgs({ config, artifacts });

  console.log(`Production Android release: ${config.release}`);
  console.log(`Production Android dist: ${config.dist}`);
  console.log(`Production Android debug ID: ${artifacts.debugId}`);
  console.log(
    `Generated/AAB-embedded bundle match: ${artifacts.sourceBundleSha256 === artifacts.embeddedBundleSha256 ? 'yes' : 'no'}`,
  );
  console.log('Sentry credential value printed: no');

  let beforeDebug = null;
  let afterDebug = null;
  let uploadEvidence = null;
  let uploadAttempted = false;
  let syntheticEventId = null;
  let symbolicationEvidence = null;
  if (execute) {
    const credential = resolveSentryManagedCredential();
    const apiRoot = `https://sentry.io/api/0/projects/${config.org}/${config.project}`;
    const project = await fetchJson({ url: `${apiRoot}/`, token: credential.token, label: 'Sentry project lookup' });
    const projectErrors = getSentryProductionAndroidProjectErrors(project);
    if (projectErrors.length > 0) throw new Error(projectErrors.join('; '));

    if (releaseGate) {
      const cliPath = path.join(root, 'node_modules', '@sentry', 'cli', 'bin', 'sentry-cli');
      const output = runCli({ cliPath, uploadArgs, token: credential.token, config });
      uploadAttempted = true;
      uploadEvidence = getSentryAndroidCanaryUploadEvidence({
        output,
        config: { ...config, canaryRelease: config.release, debugId: artifacts.debugId },
      });
      if (!uploadEvidence.passed) throw new Error(uploadEvidence.errors.join('; '));
    } else {
      const referenceEvent = await fetchJson({
        url: `${apiRoot}/events/${referenceEventId}/`,
        token: credential.token,
        label: 'Sentry production reference event lookup',
      });
      const referenceErrors = getReferenceProductionEventErrors({
        event: referenceEvent,
        expected: {
          eventId: referenceEventId,
          projectId: config.projectId,
          release: config.release,
          dist: config.dist,
          debugId: artifacts.debugId,
        },
      });
      if (referenceErrors.length > 0) throw new Error(referenceErrors.join('; '));
      beforeDebug = getSourceMapDebugEvidence({
        response: await fetchJson({
          url: `${apiRoot}/events/${referenceEventId}/source-map-debug/`,
          token: credential.token,
          label: 'Sentry pre-upload source-map debug lookup',
        }),
        debugId: artifacts.debugId,
      });
      if (!beforeDebug.hasDebugIds || !beforeDebug.matchingDebugId) {
        throw new Error('Reference event source-map diagnostics do not contain the expected production debug ID');
      }
      if (beforeDebug.sourceFilePresent !== beforeDebug.sourceMapPresent) {
        throw new Error(
          'Reference event has only one matching production source-map artifact; refusing partial recovery',
        );
      }
      if (beforeDebug.sourceFilePresent && beforeDebug.sourceMapPresent) {
        afterDebug = beforeDebug;
        console.log('Exact production source-map artifacts already exist; continuing in verification-only mode.');
      } else {
        const cliPath = path.join(root, 'node_modules', '@sentry', 'cli', 'bin', 'sentry-cli');
        const output = runCli({ cliPath, uploadArgs, token: credential.token, config });
        uploadAttempted = true;
        uploadEvidence = getSentryAndroidCanaryUploadEvidence({
          output,
          config: { ...config, canaryRelease: config.release, debugId: artifacts.debugId },
        });
        if (!uploadEvidence.passed) throw new Error(uploadEvidence.errors.join('; '));
        afterDebug = getSourceMapDebugEvidence({
          response: await fetchJson({
            url: `${apiRoot}/events/${referenceEventId}/source-map-debug/`,
            token: credential.token,
            label: 'Sentry post-upload source-map debug lookup',
          }),
          debugId: artifacts.debugId,
        });
      }
      if (!afterDebug.matchingDebugId || !afterDebug.sourceFilePresent || !afterDebug.sourceMapPresent) {
        throw new Error('Sentry source-map debug API did not bind both uploaded artifacts to the production debug ID');
      }
    }
    mkdirSync(path.dirname(config.checkpointPath), { recursive: true });
    writeFileSync(
      config.checkpointPath,
      renderSentryProductionAndroidSummary({
        config,
        artifacts,
        executed: true,
        referenceEventId,
        beforeDebug,
        afterDebug,
        uploadEvidence,
        uploadAttempted,
        operation: releaseGate ? 'release-gate' : 'recovery',
      }),
    );

    const envPath = path.join(root, '.env.prod.mainnet');
    const dsn = getEnvValue(readFileSync(envPath, 'utf8'), 'SENTRY_DSN_ANDROID');
    const dsnConfig = getSentryDsnConfig(dsn, config.projectId);
    syntheticEventId = randomUUID().replaceAll('-', '');
    const event = {
      event_id: syntheticEventId,
      timestamp: Date.now() / 1000,
      platform: 'javascript',
      level: 'error',
      logger: 'goldwallet.production-symbolication-canary',
      user: { ip_address: '0.0.0.0' },
      environment: SENTRY_PRODUCTION_ANDROID_ENVIRONMENT,
      release: config.release,
      dist: config.dist,
      exception: {
        values: [
          {
            type: 'GoldWalletProductionSymbolicationCanary',
            value: 'Synthetic production Android source-map validation event',
            stacktrace: {
              frames: [
                {
                  filename: 'index.android.bundle',
                  abs_path: 'app:///index.android.bundle',
                  function: 'goldwalletProductionSymbolicationCanary',
                  lineno: mapping.generatedLine,
                  colno: mapping.generatedColumn + 1,
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      debug_meta: {
        images: [{ type: 'sourcemap', code_file: 'app:///index.android.bundle', debug_id: artifacts.debugId }],
      },
      tags: {
        'goldwallet.canary': SENTRY_PRODUCTION_ANDROID_TAG,
        'goldwallet.wallet_data': SENTRY_PRODUCTION_ANDROID_WALLET_DATA_TAG,
      },
      sdk: { name: 'goldwallet.codex.production-symbolication-canary', version: '1.0.0' },
    };
    const ingestResponse = await fetch(dsnConfig.envelopeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsnConfig.publicKey}, sentry_client=goldwallet-production-symbolication-canary/1.0.0`,
      },
      body: renderSentryEventEnvelope({ dsn, event }),
    });
    if (!ingestResponse.ok) throw new Error(`Sentry production canary ingest failed: HTTP ${ingestResponse.status}`);

    for (let attempt = 1; attempt <= 30; attempt += 1) {
      await wait(2000);
      const response = await fetch(`${apiRoot}/events/${syntheticEventId}/`, {
        headers: { Authorization: `Bearer ${credential.token}` },
      });
      if (response.status === 404) continue;
      if (!response.ok) throw new Error(`Sentry production canary lookup failed: HTTP ${response.status}`);
      symbolicationEvidence = getProductionSymbolicationEvidence({
        event: await response.json(),
        expected: {
          eventId: syntheticEventId,
          projectId: config.projectId,
          release: config.release,
          dist: config.dist,
          source: 'App.tsx',
          originalLine: mapping.originalLine,
        },
      });
      if (symbolicationEvidence.passed) break;
    }
    if (!symbolicationEvidence?.passed) {
      throw new Error(
        `Production Sentry event was not symbolicated: ${symbolicationEvidence?.errors.join('; ') || 'event not indexed'}`,
      );
    }
    if (releaseGate) {
      afterDebug = await pollSentryProductionDiagnostics({
        fetchResponse: () =>
          fetch(`${apiRoot}/events/${syntheticEventId}/source-map-debug/`, {
            headers: { Authorization: `Bearer ${credential.token}` },
          }),
        toEvidence: response => getSourceMapDebugEvidence({ response, debugId: artifacts.debugId }),
        isComplete: evidence =>
          evidence.hasDebugIds &&
          evidence.matchingDebugId &&
          evidence.artifactBundlePresent &&
          evidence.sourceFilePresent &&
          evidence.sourceMapPresent,
        wait,
      });
      if (
        !afterDebug.hasDebugIds ||
        !afterDebug.matchingDebugId ||
        !afterDebug.artifactBundlePresent ||
        !afterDebug.sourceFilePresent ||
        !afterDebug.sourceMapPresent
      ) {
        throw new Error('Sentry release gate did not bind both production artifacts to the synthetic event debug ID');
      }
    }
  }

  const summary = renderSentryProductionAndroidSummary({
    config,
    artifacts,
    executed: execute,
    referenceEventId,
    beforeDebug,
    afterDebug,
    uploadEvidence,
    uploadAttempted,
    syntheticEventId,
    symbolicationEvidence,
    operation: releaseGate ? 'release-gate' : 'recovery',
  });
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, summary);
  console.log(`Sentry production Android summary written to ${path.relative(root, outputPath)}`);
  console.log(
    execute
      ? 'Sentry production Android upload and event symbolication passed.'
      : 'Dry run only; no Sentry files or events were written.',
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
