# React Native 0.87 Readiness

Checked: 2026-08-10

## Target State

- Current stable target: `react-native@0.86.2`
- Probed next target: `react-native@0.87.0-rc.4`
- Current React peer accepted by both lines: `^19.2.3`
- Required Node line for the RC: `^22.13.0 || ^24.3.0 || >=26.0.0`
- Required Android cohort: AGP `9.2.1`, Gradle `9.4.1`, Kotlin `2.2.0`
- Required temporary AGP compatibility flags: `android.builtInKotlin=false`, `android.newDsl=false`
- Production upgrade decision: pending stable release and complete runtime acceptance

React Native `0.86.2` is the current npm stable release. npm published `0.87.0-rc.4` on the `next` channel on the scheduled 0.87 release date, but had not promoted it to `latest` when this probe ran. The production package baseline therefore remains on stable `0.86.2`.

## RC4 Probe Results

An isolated short-path worktree replaced the complete React Native package cohort with `0.87.0-rc.4` without changing production dependencies.

- Package installation and the existing postinstall shims passed on Node `24.16.0`.
- React Native CLI config and TypeScript passed without additional application-code changes.
- All `13` unit suites and `60` unit tests passed.
- The complete focused storage/network suite passed, including secure storage and offline wallet-core tests.
- A production Android Metro bundle completed on Metro `0.87.0`. The existing non-fatal private `ReactNativeFeatureFlags` export fallback warning remains.
- The RC continues to require AGP `9.2.1`, Gradle `9.4.1`, and Kotlin `2.2.0`.
- With AGP 9 defaults, `@react-native-async-storage/async-storage@3.1.1` fails while applying `kotlin-android`, then reports no visible `compileSdk` model.
- Android's documented temporary AGP 9 opt-out, `android.builtInKotlin=false` together with `android.newDsl=false`, preserves AsyncStorage's legacy Kotlin/KSP path and allows `assembleDevDebug` to complete. The build passed all `795` executed Gradle tasks and produced the embedded dev APK.
- A long Windows worktree path exceeded Ninja's 260-character object-path limit in Gesture Handler. Re-running the same checkout from the physical short path `D:\x962` removed that environment-only failure.
- The RC4 APK installed and launched on `emulator-5554`. Automated onboarding passed Terms, PIN creation, and transaction-password creation without a fatal React Native or Android runtime crash.
- Full dashboard, navigation, QR, and Terms WebView smoke could not complete because the external dev/testnet Electrum certificate expired on 2026-06-23. The app reached the expected `No network` state while the onboarding email screen remained underneath the network overlay.

## Compatibility Decision

AsyncStorage `3.1.1` and its current upstream `main` still apply `kotlin-android`, declare an AGP `8.7.2` buildscript, and use KSP/Room for legacy-storage migration. Removing those pieces locally is not acceptable for a wallet that must preserve historical storage.

The two AGP flags are an official temporary migration bridge, not a permanent upstream fix. Android documents that both opt-outs are removed in AGP 10. The next stable RN 0.87 branch may use them only as an explicit compatibility checkpoint while AsyncStorage migrates to built-in Kotlin and the new Android DSL.

Do not move production to a prerelease RN package. Re-run the acceptance branch after `react-native@0.87.x` is published on npm `latest`. Acceptance requires frozen install, TypeScript, unit and focused wallet tests, Metro bundle, Android debug and release builds, emulator smoke to the dashboard against a working Electrum endpoint, and iOS static/macOS validation.

References:

- https://reactnative.dev/versions
- https://developer.android.com/build/migrate-to-built-in-kotlin
- https://github.com/react-native-async-storage/async-storage/blob/main/packages/async-storage/android/build.gradle

Validation:

```powershell
corepack yarn check:rn-087-readiness
corepack yarn check:rn-nodeify-shims
corepack yarn typescript:check
corepack yarn test:unit --runInBand
corepack yarn test:storage-network:focused
```
