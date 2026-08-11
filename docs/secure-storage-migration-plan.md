# Secure-storage Migration Plan

This document records the controlled migration from `react-native-secure-key-store` to `react-native-keychain`.

Checked on: 2026-08-11

## Current State

- `react-native-keychain@10.0.0` is the primary backend for all current writes.
- `react-native-secure-key-store` and `src/services/LegacySecureKeyStore.ts` are removed.
- A first-party read/remove-only bridge preserves the historical Android `secret_shared_prefs` schema and iOS `RNSecureKeyStoreKeyChain` schema during the rollout window.
- `src/services/SecureStorageService.ts` stores the PIN and transaction-password hash in Keychain.
- `class/app-storage.js` stores encrypted wallet buckets in Keychain.
- Android accessibility remains `ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- A confirmed Keychain miss may use legacy fallback. A Keychain read error never reads or rewrites legacy data, preventing stale values from overwriting newer Keychain state.
- New writes remain Keychain-only. Legacy values are removed only after a successful Keychain write; a migration-write failure returns the legacy value without deleting it.
- Explicit deletion writes an authoritative Keychain deletion marker before legacy cleanup. If legacy cleanup fails, the marker remains and prevents the old PIN, transaction password, encryption flag, or wallet data from being restored. Factory reset awaits both secure-storage deletions before resetting state and exiting.
- Focused unit and integration tests cover Keychain-first reads, confirmed-miss fallback, failed-read isolation, migration-write failure, cleanup failure, deletion-marker behavior, and awaited factory reset.
- The 2026-08-11 Android upgrade-in-place validation installed the current `prodRelease` over a retained historical legacy-only APK without clearing data. PIN, transaction-password hash, encrypted flag, and wallet data migrated and were removed from the historical store; the wallet remained accessible after storage-password and PIN verification.
- The runtime summary is fail-closed against stale evidence: it records a unique run ID, candidate APK SHA-256, and a deterministic SHA-256 of migration source/build inputs. Resume requires a matching checkpoint and verifies the APK currently installed on the emulator against the historical seed hash.
- The legacy Android Gradle warning source is no longer expected.

## Decision

Keep Keychain as the only write backend and keep the first-party migration bridge active through a validated cross-platform rollout window. Do not restore the third-party dependency or legacy writes.

Do not remove fallback reads yet. Android migration is proven locally, but iOS migration runtime and deployment/adoption of a migration-window release are not proven. Reproducing the Android seed requires the ignored historical APK supplied through `ANDROID_SECURE_STORAGE_HISTORICAL_SEED_APK`.

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
- `corepack yarn check:secure-storage-first-party-migration-summary-guard`
- `corepack yarn secure-storage:first-party-migration:verify`
- `corepack yarn secure-storage:first-party-migration:check-summary`
- `corepack yarn test:storage-network:focused`
- Android debug and release builds.
- Upgrade-in-place from the retained historical baseline APK without clearing app data.
- Android production release smoke on the emulator, including startup, PIN, wallet persistence, and fatal/runtime logcat checks.

## Platform Notes

Android runtime validation is required for this milestone. On Windows, iOS validation is limited to static guards; Pod installation, simulator/archive validation, and an upgrade from an app containing the historical iOS Keychain item remain a macOS/Xcode handoff. Fallback removal remains blocked until that proof and migration-release deployment/adoption evidence exist.

Branch: `feature/bem-37-973-secure-storage-rollout-safety`
