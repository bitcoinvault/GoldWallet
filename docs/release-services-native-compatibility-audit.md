# Release Services Native Compatibility Audit

Scope: `BEM-36 - Native modules upgrade`, release-service group.

React Native baseline: `0.86.0`.

This audit records the current Firebase, push, CodePush, and Sentry surface before any dependency change. These packages should not be upgraded together with unrelated native cleanup, because they affect build tooling, notifications, crash reporting, analytics, release assets, and environment-specific configuration.

## Current Package State

| Package | Current package.json | Latest npm checked on 2026-06-12 | Notes |
| --- | --- | --- | --- |
| `@react-native-firebase/app` | `24.1.1` | `24.1.1` | Current package pulls `firebase@12.14.0`. |
| `@react-native-firebase/analytics` | `24.1.1` | `24.1.1` | Peer requires matching `@react-native-firebase/app@24.1.1`. |
| `@react-native-firebase/crashlytics` | `24.1.1` | `24.1.1` | Peer requires matching `@react-native-firebase/app@24.1.1`. |
| `@react-native-firebase/messaging` | `24.1.1` | `24.1.1` | Peer requires matching `@react-native-firebase/app@24.1.1`. |
| `@react-native-community/push-notification-ios` | `1.12.0` | `1.12.0` | iOS notification bridge; no Android impact. |
| `react-native-code-push` | removed | `9.0.1` | Removed in `BEM-37.583`; App Center CodePush was retired on 2025-03-31 and the Microsoft repositories are archived. |
| `@sentry/react-native` | `8.14.0` | `8.14.0` | Latest checked SDK line; source-map and dSYM behavior must still be proven with local credentials. |
| `@sentry/cli` | `3.5.1` | `3.5.1` | Explicit release-tooling dependency; prerequisite audit checks binary availability, live latest metadata, installed direct/nested CLI versions, and whether release build phases use the direct root CLI package. |

## Current Runtime Surface

- `App.tsx` initializes Sentry in non-dev builds and wraps the app with `Sentry.withTouchEventBoundary`.
- CodePush runtime wrapping, Android bundle lookup, iOS bundle URL lookup, plist placeholders, and native package integration were removed in `BEM-37.583`.
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

This validates key presence only. It does not print or guess DSN/deployment-key values. CodePush deployment keys are no longer required after `BEM-37.583`; stale `CODEPUSH_*` env values should be cleaned only through a secrets-safe follow-up.

After running the Android release smoke, Sentry Android warning, Sentry release prerequisite, Firebase, CodePush, and push bridge audits, validate all generated local release-services summaries together:

```powershell
corepack yarn check:release-services-summary-guard
corepack yarn release-services:check-summaries
```

After `BEM-37.400`, the same sequence can be executed as one guarded handoff:

```powershell
corepack yarn release-services:validation:handoff:dry-run
corepack yarn release-services:validation:handoff
```

The full handoff refreshes Android release APK evidence with Sentry auto-upload disabled, runs the Android release embedded smoke, validates the release-smoke summary, refreshes Sentry/Firebase/CodePush/push/iOS summaries, and then runs the aggregate release-services summary checker. The release-smoke summary must prove clean first-run onboarding, embedded Create/Import CTA navigation, and embedded bottom-tab navigation. Use `--skip-android-release` only when the latest Android release summary and release-smoke summary already match the current release inputs.

After `BEM-37.627`, the release-services handoff defaults to the current post-removal CodePush posture: `--codepush-decision remove --codepush-beta-strategy beta-has-no-ota`. Pass explicit CodePush decision flags only when planning a future `replace` branch or an explicit temporary legacy exception. The default handoff must keep OTA update validation unclaimed because CodePush runtime/native integration is removed and no maintained replacement has been selected or delivery-tested.

After `BEM-37.421`, Sentry has a narrower source-map prerequisite handoff for the point when `SENTRY_AUTH_TOKEN` is available:

```powershell
corepack yarn sentry:release:validation:handoff:dry-run
corepack yarn sentry:release:validation:handoff
```

