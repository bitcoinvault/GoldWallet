# Release Services Native Compatibility Audit

Scope: `BEM-36 - Native modules upgrade`, release-service group.

This audit records the current Firebase, push, CodePush, and Sentry surface before any dependency change. These packages should not be upgraded together with unrelated native cleanup, because they affect build tooling, notifications, crash reporting, analytics, release assets, and environment-specific configuration.

## Current Package State

| Package | Current package.json | Latest npm checked on 2026-05-27 | Notes |
| --- | --- | --- | --- |
| `@react-native-firebase/app` | `12.7` | `24.0.0` | Latest package pulls `firebase@12.10.0`. |
| `@react-native-firebase/analytics` | `12.7` | `24.0.0` | Peer requires matching `@react-native-firebase/app@24.0.0`. |
| `@react-native-firebase/crashlytics` | `12.7` | `24.0.0` | Peer requires matching `@react-native-firebase/app@24.0.0`. |
| `@react-native-firebase/messaging` | `12.7` | `24.0.0` | Peer requires matching `@react-native-firebase/app@24.0.0`. |
| `@react-native-community/push-notification-ios` | `1.10.0` | `1.12.0` | iOS notification bridge; no Android impact. |
| `react-native-code-push` | `7.0.2` | `9.0.1` | Release update path, deployment keys, native bundle loading. |
| `@sentry/react-native` | `5.36.0` | `8.12.0` | Major SDK jump; source-map and dSYM behavior must be proven. |

## Current Runtime Surface

- `App.tsx` initializes Sentry in non-dev builds and wraps the app with `Sentry.withTouchEventBoundary`.
- `App.tsx` wires CodePush in non-dev builds with `ON_APP_RESUME`, immediate install mode, and deployment keys from `react-native-config`.
- `Main.tsx` reports boot splash AppState errors to Sentry.
- `logger/index.ts` is part of the guarded Sentry runtime import surface.
- `src/services/NotificationServices.tsx` requests Android 13+ `POST_NOTIFICATIONS`, requests Firebase Messaging permission, and stores the FCM token in Redux.
- `src/navigators/Navigator.tsx` imports Firebase Messaging for notification handling.

The Sentry runtime import scope is already guarded by:

```powershell
corepack yarn check:sentry-usage-guard
corepack yarn check:sentry-usage-scope
```

The CodePush runtime/native integration scope is guarded by:

```powershell
corepack yarn check:codepush-usage-guard
corepack yarn check:codepush-usage-scope
```

The Firebase runtime/native integration scope is guarded by:

```powershell
corepack yarn check:firebase-usage-guard
corepack yarn check:firebase-usage-scope
```

The iOS push notification bridge scope is guarded by:

```powershell
corepack yarn check:push-notification-ios-usage-guard
corepack yarn check:push-notification-ios-usage-scope
```

The release-service env key surface is guarded by:

```powershell
corepack yarn check:release-service-env-keys-guard
corepack yarn check:release-service-env-keys
```

This validates key presence only. It does not print or guess DSN/deployment-key values. Beta env files currently do not require CodePush deployment keys until the beta release/update strategy is confirmed.

After running the Sentry, Firebase, CodePush, and push bridge audits, validate all generated local release-services summaries together:

```powershell
corepack yarn check:release-services-summary-guard
corepack yarn release-services:check-summaries
```

The Android flavor-to-env mapping is guarded by:

```powershell
corepack yarn check:android-env-config-files-guard
corepack yarn check:android-env-config-files
```

This verifies the current `android/app/build.gradle` `envConfigFiles` matrix for dev, stage, prod, and beta debug/release variants before release-service or rebranding changes alter Android env selection.

The iOS scheme env/Firebase mapping is guarded by:

```powershell
corepack yarn check:ios-scheme-config-guard
corepack yarn check:ios-scheme-config
```

This verifies the current shared Xcode scheme pre-action matrix for dev, stage, prod, and beta debug/release schemes before release-service or rebranding changes alter iOS env selection.

## Current Native And Build Surface

Android:

- `android/build.gradle` uses Google Services Gradle plugin `4.3.15` and Crashlytics Gradle plugin `2.9.0`.
- `android/build.gradle` defines `firebaseVersion = "17.3.4"`.
- `android/app/build.gradle` applies `com.google.firebase.crashlytics`, CodePush Gradle script, Sentry Gradle script, and `com.google.gms.google-services`.
- `android/app/build.gradle` still contains explicit Firebase dependencies including `firebase-core:16.0.3` and BoM `28.2.0`.
- Android Firebase config files exist under flavor-specific `android/app/src/*/google-services.json`.
- `MainApplication.java` uses CodePush to resolve the JS bundle file.
- `android/app/src/main/res/values/strings.xml` has the native `CodePushDeploymentKey` placeholder.

iOS:

- Firebase plist files exist for dev, stage, prod, and default variants.
- Xcode project settings reference flavor-specific `FIREBASE_CONFIG_FILE` values.
- Xcode project has Sentry React Native bundling and dSYM upload build phases.
- iOS Info.plist uses `$(CODEPUSH_DEPLOYMENT_KEY_IOS)`.
- The main, Dev, and Stage iOS Info.plist files declare `UIBackgroundModes` with `remote-notification`; the app delegate assigns `UNUserNotificationCenter` delegate for foreground presentation callbacks.
- `docs/ios-release-config-compatibility-audit.md` records the current iOS scheme-to-env/Firebase plist mapping before release-service or rebranding changes.

Shared env/config:

- `src/config/index.ts` reads `SENTRY_DSN_IOS`, `SENTRY_DSN_ANDROID`, `CODEPUSH_DEPLOYMENT_KEY_IOS`, and `CODEPUSH_DEPLOYMENT_KEY_ANDROID` through `react-native-config`.
- `.env.*` files are present for dev, beta, stage, prod, testnet, and test configurations.

