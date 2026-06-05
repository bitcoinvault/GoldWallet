# Release Services Native Compatibility Audit

Scope: `BEM-36 - Native modules upgrade`, release-service group.

React Native baseline: `0.85.3`.

This audit records the current Firebase, push, CodePush, and Sentry surface before any dependency change. These packages should not be upgraded together with unrelated native cleanup, because they affect build tooling, notifications, crash reporting, analytics, release assets, and environment-specific configuration.

## Current Package State

| Package | Current package.json | Latest npm checked on 2026-06-03 | Notes |
| --- | --- | --- | --- |
| `@react-native-firebase/app` | `24.0.0` | `24.0.0` | Current package pulls `firebase@12.10.0`. |
| `@react-native-firebase/analytics` | `24.0.0` | `24.0.0` | Peer requires matching `@react-native-firebase/app@24.0.0`. |
| `@react-native-firebase/crashlytics` | `24.0.0` | `24.0.0` | Peer requires matching `@react-native-firebase/app@24.0.0`. |
| `@react-native-firebase/messaging` | `24.0.0` | `24.0.0` | Peer requires matching `@react-native-firebase/app@24.0.0`. |
| `@react-native-community/push-notification-ios` | `1.12.0` | `1.12.0` | iOS notification bridge; no Android impact. |
| `react-native-code-push` | `9.0.1` | `9.0.1` | Latest npm package is installed, but App Center CodePush was retired on 2025-03-31 and the Microsoft repositories are archived; treat as migration/removal work, not a normal package refresh. |
| `@sentry/react-native` | `8.13.0` | `8.13.0` | Latest checked SDK line; source-map and dSYM behavior must still be proven with local credentials. |
| `@sentry/cli` | `3.5.0` | `3.5.0` | Explicit release-tooling dependency; prerequisite audit checks binary availability and live latest metadata. |

## Current Runtime Surface

- `App.tsx` initializes Sentry in non-dev builds and wraps the app with `Sentry.withTouchEventBoundary`.
- `App.tsx` keeps CodePush wiring for non-dev builds with `ON_APP_RESUME`, immediate install mode, deployment keys from `react-native-config`, and an explicit `CODEPUSH_ENABLED=true` runtime gate.
- Android `MainApplication.java` and iOS `AppDelegate.m` resolve JS bundles through CodePush only when `CODEPUSH_ENABLED=true` and the platform deployment key is non-empty.
- `Main.tsx` reports boot splash AppState errors to Sentry.
- `logger/index.ts` is part of the guarded Sentry runtime import surface.
- `src/services/NotificationServices.tsx` requests Android 13+ `POST_NOTIFICATIONS` before Firebase Messaging permission, requests Firebase Messaging permission, and stores the FCM token in Redux.
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
corepack yarn check:android-notification-permission-flow-guard
corepack yarn check:android-notification-permission-flow
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

After `BEM-37.400`, the same sequence can be executed as one guarded handoff:

```powershell
corepack yarn release-services:validation:handoff:dry-run
corepack yarn release-services:validation:handoff
```

The full handoff refreshes Android release APK evidence with Sentry auto-upload disabled, refreshes Sentry/Firebase/CodePush/push/iOS summaries, and then runs the aggregate release-services summary checker. Use `--skip-android-release` only when the latest Android release summary already matches the current release inputs.

After `BEM-37.421`, Sentry has a narrower source-map prerequisite handoff for the point when `SENTRY_AUTH_TOKEN` is available:

```powershell
corepack yarn sentry:release:validation:handoff:dry-run
corepack yarn sentry:release:validation:handoff
```

This validates the properties generator, optionally refreshes Android release APK evidence with `SENTRY_DISABLE_AUTO_UPLOAD=true`, generates `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties` from the local Sentry env, then refreshes and validates the Sentry release prerequisite summary plus the aggregate release-services summary artifacts. The dry run prints only required env variable names, not token values. Use `--skip-android-release` only when the latest Android release summary already matches the current release inputs.

After `BEM-37.422`, CodePush has a narrower update-validation handoff for the point when deployment keys and beta strategy are available:

```powershell
corepack yarn codepush:update:validation:handoff:dry-run
corepack yarn codepush:update:validation:handoff
```

This optionally refreshes Android release APK evidence with `SENTRY_DISABLE_AUTO_UPLOAD=true`, refreshes CodePush release-path, migration-readiness, and removal-readiness summaries, then finishes with the aggregate release-services summary checker. The executable handoff remains blocked while the release-path summary says `Release path ready for update validation: no`, while `CodePush update validation` is still `not claimed`, or while the App Center retirement migration requirement is not visible. It does not print deployment-key values.

After `BEM-37.424`, Firebase has a narrower runtime-delivery prerequisite handoff for the point before real FCM, Crashlytics, and Analytics delivery testing:

