import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { TraceMap, eachMapping } from '@jridgewell/trace-mapping';

import { getAndroidAppBundleProjectMetadata } from './androidAppBundleValidation.mjs';
import { getSentryGradleDevUploadCanaryConfig } from './sentryGradleDevUploadCanary.mjs';
import { resolveSentryManagedCredential } from './sentryManagedCredential.mjs';
import {
  SENTRY_ANDROID_CANARY_ORG,
  SENTRY_ANDROID_CANARY_PROJECT,
  SENTRY_ANDROID_CANARY_PROJECT_ID,
  getSentryAndroidCanaryProjectEndpoint,
  getSentryAndroidCanaryProjectIdentityErrors,
} from './sentryAndroidUploadCanary.mjs';
import {
  SENTRY_EVENT_CANARY_ENVIRONMENT,
  SENTRY_EVENT_CANARY_TAG,
  SENTRY_EVENT_CANARY_WALLET_DATA_TAG,
  getExecutedGradleCanaryEvidence,
  getSentryDsnConfig,
  getSentryEventSymbolicationEvidence,
  invalidateSentryEventCanaryEvidence,
  renderSentryEventEnvelope,
  renderSentryEventSymbolicationSummary,
  selectSymbolicationMapping,
} from './sentryEventSymbolicationCanary.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execute = process.argv.slice(2).includes('--execute');
const unknownArgs = process.argv.slice(2).filter(arg => arg !== '--execute');
const summaryPath = path.join(root, 'local-docs', 'sentry-event-symbolication-canary-summary.txt');
const dryRunSummaryPath = path.join(root, 'local-docs', 'sentry-event-symbolication-canary-dry-run-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const getEnvValue = (content, key) =>
  content
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(line => line.startsWith(`${key}=`))
    ?.slice(key.length + 1)
    .trim();

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

try {
  if (unknownArgs.length > 0) throw new Error(`Unsupported argument(s): ${unknownArgs.join(', ')}`);
  const outputPath = invalidateSentryEventCanaryEvidence({
    execute,
    summaryPath,
    dryRunSummaryPath,
    remove: rmSync,
  });

  const gradleConfig = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: getAndroidAppBundleProjectMetadata(root),
  });
  const canary = getExecutedGradleCanaryEvidence(read('local-docs/sentry-gradle-dev-upload-canary-summary.txt'));
  if (canary.errors.length > 0) throw new Error(canary.errors.join('; '));
  if (canary.release !== gradleConfig.release || canary.inputIdentity !== gradleConfig.identity) {
    throw new Error('Executed Gradle canary evidence does not match current symbolication inputs');
  }

  const packagerMap = JSON.parse(
    read('android/app/build/intermediates/sourcemaps/react/devRelease/index.android.bundle.packager.map'),
  );
  if (packagerMap.debugId !== canary.debugId || packagerMap.debug_id !== canary.debugId) {
    throw new Error('Current Metro packager map does not match the uploaded canary debug ID');
  }
  const hermesMap = JSON.parse(
    read('android/app/build/generated/sourcemaps/react/devRelease/index.android.bundle.map'),
  );
  const mappings = [];
  eachMapping(new TraceMap(hermesMap), mapping => mappings.push(mapping));
  const mapping = selectSymbolicationMapping(mappings);
  const bundlePath = path.join(
    root,
    'android',
    'app',
    'build',
    'generated',
    'assets',
    'react',
    'devRelease',
    'index.android.bundle',
  );
  if (!existsSync(bundlePath) || !readFileSync(bundlePath).includes(Buffer.from(canary.debugId))) {
    throw new Error('Current devRelease bundle does not contain the uploaded canary debug ID');
  }

  let eventId = null;
  let evidence = null;
  if (execute) {
    const credential = resolveSentryManagedCredential();
    const projectConfig = {
      org: SENTRY_ANDROID_CANARY_ORG,
      project: SENTRY_ANDROID_CANARY_PROJECT,
      projectId: SENTRY_ANDROID_CANARY_PROJECT_ID,
    };
    const projectResponse = await fetch(getSentryAndroidCanaryProjectEndpoint(projectConfig), {
      headers: { Authorization: `Bearer ${credential.token}` },
    });
    if (!projectResponse.ok) throw new Error(`Unable to verify Sentry dev project: HTTP ${projectResponse.status}`);
    const projectErrors = getSentryAndroidCanaryProjectIdentityErrors({
      project: await projectResponse.json(),
      config: projectConfig,
    });
    if (projectErrors.length > 0) throw new Error(projectErrors.join('; '));

    const dsn = getEnvValue(read('.env.dev.testnet'), 'SENTRY_DSN_ANDROID');
    const dsnConfig = getSentryDsnConfig(dsn, SENTRY_ANDROID_CANARY_PROJECT_ID);
    eventId = randomUUID().replaceAll('-', '');
    const event = {
      event_id: eventId,
      timestamp: Date.now() / 1000,
      platform: 'javascript',
      level: 'error',
      logger: 'goldwallet.symbolication-canary',
      // A neutral sentinel prevents Relay from deriving the sender IP while carrying no identifying value.
      user: { ip_address: '0.0.0.0' },
      environment: SENTRY_EVENT_CANARY_ENVIRONMENT,
      release: canary.release,
      dist: canary.dist,
      exception: {
        values: [
          {
            type: 'GoldWalletSymbolicationCanary',
            value: 'Synthetic non-production source-map validation event',
            stacktrace: {
              frames: [
                {
                  filename: 'index.android.bundle',
                  abs_path: 'app:///index.android.bundle',
                  function: 'goldwalletSentrySymbolicationCanary',
                  lineno: mapping.generatedLine,
                  // Sentry event columns are 1-based; source-map generated columns are 0-based.
                  colno: mapping.generatedColumn + 1,
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      debug_meta: {
        images: [
          {
            type: 'sourcemap',
            code_file: 'app:///index.android.bundle',
            debug_id: canary.debugId,
          },
        ],
      },
      tags: {
        'goldwallet.canary': SENTRY_EVENT_CANARY_TAG,
        'goldwallet.wallet_data': SENTRY_EVENT_CANARY_WALLET_DATA_TAG,
      },
      sdk: { name: 'goldwallet.codex.symbolication-canary', version: '1.0.0' },
    };
    const ingestResponse = await fetch(dsnConfig.envelopeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsnConfig.publicKey}, sentry_client=goldwallet-symbolication-canary/1.0.0`,
      },
      body: renderSentryEventEnvelope({ dsn, event }),
    });
    if (!ingestResponse.ok) throw new Error(`Sentry event ingest failed: HTTP ${ingestResponse.status}`);

    const eventEndpoint = `https://sentry.io/api/0/projects/${SENTRY_ANDROID_CANARY_ORG}/${SENTRY_ANDROID_CANARY_PROJECT}/events/${eventId}/`;
    for (let attempt = 1; attempt <= 30; attempt += 1) {
      await wait(2000);
      const eventResponse = await fetch(eventEndpoint, {
        headers: { Authorization: `Bearer ${credential.token}` },
      });
      if (eventResponse.status === 404) continue;
      if (!eventResponse.ok) throw new Error(`Unable to read processed Sentry event: HTTP ${eventResponse.status}`);
      const processedEvent = await eventResponse.json();
      evidence = getSentryEventSymbolicationEvidence({
        event: processedEvent,
        expected: {
          eventId,
          projectId: SENTRY_ANDROID_CANARY_PROJECT_ID,
          release: canary.release,
          dist: canary.dist,
          source: 'App.tsx',
          originalLine: mapping.originalLine,
        },
      });
      if (evidence.passed) break;
    }
    if (!evidence?.passed) {
      throw new Error(`Sentry event was not symbolicated: ${evidence?.errors.join('; ') || 'event not indexed'}`);
    }
  }

  const summary = renderSentryEventSymbolicationSummary({ canary, mapping, executed: execute, eventId, evidence });
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, summary);
  console.log(`Sentry event symbolication summary written to ${path.relative(root, outputPath)}`);
  console.log(
    execute ? 'Sentry non-production event symbolication canary passed.' : 'Dry run only; no Sentry event was sent.',
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
