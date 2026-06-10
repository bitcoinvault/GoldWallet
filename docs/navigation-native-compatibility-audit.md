# Navigation Native Compatibility Audit

This audit supports staged navigation and layout-native dependency work after the RN `0.86.0` baseline proof.

Checked on: 2026-06-10

## Current State

- React Native baseline: `0.86.0`.
- React baseline: `19.2.3`.
- Active navigation packages: `@react-navigation/native@7.3.0`, `@react-navigation/stack@7.10.2`, `@react-navigation/bottom-tabs@7.17.2`, and `@react-navigation/devtools@7.0.61`.
- `@react-native-community/masked-view` is removed; React Navigation 7 no longer needs the old community masked-view runtime path.
- `react-native-gesture-handler@3.0.1` is the latest checked line validated with the RN `0.86.0` New Architecture baseline. The earlier RN `0.76.9` Kotlin/codegen blocker no longer reproduces after the RN foundation.
- `react-native-screens@4.25.2` is the validated screens baseline. Its npm metadata points at RN `>=0.82.0`, which is satisfied by the current RN `0.86.0` checkpoint.
- `react-native-safe-area-context@5.8.0` is the active safe-area baseline.
- `@react-native-community/blur@4.4.1`, `react-native-bootsplash@7.3.1`, `react-native-fast-image@8.6.3`, and `react-native-vector-icons@10.3.0` remain fixed.
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

- Navigation 7 plus masked-view removal is validated on Android through the RN `0.86.0` proof branch and emulator smoke.
- The previous `react-native-screens@4.25.x` blocker is cleared by the RN `0.86.0` checkpoint; future navigation-native dependency jumps should stay tied to Android navigation smoke validation.
- Gesture Handler `3.x` is not a small package cleanup on the current baseline; it requires a dedicated RN/new-arch compatibility branch.
- iOS validation is not claimed from Windows; `Podfile.lock` must be regenerated and built on macOS after the navigation/native dependency changes.

## Decision

- Keep `react-native-gesture-handler@3.0.1`, `react-native-screens@4.25.2`, and `react-native-safe-area-context@5.8.0` fixed until the next navigation-native validation branch.
- Do not reintroduce masked-view.
- Do not combine a future screens/gesture-handler jump with unrelated UI, storage, release-service, or Electrum work.
- Treat iOS Podfile refresh as a required follow-up before release-candidate claims.

## Required Validation For Future Navigation-Native Changes

```powershell
corepack yarn masked-view:migration:audit
corepack yarn masked-view:migration:check-summary
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:assemble
corepack yarn start --reset-cache
adb reverse tcp:8081 tcp:8081
corepack yarn android:dev:smoke
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
