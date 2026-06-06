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
- React Native: `0.85.3`
- React: `19.2.3`
- TypeScript: `6.0.3`
- Jest: `30.4.2`
- babel-jest: `30.4.1`
- jest-environment-node: `30.4.1`
- ts-jest: `29.4.11`
- Detox: `20.51.3`
- RN Babel preset: `0.85.3`
- RN Metro config: `0.85.3`
- Hermes: disabled
- JSC: `org.webkit:android-jsc:+`

## Required Local Toolchain

Current stack:

- Node.js for Metro/dev runtime: Node 24 LTS runtime
- Repository Node hint: `.nvmrc` -> `24.16.0`
- Yarn: `1.22.22` via Corepack
- Git hooks: Husky `9.1.7` with repo-owned `.husky/pre-commit` and `.husky/pre-push` forwarding to `yarn precommit` and `yarn prepush`
- Android build JDK: JDK 17 required by the AGP 8.13 baseline
- Android Gradle Plugin: `8.13.2`
- Gradle wrapper: `8.13`
- Android compile SDK: `36`
- Android target SDK: `36`
- Android min SDK: `26`
- Kotlin: `2.1.20`
- NDK: `20.1.5948944`

Observed incompatibilities:

- JDK 21 is not compatible with the current Gradle/RN Android build.
- JDK 11 is no longer sufficient after the AGP 8.x upgrades; use JDK 17 for local and CI Android builds.
- The Android Gradle runner checks `JAVA_HOME\bin\java.exe` before falling back to `java` from `PATH`.

Target direction:

- Keep the current Metro/dev runtime aligned with `.nvmrc` and RN package engine requirements.
- Use JDK 17 for local Android modernization work.
- SDK 36 is now part of the RN 0.81/AGP 8.13 Android foundation baseline.
- React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`; continue with milestone jumps from RN `0.85.3` toward a current supported line instead of walking every minor version or jumping blindly to latest.
- React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`; refresh it when an actual RN baseline branch starts.
- Wallet/crypto runtime package risk is tracked in `docs/wallet-crypto-runtime-audit.md` and checked with `corepack yarn wallet:crypto-runtime:audit`.
- RN `0.85.3` foundation scope is tracked in `docs/react-native-076-foundation-plan.md`; use `corepack yarn rn:076-foundation:audit` before changing RN packages.
- The latest live npm target snapshot check matched the recorded React Native target snapshot: `react-native@0.85.3` latest, `0.86.0-rc.3` next, `0.87.0-nightly-20260606-510cc0c5e` nightly, React peer `^19.2.3`, and Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.
- Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`.
- React 19 impact audit is tracked in `docs/react19-impact-audit.md`; use it before changing React/RN package versions.
- React package coupling audit is tracked in `docs/react-package-coupling-audit.md`; use it to keep React, renderer, and type packages moving together.
- React Native renderer exact-version audit is tracked in `docs/react-package-coupling-audit.md`; use it to prevent package-only React patches that do not match the bundled RN renderer.
- Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`; use it to keep TypeScript, Jest, renderer, and React/RN package validation aligned.

## Current Android Build Setup

- Root Android Gradle Plugin: `com.android.tools.build:gradle:8.13.2`
- Firebase Crashlytics Gradle plugin: `3.0.7`
- Google Services Gradle plugin: `4.4.4`
- Build tools configured as `36.0.0`
- Android environment audit requires local `platforms;android-36` and `build-tools;36.0.0`.
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

Metro should be started with Node 24 for the current React Native 0.85 stack:

```powershell
$env:Path='D:\tmp\node\node-v24.16.0-win-x64;' + $env:Path
corepack yarn start --reset-cache
```

The emulator should use:

```powershell
adb reverse tcp:8081 tcp:8081
```

## Dependency Risk Areas

High-risk native dependencies:

