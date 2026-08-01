import assert from 'assert';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import {
  getSentryGradleDevUploadCanaryConfig,
  getSentryGradleDevUploadEvidence,
  redactSentryGradleCanaryOutput,
  renderSentryGradleDevUploadSummary,
} from './sentryGradleDevUploadCanary.mjs';

const root = path.join(os.tmpdir(), `goldwallet-sentry-gradle-canary-${process.pid}`);
try {
  mkdirSync(path.join(root, 'android', 'app'), { recursive: true });
  for (const relativePath of [
    'android/app/build.gradle',
    'android/release-version.properties',
    'android/release-version.gradle',
    'android/release-version-contract.json',
    'metro.config.js',
    'package.json',
    'yarn.lock',
  ]) {
    const target = path.join(root, relativePath);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, relativePath);
  }
  mkdirSync(path.join(root, 'src'), { recursive: true });
  writeFileSync(path.join(root, 'src', 'wallet.ts'), 'export const walletVersion = 1;\n');
  mkdirSync(path.join(root, 'models'), { recursive: true });
  writeFileSync(path.join(root, 'models', 'bitcoinUnits.js'), 'export const unitVersion = 1;\n');
  mkdirSync(path.join(root, 'logger'), { recursive: true });
  writeFileSync(path.join(root, 'logger', 'index.ts'), 'export const loggerVersion = 1;\n');
  mkdirSync(path.join(root, 'android', 'app', 'src', 'main', 'assets'), { recursive: true });
  writeFileSync(path.join(root, 'android', 'app', 'src', 'main', 'assets', 'modules.json'), '{"generated":1}\n');
  const config = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: { versionName: '6.5.1', versionCode: '14' },
  });
  assert(config.release.startsWith('goldwallet-android-gradle-canary@6.5.1+14-'));
  assert.notStrictEqual(config.summaryPath, config.dryRunSummaryPath);
  writeFileSync(path.join(root, 'android', 'app', 'src', 'main', 'assets', 'modules.json'), '{"generated":2}\n');
  const generatedModuleConfig = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: { versionName: '6.5.1', versionCode: '14' },
  });
  assert.strictEqual(generatedModuleConfig.identity, config.identity);
  writeFileSync(path.join(root, 'src', 'wallet.ts'), 'export const walletVersion = 2;\n');
  const changedSourceConfig = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: { versionName: '6.5.1', versionCode: '14' },
  });
  assert.notStrictEqual(changedSourceConfig.identity, config.identity);
  assert.notStrictEqual(changedSourceConfig.release, config.release);
  writeFileSync(path.join(root, 'models', 'bitcoinUnits.js'), 'export const unitVersion = 2;\n');
  const changedModelConfig = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: { versionName: '6.5.1', versionCode: '14' },
  });
  assert.notStrictEqual(changedModelConfig.identity, changedSourceConfig.identity);
  writeFileSync(path.join(root, 'logger', 'index.ts'), 'export const loggerVersion = 2;\n');
  const changedLoggerConfig = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: { versionName: '6.5.1', versionCode: '14' },
  });
  assert.notStrictEqual(changedLoggerConfig.identity, changedModelConfig.identity);
  writeFileSync(path.join(root, 'android', 'release-version.gradle'), 'changed release version loader\n');
  const changedReleaseVersionLoaderConfig = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: { versionName: '6.5.1', versionCode: '14' },
  });
  assert.notStrictEqual(changedReleaseVersionLoaderConfig.identity, changedLoggerConfig.identity);
  writeFileSync(path.join(root, 'android', 'release-version-contract.json'), '{"changed":true}\n');
  const changedReleaseVersionContractConfig = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: { versionName: '6.5.1', versionCode: '14' },
  });
  assert.notStrictEqual(changedReleaseVersionContractConfig.identity, changedReleaseVersionLoaderConfig.identity);
  writeFileSync(path.join(root, 'android', 'release-version.properties'), 'versionCode=15\nversionName=6.5.2\n');
  const changedReleaseVersionPropertiesConfig = getSentryGradleDevUploadCanaryConfig({
    root,
    metadata: { versionName: '6.5.1', versionCode: '14' },
  });
  assert.notStrictEqual(changedReleaseVersionPropertiesConfig.identity, changedReleaseVersionContractConfig.identity);

  const debugId = 'e8c40da4-a7b7-40ea-9647-0f8dff19ab2d';
  const output = `
Bundle Debug ID: ${debugId}
Check generated source map for Debug ID: ${debugId}
Sentry Source Maps upload will include the release name and dist.
Bundle ID: 4e574f79-0167-512b-b664-5402b2681b40
Uploaded files to Sentry
Processing completed in 0.28s
Organization: decentraplanet
Projects: goldwallet-dev-android
Release: ${config.release}
Dist: ${config.dist}
Upload type: artifact bundle
BUILD SUCCESSFUL
`;
  const evidence = getSentryGradleDevUploadEvidence({
    output,
    config,
    sourceMapDebugId: debugId,
    bundleContainsDebugId: true,
  });
  assert(evidence.passed);
  assert(
    !getSentryGradleDevUploadEvidence({
      output: output.replace(
        `Check generated source map for Debug ID: ${debugId}`,
        'Check generated source map for Debug ID: 11111111-1111-4111-8111-111111111111',
      ),
      config,
      sourceMapDebugId: debugId,
      bundleContainsDebugId: true,
    }).passed,
  );
  assert(
    !getSentryGradleDevUploadEvidence({
      output: `${output}\nAuthorization: Bearer abc***`,
      config,
      sourceMapDebugId: debugId,
      bundleContainsDebugId: true,
    }).passed,
  );
  assert(
    !getSentryGradleDevUploadEvidence({
      output: output.replace('BUILD SUCCESSFUL', 'BUILD FAILED'),
      config,
      sourceMapDebugId: debugId,
      bundleContainsDebugId: true,
    }).passed,
  );
  assert(
    !getSentryGradleDevUploadEvidence({
      output,
      config,
      sourceMapDebugId: debugId,
      bundleContainsDebugId: false,
    }).passed,
  );
  assert.strictEqual(
    redactSentryGradleCanaryOutput('Authorization: Bearer secret-token', 'secret-token'),
    'Authorization: Bearer [REDACTED]',
  );
  const summary = renderSentryGradleDevUploadSummary({
    config,
    executed: true,
    projectIdentityVerified: true,
    evidence,
  });
  assert(summary.includes('Gradle build and upload validation: passed'));
  assert(summary.includes('Production release upload validation: not claimed'));
  assert(summary.includes('Secret values printed: no'));
} finally {
  rmSync(root, { recursive: true, force: true });
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const runner = readFileSync('scripts/runSentryGradleDevUploadCanary.mjs', 'utf8');
assert.strictEqual(
  packageJson.scripts['sentry:gradle-dev-upload-canary:dry-run'],
  'node scripts/runSentryGradleDevUploadCanary.mjs',
);
assert.strictEqual(
  packageJson.scripts['sentry:gradle-dev-upload-canary:execute'],
  'node scripts/runSentryGradleDevUploadCanary.mjs --execute',
);
assert.strictEqual(
  packageJson.scripts['check:sentry-gradle-dev-upload-canary-guard'],
  'node scripts/checkSentryGradleDevUploadCanaryGuard.mjs',
);
assert(runner.includes('delete buildEnv.SENTRY_AUTH_TOKEN'));
assert(runner.includes('env: buildEnv'));
assert(runner.includes('SENTRY_ORG: SENTRY_ANDROID_CANARY_ORG'));
assert(runner.includes('SENTRY_ANDROID_PROJECT: SENTRY_ANDROID_CANARY_PROJECT'));
assert(runner.includes("SENTRY_IOS_PROJECT: 'goldwallet-dev-ios'"));
assert(runner.includes('SENTRY_PROJECT: SENTRY_ANDROID_CANARY_PROJECT'));
assert(runner.includes('delete env.SENTRY_URL'));
assert(
  runner.indexOf('if (execute) rmSync(config.summaryPath') < runner.indexOf('resolveSentryManagedCredential()'),
  'Executed summary must be invalidated before credential and API preflight',
);

console.log('Sentry Gradle dev upload canary guard checks passed.');
