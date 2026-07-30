# Android Warning Baseline Follow-ups

This document tracks targeted Android Gradle warning sources after the RN `0.86.2` modernization stream.

Checked on: 2026-07-15

## Current Baseline

- `Targeted Android Gradle warnings: 0`
- `Unexpected targeted Android Gradle warnings: 0`

No targeted Android Gradle warning sources remain.

The final tracked source, `react-native-secure-key-store`, was removed after the historical legacy-only migration proof validated PIN, transaction-password, encrypted-flag, and wallet-data migration into Keychain followed by an upgrade to a fallback-free release.

## Decisions

- Keep `scripts/androidWarningBaselineGuard.mjs` strict: no targeted warning source is accepted as known debt.
- Do not patch `node_modules` to hide future findings.
- Any new targeted warning must be fixed or documented in a dedicated branch before the baseline changes.
- Keep `corepack yarn check:secure-storage-legacy-removal` in the Android lightweight gate so the removed legacy package and fallback cannot return unnoticed.

## Validation

```powershell
corepack yarn android:dev:audit-warnings
corepack yarn android:dev:check-warning-audit-summary
corepack yarn check:android-remaining-warning-plan
corepack yarn check:secure-storage-legacy-removal
```