- `@react-native-firebase/*` is now on the checked latest `24.1.0` package family; Firebase release delivery remains a runtime validation item, not a package-version blocker.
- `react-native-camera` was replaced by `react-native-camera-kit@18.0.0` in the dedicated QR scanner migration stream.
- Navigation/layout packages are on the RN `0.85.3` checkpoint versions: `react-native-gesture-handler@3.0.0`, `react-native-screens@4.25.2`, and `react-native-safe-area-context@5.8.0`; future bumps should stay tied to navigation smoke validation.
- `react-native-svg@15.15.5` is paired with `react-native-qrcode-svg@6.3.21` and root `qrcode@1.5.4`; future SVG/QR changes need the guarded QR render-screen validation.
- `react-native-share@12.3.1`, `react-native-vector-icons@10.3.0`, `react-native-webview@13.16.1`, and `react-native-fast-image@8.6.3` are checked native packages whose future work should focus on release/device behavior, not generic warning cleanup.
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
- `corepack yarn rn:baseline:preflight:online`
- `corepack yarn foundation:target:check-summaries`
- `corepack yarn android:dev:check-light`
- Metro dev runtime audit verifies the Node 24 `.nvmrc`, React Native `0.85.3`, RN Babel/Metro config packages, start script, and documentation baseline.
- Android lightweight check runs the Android warning baseline guard, Android warning artifact guard, Android dev environment audit self-check, Metro dev runtime audit self-check, React Native upgrade path audit self-check, React Native upgrade path audit, React Native renderer exact-version guard self-check, React Native renderer exact-version guard, camera usage self-check/inventory guard, QR scanner caller self-check/inventory guard, QR scanner validation script guard, QR render usage self-check/inventory guard, QR render validation script guard, legacy Android autolink self-check/guard, Sentry usage self-check/inventory guard, Sentry release integration self-check/guard, CodePush usage self-check/inventory guard, Firebase usage self-check/inventory guard, iOS push notification usage self-check/inventory guard, release-service env key self-check/guard, Android env mapping self-check/guard, iOS scheme config self-check/guard, storage/network usage self-check/guard, storage/network validation script self-check/guard, wallet crypto validation script guard, native module inventory self-check/inventory guard, native module upgrade-plan self-check/coverage guard, git dependency snapshot guard, wallet crypto latest snapshot guard, direct outdated snapshot guard, node-fetch resolution guard, secure-storage removal readiness guard, RN nodeify shim self-check/inventory guard, modernization log ID guard self-check, modernization log ID guard, lightweight check documentation guard, TypeScript check, and diff whitespace check.
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
- RN baseline preflight groups the current lightweight Android gate, Metro runtime audit, Node runtime transition audit, lint-staged, Husky, Prettier, Jest, RN upgrade path audit, RN 0.85 foundation plan audit, foundation target aggregate self-guard, target snapshot audit, offline target comparison guard, React 19 impact audit, React package coupling audit, React Native renderer exact-version audit, test/type coupling audit, wallet/crypto runtime audit, CryptoJS runtime audit, state runtime audit, Lodash runtime audit, wallet/crypto latest-snapshot guard, direct outdated snapshot audit guard, camera candidate and QR migration audits with generated summary validation, secure-storage migration and removal-readiness audits with generated summary validation, Sentry warning/source-map readiness audits with generated Android-warning and prerequisite-summary validation, the aggregate warning-source summary checker, standalone Android warning-audit and smoke-summary checkers, Firebase release-service audit with generated summary validation, CodePush release-path and migration-readiness audits with generated summary validation, push-notification bridge audit with generated summary validation, iOS release readiness and iOS macOS validation prerequisites with generated summary validation, the aggregate release-services summary guard self-check, and the aggregate release-services summary checker before larger React Native baseline branches.
- RN online baseline preflight runs the live npm target snapshot check, direct outdated snapshot audit, git dependency snapshot audit, wallet/crypto latest snapshot audit, tooling latest snapshot audit, Android toolchain target audit, BL resolution audit, node-fetch resolution audit, aggregate foundation target summary validation, and summary validation before the normal offline RN baseline preflight.
- Android warning audit records generated timestamp, full log path, timeout, Gradle exit code, baseline guard exit code, targeted warning count, unexpected targeted warning count, and subprocess spawn diagnostics
- The latest refreshed Android warning audit reports `Targeted Android Gradle warnings: 1` and `Unexpected targeted Android Gradle warnings: 0`.
- Current targeted warning source is the staged legacy secure-storage module: `react-native-secure-key-store`.
- Removed Android warning sources include the stale app `buildToolsVersion 28.0.3`, Clipboard `jcenter()`, Biometrics `jcenter()`, the previous Sentry `execResult` finding, `react-native-exit-app` `jcenter()`, `react-native-localize` `jcenter()`, two `@react-native-community/slider` `jcenter()` entries, `react-native-device-info` `jcenter()`, `react-native-vector-icons` `jcenter()`, `@react-native-community/toolbar-android` `jcenter()`, and `react-native-prompt-android` `jcenter()`.
- The current CameraKit scanner migration state is covered by `corepack yarn camera:qr-migration:audit`; Sentry Gradle/source-map wiring is still covered by `corepack yarn sentry:android-warning:audit` even though the active warning audit no longer reports Sentry `execResult`.
- The latest live RN target snapshot check reports `Live check outcome: matched` with `Mismatches: 0`.
- Latest live RN target snapshot summary was refreshed from npm on `2026-06-06` and still matches `react-native@0.85.3` latest, `0.86.0-rc.3` next, `0.87.0-nightly-20260606-510cc0c5e` nightly, React peer `^19.2.3`, and Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.
- `corepack yarn android:dev:check-artifacts` verifies the latest smoke and warning-audit summaries, their referenced local artifacts, and any listed targeted warning sources against the Android warning baseline guard
- `corepack yarn android:dev:check-artifact-guard` verifies the warning-summary source guard with known-source, zero-warning, mismatched-count, and unexpected-source cases
- `corepack yarn android:dev:audit-smoke` runs the Android environment audit, refreshes warning audit, emulator smoke, and artifact checker evidence in one pass

