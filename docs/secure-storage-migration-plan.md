# Secure-storage Migration Plan

This plan covers the remaining `react-native-secure-key-store` Android `jcenter()` warning.

Checked on: 2026-05-29

## Current State

- Current package: `react-native-secure-key-store@2.0.10`.
- Replacement candidate: `react-native-keychain@10.0.0`.
- Runtime wrapper: `src/services/SecureStorageService.ts`.
- Stored keys: `CONST.pin` and `CONST.transactionPassword`.
- The transaction password is stored as `sha256(value).toString()`.
- The current Android accessibility mode is `ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY`.

## Decision

Do not replace `react-native-secure-key-store` as a warning-only cleanup.

This dependency protects app unlock and transaction-password behavior, so replacement must be a dedicated secure-storage branch with focused tests and emulator validation. The branch must preserve the wrapper API or migrate all call sites in one controlled step.

Branch: `feature/bem-secure-storage-keychain-migration`

## Required Validation

- `corepack yarn secure-storage:migration:audit`
- `corepack yarn secure-storage:migration:check-summary`
- `corepack yarn test:storage-network:focused`, including `test:secure-storage:unit` before storage, authenticator, and wallet-core offline checks.
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
