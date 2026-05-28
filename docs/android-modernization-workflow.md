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

The Android Gradle runner checks `JAVA_HOME\bin\java.exe` before falling back to `java` from `PATH`. Supported local build range is JDK 11-17.

## Checks

Run these for normal mini-branches:

```powershell
corepack yarn android:dev:check-light
```

For a quick local toolchain sanity check before Android build/smoke work:

```powershell
corepack yarn android:dev:env-audit
```

The environment audit checks the active Node version, `.nvmrc`, `JAVA_HOME`/Java major version, Android SDK/ADB discovery, Gradle wrappers, required validation helper files, and the package scripts used by the Android validation workflow, including the RN upgrade path audit scripts. It warns when Metro/dev runtime is not on Node 16 and fails when Java/ADB or required helper files are missing.

`check:android-dev-env-audit-guard` verifies the environment audit guard fixtures without depending on the current terminal's Java, Node, SDK, or ADB state.

Use `corepack yarn metro:dev-runtime:audit` to verify that `.nvmrc`, React Native, Metro preset, README, workflow, and baseline docs still agree on the Node 16 Metro/dev runtime baseline.

Use `corepack yarn rn:upgrade-path:audit` before starting a React Native baseline branch to verify that the staged upgrade path, current RN `0.68.7` package baseline, target-SDK deferral, and related documentation still agree.

Use `corepack yarn rn:baseline:preflight` before changing React Native package versions. It runs the lightweight Android gate plus the Metro runtime, Node runtime transition audit, RN upgrade path, RN target snapshot, offline target comparison guard, React 19 impact audit, React package coupling audit, test/type coupling audit, QR camera migration with generated summary validation, Sentry warning/source-map readiness with generated Android-warning and prerequisite-summary validation, the aggregate warning-source summary checker, standalone Android warning-audit and smoke-summary checkers, Firebase release-service with generated summary validation, CodePush release-path with generated summary validation, push-notification bridge audit with generated summary validation, the aggregate release-services summary guard self-check, and the aggregate release-services summary checker covering both Sentry summary artifacts as a single RN-baseline readiness pass.

Use `corepack yarn node:runtime-transition:audit` to verify that the current Node 16 Metro/dev runtime remains aligned with React Native `0.68.7` while the recorded RN target snapshot still implies a later Node engine move. Do not change `.nvmrc` as a standalone cleanup; keep it tied to the dedicated React Native baseline branch.

Use `corepack yarn rn:target-snapshot:audit` to verify that the recorded npm target snapshot still matches the current repo baseline and supporting documentation. Use `corepack yarn rn:target-snapshot:current` when network access is available to compare the recorded snapshot against current npm metadata. Use `corepack yarn check:rn-target-snapshot-current-guard` for an offline self-check of the live comparison rules. Refresh `docs/react-native-target-snapshot.md` at the start of an actual RN baseline branch if npm/latest has moved.

`check:rn-upgrade-path-audit-guard` verifies the React Native upgrade path audit fixtures before the real audit checks the current worktree.

`check:metro-dev-runtime-audit-guard` verifies the Metro dev runtime audit fixtures without depending on the current terminal's Node version.

`android:dev:check-light` runs the Android warning baseline guard, Android warning artifact guard, Android dev environment audit guard self-check, Metro dev runtime audit guard self-check, React Native upgrade path audit self-check, React Native upgrade path audit, camera usage guard self-check, camera usage inventory guard, QR scanner caller guard self-check, QR scanner caller inventory guard, QR render usage self-check, QR render usage inventory guard, legacy Android autolink guard self-check, legacy Android autolink guard, Sentry usage guard self-check, Sentry usage inventory guard, Sentry release integration guard self-check, Sentry release integration guard, CodePush usage guard self-check, CodePush usage inventory guard, Firebase usage guard self-check, Firebase usage inventory guard, iOS push notification usage guard self-check, iOS push notification usage inventory guard, release-service env key guard self-check, release-service env key guard, Android envConfigFiles guard self-check, Android envConfigFiles guard, iOS scheme config guard self-check, iOS scheme config guard, storage/network usage guard self-check, storage/network usage guard, storage/network validation script guard self-check, storage/network validation script guard, native module inventory self-check, native module inventory guard, native module upgrade-plan self-check, native module upgrade-plan coverage guard, nodeify shim guard self-check, nodeify shim inventory guard, modernization log ID guard, lightweight check documentation guard, TypeScript check, and diff whitespace check.

