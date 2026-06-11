# Android Modernization Workflow

Use this workflow for Android maintenance branches under `upgrade/wallet-modernization`.

## Branching

- Start from `upgrade/wallet-modernization`.
- Create one mini-branch per topic, for example `feature/bem-37-sentry-warning-audit`.
- Commit only after validation.
- Merge back locally with `git merge --no-ff`.
- Do not push unless explicitly approved.

## Java

Use JDK 17 for local Android work:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
```

The Android Gradle runner checks `JAVA_HOME\bin\java.exe` before falling back to `java` from `PATH`. The AGP 8.13 baseline requires JDK 17.

## Checks

Run these for normal mini-branches:

```powershell
corepack yarn android:dev:check-light
```

For a quick local toolchain sanity check before Android build/smoke work:

```powershell
corepack yarn android:dev:env-audit
```

The environment audit verifies JDK 17, adb access, the required validation scripts, and the Android SDK 36 platform/build-tools directories used by the current Android baseline.

The environment audit checks the active Node version, `.nvmrc`, `JAVA_HOME`/Java major version, Android SDK/ADB discovery, Gradle wrappers, required validation helper files, and the package scripts used by the Android validation workflow, including the RN upgrade path audit scripts. It warns when Metro/dev runtime is not on Node 24 and fails when Java/ADB or required helper files are missing.

`check:android-dev-env-audit-guard` verifies the environment audit guard fixtures without depending on the current terminal's Java, Node, SDK, or ADB state.

Use `corepack yarn metro:dev-runtime:audit` to verify that `.nvmrc`, React Native, RN Babel/Metro config packages, README, workflow, and baseline docs still agree on the Node 24 Metro/dev runtime baseline.

Use `corepack yarn rn:upgrade-path:audit` before starting a React Native baseline branch to verify that the staged upgrade path, current RN `0.86.0` package baseline, Android SDK 36 toolchain baseline, and related documentation still agree.

Use the legacy-named `corepack yarn rn:076-foundation:audit` before the next React Native foundation branch to verify that the RN `0.86.0` checkpoint still includes React 19, Node 24, Metro/Babel, Android template, iOS Podfile, and package-only blocker scope.

Use `corepack yarn react:renderer-version:audit` before any React package movement to verify that `react` still matches the exact version required by the bundled `react-native-renderer`.

Use `corepack yarn rn:baseline:preflight` before changing React Native package versions. It starts with `check:node-runtime-version`, then runs the lightweight Android gate plus the Metro runtime, Node runtime transition audit, lint-staged, Husky, Prettier, and Jest tooling audits, RN upgrade path, RN target snapshot, the foundation target aggregate self-guard, offline target comparison guard, React 19 impact audit, React package coupling audit, React Native renderer exact-version audit, test/type coupling audit, wallet/crypto runtime audit, CryptoJS runtime audit, state runtime audit, Lodash runtime audit, wallet/crypto latest-snapshot summary guard, direct outdated snapshot summary guard, camera candidate and QR migration audits with generated summary validation, the Camera/QR validation handoff guard and dry-run, masked-view navigation migration with generated summary validation, secure-storage release-validation handoff guard and dry-run followed by migration/removal-readiness audits with generated summary validation, explorer/env config readiness, store metadata readiness, Sentry warning/source-map readiness audits with generated Android-warning and prerequisite-summary validation, the Sentry properties-generator guard, the aggregate warning-source summary checker, standalone Android warning-audit and smoke-summary checkers, Android notification permission flow guard, Firebase release-service with generated summary validation, the Firebase runtime-delivery handoff guard and dry-run, the CodePush update-validation handoff guard and dry-run, CodePush release-path, migration-readiness, removal-readiness, and decision-handoff audits with generated summary validation, push-notification bridge audit with generated summary validation, iOS release readiness audit guard validation, iOS release readiness summary guard validation, iOS macOS validation prerequisite summary validation, the iOS macOS validation handoff guard and dry-run, the Android release APK manifest guard root-isolation self-check, the release-services validation handoff guard, the aggregate release-services summary guard self-check, and the aggregate release-services summary checker as a single RN-baseline readiness pass.

Use `corepack yarn rn:baseline:preflight:online` at the start of an actual RN baseline branch when network access is available. It starts with `check:node-runtime-version`, refreshes and validates the live npm RN target snapshot, the direct outdated snapshot, the git dependency snapshot, the wallet/crypto latest snapshot, the storage/network latest snapshot, the tooling latest snapshot, the Android toolchain latest-target summary, the BL resolution readiness summary, and the node-fetch resolution summary first, validates those generated artifacts again through the aggregate `foundation:target:check-summaries` gate, then runs the normal offline RN baseline preflight.

`foundation:target:check-summaries` validates the generated RN target, direct outdated, git dependency, wallet/crypto latest, storage/network latest, tooling latest, Android toolchain target, BL resolution, and node-fetch resolution summaries together. The aggregate requires the live RN target snapshot to be matched with `0` mismatches, keeps known blockers visible before the next foundation branch, and avoids treating a narrow package-current check as proof that the full foundation target is ready.

`bl:resolution:audit` keeps the direct `bl` resolution blocker concrete. In addition to npm metadata it installs the current latest `bl` package in a temporary isolated probe directory, verifies that the current `bl@6.1.6` CommonJS runtime still works for guarded consumers, records whether the latest package exports `bl/package.json`, and records bare CJS `require('bl')` versus bare ESM import behavior. This keeps the `bl@7` decision tied to actual export-map compatibility rather than a generic outdated-package label.

`android:toolchain-target:audit` records the currently validated Android toolchain and the live latest stable AGP, current Gradle, and latest Kotlin targets. The current RN `0.86.0` baseline intentionally stays on AGP `8.13.2`, Gradle `8.13`, and Kotlin `2.1.20` because the checked AGP `9.2.1` path requires Gradle `9.4.1+`, while Gradle `9.4.1` and `9.5.1` fail compiling the included React Native Gradle plugin against newer embedded Kotlin runtime metadata.

Use `corepack yarn node:runtime-transition:audit` to verify that the current Node 24 Metro/dev runtime remains aligned with React Native `0.86.0` and the tooling baseline. Do not change `.nvmrc` as a standalone cleanup; keep it tied to a dedicated Node/tooling or React Native baseline branch.

Run React Native baseline preflight from the `.nvmrc` Node runtime. `android:dev:check-light`, `rn:baseline:preflight`, `rn:baseline:preflight:online`, Git `precommit`, and Git `prepush` all run `check:node-runtime-version` first to fail fast when a terminal is still using a non-`.nvmrc` Node runtime. The preflight also includes `corepack yarn lint-staged:tooling:audit`, `corepack yarn husky:tooling:audit`, `corepack yarn prettier:tooling:audit`, and `corepack yarn jest:tooling:audit`, so hook wiring, formatter integration, and Jest runtime resolutions are checked with the same Node 24 shell before larger RN/dependency branches.

Use `corepack yarn rn:target-snapshot:audit` to verify that the recorded npm target snapshot still matches the current repo baseline and supporting documentation. Use `corepack yarn rn:target-snapshot:current` when network access is available to compare the recorded snapshot against current npm metadata. Use `corepack yarn check:rn-target-snapshot-current-guard` for an offline self-check of the live comparison rules. Refresh `docs/react-native-target-snapshot.md` at the start of an actual RN baseline branch if npm/latest has moved.

Use `corepack yarn upgrade:strategy:audit` before dependency/RN baseline branches to keep the upgrade strategy aligned with layered milestone jumps. The default rule is to try the latest feasible target for the chosen layer, capture the exact blocker if it fails, then pick the highest compatible fallback instead of walking every minor version by default.

Use `corepack yarn tooling:latest-snapshot:audit` before tooling dependency branches when network access is available. It writes `local-docs/tooling-latest-snapshot.txt` with package specs, installed versions, live npm latest versions, and the current defer/upgrade decision for the tracked tooling cohort without changing package versions.

Use `corepack yarn check:detox-readiness` after Detox runner changes and as part of `corepack yarn rn:baseline:preflight`. It verifies that the npm `detox` version matches Android `com.wix:detox`, that `.detoxrc.json` uses the Detox 20 runner-object format, that Android Detox builds use the cross-platform `scripts/runDetoxAndroidBuild.mjs` wrapper, that iOS Detox builds use the guarded `scripts/runDetoxIosBuild.mjs` wrapper with existing Xcode schemes, and that the e2e environment imports `detox/runners/jest` instead of the deprecated `jest-circus` path.

`check:rn-upgrade-path-audit-guard` verifies the React Native upgrade path audit fixtures before the real audit checks the current worktree.

`check:metro-dev-runtime-audit-guard` verifies the Metro dev runtime audit fixtures without depending on the current terminal's Node version.

`android:dev:check-light` runs `check:node-runtime-version`, the Android warning baseline guard, Android warning artifact guard, Android dev environment audit guard self-check, Metro dev runtime audit guard self-check, React Native upgrade path audit self-check, React Native upgrade path audit, React Native renderer exact-version guard self-check, React Native renderer exact-version guard, camera usage guard self-check, camera usage inventory guard, QR scanner caller guard self-check, QR scanner caller inventory guard, QR scanner validation script guard, QR render usage self-check, QR render usage inventory guard, QR render validation script guard, camera candidate summary guard self-check, legacy Android autolink guard self-check, legacy Android autolink guard, Sentry usage guard self-check, Sentry usage inventory guard, Sentry release integration guard self-check, Sentry release integration guard, CodePush usage guard self-check, CodePush usage inventory guard, Firebase usage guard self-check, Firebase usage inventory guard, Android notification permission flow guard self-check, Android notification permission flow guard, iOS push notification usage guard self-check, iOS push notification usage inventory guard, release-service env key guard self-check, release-service env key guard, Android envConfigFiles guard self-check, Android envConfigFiles guard, iOS scheme config guard self-check, iOS scheme config guard, storage/network usage guard self-check, storage/network usage guard, storage/network validation script guard self-check, storage/network validation script guard, wallet crypto validation script guard, native module inventory self-check, native module inventory guard, native module upgrade-plan self-check, native module upgrade-plan coverage guard, Flipper removal guard, masked-view migration summary guard self-check, secure-storage migration summary guard self-check, secure-storage removal readiness guard self-check, git dependency snapshot guard self-check, wallet crypto latest snapshot guard self-check, direct outdated snapshot guard self-check, node-fetch resolution guard self-check, Android remaining-warning plan guard self-check, Android remaining-warning plan checker, nodeify shim guard self-check, nodeify shim inventory guard, modernization log ID guard self-check, modernization log ID guard, lightweight check documentation guard, TypeScript check, and diff whitespace check.

`android:dev:release:verify-local` validates the Android release package paths without local Sentry upload credentials, checks the generated summary, and checks the generated APK manifests. Its build step sets `SENTRY_DISABLE_AUTO_UPLOAD=true`, cleans generated React bundle/assets/resource/sourcemap outputs for each requested release variant before rebuilding it, builds `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease`, and writes `local-docs/android-release-dev-summary.txt` with per-variant APK size, release JS bundle size, release source-map size, SHA-256 evidence, Gradle attempt counts, bounded retry metadata, and a line-ending-normalized fingerprint of the release inputs that affect Android package generation. The per-variant generated-output cleanup keeps RN Gradle plugin release assets deterministic across repeated local release validations. The release runner retries a Gradle task only for configured known transient native-build exit codes, currently the Windows CMake/Ninja `1073807364` case; successful summary validation still requires the final variant exit code, APK existence, release JS bundle existence, valid source-map JSON, byte counts, SHA-256 digests, and manifest output to be valid. `android:dev:release:check-summary` verifies that each recorded APK, release JS bundle, and release source map path exists, byte count matches the file, SHA-256 matches the actual file digest, retry metadata is present and internally consistent, and the recorded release-input fingerprint still matches the current repo across LF/CRLF working-tree normalization. `android:dev:release:check-apk-manifest` reads the generated APKs with `aapt2` and verifies the package IDs, version, min/target/compile SDK levels, and Android 13 notification permission in the actual release artifacts while reading Gradle expectations from the same project root being audited. Override the default set with `ANDROID_RELEASE_VARIANTS=dev,stage,prod,beta` when a branch intentionally narrows or extends release validation. This proves release bundling, source-map generation, manifest output, and APK generation only; Sentry source-map upload remains blocked until `sentry.properties` or equivalent Sentry env values are available.

Use `android:dev:release:smoke:embedded` after `android:dev:release:verify-local` when a branch must prove that the generated `devRelease` APK also starts on an emulator without Metro. The helper takes `android/app/build/outputs/apk/dev/release/app-dev-release-unsigned.apk`, creates a local zipaligned and debug-keystore signed smoke copy under `local-docs/`, installs that smoke copy, clears app data, completes the first-run flow, checks the empty-wallet dashboard text, and writes separate release-smoke artifacts under `local-docs/android-smoke-dev-release.*`. Validate the generated release smoke summary with `android:dev:release:check-smoke-summary`; this release-specific checker requires clean onboarding plus `Validated empty-dashboard CTA flow: yes`, `Validated empty-tab navigation: yes`, a current signed smoke APK path/byte count/SHA-256 digest, and the source unsigned `devRelease` APK path/byte count/SHA-256 digest. This extends release evidence from bundle/manifest generation into runtime startup proof without changing the default release summary flow.

Latest local release evidence refresh: on 2026-06-03, `feature/bem-37-358-android-release-summary-fingerprint` rebuilt `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease` with JDK 17 and validated the generated summary artifact, including actual APK SHA-256 digest matching and the current release-input fingerprint. Keep future release proof branches on the same summary/checker flow so APK evidence stays local while the tracked log records the milestone.

Subset release evidence refreshes can still use `ANDROID_RELEASE_VARIANTS=beta` or another explicit comma-separated subset, then validate the generated summary with the same override. Use the same env override for both validation commands whenever a branch intentionally checks a subset of release variants.

`check:android-remaining-warning-plan` keeps `docs/android-warning-baseline-followups.md` aligned with the active Android warning baseline and the required follow-up branch type for each remaining source.

`check:camera-usage-scope` keeps `react-native-camera-kit` runtime usage isolated to `ScanQrCodeScreen` after the dedicated QR scanner migration branch.

`check:qr-scanner-validation-scripts` keeps the focused `test:qr-scanner:unit` script present and verifies that `tests/unit/ScanQrCodeScreen.test.tsx` still covers Android camera permission, CameraKit QR-only configuration, callback delivery, empty scans, and duplicate-scan suppression.

`check:qr-render-usage` keeps `react-native-qrcode-svg` rendering isolated to the known QR display screens before `react-native-svg` or QR rendering dependency upgrades.

`check:qr-render-validation-scripts` keeps the focused `test:qr-render:unit` script present and verifies that `tests/unit/QrRenderScreens.test.tsx` still covers Receive, Contact QR, Export Wallet, Export Xpub, and Authenticator QR render values.

`check:legacy-android-autolink-guard` verifies the legacy Android autolink guard fixtures. `check:legacy-android-autolink` verifies that wallet-critical prompt modules keep Android autolinking enabled, that the removed `react-native-camera` package is the only guarded legacy Android autolink disable, and that any future legacy Android autolink disables are explicitly rejected until reviewed.

`check:sentry-usage-scope` keeps `@sentry/react-native` runtime usage isolated to `App.tsx`, `Main.tsx`, and `logger/index.ts` until the dedicated Sentry release/source-map validation branch handles credentialed upload validation and remaining release tooling behavior.

`check:sentry-release-integration-guard` verifies the Sentry release integration guard fixtures. `check:sentry-release-integration` verifies that Android still applies Sentry's Gradle integration and iOS still has Sentry source-map and dSYM upload phases before a Sentry SDK or release tooling upgrade.

`check:codepush-usage-scope` keeps CodePush runtime and native integration references at zero after the CodePush removal branch.

`codepush:release:path-audit` records the removed CodePush runtime/native/package/plist state, stale env-key posture without printing values, live npm latest metadata, App Center CodePush retirement state, upstream archive/New Architecture support status, whether the latest local Android release summary artifact is present and valid, whether that release summary covers the current release inputs, whether Android release build evidence is ready, and whether OTA update validation is claimed. The expected local state after `BEM-37.583` is that APK/bundle generation can be proven by Android release summaries while OTA update validation remains unclaimed unless a maintained replacement is selected and tested. `codepush:migration:readiness-audit` and `codepush:removal-readiness:audit` keep the removed state guarded so CodePush is not accidentally reintroduced.

`check:firebase-usage-scope` keeps React Native Firebase runtime usage isolated to notification handling and native integration isolated to the current Android Gradle/config files and iOS Firebase plist/Xcode wiring before a Firebase family upgrade.

`check:android-notification-permission-flow-guard` verifies the Android notification permission flow guard fixtures. `check:android-notification-permission-flow` verifies that the Android manifest still declares `POST_NOTIFICATIONS`, `NotificationServices` keeps the Android 13+ permission helper and requests it before Firebase Messaging permission, and the focused notification permission unit tests remain present.

`firebase:release-services:audit` records Firebase package-family alignment, Android config files, iOS plist files, Messaging runtime wiring, whether the latest local Android release summary artifact is present and valid, whether that release summary covers the current release inputs, and whether Firebase runtime delivery validation is claimed. The expected local state is that release APK/bundle generation can be proven by Android release summaries while real FCM delivery, Crashlytics upload, and analytics behavior remain unclaimed until tested with the required release/runtime environment.

`firebase:runtime:delivery:handoff:dry-run` prints the Firebase-specific runtime-delivery prerequisite sequence. The executable sequence optionally refreshes Android release APK evidence with Sentry auto-upload disabled, runs the Android release embedded smoke, validates the release-smoke summary, refreshes Firebase release-services and push notification bridge summaries, validates the aggregate release-services summaries, and then verifies that local Firebase/push prerequisites are ready while real FCM token/notification delivery, Crashlytics upload, and Analytics behavior remain explicitly not claimed. The final Firebase readiness check also validates the dedicated Android release-smoke summary, so `--skip-android-release` is only valid when current Android release build, manifest, and release-smoke evidence are already fresh. `check:firebase-runtime-delivery-handoff-guard` keeps this command order, release-smoke prerequisite, and not-claimed boundary from drifting.

`check:push-notification-ios-usage-scope` keeps the iOS push notification bridge isolated to the current badge/notification runtime file and AppDelegate/background-mode wiring before changing `@react-native-community/push-notification-ios`.

`ios:release:readiness:audit` records static iOS release readiness, Podfile.lock drift, removed-pod references, xcodebuild availability, and an explicit iOS runtime delivery claim status. Its collector, formatter, and summary writer are exportable behind a CLI main guard so tests and handoff guards can import the audit module without writing local summary artifacts as an import side effect. On Windows the expected state is that static files can be audited, while iOS runtime delivery remains unclaimed until macOS `pod install`, simulator/archive validation, and release-service checks are complete.

`ios:mac-validation-prereq:audit` records whether the current host can perform the macOS-only iOS handoff: platform, `xcodebuild`, React Native minimum Xcode, CocoaPods availability, active `ios/Podfile.lock` drift, and an explicit not-claimed iOS runtime delivery status. On Windows the expected summary is not ready and names macOS/Xcode/CocoaPods plus `pod install` as the required next action.

`ios:mac-validation:handoff:dry-run` prints the exact macOS execution sequence for iOS handoff without claiming runtime validation on Windows: prerequisite audit/check, one `pod install`, iOS release readiness audit/check, selected Xcode simulator build, and post-build readiness audit/check. Use `--all-schemes` on macOS when the branch needs full shared-scheme coverage; it builds all eight guarded Debug/Release schemes after the single pod refresh. After the executable handoff finishes on macOS, it directly validates both generated iOS summary artifacts and refuses success unless macOS prerequisites and release readiness are actually ready, `ios/Podfile.lock` drift is zero, and runtime delivery remains explicitly not claimed. `check:ios-mac-validation-handoff-guard` keeps the known shared scheme/configuration matrix, all-schemes expansion, handoff command order, and final readiness gate from drifting before the workflow is executed on macOS, and it is part of `rn:baseline:preflight`.

`release-services:check-summaries` validates the generated Android release-smoke, Sentry release prerequisite, Sentry Android warning, Sentry RN bundle task compatibility, Firebase, CodePush release path, CodePush migration readiness, CodePush removal readiness, CodePush decision handoff, push-notification bridge, iOS release readiness, and iOS macOS validation prerequisite summaries as one aggregate gate before future release-service dependency or runtime changes. The Android release-smoke summary must prove clean onboarding, embedded CTA navigation, and embedded bottom-tab navigation, not only a generic app launch. The Sentry prerequisite summary records live SDK/CLI latest metadata, direct versus nested `@sentry/cli` package instances, direct release-build CLI path readiness, Sentry properties readiness, Android release evidence, and the explicit `not claimed` upload status. The Sentry RN bundle task compatibility summary records whether the current Sentry Gradle integration can read RN release bundle task properties before source-map upload readiness is claimed; the repo-owned legacy args shim keeps RN `0.86.0` release source-map generation visible to Sentry while upload remains credential-gated. The Firebase summary records live npm latest metadata for `@react-native-firebase/app` and `@react-native-firebase/messaging`, the npm repository, package-current state, Android release evidence, and the explicit `not claimed` runtime-delivery status. The push-notification bridge summary records live npm latest metadata for `@react-native-community/push-notification-ios`, dependency/installed/latest alignment, static iOS bridge readiness, and the explicit `not claimed` runtime-delivery status.

`release-services:validation:handoff:dry-run` prints the full release-services validation sequence before a release-service dependency, env, or runtime change is claimed ready. The executable sequence refreshes Android release APK evidence with Sentry auto-upload disabled, runs the Android release embedded smoke, validates the release-smoke summary, refreshes Sentry warning, RN bundle compatibility, release prerequisite, Firebase, CodePush, push, and iOS summaries, renders and validates the CodePush decision handoff, and finishes with the aggregate `release-services:check-summaries` gate. Use `--skip-android-release` only when the current Android release build, manifest, and release-smoke evidence are already known to match the current release inputs.

`sentry:release:validation:handoff:dry-run` prints the Sentry-specific source-map prerequisite handoff. The executable sequence validates the Sentry properties generator, optionally refreshes Android release APK evidence with Sentry auto-upload disabled, runs the Android release embedded smoke, validates the release-smoke summary, refreshes Sentry Android warning and RN bundle task compatibility evidence, generates root/Android/iOS Sentry properties from `SENTRY_AUTH_TOKEN`, refreshes the Sentry release prerequisite summary, finishes with the aggregate release-services summary gate, and then directly validates the dedicated Android release-smoke summary. `check:sentry-release-validation-handoff-guard` keeps the command order, secret-safe rendering, required-env behavior, RN bundle task compatibility evidence, and release-smoke prerequisite from drifting. Use `--skip-android-release` only when current Android release build, manifest, and release-smoke evidence are already fresh.

`codepush:update:validation:handoff:dry-run` prints the historical CodePush-specific update-validation handoff. After `BEM-37.583`, the executable sequence refreshes the removed-state summaries and keeps OTA update validation explicitly unclaimed; a real update-validation path requires a maintained replacement rather than retired App Center CodePush. `check:codepush-update-validation-handoff-guard` keeps the command order, secret-safe rendering, and release-smoke prerequisite from drifting. Use `--skip-android-release` only when current Android release build, manifest, and release-smoke evidence are already fresh.

`secure-storage:release-validation:handoff:dry-run` prints the secure-storage release-validation handoff without executing Android build or smoke work. The executable sequence refreshes secure-storage migration and removal-readiness summaries, runs the focused secure-storage/storage/authenticator/wallet-core checks, runs Android dev build and embedded smoke by default, and then directly validates `local-docs/android-smoke-dev-summary.txt` through the embedded smoke guard. `check:secure-storage-release-validation-handoff-guard` keeps the conservative migration posture and the Android dev smoke prerequisite from drifting. Use `--skip-android-smoke` only when the current debug APK and `android-smoke-dev` evidence are already fresh for the current branch.

`check:release-service-env-keys-guard` verifies the env-key guard fixtures. `check:release-service-env-keys` verifies that Android `envConfigFiles` and iOS schemes reference env files with the release-service keys used by `react-native-config`. It checks key presence only and does not print secret values. CodePush deployment keys are no longer required after the removal branch; stale env values should be cleaned only through a secrets-safe follow-up.

`check:android-env-config-files-guard` verifies the Android envConfigFiles guard self-check fixtures. `check:android-env-config-files` verifies that `android/app/build.gradle` still maps every Android flavor/build-type combination to the guarded `.env` file before release-service or rebranding changes alter env selection.

`check:ios-scheme-config-guard` verifies the iOS scheme config guard self-check fixtures. `check:ios-scheme-config` verifies that the shared Xcode schemes still copy the guarded `.env` and Firebase plist files before release-service or rebranding changes alter iOS env selection.

`check:storage-network-usage-guard` verifies the storage/network usage guard self-check fixtures. `check:storage-network-usage` verifies current imports for AsyncStorage, NetInfo, device-info, react-native-config, localization, secure storage, TCP socket, WebView, and the random-value provider before Group C native dependency changes.

`check:storage-network-validation-scripts-guard` verifies the focused validation script guard self-check fixtures. `check:storage-network-validation-scripts` verifies that secure-storage, storage, authenticator, and wallet-core offline tests still exist as package scripts and remain part of `prepush` before Group C dependency changes.

`check:wallet-crypto-validation-scripts` keeps the aggregate `test:wallet-crypto:offline` script wired into `prepush` and verifies that the wallet-critical HD wallet, watch-only wallet, wallet-core, and signer offline fixtures stay present before wallet/crypto runtime dependency changes.

`check:native-module-inventory` keeps the current BEM-36 native dependency inventory explicit before grouped native module upgrades. `check:native-module-upgrade-plan-guard` self-checks the plan coverage comparison logic, and `check:native-module-upgrade-plan` verifies that every tracked native dependency appears in `docs/native-module-upgrade-plan.md`. If a native dependency version changes, update the inventory, the plan, and the related upgrade notes in the same branch.

`android:dev:check-light-docs` keeps README, this workflow, and `docs/wallet-modernization-baseline.md` aligned with the main lightweight check groups when the gate changes.

`check:modernization-log-id-guard` verifies the modernization log ID guard fixtures. `check:modernization-log-ids` keeps `docs/wallet-modernization-log.md` from reusing the same `BEM-*` entry ID for different mini-branches.

For Android build validation:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:assemble
```

