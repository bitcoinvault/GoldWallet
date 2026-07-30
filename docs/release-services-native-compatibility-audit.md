# Release Services Native Compatibility Audit

Scope: `BEM-36 - Native modules upgrade`, release-service group.

React Native baseline: `0.86.2`.

This audit records the current Firebase, push, CodePush, and Sentry surface before any dependency change. These packages should not be upgraded together with unrelated native cleanup, because they affect build tooling, notifications, crash reporting, analytics, release assets, and environment-specific configuration.

## Current Package State

| Package | Current package.json | Latest npm checked | Notes |
| --- | --- | --- | --- |
| `@react-native-firebase/app` | `26.0.0` | `26.0.0` on 2026-07-30 | Current package pulls `firebase@12.15.0`; App/Core requires React Native New Architecture. |
| `@react-native-firebase/analytics` | `26.0.0` | `26.0.0` on 2026-07-30 | Peer requires matching `@react-native-firebase/app@26.0.0`. |
| `@react-native-firebase/crashlytics` | `26.0.0` | `26.0.0` on 2026-07-30 | Peer requires matching `@react-native-firebase/app@26.0.0`. |
| `@react-native-firebase/messaging` | `26.0.0` | `26.0.0` on 2026-07-30 | Peer requires matching `@react-native-firebase/app@26.0.0`; Messaging requires React Native New Architecture. |
| `@react-native-community/push-notification-ios` | `1.12.0` | `1.12.0` | iOS notification bridge; no Android impact. |
| `react-native-code-push` | removed | `9.0.1` on 2026-06-24 | Removed in `BEM-37.583`; App Center CodePush was retired on 2025-03-31, the Microsoft `react-native-code-push` repository was archived on 2025-05-20, and upstream does not support New Architecture on React Native `>=0.76`. |
| `@sentry/react-native` | `8.21.0` | `8.21.0` on 2026-07-30 | Latest checked SDK line; source-map and dSYM upload must still be proven with local credentials. |
| `@sentry/cli` | `3.6.1` | `3.6.1` on 2026-07-21 | Explicit direct release-tooling dependency; a scoped resolution deduplicates SDK requests for `3.6.0`, and the prerequisite audit verifies that release build phases resolve the direct root CLI package. |

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

The 2026-07-10 CodePush posture refresh confirms `react-native-code-push@9.0.1` is still the latest npm release, Microsoft `react-native-code-push` and `code-push-server` are still archived, local runtime/native/package/env/plist CodePush surfaces remain removed, `Decision: remove` is the current handoff posture, beta has no OTA, `Release path ready for update validation` is `no` in the removed state, and OTA update validation remains `not claimed`.

After `BEM-37.421`, Sentry has a narrower source-map prerequisite handoff for the point when `SENTRY_AUTH_TOKEN` is available:

```powershell
corepack yarn sentry:release:validation:handoff:dry-run
corepack yarn sentry:release:validation:handoff
```

This validates the properties generator, optionally refreshes Android release APK evidence with `SENTRY_DISABLE_AUTO_UPLOAD=true`, runs the Android release embedded smoke, validates the release-smoke summary, generates `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties` from the local Sentry env, then refreshes and validates the Sentry release prerequisite summary plus the aggregate release-services summary artifacts. The dry run prints only required env variable names, not token values. Use `--skip-android-release` only when the latest Android release summary and release-smoke summary already match the current release inputs.

After `BEM-37.699`, the Sentry handoff also supports a non-secret preflight path for local readiness checks without generating properties:

```powershell
corepack yarn sentry:release:validation:preflight:dry-run
corepack yarn sentry:release:validation:preflight
```

This validates the current Sentry SDK/CLI targets, Android warning surface, RN bundle task compatibility, current Android release/smoke/create-wallet evidence, and aggregate release-services summaries while keeping release upload explicitly `not claimed` until `SENTRY_AUTH_TOKEN` and the three `sentry.properties` files are available.

After `BEM-37.422`, CodePush has a narrower update-validation handoff for the point when deployment keys and beta strategy are available:

