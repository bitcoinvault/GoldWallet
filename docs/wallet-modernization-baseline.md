# Wallet Modernization Baseline

Baseline for `BEM-34 - Setup branch + dependencies analysis`.

## Branch Model

- Integration branch: `upgrade/wallet-modernization`
- Current task branch: `feature/bem-34-baseline-analysis`
- Previous completed task: `feature/bem-39-rn-api-compat`

All modernization work should be developed on focused task branches and merged into `upgrade/wallet-modernization`. The integration branch should be merged back to the main development line only after a tested modernization milestone.

## Current Application Snapshot

- App name/package: `goldwallet`
- App version: `6.5.1`
- React Native: `0.65.3`
- React: `17.0.2`
- TypeScript: `^4.0.3`
- Jest: `26.6.3`
- Detox: `18.20.1`
- Metro: `0.66.x` via React Native CLI dependencies
- Hermes: disabled
- JSC: `org.webkit:android-jsc:+`

## Required Local Toolchain

Current stack:

- Node.js for Metro/dev runtime: Node 16 LTS
- Repository Node hint: `.nvmrc` -> `16.20.2`
- Yarn: `1.22.22` via Corepack
- Android build JDK: JDK 11
- Android Gradle Plugin: `4.2.1`
- Gradle wrapper: `6.9`
- Android compile SDK: `30`
- Android target SDK: `30`
- Android min SDK: `26`
- Kotlin: `1.6.21`
- NDK: `20.1.5948944`

Observed incompatibilities:

- Node 22 starts the old Metro/RN stack but Metro fails while serving the JS bundle.
- JDK 17 is not compatible with the current Gradle/RN Android build.
- JDK 21 is not compatible with the current Gradle/RN Android build.
- JDK 11 is the working Java version for the current Android build.

Target direction:

- Keep the current maintenance baseline on Node 16 and JDK 11.
- Move to JDK 17 only with the later Android Gradle Plugin / Gradle / React Native upgrade.

## Current Android Build Setup

- Root Android Gradle Plugin: `com.android.tools.build:gradle:4.2.1`
- Firebase Crashlytics Gradle plugin: `2.9.0`
- Google Services Gradle plugin: `4.3.15`
- Build tools configured as `30.0.3`
- Flavors: `dev`, `stage`, `prod`, `beta`
- Current verified build command:

```powershell
$env:JAVA_HOME='D:\tmp\jdks\temurin11\jdk-11.0.31+11'
$env:ANDROID_SDK_ROOT='C:\Users\User\AppData\Local\Android\Sdk'
$env:ANDROID_HOME=$env:ANDROID_SDK_ROOT
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_SDK_ROOT\platform-tools;$env:Path"
.\android\gradlew.bat -p android :app:assembleDevDebug -x lint
```

## Current Metro Setup

Metro should be started with Node 16 for the current React Native 0.65 stack:

```powershell
$env:Path='D:\tmp\node\node-v16.20.2-win-x64;' + $env:Path
corepack yarn start --reset-cache
```

The emulator should use:

```powershell
adb reverse tcp:8081 tcp:8081
```

## Dependency Risk Areas

High-risk native dependencies:

- `@react-native-firebase/*` currently `12.7`, target Jira notes mention `23+`.
- `react-native-camera` is deprecated and should be reviewed for replacement.
- `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context` are old and tied to RN upgrade sequencing.
- `react-native-svg` is old and can affect QR/icon rendering after RN upgrades.
- `react-native-share`, `react-native-vector-icons`, `react-native-webview`, `react-native-fast-image` need native compatibility checks.
- `react-native-prompt-android` still requires Jetifier because it uses old Android support imports before transformation.

Crypto/network dependencies that need extra care:

- `bitcoinjs-lib` uses a BitcoinVault Git dependency.
- `electrum-client` uses a BitcoinVault Git dependency.
- Wallet signing, derivation paths, vault recovery transactions, and authenticator flows must be regression tested after dependency changes.

Install/build risk:

- `postinstall` runs `rn-nodeify` and `npx jetify`; skipping scripts requires running these steps manually before Android build/smoke testing.
- The QR local image dependency was moved from a dead GitHub repository source to the registry package in `BEM-39`.

## Current Validation Baseline

Passing:

- `corepack yarn typescript:check`
- ESLint on files changed by `BEM-39`, with existing warnings only
- Android `:app:assembleDevDebug` on JDK 11
- Emulator launch smoke test with Metro on Node 16
- App foreground/background smoke test after `BEM-39`

Known gaps:

- Full Jest suite is not hermetic.
- Some tests require local mnemonic/env secrets.
- Some tests call public or staging Electrum endpoints.
- Electrum connectivity to `electrumx.testnet.btcv.stage.rnd.land:443 tls` currently times out from the emulator smoke test.
- Full wallet flow QA is still required: create/import wallet, PIN, biometrics, send, receive, QR scan, history, authenticator, recovery flows.

## Recommended Upgrade Order

1. Stabilize baseline and documentation (`BEM-34`).
2. Stabilize test/dev toolchain before major RN changes.
3. Upgrade RN stepwise: `0.65 -> 0.68 -> 0.71 -> 0.74 -> 0.78`.
4. Upgrade native modules in controlled groups.
5. Upgrade Android Gradle Plugin, Gradle, SDK, Kotlin, and move to JDK 17.
6. Upgrade iOS Podfile/deployment target and validate schemes.
7. Add BTC network support and UI switching.
8. Apply rebranding and release pipeline updates.
9. Run security audit and full QA before store release.
