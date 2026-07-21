import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import {
  getCameraQrValidationCommands,
  getCameraQrValidationHandoffErrors,
  getCameraQrValidationReadinessErrors,
  renderCameraQrValidationCommand,
} from './runCameraQrValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const commands = getCameraQrValidationCommands({ includeAndroidSmoke: false });
const rendered = commands.map(renderCameraQrValidationCommand).join('\n');
const smokeCommands = getCameraQrValidationCommands({ includeAndroidSmoke: true });
const smokeRendered = smokeCommands.map(renderCameraQrValidationCommand).join('\n');
const releaseSmokeCommands = getCameraQrValidationCommands({ includeAndroidReleaseSmoke: true });
const releaseSmokeRendered = releaseSmokeCommands.map(renderCameraQrValidationCommand).join('\n');
const prodReleaseSmokeCommands = getCameraQrValidationCommands({
  includeAndroidReleaseSmoke: true,
  androidReleaseVariant: 'prod',
});
const prodReleaseSmokeRendered = prodReleaseSmokeCommands.map(renderCameraQrValidationCommand).join('\n');
const fixtureApkPath = path.resolve('package.json');
const fixtureApkBytes = statSync(fixtureApkPath).size;
const fixtureApkSha256 = createHash('sha256').update(readFileSync(fixtureApkPath)).digest('hex');

[
  'corepack yarn camera:candidate:audit',
  'corepack yarn camera:candidate:check-summary',
  'corepack yarn camera:qr-migration:audit',
  'corepack yarn camera:qr-migration:check-summary',
  'corepack yarn check:camera-usage-guard',
  'corepack yarn check:camera-usage-scope',
  'corepack yarn check:qr-scan-caller-guard',
  'corepack yarn check:qr-scan-callers',
  'corepack yarn check:qr-scanner-validation-scripts',
  'corepack yarn test:qr-scanner:unit',
  'corepack yarn check:qr-render-usage-guard',
  'corepack yarn check:qr-render-usage',
  'corepack yarn check:qr-render-validation-scripts',
  'corepack yarn test:qr-render:unit',
  'corepack yarn check:camera-qr-validation-summary-guard',
  'corepack yarn camera:qr-validation:summary',
  'corepack yarn camera:qr-validation:check-summary',
].forEach(expected => {
  assert(rendered.includes(expected), `Expected Camera/QR handoff commands to include: ${expected}`);
});

[
  'corepack yarn android:dev:assemble',
  'corepack yarn android:dev:smoke:embedded',
  'corepack yarn android:dev:check-smoke-summary',
].forEach(expected => {
  assert(smokeRendered.includes(expected), `Expected Camera/QR smoke handoff commands to include: ${expected}`);
  assert(!rendered.includes(expected), `Default Camera/QR handoff must not include Android smoke command: ${expected}`);
});

[
  'corepack yarn android:dev:release:verify-local',
  'corepack yarn android:dev:release:create-wallet-smoke:embedded',
  'corepack yarn android:dev:release:check-smoke-summary',
  'corepack yarn android:dev:release:check-create-wallet-smoke-summary',
].forEach(expected => {
  assert(releaseSmokeRendered.includes(expected), `Expected Camera/QR release smoke handoff commands to include: ${expected}`);
  assert(!rendered.includes(expected), `Default Camera/QR handoff must not include Android release smoke command: ${expected}`);
  assert(!smokeRendered.includes(expected), `Debug Camera/QR smoke handoff must not include Android release smoke command: ${expected}`);
});

[
  'corepack yarn android:dev:release:verify-local',
  'corepack yarn android:prod:release:create-wallet-smoke:embedded',
  'corepack yarn android:prod:release:check-smoke-summary',
  'corepack yarn android:prod:release:check-create-wallet-smoke-summary',
  'corepack yarn camera:qr-validation:summary --variant=prod',
].forEach(expected => {
  assert(
    prodReleaseSmokeRendered.includes(expected),
    `Expected production Camera/QR release smoke handoff commands to include: ${expected}`,
  );
});