For a guarded Android clean that uses the same JDK selection and version checks:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:clean
```

For a full dev build plus emulator startup check:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:verify
```

`android:dev:verify` runs the Android environment audit, builds the dev APK, runs the embedded emulator smoke helper, and validates the generated smoke summary artifact. It does not require Metro because it validates the bundled `app-dev-debug.apk` from a clean onboarding state. The summary checker requires the installed `app-dev-debug.apk` path, byte count, and SHA-256 digest to match the current debug APK before the smoke evidence can be reused.

For a standalone clean emulator check that should prove the bundled `devDebug` APK starts without relying on Metro transport, use:

```powershell
corepack yarn android:dev:smoke:embedded
```

`android:dev:smoke:embedded` disables the Metro preflight, installs the current `app-dev-debug.apk`, launches `io.goldwallet.wallet.dev`, and checks the empty-wallet dashboard fixture: `Wallets`, `No wallets`, `Create new wallet`, and `Import wallet`.
It also checks the dashboard resource IDs `dashboard-header`, `no-wallets-icon`, `create-wallet-button`, `import-wallet-button`, and `navigation-tab-0`, so header/navigation regressions are caught even when visible text still renders.
After the empty dashboard renders, the embedded smoke taps `Create new wallet`, verifies the create-wallet form resource IDs, returns through the app header back button, taps `Import wallet`, verifies the import type and import form resource IDs, then returns through the app header back buttons. It also checks the empty-state bottom tabs by navigating through Authenticator, Address book, Settings, and back to Wallets before taking the final dashboard screenshot.
It also sets `ANDROID_SMOKE_CLEAR_APP_DATA=true` so the embedded smoke validates the bundled APK from a clean onboarding state instead of reusing a stale emulator PIN/wallet state.

