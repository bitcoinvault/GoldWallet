# Android Warning Baseline Follow-ups

This document tracks targeted Android Gradle warning sources on the current RN `0.87.0` modernization baseline.

Checked on: 2026-07-15

## Current Baseline

- `Targeted Android Gradle warnings: 0`
- `Unexpected targeted Android Gradle warnings: 0`

No targeted Android Gradle warning sources remain.

The final tracked warning source, `react-native-secure-key-store`, remains removed. `BEM-37.973` replaces its unsafe fallback-free posture with a first-party read/remove-only migration bridge: Android historical PIN, transaction-password, encrypted-flag, and wallet-data migration is validated, while iOS runtime migration and rollout adoption still block removal of the bridge.

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