assert(
  commands.findIndex(step => step.args.includes('camera:candidate:audit')) <
    commands.findIndex(step => step.args.includes('camera:qr-migration:audit')),
  'Camera candidate audit must run before Camera QR migration audit',
);
assert(
  commands.findIndex(step => step.args.includes('check:qr-scanner-validation-scripts')) <
    commands.findIndex(step => step.args.includes('test:qr-scanner:unit')),
  'QR scanner test guard must run before the focused scanner unit test',
);
assert(
  commands.findIndex(step => step.args.includes('check:qr-render-validation-scripts')) <
    commands.findIndex(step => step.args.includes('test:qr-render:unit')),
  'QR render test guard must run before the focused render unit test',
);
assert(
  smokeCommands.findIndex(step => step.args.includes('test:qr-render:unit')) <
    smokeCommands.findIndex(step => step.args.includes('android:dev:assemble')),
  'Android Camera/QR smoke must run after focused QR render unit validation',
);
assert(
  releaseSmokeCommands.findIndex(step => step.args.includes('test:qr-render:unit')) <
    releaseSmokeCommands.findIndex(step => step.args.includes('android:dev:release:verify-local')),
  'Android Camera/QR release smoke must run after focused QR render unit validation',
);
assert(
  commands.findIndex(step => step.args.includes('test:qr-render:unit')) <
    commands.findIndex(step => step.args.includes('check:camera-qr-validation-summary-guard')),
  'Camera/QR validation summary guard must run after focused QR render unit validation',
);
assert(
  commands.findIndex(step => step.args.includes('check:camera-qr-validation-summary-guard')) <
    commands.findIndex(step => step.args.includes('camera:qr-validation:summary')),
  'Camera/QR validation summary guard must run before writing the summary',
);
assert(
  commands.findIndex(step => step.args.includes('camera:qr-validation:summary')) <
    commands.findIndex(step => step.args.includes('camera:qr-validation:check-summary')),
  'Camera/QR validation summary must be checked after it is written',
);
assert(
  smokeCommands.findIndex(step => step.args.includes('android:dev:check-smoke-summary')) <
    smokeCommands.findIndex(step => step.args.includes('camera:qr-validation:summary')),
  'Camera/QR validation summary must run after Android smoke summary validation when smoke is included',
);
assert(
  releaseSmokeCommands.findIndex(step => step.args.includes('android:dev:release:check-create-wallet-smoke-summary')) <
    releaseSmokeCommands.findIndex(step => step.args.includes('camera:qr-validation:summary')),
  'Camera/QR validation summary must run after Android release smoke validation when release smoke is included',
);
assert(
  getCameraQrValidationHandoffErrors({ dryRun: 'false' }).some(error => error.includes('dryRun must be a boolean')),
  'Invalid dryRun option must be rejected',
);
assert(
  getCameraQrValidationHandoffErrors({ dryRun: false, includeAndroidSmoke: 'false' }).some(error =>
    error.includes('includeAndroidSmoke must be a boolean'),
  ),
  'Invalid includeAndroidSmoke option must be rejected',
);
assert(
  getCameraQrValidationHandoffErrors({ dryRun: false, includeAndroidReleaseSmoke: 'false' }).some(error =>
    error.includes('includeAndroidReleaseSmoke must be a boolean'),
  ),
  'Invalid includeAndroidReleaseSmoke option must be rejected',
);
assert(
  getCameraQrValidationHandoffErrors({
    dryRun: false,
    includeAndroidSmoke: false,
    includeAndroidReleaseSmoke: true,
    androidReleaseVariant: 'unknown',
  }).some(error => error.includes('androidReleaseVariant must be one of')),
  'Unsupported Android release evidence variant must be rejected',
);

const candidateSummary = [
  'Camera candidate audit',
  'Generated at: 2026-06-12T00:00:00.000Z',
  'Metadata checked on: 2026-07-21',
  'Legacy camera latest: react-native-camera@4.2.1',
  'VisionCamera latest: react-native-vision-camera@5.1.1',
  'VisionCamera Nitro peers: yes',
  'VisionCamera required peer packages: react-native-nitro-modules, react-native-nitro-image',
  'VisionCamera peer dependency ranges: react@*, react-native@*, react-native-nitro-image@*, react-native-nitro-modules@*',
  'CameraKit latest: react-native-camera-kit@18.0.0',
  'CameraKit node engine: >=18',
  'CameraKit peer dependency ranges: react@*, react-native@*',
  'QR renderer latest: react-native-qrcode-svg@6.3.21',
  'QR renderer peer dependency ranges: react@*, react-native@>=0.63.4, react-native-svg@>=14.0.0',
  'QR renderer dependencies: prop-types@^15.8.0, qrcode@^1.5.4, text-encoding@^0.7.0',
  'QR native renderer latest: react-native-svg@15.15.5',
  'QR encoder latest: qrcode@1.5.4',
  'Live npm metadata: matched',
  'Live npm metadata issues: 0',
  'Selected proof target: CameraKit selected and installed; VisionCamera deferred because latest line requires Nitro peers',
  'Proof branch: feature/bem-37-camera-kit-qr-proof',
  'Camera candidate baseline stable: yes',
  'Warnings: 0',
  'Errors: 0',
  'Required action: none; CameraKit scanner baseline is stable after the dedicated proof branch.',
].join('\n');

