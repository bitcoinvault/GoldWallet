# Wallet Modernization Baseline

Baseline for `BEM-34 - Setup branch + dependencies analysis`.

Updated on `upgrade/wallet-modernization` after the Android SDK/toolchain, warning-audit, smoke-validation hardening, lightweight guard/self-check, and React Native baseline preflight branches.

## Branch Model

- Integration branch: `upgrade/wallet-modernization`
- Current task branch model: focused feature branches merged locally into `upgrade/wallet-modernization`.
- Latest completed stream: Android SDK/toolchain modernization, Android warning audit hardening, Android smoke helper hardening, lightweight validation guard/self-check hardening, current camera/Sentry warning-source audits, release-services aggregate handoff refreshes, modernization log ID guard, security resolution baselines, plist major compatibility guard, and React Native baseline preflight evidence.

All modernization work should be developed on focused task branches and merged into `upgrade/wallet-modernization`. The integration branch should be merged back to the main development line only after a tested modernization milestone.

## Current Application Snapshot

- App name/package: `goldwallet`
- App version: `6.5.1` (`versionCode 14`), sourced from `android/release-version.properties`
- Public Google Play baseline: `6.5.2` observed 2026-07-16; the next production candidate requires a newer `versionName` and a `versionCode` above the value supplied from Play Console
- React Native: `0.86.0`
- React: `19.2.3`
- TypeScript: `6.0.3`
- Jest: `30.4.2`
- babel-jest: `30.4.1`
- jest-environment-node: `30.4.1`
- ts-jest: `29.4.11`
- Detox: `20.51.4`
- RN Babel preset: `0.86.0`
- RN Metro config: `0.86.0`
- Android New Architecture: enabled
- Hermes: enabled
- JSC flavor declaration: `org.webkit:android-jsc:+` remains present as the inactive fallback path while Hermes is enabled.

## Required Local Toolchain

Current stack:

- Node.js for Metro/dev runtime: Node 24 LTS runtime
- Repository Node hint: `.nvmrc` -> `24.16.0`
- Yarn: `1.22.22` via Corepack
- Git hooks: Husky `9.1.7` with repo-owned `.husky/pre-commit` running `.nvmrc` Node through `npx -y -p node@... -p yarn@1.22.22 yarn precommit`; `.husky/pre-push` forwards to `yarn prepush`
- Android build JDK: JDK 17 required by the AGP 8.13 baseline
- Android Gradle Plugin: `8.13.2`
- Gradle wrapper: `8.13`
- Android compile SDK: `36`
- Android target SDK: `36`
- Android min SDK: `26`
- Kotlin: `2.1.20`
- NDK: `27.1.12297006`

Observed incompatibilities:

- JDK 21 is not compatible with the current Gradle/RN Android build.
- JDK 11 is no longer sufficient after the AGP 8.x upgrades; use JDK 17 for local and CI Android builds.
- The Android Gradle runner checks `JAVA_HOME\bin\java.exe` before falling back to `java` from `PATH`.

Target direction:

- Keep the current Metro/dev runtime aligned with `.nvmrc` and RN package engine requirements.
- Use JDK 17 for local Android modernization work.
- SDK 36 is now part of the RN/AGP 8.13 Android foundation baseline.
- React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`; continue with milestone jumps from RN `0.86.0` toward a current supported line instead of walking every minor version or jumping blindly to latest.
- React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`; refresh it when an actual RN baseline branch starts.
- Wallet/crypto runtime package risk is tracked in `docs/wallet-crypto-runtime-audit.md` and checked with `corepack yarn wallet:crypto-runtime:audit`.
- RN `0.86.0` foundation scope is tracked in `docs/react-native-076-foundation-plan.md`; use `corepack yarn rn:076-foundation:audit` before changing RN packages.
- The latest live npm target snapshot check matched the recorded React Native target snapshot: `react-native@0.86.0` latest, `0.87.0-rc.1` next, a valid prerelease nightly tag, React peer `^19.2.3`, and Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.
- Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`.
- React 19 impact audit is tracked in `docs/react19-impact-audit.md`; use it before changing React/RN package versions.
- React package coupling audit is tracked in `docs/react-package-coupling-audit.md`; use it to keep React, renderer, and type packages moving together.
- React Native renderer exact-version audit is tracked in `docs/react-package-coupling-audit.md`; use it to prevent package-only React patches that do not match the bundled RN renderer.
- Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`; use it to keep TypeScript, Jest, renderer, and React/RN package validation aligned.
- TypeScript 7 compatibility probe is tracked by `corepack yarn typescript7:compatibility-probe:audit`; it keeps the TypeScript 7 blocker tied to current `@typescript-eslint` and `ts-jest` peer ranges plus an isolated npm install proof instead of a generic outdated-package note.
- Plist major compatibility is tracked by `corepack yarn plist:major-compatibility:audit`; it keeps the `plist@5` blocker tied to the current `xcode` / `simple-plist` CommonJS owner path instead of a generic outdated-package note.