Known gaps:

- Full Jest suite is not hermetic.
- Some tests require local mnemonic/env secrets.
- Some tests call public or staging Electrum endpoints.
- Full funded transaction QA is blocked until a funded BTCV testnet wallet is available.
- Full wallet flow QA is still required: create/import wallet, PIN, biometrics, send, receive, QR scan, history, authenticator, recovery flows.
- Remaining targeted Android warning sources were last refreshed from `local-docs/android-warning-audit-summary.txt` after the RN `0.85.3` baseline proof: one known native-module `jcenter()` finding; unexpected targeted warning count was `0`.
- `BEM-37.78` records the camera/QR migration readiness audit for the `react-native-camera` warning source.
- `BEM-37.99` records the Sentry Android warning audit for the previous Sentry `execResult` warning source; `BEM-37.105` records the earlier RN `0.76` warning-baseline refresh after Sentry `execResult` no longer appeared in that Gradle warning audit; `BEM-37.131` and later Sentry audit refreshes track the current RN `0.81` baseline where Sentry `execResult` still does not appear; `BEM-37.106` removes the `react-native-exit-app` `jcenter()` source from the warning baseline; `BEM-37.107` removes the `react-native-localize` `jcenter()` source; `BEM-37.108` removes the two `@react-native-community/slider` `jcenter()` sources; `BEM-37.109` removes the `react-native-device-info` `jcenter()` source.
- `BEM-36.115` records the current React Native baseline preflight refresh before the next RN baseline branch.

## Recommended Upgrade Order

1. Keep Android validation tooling green and use `android:dev:verify` for app-affecting changes.
2. Continue CameraKit QR scanner validation on Android hardware and iOS after a Mac pod refresh; removed camera, masked-view, and Flipper pods are no longer present in `ios/Podfile.lock`, but broader iOS pod drift remains. Use `ios:mac-validation:handoff --all-schemes` on macOS for full shared-scheme simulator coverage after the pod refresh.
3. Handle Sentry Gradle/source-map behavior in a dedicated release tooling branch.
4. Upgrade native modules in controlled groups using `docs/native-module-upgrade-plan.md`.
5. Continue from RN `0.85.3` on the current supported line, then move only to newer supported lines with the same build and emulator proof.
6. Keep future target SDK moves tied to the RN/toolchain path that owns Android template and debug receiver behavior.
7. Upgrade iOS Podfile/deployment target and validate schemes.
8. Add BTC network support and UI switching.
9. Apply rebranding and release pipeline updates.
10. Run security audit and full QA before store release.
