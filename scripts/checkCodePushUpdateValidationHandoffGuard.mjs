import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import {
  getCodePushUpdateValidationCommands,
  getCodePushUpdateValidationHandoffErrors,
  getCodePushUpdateValidationReadinessErrors,
  renderCodePushUpdateValidationCommand,
} from './runCodePushUpdateValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getCodePushUpdateValidationCommands({ skipAndroidRelease: false });
const fullRendered = fullCommands.map(renderCodePushUpdateValidationCommand).join('\n');
const skippedCommands = getCodePushUpdateValidationCommands({ skipAndroidRelease: true });
const skippedRendered = skippedCommands.map(renderCodePushUpdateValidationCommand).join('\n');
const fixtureApkPath = path.resolve('package.json');
const fixtureApkBytes = statSync(fixtureApkPath).size;
const fixtureApkSha256 = createHash('sha256').update(readFileSync(fixtureApkPath)).digest('hex');
const smokeEvidenceOptions = {
  expectedArtifactBase: 'android-smoke-dev-release',
  requireSmokeApkDigest: true,
  expectedSmokeApkPath: fixtureApkPath,
  requireSourceApkDigest: true,
  expectedSourceApkPath: fixtureApkPath,
};
const createWalletEvidenceOptions = {
  expectedApkPath: fixtureApkPath,
  expectedArtifactBase: 'android-create-wallet-smoke-dev-release',
};