For a local release APK startup proof, first refresh release APK evidence and then run the release embedded smoke:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:release:verify-local
corepack yarn android:dev:release:smoke:embedded
corepack yarn android:dev:release:check-smoke-summary
```

The release smoke uses the same helper as debug smoke, but signs a local smoke-only copy of the unsigned release APK and sets `ANDROID_SMOKE_OUTPUT_BASENAME=android-smoke-dev-release` so it does not overwrite the regular debug smoke log, UI hierarchy, summary, or screenshot. It uses the same empty-dashboard text, resource-id assertions, Create/Import CTA navigation checks, and empty-state tab navigation checks as `android:dev:smoke:embedded`. The generated summary also records the installed smoke APK and source unsigned APK path, byte count, and SHA-256 digest so stale or swapped release-smoke artifacts fail the checker before release-services handoff can claim valid runtime evidence.

For Android warning work:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:audit-warnings
```

On Windows, `android:dev:audit-warnings` falls back to the local `D:\tmp\jdks\temurin17\jdk-17.0.19+10` JDK when `JAVA_HOME` is not set, so the warning audit follows the same JDK 17 baseline as the rest of the Android validation workflow.

The warning audit writes the full log to `local-docs/android-warning-audit.log`, writes the compact targeted summary to `local-docs/android-warning-audit-summary.txt`, and prints targeted warning sources. The compact summary includes a generated timestamp, the full log path, timeout, exit code, baseline guard exit code, targeted warning count, unexpected targeted warning count, and remaining targeted sources. Set `ANDROID_WARNING_AUDIT_TIMEOUT_MS` to override the per-audit Gradle timeout. If the Gradle subprocess fails before producing output, the audit records the spawn error or signal in both artifacts.

