# Android Warning Baseline Follow-ups

This document tracks the remaining Android Gradle warning sources after the RN `0.85.3` baseline proof and cleanup stream.

Checked on: 2026-06-03

## Current Baseline

The latest local warning audit reports:

- `Targeted Android Gradle warnings: 1`
- `Unexpected targeted Android Gradle warnings: 0`

Remaining targeted sources:

| Package | Warning source | Follow-up |
| --- | --- | --- |
| `react-native-secure-key-store` | `node_modules/react-native-secure-key-store/android/build.gradle:46` | dedicated secure-storage removal after legacy fallback migration validation |

## Decisions

- Do not patch `node_modules` to hide these warnings.
- `react-native-camera` was removed in the CameraKit QR scanner migration branch; keep future scanner changes under the guarded QR screen contract.
- `@react-native-community/masked-view` was removed by the React Navigation 7 migration proof; keep future navigation changes guarded by dashboard, tab, stack, modal, and back-navigation smoke checks.
- Do not remove `react-native-secure-key-store` until a release validates migrated secure values without the fallback backend; new writes no longer dual-write to the legacy store, but fallback reads still protect existing installs. The 2026-06-03 secure-storage readiness refresh keeps this as the only targeted Android warning source.
- Before a future branch removes this final warning source, run `corepack yarn secure-storage:release-validation:handoff` and keep the removal-readiness summary explicit. The handoff validates the current staged migration posture but still does not mark the legacy package as removable while fallback reads are active.

## Validation

Use this quick gate when the baseline changes:

```powershell
corepack yarn android:dev:audit-warnings
corepack yarn android:dev:check-warning-audit-summary
corepack yarn check:android-remaining-warning-plan
corepack yarn check:secure-storage-release-validation-handoff-guard
```

Any branch that removes one of the remaining warning sources must update this document, `scripts/androidWarningBaselineGuard.mjs`, `docs/wallet-modernization-log.md`, and the relevant compatibility audit in the same mini-branch.