const migrationSummary = [
  'Camera QR migration audit',
  'Generated at: 2026-06-12T00:00:00.000Z',
  'react-native-camera manifest version: <missing>',
  'react-native-camera-kit manifest version: 18.0.0',
  'QR local-image manifest version: <missing>',
  'QR renderer version: 6.3.21',
  'QR native renderer version: 15.15.5',
  'qrcode resolution: 1.5.4',
  'CameraKit latest target: react-native-camera-kit@18.0.0',
  'CameraKit peer dependency ranges: react@*, react-native@*',
  'QR renderer latest target: react-native-qrcode-svg@6.3.21',
  'QR renderer peer dependency ranges: react@*, react-native@>=0.63.4, react-native-svg@>=14.0.0',
  'QR renderer dependencies: prop-types@^15.8.0, qrcode@^1.5.4, text-encoding@^0.7.0',
  'QR native renderer latest target: react-native-svg@15.15.5',
  'QR encoder latest target: qrcode@1.5.4',
  'Live QR targets: matched',
  'Live QR target issues: 0',
  'iOS Podfile.lock refresh required: no',
  'iOS stale removed camera pods: none',
  'iOS camera Podfile.lock cleanup complete: yes',
  'iOS broader Podfile.lock refresh required: yes',
  'iOS broader Podfile.lock drift issues: 1',
  '- ios/Podfile.lock has React-Core 0.65.3; package.json has react-native 0.86.0',
  'iOS removed Podfile.lock drift issues: 0',
  'Camera QR migration wiring valid: yes',
  'Camera QR migration baseline stable: yes',
  'Warnings: 0',
  'Readiness issues: 0',
  'Wiring errors: 0',
  'Required action: none for Android/CameraKit scanner wiring; refresh broader ios/Podfile.lock with pod install on macOS before claiming iOS camera QR runtime validation.',
].join('\n');

const androidSmokeSummary = [
  'Generated at: 2026-06-12T00:00:00.000Z',
  'Android smoke outcome: passed',
  'Android smoke exit code: 0',
  'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet.dev',
  'Android activity: io.goldwallet.wallet.dev/io.goldwallet.wallet.MainActivity',
  'Artifact base: android-smoke-dev',
  `Smoke APK path: ${fixtureApkPath}`,
  `Smoke APK bytes: ${fixtureApkBytes}`,
  `Smoke APK sha256: ${fixtureApkSha256}`,
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

const androidReleaseSmokeSummary = [
  'Generated at: 2026-06-12T00:00:00.000Z',
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

const androidReleaseCreateWalletSummary = [
  'Generated at: 2026-06-12T00:00:00.000Z',
  'Android create-wallet smoke outcome: passed',
  'Android create-wallet smoke exit code: 0',
  'Android create-wallet smoke reason: standard wallet and vault create flows reached expected screens without error UI or fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet.dev',
  'Android activity: io.goldwallet.wallet.dev/io.goldwallet.wallet.MainActivity',
  'Artifact base: android-create-wallet-smoke-dev-release',
  `Source APK path: ${fixtureApkPath}`,
  `Source APK bytes: ${fixtureApkBytes}`,
  `Source APK sha256: ${fixtureApkSha256}`,
  'Standard wallet name: StdFixture',
  'Standard wallet created: yes',
  'Standard mnemonic screen reached: yes',
  'Standard wallet persisted after restart: yes',
  'App process restart completed: yes',
  'Unlock screen reached after restart: yes',
  'Incorrect PIN rejected after restart: yes',
  'Secure window flag on mnemonic screen: yes',
  'Secure window flag after restart: no',
  'Vault wallet name: VaultFixture',
  'Vault next-step reached: yes',
  'No create-wallet error UI: yes',
  'Fatal/runtime logcat findings: no',
  'Pre-restart App PID: 1234',
  'App PID: 5678',
  'Captured logcat lines: 400',
  'UI hierarchy path: package.json',
  'Logcat path: package.json',
  'Screenshot path: package.json',
  'Screenshot bytes: 1234',
].join('\n');

assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
  }).length === 0,
  'Camera/QR readiness fixtures must pass',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
    includeAndroidSmoke: true,
    androidSmokeSummaryText: androidSmokeSummary,
  }).length === 0,
  'Camera/QR readiness fixtures with Android smoke must pass',
);
const releaseReadinessErrors = getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
    includeAndroidReleaseSmoke: true,
    androidReleaseSmokeSummaryText: androidReleaseSmokeSummary,
    androidReleaseCreateWalletSummaryText: androidReleaseCreateWalletSummary,
    androidReleaseSmokeExpectedApkPath: fixtureApkPath,
    androidReleaseSmokeExpectedSourceApkPath: fixtureApkPath,
    androidReleaseCreateWalletExpectedApkPath: fixtureApkPath,
  });