After running both warning audit and smoke, use the artifact checker for a quick consistency check. The checker accepts `0` targeted Android warning findings, because that is the desired future state after dependency cleanup. Until then, the audit allows only the known RN `0.86.0` native-module `jcenter()` source captured in `androidWarningBaselineGuard.mjs`; new targeted warning sources fail the guard. The artifact checker also verifies that the warning summary count matches the listed sources and that listed sources still pass the same baseline guard.

```powershell
corepack yarn android:dev:check-artifacts
```

Use the dedicated warning-source audits before starting the larger cleanup branches:

```powershell
corepack yarn sentry:android-warning:audit
corepack yarn sentry:android-warning:check-summary
corepack yarn camera:candidate:audit
corepack yarn camera:candidate:check-summary
corepack yarn camera:qr-migration:audit
corepack yarn camera:qr-migration:check-summary
corepack yarn check:camera-qr-validation-handoff-guard
corepack yarn camera:qr-validation:handoff:dry-run
corepack yarn camera:qr-validation:handoff:dry-run --include-android-smoke
corepack yarn masked-view:migration:audit
corepack yarn masked-view:migration:check-summary
corepack yarn secure-storage:migration:audit
corepack yarn secure-storage:migration:check-summary
corepack yarn android:dev:check-warning-source-summaries
corepack yarn android:dev:check-warning-audit-summary
corepack yarn android:dev:check-smoke-summary
```

