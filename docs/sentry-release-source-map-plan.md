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
- `corepack yarn sentry:release:prereq-audit` reports whether local `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are available before release source-map validation and writes `local-docs/sentry-release-prereq-summary.txt`.
- The prerequisite audit records per-file readiness for the three required Sentry properties files, validates that `create-sentry-properties.sh` writes all three paths, confirms the expected non-secret defaults without printing token values, records local `@sentry/cli` package/bin executability, and records whether the latest local Android release summary artifact is present and valid.
- `create-sentry-properties.sh` now rejects a missing `SENTRY_AUTH_TOKEN` before writing any properties files, so local release setup cannot accidentally create `auth.token=` files that look configured but fail during upload.
- `create-sentry-properties.sh` accepts optional `SENTRY_ORG` and `SENTRY_PROJECT` overrides, defaulting to the current `cloudbest` / `goldwallet` release target, so a future rebrand or Sentry project move does not require editing the generator script.
- `corepack yarn sentry:release:create-properties` is the cross-platform release setup command for generating the root, Android, and iOS Sentry properties files after `SENTRY_AUTH_TOKEN` is provided.
- `corepack yarn check:sentry-properties-generator` validates the cross-platform `scripts/createSentryProperties.mjs` generator without touching repo-level Sentry files: it checks missing-token failure, `--root` temp output, root/Android/iOS file generation, org/project overrides, and secret-safe command output.
- `corepack yarn sentry:release:validation:handoff:dry-run` renders the Sentry source-map prerequisite sequence without printing token assignments.
- `corepack yarn sentry:release:validation:handoff` validates the generator, optionally refreshes Android release APK evidence with Sentry auto-upload disabled, generates the three Sentry properties files from `SENTRY_AUTH_TOKEN`, refreshes the Sentry prerequisite summary, and validates aggregate release-services summaries.
- `corepack yarn check:sentry-release-validation-handoff-guard` validates the handoff command order, `--skip-android-release` behavior, required-env handling, and secret-safe command rendering.
- `corepack yarn sentry:release:prereq-check-summary` validates the generated local prerequisite summary, including per-file readiness counts and generator coverage.
- `corepack yarn sentry:android-warning:audit` verifies that Sentry Gradle/source-map wiring remains tracked before any Sentry cleanup branch and writes `local-docs/sentry-android-warning-summary.txt`.
- `corepack yarn sentry:android-warning:check-summary` validates the generated local Android warning summary.
- The active RN `0.86.0` Android warning audit no longer reports Sentry `execResult`; Sentry still needs release/source-map validation with local credentials before claiming the SDK/tooling change complete for release artifacts.
- The latest npm releases checked for the Sentry release path on 2026-06-10 are `@sentry/react-native@8.13.0` and `@sentry/cli@3.5.0`. The SDK is already current on the RN `0.86.0` baseline, and the release CLI is pinned explicitly as dev tooling.
- The Sentry prerequisite audit now records live latest metadata for both packages and fails stale "current" claims when installed and latest versions differ.
- `@sentry/react-native@8.13.0` declares `react-native >=0.65.0`, but release artifact behavior still has to be proven instead of patching `node_modules` or disabling source-map upload.
- Android release APK generation has now been proven locally for `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease` with Sentry auto-upload disabled; Sentry source-map upload remains explicitly not claimed until `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are available.

## Why This Needs A Dedicated Branch

- Sentry touches release bundling, source maps, dSYM upload, Crashlytics-adjacent observability, and build scripts.
- A warning-only fix could accidentally disable source-map upload or symbolication.
- The previous warning appeared during Gradle configuration, not from failed source-map upload execution.
- Newer checked Sentry lines still need proof against this React Native app and the current Android/iOS release setup.

## Proposed Branch

Branch: `feature/bem-sentry-release-source-map-upgrade`

Scope:

- Keep the newest compatible `@sentry/react-native` line for the current React Native `0.86.0` baseline.
- Validate that Android builds and runtime smoke continue to work after any future Sentry package/runtime change.
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
- `corepack yarn check:sentry-properties-generator`.
- `corepack yarn check:sentry-release-validation-handoff-guard`.
- `corepack yarn sentry:release:validation:handoff:dry-run`.
- `corepack yarn sentry:android-warning:audit`.
- `corepack yarn sentry:android-warning:check-summary`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:release:validate-local`.
- `corepack yarn android:dev:release:check-summary`.
- `corepack yarn release-services:check-summaries`.
- `corepack yarn typescript:check`.
- `git diff --check`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings`.
- Android emulator smoke after Metro `--reset-cache`.
- Android release bundle/build check for at least one non-production flavor.
- Confirm whether `SENTRY_AUTH_TOKEN` and generated `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties` files are available locally.
- If the release target changes, set `SENTRY_ORG` and `SENTRY_PROJECT` before generating properties instead of editing committed files.
- iOS release validation remains required on a Mac runner or device before calling the Sentry upgrade complete.

## Acceptance Criteria

- App still starts on Android after the Sentry change.
- No AndroidRuntime crash or React Native runtime error appears in logcat during smoke.
- Release source-map behavior is either proven working or explicitly blocked by missing local Sentry credentials.
- iOS symbol upload path is not removed or silently disabled.
- The remaining Sentry Gradle warning status is re-audited after the upgrade.

