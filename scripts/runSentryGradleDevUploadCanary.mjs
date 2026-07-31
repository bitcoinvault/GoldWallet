import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import { getAndroidAppBundleProjectMetadata } from './androidAppBundleValidation.mjs';
import { writeSentryPropertiesFiles } from './createSentryProperties.mjs';
import {
  SENTRY_ANDROID_CANARY_ORG,
  SENTRY_ANDROID_CANARY_PROJECT,
  SENTRY_ANDROID_CANARY_PROJECT_ID,
  getSentryAndroidCanaryProjectEndpoint,
  getSentryAndroidCanaryProjectIdentityErrors,
} from './sentryAndroidUploadCanary.mjs';
import {
  getSentryGradleDevUploadCanaryConfig,
  getSentryGradleDevUploadEvidence,
  redactSentryGradleCanaryOutput,
  renderSentryGradleDevUploadSummary,
} from './sentryGradleDevUploadCanary.mjs';
import { resolveSentryManagedCredential } from './sentryManagedCredential.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execute = process.argv.slice(2).includes('--execute');
const unknownArgs = process.argv.slice(2).filter(arg => arg !== '--execute');

try {
  if (unknownArgs.length > 0) throw new Error(`Unsupported argument(s): ${unknownArgs.join(', ')}`);
  const config = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: getAndroidAppBundleProjectMetadata(root),
  });
  if (execute) rmSync(config.summaryPath, { force: true });
  console.log(`Sentry Gradle canary release: ${config.release}`);
  console.log('Sentry Gradle canary project: goldwallet-dev-android (5875208)');
  console.log('Sentry credential value printed: no');

  let projectIdentityVerified = false;
  let evidence = null;
  if (execute) {
    const credential = resolveSentryManagedCredential();
    const projectConfig = {
      org: SENTRY_ANDROID_CANARY_ORG,
      project: SENTRY_ANDROID_CANARY_PROJECT,
      projectId: SENTRY_ANDROID_CANARY_PROJECT_ID,
    };
    const response = await fetch(getSentryAndroidCanaryProjectEndpoint(projectConfig), {
      headers: { Authorization: `Bearer ${credential.token}` },
    });
    if (!response.ok) throw new Error(`Unable to verify Sentry dev project identity: HTTP ${response.status}`);
    const projectErrors = getSentryAndroidCanaryProjectIdentityErrors({
      project: await response.json(),
      config: projectConfig,
    });
    if (projectErrors.length > 0)
      throw new Error(`Sentry dev project identity is invalid: ${projectErrors.join('; ')}`);
    projectIdentityVerified = true;

    const env = {
      ...process.env,
      SENTRY_AUTH_TOKEN: credential.token,
      SENTRY_RELEASE_PROFILE: 'nonprod',
      SENTRY_ORG: SENTRY_ANDROID_CANARY_ORG,
      SENTRY_ANDROID_PROJECT: SENTRY_ANDROID_CANARY_PROJECT,
      SENTRY_IOS_PROJECT: 'goldwallet-dev-ios',
      SENTRY_PROJECT: SENTRY_ANDROID_CANARY_PROJECT,
      SENTRY_RELEASE: config.release,
      SENTRY_DIST: config.dist,
      SENTRY_ENVIRONMENT: 'dev-canary',
    };
    delete env.SENTRY_URL;
    delete env.SENTRY_DISABLE_AUTO_UPLOAD;
    writeSentryPropertiesFiles({ root, env });
    const buildEnv = { ...env };
    delete buildEnv.SENTRY_AUTH_TOKEN;
    mkdirSync(path.dirname(config.logPath), { recursive: true });
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'scripts', 'runAndroidGradle.mjs'), ':app:assembleDevRelease', '-x', 'lint'],
      {
        cwd: root,
        env: buildEnv,
        encoding: 'utf8',
        windowsHide: true,
        maxBuffer: 96 * 1024 * 1024,
      },
    );
    const safeOutput = redactSentryGradleCanaryOutput(`${result.stdout || ''}${result.stderr || ''}`, credential.token);
    writeFileSync(config.logPath, safeOutput);
    if (result.error || result.status !== 0) {
      throw new Error(`Sentry Gradle dev upload canary build failed with exit ${result.status ?? 'spawn-error'}`);
    }
    const sourceMapPath = path.join(
      root,
      'android',
      'app',
      'build',
      'generated',
      'sourcemaps',
      'react',
      'devRelease',
      'index.android.bundle.map',
    );
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
    const sourceMap = JSON.parse(readFileSync(sourceMapPath, 'utf8'));
    if (!sourceMap.debugId || sourceMap.debugId !== sourceMap.debug_id) {
      throw new Error('Generated Sentry source map debugId/debug_id fields are missing or inconsistent');
    }
    evidence = getSentryGradleDevUploadEvidence({
      output: safeOutput,
      config,
      sourceMapDebugId: sourceMap.debugId.toLowerCase(),
      bundleContainsDebugId: readFileSync(bundlePath).includes(Buffer.from(sourceMap.debugId)),
    });
    if (!evidence.passed)
      throw new Error(`Sentry Gradle dev upload evidence is invalid: ${evidence.errors.join('; ')}`);
  }

  const summary = renderSentryGradleDevUploadSummary({ config, executed: execute, projectIdentityVerified, evidence });
  const summaryPath = execute ? config.summaryPath : config.dryRunSummaryPath;
  writeFileSync(summaryPath, summary);
  console.log(`Sentry Gradle dev canary summary written to ${path.relative(root, summaryPath)}`);
  console.log(
    execute ? 'Sentry Gradle devRelease upload canary passed.' : 'Dry run only; Gradle and Sentry were not invoked.',
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
