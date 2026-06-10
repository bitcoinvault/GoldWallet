import {
  getSecureStorageReleaseValidationCommands,
  getSecureStorageReleaseValidationHandoffErrors,
  getSecureStorageReleaseValidationReadinessErrors,
  renderSecureStorageReleaseValidationCommand,
} from './runSecureStorageReleaseValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const fullCommands = getSecureStorageReleaseValidationCommands({ skipAndroidSmoke: false });
const fullRendered = fullCommands.map(renderSecureStorageReleaseValidationCommand).join('\n');
const skippedCommands = getSecureStorageReleaseValidationCommands({ skipAndroidSmoke: true });
const skippedRendered = skippedCommands.map(renderSecureStorageReleaseValidationCommand).join('\n');

[
  'corepack yarn secure-storage:migration:audit',
  'corepack yarn secure-storage:migration:check-summary',
  'corepack yarn secure-storage:removal-readiness:audit',
  'corepack yarn secure-storage:removal-readiness:check-summary',
  'corepack yarn test:secure-storage:unit',
  'corepack yarn test:storage',
  'corepack yarn test:authenticator',
  'corepack yarn test:wallet-core:offline',
  'corepack yarn android:dev:verify',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected secure-storage handoff commands to include: ${expected}`);
});

assert(
  !skippedRendered.includes('android:dev:verify'),
  'Skipped secure-storage handoff must omit Android dev build and emulator smoke',
);
assert(
  skippedRendered.includes('corepack yarn test:secure-storage:unit'),
  'Skipped secure-storage handoff must still run focused secure-storage tests',
);
assert(
  skippedCommands[skippedCommands.length - 1].args.includes('test:wallet-core:offline'),
  'Skipped secure-storage handoff must end with offline wallet core validation',
);
assert(
  fullCommands[fullCommands.length - 1].args.includes('android:dev:verify'),
  'Full secure-storage handoff must end with Android dev build and emulator smoke',
);
assert(
  getSecureStorageReleaseValidationHandoffErrors({ skipAndroidSmoke: 'false' }).some(error =>
    error.includes('skipAndroidSmoke must be a boolean'),
  ),
  'Invalid skipAndroidSmoke option must be rejected',
);

const readyMigrationSummary = [
  'Keychain primary write: yes',
  'Legacy secure-storage writes disabled: yes',
  'Legacy secure-storage fallback reads active: yes',
  'Secure-storage migration baseline stable: yes',
].join('\n');
const blockedRemovalSummary = [
  'Removal release validation claimed: no',
  'Legacy package removal ready: no',
  'Required action: keep react-native-secure-key-store installed until release validation is claimed for migrated secure values.',
].join('\n');

const readyAndroidSmokeSummary = [
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Android smoke outcome: passed',
  'Android smoke exit code: 0',
  'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Android package: io.goldwallet.wallet.dev',
  'Android activity: io.goldwallet.wallet.dev/io.goldwallet.wallet.MainActivity',
  'Artifact base: android-smoke-dev',
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
  'UI hierarchy attempts: 1',
  'UI hierarchy path: package.json',
  'Screenshot path: package.json',
  'Screenshot bytes: 1234',
].join('\n');

assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: blockedRemovalSummary,
    androidSmokeSummary: readyAndroidSmokeSummary,
  }).length === 0,
  'Secure-storage readiness fixture must pass while removal remains unclaimed',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary.replace('Legacy secure-storage fallback reads active: yes', 'Legacy secure-storage fallback reads active: no'),
    removalSummary: blockedRemovalSummary,
    androidSmokeSummary: readyAndroidSmokeSummary,
  }).some(error => error.includes('Legacy secure-storage fallback reads active: yes')),
  'Secure-storage readiness check must require active fallback reads before removal is claimed',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: blockedRemovalSummary.replace('Legacy package removal ready: no', 'Legacy package removal ready: yes'),
    androidSmokeSummary: readyAndroidSmokeSummary,
  }).some(error => error.includes('Legacy package removal ready: no')),
  'Secure-storage readiness check must reject premature legacy package removal claims',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: blockedRemovalSummary,
    androidSmokeSummary: '',
  }).some(error => error.includes('Android dev smoke summary is missing')),
  'Secure-storage readiness check must report missing Android dev smoke summary',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: blockedRemovalSummary,
    androidSmokeSummary: readyAndroidSmokeSummary.replace('Validated empty-tab navigation: yes', 'Validated empty-tab navigation: no'),
  }).some(error => error.includes('Android dev smoke summary is invalid')),
  'Secure-storage readiness check must reject invalid Android dev smoke evidence',
);

console.log('Secure-storage release validation handoff guard checks are valid.');