assert(
  releaseReadinessErrors.length === 0,
  `Camera/QR readiness fixtures with Android release smoke must pass:\n${releaseReadinessErrors.join('\n')}`,
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
    includeAndroidSmoke: true,
    androidSmokeSummaryText: '',
  }).some(error => error.includes('Android smoke summary is missing')),
  'Camera/QR readiness must require Android smoke summary when requested',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
    includeAndroidSmoke: true,
    androidSmokeSummaryText: androidSmokeSummary.replace('Validated QR scanner screen: yes', 'Validated QR scanner screen: no'),
  }).some(error => error.includes('Android smoke summary is invalid')),
  'Camera/QR readiness must reject invalid Android smoke evidence when requested',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
    includeAndroidReleaseSmoke: true,
    androidReleaseSmokeSummaryText: '',
    androidReleaseCreateWalletSummaryText: androidReleaseCreateWalletSummary,
    androidReleaseSmokeExpectedApkPath: fixtureApkPath,
    androidReleaseSmokeExpectedSourceApkPath: fixtureApkPath,
    androidReleaseCreateWalletExpectedApkPath: fixtureApkPath,
  }).some(error => error.includes('Android release smoke summary is missing')),
  'Camera/QR readiness must require Android release smoke summary when requested',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
    includeAndroidReleaseSmoke: true,
    androidReleaseSmokeSummaryText: androidReleaseSmokeSummary,
    androidReleaseCreateWalletSummaryText: '',
    androidReleaseSmokeExpectedApkPath: fixtureApkPath,
    androidReleaseSmokeExpectedSourceApkPath: fixtureApkPath,
    androidReleaseCreateWalletExpectedApkPath: fixtureApkPath,
  }).some(error => error.includes('Android release create-wallet smoke summary is missing')),
  'Camera/QR readiness must require Android release create-wallet smoke summary when requested',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
    includeAndroidReleaseSmoke: true,
    androidReleaseSmokeSummaryText: androidReleaseSmokeSummary.replace('Validated QR scanner screen: yes', 'Validated QR scanner screen: no'),
    androidReleaseCreateWalletSummaryText: androidReleaseCreateWalletSummary,
    androidReleaseSmokeExpectedApkPath: fixtureApkPath,
    androidReleaseSmokeExpectedSourceApkPath: fixtureApkPath,
    androidReleaseCreateWalletExpectedApkPath: fixtureApkPath,
  }).some(error => error.includes('Android release smoke summary is invalid')),
  'Camera/QR readiness must reject invalid Android release smoke evidence when requested',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: migrationSummary,
    includeAndroidReleaseSmoke: true,
    androidReleaseSmokeSummaryText: androidReleaseSmokeSummary,
    androidReleaseCreateWalletSummaryText: androidReleaseCreateWalletSummary.replace('Vault next-step reached: yes', 'Vault next-step reached: no'),
    androidReleaseSmokeExpectedApkPath: fixtureApkPath,
    androidReleaseSmokeExpectedSourceApkPath: fixtureApkPath,
    androidReleaseCreateWalletExpectedApkPath: fixtureApkPath,
  }).some(error => error.includes('Android release create-wallet smoke summary is invalid')),
  'Camera/QR readiness must reject invalid Android release create-wallet smoke evidence when requested',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: '',
    migrationSummaryText: migrationSummary,
  }).some(error => error.includes('Camera candidate summary is missing')),
  'Camera/QR readiness must reject missing candidate summary',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: 'CameraKit latest: react-native-camera-kit@18.0.0',
    migrationSummaryText: migrationSummary,
  }).some(error => error.includes('Camera candidate summary is invalid')),
  'Camera/QR readiness must reject partial candidate summary',
);
assert(
  getCameraQrValidationReadinessErrors({
    candidateSummaryText: candidateSummary,
    migrationSummaryText: 'Camera QR migration baseline stable: yes',
  }).some(error => error.includes('Camera QR migration summary is invalid')),
  'Camera/QR readiness must reject partial migration summary',
);

console.log('Camera/QR validation handoff guard checks are valid.');
