# Wallet Modernization Baseline

Baseline for `BEM-34 - Setup branch + dependencies analysis`.

Updated on `upgrade/wallet-modernization` after the Android SDK/toolchain, warning-audit, smoke-validation hardening, and lightweight guard/self-check branches.

## Branch Model

- Integration branch: `upgrade/wallet-modernization`
- Current task branch model: focused feature branches merged locally into `upgrade/wallet-modernization`.
- Latest completed stream: Android SDK/toolchain modernization, Android warning audit hardening, Android smoke helper hardening, and lightweight validation guard/self-check hardening.

All modernization work should be developed on focused task branches and merged into `upgrade/wallet-modernization`. The integration branch should be merged back to the main development line only after a tested modernization milestone.

## Current Application Snapshot

- App name/package: `goldwallet`
- App version: `6.5.1`
- React Native: `0.68.7`
- React: `17.0.2`
- TypeScript: `^4.0.3`
- Jest: `26.6.3`
- Detox: `18.20.1`
- Metro Babel preset: `0.67.0`
- Hermes: disabled
- JSC: `org.webkit:android-jsc:+`

## Required Local Toolchain

Current stack:

- Node.js for Metro/dev runtime: Node 16 LTS
- Repository Node hint: `.nvmrc` -> `16.20.2`
- Yarn: `1.22.22` via Corepack
- Android build JDK: JDK 17 locally, with build guard allowing JDK 11-17
- Android Gradle Plugin: `7.4.2`
- Gradle wrapper: `7.5.1`
- Android compile SDK: `34`
- Android target SDK: `33`
- Android min SDK: `26`
- Kotlin: `1.6.21`
- NDK: `20.1.5948944`

Observed incompatibilities:

- JDK 21 is not compatible with the current Gradle/RN Android build.
- JDK versions below 11 are not compatible with the current Android Gradle Plugin.
- The Android Gradle runner checks `JAVA_HOME\bin\java.exe` before falling back to `java` from `PATH`.

Target direction:

- Keep the current Metro/dev runtime on Node 16.
- Use JDK 17 for local Android modernization work.
- Defer `targetSdkVersion 34` until a later React Native/toolchain step, because the current branch intentionally stays on target SDK 33.

## Current Android Build Setup

- Root Android Gradle Plugin: `com.android.tools.build:gradle:7.4.2`
- Firebase Crashlytics Gradle plugin: `2.9.0`
- Google Services Gradle plugin: `4.3.15`
- Build tools configured as `34.0.0`
- Flavors: `dev`, `stage`, `prod`, `beta`
- Current verified build command:

```powershell
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
$env:ANDROID_SDK_ROOT='C:\Users\User\AppData\Local\Android\Sdk'
$env:ANDROID_HOME=$env:ANDROID_SDK_ROOT
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_SDK_ROOT\platform-tools;$env:Path"
corepack yarn android:dev:verify
```

## Current Metro Setup

Metro should be started with Node 16 for the current React Native 0.68 stack:

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
- Native module upgrade sequencing is tracked in `docs/native-module-upgrade-plan.md`, with the current package inventory guarded by `corepack yarn check:native-module-inventory`.

Crypto/network dependencies that need extra care:

- `bitcoinjs-lib` uses a BitcoinVault Git dependency.
- `electrum-client` uses a BitcoinVault Git dependency.
- Wallet signing, derivation paths, vault recovery transactions, and authenticator flows must be regression tested after dependency changes.

Install/build risk:

- `postinstall` runs `rn-nodeify` and `npx jetify`; skipping scripts requires running these steps manually before Android build/smoke testing.
- The QR local image dependency was moved from a dead GitHub repository source to the registry package in `BEM-39`.

## Current Validation Baseline

Passing:

- `corepack yarn android:dev:check-light`
- Android lightweight check runs the Android warning baseline guard, Android warning artifact guard, camera usage self-check/inventory guard, QR scanner caller self-check/inventory guard, QR render usage self-check/inventory guard, Sentry usage self-check/inventory guard, CodePush usage self-check/inventory guard, Firebase usage self-check/inventory guard, iOS push notification usage self-check/inventory guard, release-service env key self-check/guard, Android env mapping self-check/guard, native module inventory self-check/inventory guard, native module upgrade-plan self-check/coverage guard, RN nodeify shim self-check/inventory guard, lightweight check documentation guard, TypeScript check, and diff whitespace check.
- `corepack yarn prepush` starts with `android:dev:check-light` before promoted offline Jest suites.
- `corepack yarn typescript:check`
- ESLint on files changed by `BEM-39`, with existing warnings only
- `corepack yarn android:dev:assemble` on JDK 17
- `corepack yarn android:dev:verify` on a connected Android emulator
- Android smoke helper validates app PID logcat, foreground focus, dashboard UI text, UI hierarchy artifact, and startup screenshot
- Android smoke helper polls UI readiness after startup so clean Metro-cache runs do not fail on a transient bootsplash hierarchy
- Android smoke helper writes `local-docs/android-smoke-dev-summary.txt` with generated timestamp, outcome, exit code, selected serial, Metro endpoint/reachability, app PID, logcat count, UI attempts, UI hierarchy path, screenshot path, and screenshot byte count
- `corepack yarn android:dev:audit-warnings`
- Android warning audit records generated timestamp, full log path, timeout, Gradle exit code, baseline guard exit code, targeted warning count, unexpected targeted warning count, and subprocess spawn diagnostics
- The latest refreshed Android warning audit reports `Targeted Android Gradle warnings: 2` and `Unexpected targeted Android Gradle warnings: 0`.
- Current targeted warning sources are Sentry `execResult` at `node_modules\@sentry\react-native\sentry.gradle:48` and `react-native-camera` `jcenter()` at `node_modules\react-native-camera\android\build.gradle:59`.
- `corepack yarn android:dev:check-artifacts` verifies the latest smoke and warning-audit summaries, their referenced local artifacts, and any listed targeted warning sources against the Android warning baseline guard
- `corepack yarn android:dev:check-artifact-guard` verifies the warning-summary source guard with known-source, zero-warning, mismatched-count, and unexpected-source cases
- `corepack yarn android:dev:audit-smoke` refreshes warning audit, emulator smoke, and artifact checker evidence in one pass

Known gaps:

- Full Jest suite is not hermetic.
- Some tests require local mnemonic/env secrets.
- Some tests call public or staging Electrum endpoints.
- Full funded transaction QA is blocked until a funded BTCV testnet wallet is available.
- Full wallet flow QA is still required: create/import wallet, PIN, biometrics, send, receive, QR scan, history, authenticator, recovery flows.
- Remaining targeted Android warning sources were last refreshed in `BEM-37.70`: `react-native-camera` `jcenter()` and Sentry `execResult`; unexpected targeted warning count was `0`.

## Recommended Upgrade Order

1. Keep Android validation tooling green and use `android:dev:verify` for app-affecting changes.
2. Replace deprecated `react-native-camera` in a dedicated QR scanner migration branch.
3. Handle Sentry Gradle/source-map behavior in a dedicated release tooling branch.
4. Upgrade native modules in controlled groups using `docs/native-module-upgrade-plan.md`.
5. Continue RN stepwise from `0.68` toward newer supported lines.
6. Defer target SDK 34 until the RN/toolchain path can support Android 14+ debug receiver requirements.
7. Upgrade iOS Podfile/deployment target and validate schemes.
8. Add BTC network support and UI switching.
9. Apply rebranding and release pipeline updates.
10. Run security audit and full QA before store release.
