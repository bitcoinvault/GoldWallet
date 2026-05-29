# Wallet Modernization Baseline

Baseline for `BEM-34 - Setup branch + dependencies analysis`.

Updated on `upgrade/wallet-modernization` after the Android SDK/toolchain, warning-audit, smoke-validation hardening, lightweight guard/self-check, and React Native baseline preflight branches.

## Branch Model

- Integration branch: `upgrade/wallet-modernization`
- Current task branch model: focused feature branches merged locally into `upgrade/wallet-modernization`.
- Latest completed stream: Android SDK/toolchain modernization, Android warning audit hardening, Android smoke helper hardening, lightweight validation guard/self-check hardening, current camera/Sentry warning-source audits, modernization log ID guard, and React Native baseline preflight evidence.

All modernization work should be developed on focused task branches and merged into `upgrade/wallet-modernization`. The integration branch should be merged back to the main development line only after a tested modernization milestone.

## Current Application Snapshot

- App name/package: `goldwallet`
- App version: `6.5.1`
- React Native: `0.76.9`
- React: `18.2.0`
- TypeScript: `^4.0.3`
- Jest: `26.6.3`
- Detox: `18.20.1`
- RN Babel preset: `0.76.9`
- RN Metro config: `0.76.9`
- Hermes: disabled
- JSC: `org.webkit:android-jsc:+`

## Required Local Toolchain

Current stack:

- Node.js for Metro/dev runtime: Node 22 LTS-compatible runtime
- Repository Node hint: `.nvmrc` -> `22.18.0`
- Yarn: `1.22.22` via Corepack
- Android build JDK: JDK 17 required by the AGP 8.6 baseline
- Android Gradle Plugin: `8.6.0`
- Gradle wrapper: `8.10.2`
- Android compile SDK: `34`
- Android target SDK: `33`
- Android min SDK: `26`
- Kotlin: `1.9.25`
- NDK: `20.1.5948944`

Observed incompatibilities:

- JDK 21 is not compatible with the current Gradle/RN Android build.
- JDK 11 is no longer sufficient after the AGP 8.6 upgrade; use JDK 17 for local and CI Android builds.
- The Android Gradle runner checks `JAVA_HOME\bin\java.exe` before falling back to `java` from `PATH`.

Target direction:

- Keep the current Metro/dev runtime aligned with `.nvmrc` and RN package engine requirements.
- Use JDK 17 for local Android modernization work.
- Defer `targetSdkVersion 34` until a later React Native/toolchain step, because the current branch intentionally stays on target SDK 33.
- React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`; continue with milestone jumps from RN `0.76.9` toward a current supported line instead of walking every minor version or jumping blindly to latest.
- React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`; refresh it when an actual RN baseline branch starts.
- RN `0.76.9` foundation scope is tracked in `docs/react-native-076-foundation-plan.md`; use `corepack yarn rn:076-foundation:audit` before changing RN packages.
- The latest live npm target snapshot check matched the recorded React Native target snapshot: `react-native@0.85.3` latest, `0.86.0-rc.2` next, React peer `^19.2.3`, and Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.
- Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`.
- React 19 impact audit is tracked in `docs/react19-impact-audit.md`; use it before changing React/RN package versions.
- React package coupling audit is tracked in `docs/react-package-coupling-audit.md`; use it to keep React, renderer, and type packages moving together.
- Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`; use it to keep TypeScript, Jest, renderer, and React/RN package validation aligned.

## Current Android Build Setup

- Root Android Gradle Plugin: `com.android.tools.build:gradle:8.6.0`
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

Metro should be started with Node 22 for the current React Native 0.76 stack:

```powershell
$env:Path='D:\tmp\node\node-v22.18.0-win-x64;' + $env:Path
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

- `corepack yarn android:dev:env-audit`
- `corepack yarn metro:dev-runtime:audit`
- `corepack yarn check:rn-upgrade-path-audit-guard`
- `corepack yarn rn:upgrade-path:audit`
- `corepack yarn check:rn-target-snapshot-guard`
- `corepack yarn rn:target-snapshot:audit`
- `corepack yarn rn:target-snapshot:current`
- `corepack yarn rn:target-snapshot:check-summary`
- `corepack yarn rn:baseline:preflight`
- `corepack yarn android:dev:check-light`
- Metro dev runtime audit verifies the Node 22 `.nvmrc`, React Native `0.76.9`, RN Babel/Metro config packages, start script, and documentation baseline.
- Android lightweight check runs the Android warning baseline guard, Android warning artifact guard, Android dev environment audit self-check, Metro dev runtime audit self-check, React Native upgrade path audit self-check, React Native upgrade path audit, camera usage self-check/inventory guard, QR scanner caller self-check/inventory guard, QR render usage self-check/inventory guard, legacy Android autolink self-check/guard, Sentry usage self-check/inventory guard, Sentry release integration self-check/guard, CodePush usage self-check/inventory guard, Firebase usage self-check/inventory guard, iOS push notification usage self-check/inventory guard, release-service env key self-check/guard, Android env mapping self-check/guard, iOS scheme config self-check/guard, storage/network usage self-check/guard, storage/network validation script self-check/guard, native module inventory self-check/inventory guard, native module upgrade-plan self-check/coverage guard, RN nodeify shim self-check/inventory guard, modernization log ID guard self-check, modernization log ID guard, lightweight check documentation guard, TypeScript check, and diff whitespace check.
- `corepack yarn prepush` starts with `android:dev:check-light` before promoted offline Jest suites.
- `corepack yarn typescript:check`
- ESLint on files changed by `BEM-39`, with existing warnings only
- `corepack yarn android:dev:assemble` on JDK 17
- `corepack yarn android:dev:verify` on a connected Android emulator
- Android smoke helper validates app PID logcat, foreground focus, dashboard UI text, UI hierarchy artifact, and startup screenshot
- Android smoke helper polls UI readiness after startup so clean Metro-cache runs do not fail on a transient bootsplash hierarchy
- Android smoke helper writes `local-docs/android-smoke-dev-summary.txt` with generated timestamp, outcome, exit code, selected serial, Metro endpoint/reachability, app PID, logcat count, UI attempts, UI hierarchy path, screenshot path, and screenshot byte count
- `corepack yarn android:dev:audit-warnings`
- Android dev environment audit verifies the local Java range, adb access, Gradle wrappers, Android validation helper files, and RN upgrade path audit scripts before build/smoke work.
- RN baseline preflight groups the current lightweight Android gate, Metro runtime audit, Node runtime transition audit, RN upgrade path audit, RN 0.76 foundation plan audit, target snapshot audit, offline target comparison guard, React 19 impact audit, React package coupling audit, test/type coupling audit, QR camera migration audit with generated summary validation, Sentry warning/source-map readiness audits with generated Android-warning and prerequisite-summary validation, the aggregate warning-source summary checker, standalone Android warning-audit and smoke-summary checkers, Firebase release-service audit with generated summary validation, CodePush release-path audit with generated summary validation, push-notification bridge audit with generated summary validation, the aggregate release-services summary guard self-check, and the aggregate release-services summary checker covering both Sentry summary artifacts before larger React Native baseline branches.
- Android warning audit records generated timestamp, full log path, timeout, Gradle exit code, baseline guard exit code, targeted warning count, unexpected targeted warning count, and subprocess spawn diagnostics
- The latest refreshed Android warning audit reports `Targeted Android Gradle warnings: 8` and `Unexpected targeted Android Gradle warnings: 0`.
- Current targeted warning sources are `jcenter()` calls from old native modules: `@react-native-community/masked-view`, `@react-native-community/slider` (two locations), `react-native-camera`, `@react-native-community/toolbar-android`, `react-native-vector-icons`, `react-native-device-info`, and `react-native-secure-key-store`.
- Removed Android warning sources include the stale app `buildToolsVersion 28.0.3`, Clipboard `jcenter()`, Biometrics `jcenter()`, active Sentry `execResult`, `react-native-exit-app` `jcenter()`, and `react-native-localize` `jcenter()`.
- The current `react-native-camera` warning source is covered by `corepack yarn camera:qr-migration:audit`; Sentry Gradle/source-map wiring is still covered by `corepack yarn sentry:android-warning:audit` even though the active warning audit no longer reports Sentry `execResult`.
- The latest live RN target snapshot check reports `Live check outcome: matched` with `Mismatches: 0`.
- Latest live RN target snapshot summary was refreshed from npm on `2026-05-28T19:55:51.486Z` and still matches `react-native@0.85.3` latest, `0.86.0-rc.2` next, React peer `^19.2.3`, and Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.
- `corepack yarn android:dev:check-artifacts` verifies the latest smoke and warning-audit summaries, their referenced local artifacts, and any listed targeted warning sources against the Android warning baseline guard
- `corepack yarn android:dev:check-artifact-guard` verifies the warning-summary source guard with known-source, zero-warning, mismatched-count, and unexpected-source cases
- `corepack yarn android:dev:audit-smoke` refreshes warning audit, emulator smoke, and artifact checker evidence in one pass

Known gaps:

- Full Jest suite is not hermetic.
- Some tests require local mnemonic/env secrets.
- Some tests call public or staging Electrum endpoints.
- Full funded transaction QA is blocked until a funded BTCV testnet wallet is available.
- Full wallet flow QA is still required: create/import wallet, PIN, biometrics, send, receive, QR scan, history, authenticator, recovery flows.
- Remaining targeted Android warning sources were last refreshed from `local-docs/android-warning-audit-summary.txt` after the `react-native-localize` cleanup: eight known native-module `jcenter()` findings; unexpected targeted warning count was `0`.
- `BEM-37.78` records the camera/QR migration readiness audit for the `react-native-camera` warning source.
- `BEM-37.99` records the Sentry Android warning audit for the previous Sentry `execResult` warning source; `BEM-37.105` refreshes the active RN `0.76` warning baseline after Sentry `execResult` no longer appears in the Gradle warning audit; `BEM-37.106` removes the `react-native-exit-app` `jcenter()` source from the active warning baseline; `BEM-37.107` removes the `react-native-localize` `jcenter()` source.
- `BEM-36.115` records the current React Native baseline preflight refresh before the next RN baseline branch.

## Recommended Upgrade Order

1. Keep Android validation tooling green and use `android:dev:verify` for app-affecting changes.
2. Replace deprecated `react-native-camera` in a dedicated QR scanner migration branch.
3. Handle Sentry Gradle/source-map behavior in a dedicated release tooling branch.
4. Upgrade native modules in controlled groups using `docs/native-module-upgrade-plan.md`.
5. Continue RN with milestone jumps from `0.76` toward newer supported lines.
6. Defer target SDK 34 until the RN/toolchain path can support Android 14+ debug receiver requirements.
7. Upgrade iOS Podfile/deployment target and validate schemes.
8. Add BTC network support and UI switching.
9. Apply rebranding and release pipeline updates.
10. Run security audit and full QA before store release.