This validates the properties generator, optionally refreshes Android release APK evidence with `SENTRY_DISABLE_AUTO_UPLOAD=true`, runs the Android release embedded smoke, validates the release-smoke summary, generates `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties` from the local Sentry env, then refreshes and validates the Sentry release prerequisite summary plus the aggregate release-services summary artifacts. The dry run prints only required env variable names, not token values. Use `--skip-android-release` only when the latest Android release summary and release-smoke summary already match the current release inputs.

After `BEM-37.422`, CodePush has a narrower update-validation handoff for the point when deployment keys and beta strategy are available:

```powershell
corepack yarn codepush:update:validation:handoff:dry-run
corepack yarn codepush:update:validation:handoff
```

This optionally refreshes Android release APK evidence with `SENTRY_DISABLE_AUTO_UPLOAD=true`, runs the Android release embedded smoke, validates the release-smoke summary, refreshes CodePush release-path, migration-readiness, and removal-readiness summaries, then finishes with the aggregate release-services summary checker and a direct Android release-smoke readiness check. The executable handoff remains blocked while the release-path summary says `Release path ready for update validation: no`, while `CodePush update validation` is still `not claimed`, while the App Center retirement migration requirement is not visible, or while the dedicated release-smoke summary is missing/invalid. It does not print deployment-key values.

After `BEM-37.424`, Firebase has a narrower runtime-delivery prerequisite handoff for the point before real FCM, Crashlytics, and Analytics delivery testing:

```powershell
corepack yarn firebase:runtime:delivery:handoff:dry-run
corepack yarn firebase:runtime:delivery:handoff
```

This optionally refreshes Android release APK evidence with `SENTRY_DISABLE_AUTO_UPLOAD=true`, runs the Android release embedded smoke, validates the release-smoke summary, refreshes Firebase release-services and push-notification bridge summaries, then finishes with the aggregate release-services summary checker. The executable handoff confirms local Firebase package/config/runtime wiring, Android release evidence, APK manifest proof, release APK startup proof, and static push bridge readiness, but it keeps Firebase and push runtime delivery explicitly `not claimed` until a real release-runtime/device test confirms FCM token/notification delivery, Crashlytics upload, and Analytics behavior.

## Current Release Readiness Snapshot

Checked on 2026-06-12 after the RN `0.86.0` foundation, Android release build evidence refresh, Android `devRelease` embedded smoke, and release-services aggregate refresh:

```powershell
JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:release:verify-local
corepack yarn android:dev:release:check-summary
corepack yarn android:dev:release:check-apk-manifest
corepack yarn android:dev:release:smoke:embedded
corepack yarn android:dev:release:check-smoke-summary
corepack yarn release-services:validation:handoff --skip-android-release
corepack yarn release-services:check-summaries
```

Results:

- CodePush release-path wiring is removed from non-dev runtime, Android, iOS, package, and lockfile surfaces.
- Android local release evidence was refreshed on 2026-06-16 and covers `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease` with JDK `17.0.19`, AGP `8.13.2`, Gradle `8.13`, Kotlin `2.1.20`, compile SDK `36`, target SDK `36`, and Sentry auto upload disabled; the summary records APK path, byte count, SHA-256, JS bundle, and source-map evidence for each unsigned release artifact.
- Android release APK manifest proof is valid for the current `dev`, `stage`, `prod`, and `beta` release artifacts.
- Android `devRelease` embedded smoke passed on `emulator-5554` with Metro not required, first-run terms/PIN/transaction-password setup completed, empty-wallet dashboard reached, Create/Import CTA navigation validated, tab navigation validated, QR scanner screen validated, and no fatal/runtime logcat findings.
- CodePush package readiness records live npm latest metadata for historical context and confirms the app package is removed.
- CodePush upstream retirement readiness records App Center CodePush retirement on 2025-03-31, archived Microsoft upstream state, lack of upstream New Architecture support, Android `newArchEnabled=true`, and `CodePush migration required: no` after removal.
- CodePush release-path env readiness is recorded as removed without printing deployment-key values.
- CodePush release-path package readiness verifies that `package.json` and `node_modules` no longer carry `react-native-code-push`.
- CodePush update validation remains `not claimed`; OTA delivery is no longer a supported release path unless a maintained replacement is selected.
- CodePush decision handoff confirms the current posture as `remove` and the beta strategy as `beta has no OTA`; stale `CODEPUSH_*` env values remain cleanup-only and must not be printed.
- Android release compilation no longer depends on beta or non-beta env files defining CodePush deployment keys.
- CodePush release-path audit now records whether the latest local Android release summary artifact is present, valid, covers the current release inputs, covers `dev`, `stage`, `prod`, and `beta` release APK evidence, and has valid release APK manifest proof; it emits a dedicated `CodePush release build evidence ready` line so APK/bundle/manifest evidence is separate from still-unclaimed update validation.
- `corepack yarn codepush:env-cleanup:plan` writes a local review-safe cleanup plan that lists only env file paths, CodePush key names, blank/non-empty state, and whether secure env regeneration is required; it does not print deployment-key values.
- Firebase release-services wiring is valid for the current `24.1.1` package family, Android config, iOS plist files, and Messaging runtime paths.
- Firebase release-services audit now records whether the latest local Android release summary artifact is present, valid, covers the current release inputs, covers `dev`, `stage`, `prod`, and `beta` release APK evidence, and has valid release APK manifest proof, so APK/bundle/manifest evidence is separate from unclaimed FCM/Crashlytics/Analytics runtime delivery validation.
- Firebase `24.1.1` Android `devDebug` builds after removing legacy manual `firebase-core:16.0.3`, Firebase BoM `28.2.0`, and unused `firebaseVersion`/`googlePlayServicesVersion` Gradle ext values.
- RN Firebase `24.1.1` emits a legacy-architecture deprecation warning during Gradle configuration; future RN baseline work should track New Architecture readiness separately from this Firebase package upgrade.
- Sentry release source-map upload validation is still not ready locally because `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are unavailable in the current shell.
- Sentry SDK and CLI package targets remain current on 2026-06-16: `@sentry/react-native@8.14.0` and direct `@sentry/cli@3.5.1`.
- The Sentry prerequisite audit now records per-file readiness for the root, Android, and iOS Sentry properties files, validates that `create-sentry-properties.sh` writes all three expected paths with the expected non-secret defaults, supports optional `SENTRY_ORG` / `SENTRY_PROJECT` overrides, verifies that the local direct `@sentry/cli` package binary is present and executable, records nested `@sentry/cli@3.5.0` copies under Sentry-owned SDK tooling, and guards that release build phases use the direct root CLI package.
- Sentry `8.14.0` keeps the Android Gradle/source-map wiring visible and no active Sentry `execResult` warning is reported on the RN `0.86.0` baseline. The repo-owned legacy args shim lets Sentry read release bundle output and source-map output from RN `0.86.0` bundle tasks, so local Android release validation now produces source maps for `dev`, `stage`, `prod`, and `beta` without the previous `Could not extract bundle task arguments` warning. Release artifact upload still needs credentials before it can be claimed as fully validated.
- The 2026-06-16 Sentry-specific refresh validated current Android release build, manifest, release-smoke, and release create-wallet evidence against the Sentry prerequisite audit. The release upload path remains blocked only by missing `SENTRY_AUTH_TOKEN`, `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties`.
- Sentry/RN bundle task compatibility is now guarded by `corepack yarn sentry:rn-bundle-task-compat:audit` and `corepack yarn sentry:rn-bundle-task-compat:check-summary`; current static evidence reports the path `ready` because Sentry can use the repo-owned legacy args shim when RN `0.86.0` exposes `jsIntermediateSourceMapsDir` as `RegularFileProperty` and does not expose the fallback `args` property directly.
- Push notification bridge wiring is valid for `@react-native-community/push-notification-ios@1.12.0`, but APNs registration, token handling, foreground/background delivery, badge behavior, and tap-through behavior remain `not claimed` until iOS device/simulator validation runs on macOS.
- iOS static release files remain valid for RN `0.86.0`, minimum iOS `15.1`, and 8 guarded schemes, but macOS archive readiness remains blocked because this Windows machine has no `xcodebuild`, no CocoaPods, and `ios/Podfile.lock` still has 12 active drift entries after the RN/package upgrades.
- None of these audits print secret values.
- Do not generate placeholder Sentry secrets or stale CodePush secrets; missing Sentry values remain explicit readiness blockers until provided by environment/config.

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

- `android/build.gradle` uses Google Services Gradle plugin `4.4.4`, Crashlytics Gradle plugin `3.0.7`, and strict version matcher plugin `1.2.4`.
- `android/app/build.gradle` applies `com.google.firebase.crashlytics`, Sentry Gradle script, and `com.google.gms.google-services`.
- Android Firebase package versions are now supplied by React Native Firebase `24.1.1`; the old manual `firebase-core:16.0.3` and app-level Firebase BoM `28.2.0` entries were removed to avoid duplicate measurement classes.
- Android Firebase config files exist under flavor-specific `android/app/src/*/google-services.json`.
- `MainApplication.java` no longer resolves JS bundles through CodePush.
- `android/app/src/main/res/values/strings.xml` no longer has the native `CodePushDeploymentKey` placeholder.

iOS:

- Firebase plist files exist for dev, stage, prod, and default variants.
- Xcode project settings reference flavor-specific `FIREBASE_CONFIG_FILE` values.
- Xcode project has Sentry React Native bundling and dSYM upload build phases.
- iOS Info.plist files no longer use `$(CODEPUSH_DEPLOYMENT_KEY_IOS)`, and `AppDelegate.m` no longer uses CodePush bundle URLs.
- The main, Dev, Stage, and Beta iOS Info.plist files declare `UIBackgroundModes` with `remote-notification`; the app delegate assigns `UNUserNotificationCenter` delegate for foreground presentation callbacks.
- `docs/ios-release-config-compatibility-audit.md` records the current iOS scheme-to-env/Firebase plist mapping before release-service or rebranding changes.

Shared env/config:

- `src/config/index.ts` reads `SENTRY_DSN_IOS`, `SENTRY_DSN_ANDROID`, and `EMAIL_NOTIFICATIONS_API` through `react-native-config`; CodePush keys are no longer consumed by app code.
- `.env.*` files are present for dev, beta, stage, prod, testnet, and test configurations.

## Upgrade Risk

- Firebase RN `24.1.1` is the current package family and must stay aligned across app, analytics, Crashlytics, and messaging.
- Android Firebase build plugins are on the latest checked Google Maven metadata as of 2026-06-05: Google Services Gradle plugin `4.4.4` and Firebase Crashlytics Gradle plugin `3.0.7`; strict version matcher remains current at `1.2.4`.
- Firebase changes can still affect Android Gradle plugins, Firebase BoM, google-services files, iOS pods, plist selection, analytics, Crashlytics, messaging permissions, and token registration.
- `corepack yarn firebase:release-services:audit` verifies current Firebase package family alignment, Android Gradle/config files, iOS plist files, Messaging runtime wiring, latest local Android `dev`/`stage`/`prod`/`beta` release summary evidence, current release-input coverage, and unclaimed runtime-delivery status before a Firebase family upgrade. It writes `local-docs/firebase-release-services-summary.txt`.
- `corepack yarn firebase:release-services:check-summary` validates the generated local Firebase release-services summary.
- `corepack yarn firebase:runtime:delivery:handoff` validates the local Firebase runtime-delivery prerequisites and static push bridge prerequisites without claiming real FCM, Crashlytics, Analytics, or push delivery behavior.
- CodePush removal can affect non-dev startup and release bundling, so removal branches still require Android debug/release builds and emulator smoke.
- `react-native-code-push` was removed after the RN `0.86.0` proof and a 2026-06-11 live npm/GitHub refresh confirmed the latest package was archived/retired infrastructure rather than a viable long-term update target.
- `corepack yarn codepush:release:path-audit` verifies the removed state, latest historical npm/upstream metadata, latest local Android `dev`/`stage`/`prod`/`beta` release summary evidence, current release-input coverage, the dedicated release-build evidence readiness line, and unclaimed OTA update-validation status without printing deployment-key values. It writes `local-docs/codepush-release-path-summary.txt`.
- `corepack yarn codepush:release:path-check-summary` validates the generated local CodePush release-path summary.
- Sentry changes can affect release bundling, source-map upload, dSYM upload, DSN handling, and Android Gradle integration even though the active RN `0.86.0` warning audit no longer reports Sentry `execResult`.
- `@sentry/react-native` is on latest checked `8.14.0` after the Sentry SDK upgrade; Android build and smoke validation are required for any future runtime/package Sentry branch, while source-map/dSYM upload remains blocked locally until Sentry credentials/properties are available and the credentialed release runner proves upload.
- `corepack yarn sentry:release:prereq-audit` reports whether local `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are available before Sentry release/source-map validation, verifies that the properties generator supports `SENTRY_ORG` / `SENTRY_PROJECT` release-target overrides, verifies the local direct `@sentry/cli` package/bin, records direct and nested Sentry CLI package versions, checks that Android/iOS release build paths use the direct root CLI package, checks latest local Android `dev`/`stage`/`prod`/`beta` release summary evidence plus current release-input coverage, and writes `local-docs/sentry-release-prereq-summary.txt`. The prerequisite status can only be `ready` when the Android release summary is present, covers dev/stage/prod/beta, matches current release inputs, has valid APK manifest proof, and the Sentry CLI release path points at the direct root package.
- After `BEM-37.338`, Sentry release prerequisite audit also requires the local Android release summary to cover `beta` release evidence before release-build evidence is considered complete.
- `corepack yarn sentry:release:prereq-check-summary` validates the generated local prerequisite summary, including per-file readiness counts, Sentry CLI readiness, generator output coverage, and secret-safe output.
- `corepack yarn sentry:release:create-properties` is the guarded cross-platform command for generating the three Sentry properties files after `SENTRY_AUTH_TOKEN` is available.
- `corepack yarn check:sentry-properties-generator` validates the cross-platform Node Sentry properties generator in a temp root, including missing-token failure, root/Android/iOS output, org/project overrides, and secret-safe output.
- `corepack yarn sentry:release:credential-plan` writes `local-docs/sentry-release-credential-plan.txt` with the current Sentry release credential handoff state, including only file paths, env variable names, command names, missing/invalid properties-file counts, Android release evidence readiness, and the unclaimed upload-validation state.
- `corepack yarn sentry:release:credential-plan:check` validates the local credential plan and rejects token, DSN, or `auth.token` value leakage.
- `corepack yarn sentry:release:validation:handoff:dry-run` renders the Sentry release prerequisite handoff without printing token assignments.
- `corepack yarn sentry:release:validation:handoff` runs the Sentry release prerequisite handoff after `SENTRY_AUTH_TOKEN` is available; without that variable it fails before properties generation with a clear missing-env blocker.
- `corepack yarn check:sentry-release-validation-handoff-guard` validates the Sentry handoff command sequence, secret-safe rendering, required-env handling, `--skip-android-release` behavior, and the final release-smoke readiness check.
- `corepack yarn sentry:android-warning:audit` confirms the current Sentry Android Gradle/source-map wiring remains tracked before a dedicated Sentry release/source-map cleanup branch and writes `local-docs/sentry-android-warning-summary.txt`.
- `corepack yarn sentry:android-warning:check-summary` validates the generated local Android warning summary.
- `corepack yarn sentry:rn-bundle-task-compat:audit` records the Sentry/RN bundle task compatibility status and writes `local-docs/sentry-rn-bundle-task-compatibility-summary.txt`.
- `corepack yarn sentry:rn-bundle-task-compat:check-summary` validates the generated local compatibility summary.
- Push notification changes need Android 13+ permission checks, Firebase Messaging token checks, and iOS permission/token validation.
- `@react-native-community/push-notification-ios` is on latest checked `1.12.0` after `BEM-36.75`; this Android-side branch does not replace dedicated iOS push validation.
- `corepack yarn push-notification:bridge-audit` verifies current iOS push notification bridge wiring and static readiness. It writes `local-docs/push-notification-bridge-summary.txt`.
- `corepack yarn push-notification:bridge-check-summary` validates the generated local push notification bridge summary. After `BEM-37.79`, the audit reports no static readiness issues, but APNs registration, token, foreground/background delivery, badge, and tap-through behavior still require iOS simulator/device validation.
- `corepack yarn ios:release:readiness:audit` verifies static iOS release files, schemes, Firebase plist mapping, CodePush plist placeholders, Sentry source-map/dSYM phases, remote-notification plist coverage, removed-pod lockfile references, active Podfile.lock drift, and xcodebuild availability. The 2026-06-16 refresh reports static iOS files valid, 8 guarded schemes, 4 remote-notification plists including Beta, 0 removed Podfile.lock pod references, 12 active Podfile.lock drift issues, missing local xcodebuild/CocoaPods on Windows, and iOS runtime delivery validation not claimed until `pod install`, simulator/archive validation, and device/service checks run on macOS.
- `corepack yarn ios:podfile-refresh:plan` writes a local macOS handoff plan for the active `ios/Podfile.lock` drift list, including `pod install`, iOS release-readiness re-audit, and `ios:mac-validation:handoff` commands without claiming iOS runtime delivery.
- `corepack yarn release-services:check-summaries` validates the generated Android release-smoke, Sentry, Firebase, CodePush, push-notification, iOS release-readiness, and iOS macOS validation-prerequisite summary artifacts together so the aggregate release-services gate covers Android release build/manifest evidence, Android release embedded startup/CTA/tab proof, static iOS release readiness, and the macOS-only iOS handoff prerequisites.

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
corepack yarn android:dev:verify
```

Release-service-specific validation:

- Firebase Messaging: confirm Android 13+ notification permission, FCM token retrieval, and notification handling path; start with `corepack yarn check:android-notification-permission-flow-guard`, `corepack yarn check:android-notification-permission-flow`, `corepack yarn firebase:release-services:audit`, and `corepack yarn firebase:release-services:check-summary`.
- Crashlytics: confirm Android Crashlytics Gradle task configuration and iOS pod/build integration; start with `corepack yarn firebase:release-services:audit` and `corepack yarn firebase:release-services:check-summary`.
- Analytics: confirm app startup does not crash and analytics package initialization remains compatible; start with `corepack yarn firebase:release-services:audit` and `corepack yarn firebase:release-services:check-summary`.
- CodePush: validate a non-dev build path because CodePush is disabled under `__DEV__`; start with `corepack yarn codepush:release:path-audit` and `corepack yarn codepush:release:path-check-summary`.
- Sentry: start with `corepack yarn sentry:android-warning:audit`, `corepack yarn sentry:android-warning:check-summary`, `corepack yarn sentry:release:credential-plan`, `corepack yarn sentry:release:credential-plan:check`, `corepack yarn sentry:release:prereq-audit`, `corepack yarn sentry:release:prereq-check-summary`, `corepack yarn android:dev:release:validate-local`, and `corepack yarn android:dev:release:check-summary`, then validate Android source-map upload and iOS dSYM/source-map upload path after the three required properties files and `SENTRY_AUTH_TOKEN` are present.
- iOS push: start with `corepack yarn push-notification:bridge-audit` and `corepack yarn push-notification:bridge-check-summary`, then validate APNs registration, token, foreground/background delivery, badge reset, and tap-through behavior on a Mac runner/device.
- Secrets: do not guess `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, CodePush deployment keys, or Firebase config values. If missing locally, record the exact missing variable/file.

## Current Conclusion

Release-service dependencies are a separate modernization stream inside BEM-36. The next implementation work should start with Firebase family alignment or Sentry source-map tooling, but only after the current Android debug baseline remains green and the release validation path is explicitly available.