```powershell
corepack yarn codepush:update:validation:handoff:dry-run
corepack yarn codepush:update:validation:handoff
```

This optionally refreshes Android release APK evidence with `SENTRY_DISABLE_AUTO_UPLOAD=true`, runs the Android release embedded smoke, validates the release-smoke summary, refreshes CodePush release-path, migration-readiness, and removal-readiness summaries, then finishes with the aggregate release-services summary checker and a direct Android release-smoke readiness check. The executable handoff remains blocked while the release-path summary says `Release path ready for update validation: no`, while `CodePush update validation` is still `not claimed`, while CodePush is removed without a maintained replacement, while the App Center retirement migration requirement is not visible, or while the dedicated release-smoke summary is missing/invalid. It does not print deployment-key values.

After `BEM-37.424`, Firebase has a narrower runtime-delivery prerequisite handoff for the point before real FCM, Crashlytics, and Analytics delivery testing:

```powershell
corepack yarn firebase:runtime:delivery:handoff:dry-run
corepack yarn firebase:runtime:delivery:handoff
```

This optionally refreshes Android release APK evidence with `SENTRY_DISABLE_AUTO_UPLOAD=true`, runs the Android release embedded smoke, validates the release-smoke summary, refreshes Firebase release-services and push-notification bridge summaries, then finishes with the aggregate release-services summary checker. The executable handoff confirms local Firebase package/config/runtime wiring, Android release evidence, APK manifest proof, release APK startup proof, and static push bridge readiness, but it keeps Firebase and push runtime delivery explicitly `not claimed` until a real release-runtime/device test confirms FCM token/notification delivery, Crashlytics upload, and Analytics behavior.

The 2026-06-24 Firebase package refresh upgrades `@react-native-firebase/app`, `analytics`, `crashlytics`, and `messaging` to the live npm latest `25.0.1`; `@react-native-community/push-notification-ios` remains current at `1.12.0`. Android release build and manifest evidence are current for the new package/lockfile inputs, and a `prodDebug` embedded smoke on `.env.prod.mainnet` passes first-run, dashboard, Create/Import CTA, QR scanner, tab navigation, and Terms WebView checks. The default dev/testnet release handoff remains blocked by the external Electrum TLS certificate expiry (`Certificate expired at Tue Jun 23 16:52:40 GMT 2026`), so real FCM token/notification delivery, Crashlytics upload, Analytics behavior, APNs registration, badge behavior, and tap-through behavior remain explicitly `not claimed`.

The 2026-06-29 Firebase package refresh upgrades the same React Native Firebase package family to the live npm latest `25.1.0`; `@react-native-community/push-notification-ios` remains current at `1.12.0`. Android release evidence must be refreshed after the package/lockfile input change before Firebase release-services can again report current release inputs.

The 2026-07-30 Firebase major refresh upgrades the aligned package family to the live npm latest `26.0.0`. React Native `0.86.2`, `newArchEnabled=true`, Android JDK 17, and iOS deployment target `15.1` meet the package prerequisites. Android debug and all four release variants build with Firebase BoM `34.15.0`; the signed `devRelease` no-network smoke passes without fatal RN/native/Firebase findings. Real FCM delivery, Analytics event delivery, and Crashlytics event delivery remain explicitly `not claimed` until service-side/device evidence is captured.

## Current Release Readiness Snapshot

Checked on 2026-06-17 after the RN `0.86.2` foundation, Android release build evidence refresh, Android `devRelease` embedded smoke, and release-services aggregate refresh:

```powershell
JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:release:verify-local
corepack yarn android:dev:release:check-summary
corepack yarn android:dev:release:check-apk-manifest
corepack yarn android:dev:release:smoke:embedded
corepack yarn android:dev:release:check-smoke-summary
corepack yarn release-services:validation:handoff --skip-android-release --codepush-decision remove --codepush-beta-strategy beta-has-no-ota
corepack yarn release-services:check-summaries
```

Results:

