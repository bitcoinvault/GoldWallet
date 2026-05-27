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

For Android warning work:

```powershell
$env:JAVA_HOME = 'D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:audit-warnings
```

The warning audit writes the full log to `local-docs/android-warning-audit.log` and prints targeted warning sources.

## Metro And Emulator Smoke

After dependency, native, Metro, or runtime changes, restart Metro with a clean transform cache before testing:

```powershell
D:\tmp\node\node-v16.20.2-win-x64\npx.cmd react-native start --reset-cache --port 8081
```

Then install and launch the dev APK:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb install -r android\app\build\outputs\apk\dev\debug\app-dev-debug.apk
& $adb reverse tcp:8081 tcp:8081
& $adb logcat -c
& $adb shell am force-stop io.goldwallet.wallet.dev
& $adb shell monkey -p io.goldwallet.wallet.dev -c android.intent.category.LAUNCHER 1
```

Smoke pass means:

- The dashboard renders `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- Logcat has no `AndroidRuntime` crash.
- Logcat has no React Native runtime error.
- Electrum connection does not block app startup.

## Known Limits

- Full funded transaction QA is blocked until a funded BTCV testnet wallet is available.
- `react-native-camera` cleanup is a larger QR/camera migration, not a small warning cleanup.
- Sentry `execResult` cleanup should be handled in a dedicated release/source-map validation branch.
