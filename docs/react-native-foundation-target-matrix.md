# React Native Foundation Target Matrix

This matrix defines how to move the app foundation forward without upgrading every dependency one by one.

## Current Baseline

- React Native: `0.86.0`
- React: `19.2.3`
- RN Babel preset: `0.86.0`
- RN Metro config: `0.86.0`
- Metro/dev Node runtime: `24.16.0`
- Android compile SDK: `36`
- Android target SDK: `36`
- Android Gradle Plugin: `8.13.2`
- Gradle wrapper: `8.13`

## Latest Snapshot

- npm `react-native@latest`: `0.86.0`
- npm `react-native@next`: `0.86.0-rc.3`
- `react-native@0.86.0` peer React: `^19.2.3`
- `react-native@0.86.0` Node engine: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`
- Snapshot refreshed: `2026-06-10`
- `react-native@next` is currently a prerelease channel and is not the default wallet target.

## Milestone Jump Strategy

Do not walk every RN minor version. Use milestone jumps and validate each one as a full app foundation branch.

### Milestone A: RN 0.85.3 Foundation

- Target React Native: `0.85.3`
- React peer: `^19.2.3`
- `@types/react` peer: `^19.2.3`
- Node engine: `>=20.19.4`

Status:

- This is the previous completed foundation checkpoint.
- It moved the app beyond the old RN 0.68 baseline and onto the React 19 runtime line required by the RN `0.85.3` checkpoint.
- It moved the app to a newer Metro/Babel/runtime family that should unlock more modern package syntax and exports than the old RN 0.68 baseline.

Expected branch scope:

- React Native, React, React Test Renderer, React types.
- Metro/Babel preset/runtime packages required by RN 0.85.
- Node dev runtime move from 16/22 to 24 LTS for this branch.
- Android template, Gradle, Kotlin, AGP, manifest, New Architecture, and native autolinking changes required by RN 0.85.
- iOS Podfile/template drift documented separately if it cannot be validated on this Windows machine.

### Milestone B: RN 0.86.0 Latest Foundation

- Target React Native: `0.86.0`
- React peer: `^19.2.3`
- Node engine: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`

Why:

- RN `0.86.0` is now npm `latest`, so it is the next latest-first foundation target rather than a prerelease spike.
- Keep React pinned to `19.2.3` while the bundled React Native renderer reports `react-native-renderer: 19.2.3`.
- Keep this as a package/template foundation branch with Android assemble and emulator smoke proof before treating it as the current wallet baseline.

Status:

- This is now the current foundation checkpoint.
- It keeps React pinned to `19.2.3` and records AGP 9 / Gradle 9 as blocked until a future React Native Gradle plugin baseline clears the Kotlin metadata path.

### Milestone C: Future current line

- Target React Native: future current stable line after the next baseline has been proven.
- React peer: checked from the future stable RN package at branch time.
- Node engine: checked from the future stable RN package at branch time.

Why:

- This is the next destination after Milestone B has a stable package target and has been proven in the wallet.
- Treat future RN lines as full foundation branches, not package-only React/RN edits.

## Validation Gates

Every foundation milestone needs:

- Live `corepack yarn rn:target-snapshot:current` evidence when network access is available.
- Aggregate `corepack yarn foundation:target:check-summaries` evidence after live RN, direct-outdated, git-dependency, wallet/crypto, tooling, Android-toolchain, BL, and node-fetch summaries have been refreshed.
- `corepack yarn rn:baseline:preflight` before package changes.
- Package install and postinstall shim verification.
- TypeScript check.
- Android assemble using JDK 17 unless the milestone explicitly changes the Android build JDK requirement.
- Metro restart with `--reset-cache`.
- Android emulator smoke.
- Logcat check for AndroidRuntime, React Native JS/runtime, and bundle errors.

## Practical Rule

If a milestone fails, do not fall back to one-minor-at-a-time automatically. First isolate the blocker. Then choose either:

- a small prerequisite branch that removes the blocker, or
- the nearest lower milestone that still provides a meaningful foundation jump.
