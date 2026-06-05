# Secure-storage Migration Plan

This plan covers the staged secure-storage migration from `react-native-secure-key-store` to `react-native-keychain`.

Checked on: 2026-05-29

## Current State

- New package: `react-native-keychain@10.0.0`.
- Legacy package: `react-native-secure-key-store@2.0.10`, retained temporarily for fallback reads and cleanup while existing installs migrate.
- Runtime wrapper: `src/services/SecureStorageService.ts`.
- Stored keys: `CONST.pin` and `CONST.transactionPassword`.
- The transaction password is stored as `sha256(value).toString()`.
- The current Android accessibility mode is `ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- Keychain is the only write target for new PIN, transaction-password, and encrypted wallet storage values.
- Legacy fallback reads now return the legacy value even if a one-off migration write into Keychain fails.
- Keychain-primary reads are covered by focused unit tests so existing migrated secure values do not unnecessarily touch the legacy backend.
- Transaction-password verification is covered for both matching and non-matching candidate passwords.
- Legacy removal readiness: not ready while legacy fallback reads are still active.

## Decision

Do not remove `react-native-secure-key-store` as warning-only cleanup.

This dependency protects app unlock, transaction-password behavior, and legacy wallet storage for existing installs. The migration path must preserve the wrapper API, read legacy values, migrate them into Keychain, and avoid writing new values back into the legacy backend. A later release can remove the legacy backend after migrated data has been validated without fallback reads.

Existing installs may still have PIN, transaction password, and encrypted wallet buckets in the legacy backend, so removal stays blocked until those migrated secure values are validated without fallback reads.

`secure-storage:migration:audit` and `secure-storage:removal-readiness:audit` must keep reporting `Legacy secure-storage removal ready: no` / `Legacy package removal ready: no` until a separate release-validation branch proves migrated PIN, transaction-password, and encrypted wallet data without the legacy backend.

Branch: `feature/bem-37-secure-storage-keychain-migration`

## Required Validation

- `corepack yarn secure-storage:migration:audit`
- `corepack yarn secure-storage:migration:check-summary`
- `corepack yarn secure-storage:removal-readiness:audit`
- `corepack yarn secure-storage:removal-readiness:check-summary`
- `corepack yarn check:secure-storage-removal-readiness-summary-guard`
- `corepack yarn test:storage-network:focused`, including `test:secure-storage:unit` before storage, authenticator, and wallet-core offline checks.
- Focused fallback regression coverage for failed Keychain migration writes in `SecureStorageService` and `AppStorage`.
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
