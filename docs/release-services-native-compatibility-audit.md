# Release Services Native Compatibility Audit

Scope: `BEM-36 - Native modules upgrade`, release-service group.

React Native baseline: `0.85.3`.

This audit records the current Firebase, push, CodePush, and Sentry surface before any dependency change. These packages should not be upgraded together with unrelated native cleanup, because they affect build tooling, notifications, crash reporting, analytics, release assets, and environment-specific configuration.

## Current Package State

| Package | Current package.json | Latest npm checked on 2026-05-31 | Notes |
| --- | --- | --- | --- |
| `@react-native-firebase/app` | `24.0.0` | `24.0.0` | Current package pulls `firebase@12.10.0`. |
| `@react-native-firebase/analytics` | `24.0.0` | `24.0.0` | Peer requires matching `@react-native-firebase/app@24.0.0`. |
| `@react-native-firebase/crashlytics` | `24.0.0` | `24.0.0` | Peer requires matching `@react-native-firebase/app@24.0.0`. |
| `@react-native-firebase/messaging` | `24.0.0` | `24.0.0` | Peer requires matching `@react-native-firebase/app@24.0.0`. |
| `@react-native-community/push-notification-ios` | `1.12.0` | `1.12.0` | iOS notification bridge; no Android impact. |
| `react-native-code-push` | `9.0.1` | `9.0.1` | Release update path, deployment keys, native bundle loading. |
| `@sentry/react-native` | `8.13.0` | `8.13.0` | Latest checked SDK line; source-map and dSYM behavior must still be proven with local credentials. |

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

After running the Sentry Android warning, Sentry release prerequisite, Firebase, CodePush, and push bridge audits, validate all generated local release-services summaries together:

```powershell
corepack yarn check:release-services-summary-guard
corepack yarn release-services:check-summaries
```

## Current Release Readiness Snapshot

Checked on 2026-05-31 after the RN `0.85.3` foundation, Android release variant validation, and release-services package refresh:

```powershell
corepack yarn codepush:release:path-audit
corepack yarn codepush:release:path-check-summary
corepack yarn firebase:release-services:audit
corepack yarn firebase:release-services:check-summary
corepack yarn sentry:release:prereq-audit
corepack yarn sentry:release:prereq-check-summary
corepack yarn release-services:check-summaries
```

Results:

