# React Native Foundation Target Matrix

This matrix defines how to move the app foundation forward without upgrading every dependency one by one.

## Current Baseline

- React Native: `0.87.0`
- React: `19.2.3`
- RN Babel preset: `0.87.0`
- RN Metro config: `0.87.0`
- Metro/dev Node runtime: `24.16.0`
- Android compile SDK: `37`
- Android target SDK: `36`
- Android Gradle Plugin: `9.2.1`
- Gradle wrapper: `9.4.1`

## Latest Snapshot

- npm `react-native@latest`: `0.87.0`
- npm `react-native@next`: `0.87.0-rc.4`
- npm `react-native@nightly` last observed: `0.88.0-nightly-20260810-8415753e2`
- `react-native@0.87.0` peer React: `^19.2.3`
- `react-native@0.87.0` Node engine: `^22.13.0 || ^24.3.0 || >= 26.0.0`
- Snapshot recorded: `2026-08-11`
- Latest live verification: `2026-08-11`, outcome `matched`, mismatches `0`
- `react-native@next` is currently a prerelease channel and is not the default wallet target.
- Exact nightly drift is informational; the live gate enforces the nightly prerelease tag shape without requiring a daily snapshot commit.

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

### Milestone B: RN 0.86.2 Latest Foundation

- Target React Native: `0.86.2`
- React peer: `^19.2.3`
- Node engine: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`

Why:

- RN `0.86.2` is now npm `latest`, so it is the next latest-first foundation target rather than a prerelease spike.
- Keep React pinned to `19.2.3` while the bundled React Native renderer reports `react-native-renderer: 19.2.3`.
- Keep this as a package/template foundation branch with Android assemble and emulator smoke proof before treating it as the current wallet baseline.

Status:

- This is the completed predecessor foundation checkpoint; Milestone C supersedes it.
- It keeps React pinned to `19.2.3` while `react-native-renderer` stays on `19.2.3`; package-only React `19.2.8` remains blocked by renderer coupling.
- It records AGP `9.3.1`, Gradle `9.6.1`, stable Kotlin `2.4.10`, and Kotlin metadata release `2.4.20-Beta2` as not yet adoptable because the React Native Gradle plugin `0.86.2` path cannot compile through the Gradle 9 embedded Kotlin metadata path. The real isolated Gradle `9.6.1` probe failed in `:gradle-plugin:settings-plugin:compileKotlin` while compiling `ReactSettingsExtension.kt`.
- The RN `0.86.2` checkpoint used AGP `8.13.2`, Gradle `8.13`, Kotlin `2.1.20`, compile/target SDK `36`, and JDK `17`; this is historical evidence, not the current toolchain contract.
- Live npm metadata checked on `2026-08-10` keeps stable `latest` on `0.86.2`, while `next` moved to `0.87.0-rc.4` and nightly was observed at `0.88.0-nightly-20260810-8415753e2`; those remain planning channels, not the default wallet target. BEM-37.962 proves that RC4 can build through AsyncStorage on AGP 9.2.1 with the documented temporary `android.builtInKotlin=false` and `android.newDsl=false` compatibility flags, but those flags expire with AGP 10 and the dev/testnet runtime remains externally blocked by the expired Electrum certificate.

### Milestone C: RN 0.87.0 Latest Foundation

- Target React Native: `0.87.0`
- React peer: `^19.2.3`
- Node engine: `^22.13.0 || ^24.3.0 || >= 26.0.0`

Why:

- RN `0.87.0` is the current npm `latest`, so the RC4 probe can move to a stable full-foundation acceptance branch.
- The complete RN package cohort, Android toolchain, AsyncStorage KSP alignment, release builds, emulator runtime, and iOS handoff must move together.

Status:

- This is the current foundation acceptance candidate on `feature/bem-37-974-rn-087-stable`.
- Android debug and all four local release variants build with AGP `9.2.1`, Gradle `9.4.1`, Kotlin `2.2.10`, compile SDK `37`, target SDK `36`, and JDK `17`.
- The no-network emulator smoke passes; the ordinary dev/testnet dashboard path remains externally blocked by the expired Electrum TLS certificate.
- Windows iOS static validation is required for this milestone, while simulator/archive acceptance still requires macOS, Xcode, CocoaPods, and a refreshed `Podfile.lock`.

## Validation Gates

Every foundation milestone needs:

- Live `corepack yarn rn:target-snapshot:current` evidence when network access is available.
- Aggregate `corepack yarn foundation:target:check-summaries` evidence after live RN, direct-outdated, git-dependency, wallet/crypto, tooling, TypeScript 7 compatibility, Android-toolchain, BL, and node-fetch summaries have been refreshed.
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