- A focused 2026-07-10 CodePush semantics refresh reran live npm/GitHub checks plus CodePush release-path, migration-readiness, removal-readiness, env-cleanup, and aggregate release-services checks against the existing Android release evidence. It did not rebuild APKs or claim OTA delivery; it confirms `CodePush removed: yes`, `Release path ready for update validation: no`, `CodePush migration required: no`, `Current posture: removed`, `Long-term options: removed`, runtime/native/package/env/plist surfaces removed, release build evidence ready, release smoke/create-wallet evidence not ready under the current controlled external-network blocker, `0` readiness issues, `0` wiring errors, and `Secret values printed: no`.
- A focused 2026-07-11 Sentry package/prerequisite refresh reran live npm checks, Android warning/source-map wiring audits, RN bundle-task compatibility, release prerequisite, credential-plan, Sentry preflight dry-run, and release-service summary validation against refreshed Android release and iOS static handoff evidence. It does not claim credentialed upload; it confirms `@sentry/react-native@8.18.0` and direct `@sentry/cli@3.6.0` are current, Android warning wiring is valid, RN bundle-task compatibility remains ready through the repo-owned shim, release-services remains valid only under the controlled Electrum certificate blocker, `Sentry release upload validation: not claimed`, missing properties files `3`, `SENTRY_AUTH_TOKEN available in current shell: no`, iOS macOS archive validation not ready, active `ios/Podfile.lock` drift issues `12` including `RNSentry 3.1.0` versus package `8.18.0`, and `Secret values printed: no`.
- A focused 2026-06-24 Firebase package refresh upgraded the React Native Firebase family to `25.0.1` and `firebase@12.15.0`. Static guards pass for Firebase runtime scope, Messaging modular API, Android 13 notification permission, iOS push bridge scope, and push bridge readiness. Android `devDebug`, `prodDebug`, and `dev`/`stage`/`prod`/`beta` release evidence build with the upgraded packages; `firebase:release-services:audit` reports current Android release inputs, valid manifests, `0` wiring errors, and Firebase runtime delivery `not claimed`. `prodDebug` embedded smoke passes on `.env.prod.mainnet`; `devDebug` and `devRelease` embedded smoke remain blocked by the external dev testnet Electrum TLS certificate expiry, not by a Firebase package crash.
- The 2026-06-17 aggregate release-services refresh completed against the current Android release evidence without rebuilding APKs: Sentry Android warning, Sentry RN bundle task compatibility, Sentry release prerequisite, Firebase release-services, CodePush release path, CodePush migration/removal/env cleanup readiness, CodePush decision handoff, push notification bridge, iOS release readiness, iOS macOS prerequisite, iOS Podfile refresh plan, iOS validation handoff, and the final aggregate `release-services:check-summaries` gate all validated.
- CodePush release-path wiring is removed from non-dev runtime, Android, iOS, package, and lockfile surfaces.
- Android local release evidence was refreshed on 2026-06-17 and covers `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease` with JDK `17.0.19`, AGP `8.13.2`, Gradle `8.13`, Kotlin `2.1.20`, compile SDK `36`, target SDK `36`, and Sentry auto upload disabled; the summary records APK path, byte count, SHA-256, JS bundle, and source-map evidence for each unsigned release artifact.
- Android release APK manifest proof is valid for the current `dev`, `stage`, `prod`, and `beta` release artifacts.
- Android `devRelease` embedded smoke passed on `emulator-5554` with Metro not required, first-run terms/PIN/transaction-password setup completed, empty-wallet dashboard reached, Create/Import CTA navigation validated, tab navigation validated, QR scanner screen validated, and no fatal/runtime logcat findings.
- CodePush package readiness records live npm latest metadata for historical context and confirms the app package is removed.
- CodePush upstream retirement readiness records App Center CodePush retirement on 2025-03-31, Microsoft `react-native-code-push` archive date 2025-05-20, archived upstream state, lack of upstream New Architecture support for React Native `>=0.76`, Android `newArchEnabled=true`, and `CodePush migration required: no` after removal.
- CodePush release-path env readiness is recorded as removed without printing deployment-key values.
- CodePush release-path package readiness verifies that `package.json` and `node_modules` no longer carry `react-native-code-push`.
- CodePush update validation remains `not claimed`; OTA delivery is no longer a supported release path unless a maintained replacement is selected and validated, and the removed-state release-path summary must stay `Release path ready for update validation: no`.
- CodePush decision handoff confirms the current posture as `remove` and the beta strategy as `beta has no OTA`; stale `CODEPUSH_*` env values remain cleanup-only and must not be printed.
- Android release compilation no longer depends on beta or non-beta env files defining CodePush deployment keys.
- CodePush release-path audit now records whether the latest local Android release summary artifact is present, valid, covers the current release inputs, covers `dev`, `stage`, `prod`, and `beta` release APK evidence, and has valid release APK manifest proof; it emits a dedicated `CodePush release build evidence ready` line so APK/bundle/manifest evidence is separate from still-unclaimed update validation.
- `corepack yarn codepush:env-cleanup:plan` writes a local review-safe cleanup plan that lists only env file paths, CodePush key names, blank/non-empty state, and whether secure env regeneration is required; it does not print deployment-key values.
- Firebase release-services wiring is valid for the current `26.0.0` package family, Android config, iOS plist files, and Messaging runtime paths.
- Firebase release-services audit now records whether the latest local Android release summary artifact is present, valid, covers the current release inputs, covers `dev`, `stage`, `prod`, and `beta` release APK evidence, and has valid release APK manifest proof, so APK/bundle/manifest evidence is separate from unclaimed FCM/Crashlytics/Analytics runtime delivery validation.
- The 2026-06-24 Firebase release-services refresh reports React Native Firebase package current `yes`, Firebase release-services wiring valid `yes`, Android release summary present/valid/current, Android release APK manifest valid, and Firebase runtime delivery validation `not claimed`.
- Firebase `25.0.1` Android `devDebug` and `prodDebug` build after removing legacy manual `firebase-core:16.0.3`, Firebase BoM `28.2.0`, and unused `firebaseVersion`/`googlePlayServicesVersion` Gradle ext values.
- RN Firebase `25.0.1` still emits a legacy-architecture deprecation warning during Gradle configuration; future RN baseline work should track New Architecture readiness separately from this Firebase package upgrade.
- Sentry release source-map upload validation is still not ready locally because `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are unavailable in the current shell.
- Sentry SDK and CLI package targets remain current on 2026-07-21: `@sentry/react-native@8.19.0` and direct `@sentry/cli@3.6.1`.
- The Sentry prerequisite audit records per-file readiness for the root, Android, and iOS Sentry properties files, validates that `create-sentry-properties.sh` writes all three expected paths with the expected non-secret defaults, supports optional `SENTRY_ORG` / `SENTRY_PROJECT` overrides, verifies that the local direct `@sentry/cli` package binary is present and executable, requires the aggregate and nested version lists to exactly match discovered installations, and verifies that the Android resolver plus iOS build phases use the direct root CLI package.
- Sentry `8.19.0` keeps the Android Gradle/source-map wiring visible and no active Sentry `execResult` warning is reported on the RN `0.86.2` baseline. The repo-owned legacy args shim lets Sentry read release bundle output and source-map output from RN `0.86.2` bundle tasks; Android release validation proves source-map generation for `dev`, `stage`, `prod`, and `beta`. Release artifact upload still needs credentials before it can be claimed as fully validated.
- The 2026-06-17 release-services refresh validated current Android release build, manifest, release-smoke, and release create-wallet evidence against the Sentry prerequisite audit. The Sentry release upload path remains blocked by missing `SENTRY_AUTH_TOKEN`, `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, plus iOS archive readiness because this Windows host cannot refresh `ios/Podfile.lock` or run Xcode/CocoaPods validation.
- The Sentry preflight handoff now completes without `SENTRY_AUTH_TOKEN` when release evidence is already fresh, proving the non-secret release-source-map readiness path while preserving the credentialed upload blocker.
- Sentry/RN bundle task compatibility is now guarded by `corepack yarn sentry:rn-bundle-task-compat:audit` and `corepack yarn sentry:rn-bundle-task-compat:check-summary`; current static evidence reports the path `ready` because Sentry can use the repo-owned legacy args shim when RN `0.86.2` exposes `jsIntermediateSourceMapsDir` as `RegularFileProperty` and does not expose the fallback `args` property directly.
- Push notification bridge wiring is valid for `@react-native-community/push-notification-ios@1.12.0`, but APNs registration, token handling, foreground/background delivery, badge behavior, and tap-through behavior remain `not claimed` until iOS device/simulator validation runs on macOS.
- The 2026-06-17 push notification bridge refresh reports dependency version `1.12.0`, installed version `1.12.0`, latest version `1.12.0`, static readiness issues `0`, wiring errors `0`, and push notification runtime delivery validation `not claimed`.
- iOS static release files remain valid for RN `0.86.2`, minimum iOS `15.1`, and 8 guarded schemes, but macOS archive readiness remains blocked because this Windows machine has no `xcodebuild`, no CocoaPods, and `ios/Podfile.lock` still has 12 active drift entries after the RN/package upgrades.
- The 2026-06-17 iOS validation handoff refresh reports static iOS files valid, 0 removed Podfile.lock pod references, 12 active Podfile.lock drift issues, platform `win32`, unavailable `xcodebuild`, unavailable CocoaPods, `Implementation ready: no`, `Secret values printed: no`, and `iOS runtime delivery validation: not claimed`.
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

