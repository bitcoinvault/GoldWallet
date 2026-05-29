# Android Warning Baseline Follow-ups

This document tracks the remaining Android Gradle warning sources after the RN `0.76.9` cleanup stream.

Checked on: 2026-05-29

## Current Baseline

The latest local warning audit reports:

- `Targeted Android Gradle warnings: 2`
- `Unexpected targeted Android Gradle warnings: 0`

Remaining targeted sources:

| Package | Warning source | Follow-up |
| --- | --- | --- |
| `@react-native-community/masked-view` | `node_modules/@react-native-community/masked-view/android/build.gradle:47` | dedicated masked-view/navigation migration |
| `react-native-secure-key-store` | `node_modules/react-native-secure-key-store/android/build.gradle:46` | dedicated secure-storage removal after dual-write migration |

## Decisions

- Do not patch `node_modules` to hide these warnings.
- `react-native-camera` was removed in the CameraKit QR scanner migration branch; keep future scanner changes under the guarded QR screen contract.
- Do not swap `@react-native-community/masked-view` to `@react-native-masked-view/masked-view` until navigation headers and stack transitions are validated. The current `@react-navigation/stack` package still requires the community package path.
- Do not remove `react-native-secure-key-store` in the same release that introduces `react-native-keychain`; keep the legacy backend for fallback and dual-write migration first.

## Validation

Use this quick gate when the baseline changes:

```powershell
corepack yarn android:dev:audit-warnings
corepack yarn android:dev:check-warning-audit-summary
corepack yarn check:android-remaining-warning-plan
```

Any branch that removes one of the remaining warning sources must update this document, `scripts/androidWarningBaselineGuard.mjs`, `docs/wallet-modernization-log.md`, and the relevant compatibility audit in the same mini-branch.
