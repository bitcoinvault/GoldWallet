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
  'corepack yarn android:dev:env-audit',
  'corepack yarn android:dev:assemble',
  'corepack yarn android:dev:smoke:embedded',
  'corepack yarn android:dev:check-smoke-summary',
].forEach(expected => {
  assert(fullRendered.includes(expected), `Expected secure-storage handoff commands to include: ${expected}`);
});

assert(
  !skippedRendered.includes('android:dev:env-audit') &&
    !skippedRendered.includes('android:dev:assemble') &&
    !skippedRendered.includes('android:dev:smoke:embedded') &&
    !skippedRendered.includes('android:dev:check-smoke-summary'),
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
  fullCommands[fullCommands.length - 1].args.includes('android:dev:check-smoke-summary'),
  'Full secure-storage handoff must end with Android smoke summary validation',
);
assert(
  getSecureStorageReleaseValidationHandoffErrors({ skipAndroidSmoke: 'false' }).some(error =>
    error.includes('skipAndroidSmoke must be a boolean'),
  ),
  'Invalid skipAndroidSmoke option must be rejected',
);

const partialReadyMigrationSummary = [
  'Keychain primary write: yes',
  'Legacy secure-storage fallback reads active: yes',
  'Legacy third-party runtime removed: yes',
  'First-party migration bridge active: yes',
  'Secure-storage migration baseline stable: yes',
].join('\n');

const readyMigrationSummary = [
  'Secure-storage migration audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Current secure-storage package: react-native-keychain@10.0.0',
  'Legacy secure-storage package: <removed>',
  'SecureStorageService file: src/services/SecureStorageService.ts',
  'AppStorage secure-storage file: class/app-storage.js',
  'Stores PIN: yes',
  'Stores transaction password hash: yes',
  'Keychain primary write: yes',
  'Legacy secure-storage fallback reads active: yes',
  'Legacy third-party runtime removed: yes',
  'First-party migration bridge active: yes',
  'Focused validation script: test:storage-network:focused',
  'Focused validation command: yarn test:secure-storage:unit && yarn test:storage && yarn test:authenticator && yarn test:wallet-core:offline',
  'Secure-storage migration baseline stable: yes',
  'Errors: 0',
  'Required action: keep the first-party migration bridge through a validated cross-platform rollout window.',
].join('\n');

const partialBlockedRemovalSummary = [
  'Removal release validation claimed: no',
  'Legacy package removal ready: yes',
  'Fallback removal ready: no',
  'Required action: ship and validate the cross-platform migration window before removing the first-party fallback bridge.',
].join('\n');

const blockedRemovalSummary = [
  'Secure-storage removal readiness audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Current secure-storage package: react-native-keychain@10.0.0',
  'Legacy secure-storage package: <removed>',
  'Current posture: Keychain primary with first-party legacy migration bridge',
  'Keychain primary write: yes',
  'Legacy fallback reads active: yes',
  'Legacy package absent: yes',
  'Legacy adapter absent: yes',
  'Keychain-only tests present: yes',
  'Historical legacy migration proof guarded: yes',
  'First-party migration bridge active: yes',
  'iOS migration runtime validated: no',
  'Migration release deployment confirmed: no',
  'Removal release validation claimed: no',
  'Android warning source still expected: no',
  'Legacy package removal ready: yes',
  'Fallback removal ready: no',
  'Errors: 0',
  'Required action: ship and validate the cross-platform migration window before removing the first-party fallback bridge.',
].join('\n');

const readyFirstPartyMigrationSummary = [
  'Secure-storage first-party migration validation',
  'Generated at: 2026-08-11T00:00:00.000Z',
  'Outcome: passed',
  'Exit code: 0',
  'Validation run id: 11111111-1111-4111-8111-111111111111',
  `Migration source sha256: ${'a'.repeat(64)}`,
  'Seed APK present: yes',
  'Candidate APK present: yes',
  `Candidate APK sha256: ${'b'.repeat(64)}`,
  'Seed wallet persisted: yes',
  'Candidate installed with adb install -r: yes',
  'Candidate uses first-party migration bridge: yes',
  'Candidate excludes third-party legacy package: yes',
  'PIN migrated and removed: yes',
  'Transaction password migrated and removed: yes',
  'Encrypted flag migrated and removed: yes',
  'Wallet data migrated and removed: yes',
  'Wallet accessible after candidate update: yes',
  'Incorrect PIN rejected after candidate update: yes',
  'Correct PIN accepted after candidate update: yes',
  'Storage password accepted after candidate update: yes',
  'Legacy cleanup evidence derived from runtime: yes',
  'Legacy fallback instrumentation observed: yes',
  'Fatal/runtime logcat findings: no',
  'Secret values printed: no',
  'Required action: keep the first-party migration bridge through a validated cross-platform rollout window.',
].join('\n');