- CodePush release-path wiring is valid for non-dev runtime, Android, iOS, and env key references.
- CodePush release-path env readiness is now recorded per env file without printing deployment-key values.
- CodePush update validation is ready from env-key perspective for `.env.stage.mainnet` and `.env.prod.mainnet`.
- Full CodePush release update validation is not ready locally because `.env.dev.testnet` has blank `CODEPUSH_DEPLOYMENT_KEY_ANDROID` and `CODEPUSH_DEPLOYMENT_KEY_IOS`.
- Beta CodePush update strategy is still unconfirmed because `.env.beta.testnet` and `.env.beta.mainnet` do not define CodePush deployment keys.
- CodePush release-path audit now records whether the latest local Android release summary artifact is present and valid, so APK/bundle evidence is separate from still-unclaimed update validation.
- Firebase release-services wiring is valid for the current `24.0.0` package family, Android config, iOS plist files, and Messaging runtime paths.
- Firebase release-services audit now records whether the latest local Android release summary artifact is present and valid, so APK/bundle evidence is separate from unclaimed FCM/Crashlytics/Analytics runtime delivery validation.
- Firebase `24.0.0` Android `devDebug` builds after removing legacy manual `firebase-core:16.0.3`, Firebase BoM `28.2.0`, and unused `firebaseVersion`/`googlePlayServicesVersion` Gradle ext values.
- RN Firebase `24.0.0` emits a legacy-architecture deprecation warning during Gradle configuration; future RN baseline work should track New Architecture readiness separately from this Firebase package upgrade.
- Sentry release source-map validation is not ready locally because `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are unavailable in the current shell.
- The Sentry prerequisite audit now records per-file readiness for the root, Android, and iOS Sentry properties files and validates that `create-sentry-properties.sh` writes all three expected paths with the expected non-secret static defaults.
- Sentry `8.13.0` keeps the Android Gradle/source-map wiring visible and no active Sentry `execResult` warning is reported on the RN `0.85.3` baseline; release artifact upload still needs credentials before it can be claimed as fully validated.
- None of these audits print secret values.
- Do not generate placeholder Sentry or CodePush secrets; missing values remain explicit readiness blockers until provided by environment/config.

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
- `android/app/build.gradle` applies `com.google.firebase.crashlytics`, CodePush Gradle script, Sentry Gradle script, and `com.google.gms.google-services`.
- Android Firebase package versions are now supplied by React Native Firebase `24.0.0` and its default Firebase BoM `34.10.0`; the old manual `firebase-core:16.0.3` and app-level Firebase BoM `28.2.0` entries were removed to avoid duplicate measurement classes.
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

- Firebase RN `24.0.0` is the current package family and must stay aligned across app, analytics, Crashlytics, and messaging.
- Firebase changes can still affect Android Gradle plugins, Firebase BoM, google-services files, iOS pods, plist selection, analytics, Crashlytics, messaging permissions, and token registration.
- `corepack yarn firebase:release-services:audit` verifies current Firebase package family alignment, Android Gradle/config files, iOS plist files, Messaging runtime wiring, latest local Android release summary evidence, and unclaimed runtime-delivery status before a Firebase family upgrade. It writes `local-docs/firebase-release-services-summary.txt`.
- `corepack yarn firebase:release-services:check-summary` validates the generated local Firebase release-services summary.
- CodePush changes can affect release JS bundle resolution, deployment key loading, and non-dev startup behavior that debug smoke does not execute.
- `react-native-code-push` is on latest checked `9.0.1` after the RN `0.85.3` proof, with guarded release bundle alias compatibility for RN Gradle task naming.
- `corepack yarn codepush:release:path-audit` verifies the current non-dev CodePush runtime wiring, Android bundle resolution, iOS deployment-key placeholders, referenced env keys, latest local Android release summary evidence, and unclaimed update-validation status without printing deployment-key values. It writes `local-docs/codepush-release-path-summary.txt`.
- `corepack yarn codepush:release:path-check-summary` validates the generated local CodePush release-path summary.
- Sentry changes can affect release bundling, source-map upload, dSYM upload, DSN handling, and Android Gradle integration even though the active RN `0.85.3` warning audit no longer reports Sentry `execResult`.
- `@sentry/react-native` is on latest checked `8.13.0` after the Sentry SDK upgrade; Android debug build and smoke validation are required for the branch, while source-map/dSYM upload remains blocked locally until Sentry credentials/properties are available.
- `corepack yarn sentry:release:prereq-audit` reports whether local `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are available before Sentry release/source-map validation and writes `local-docs/sentry-release-prereq-summary.txt`.
- `corepack yarn sentry:release:prereq-check-summary` validates the generated local prerequisite summary, including per-file readiness counts, generator output coverage, and secret-safe output.
- `corepack yarn sentry:android-warning:audit` confirms the current Sentry Android Gradle/source-map wiring remains tracked before a dedicated Sentry release/source-map cleanup branch and writes `local-docs/sentry-android-warning-summary.txt`.
- `corepack yarn sentry:android-warning:check-summary` validates the generated local Android warning summary.
- Push notification changes need Android 13+ permission checks, Firebase Messaging token checks, and iOS permission/token validation.
- `@react-native-community/push-notification-ios` is on latest checked `1.12.0` after `BEM-36.75`; this Android-side branch does not replace dedicated iOS push validation.
- `corepack yarn push-notification:bridge-audit` verifies current iOS push notification bridge wiring and static readiness. It writes `local-docs/push-notification-bridge-summary.txt`.
- `corepack yarn push-notification:bridge-check-summary` validates the generated local push notification bridge summary. After `BEM-37.79`, the audit reports no static readiness issues, but APNs registration, token, foreground/background delivery, badge, and tap-through behavior still require iOS simulator/device validation.
- `corepack yarn ios:release:readiness:audit` verifies static iOS release files, schemes, Firebase plist mapping, CodePush plist placeholders, Sentry source-map/dSYM phases, Podfile.lock drift, and xcodebuild availability. It explicitly reports iOS runtime delivery validation as not claimed until `pod install`, simulator/archive validation, and device/service checks run on macOS.

## Branching Decision

Do not batch these packages into one generic native-module bump.

Recommended branches:

1. `feature/bem-firebase-release-services-audit` or equivalent implementation branch for Firebase app, analytics, Crashlytics, and messaging together.
2. `feature/bem-sentry-release-source-map-upgrade` for remaining Sentry source-map/dSYM release validation.
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
- Sentry: start with `corepack yarn sentry:android-warning:audit`, `corepack yarn sentry:android-warning:check-summary`, `corepack yarn sentry:release:prereq-audit`, and `corepack yarn sentry:release:prereq-check-summary`, then validate Android release bundling/source maps and iOS dSYM/source-map upload path after the three required properties files and `SENTRY_AUTH_TOKEN` are present.
- iOS push: start with `corepack yarn push-notification:bridge-audit` and `corepack yarn push-notification:bridge-check-summary`, then validate APNs registration, token, foreground/background delivery, badge reset, and tap-through behavior on a Mac runner/device.
- Secrets: do not guess `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, CodePush deployment keys, or Firebase config values. If missing locally, record the exact missing variable/file.

## Current Conclusion

Release-service dependencies are a separate modernization stream inside BEM-36. The next implementation work should start with Firebase family alignment or Sentry source-map tooling, but only after the current Android debug baseline remains green and the release validation path is explicitly available.
