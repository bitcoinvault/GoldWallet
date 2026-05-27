# Sentry Release Source Map Plan

## Current State

- The app uses `@sentry/react-native@5.36.0`.
- Android applies `node_modules/@sentry/react-native/sentry.gradle` from `android/app/build.gradle`.
- Android has `project.ext.sentryCli.logLevel = "debug"`.
- iOS has Xcode build phases for Sentry React Native bundling and dSYM upload.
- DSNs are injected through `react-native-config` as `SENTRY_DSN_IOS` and `SENTRY_DSN_ANDROID`.
- The active Android Gradle warning comes from Sentry's Gradle script enumerating bundle task properties.
- The latest npm release checked for `@sentry/react-native` is `8.12.0`, so a real cleanup would be a major SDK upgrade.

## Why This Needs A Dedicated Branch

- Sentry touches release bundling, source maps, dSYM upload, Crashlytics-adjacent observability, and build scripts.
- A warning-only fix could accidentally disable source-map upload or symbolication.
- The current warning appears during Gradle configuration, not from failed source-map upload execution.
- Newer checked Sentry lines still need proof against this React Native 0.68 app and the current Android/iOS release setup.

## Proposed Branch

Branch: `feature/bem-sentry-release-source-map-upgrade`

Scope:

- Re-check the newest compatible `@sentry/react-native` line for React Native 0.68.
- Upgrade Sentry only if Android debug and release builds continue to work.
- Preserve Android source-map generation and upload behavior for release variants.
- Preserve iOS dSYM and source-map upload behavior.
- Keep Sentry DSN/environment wiring through the existing `react-native-config` setup.
- Document any required Sentry auth/token environment variables instead of guessing secrets.

## Validation Plan

- `corepack yarn check:rn-nodeify-shims`.
- `corepack yarn typescript:check`.
- `git diff --check`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings`.
- Android emulator smoke after Metro `--reset-cache`.
- Android release bundle/build check for at least one non-production flavor.
- Confirm whether `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, or `sentry.properties` are required locally.
- iOS release validation remains required on a Mac runner or device before calling the Sentry upgrade complete.

## Acceptance Criteria

- App still starts on Android after the Sentry change.
- No AndroidRuntime crash or React Native runtime error appears in logcat during smoke.
- Release source-map behavior is either proven working or explicitly blocked by missing local Sentry credentials.
- iOS symbol upload path is not removed or silently disabled.
- The remaining Sentry Gradle warning status is re-audited after the upgrade.