const readyFirstPartyMigrationEvidence = {
  candidateApkSha256: 'b'.repeat(64),
  migrationSourceSha256: 'a'.repeat(64),
};

const readyAndroidSmokeSummary = [
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Android smoke outcome: passed',
  'Android smoke exit code: 0',
  'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android serial: emulator-5554',
  'Required runtime page size bytes: not required',
  'Runtime page size bytes: 4096',
  'Runtime page size check: not required',
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
  'Validated settings Terms WebView: yes',
  'UI hierarchy attempts: 1',
  'UI hierarchy path: package.json',
  'Screenshot path: package.json',
  'Screenshot bytes: 1234',
].join('\n');

const readyFixtureErrors = getSecureStorageReleaseValidationReadinessErrors({
  migrationSummary: readyMigrationSummary,
  removalSummary: blockedRemovalSummary,
  firstPartyMigrationSummary: readyFirstPartyMigrationSummary,
  androidSmokeSummary: readyAndroidSmokeSummary,
});

assert(
  readyFixtureErrors.length === 0,
  `Secure-storage readiness fixture must pass during the migration window:\n${readyFixtureErrors.map(error => `- ${error}`).join('\n')}`,
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: partialReadyMigrationSummary,
    removalSummary: blockedRemovalSummary,
    firstPartyMigrationSummary: readyFirstPartyMigrationSummary,
    androidSmokeSummary: readyAndroidSmokeSummary,
  }).some(error => error.includes('Secure-storage migration summary is invalid')),
  'Secure-storage readiness check must reject partial migration summaries',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: partialBlockedRemovalSummary,
    firstPartyMigrationSummary: readyFirstPartyMigrationSummary,
    androidSmokeSummary: readyAndroidSmokeSummary,
  }).some(error => error.includes('Secure-storage removal readiness summary is invalid')),
  'Secure-storage readiness check must reject partial removal readiness summaries',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary.replace('Legacy secure-storage fallback reads active: yes', 'Legacy secure-storage fallback reads active: no'),
    removalSummary: blockedRemovalSummary,
    firstPartyMigrationSummary: readyFirstPartyMigrationSummary,
    androidSmokeSummary: readyAndroidSmokeSummary,
  }).some(error => error.includes('Legacy secure-storage fallback reads active: yes')),
  'Secure-storage readiness check must reject removed fallback reads before rollout proof',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: blockedRemovalSummary.replace('Legacy package removal ready: yes', 'Legacy package removal ready: no'),
    firstPartyMigrationSummary: readyFirstPartyMigrationSummary,
    androidSmokeSummary: readyAndroidSmokeSummary,
  }).some(error => error.includes('Legacy package removal ready: yes')),
  'Secure-storage readiness check must reject removal readiness regression',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: blockedRemovalSummary,
    firstPartyMigrationSummary: readyFirstPartyMigrationSummary,
    androidSmokeSummary: '',
  }).some(error => error.includes('Android dev smoke summary is missing')),
  'Secure-storage readiness check must report missing Android dev smoke summary',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: blockedRemovalSummary,
    firstPartyMigrationSummary: readyFirstPartyMigrationSummary,
    androidSmokeSummary: readyAndroidSmokeSummary.replace('Validated empty-tab navigation: yes', 'Validated empty-tab navigation: no'),
  }).some(error => error.includes('Android dev smoke summary is invalid')),
  'Secure-storage readiness check must reject invalid Android dev smoke evidence',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: blockedRemovalSummary,
    firstPartyMigrationSummary: '',
    androidSmokeSummary: readyAndroidSmokeSummary,
  }).some(error => error.includes('first-party migration summary is missing')),
  'Secure-storage readiness check must report missing first-party migration proof',
);
assert(
  getSecureStorageReleaseValidationReadinessErrors({
    migrationSummary: readyMigrationSummary,
    removalSummary: blockedRemovalSummary,
    firstPartyMigrationSummary: readyFirstPartyMigrationSummary,
    expectedFirstPartyMigrationEvidence: {
      ...readyFirstPartyMigrationEvidence,
      migrationSourceSha256: 'c'.repeat(64),
    },
    androidSmokeSummary: readyAndroidSmokeSummary,
  }).some(error => error.includes('Migration source sha256 does not match')),
  'Secure-storage readiness check must reject stale first-party migration source evidence',
);
assert(
  getSecureStorageReleaseValidationCommands({ skipAndroidSmoke: true }).some(
    step => step.args.join(' ') === 'yarn secure-storage:first-party-migration:check-summary',
  ),
  'Secure-storage handoff command list must validate hash-bound first-party migration evidence',
);

console.log('Secure-storage release validation handoff guard checks are valid.');
