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
corepack yarn check:rn-nodeify-shims
corepack yarn typescript:check
git diff --check
```

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

For Android warning work:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:audit-warnings
```

The warning audit writes the full log to `local-docs/android-warning-audit.log`, writes the compact targeted summary to `local-docs/android-warning-audit-summary.txt`, and prints targeted warning sources. The compact summary includes the full log path, timeout, exit code, targeted warning count, and remaining targeted sources. Set `ANDROID_WARNING_AUDIT_TIMEOUT_MS` to override the per-audit Gradle timeout. If the Gradle subprocess fails before producing output, the audit records the spawn error or signal in both artifacts.

After running both warning audit and smoke, use the artifact checker for a quick consistency check:

```powershell
corepack yarn android:dev:check-artifacts
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

Use `android:dev:verify` when the APK freshness matters; `android:dev:smoke` only installs and tests the current dev APK artifact.

The smoke helper writes the command transcript and app-process logcat to `local-docs/android-smoke-dev.log`, a compact result summary to `local-docs/android-smoke-dev-summary.txt`, the UI hierarchy to `local-docs/android-smoke-dev-ui.xml`, and a non-empty startup screenshot to `local-docs/android-smoke-dev.png`. It checks that Metro is reachable before installing and launching the dev APK, and records the Metro preflight status in the summary. On failures after an Android serial is selected, it also tries to refresh the same screenshot artifact before exiting. It uses `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `%LOCALAPPDATA%\Android\Sdk`, or `adb` from `PATH` to find `adb`, then scans startup logcat for the launched app process.

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
- `react-native-camera` cleanup is a larger QR/camera migration, not a small warning cleanup.
- Sentry `execResult` cleanup should be handled in a dedicated release/source-map validation branch.