For a fast check of the warning baseline guard patterns without running Gradle:

```powershell
corepack yarn android:dev:check-warning-guard
corepack yarn android:dev:check-artifact-guard
```

To refresh the warning audit and emulator smoke artifacts in one pass:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:audit-smoke
```

`android:dev:audit-smoke` runs the Android environment audit before the Gradle warning audit so missing JDK/SDK/adb setup fails before the heavier build work starts. It uses the embedded dev smoke path so warning/smoke artifact refreshes do not fail just because Metro is not running.

## Metro And Emulator Smoke

After dependency, native, Metro, or runtime changes, restart Metro with a clean transform cache before testing:

```powershell
D:\tmp\node\node-v24.16.0-win-x64\npx.cmd react-native start --reset-cache --port 8081
```

Then install and launch the dev APK:

```powershell
corepack yarn android:dev:smoke
```

Use `android:dev:verify` when the APK freshness matters; it now builds the APK, runs `android:dev:smoke:embedded`, and validates the summary with `android:dev:check-smoke-summary`. `android:dev:smoke` remains the standalone Metro-required transport check and only installs/tests the current dev APK artifact. Use `corepack yarn android:dev:check-smoke-summary` after a standalone smoke run to validate that the local smoke evidence still records a passing startup, expected dashboard text/resource IDs, process logcat capture, UI hierarchy, and non-empty screenshot; Metro reachability is required only when the summary was produced by the Metro smoke path.

The smoke helper writes the command transcript and app-process logcat to `local-docs/android-smoke-dev.log`, a compact result summary to `local-docs/android-smoke-dev-summary.txt`, the UI hierarchy to `local-docs/android-smoke-dev-ui.xml`, and a non-empty startup screenshot to `local-docs/android-smoke-dev.png`. The summary includes a generated timestamp, installed APK path/byte count/SHA-256 digest, the expected resource IDs, whether empty-dashboard CTA navigation was validated, and whether empty-state tab navigation was validated. It checks that Metro is reachable before installing and launching the dev APK when Metro is required, and records the Metro preflight status in the summary. On failures after an Android serial is selected, it also tries to refresh the same screenshot artifact before exiting. It uses `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `%LOCALAPPDATA%\Android\Sdk`, or `adb` from `PATH` to find `adb`, then scans startup logcat for the launched app process.

