import assert from 'assert';
import { readFileSync } from 'fs';
import path from 'path';
import {
  defaultSentryAndroidReleaseEvidenceVariant,
  getSentryAndroidReleaseEvidenceConfig,
  sentryAndroidReleaseEvidenceEnvName,
} from './sentryAndroidReleaseEvidenceVariant.mjs';

const fixtureRoot = path.resolve('D:/GoldWallet');

const productionConfig = getSentryAndroidReleaseEvidenceConfig(fixtureRoot, {});

assert.strictEqual(defaultSentryAndroidReleaseEvidenceVariant, 'prod');
assert.strictEqual(sentryAndroidReleaseEvidenceEnvName, 'SENTRY_ANDROID_RELEASE_EVIDENCE_VARIANT');
assert.strictEqual(productionConfig.variant, 'prod');
assert.strictEqual(productionConfig.packageName, 'io.goldwallet.wallet');
assert.strictEqual(
  productionConfig.smokeSummaryPath,
  path.join(fixtureRoot, 'local-docs', 'android-smoke-prod-release-summary.txt'),
);
assert.strictEqual(
  productionConfig.createWalletSmokeSummaryPath,
  path.join(fixtureRoot, 'local-docs', 'android-create-wallet-smoke-prod-release-summary.txt'),
);
assert.strictEqual(
  productionConfig.signedSmokeApkPath,
  path.join(fixtureRoot, 'local-docs', 'android-smoke-prod-release-signed.apk'),
);
assert.strictEqual(
  productionConfig.unsignedApkPath,
  path.join(fixtureRoot, 'android', 'app', 'build', 'outputs', 'apk', 'prod', 'release', 'app-prod-release-unsigned.apk'),
);

const developmentConfig = getSentryAndroidReleaseEvidenceConfig(fixtureRoot, {
  SENTRY_ANDROID_RELEASE_EVIDENCE_VARIANT: ' dev ',
});

assert.strictEqual(developmentConfig.variant, 'dev');
assert.strictEqual(developmentConfig.packageName, 'io.goldwallet.wallet.dev');
assert.strictEqual(developmentConfig.smokeArtifactBase, 'android-smoke-dev-release');
assert.strictEqual(developmentConfig.createWalletArtifactBase, 'android-create-wallet-smoke-dev-release');

assert.throws(
  () =>
    getSentryAndroidReleaseEvidenceConfig(fixtureRoot, {
      SENTRY_ANDROID_RELEASE_EVIDENCE_VARIANT: 'internal',
    }),
  /Unsupported Sentry Android release evidence variant: internal/,
);

const auditSource = readFileSync(path.join(fixtureRoot, 'scripts', 'auditSentryReleasePrerequisites.mjs'), 'utf8');

assert.match(auditSource, /getSentryAndroidReleaseEvidenceConfig\(root, env\)/);
assert.match(auditSource, /getAndroidReleaseSmokeEvidenceOptions\(root, androidReleaseEvidenceConfig\.variant\)/);
assert.match(auditSource, /expectedArtifactBase: androidReleaseEvidenceConfig\.createWalletArtifactBase/);
assert.doesNotMatch(auditSource, /android-smoke-dev-release-summary\.txt/);
assert.doesNotMatch(auditSource, /android-create-wallet-smoke-dev-release-summary\.txt/);

console.log('Sentry Android release evidence variant guard passed.');
