# Sentry Release Source Map Plan

## Current State

- The app uses `@sentry/react-native@8.13.0`.
- Android applies `node_modules/@sentry/react-native/sentry.gradle` from `android/app/build.gradle`.
- Android has `project.ext.sentryCli.logLevel = "debug"`.
- iOS has Xcode build phases for Sentry React Native bundling and dSYM upload.
- DSNs are injected through `react-native-config` as `SENTRY_DSN_IOS` and `SENTRY_DSN_ANDROID`.
- `@sentry/react-native` runtime imports are currently scoped to `App.tsx`, `Main.tsx`, and `logger/index.ts`; `corepack yarn check:sentry-usage-scope` guards that surface before the upgrade branch.
- `corepack yarn check:sentry-usage-guard` verifies the Sentry usage guard fixtures.
- `corepack yarn check:sentry-release-integration` guards the current Android Sentry Gradle integration and iOS source-map/dSYM upload phases.
- `corepack yarn check:sentry-release-integration-guard` verifies the Sentry release integration guard fixtures.
- `corepack yarn sentry:release:prereq-audit` reports whether local `sentry.properties` files and `SENTRY_AUTH_TOKEN` are available before release source-map validation and writes `local-docs/sentry-release-prereq-summary.txt`.
- `corepack yarn sentry:release:prereq-check-summary` validates the generated local prerequisite summary.
- `corepack yarn sentry:android-warning:audit` verifies that Sentry Gradle/source-map wiring remains tracked before any Sentry cleanup branch and writes `local-docs/sentry-android-warning-summary.txt`.
- `corepack yarn sentry:android-warning:check-summary` validates the generated local Android warning summary.
- The active RN `0.81` Android warning audit no longer reports Sentry `execResult`; Sentry still needs release/source-map validation with local credentials before claiming the SDK/tooling change complete for release artifacts.
- The latest npm release checked for `@sentry/react-native` on 2026-05-29 is `8.13.0`, so a real cleanup would be a major SDK upgrade.
- `@sentry/react-native@8.13.0` declares `react-native >=0.65.0`, but release artifact behavior still has to be proven instead of patching `node_modules` or disabling source-map upload.

## Why This Needs A Dedicated Branch

- Sentry touches release bundling, source maps, dSYM upload, Crashlytics-adjacent observability, and build scripts.
- A warning-only fix could accidentally disable source-map upload or symbolication.
- The previous warning appeared during Gradle configuration, not from failed source-map upload execution.
- Newer checked Sentry lines still need proof against this React Native app and the current Android/iOS release setup.

## Proposed Branch

Branch: `feature/bem-sentry-release-source-map-upgrade`

Scope:

- Keep the newest compatible `@sentry/react-native` line for the current React Native `0.81.6` baseline.
- Validate that Android debug builds continue to work after the Sentry upgrade.
- Preserve Android source-map generation and upload behavior for release variants.
- Preserve iOS dSYM and source-map upload behavior.
- Keep Sentry DSN/environment wiring through the existing `react-native-config` setup.
- Document any required Sentry auth/token environment variables instead of guessing secrets.

## Validation Plan

- `corepack yarn check:rn-nodeify-shims`.
- `corepack yarn check:sentry-usage-guard`.
- `corepack yarn check:sentry-usage-scope`.
- `corepack yarn check:sentry-release-integration-guard`.
- `corepack yarn check:sentry-release-integration`.
- `corepack yarn sentry:release:prereq-audit`.
- `corepack yarn sentry:release:prereq-check-summary`.
- `corepack yarn check:sentry-release-prereq-summary-guard`.
- `corepack yarn sentry:android-warning:audit`.
- `corepack yarn sentry:android-warning:check-summary`.
- `corepack yarn typescript:check`.
- `git diff --check`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings`.
- Android emulator smoke after Metro `--reset-cache`.
- Android release bundle/build check for at least one non-production flavor.
- Confirm whether `SENTRY_AUTH_TOKEN` and generated `sentry.properties` files are available locally.
- iOS release validation remains required on a Mac runner or device before calling the Sentry upgrade complete.

## Acceptance Criteria

- App still starts on Android after the Sentry change.
- No AndroidRuntime crash or React Native runtime error appears in logcat during smoke.
- Release source-map behavior is either proven working or explicitly blocked by missing local Sentry credentials.
- iOS symbol upload path is not removed or silently disabled.
- The remaining Sentry Gradle warning status is re-audited after the upgrade.

