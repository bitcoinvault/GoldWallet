# Secure-storage Migration Plan

This document records the completed migration from `react-native-secure-key-store` to `react-native-keychain`.

Checked on: 2026-07-15

## Current State

- `react-native-keychain@10.0.0` is the only secure-storage backend.
- `react-native-secure-key-store` and `src/services/LegacySecureKeyStore.ts` are removed.
- `src/services/SecureStorageService.ts` stores the PIN and transaction-password hash in Keychain.
- `class/app-storage.js` stores encrypted wallet buckets in Keychain.
- Android accessibility remains `ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- Missing or unreadable values preserve the existing empty-value contracts.
- New writes, reads, and removal operations are covered by focused unit and integration tests.
- Historical upgrade-in-place evidence proves that legacy-only PIN, transaction password, and encrypted wallet data migrated to Keychain, survived installation of a fallback-free release, and remained usable.
- The legacy Android Gradle warning source is no longer expected.

## Decision

Keep the runtime Keychain-only. Do not restore the legacy dependency, native adapter, fallback reads, cleanup path, or fallback instrumentation.

Historical migration proof remains committed as a guarded evidence contract. Reproducing the original legacy seed requires the historical baseline APK or an older checkout; the current dependency graph intentionally cannot build a legacy-backed application.

## Required Validation

- `corepack yarn check:secure-storage-legacy-removal`
- `corepack yarn check:secure-storage-migration-summary-guard`
- `corepack yarn secure-storage:migration:audit`
- `corepack yarn secure-storage:migration:check-summary`
- `corepack yarn check:secure-storage-removal-readiness-summary-guard`
- `corepack yarn secure-storage:removal-readiness:audit`
- `corepack yarn secure-storage:removal-readiness:check-summary`
- `corepack yarn check:secure-storage-release-validation-handoff-guard`
- `corepack yarn secure-storage:release-validation:handoff:dry-run`
- `corepack yarn check:secure-storage-release-validation-summary-guard`
- `corepack yarn secure-storage:release-validation:summary`
- `corepack yarn secure-storage:release-validation:check-summary`
- `corepack yarn test:storage-network:focused`
- Android debug and release builds.
- Upgrade-in-place from the retained historical baseline APK without clearing app data.
- Android production release smoke on the emulator, including startup, PIN, wallet persistence, and fatal/runtime logcat checks.

## Platform Notes

Android runtime validation is required for this milestone. On Windows, iOS validation is limited to static guards; Pod installation and runtime verification remain a macOS/Xcode handoff.

Branch: `feature/bem-37-904-secure-storage-removal`