By default it also checks that the app is focused and that the UI hierarchy contains `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`. This default matches a seeded wallet dashboard.

For a fresh emulator that has completed onboarding but does not have a wallet yet, use the empty-wallet dashboard fixture:

```powershell
$env:ANDROID_SMOKE_EXPECT_TEXTS = 'Wallets,Create new wallet,Import wallet'
$env:ANDROID_SMOKE_EXPECT_RESOURCE_IDS = 'dashboard-header,create-wallet-button,import-wallet-button,navigation-tab-0'
$env:ANDROID_SMOKE_VALIDATE_EMPTY_DASHBOARD_CTAS = 'true'
$env:ANDROID_SMOKE_VALIDATE_EMPTY_TAB_NAVIGATION = 'true'
corepack yarn android:dev:smoke
```

If the branch does not need Metro transport validation, prefer the embedded helper instead:

```powershell
corepack yarn android:dev:smoke:embedded
```

Override the expected text list with `ANDROID_SMOKE_EXPECT_TEXTS` whenever the branch intentionally validates a different app state, and record the override in `docs/wallet-modernization-log.md`.

Useful smoke overrides:

- `ANDROID_SERIAL`: select a specific emulator/device from `adb devices`.
- `ANDROID_SMOKE_APK`: install a non-default APK path.
- `ANDROID_SMOKE_PACKAGE`: launch a non-default package name.
- `ANDROID_SMOKE_WAIT_MS`: non-negative milliseconds to wait before reading startup logs; default is `20000`.
- `ANDROID_SMOKE_UI_WAIT_MS`: non-negative milliseconds to poll UI hierarchy for expected text after startup state is available; default is `90000`.
- `ANDROID_SMOKE_UI_POLL_INTERVAL_MS`: positive milliseconds between UI hierarchy polling attempts; default is `1000`.
- `ANDROID_SMOKE_LOGCAT_LINES`: positive integer line limit for app-process startup logcat.
- `ANDROID_SMOKE_ADB_TIMEOUT_MS`: positive integer timeout for each `adb` command.
- `ANDROID_SMOKE_METRO_HOST`: Metro host checked before launch; default is `127.0.0.1`.
- `ANDROID_SMOKE_METRO_PORT`: Metro port checked before launch; default is `8081`.
- `ANDROID_SMOKE_METRO_TIMEOUT_MS`: positive integer timeout for the Metro preflight check; default is `3000`.
- `ANDROID_SMOKE_REQUIRE_METRO`: set to `false` to skip the Metro preflight and reverse step when validating the bundled APK.
- `ANDROID_SMOKE_CLEAR_APP_DATA`: set to `true` to run `pm clear` for the package after APK install and before launch.
- `ANDROID_SMOKE_EXPECT_TEXTS`: comma-separated UI texts expected after launch.

