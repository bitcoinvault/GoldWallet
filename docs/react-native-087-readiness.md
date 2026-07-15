# React Native 0.87 Readiness

Checked: 2026-07-15

## Target State

- Current stable target: `react-native@0.86.0`
- Probed next target: `react-native@0.87.0-rc.1`
- Current React peer accepted by both lines: `^19.2.3`
- Required Node line for the RC: `^22.13.0 || ^24.3.0 || >=26.0.0`
- Required Android cohort: AGP `9.2.1`, Gradle `9.4.1`, Kotlin `2.2.0`
- ABI split decision: removed dead per-ABI override
- Production upgrade decision: blocked

React Native `0.86.0` is the current npm stable release. The official React Native release schedule lists `0.87.x` as a future line with a planned stable release on 2026-08-10, so the RC is compatibility evidence rather than the production target.

## Probe Results

An isolated worktree replaced the complete React Native package cohort with `0.87.0-rc.1` without changing the integration branch.

- Package installation and the existing postinstall shims passed on Node `24.16.0`.
- React Native CLI config passed.
- TypeScript initially failed in three screens because RN 0.87 generated types reject spreading `StyleSheet.absoluteFill` inside `StyleSheet.create`.
- Replacing those spreads with equivalent explicit absolute-position properties made TypeScript pass.
- All `12` unit suites and `68` unit tests passed.
- A production Android Metro bundle completed. Metro reported a non-fatal private `ReactNativeFeatureFlags` export fallback warning.
- The first Android configuration attempt required the RC toolchain instead of the production Gradle `8.13` baseline.
- With the RC Android cohort, the build required `proguard-android-optimize.txt` and rejected the removed `applicationVariants`/`OutputFile` APIs.
- The legacy per-ABI callback was dead because `enableSeparateBuildPerCPUArchitecture` was fixed to `false`; current dev and prod APKs both retain base `versionCode=14`. The disabled split block and callback were removed instead of being reimplemented with another Variant API.
- After those project-owned blockers were removed, Android configuration reached the first incompatible third-party native module.

## Upstream Blocker

Blocking dependency: `@react-native-async-storage/async-storage@3.1.1`

Version `3.1.1` is the latest npm release. Its Android build still declares an AGP `8.7.2` buildscript and applies `kotlin-android`. Under the RN 0.87 RC AGP `9.2.1` cohort, configuration fails because AGP 9 already registers the Kotlin extension; the same attempt then reports the module `compileSdk` model as unavailable.

Do not patch this dependency globally or move the production app to a prerelease RN line. Re-run the isolated probe after AsyncStorage publishes AGP 9 compatibility and after RN `0.87.x` becomes stable. The next acceptance run must include TypeScript, unit and focused wallet tests, Metro bundle, Android debug and release builds, and emulator smoke.

References:

- https://reactnative.dev/versions
- https://www.npmjs.com/package/react-native
- https://www.npmjs.com/package/@react-native-async-storage/async-storage

Validation:

```powershell
corepack yarn check:rn-087-readiness
corepack yarn typescript:check
corepack yarn test:unit --runInBand
```