`check:camera-usage-scope` keeps `react-native-camera` runtime usage isolated to `ScanQrCodeScreen` until the dedicated QR scanner migration branch replaces it.

`check:qr-render-usage` keeps `react-native-qrcode-svg` rendering isolated to the known QR display screens before `react-native-svg` or QR rendering dependency upgrades.

`check:legacy-android-autolink-guard` verifies the legacy Android autolink guard fixtures. `check:legacy-android-autolink` verifies that only the guarded legacy QR image and prompt packages keep Android autolinking disabled in `react-native.config.js`.

`check:sentry-usage-scope` keeps `@sentry/react-native` runtime usage isolated to `App.tsx`, `Main.tsx`, and `logger/index.ts` until the dedicated Sentry release/source-map validation branch handles the remaining Gradle warning and release tooling behavior.

`check:sentry-release-integration-guard` verifies the Sentry release integration guard fixtures. `check:sentry-release-integration` verifies that Android still applies Sentry's Gradle integration and iOS still has Sentry source-map and dSYM upload phases before a Sentry SDK or release tooling upgrade.

`check:codepush-usage-scope` keeps CodePush runtime usage isolated to `App.tsx` and native integration isolated to the current Android/iOS bundle-loading and deployment-key files before a dedicated CodePush release-path upgrade.

`check:firebase-usage-scope` keeps React Native Firebase runtime usage isolated to notification handling and native integration isolated to the current Android Gradle/config files and iOS Firebase plist/Xcode wiring before a Firebase family upgrade.

`check:push-notification-ios-usage-scope` keeps the iOS push notification bridge isolated to the current badge/notification runtime file and AppDelegate/background-mode wiring before changing `@react-native-community/push-notification-ios`.

`check:release-service-env-keys-guard` verifies the env-key guard fixtures. `check:release-service-env-keys` verifies that Android `envConfigFiles` and iOS schemes reference env files with the release-service keys used by `react-native-config`. It checks key presence only and does not print secret values. Beta env files currently do not require CodePush deployment keys until the beta release/update strategy is confirmed.

`check:android-env-config-files-guard` verifies the Android envConfigFiles guard self-check fixtures. `check:android-env-config-files` verifies that `android/app/build.gradle` still maps every Android flavor/build-type combination to the guarded `.env` file before release-service or rebranding changes alter env selection.

`check:ios-scheme-config-guard` verifies the iOS scheme config guard self-check fixtures. `check:ios-scheme-config` verifies that the shared Xcode schemes still copy the guarded `.env` and Firebase plist files before release-service or rebranding changes alter iOS env selection.

`check:storage-network-usage-guard` verifies the storage/network usage guard self-check fixtures. `check:storage-network-usage` verifies current imports for AsyncStorage, NetInfo, device-info, react-native-config, localization, secure storage, TCP socket, WebView, and randombytes before Group C native dependency changes.

`check:storage-network-validation-scripts-guard` verifies the focused validation script guard self-check fixtures. `check:storage-network-validation-scripts` verifies that storage, authenticator, and wallet-core offline tests still exist as package scripts and remain part of `prepush` before Group C dependency changes.

`check:native-module-inventory` keeps the current BEM-36 native dependency inventory explicit before grouped native module upgrades. `check:native-module-upgrade-plan-guard` self-checks the plan coverage comparison logic, and `check:native-module-upgrade-plan` verifies that every tracked native dependency appears in `docs/native-module-upgrade-plan.md`. If a native dependency version changes, update the inventory, the plan, and the related upgrade notes in the same branch.

`android:dev:check-light-docs` keeps README, this workflow, and `docs/wallet-modernization-baseline.md` aligned with the main lightweight check groups when the gate changes.

`check:modernization-log-ids` keeps `docs/wallet-modernization-log.md` from reusing the same `BEM-*` entry ID for different mini-branches.

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

`android:dev:verify` builds the dev APK, runs the emulator smoke helper, and validates the generated smoke summary artifact.