## Current Android Build Setup

- Root Android Gradle Plugin: `com.android.tools.build:gradle:8.13.2`
- Firebase Crashlytics Gradle plugin: `3.0.7`
- Google Services Gradle plugin: `4.5.0`
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

Metro should be started with Node 24 for the current React Native 0.86 stack:

```powershell
$env:Path='D:\tmp\node\node-v24.16.0-win-x64;' + $env:Path
corepack yarn start --reset-cache
```

For Android debug runtime evidence that depends on logcat output from Metro, use the no-multipart Metro helper:

```powershell
$env:Path='D:\tmp\node\node-v24.16.0-win-x64;' + $env:Path
corepack yarn start:metro:no-multipart --reset-cache --port 8081
```

The emulator should use:

```powershell
adb reverse tcp:8081 tcp:8081
```

## Dependency Risk Areas

High-risk native dependencies:

- `@react-native-firebase/*` is now on the checked latest `25.1.0` package family; Firebase release delivery remains a runtime validation item, not a package-version blocker.
- `react-native-camera` was replaced by `react-native-camera-kit@18.0.0` in the dedicated QR scanner migration stream.
- Navigation/layout packages are on the RN `0.86.0` checkpoint versions: `@react-navigation/native@7.3.8`, `@react-navigation/stack@7.10.11`, `@react-navigation/bottom-tabs@7.18.8`, `@react-navigation/devtools@7.1.5`, `react-native-gesture-handler@3.0.2`, `react-native-screens@4.26.1`, and `react-native-safe-area-context@5.8.0`; future bumps should stay tied to navigation smoke validation.
- `react-native-svg@15.15.5` is paired with `react-native-qrcode-svg@6.3.21` and root `qrcode@1.5.4`; future SVG/QR changes need the guarded QR render-screen validation.
- `react-native-share@12.3.1`, `react-native-vector-icons@10.3.0`, `react-native-webview@14.0.1`, `react-native-bootsplash@7.3.2`, and `react-native-fast-image@8.6.3` are checked native packages whose future work should focus on release/device behavior, not generic warning cleanup.
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
- `corepack yarn foundation:target:refresh-online`
- `corepack yarn rn:baseline:preflight:online`
- `corepack yarn foundation:target:check-summaries`
- `corepack yarn plist:major-compatibility:audit`
- `corepack yarn plist:major-compatibility:check-summary`
- `corepack yarn android:dev:check-light`
- Metro dev runtime audit verifies the Node 24 `.nvmrc`, React Native `0.86.0`, RN Babel/Metro config packages, start script, and documentation baseline.
- RN baseline preflight runs the Camera/QR validation handoff dry-run and now regenerates/checks `local-docs/camera-qr-validation-summary.txt` after candidate and migration summaries, so scanner readiness evidence cannot drift out of the main RN modernization gate.
- Android lightweight check runs `check:node-runtime-version`, the Android warning baseline guard, Android warning artifact guard, Android dev environment audit self-check, Android toolchain current-state guard self-check, Android toolchain current-state check, Metro dev runtime audit self-check, React Native upgrade path audit self-check, React Native upgrade path audit, React Native renderer exact-version guard self-check, React Native renderer exact-version guard, camera usage self-check/inventory guard, QR scanner caller self-check/inventory guard, QR scanner validation script guard, QR render usage self-check/inventory guard, QR render validation script guard, legacy Android autolink self-check/guard, Sentry usage self-check/inventory guard, Sentry release integration self-check/guard, CodePush usage self-check/inventory guard, Firebase usage self-check/inventory guard, Firebase Messaging modular API guard, iOS push notification usage self-check/inventory guard, release-service env key self-check/guard, Android env mapping self-check/guard, iOS scheme config self-check/guard, iOS release-config doc guard, explorer/env readiness self-check/guard, store metadata readiness self-check/guard, rebranding release-config readiness self-check/guard, storage/network usage self-check/guard, storage/network validation script self-check/guard, Electrum endpoint readiness guard, Electrum runtime observation parser guard, Electrum Metro observation path guard, wallet crypto validation script guard, transaction details amount label guard, native module inventory self-check/inventory guard, native module upgrade-plan self-check/coverage guard, git dependency snapshot guard, wallet crypto latest snapshot guard, direct outdated snapshot guard, security resolution baseline guard, BL resolution guard, BL current resolution check, node-fetch resolution guard, secure-storage removal readiness guard, RN nodeify shim self-check/inventory guard, modernization log ID guard self-check, modernization log ID guard, lightweight check documentation guard, TypeScript check, and diff whitespace check.
- The Android lightweight gate includes the App Center retirement self-check/source guard, rejecting retired dependencies, Android/iOS configuration files, Android resource switches, and Xcode resource references.
- The Android lightweight release-readiness subgroup includes the Android App Bundle validation guard and the Android upload signing readiness guard/audit/summary check without requiring production key material.
- `corepack yarn prepush` starts with `check:node-runtime-version`, then `android:dev:check-light`, before promoted offline Jest suites.
- `corepack yarn typescript:check`
- ESLint on files changed by `BEM-39`, with existing warnings only
- `corepack yarn android:dev:assemble` on JDK 17
- `corepack yarn android:dev:verify` on a connected Android emulator
- `android:dev:verify` runs the embedded dev smoke path after rebuilding the APK, so the default verification flow validates the bundled APK without requiring Metro.
- `corepack yarn android:dev:release:verify-local` currently rebuilds and validates `dev`, `stage`, `prod`, and `beta` release APK, JS bundle, source-map, and manifest evidence with JDK 17, AGP `8.13.2`, Gradle `8.13`, Kotlin `2.1.20`, compile SDK `36`, target SDK `36`, and Sentry auto-upload disabled.
- Latest local Android release build evidence on `2026-07-16` from `BEM-37.906` recorded release-input fingerprint `a98111d0e4d30800baac7fe82db48037c2d203ad2af861e15ccb848d525e3394` across `510` files. All four release APKs retain the Keychain-only backend and exclude App Center config, resource symbols, and classes. Full `prodRelease` emulator smoke passed; Sentry upload and funded transaction validation remain unclaimed.
- `BEM-37.892` adds variant-aware release smoke validation for `dev`, `stage`, `prod`, and `beta`. On 2026-07-14, `corepack yarn android:prod:release:smoke:verify` passed twice on `emulator-5554` without Metro for package `io.goldwallet.wallet`: first-run terms, PIN, transaction password, email skip, empty dashboard, Create/Import navigation, CameraKit QR scanner, all bottom tabs, Settings Terms WebView, screenshot capture, and fatal/runtime logcat checks all passed. This proves the current `prodRelease` mainnet runtime baseline but does not clear the separate dev/testnet Electrum blocker or claim funded transaction validation.
- `BEM-37.893` extends the variant-aware release path through real local wallet creation. On 2026-07-14, the `prodRelease` create-wallet smoke reached a standard-wallet mnemonic backup and the default 3-key vault public-key integration screen on `emulator-5554`, with no create-wallet error UI or fatal/runtime logcat findings. The generated checker binds the summary to the signed production smoke APK. This remains empty-wallet validation only; funded transaction delivery is still blocked on test-wallet availability.
- `BEM-37.896` extends that production create-wallet proof across an Android process boundary. The smoke requires Android `FLAG_SECURE` on the mnemonic screen without reading the mnemonic, records the original PID, force-stops and restarts the app, requires PIN unlock, rejects an incorrect PIN, finds the exact standard-wallet card under a different PID, and requires `FLAG_SECURE` to be cleared before continuing the existing 3-key vault flow. The summary checker rejects secret-bearing fields, and funded transaction delivery remains outside this empty-wallet persistence proof.
- `BEM-37.894` extends the production release path through public watch-only wallet import. The guarded flow starts from clean onboarding, imports the existing public Bech32 Electrum fixture, requires the import-specific success text and resulting wallet card, verifies that `FLAG_SECURE` is cleared after root-stack reset, and rejects secret-bearing fields in local summary evidence. It does not use a mnemonic/private key or claim funded transaction validation.
- `BEM-37.895` extends that proof across an Android process boundary. The import smoke records the original PID, force-stops and restarts the production app, requires PIN unlock, proves that an incorrect PIN remains locked, finds the same watch-only wallet card under a different PID after the configured PIN, and rechecks `FLAG_SECURE` and fatal/runtime logcat state before accepting the local evidence. Startup completes the required Keychain credentials initialization before persisted wallet loading and stores only a process-local SHA-256 PIN verifier; the existing authentication saga uses it without a second Keychain read, while PIN creation and factory reset keep the verifier lifecycle explicit.
- The same startup path waits for local wallet storage hydration before mounting routes and publishes cached wallets before the Electrum refresh. A slow or unavailable network therefore no longer keeps a persisted wallet behind the dashboard's initial spinner.
- `corepack yarn release-services:validation:handoff --skip-android-release` was refreshed in `BEM-37.891` on `2026-07-14` after the latest Android release evidence refresh. The aggregate gate now includes generated Sentry release validation and CodePush update-validation handoff summaries and currently passes only under controlled blocker `blocked-by-electrum-certificate-expired` after a current `devRelease` no-network smoke refresh on `emulator-5554`; the blocker is the dev/testnet Electrum TLS certificate for `electrumx.testnet.btcv.stage.rnd.land:443 tls`, expired `Tue Jun 23 16:52:40 GMT 2026`.
- `corepack yarn electrum:endpoint-readiness:audit` was added in `BEM-37.860` as a live Electrum env preflight that writes only local evidence. On `2026-07-11` it scanned 5 env files and 8 endpoint entries: 6 mainnet entries were ready, while `.env.dev.testnet` and `.env.beta.testnet` both pointed at `electrumx.testnet.btcv.stage.rnd.land:443 tls` with `CERT_HAS_EXPIRED`, certificate `valid_to=Jun 23 16:52:40 2026 GMT`, and `expires_in_days=-19`. Mainnet endpoints `electrumx-mainnet1.bitcoinvault.global:443` and `electrumx-mainnet2.bitcoinvault.global:443` were authorized with certificate `valid_to=Aug 7 14:28:14 2026 GMT`.
- `corepack yarn sentry:release:validation:preflight` currently passes only as a controlled `not ready` source-map readiness check: `@sentry/react-native@8.18.0` and direct `@sentry/cli@3.6.0` are current, Sentry Android warning and RN bundle-task compatibility summaries are valid, but `SENTRY_AUTH_TOKEN`, root/Android/iOS `sentry.properties`, full release smoke/create-wallet proof, and macOS iOS archive validation are still required before release upload can be claimed. Latest Android release prerequisite evidence refresh: `BEM-37.857` on 2026-07-11.
- `corepack yarn ios:static:verify` currently validates Windows-safe iOS static readiness and handoff evidence only: static iOS files are valid, 8 shared schemes are guarded, the generated iOS validation handoff summary is checked as a local artifact, `ios/Podfile.lock` still has 12 active drift issues, and iOS runtime/archive validation remains not claimed until macOS with Xcode 16.1+ and CocoaPods runs the all-schemes handoff. Latest refresh: `BEM-37.858` on 2026-07-11.
- Android smoke helper validates app PID logcat, foreground focus, dashboard UI text, UI hierarchy artifact, and startup screenshot
- Android smoke helper polls UI readiness after startup so clean Metro-cache runs do not fail on a transient bootsplash hierarchy
- Android smoke helper writes `local-docs/android-smoke-dev-summary.txt` with generated timestamp, outcome, exit code, selected serial, Metro endpoint/reachability, app PID, logcat count, UI attempts, UI hierarchy path, screenshot path, and screenshot byte count
- `corepack yarn android:dev:audit-warnings`
- Android dev environment audit verifies the local Java range, adb access, Gradle wrappers, Android validation helper files, and RN upgrade path audit scripts before build/smoke work.
- RN baseline preflight starts with `check:node-runtime-version`, then groups the current lightweight Android gate, Metro runtime audit, Node runtime transition audit, lint-staged, Husky, Prettier, Jest, RN upgrade path audit, RN foundation plan audit, foundation target aggregate self-guard, target snapshot audit, offline target comparison guard, React 19 impact audit, React package coupling audit, React Native renderer exact-version audit, test/type coupling audit, wallet/crypto runtime audit, CryptoJS runtime audit, state runtime audit, Lodash runtime audit, wallet/crypto latest-snapshot guard, direct outdated snapshot audit guard, camera candidate and QR migration audits with generated summary validation, secure-storage migration and removal-readiness audits with generated summary validation, Sentry warning/source-map readiness audits with generated Android-warning, prerequisite-summary, and credential-plan validation, the aggregate warning-source summary checker, standalone Android warning-audit and smoke-summary checkers, Firebase release-service audit with generated summary validation, CodePush release-path and migration-readiness audits with generated summary validation, push-notification bridge audit with generated summary validation, iOS release readiness and iOS macOS validation prerequisites with generated summary validation, the aggregate release-services summary guard self-check, and the aggregate release-services summary checker before larger React Native baseline branches.
- `foundation:target:refresh-online` starts with `check:node-runtime-version`, then runs the live npm target snapshot check, direct outdated snapshot audit, generated React patch blocker summary, generated Babel 8 migration blocker summary, git dependency snapshot audit, wallet/crypto latest snapshot audit, storage/network latest snapshot audit, tooling latest snapshot audit, TypeScript 7 compatibility probe, Android toolchain target audit, BL resolution audit, plist major compatibility audit, node-fetch resolution audit, and aggregate foundation target summary validation.
- RN online baseline preflight runs `foundation:target:refresh-online` first, then runs the normal offline RN baseline preflight.
- Android warning audit records generated timestamp, full log path, timeout, Gradle exit code, baseline guard exit code, targeted warning count, unexpected targeted warning count, and subprocess spawn diagnostics
- The latest refreshed Android warning audit reports `Targeted Android Gradle warnings: 0` and `Unexpected targeted Android Gradle warnings: 0` after validated legacy secure-storage removal.
- No targeted Android Gradle warning sources remain.
- Removed Android warning sources include the stale app `buildToolsVersion 28.0.3`, Clipboard `jcenter()`, Biometrics `jcenter()`, the previous Sentry `execResult` finding, `react-native-exit-app` `jcenter()`, `react-native-localize` `jcenter()`, two `@react-native-community/slider` `jcenter()` entries, `react-native-device-info` `jcenter()`, `react-native-vector-icons` `jcenter()`, `@react-native-community/toolbar-android` `jcenter()`, and `react-native-prompt-android` `jcenter()`.
- The current CameraKit scanner migration state is covered by `corepack yarn camera:qr-migration:audit`; Sentry Gradle/source-map wiring is still covered by `corepack yarn sentry:android-warning:audit` even though the active warning audit no longer reports Sentry `execResult`.
- The latest live RN target snapshot check reports `Live check outcome: matched` with `Mismatches: 0`.
- Latest live RN target snapshot check on `2026-07-15` matched the recorded `2026-07-15` snapshot: `react-native@0.86.0` latest, `0.87.0-rc.1` next, a valid prerelease nightly tag, React peer `^19.2.3`, and Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`. Exact nightly drift is informational and no longer forces daily snapshot-only commits.
- Latest live foundation dependency cohort snapshots were refreshed from npm on `2026-07-15`: direct outdated reports 19 entries with 15 known blockers, 4 exotic or git-pinned entries, and 0 review-required entries after the native-screens, protobufjs, and TypeScript ESLint patch branches. Wallet/crypto reports 15 tracked entries with only the BitcoinVault `bitcoinjs-lib` fork intentionally pinned; storage/network reports 9 current native entries after legacy secure-storage removal; tooling reports 24 tracked entries with `@typescript-eslint@8.64.0` current and TypeScript 7 still blocked; the TypeScript 7 compatibility probe reports 3 peer-range blockers across `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, and `ts-jest`; the plist major compatibility probe keeps `plist@3.1.1` / `simple-plist@1.3.1` because latest `plist@5.0.0` breaks the current CommonJS owner path; and the Android toolchain target remains blocked at AGP `9.3.0` / Gradle `9.6.1` by the RN Gradle plugin `0.86.0` Kotlin metadata path while stable Kotlin is `2.4.10` and Maven metadata release `2.4.20-Beta1` remains prerelease-only. The Android toolchain target summary requires committed BEM-37.900 evidence snippets for the live AGP/Gradle/Kotlin tuple, real compile task failure, metadata mismatch, and validated AGP `8.13.2` / Gradle `8.13` / Kotlin `2.1.20` baseline.
- Security resolution baselines after `BEM-37.863` through `BEM-37.902` pin patched transitive versions for `elliptic`, `cipher-base`, `sha.js`, `shell-quote`, `minimist`, Sentry CLI `undici@8.7.0`, `plist`, `simple-plist`, `braces`, `form-data`, `moment`, `qs`, `tmpl`, `tmp`, `joi@18.2.3`, `launch-editor@2.14.1`, `micromatch@4.0.8`, `protobufjs@8.7.1`, `word-wrap@1.2.5`, scoped `**/xcode/uuid@14.0.1`, `serve-static@2.2.1`, `send@1.2.1`, lockfile `brace-expansion@1.1.16`/`2.1.2`/`5.0.7`, lockfile `js-yaml@3.15.0`/`4.3.0`, lockfile `yaml@1.10.3`/`2.9.0`, and wallet-critical `tiny-secp256k1@2.2.4`, while the lockfile is guarded against vulnerable `ansi-regex`, `base-x@3.0.8`, `brace-expansion@1.1.11`, `minimatch@3.0.4`, `picomatch@2.3.0`, `lodash@4.17.21`, `jws@4.0.0`, `ws@7.5.4`, `tiny-secp256k1@1.1.6`, `joi@17.13.3`, `launch-editor@2.14.0`, `micromatch@4.0.4`, `protobufjs@7.6.1`/`7.6.2`, `word-wrap@1.2.3`, `js-yaml@3.14.1`, `js-yaml@4.1.1`, `yaml@1.10.2`, `uuid@7.0.3`, `serve-static@1.14.1`, and `send@0.17.1` ranges. `BEM-37.868` keeps Android/RN runtime compatibility through a Metro-only `tiny-secp256k1` shim backed by `@bitcoinerlab/secp256k1`, because the upstream `tiny-secp256k1@2.2.4` browser entry imports WASM. `BEM-37.872` reduced `corepack yarn audit --json --level moderate` from `1` to `0` moderate findings; `BEM-37.873` reduced the remaining `2` low React Native CLI server path findings to `0 vulnerabilities found`; `BEM-37.875` kept `corepack yarn audit --level low` at `0 vulnerabilities found` while moving that owner path to latest `serve-static@2.2.1` and `send@1.2.1`; `BEM-37.876` keeps the audit clean while moving the xcode owner path to latest `uuid@14.0.1`; `BEM-37.877` keeps the audit clean while moving the RN CLI config/type owner path to latest `joi@18.2.3`; `BEM-37.902` refreshes the Firebase/Firestore proto-loader owner path to latest `protobufjs@8.7.1` with the guarded resolution baseline; `BEM-37.879` keeps the audit clean while moving the Sentry CLI install/download owner path to latest `undici@8.7.0`; `BEM-37.881` keeps the audit clean while preserving the guarded `plist@3.1.1` / `simple-plist@1.3.1` owner path and recording the incompatible latest `plist@5.0.0` CJS export-map blocker. `corepack yarn audit --json --level high` now reports `0` critical and `0` high findings, down from `22` critical and `148` high before the security branches.
- The TypeScript 7 compatibility probe was hardened on `2026-07-12`: `typescript@7.0.2` still satisfies the repo Node `v24.16.0`, but remains blocked by `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, and `ts-jest` peer ranges. An isolated normal npm install of the latest TypeScript/tooling cohort now fails with `ERESOLVE`; the legacy-peer fallback installs only to confirm the actual latest peer ceilings.
- The Babel 8 migration probe was hardened on `2026-07-12`: the full latest Babel 8 cohort installs in an isolated temp prefix and matches live latest metadata, but the RN `0.86.0` preset transform still fails with `BABEL_VERSION_UNSUPPORTED` in the `@babel/plugin-transform-flow-strip-types` path.
- `corepack yarn android:dev:check-artifacts` verifies the latest smoke and warning-audit summaries, their referenced local artifacts, and any listed targeted warning sources against the Android warning baseline guard
- `corepack yarn android:dev:check-artifact-guard` verifies the warning-summary source guard with known-source, zero-warning, mismatched-count, and unexpected-source cases
- `corepack yarn android:dev:audit-smoke` runs the Android environment audit, refreshes warning audit, embedded emulator smoke, and artifact checker evidence in one pass

Known gaps:

- Full Jest suite is not hermetic.
- Some tests require local mnemonic/env secrets.
- Some tests call public or staging Electrum endpoints.
- Full funded transaction QA is blocked until a funded BTCV testnet wallet is available.
- Full wallet flow QA is still required: create/import wallet, PIN, biometrics, send, receive, QR scan, history, authenticator, recovery flows.
- Remaining targeted Android warning sources were last refreshed from `local-docs/android-warning-audit-summary.txt` after the RN foundation proof: one known native-module `jcenter()` finding; unexpected targeted warning count was `0`.
- `BEM-37.78` records the camera/QR migration readiness audit for the `react-native-camera` warning source.
- `BEM-37.99` records the Sentry Android warning audit for the previous Sentry `execResult` warning source; `BEM-37.105` records the earlier RN `0.76` warning-baseline refresh after Sentry `execResult` no longer appeared in that Gradle warning audit; `BEM-37.131` and later Sentry audit refreshes track the current RN `0.81` baseline where Sentry `execResult` still does not appear; `BEM-37.106` removes the `react-native-exit-app` `jcenter()` source from the warning baseline; `BEM-37.107` removes the `react-native-localize` `jcenter()` source; `BEM-37.108` removes the two `@react-native-community/slider` `jcenter()` sources; `BEM-37.109` removes the `react-native-device-info` `jcenter()` source.
- `BEM-36.115` records the current React Native baseline preflight refresh before the next RN baseline branch.

## Recommended Upgrade Order

1. Keep Android validation tooling green and use `android:dev:verify` for app-affecting changes.
2. Continue CameraKit QR scanner validation on Android hardware and iOS after a Mac pod refresh; removed camera, masked-view, and Flipper pods are no longer present in `ios/Podfile.lock`, but broader iOS pod drift remains. Use `ios:mac-validation:handoff --all-schemes` on macOS for full shared-scheme simulator coverage after the pod refresh.
3. Handle Sentry Gradle/source-map behavior in a dedicated release tooling branch.
4. Upgrade native modules in controlled groups using `docs/native-module-upgrade-plan.md`.
5. Continue from RN `0.86.0` on the current supported line, then move only to newer supported lines with the same build and emulator proof.
6. Keep future target SDK moves tied to the RN/toolchain path that owns Android template and debug receiver behavior.
7. Upgrade iOS Podfile/deployment target and validate schemes.
8. Add BTC network support and UI switching.
9. Apply rebranding and release pipeline updates.
10. Run security audit and full QA before store release.
