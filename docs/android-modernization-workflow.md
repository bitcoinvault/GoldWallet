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

The environment audit checks the active Node version, `.nvmrc`, `JAVA_HOME`/Java major version, Android SDK/ADB discovery, Gradle wrappers, required validation helper files, and the package scripts used by the Android validation workflow, including the RN upgrade path audit scripts. It warns when Metro/dev runtime is not on Node 22 and fails when Java/ADB or required helper files are missing.

`check:android-dev-env-audit-guard` verifies the environment audit guard fixtures without depending on the current terminal's Java, Node, SDK, or ADB state.

Use `corepack yarn metro:dev-runtime:audit` to verify that `.nvmrc`, React Native, RN Babel/Metro config packages, README, workflow, and baseline docs still agree on the Node 22 Metro/dev runtime baseline.

Use `corepack yarn rn:upgrade-path:audit` before starting a React Native baseline branch to verify that the staged upgrade path, current RN `0.85.3` package baseline, Android SDK 36 toolchain baseline, and related documentation still agree.

Use the legacy-named `corepack yarn rn:076-foundation:audit` before the next React Native foundation branch to verify that the RN `0.85.3` checkpoint still includes React 19, Node 22, Metro/Babel, Android template, iOS Podfile, and package-only blocker scope.

Use `corepack yarn rn:baseline:preflight` before changing React Native package versions. It runs the lightweight Android gate plus the Metro runtime, Node runtime transition audit, RN upgrade path, RN target snapshot, offline target comparison guard, React 19 impact audit, React package coupling audit, test/type coupling audit, wallet/crypto runtime audit, camera candidate and QR migration audits with generated summary validation, masked-view navigation migration with generated summary validation, secure-storage migration with generated summary validation, Sentry warning/source-map readiness audits with generated Android-warning and prerequisite-summary validation, the aggregate warning-source summary checker, standalone Android warning-audit and smoke-summary checkers, Firebase release-service with generated summary validation, CodePush release-path with generated summary validation, push-notification bridge audit with generated summary validation, iOS release readiness summary guard validation, the aggregate release-services summary guard self-check, and the aggregate release-services summary checker as a single RN-baseline readiness pass.

Use `corepack yarn rn:baseline:preflight:online` at the start of an actual RN baseline branch when network access is available. It refreshes and validates the live npm RN target snapshot first, then runs the normal offline RN baseline preflight.

Use `corepack yarn node:runtime-transition:audit` to verify that the current Node 22 Metro/dev runtime remains aligned with React Native `0.85.3` while the recorded RN target snapshot still implies a later Node engine move. Do not change `.nvmrc` as a standalone cleanup; keep it tied to the dedicated React Native baseline branch.

Use `corepack yarn rn:target-snapshot:audit` to verify that the recorded npm target snapshot still matches the current repo baseline and supporting documentation. Use `corepack yarn rn:target-snapshot:current` when network access is available to compare the recorded snapshot against current npm metadata. Use `corepack yarn check:rn-target-snapshot-current-guard` for an offline self-check of the live comparison rules. Refresh `docs/react-native-target-snapshot.md` at the start of an actual RN baseline branch if npm/latest has moved.

Use `corepack yarn upgrade:strategy:audit` before dependency/RN baseline branches to keep the upgrade strategy aligned with layered milestone jumps. The default rule is to try the latest feasible target for the chosen layer, capture the exact blocker if it fails, then pick the highest compatible fallback instead of walking every minor version by default.

Use `corepack yarn tooling:latest-snapshot:audit` before tooling dependency branches when network access is available. It writes `local-docs/tooling-latest-snapshot.txt` with package specs, installed versions, live npm latest versions, and the current defer/upgrade decision for the tracked tooling cohort without changing package versions.

`check:rn-upgrade-path-audit-guard` verifies the React Native upgrade path audit fixtures before the real audit checks the current worktree.

`check:metro-dev-runtime-audit-guard` verifies the Metro dev runtime audit fixtures without depending on the current terminal's Node version.