For Android warning work:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:audit-warnings
```

The warning audit writes the full log to `local-docs/android-warning-audit.log`, writes the compact targeted summary to `local-docs/android-warning-audit-summary.txt`, and prints targeted warning sources. The compact summary includes a generated timestamp, the full log path, timeout, exit code, baseline guard exit code, targeted warning count, unexpected targeted warning count, and remaining targeted sources. Set `ANDROID_WARNING_AUDIT_TIMEOUT_MS` to override the per-audit Gradle timeout. If the Gradle subprocess fails before producing output, the audit records the spawn error or signal in both artifacts.

After running both warning audit and smoke, use the artifact checker for a quick consistency check. The checker accepts `0` targeted Android warning findings, because that is the desired future state after dependency cleanup. Until then, the audit allows only the known `@sentry/react-native` `execResult` and `react-native-camera` `jcenter()` sources; new targeted warning sources fail the guard. The artifact checker also verifies that the warning summary count matches the listed sources and that listed sources still pass the same baseline guard.

```powershell
corepack yarn android:dev:check-artifacts
```

Use the dedicated warning-source audits before starting the larger cleanup branches:

```powershell
corepack yarn sentry:android-warning:audit
corepack yarn sentry:android-warning:check-summary
corepack yarn camera:qr-migration:audit
corepack yarn camera:qr-migration:check-summary
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

## Metro And Emulator Smoke

After dependency, native, Metro, or runtime changes, restart Metro with a clean transform cache before testing:

```powershell
D:\tmp\node\node-v16.20.2-win-x64\npx.cmd react-native start --reset-cache --port 8081
```

Then install and launch the dev APK:

```powershell
corepack yarn android:dev:smoke
```

Use `android:dev:verify` when the APK freshness matters; it already runs `android:dev:check-smoke-summary` after smoke. `android:dev:smoke` only installs and tests the current dev APK artifact. Use `corepack yarn android:dev:check-smoke-summary` after a standalone smoke run to validate that the local smoke evidence still records a passing startup, reachable Metro, expected dashboard text, process logcat capture, UI hierarchy, and non-empty screenshot.

The smoke helper writes the command transcript and app-process logcat to `local-docs/android-smoke-dev.log`, a compact result summary to `local-docs/android-smoke-dev-summary.txt`, the UI hierarchy to `local-docs/android-smoke-dev-ui.xml`, and a non-empty startup screenshot to `local-docs/android-smoke-dev.png`. The summary includes a generated timestamp. It checks that Metro is reachable before installing and launching the dev APK, and records the Metro preflight status in the summary. On failures after an Android serial is selected, it also tries to refresh the same screenshot artifact before exiting. It uses `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `%LOCALAPPDATA%\Android\Sdk`, or `adb` from `PATH` to find `adb`, then scans startup logcat for the launched app process.

By default it also checks that the app is focused and that the UI hierarchy contains `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`. Override that list with `ANDROID_SMOKE_EXPECT_TEXTS` when testing a different fixture.

Useful smoke overrides:

- `ANDROID_SERIAL`: select a specific emulator/device from `adb devices`.
- `ANDROID_SMOKE_APK`: install a non-default APK path.
- `ANDROID_SMOKE_PACKAGE`: launch a non-default package name.
- `ANDROID_SMOKE_WAIT_MS`: non-negative milliseconds to wait before reading startup logs.
- `ANDROID_SMOKE_UI_WAIT_MS`: non-negative milliseconds to poll UI hierarchy for expected text after startup state is available; default is `20000`.
- `ANDROID_SMOKE_UI_POLL_INTERVAL_MS`: positive milliseconds between UI hierarchy polling attempts; default is `1000`.
- `ANDROID_SMOKE_LOGCAT_LINES`: positive integer line limit for app-process startup logcat.
- `ANDROID_SMOKE_ADB_TIMEOUT_MS`: positive integer timeout for each `adb` command.
- `ANDROID_SMOKE_METRO_HOST`: Metro host checked before launch; default is `127.0.0.1`.
- `ANDROID_SMOKE_METRO_PORT`: Metro port checked before launch; default is `8081`.
- `ANDROID_SMOKE_METRO_TIMEOUT_MS`: positive integer timeout for the Metro preflight check; default is `3000`.
- `ANDROID_SMOKE_EXPECT_TEXTS`: comma-separated UI texts expected after launch.

Smoke pass means:

- The dashboard renders `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- Logcat has no `AndroidRuntime` crash.
- Logcat has no React Native runtime error.
- Electrum connection does not block app startup.

## Known Limits

- Full funded transaction QA is blocked until a funded BTCV testnet wallet is available.
- Removed Android warning sources: app `buildToolsVersion 28.0.3`, Clipboard `jcenter()`, and Biometrics `jcenter()`.
- `react-native-camera` cleanup is a larger QR/camera migration, not a small warning cleanup.
- Sentry `execResult` cleanup should be handled in a dedicated release/source-map validation branch.
- The current warning baseline remains exactly two targeted sources: Sentry `execResult` and `react-native-camera` `jcenter()`.