- `android/build.gradle` uses Google Services Gradle plugin `4.5.0`, Crashlytics Gradle plugin `3.0.7`, and strict version matcher plugin `1.2.4`.
- `android/app/build.gradle` applies `com.google.firebase.crashlytics`, Sentry Gradle script, and `com.google.gms.google-services`.
- Android Firebase package versions are now supplied by React Native Firebase `26.0.0`; the old manual `firebase-core:16.0.3` and app-level Firebase BoM `28.2.0` entries were removed to avoid duplicate measurement classes.
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

- Firebase RN `26.0.0` is the current package family and must stay aligned across app, analytics, Crashlytics, and messaging; App/Core and Messaging require React Native New Architecture.
- Android Firebase build plugins are on the latest checked Google Maven metadata as of 2026-07-11: Google Services Gradle plugin `4.5.0` and Firebase Crashlytics Gradle plugin `3.0.7`; strict version matcher remains current at `1.2.4`.
- Firebase changes can still affect Android Gradle plugins, Firebase BoM, google-services files, iOS pods, plist selection, analytics, Crashlytics, messaging permissions, and token registration.
- `corepack yarn firebase:release-services:audit` verifies current Firebase package family alignment, Android Gradle/config files, iOS plist files, Messaging runtime wiring, latest local Android `dev`/`stage`/`prod`/`beta` release summary evidence, current release-input coverage, and unclaimed runtime-delivery status before a Firebase family upgrade. It writes `local-docs/firebase-release-services-summary.txt`.
- `corepack yarn firebase:release-services:check-summary` validates the generated local Firebase release-services summary.
- `corepack yarn firebase:runtime:delivery:handoff` validates the local Firebase runtime-delivery prerequisites and static push bridge prerequisites without claiming real FCM, Crashlytics, Analytics, or push delivery behavior.
- CodePush removal can affect non-dev startup and release bundling, so removal branches still require Android debug/release builds and emulator smoke.
- `react-native-code-push` was removed after the RN `0.86.2` proof and a 2026-06-11 live npm/GitHub refresh confirmed the latest package was archived/retired infrastructure rather than a viable long-term update target.
- `corepack yarn codepush:release:path-audit` verifies the removed state, latest historical npm/upstream metadata, upstream archive date, upstream New Architecture unsupported React Native range, latest local Android `dev`/`stage`/`prod`/`beta` release summary evidence, current release-input coverage, the dedicated release-build evidence readiness line, and unclaimed OTA update-validation status without printing deployment-key values. It writes `local-docs/codepush-release-path-summary.txt`.
- `corepack yarn codepush:release:path-check-summary` validates the generated local CodePush release-path summary.
- Sentry changes can affect release bundling, source-map upload, dSYM upload, DSN handling, and Android Gradle integration even though the active RN `0.86.2` warning audit no longer reports Sentry `execResult`.
- `@sentry/react-native` is on latest checked `8.19.0` after the Sentry SDK upgrade, with direct `@sentry/cli@3.6.1`; Android build and smoke validation are required for any future runtime/package Sentry branch, while source-map/dSYM upload remains blocked locally until Sentry credentials/properties are available and the credentialed release runner proves upload.
- `corepack yarn sentry:release:prereq-audit` reports whether local `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are available before Sentry release/source-map validation, verifies that the properties generator supports `SENTRY_ORG` / `SENTRY_PROJECT` release-target overrides, verifies the local direct `@sentry/cli` package/bin, records direct and nested Sentry CLI package versions, checks that Android/iOS release build paths use the direct root CLI package, checks latest local Android `dev`/`stage`/`prod`/`beta` release summary evidence plus current release-input coverage, embeds iOS static/macOS prerequisite evidence including active `ios/Podfile.lock` drift, and writes `local-docs/sentry-release-prereq-summary.txt`. The prerequisite status can only be `ready` when the Android release summary is present, covers dev/stage/prod/beta, matches current release inputs, has valid APK manifest proof, the Sentry CLI release path points at the direct root package, iOS macOS archive validation is ready, and `ios/Podfile.lock` drift is zero.
- After `BEM-37.338`, Sentry release prerequisite audit also requires the local Android release summary to cover `beta` release evidence before release-build evidence is considered complete.
- `corepack yarn sentry:release:prereq-check-summary` validates the generated local prerequisite summary, including per-file readiness counts, Sentry CLI readiness, generator output coverage, iOS Podfile/macOS prerequisite accounting, and secret-safe output.
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
- `corepack yarn ios:release:readiness:audit` verifies static iOS release files, schemes, Firebase plist mapping, CodePush plist placeholders, Sentry source-map/dSYM phases, remote-notification plist coverage, removed-pod lockfile references, active Podfile.lock drift, and xcodebuild availability. The 2026-06-17 refresh reports static iOS files valid, 8 guarded schemes, 4 remote-notification plists including Beta, 0 removed Podfile.lock pod references, 12 active Podfile.lock drift issues, missing local xcodebuild/CocoaPods on Windows, and iOS runtime delivery validation not claimed until `pod install`, simulator/archive validation, and device/service checks run on macOS.
- `corepack yarn ios:podfile-refresh:plan` writes a local macOS handoff plan for the active `ios/Podfile.lock` drift list, including `pod install`, iOS release-readiness re-audit, the default `GoldWallet Dev (Debug)` handoff, and the full `ios:mac-validation:handoff --all-schemes` command without claiming iOS runtime delivery.
- `corepack yarn ios:mac-validation:handoff:preflight` runs the Windows-safe iOS static handoff by refreshing release readiness, macOS prerequisite, Podfile.lock refresh-plan, and combined handoff summaries, then rendering the selected macOS `ios:mac-validation:handoff` command sequence. It does not run `pod install` or `xcodebuild`, so it is evidence for local static readiness only; runtime/archive validation remains blocked until macOS/Xcode/CocoaPods refreshes `ios/Podfile.lock` and runs simulator/archive validation.
- `corepack yarn release-services:check-summaries` validates the generated Android release-smoke, Sentry, Firebase, CodePush, push-notification, iOS release-readiness, iOS macOS validation-prerequisite, iOS Podfile.lock refresh-plan, and iOS validation-handoff summary artifacts together so the aggregate release-services gate covers Android release build/manifest evidence, Android release embedded startup/CTA/tab proof, static iOS release readiness, active Podfile.lock drift handoff, and the macOS-only iOS handoff prerequisites.

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