`android:dev:check-light` runs the Android warning baseline guard, Android warning artifact guard, Android dev environment audit guard self-check, Metro dev runtime audit guard self-check, React Native upgrade path audit self-check, React Native upgrade path audit, camera usage guard self-check, camera usage inventory guard, QR scanner caller guard self-check, QR scanner caller inventory guard, QR render usage self-check, QR render usage inventory guard, camera candidate summary guard self-check, legacy Android autolink guard self-check, legacy Android autolink guard, Sentry usage guard self-check, Sentry usage inventory guard, Sentry release integration guard self-check, Sentry release integration guard, CodePush usage guard self-check, CodePush usage inventory guard, Firebase usage guard self-check, Firebase usage inventory guard, iOS push notification usage guard self-check, iOS push notification usage inventory guard, release-service env key guard self-check, release-service env key guard, Android envConfigFiles guard self-check, Android envConfigFiles guard, iOS scheme config guard self-check, iOS scheme config guard, storage/network usage guard self-check, storage/network usage guard, storage/network validation script guard self-check, storage/network validation script guard, native module inventory self-check, native module inventory guard, native module upgrade-plan self-check, native module upgrade-plan coverage guard, masked-view migration summary guard self-check, secure-storage migration summary guard self-check, Android remaining-warning plan guard self-check, Android remaining-warning plan checker, nodeify shim guard self-check, nodeify shim inventory guard, modernization log ID guard self-check, modernization log ID guard, lightweight check documentation guard, TypeScript check, and diff whitespace check.

`android:dev:release:validate-local` validates the Android release package paths without local Sentry upload credentials. By default it sets `SENTRY_DISABLE_AUTO_UPLOAD=true`, builds `devRelease`, `stageRelease`, and `prodRelease`, and writes `local-docs/android-release-dev-summary.txt` with per-variant APK size and SHA-256 evidence. Validate that artifact with `android:dev:release:check-summary` after the build; the checker verifies that each recorded APK path exists, byte count matches the file, and SHA-256 matches the actual file digest. Override the default set with `ANDROID_RELEASE_VARIANTS=dev,stage,prod` when a branch intentionally narrows or extends release validation. This proves release bundling and APK generation only; Sentry source-map upload remains blocked until `sentry.properties` or equivalent Sentry env values are available.

Latest local release evidence refresh: on 2026-05-31, `feature/bem-37-280-android-release-sha-validation` rebuilt `devRelease`, `stageRelease`, and `prodRelease` with JDK 17 and validated the generated summary artifact, including actual APK SHA-256 digest matching. Keep future release proof branches on the same summary/checker flow so APK evidence stays local while the tracked log records the milestone.

Beta release evidence refresh: on 2026-05-31, `feature/bem-37-261-android-beta-release-summary` rebuilt `betaRelease` with `ANDROID_RELEASE_VARIANTS=beta`, then validated the generated summary with the same override. Use the same env override for both validation commands whenever a branch intentionally checks a subset or extension of release variants.

`check:android-remaining-warning-plan` keeps `docs/android-warning-baseline-followups.md` aligned with the active Android warning baseline and the required follow-up branch type for each remaining source.

`check:camera-usage-scope` keeps `react-native-camera-kit` runtime usage isolated to `ScanQrCodeScreen` after the dedicated QR scanner migration branch.

`check:qr-render-usage` keeps `react-native-qrcode-svg` rendering isolated to the known QR display screens before `react-native-svg` or QR rendering dependency upgrades.

`check:legacy-android-autolink-guard` verifies the legacy Android autolink guard fixtures. `check:legacy-android-autolink` verifies that wallet-critical prompt modules keep Android autolinking enabled and that any future legacy Android autolink disables are explicitly guarded in `react-native.config.js`.

`check:sentry-usage-scope` keeps `@sentry/react-native` runtime usage isolated to `App.tsx`, `Main.tsx`, and `logger/index.ts` until the dedicated Sentry release/source-map validation branch handles the remaining Gradle warning and release tooling behavior.

`check:sentry-release-integration-guard` verifies the Sentry release integration guard fixtures. `check:sentry-release-integration` verifies that Android still applies Sentry's Gradle integration and iOS still has Sentry source-map and dSYM upload phases before a Sentry SDK or release tooling upgrade.

`check:codepush-usage-scope` keeps CodePush runtime usage isolated to `App.tsx` and native integration isolated to the current Android/iOS bundle-loading and deployment-key files before a dedicated CodePush release-path upgrade.