```powershell
corepack yarn firebase:runtime:delivery:handoff:dry-run
corepack yarn firebase:runtime:delivery:handoff
```

This optionally refreshes Android release APK evidence with `SENTRY_DISABLE_AUTO_UPLOAD=true`, refreshes Firebase release-services and push-notification bridge summaries, then finishes with the aggregate release-services summary checker. The executable handoff confirms local Firebase package/config/runtime wiring, Android release evidence, APK manifest proof, and static push bridge readiness, but it keeps Firebase and push runtime delivery explicitly `not claimed` until a real release-runtime/device test confirms FCM token/notification delivery, Crashlytics upload, and Analytics behavior.

## Current Release Readiness Snapshot

Checked on 2026-06-03 after the RN `0.85.3` foundation, Android release variant validation, and release-services package refresh:

```powershell
JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:release:validate-local
corepack yarn android:dev:release:check-summary
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
- Android `devRelease`, `stageRelease`, and `prodRelease` APK generation is validated locally with Sentry auto upload disabled; the summary records APK path, byte count, and SHA-256 for each unsigned release artifact.
- After `BEM-37.338`, Android local release evidence covers `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease` by default with Sentry auto upload disabled; the summary records APK path, byte count, and SHA-256 for each unsigned release artifact.
- CodePush package readiness now records live npm latest metadata and confirms that the installed package is current as of 2026-06-03.
- CodePush upstream retirement readiness now records App Center CodePush retirement on 2025-03-31, archived Microsoft upstream state confirmed on 2026-06-03, lack of upstream New Architecture support, Android `newArchEnabled=true`, and `CodePush migration required: yes`.
- CodePush release-path env readiness is now recorded per env file without printing deployment-key values.
- CodePush release-path package readiness now verifies that `package.json` and the installed `node_modules/react-native-code-push` package agree before release-path validation is considered usable.
- CodePush runtime startup and native bundle resolution are gated off by default; the release-path audit derives that default from referenced `CODEPUSH_ENABLED` env values, and `CODEPUSH_ENABLED=true` plus a non-empty platform deployment key is required before the retired OTA client is mounted or used for bundle resolution in non-dev builds.
- CodePush update validation is ready from env-key perspective for `.env.stage.mainnet` and `.env.prod.mainnet`.
- Full CodePush release update validation is not ready locally because `.env.dev.testnet` has blank `CODEPUSH_DEPLOYMENT_KEY_ANDROID` and `CODEPUSH_DEPLOYMENT_KEY_IOS`.
- Beta CodePush update strategy is still unconfirmed because `.env.beta.testnet` and `.env.beta.mainnet` do not define CodePush deployment keys.
- Android beta release compilation no longer depends on beta env files defining `CODEPUSH_DEPLOYMENT_KEY_ANDROID`; `android/app/build.gradle` provides an empty default `BuildConfig` value, and the runtime gate still requires `CODEPUSH_ENABLED=true` plus a non-empty key before CodePush bundle resolution is used.
- CodePush release-path audit now records whether the latest local Android release summary artifact is present, valid, covers the current release inputs, covers `dev`, `stage`, `prod`, and `beta` release APK evidence, and has valid release APK manifest proof; it emits a dedicated `CodePush release build evidence ready` line so APK/bundle/manifest evidence is separate from still-unclaimed update validation.
- Firebase release-services wiring is valid for the current `24.0.0` package family, Android config, iOS plist files, and Messaging runtime paths.
- Firebase release-services audit now records whether the latest local Android release summary artifact is present, valid, covers the current release inputs, covers `dev`, `stage`, `prod`, and `beta` release APK evidence, and has valid release APK manifest proof, so APK/bundle/manifest evidence is separate from unclaimed FCM/Crashlytics/Analytics runtime delivery validation.
- Firebase `24.0.0` Android `devDebug` builds after removing legacy manual `firebase-core:16.0.3`, Firebase BoM `28.2.0`, and unused `firebaseVersion`/`googlePlayServicesVersion` Gradle ext values.
- RN Firebase `24.0.0` emits a legacy-architecture deprecation warning during Gradle configuration; future RN baseline work should track New Architecture readiness separately from this Firebase package upgrade.
- Sentry release source-map upload validation is still not ready locally because `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are unavailable in the current shell.
- Sentry SDK and CLI package targets remain current on 2026-06-03: `@sentry/react-native@8.13.0` and `@sentry/cli@3.5.0`.
- The Sentry prerequisite audit now records per-file readiness for the root, Android, and iOS Sentry properties files, validates that `create-sentry-properties.sh` writes all three expected paths with the expected non-secret defaults, supports optional `SENTRY_ORG` / `SENTRY_PROJECT` overrides, and verifies that the local `@sentry/cli` package binary is present and executable.
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
- `MainApplication.java` uses CodePush to resolve the JS bundle file only when `CODEPUSH_ENABLED=true` and the Android deployment key is non-empty.
- `android/app/src/main/res/values/strings.xml` has the native `CodePushDeploymentKey` placeholder.

