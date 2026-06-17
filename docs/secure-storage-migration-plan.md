# Secure-storage Migration Plan

This plan covers the staged secure-storage migration from `react-native-secure-key-store` to `react-native-keychain`.

Checked on: 2026-06-17

## Current State

- New package: `react-native-keychain@10.0.0`.
- Legacy package: `react-native-secure-key-store@2.0.10`, retained temporarily for fallback reads and cleanup while existing installs migrate.
- Runtime wrapper: `src/services/SecureStorageService.ts`.
- Legacy native adapter: `src/services/LegacySecureKeyStore.ts`, which routes fallback reads and cleanup through `NativeModules.RNSecureKeyStore` instead of direct `react-native-secure-key-store` imports in storage runtime files.
- Stored keys: `CONST.pin` and `CONST.transactionPassword`.
- The transaction password is stored as `sha256(value).toString()`.
- The current Android accessibility mode is `ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- Keychain is the only write target for new PIN, transaction-password, and encrypted wallet storage values.
- Legacy fallback reads now return the legacy value even if a one-off migration write into Keychain or a post-migration legacy cleanup fails.
- Empty legacy fallback results are normalized to the current missing-value contracts: `SecureStorageService` returns an empty string and encrypted wallet storage returns `null`.
- Empty legacy fallback results are also covered after a Keychain read failure, so a temporary Keychain read error plus an empty legacy backend does not turn into a migrated empty value or a cleanup attempt.
- After a legacy value is successfully written into Keychain, the app attempts to remove the migrated legacy value from `react-native-secure-key-store`.
- Legacy fallback entry, migration success, migration-write failure, and cleanup failure are recorded through secret-safe `secure-storage-migration` breadcrumbs without logging keys or stored values.
- Secret-safe fallback instrumentation is covered for both secure PIN/transaction-password storage and encrypted wallet bucket storage, so migration breadcrumbs cannot include stored keys or values.
- Keychain-primary reads are covered by focused unit tests so existing migrated secure values do not unnecessarily touch the legacy backend.
- Transaction-password verification is covered for both matching and non-matching candidate passwords.
- Legacy removal readiness: not ready while legacy fallback reads are still active.
- The 2026-06-17 release-validation summary reports migration and removal-readiness summaries valid, Android dev smoke evidence present/valid, release startup smoke present/valid, release create-wallet smoke present/valid, focused secure-storage/storage/authenticator/wallet-core contracts passing, `Secure-storage release validation evidence ready: yes`, and `Android release evidence ready: yes`. Focused fallback-free tests now cover migrated PIN, transaction-password hash verification, and encrypted wallet bucket loading from Keychain without touching the legacy backend; legacy package removal still remains blocked because fallback reads are active and package removal is not claimed.

## Decision

Do not remove `react-native-secure-key-store` as warning-only cleanup.

This dependency protects app unlock, transaction-password behavior, and legacy wallet storage for existing installs. The migration path must preserve the wrapper API, read legacy values, migrate them into Keychain, and avoid writing new values back into the legacy backend. A later release can remove the legacy backend after migrated data has been validated without fallback reads.

Existing installs may still have PIN, transaction password, and encrypted wallet buckets in the legacy backend, so removal stays blocked until those migrated secure values are validated without fallback reads.
Successful read-time migrations now also attempt to clean the migrated legacy key, but this does not make package removal safe by itself because some users may not have opened every encrypted bucket or secure value yet.

`secure-storage:migration:audit` and `secure-storage:removal-readiness:audit` must keep reporting `Legacy secure-storage removal ready: no` / `Legacy package removal ready: no` until a separate release-validation branch proves migrated PIN, transaction-password, and encrypted wallet data without the legacy backend.

`secure-storage:release-validation:handoff` is the guarded validation sequence for the release-candidate step before any later legacy-package removal branch. It refreshes the migration/removal summaries, runs the focused secure-storage/storage/authenticator/wallet-core checks, and runs Android dev build plus emulator smoke unless `--skip-android-smoke` is explicitly used for summary/test-only refreshes.

The release-validation handoff still does not claim `react-native-secure-key-store` removal readiness; it proves the current staged migration posture and keeps the package installed until migrated values are validated without fallback reads.

Current release-validation posture checked on 2026-06-17:

- `react-native-keychain@10.0.0` remains the primary write backend.
- `react-native-secure-key-store@2.0.10` remains installed for fallback reads and post-migration cleanup.
- Keychain primary writes, legacy fallback reads, legacy-write disablement, and legacy cleanup after successful migration are all guarded.
- Secret-safe legacy fallback instrumentation is guarded so a future removal decision can distinguish "fallback no longer observed" evidence from a warning-only cleanup.
- Secret-safe fallback instrumentation tests are guarded for both `SecureStorageService` and encrypted wallet `AppStorage` so fallback telemetry can be used without exposing stored keys or values.
- Fallback-free Keychain reads are guarded for migrated PIN, transaction-password hash verification, and encrypted wallet bucket loading without invoking `react-native-secure-key-store`.
- Legacy native-module absence is guarded for secure PIN/transaction-password storage and encrypted wallet storage cleanup/read fallback paths, so a future removal branch can fail closed instead of crashing the JS bundle path.
- Release-mode startup and create-wallet smoke evidence is now surfaced by the secure-storage release-validation summary when local release artifacts are present; this proves the current staged migration posture in the locally signed `devRelease` APK without making legacy package removal ready.
- Removal release validation is not claimed and `Legacy package removal ready` remains `no`.
- Required action remains: keep `react-native-secure-key-store` installed until fallback-free validation is claimed for migrated PIN, transaction-password, and encrypted wallet data.
- The 2026-06-17 release-mode evidence refresh after the `LegacySecureKeyStore` adapter rebuilt all Android release variants, installed the locally signed `devRelease` APK on `emulator-5554`, completed first-run PIN and transaction-password setup without Metro, and validated standard-wallet plus default 3-key vault creation screens without fatal/runtime logcat findings.

Branch: `feature/bem-37-secure-storage-keychain-migration`

## Required Validation

- `corepack yarn secure-storage:migration:audit`
- `corepack yarn secure-storage:migration:check-summary`
- `corepack yarn secure-storage:removal-readiness:audit`
- `corepack yarn secure-storage:removal-readiness:check-summary`
- `corepack yarn check:secure-storage-removal-readiness-summary-guard`
- `corepack yarn check:secure-storage-release-validation-handoff-guard`
- `corepack yarn secure-storage:release-validation:handoff:dry-run`
- `corepack yarn secure-storage:release-validation:handoff`
- `corepack yarn test:storage-network:focused`, including `test:secure-storage:unit` before storage, authenticator, and wallet-core offline checks.
- Focused fallback regression coverage for failed Keychain migration writes in `SecureStorageService` and `AppStorage`.
- Focused empty-fallback coverage for `null` and `undefined` legacy native results in `SecureStorageService` and `AppStorage`.
- Focused Keychain-read-failure plus empty-fallback coverage for `null` and `undefined` legacy native results in `SecureStorageService` and `AppStorage`.
- Focused fallback instrumentation coverage for secret-safe `secure-storage-migration` breadcrumbs in `SecureStorageService` and `AppStorage`.
- Focused fallback-free Keychain coverage for migrated PIN, transaction-password hash verification, and encrypted wallet bucket loading without touching the legacy secure-storage backend.
- Focused legacy-native-module-unavailable coverage for `SecureStorageService` and `AppStorage`.
- `secure-storage:removal-readiness:audit` must report both `SecureStorageService fallback migration tests present: yes` and `AppStorage fallback migration tests present: yes`; a single aggregate fallback-test line is not enough to prove encrypted wallet storage migration coverage.
- `corepack yarn android:dev:check-light`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restart with `--reset-cache`
- Android emulator smoke

Manual Android checks:

- App starts to dashboard.
- PIN creation and unlock still work.
- Transaction-password creation and unlock still work.
- Factory reset removes secure values.
- Logcat has no React Native runtime error and no `AndroidRuntime` crash.