## Upgrade Risk

- Firebase RN `12.7` to `24.0.0` is a major family upgrade and must keep all Firebase packages aligned.
- Firebase changes can affect Android Gradle plugins, Firebase BoM, google-services files, iOS pods, plist selection, analytics, Crashlytics, messaging permissions, and token registration.
- `corepack yarn firebase:release-services:audit` verifies current Firebase package family alignment, Android Gradle/config files, iOS plist files, and Messaging runtime wiring before a Firebase family upgrade. It writes `local-docs/firebase-release-services-summary.txt`.
- `corepack yarn firebase:release-services:check-summary` validates the generated local Firebase release-services summary.
- CodePush changes can affect release JS bundle resolution, deployment key loading, and non-dev startup behavior that debug smoke does not execute.
- `react-native-code-push` is pinned to the already-resolved `7.0.2` after `BEM-36.70`; this is not a CodePush runtime upgrade and does not replace the dedicated non-dev release-path validation branch.
- `corepack yarn codepush:release:path-audit` verifies the current non-dev CodePush runtime wiring, Android bundle resolution, iOS deployment-key placeholders, and referenced env keys without printing deployment-key values. It writes `local-docs/codepush-release-path-summary.txt`.
- `corepack yarn codepush:release:path-check-summary` validates the generated local CodePush release-path summary.
- Sentry changes can affect release bundling, source-map upload, dSYM upload, DSN handling, and the existing Android Gradle warning source.
- `corepack yarn sentry:release:prereq-audit` reports whether local `sentry.properties` files and `SENTRY_AUTH_TOKEN` are available before Sentry release/source-map validation and writes `local-docs/sentry-release-prereq-summary.txt`.
- `corepack yarn sentry:release:prereq-check-summary` validates the generated local prerequisite summary.
- `corepack yarn sentry:android-warning:audit` confirms the current Android Sentry `execResult` warning remains dependency-owned before a dedicated Sentry release/source-map cleanup branch and writes `local-docs/sentry-android-warning-summary.txt`.
- `corepack yarn sentry:android-warning:check-summary` validates the generated local Android warning summary.
- Push notification changes need Android 13+ permission checks, Firebase Messaging token checks, and iOS permission/token validation.
- `@react-native-community/push-notification-ios` is pinned to the already-resolved `1.10.0` after `BEM-36.71`; this is not an iOS notification behavior upgrade and does not replace dedicated iOS push validation.
- `corepack yarn push-notification:bridge-audit` verifies current iOS push notification bridge wiring and static readiness. It writes `local-docs/push-notification-bridge-summary.txt`.
- `corepack yarn push-notification:bridge-check-summary` validates the generated local push notification bridge summary. After `BEM-37.79`, the audit reports no static readiness issues, but APNs registration, token, foreground/background delivery, badge, and tap-through behavior still require iOS simulator/device validation.

## Branching Decision

Do not batch these packages into one generic native-module bump.

Recommended branches:

1. `feature/bem-firebase-release-services-audit` or equivalent implementation branch for Firebase app, analytics, Crashlytics, and messaging together.
2. `feature/bem-sentry-release-source-map-upgrade` for Sentry SDK and source-map/dSYM validation.
3. `feature/bem-codepush-release-path-audit` for CodePush runtime and release update validation.
4. `feature/bem-ios-push-notification-bridge-audit` for `@react-native-community/push-notification-ios` if iOS notification behavior is changed.
5. `feature/bem-ios-scheme-config-guard` after confirming Stage/Beta scheme env and Firebase plist behavior.

## Minimum Validation Before Dependency Changes

For audit/docs-only branches:

```powershell
corepack yarn android:dev:check-light
corepack yarn check:release-services-summary-guard
corepack yarn release-services:check-summaries
```

For any dependency change in this group:

```powershell
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:assemble
corepack yarn start --reset-cache
adb reverse tcp:8081 tcp:8081
corepack yarn android:dev:smoke
```

Release-service-specific validation:

- Firebase Messaging: confirm Android 13+ notification permission, FCM token retrieval, and notification handling path; start with `corepack yarn firebase:release-services:audit` and `corepack yarn firebase:release-services:check-summary`.
- Crashlytics: confirm Android Crashlytics Gradle task configuration and iOS pod/build integration; start with `corepack yarn firebase:release-services:audit` and `corepack yarn firebase:release-services:check-summary`.
- Analytics: confirm app startup does not crash and analytics package initialization remains compatible; start with `corepack yarn firebase:release-services:audit` and `corepack yarn firebase:release-services:check-summary`.
- CodePush: validate a non-dev build path because CodePush is disabled under `__DEV__`; start with `corepack yarn codepush:release:path-audit` and `corepack yarn codepush:release:path-check-summary`.
- Sentry: start with `corepack yarn sentry:android-warning:audit`, `corepack yarn sentry:android-warning:check-summary`, and `corepack yarn sentry:release:prereq-audit`, then validate Android release bundling/source maps and iOS dSYM/source-map upload path.
- iOS push: start with `corepack yarn push-notification:bridge-audit` and `corepack yarn push-notification:bridge-check-summary`, then validate APNs registration, token, foreground/background delivery, badge reset, and tap-through behavior on a Mac runner/device.
- Secrets: do not guess `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, CodePush deployment keys, or Firebase config values. If missing locally, record the exact missing variable/file.

## Current Conclusion

Release-service dependencies are a separate modernization stream inside BEM-36. The next implementation work should start with Firebase family alignment or Sentry source-map tooling, but only after the current Android debug baseline remains green and the release validation path is explicitly available.