iOS:

- Firebase plist files exist for dev, stage, prod, and default variants.
- Xcode project settings reference flavor-specific `FIREBASE_CONFIG_FILE` values.
- Xcode project has Sentry React Native bundling and dSYM upload build phases.
- iOS Info.plist uses `$(CODEPUSH_DEPLOYMENT_KEY_IOS)` and `AppDelegate.m` uses CodePush bundle URLs only when `CODEPUSH_ENABLED=true` and the iOS deployment key is non-empty.
- The main, Dev, Stage, and Beta iOS Info.plist files declare `UIBackgroundModes` with `remote-notification`; the app delegate assigns `UNUserNotificationCenter` delegate for foreground presentation callbacks.
- `docs/ios-release-config-compatibility-audit.md` records the current iOS scheme-to-env/Firebase plist mapping before release-service or rebranding changes.

Shared env/config:

- `src/config/index.ts` reads `SENTRY_DSN_IOS`, `SENTRY_DSN_ANDROID`, optional `CODEPUSH_ENABLED`, `CODEPUSH_DEPLOYMENT_KEY_IOS`, and `CODEPUSH_DEPLOYMENT_KEY_ANDROID` through `react-native-config`.
- `.env.*` files are present for dev, beta, stage, prod, testnet, and test configurations.

## Upgrade Risk

