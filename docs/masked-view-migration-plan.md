# Masked-view Migration Plan

This plan records the completed `@react-native-community/masked-view` Android `jcenter()` warning removal.

Checked on: 2026-05-29

## Current State

- Current package: removed.
- Replacement package: not required.
- Current navigation packages: `@react-navigation/native@7.2.5`, `@react-navigation/stack@7.9.3`, `@react-navigation/bottom-tabs@7.16.2`.
- `@react-navigation/stack@7.9.3` no longer requires `@react-native-community/masked-view`.
- `react-native-gesture-handler@2.20.2` is the highest compatible version found in this branch; `3.0.0` and `2.31.2` fail Android Kotlin compilation on the current RN `0.76.9` baseline.
- TypeScript was raised to `5.4.5` so the React Navigation 7 declaration syntax is parsed while preserving the existing strictness compatibility setting.
- The app has no direct `src` imports of either masked-view package.

## Decision

The migration is handled through a dedicated React Navigation validation branch, not a package-only swap.

Branch: `feature/bem-37-masked-view-navigation-proof`

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