[
  'corepack yarn android:dev:release:create-wallet-verify',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn codepush:release:path-audit',
  'corepack yarn codepush:release:path-check-summary',
  'corepack yarn codepush:migration:readiness-audit',
  'corepack yarn codepush:migration:readiness-check-summary',
  'corepack yarn codepush:removal-readiness:audit',
  'corepack yarn codepush:removal-readiness:check-summary',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected CodePush handoff commands to include: ${expected}`);
});

assert(
  !fullRendered.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') &&
    !fullRendered.includes('CODEPUSH_DEPLOYMENT_KEY_IOS=') &&
    !skippedRendered.includes('CODEPUSH_DEPLOYMENT_KEY_ANDROID=') &&
    !skippedRendered.includes('CODEPUSH_DEPLOYMENT_KEY_IOS='),
  'CodePush handoff rendered commands must not print deployment-key assignments',
);
assert(
  !skippedRendered.includes('android:dev:release:create-wallet-verify'),
  'Skipped CodePush handoff must omit Android release create-wallet evidence refresh',
);
assert(
  skippedRendered.includes('corepack yarn codepush:release:path-audit'),
  'Skipped CodePush handoff must still refresh CodePush release path readiness',
);
assert(
  skippedCommands[skippedCommands.length - 1].args.includes('release-services:check-summaries'),
  'Release-services aggregate check must be the final CodePush handoff command',
);
assert(
  getCodePushUpdateValidationHandoffErrors({ skipAndroidRelease: 'false' }).some(error =>
    error.includes('skipAndroidRelease must be a boolean'),
  ),
  'Invalid skipAndroidRelease option must be rejected',
);

const partialReadySummary = [
  'Release path ready for update validation: yes',
  'CodePush update validation: not claimed',
  'CodePush migration required: yes',
  'Secret values printed: no',
].join('\n');

const readySummary = [
  'CodePush release path audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Release path wiring valid: yes',
  'Release path ready for update validation: yes',
  'CodePush removed: no',
  'Ready environments: 5',
  'Environment readiness entries: 5',
  '- .env.dev.testnet: ready',
  '- .env.stage.mainnet: ready',
  '- .env.prod.mainnet: ready',
  '- .env.beta.testnet: ready',
  '- .env.beta.mainnet: ready',
  'CodePush package dependency version: 9.0.1',
  'CodePush package installed version: 9.0.1',
  'CodePush package latest version: 9.0.1',
  'CodePush package latest published at: 2026-05-01T00:00:00.000Z',
  'CodePush package current: yes',
  'CodePush package versions aligned: yes',
  'CodePush runtime gate present: yes',
  'CodePush runtime HOC lazy gated: yes',
  'CodePush native bundle gate present: yes',
  'CodePush runtime enabled by default: no',
  'CodePush upstream repository: https://github.com/microsoft/react-native-code-push',
  'CodePush npm repository: git+https://github.com/microsoft/react-native-code-push.git',
  'App Center CodePush retirement date: 2025-03-31',
  'CodePush upstream retired: yes',
  'CodePush upstream archived: yes',
  'CodePush upstream New Architecture support: no',
  'Android New Architecture enabled: yes',
  'CodePush migration required: yes',
  'CodePush release build evidence ready: yes',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release summary errors: 0',
  'Android release APK manifest valid: yes',
  'Android release APK manifest errors: 0',
  'CodePush update validation: not claimed',
  'Warnings: 0',
  'Readiness issues: 0',
  'Wiring errors: 0',
  'Secret values printed: no',
  'Required action: migrate or replace retired App Center CodePush before treating OTA updates as a supported release capability.',
].join('\n');

const blockedSummary = readySummary.replace('Release path ready for update validation: yes', 'Release path ready for update validation: no');

const partialMigrationReadinessSummary = [
  'CodePush migration readiness audit',
  'CodePush package current: yes',
  'CodePush migration required: yes',
  'Secret values printed: no',
].join('\n');

const migrationReadinessSummary = [
  'CodePush migration readiness audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'CodePush package current: yes',
  'CodePush removed: no',
  'CodePush package latest version: 9.0.1',
  'CodePush package latest published at: 2024-12-19T14:31:05.513Z',
  'CodePush npm repository: git+https://github.com/microsoft/react-native-code-push.git',
  'CodePush upstream repository: https://github.com/microsoft/react-native-code-push',
  'App Center CodePush retirement date: 2025-03-31',
  'CodePush upstream archived: yes',
  'CodePush upstream New Architecture support: no',
  'Android New Architecture enabled: yes',
  'CodePush runtime gated off by default: yes',
  'CodePush update validation: not claimed',
  'CodePush migration required: yes',
  'Current posture: temporary legacy compatibility',
  'Long-term options: remove or replace',
  'Decision document present: yes',
  'Decision document covers removal: yes',
  'Decision document covers replacement: yes',
  'Decision document rejects blind package upgrade: yes',
  'Release path summary valid: yes',
  'Release path summary errors: 0',
  'CodePush release build evidence ready: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke summary errors: 0',
  'CodePush release smoke evidence ready: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke summary errors: 0',
  'CodePush release create-wallet evidence ready: yes',
  'Ready CodePush environments: 2',
  'Blocked CodePush environments: 1',
  'Unconfirmed CodePush environments: 2',
  'Beta CodePush strategy confirmed: no',
  'Secret values printed: no',
  'Required action: choose remove or replace before treating OTA updates as a supported release capability.',
].join('\n');

const partialRemovalReadinessSummary = [
  'CodePush removal readiness audit',
  'CodePush package installed: yes',
  'Safe to remove now: no',
  'Secret values printed: no',
].join('\n');

const removalReadinessSummary = [
  'CodePush removal readiness audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'CodePush package installed: yes',
  'CodePush removed: no',
  'CodePush package latest version: 9.0.1',
  'CodePush package latest published at: 2024-12-19T14:31:05.513Z',
  'CodePush npm repository: git+https://github.com/microsoft/react-native-code-push.git',
  'CodePush upstream repository: https://github.com/microsoft/react-native-code-push',
  'CodePush upstream archived: yes',
  'CodePush upstream New Architecture support: no',
  'Android New Architecture enabled: yes',
  'CodePush migration required: yes',
  'CodePush release build evidence ready: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke summary errors: 0',
  'CodePush release smoke evidence ready: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke summary errors: 0',
  'CodePush release create-wallet evidence ready: yes',
  'Runtime usage files: 1',
  '- App.tsx',
  'Native integration files: 8',
  '- android/app/build.gradle',
  '- android/app/src/main/java/io/goldwallet/wallet/MainApplication.java',
  '- android/app/src/main/res/values/strings.xml',
  '- android/settings.gradle',
  '- ios/GoldWallet/AppDelegate.m',
  '- ios/GoldWallet/Info.plist',
  '- ios/GoldWalletDev-Info.plist',
  '- ios/GoldWalletStage-Info.plist',
  'Env files carrying CodePush keys: 5',
  '- .env.dev.testnet',
  '- .env.stage.mainnet',
  '- .env.prod.mainnet',
  '- .env.beta.testnet',
  '- .env.beta.mainnet',
  'iOS plist placeholders: 3',
  'Android native integration present: yes',
  'iOS native integration present: yes',
  'CodePush runtime gated off by default: yes',
  'Decision handoff present: yes',
  'Decision handoff valid: yes',
  'Decision: pending',
  'Beta deployment-key strategy: unconfirmed',
  'Decision handoff errors: 0',
  'Removal decision available: no',
  'Replacement decision available: no',
  'Safe to remove now: no',
  'Secret values printed: no',
  'Required action: choose remove or replace before deleting CodePush runtime, native integration, plist placeholders, and env keys.',
].join('\n');

const readyAndroidReleaseSmokeSummary = [
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Android smoke outcome: passed',
  'Android smoke exit code: 0',
  'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet.dev',
  'Android activity: io.goldwallet.wallet.dev/io.goldwallet.wallet.MainActivity',
  'Artifact base: android-smoke-dev-release',
  `Smoke APK path: ${fixtureApkPath}`,
  `Smoke APK bytes: ${fixtureApkBytes}`,
  `Smoke APK sha256: ${fixtureApkSha256}`,
  `Source APK path: ${fixtureApkPath}`,
  `Source APK bytes: ${fixtureApkBytes}`,
  `Source APK sha256: ${fixtureApkSha256}`,
  'Metro required: no',
  'Metro endpoint: 127.0.0.1:8081',
  'Metro reachable: no',
  'Cleared app data: yes',
  'Expected UI texts: Wallets, No wallets, Create new wallet, Import wallet',
  'Expected resource IDs: dashboard-header, no-wallets-icon, create-wallet-button, import-wallet-button, navigation-tab-0',
  'App PID: 1234',
  'Captured logcat lines: 400',
  'Accepted first-run terms: yes',
  'Completed first-run PIN: yes',
  'Completed first-run transaction password: yes',
  'Skipped first-run email: yes',
  'Closed first-run success: yes',
  'Validated empty-dashboard CTA flow: yes',
  'Validated empty-tab navigation: yes',
  'Validated QR scanner screen: yes',
  'Validated settings Terms WebView: yes',
  'UI hierarchy attempts: 1',
  'UI hierarchy path: package.json',
  'Screenshot path: package.json',
  'Screenshot bytes: 1234',
].join('\n');

const readyAndroidReleaseCreateWalletSmokeSummary = [
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Android create-wallet smoke outcome: passed',
  'Android create-wallet smoke exit code: 0',
  'Android create-wallet smoke reason: standard and vault wallet flows completed without fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet.dev',
  'Android activity: io.goldwallet.wallet.dev/io.goldwallet.wallet.MainActivity',
  'Artifact base: android-create-wallet-smoke-dev-release',
  `Source APK path: ${fixtureApkPath}`,
  `Source APK bytes: ${fixtureApkBytes}`,
  `Source APK sha256: ${fixtureApkSha256}`,
  'Standard wallet name: Smoke Standard',
  'Standard wallet created: yes',
  'Standard mnemonic screen reached: yes',
  'Vault wallet name: Smoke Vault',
  'Vault next-step reached: yes',
  'No create-wallet error UI: yes',
  'Fatal/runtime logcat findings: no',
  'App PID: 1234',
  'Captured logcat lines: 400',
  'UI hierarchy path: package.json',
  'Logcat path: package.json',
  'Screenshot path: package.json',
  'Screenshot bytes: 1234',
].join('\n');

assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    migrationReadinessSummaryText: migrationReadinessSummary,
    removalReadinessSummaryText: removalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).length === 0,
  'Ready CodePush handoff summary fixture must pass readiness checks',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: blockedSummary,
    migrationReadinessSummaryText: migrationReadinessSummary,
    removalReadinessSummaryText: removalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('not ready for update validation')),
  'Blocked CodePush handoff summary fixture must report update-validation readiness blocker',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: partialReadySummary,
    migrationReadinessSummaryText: migrationReadinessSummary,
    removalReadinessSummaryText: removalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('CodePush release path summary is invalid')),
  'CodePush readiness check must reject partial release path summaries before accepting readiness strings',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: 'Release path ready for update validation: yes',
    migrationReadinessSummaryText: migrationReadinessSummary,
    removalReadinessSummaryText: removalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('deployment-key values were not printed')),
  'CodePush readiness check must require secret-safe summary evidence',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    migrationReadinessSummaryText: partialMigrationReadinessSummary,
    removalReadinessSummaryText: removalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('CodePush migration readiness summary is invalid')),
  'CodePush readiness check must reject partial migration readiness summaries',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    migrationReadinessSummaryText: migrationReadinessSummary,
    removalReadinessSummaryText: partialRemovalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('CodePush removal readiness summary is invalid')),
  'CodePush readiness check must reject partial removal readiness summaries',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    migrationReadinessSummaryText: migrationReadinessSummary,
    removalReadinessSummaryText: removalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: '',
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is missing')),
  'CodePush readiness check must report a missing Android release smoke summary',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    migrationReadinessSummaryText: migrationReadinessSummary,
    removalReadinessSummaryText: removalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary.replace('Validated empty-dashboard CTA flow: yes', 'Validated empty-dashboard CTA flow: no'),
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is invalid')),
  'CodePush readiness check must reject invalid Android release smoke evidence',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    migrationReadinessSummaryText: migrationReadinessSummary,
    removalReadinessSummaryText: removalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: '',
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release create-wallet smoke summary is missing')),
  'CodePush readiness check must report a missing Android release create-wallet smoke summary',
);
assert(
  getCodePushUpdateValidationReadinessErrors({
    releasePathSummaryText: readySummary,
    migrationReadinessSummaryText: migrationReadinessSummary,
    removalReadinessSummaryText: removalReadinessSummary,
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary.replace(
      'Standard wallet created: yes',
      'Standard wallet created: no',
    ),
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release create-wallet smoke summary is invalid')),
  'CodePush readiness check must reject invalid Android release create-wallet smoke evidence',
);

console.log('CodePush update validation handoff guard checks are valid.');