- Firebase RN `24.0.0` is the current package family and must stay aligned across app, analytics, Crashlytics, and messaging.
- Firebase changes can still affect Android Gradle plugins, Firebase BoM, google-services files, iOS pods, plist selection, analytics, Crashlytics, messaging permissions, and token registration.
- `corepack yarn firebase:release-services:audit` verifies current Firebase package family alignment, Android Gradle/config files, iOS plist files, Messaging runtime wiring, latest local Android `dev`/`stage`/`prod`/`beta` release summary evidence, current release-input coverage, and unclaimed runtime-delivery status before a Firebase family upgrade. It writes `local-docs/firebase-release-services-summary.txt`.
- `corepack yarn firebase:release-services:check-summary` validates the generated local Firebase release-services summary.
- `corepack yarn firebase:runtime:delivery:handoff` validates the local Firebase runtime-delivery prerequisites and static push bridge prerequisites without claiming real FCM, Crashlytics, Analytics, or push delivery behavior.
- CodePush changes can affect release JS bundle resolution, deployment key loading, and non-dev startup behavior that debug smoke does not execute.
- `react-native-code-push` is on latest checked `9.0.1` after the RN `0.85.3` proof, with guarded release bundle alias compatibility for RN Gradle task naming. Because App Center CodePush is retired and the Microsoft upstream is archived, this is now a migration/removal risk rather than a normal dependency update target; keeping the package current does not make OTA updates a supported long-term release capability.
- `corepack yarn codepush:release:path-audit` verifies the current non-dev CodePush runtime wiring, explicit JS/native runtime gates, Android bundle resolution, iOS deployment-key placeholders, referenced env keys, local package/install version alignment, latest local Android `dev`/`stage`/`prod`/`beta` release summary evidence, current release-input coverage, the dedicated release-build evidence readiness line, and unclaimed update-validation status without printing deployment-key values. It writes `local-docs/codepush-release-path-summary.txt`.
- `corepack yarn codepush:release:path-check-summary` validates the generated local CodePush release-path summary.
- Sentry changes can affect release bundling, source-map upload, dSYM upload, DSN handling, and Android Gradle integration even though the active RN `0.85.3` warning audit no longer reports Sentry `execResult`.
- `@sentry/react-native` is on latest checked `8.13.0` after the Sentry SDK upgrade; Android debug build and smoke validation are required for the branch, while source-map/dSYM upload remains blocked locally until Sentry credentials/properties are available.
- `corepack yarn sentry:release:prereq-audit` reports whether local `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are available before Sentry release/source-map validation, verifies that the properties generator supports `SENTRY_ORG` / `SENTRY_PROJECT` release-target overrides, verifies the local `@sentry/cli` package/bin, checks latest local Android `dev`/`stage`/`prod`/`beta` release summary evidence plus current release-input coverage, and writes `local-docs/sentry-release-prereq-summary.txt`. The prerequisite status can only be `ready` when the Android release summary is present, covers dev/stage/prod/beta, matches current release inputs, and has valid APK manifest proof.
- After `BEM-37.338`, Sentry release prerequisite audit also requires the local Android release summary to cover `beta` release evidence before release-build evidence is considered complete.
- `corepack yarn sentry:release:prereq-check-summary` validates the generated local prerequisite summary, including per-file readiness counts, Sentry CLI readiness, generator output coverage, and secret-safe output.
- `corepack yarn sentry:release:create-properties` is the guarded cross-platform command for generating the three Sentry properties files after `SENTRY_AUTH_TOKEN` is available.
- `corepack yarn check:sentry-properties-generator` validates the cross-platform Node Sentry properties generator in a temp root, including missing-token failure, root/Android/iOS output, org/project overrides, and secret-safe output.
- `corepack yarn sentry:release:validation:handoff:dry-run` renders the Sentry release prerequisite handoff without printing token assignments.
- `corepack yarn sentry:release:validation:handoff` runs the Sentry release prerequisite handoff after `SENTRY_AUTH_TOKEN` is available; without that variable it fails before properties generation with a clear missing-env blocker.
- `corepack yarn check:sentry-release-validation-handoff-guard` validates the Sentry handoff command sequence, secret-safe rendering, required-env handling, and `--skip-android-release` behavior.
- `corepack yarn sentry:android-warning:audit` confirms the current Sentry Android Gradle/source-map wiring remains tracked before a dedicated Sentry release/source-map cleanup branch and writes `local-docs/sentry-android-warning-summary.txt`.
- `corepack yarn sentry:android-warning:check-summary` validates the generated local Android warning summary.
- Push notification changes need Android 13+ permission checks, Firebase Messaging token checks, and iOS permission/token validation.
- `@react-native-community/push-notification-ios` is on latest checked `1.12.0` after `BEM-36.75`; this Android-side branch does not replace dedicated iOS push validation.
- `corepack yarn push-notification:bridge-audit` verifies current iOS push notification bridge wiring and static readiness. It writes `local-docs/push-notification-bridge-summary.txt`.
- `corepack yarn push-notification:bridge-check-summary` validates the generated local push notification bridge summary. After `BEM-37.79`, the audit reports no static readiness issues, but APNs registration, token, foreground/background delivery, badge, and tap-through behavior still require iOS simulator/device validation.
- `corepack yarn ios:release:readiness:audit` verifies static iOS release files, schemes, Firebase plist mapping, CodePush plist placeholders, Sentry source-map/dSYM phases, remote-notification plist coverage, removed-pod lockfile references, active Podfile.lock drift, and xcodebuild availability. The 2026-06-03 refresh reports static iOS files valid, 4 remote-notification plists including Beta, 0 removed Podfile.lock pod references, 12 active Podfile.lock drift issues, missing local xcodebuild on Windows, and iOS runtime delivery validation not claimed until `pod install`, simulator/archive validation, and device/service checks run on macOS.
- `corepack yarn release-services:check-summaries` validates the generated Sentry, Firebase, CodePush, push-notification, iOS release-readiness, and iOS macOS validation-prerequisite summary artifacts together so the aggregate release-services gate covers Android release evidence, static iOS release readiness, and the macOS-only iOS handoff prerequisites.

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

- Firebase Messaging: confirm Android 13+ notification permission, FCM token retrieval, and notification handling path; start with `corepack yarn check:android-notification-permission-flow-guard`, `corepack yarn check:android-notification-permission-flow`, `corepack yarn firebase:release-services:audit`, and `corepack yarn firebase:release-services:check-summary`.
- Crashlytics: confirm Android Crashlytics Gradle task configuration and iOS pod/build integration; start with `corepack yarn firebase:release-services:audit` and `corepack yarn firebase:release-services:check-summary`.
- Analytics: confirm app startup does not crash and analytics package initialization remains compatible; start with `corepack yarn firebase:release-services:audit` and `corepack yarn firebase:release-services:check-summary`.
- CodePush: validate a non-dev build path because CodePush is disabled under `__DEV__`; start with `corepack yarn codepush:release:path-audit` and `corepack yarn codepush:release:path-check-summary`.
- Sentry: start with `corepack yarn sentry:android-warning:audit`, `corepack yarn sentry:android-warning:check-summary`, `corepack yarn sentry:release:prereq-audit`, `corepack yarn sentry:release:prereq-check-summary`, `corepack yarn android:dev:release:validate-local`, and `corepack yarn android:dev:release:check-summary`, then validate Android source-map upload and iOS dSYM/source-map upload path after the three required properties files and `SENTRY_AUTH_TOKEN` are present.
- iOS push: start with `corepack yarn push-notification:bridge-audit` and `corepack yarn push-notification:bridge-check-summary`, then validate APNs registration, token, foreground/background delivery, badge reset, and tap-through behavior on a Mac runner/device.
- Secrets: do not guess `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, CodePush deployment keys, or Firebase config values. If missing locally, record the exact missing variable/file.

## Current Conclusion

Release-service dependencies are a separate modernization stream inside BEM-36. The next implementation work should start with Firebase family alignment or Sentry source-map tooling, but only after the current Android debug baseline remains green and the release validation path is explicitly available.