`codepush:release:path-audit` records CodePush non-dev runtime/native/env wiring, per-env deployment-key readiness, live npm latest metadata, App Center CodePush retirement state, upstream archive/New Architecture support status, whether the latest local Android release summary artifact is present and valid, and whether CodePush update validation is claimed. The expected local state is that APK/bundle generation can be proven by Android release summaries while CodePush update validation remains unclaimed until non-empty deployment keys and the beta strategy are available. Because App Center CodePush was retired on 2025-03-31 and the Microsoft upstream is archived, CodePush is now tracked as a migration/removal workstream instead of a normal dependency-refresh target.

`check:firebase-usage-scope` keeps React Native Firebase runtime usage isolated to notification handling and native integration isolated to the current Android Gradle/config files and iOS Firebase plist/Xcode wiring before a Firebase family upgrade.

`firebase:release-services:audit` records Firebase package-family alignment, Android config files, iOS plist files, Messaging runtime wiring, whether the latest local Android release summary artifact is present and valid, and whether Firebase runtime delivery validation is claimed. The expected local state is that release APK/bundle generation can be proven by Android release summaries while real FCM delivery, Crashlytics upload, and analytics behavior remain unclaimed until tested with the required release/runtime environment.

`check:push-notification-ios-usage-scope` keeps the iOS push notification bridge isolated to the current badge/notification runtime file and AppDelegate/background-mode wiring before changing `@react-native-community/push-notification-ios`.

`ios:release:readiness:audit` records static iOS release readiness, Podfile.lock drift, removed-pod references, xcodebuild availability, and an explicit iOS runtime delivery claim status. On Windows the expected state is that static files can be audited, while iOS runtime delivery remains unclaimed until macOS `pod install`, simulator/archive validation, and release-service checks are complete.

`release-services:check-summaries` validates the generated Sentry release prerequisite, Sentry Android warning, Firebase, CodePush, push-notification bridge, and iOS release readiness summaries as one aggregate gate before future release-service dependency or runtime changes.

`check:release-service-env-keys-guard` verifies the env-key guard fixtures. `check:release-service-env-keys` verifies that Android `envConfigFiles` and iOS schemes reference env files with the release-service keys used by `react-native-config`. It checks key presence only and does not print secret values. Beta env files currently do not require CodePush deployment keys until the beta release/update strategy is confirmed.

`check:android-env-config-files-guard` verifies the Android envConfigFiles guard self-check fixtures. `check:android-env-config-files` verifies that `android/app/build.gradle` still maps every Android flavor/build-type combination to the guarded `.env` file before release-service or rebranding changes alter env selection.

`check:ios-scheme-config-guard` verifies the iOS scheme config guard self-check fixtures. `check:ios-scheme-config` verifies that the shared Xcode schemes still copy the guarded `.env` and Firebase plist files before release-service or rebranding changes alter iOS env selection.

`check:storage-network-usage-guard` verifies the storage/network usage guard self-check fixtures. `check:storage-network-usage` verifies current imports for AsyncStorage, NetInfo, device-info, react-native-config, localization, secure storage, TCP socket, WebView, and randombytes before Group C native dependency changes.

`check:storage-network-validation-scripts-guard` verifies the focused validation script guard self-check fixtures. `check:storage-network-validation-scripts` verifies that secure-storage, storage, authenticator, and wallet-core offline tests still exist as package scripts and remain part of `prepush` before Group C dependency changes.

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

`android:dev:verify` runs the Android environment audit, builds the dev APK, runs the emulator smoke helper, and validates the generated smoke summary artifact.

For a clean emulator or a branch that should prove the bundled `devDebug` APK starts without relying on Metro transport, use:

```powershell
corepack yarn android:dev:smoke:embedded
```

`android:dev:smoke:embedded` disables the Metro preflight, installs the current `app-dev-debug.apk`, launches `io.goldwallet.wallet.dev`, and checks the empty-wallet dashboard fixture: `Wallets`, `No wallets`, `Create new wallet`, and `Import wallet`.
It also sets `ANDROID_SMOKE_CLEAR_APP_DATA=true` so the embedded smoke validates the bundled APK from a clean onboarding state instead of reusing a stale emulator PIN/wallet state.

