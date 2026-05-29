# Masked-view Migration Plan

This plan covers the remaining `@react-native-community/masked-view` Android `jcenter()` warning.

Checked on: 2026-05-29

## Current State

- Current package: `@react-native-community/masked-view@0.1.11`.
- Replacement package: `@react-native-masked-view/masked-view@0.3.2`.
- Current navigation package: `@react-navigation/stack@5.14.9`.
- `@react-navigation/stack@5.14.9` still requires `@react-native-community/masked-view` at runtime through its `MaskedViewNative` implementation.
- The app has no direct `src` imports of either masked-view package.

## Decision

Do not swap `@react-native-community/masked-view` as a warning-only cleanup.

The migration should be a dedicated navigation validation branch because the active stack navigator package still references the community package path. A safe migration may require a React Navigation stack upgrade, a compatibility bridge, or both.

Branch: `feature/bem-masked-view-navigation-migration`

## Required Validation

- `corepack yarn masked-view:migration:audit`
- `corepack yarn masked-view:migration:check-summary`
- `corepack yarn android:dev:check-light`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restart with `--reset-cache`
- Android emulator smoke

Manual navigation checks:

- App starts to dashboard.
- Stack navigation opens Send and Receive.
- Header/back behavior works on nested screens.
- Modal and back transitions do not crash.
- Logcat has no React Native runtime error and no `AndroidRuntime` crash.
