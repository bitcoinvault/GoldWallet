import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import {
  getSentryReleaseValidationCommands,
  getSentryReleaseValidationHandoffErrors,
  getSentryReleaseValidationReadinessErrors,
  renderSentryReleaseValidationCommand,
} from './runSentryReleaseValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getSentryReleaseValidationCommands({ skipAndroidRelease: false });
const fullRendered = fullCommands.map(renderSentryReleaseValidationCommand).join('\n');
const skippedCommands = getSentryReleaseValidationCommands({ skipAndroidRelease: true });
const skippedRendered = skippedCommands.map(renderSentryReleaseValidationCommand).join('\n');
const preflightCommands = getSentryReleaseValidationCommands({ preflightOnly: true, skipAndroidRelease: true });
const preflightRendered = preflightCommands.map(renderSentryReleaseValidationCommand).join('\n');
const packageJson = JSON.parse(readFileSync(path.resolve('package.json'), 'utf8'));
const scripts = packageJson.scripts || {};
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
  'corepack yarn check:sentry-properties-generator',
  'corepack yarn android:dev:release:create-wallet-verify',
  'SENTRY_DISABLE_AUTO_UPLOAD=true',
  'corepack yarn sentry:android-warning:audit',
  'corepack yarn sentry:android-warning:check-summary',
  'corepack yarn sentry:rn-bundle-task-compat:audit',
  'corepack yarn sentry:rn-bundle-task-compat:check-summary',
  'corepack yarn sentry:release:create-properties',
  'requires-env=SENTRY_AUTH_TOKEN',
  'corepack yarn sentry:release:prereq-audit',
  'corepack yarn sentry:release:prereq-check-summary',
  'corepack yarn release-services:check-summaries',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected Sentry handoff commands to include: ${expected}`);
});

assert(
  !fullRendered.includes('SENTRY_AUTH_TOKEN=') &&
    !skippedRendered.includes('SENTRY_AUTH_TOKEN=') &&
    !preflightRendered.includes('SENTRY_AUTH_TOKEN='),
  'Sentry handoff rendered commands must not print SENTRY_AUTH_TOKEN assignments',
);
assert(
  !skippedRendered.includes('android:dev:release:create-wallet-verify'),
  'Skipped Sentry handoff must omit Android release create-wallet evidence refresh',
);
assert(
  skippedRendered.includes('corepack yarn sentry:release:create-properties'),
  'Skipped Sentry handoff must still generate Sentry release properties',
);
assert(
  !preflightRendered.includes('corepack yarn sentry:release:create-properties'),
  'Preflight-only Sentry handoff must not generate Sentry release properties',
);
assert(
  preflightRendered.includes('corepack yarn sentry:release:prereq-audit') &&
    preflightRendered.includes('corepack yarn sentry:release:prereq-check-summary') &&
    preflightRendered.includes('corepack yarn release-services:check-summaries'),
  'Preflight-only Sentry handoff must still audit prerequisites and aggregate release-services summaries',
);
assert(
  scripts['sentry:release:validation:preflight'] ===
    'node scripts/runSentryReleaseValidationHandoff.mjs --preflight-only --skip-android-release',
  'package.json must expose a Sentry release validation preflight script that skips credentialed upload and Android release refresh',
);
assert(
  scripts['sentry:release:validation:preflight:dry-run'] ===
    'node scripts/runSentryReleaseValidationHandoff.mjs --preflight-only --skip-android-release --dry-run',
  'package.json must expose a dry-run Sentry release validation preflight script',
);
assert(
  skippedRendered.includes('corepack yarn sentry:android-warning:audit'),
  'Skipped Sentry handoff must still audit the Sentry Android warning surface',
);
assert(
  skippedRendered.includes('corepack yarn sentry:android-warning:check-summary'),
  'Skipped Sentry handoff must still validate the Sentry Android warning summary',
);
assert(
  fullCommands[0].args.includes('check:sentry-properties-generator'),
  'Sentry properties generator guard must run before properties are generated',
);
assert(
  fullCommands.findIndex(step => step.args.includes('sentry:android-warning:audit')) <
    fullCommands.findIndex(step => step.args.includes('sentry:release:prereq-audit')),
  'Sentry Android warning audit must run before the Sentry release prerequisite audit',
);
assert(
  fullCommands.findIndex(step => step.args.includes('sentry:android-warning:check-summary')) <
    fullCommands.findIndex(step => step.args.includes('sentry:rn-bundle-task-compat:audit')),
  'Sentry RN bundle task compatibility audit must run after the Android warning summary is validated',
);
assert(
  fullCommands.findIndex(step => step.args.includes('sentry:rn-bundle-task-compat:check-summary')) <
    fullCommands.findIndex(step => step.args.includes('sentry:release:create-properties')),
  'Sentry properties generation must run after RN bundle task compatibility is validated',
);
assert(
  fullCommands[fullCommands.length - 1].args.includes('release-services:check-summaries'),
  'Release-services aggregate check must be the final Sentry handoff command',
);
assert(
  getSentryReleaseValidationHandoffErrors({ skipAndroidRelease: 'false' }).some(error =>
    error.includes('skipAndroidRelease must be a boolean'),
  ),
  'Invalid skipAndroidRelease option must be rejected',
);
assert(
  getSentryReleaseValidationHandoffErrors({ preflightOnly: 'false', skipAndroidRelease: false }).some(error =>
    error.includes('preflightOnly must be a boolean'),
  ),
  'Invalid preflightOnly option must be rejected',
);

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

const readySentryReleasePrereqSummary = [
  'Sentry release prerequisite audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Release source-map prerequisites: ready',
  '@sentry/react-native version: 8.14.0',
  '@sentry/react-native latest: 8.14.0',
  '@sentry/react-native current: yes',
  '@sentry/cli package version: 3.5.1',
  '@sentry/cli latest: 3.5.1',
  '@sentry/cli current: yes',
  '@sentry/cli installed package instances: 3',
  '- node_modules/@sentry/cli/package.json: 3.5.1 (direct)',
  '- node_modules/@sentry/expo-upload-sourcemaps/node_modules/@sentry/cli/package.json: 3.5.0 (nested)',
  '- node_modules/@sentry/react-native/node_modules/@sentry/cli/package.json: 3.5.0 (nested)',
  '@sentry/cli installed package versions: 3.5.1, 3.5.0',
  '@sentry/cli nested package versions: 3.5.0',
  '@sentry/cli direct package installed: yes',
  'Sentry CLI release build path uses direct package: yes',
  'Sentry CLI binary present: yes',
  'Sentry CLI version output: sentry-cli 3.5.1',
  'Sentry CLI executable: yes',
  'Sentry release integration wired: yes',
  'Sentry release integration errors: 0',
  'sentry.properties files present: yes',
  'Missing files: 0',
  'Invalid files: 0',
  'Properties file readiness entries: 3',
  '- sentry.properties: ready',
  '- android/sentry.properties: ready',
  '- ios/sentry.properties: ready',
  'Ready properties files: 3',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release summary errors: 0',
  'Android release APK manifest valid: yes',
  'Android release APK manifest errors: 0',
  'Android release smoke summary present: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke summary errors: 0',
  'Sentry release smoke evidence ready: yes',
  'Android release create-wallet smoke summary present: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke summary errors: 0',
  'Sentry release create-wallet evidence ready: yes',
  'iOS release static readiness valid: yes',
  'iOS macOS archive validation ready: yes',
  'iOS Sentry bundle/source-map phases: 4',
  'iOS Sentry dSYM upload phases: 3',
  'iOS Podfile.lock refresh required: no',
  'iOS Podfile.lock drift issues: 0',
  'iOS macOS validation prerequisites ready: yes',
  'iOS macOS validation blockers: 0',
  'Sentry release upload validation: not claimed',
  'create-sentry-properties.sh present: yes',
  'create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: yes',
  'create-sentry-properties.sh rejects missing SENTRY_AUTH_TOKEN: yes',
  'create-sentry-properties.sh writes root properties: yes',
  'create-sentry-properties.sh writes Android properties: yes',
  'create-sentry-properties.sh writes iOS properties: yes',
  'create-sentry-properties.sh static defaults valid: yes',
  'create-sentry-properties.sh supports SENTRY_ORG override: yes',
  'create-sentry-properties.sh supports SENTRY_PROJECT override: yes',
  'createSentryProperties.mjs present: yes',
  'createSentryProperties.mjs requires SENTRY_AUTH_TOKEN: yes',
  'createSentryProperties.mjs rejects missing SENTRY_AUTH_TOKEN: yes',
  'createSentryProperties.mjs writes root properties: yes',
  'createSentryProperties.mjs writes Android properties: yes',
  'createSentryProperties.mjs writes iOS properties: yes',
  'createSentryProperties.mjs static defaults valid: yes',
  'createSentryProperties.mjs supports SENTRY_ORG override: yes',
  'createSentryProperties.mjs supports SENTRY_PROJECT override: yes',
  'createSentryProperties.mjs supports --root override: yes',
  'sentry:release:create-properties script present: yes',
  'SENTRY_AUTH_TOKEN available in current shell: yes',
  'Required action: none; release source-map prerequisites are present locally.',
].join('\n');

const notReadySentryReleasePrereqSummary = [
  'Sentry release prerequisite audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Release source-map prerequisites: not ready',
  '@sentry/react-native version: 8.14.0',
  '@sentry/react-native latest: 8.14.0',
  '@sentry/react-native current: yes',
  '@sentry/cli package version: 3.5.1',
  '@sentry/cli latest: 3.5.1',
  '@sentry/cli current: yes',
  '@sentry/cli installed package instances: 3',
  '- node_modules/@sentry/cli/package.json: 3.5.1 (direct)',
  '- node_modules/@sentry/expo-upload-sourcemaps/node_modules/@sentry/cli/package.json: 3.5.0 (nested)',
  '- node_modules/@sentry/react-native/node_modules/@sentry/cli/package.json: 3.5.0 (nested)',
  '@sentry/cli installed package versions: 3.5.1, 3.5.0',
  '@sentry/cli nested package versions: 3.5.0',
  '@sentry/cli direct package installed: yes',
  'Sentry CLI release build path uses direct package: yes',
  'Sentry CLI binary present: yes',
  'Sentry CLI version output: sentry-cli 3.5.1',
  'Sentry CLI executable: yes',
  'Sentry release integration wired: yes',
  'Sentry release integration errors: 0',
  'sentry.properties files present: no',
  'Missing files: 3',
  '- sentry.properties',
  '- android/sentry.properties',
  '- ios/sentry.properties',
  'Invalid files: 0',
  'Properties file readiness entries: 3',
  '- sentry.properties: missing',
  '- android/sentry.properties: missing',
  '- ios/sentry.properties: missing',
  'Ready properties files: 0',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release summary errors: 0',
  'Android release APK manifest valid: yes',
  'Android release APK manifest errors: 0',
  'Android release smoke summary present: yes',
  'Android release smoke summary valid: yes',
  'Android release smoke summary errors: 0',
  'Sentry release smoke evidence ready: yes',
  'Android release create-wallet smoke summary present: yes',
  'Android release create-wallet smoke summary valid: yes',
  'Android release create-wallet smoke summary errors: 0',
  'Sentry release create-wallet evidence ready: yes',
  'iOS release static readiness valid: yes',
  'iOS macOS archive validation ready: no',
  'iOS Sentry bundle/source-map phases: 4',
  'iOS Sentry dSYM upload phases: 3',
  'iOS Podfile.lock refresh required: yes',
  'iOS Podfile.lock drift issues: 1',
  '- ios/Podfile.lock has RNSentry 3.1.0; package.json has @sentry/react-native 8.14.0',
  'iOS macOS validation prerequisites ready: no',
  'iOS macOS validation blockers: 2',
  '- Current platform is win32; iOS archive/simulator validation requires macOS with Xcode.',
  '- ios/Podfile.lock has 1 active drift issues; run pod install on macOS before archive validation.',
  'Sentry release upload validation: not claimed',
  'create-sentry-properties.sh present: yes',
  'create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: yes',
  'create-sentry-properties.sh rejects missing SENTRY_AUTH_TOKEN: yes',
  'create-sentry-properties.sh writes root properties: yes',
  'create-sentry-properties.sh writes Android properties: yes',
  'create-sentry-properties.sh writes iOS properties: yes',
  'create-sentry-properties.sh static defaults valid: yes',
  'create-sentry-properties.sh supports SENTRY_ORG override: yes',
  'create-sentry-properties.sh supports SENTRY_PROJECT override: yes',
  'createSentryProperties.mjs present: yes',
  'createSentryProperties.mjs requires SENTRY_AUTH_TOKEN: yes',
  'createSentryProperties.mjs rejects missing SENTRY_AUTH_TOKEN: yes',
  'createSentryProperties.mjs writes root properties: yes',
  'createSentryProperties.mjs writes Android properties: yes',
  'createSentryProperties.mjs writes iOS properties: yes',
  'createSentryProperties.mjs static defaults valid: yes',
  'createSentryProperties.mjs supports SENTRY_ORG override: yes',
  'createSentryProperties.mjs supports SENTRY_PROJECT override: yes',
  'createSentryProperties.mjs supports --root override: yes',
  'sentry:release:create-properties script present: yes',
  'SENTRY_AUTH_TOKEN available in current shell: no',
  'Required action: generate sentry.properties, android/sentry.properties, and ios/sentry.properties with SENTRY_AUTH_TOKEN, refresh ios/Podfile.lock on macOS with Xcode/CocoaPods, then run iOS archive/simulator validation before claiming Sentry release validation.',
].join('\n');

const partialSentryReleasePrereqSummary = [
  'Release source-map prerequisites: ready',
  '@sentry/react-native current: yes',
  '@sentry/cli current: yes',
  'Sentry release integration wired: yes',
].join('\n');

assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    sentryReleasePrereqSummaryText: readySentryReleasePrereqSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).length === 0,
  'Ready Sentry release handoff smoke fixture must pass readiness checks',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    sentryReleasePrereqSummaryText: notReadySentryReleasePrereqSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Sentry release prerequisite summary is not ready')),
  'Full Sentry release handoff readiness must reject not-ready prerequisite summaries',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    requireReadyPrereqs: false,
    sentryReleasePrereqSummaryText: notReadySentryReleasePrereqSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).length === 0,
  'Preflight-only Sentry release handoff readiness must accept structurally valid not-ready prerequisite summaries',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    sentryReleasePrereqSummaryText: '',
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Sentry release prerequisite summary is missing')),
  'Sentry release readiness check must report a missing Sentry release prerequisite summary',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    sentryReleasePrereqSummaryText: partialSentryReleasePrereqSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Sentry release prerequisite summary is invalid')),
  'Sentry release readiness check must reject partial Sentry release prerequisite summaries',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: '',
    sentryReleasePrereqSummaryText: readySentryReleasePrereqSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is missing')),
  'Sentry release readiness check must report a missing Android release smoke summary',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary,
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary.replace('Validated empty-dashboard CTA flow: yes', 'Validated empty-dashboard CTA flow: no'),
    sentryReleasePrereqSummaryText: readySentryReleasePrereqSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release smoke summary is invalid')),
  'Sentry release readiness check must reject invalid Android release smoke evidence',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: '',
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    sentryReleasePrereqSummaryText: readySentryReleasePrereqSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release create-wallet smoke summary is missing')),
  'Sentry release readiness check must report a missing Android release create-wallet smoke summary',
);
assert(
  getSentryReleaseValidationReadinessErrors({
    androidReleaseCreateWalletSmokeSummaryText: readyAndroidReleaseCreateWalletSmokeSummary.replace(
      'Standard wallet created: yes',
      'Standard wallet created: no',
    ),
    androidReleaseSmokeSummaryText: readyAndroidReleaseSmokeSummary,
    sentryReleasePrereqSummaryText: readySentryReleasePrereqSummary,
    createWalletEvidenceOptions,
    smokeEvidenceOptions,
  }).some(error => error.includes('Android release create-wallet smoke summary is invalid')),
  'Sentry release readiness check must reject invalid Android release create-wallet smoke evidence',
);

console.log('Sentry release validation handoff guard checks are valid.');
