# Navigation Native Compatibility Audit

This audit supports staged navigation and layout-native dependency work after the RN `0.86.2` baseline proof.

Checked on: 2026-08-10

## Current State

- React Native baseline: `0.86.2`.
- React baseline: `19.2.3`.
- Active navigation packages: `@react-navigation/native@7.3.16`, `@react-navigation/stack@7.10.22`, `@react-navigation/bottom-tabs@7.18.16`, and `@react-navigation/devtools@7.1.12`.
- `@react-native-community/masked-view` is removed; React Navigation 7 no longer needs the old community masked-view runtime path.
- `react-native-gesture-handler@3.1.0` is the latest checked stable line validated with the RN `0.86.2` New Architecture baseline. The earlier RN `0.76.9` Kotlin/codegen blocker no longer reproduces after the RN foundation.
- `react-native-screens@4.27.0` is the latest checked stable screens baseline. Its npm peer metadata accepts the current React and React Native runtime, and the package is validated against the RN `0.86.2` checkpoint.
- `react-native-safe-area-context@5.8.1` is the latest checked safe-area baseline.
- `@react-native-community/blur@4.4.1`, `react-native-bootsplash@7.3.2`, `react-native-fast-image@8.6.3`, and `react-native-vector-icons@10.3.0` remain fixed.
- iOS `Podfile.lock` is stale on Windows and still references older active native pods; the removed `RNCMaskedView` pod entry has been cleaned up, but refresh it on macOS before claiming iOS validation.

## Direct Source Surface

- `react-native-bootsplash` is used from `Main.tsx`, Electrum startup, Android `MainActivity`, and iOS `AppDelegate`.
- `@react-native-community/blur` is used from shared UI screen layers and needs visual validation on modal/layered screens.
- `@react-native-community/masked-view` has no source import and is no longer a dependency.
- `react-native-safe-area-context` is imported directly in `src/components/ScreenTemplate.tsx`.
- `react-native-gesture-handler` and `react-native-screens` are navigation/native runtime dependencies even without direct app imports.
- `react-native-fast-image` is re-exported from `src/components/Image.tsx` and used through shared image/icon surfaces.
- `react-native-vector-icons` is used by the UI icon layer and copied native font assets.

## Findings

- Navigation 7 plus masked-view removal is validated on Android through the RN `0.86.2` proof branch and emulator smoke.
- Live npm metadata on 2026-08-10 reports the installed React Navigation 7 package family as latest/current: native `7.3.16`, stack `7.10.22`, bottom-tabs `7.18.16`, and devtools `7.1.12`.
- React Navigation stack and bottom-tabs peer on `@react-navigation/native ^7.3.16`, `react-native-screens >=4.0.0`, and `react-native-safe-area-context >=4.0.0`, which are satisfied by the current package set.
- The React Navigation patch range fixes nested-route `beforeRemove` behavior, stale inert state after route reset, and stack gestures in affected scenarios. The selected Screens and Safe Area updates include Android navigation-state/transition fixes and a Fabric detached-view update guard, so Android stack/tab smoke and static iOS handoff remain mandatory.
- The previous `react-native-screens@4.25.x` blocker is cleared by the RN `0.86.2` checkpoint; future navigation-native dependency jumps should stay tied to Android navigation smoke validation.
- `react-native-bootsplash@7.3.2` is the live npm latest checked on 2026-06-23; the package bump is scoped to startup/splash validation and still requires iOS Podfile refresh on macOS before any iOS runtime claim.
- `react-native-gesture-handler@3.1.0` is the live npm latest checked on 2026-07-18; the package bump is scoped to navigation/gesture validation and still requires iOS Podfile refresh on macOS before any iOS runtime claim.
- Gesture Handler `3.x` is not a small package cleanup on the current baseline; it requires a dedicated RN/new-arch compatibility branch.
- iOS validation is not claimed from Windows; `Podfile.lock` must be regenerated and built on macOS after the navigation/native dependency changes.

## Decision

- Keep `react-native-gesture-handler@3.1.0`, `react-native-screens@4.27.0`, `react-native-safe-area-context@5.8.1`, and `react-native-bootsplash@7.3.2` fixed until the next navigation-native validation branch.
- Do not reintroduce masked-view.
- Do not combine a future screens/gesture-handler jump with unrelated UI, storage, release-service, or Electrum work.
- Treat iOS Podfile refresh as a required follow-up before release-candidate claims.

## Required Validation For Future Navigation-Native Changes

```powershell
corepack yarn check:navigation-runtime-cohort-guard
corepack yarn check:navigation-runtime-cohort
corepack yarn check:native-module-inventory-guard
corepack yarn check:native-module-inventory
corepack yarn masked-view:migration:audit
corepack yarn masked-view:migration:check-summary
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:verify
```

Manual Android checks after the dependency change:

- App starts to dashboard.
- Wallet list remains scrollable.
- Bottom tabs work.
- Send and Receive navigation works.
- Modal and stack transitions do not crash.
- Screens using `ScreenTemplate` keep safe-area spacing and footer/keyboard layout.
- Logcat has no `AndroidRuntime` crash or React Native runtime error.

If iOS validation is available for the branch:

- Run `pod install`.
- Build the affected iOS scheme.
- Repeat startup, tab navigation, send/receive navigation, and safe-area/footer checks on simulator/device.