Smoke pass means:

- The dashboard renders `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- Or, when `ANDROID_SMOKE_EXPECT_TEXTS` is set, the focused app UI contains the documented expected texts for that fixture.
- Logcat has no `AndroidRuntime` crash.
- Logcat has no React Native runtime error.
- Electrum connection does not block app startup.

## Known Limits

- Full funded transaction QA is blocked until a funded BTCV testnet wallet is available.
- Removed Android warning sources: app `buildToolsVersion 28.0.3`, Clipboard `jcenter()`, Biometrics `jcenter()`, the previous Sentry `execResult` finding, `react-native-exit-app` `jcenter()`, `react-native-localize` `jcenter()`, `@react-native-community/slider` `jcenter()` from root/buildscript repositories, `react-native-device-info` `jcenter()`, `react-native-vector-icons` `jcenter()`, `@react-native-community/toolbar-android` `jcenter()`, and `react-native-prompt-android` `jcenter()`.
- `react-native-camera` cleanup moved to the dedicated CameraKit QR migration branch.
- Sentry release/source-map behavior still requires real `sentry.properties` generated with `SENTRY_AUTH_TOKEN`; the prerequisite summary records the installed Sentry SDK version and Android/iOS release integration wiring without printing secrets.
- The current RN `0.86.0` warning baseline remains exactly one targeted `jcenter()` source from the staged legacy secure-storage module: `react-native-secure-key-store`.
- `docs/android-warning-baseline-followups.md` records the remaining warning sources and guards them against accidental warning-only replacements.