For Android warning work:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:audit-warnings
```

On Windows, `android:dev:audit-warnings` falls back to the local `D:\tmp\jdks\temurin17\jdk-17.0.19+10` JDK when `JAVA_HOME` is not set, so the warning audit follows the same JDK 17 baseline as the rest of the Android validation workflow.

The warning audit writes the full log to `local-docs/android-warning-audit.log`, writes the compact targeted summary to `local-docs/android-warning-audit-summary.txt`, and prints targeted warning sources. The compact summary includes a generated timestamp, the full log path, timeout, exit code, baseline guard exit code, targeted warning count, unexpected targeted warning count, and remaining targeted sources. Set `ANDROID_WARNING_AUDIT_TIMEOUT_MS` to override the per-audit Gradle timeout. If the Gradle subprocess fails before producing output, the audit records the spawn error or signal in both artifacts.

After running both warning audit and smoke, use the artifact checker for a quick consistency check. The checker accepts `0` targeted Android warning findings, because that is the desired future state after dependency cleanup. Until then, the audit allows only the known RN `0.85.3` native-module `jcenter()` source captured in `androidWarningBaselineGuard.mjs`; new targeted warning sources fail the guard. The artifact checker also verifies that the warning summary count matches the listed sources and that listed sources still pass the same baseline guard.

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

`android:dev:audit-smoke` runs the Android environment audit before the Gradle warning audit so missing JDK/SDK/adb setup fails before the heavier build work starts.

## Metro And Emulator Smoke

After dependency, native, Metro, or runtime changes, restart Metro with a clean transform cache before testing:

```powershell
D:\tmp\node\node-v22.18.0-win-x64\npx.cmd react-native start --reset-cache --port 8081
```

Then install and launch the dev APK:

```powershell
corepack yarn android:dev:smoke
```

Use `android:dev:verify` when the APK freshness matters; it already runs `android:dev:check-smoke-summary` after smoke. `android:dev:smoke` only installs and tests the current dev APK artifact. Use `corepack yarn android:dev:check-smoke-summary` after a standalone smoke run to validate that the local smoke evidence still records a passing startup, reachable Metro, expected dashboard text, process logcat capture, UI hierarchy, and non-empty screenshot.

The smoke helper writes the command transcript and app-process logcat to `local-docs/android-smoke-dev.log`, a compact result summary to `local-docs/android-smoke-dev-summary.txt`, the UI hierarchy to `local-docs/android-smoke-dev-ui.xml`, and a non-empty startup screenshot to `local-docs/android-smoke-dev.png`. The summary includes a generated timestamp. It checks that Metro is reachable before installing and launching the dev APK, and records the Metro preflight status in the summary. On failures after an Android serial is selected, it also tries to refresh the same screenshot artifact before exiting. It uses `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `%LOCALAPPDATA%\Android\Sdk`, or `adb` from `PATH` to find `adb`, then scans startup logcat for the launched app process.

By default it also checks that the app is focused and that the UI hierarchy contains `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`. This default matches a seeded wallet dashboard.

For a fresh emulator that has completed onboarding but does not have a wallet yet, use the empty-wallet dashboard fixture:

```powershell
$env:ANDROID_SMOKE_EXPECT_TEXTS = 'Wallets,Create new wallet,Import wallet'
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
- Removed Android warning sources: app `buildToolsVersion 28.0.3`, Clipboard `jcenter()`, Biometrics `jcenter()`, the previous Sentry `execResult` finding, `react-native-exit-app` `jcenter()`, `react-native-localize` `jcenter()`, `@react-native-community/slider` `jcenter()` from root/buildscript repositories, `react-native-device-info` `jcenter()`, `react-native-vector-icons` `jcenter()`, and `@react-native-community/toolbar-android` `jcenter()`.
- `react-native-camera` cleanup moved to the dedicated CameraKit QR migration branch.
- Sentry release/source-map behavior still requires real `sentry.properties` generated with `SENTRY_AUTH_TOKEN`; the prerequisite summary records the installed Sentry SDK version and Android/iOS release integration wiring without printing secrets.
- The current RN `0.85.3` warning baseline remains exactly one targeted `jcenter()` source from the staged legacy secure-storage module: `react-native-secure-key-store`.
- `docs/android-warning-baseline-followups.md` records the remaining warning sources and guards them against accidental warning-only replacements.
