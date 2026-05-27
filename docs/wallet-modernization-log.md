# Wallet Modernization Log

This document tracks staged wallet modernization work branch by branch.

## Integration Branch

- Branch: `upgrade/wallet-modernization`
- Base: `develop`
- Purpose: integration branch for staged wallet modernization work before merging back to the main development line.

## Completed Branches

### BEM-34 - Setup branch + dependencies analysis

- Branch: `feature/bem-34-baseline-analysis`
- Merged into: `upgrade/wallet-modernization`
- Feature commit: `84b56a65`
- Document: `docs/wallet-modernization-baseline.md`

Scope:

- Captured the current dependency and toolchain baseline.
- Recorded known build, Metro, Android, and test constraints.
- Added a repository-level Node version hint for the current React Native baseline.
- Defined the recommended sequencing for the larger wallet modernization.

### BEM-39 - RN API compatibility

- Branch: `feature/bem-39-rn-api-compat`
- Merged into: `upgrade/wallet-modernization`
- Feature commit: `b774c3ea`
- Merge commit: `2d40de3d`

Scope:

- Updated deprecated `BackHandler` cleanup to subscription `.remove()`.
- Updated `AppState` listener cleanup to subscription `.remove()`.
- Added defensive runtime handling around `AppState` subscription setup after emulator smoke testing.
- Added `InteractionManager` handle cleanup in receive flow.
- Fixed QR local image dependency source so install/build can resolve dependencies.
- Confirmed the current Android build uses JDK 11.
- Confirmed the current React Native 0.65 / Metro dev runtime needs Node 16, not Node 22.

Validation:

- `corepack yarn typescript:check` passed.
- ESLint passed for changed files, with existing warnings only.
- Android `:app:assembleDevDebug` passed on JDK 11.
- Emulator smoke test passed with Metro running on Node 16.
- App foreground/background smoke test passed without `AppState` crash.

Open follow-ups:

- Confirm `electrumx.testnet.btcv.stage.rnd.land:443 tls` with DevOps.
- Full wallet flow QA is still required.
- Full Jest suite still needs stabilization because existing tests depend on network Electrum endpoints and local secrets/env.

### BEM-35 - React Native 0.68 upgrade step

- Branch: `feature/bem-35-rn-068-upgrade`
- Merged into: `upgrade/wallet-modernization`
- Feature commit: `4f380ce8`
- Follow-up commit: `43f36bed`
- Merge commit: `aa2dc3c3`

Scope:

- Upgrade the first React Native step from `0.65.3` to `0.68.7`.
- Keep React pinned to `17.0.2`, which is the expected React peer for React Native `0.68.7`.
- Align local Metro/codegen dependencies required by the RN 0.68 toolchain.
- Regenerate `yarn.lock` with Node 16 and Yarn 1.

Validation:

- `corepack yarn install --ignore-scripts` passed on Node 16.
- `corepack yarn run postinstall` passed and re-applied Jetifier.
- `corepack yarn typescript:check` passed.
- ESLint passed for touched source files.
- Android `:app:assembleDevDebug -x lint` passed on JDK 11.
- Dev debug APK installed and launched on an Android emulator with Metro running on Node 16.
- Fixed initial splash handling so the current `AppState` is processed on mount, not only after later app state changes.
- Confirmed the app reaches the Terms & Conditions screen after the RN 0.68 runtime starts.
- Background/foreground smoke test passed without startup or `AppState` crashes in logcat.

Open follow-ups:

- Android build still reports legacy/manual module duplication warnings around Sentry and React Native Firebase; clean this in the native module modernization branch.
- Electrum testnet connection still fails against `electrumx.testnet.btcv.stage.rnd.land:443 tls`; this remains a DevOps/environment follow-up.
- Continue staged RN upgrades after this branch rather than jumping directly from `0.68.7` to the latest stable React Native.

## Active Branches

### Pending E2E follow-ups

- Full `SendCoinsScreen` transaction-path E2E is pending until a funded testnet wallet is available.
- Required test asset: BTCV testnet wallet with a small spendable balance, for example around `0.01 BTCV`, plus a testnet recipient address.
- Target validation: UTXO fetch, fee calculation loop, confirmation screen, and optional testnet broadcast.
- Mainnet funds are not required for this validation and should not be used for smoke/E2E automation.

### BEM-36 - Native modules upgrade

- Branch: `feature/bem-36-native-modules-upgrade`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Start Android native module cleanup after the RN 0.68 upgrade.
- Remove stale manual Android aliases for React Native Firebase, Sentry, and SecureKeyStore now covered by React Native autolinking.
- Keep the explicit CodePush Android project override because `react-native-code-push` autolinks to the package root while Gradle needs `android/app`.
- Remove duplicate `androidx.swiperefreshlayout` dependency entry from the app Gradle file.

Validation:

- `corepack yarn typescript:check` passed.
- Android `:app:assembleDevDebug -x lint` passed on JDK 11.
- `npx react-native config` confirms Firebase Analytics/App, Sentry, and SecureKeyStore are detected through autolinking.
- Emulator smoke test passed with Metro on Node 16: APK installs, JS bundle starts, and the app reaches onboarding `Create PIN`.
- Known Electrum testnet connection failure still appears in Metro logs, but it does not block the app startup flow.

Open follow-ups:

- Continue native module review in controlled groups before the next RN step.
- Review remaining legacy warnings: deprecated `compile` configurations, `jcenter()`, old build tools declarations, and Flipper deprecations.

### BEM-37 - Android Gradle configuration cleanup

- Branch: `feature/bem-37-android-gradle-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Remove duplicate `org.gradle.jvmargs` declarations from `android/gradle.properties`.
- Drop obsolete `MaxPermSize` JVM option from the Gradle daemon configuration.
- Keep Gradle, Android Gradle Plugin, compile SDK, and target SDK versions unchanged in this branch to avoid mixing config cleanup with a toolchain upgrade.

Validation:

- Android `:app:assembleDevDebug -x lint --warning-mode all` passed on JDK 11 before the cleanup.
- `corepack yarn typescript:check` passed after the cleanup.
- Android `:app:assembleDevDebug -x lint --warning-mode all` passed on JDK 11 after the cleanup.

Open follow-ups:

- Plan Android Gradle Plugin / Gradle wrapper / SDK upgrades as separate branches because they have wider compatibility impact.

### BEM-37.1 - Android Gradle Plugin 7 step

- Branch: `feature/bem-37-agp-7-upgrade`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Upgrade Android Gradle Plugin from `4.2.1` to `7.0.4`.
- Upgrade Gradle wrapper from `6.9` to `7.3.3`.
- Keep compile SDK and target SDK unchanged in this step because local Android SDK has `android-30` and `android-36`, but not `android-34`.
- Upgrade `react-native-rate` from the locked `1.2.6` package to `1.2.12` because the older Android Gradle file uses the removed `maven` plugin.
- Disable Android autolinking for unused legacy modules `@remobile/react-native-qrcode-local-image` and `react-native-prompt-android`, which still depend on obsolete Android Gradle APIs / Android Support libraries.

Validation:

- `corepack yarn typescript:check` passed.
- Android `:app:assembleDevDebug -x lint --warning-mode all` passed on JDK 11 with Gradle `7.3.3` and Android Gradle Plugin `7.0.4`.
- `corepack yarn run postinstall` passed after dependency update and restored RN Node polyfill shims.
- Emulator smoke test passed with Metro on Node 16: APK installs, JS bundle starts, and the app reaches onboarding `Create PIN`.
- Known Electrum testnet connection failure still appears in Metro logs, but it does not block app startup.

Open follow-ups:

- Install/verify the intended Android platform SDK before the compile/target SDK bump.
- Continue SDK/toolchain upgrade in the next controlled BEM-37 branch after this build passes.
- Remaining Gradle 8 blockers are mostly dependency-level warnings from React Native native modules and should be handled by dependency upgrades rather than root Gradle config changes.

### BEM-38 - Android test dependency pinning

- Branch: `feature/bem-38-pin-android-test-deps`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Replace dynamic Android Detox artifact version `com.wix:detox:+` with `com.wix:detox:18.20.1`, matching the `detox` package version in `package.json`.
- Keep Detox itself and the test configuration unchanged.

Validation:

- `corepack yarn typescript:check` passed.
- Android `:app:assembleDevDebug -x lint --warning-mode all` passed on JDK 11.

Open follow-ups:

- Review the Detox stack separately before any Detox major upgrade.
- Continue dependency cleanup for packages still emitting Android Gradle warnings from `node_modules`, including `react-native-rate`, `jcenter()` usage, obsolete `compile`, and old build tools declarations.

### BEM-37.2 - Android SDK 34 target step

- Branch: `feature/bem-37-sdk-34-upgrade`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Install Android command-line tools locally so the repository can use `sdkmanager` for repeatable SDK package checks.
- Install Android SDK Platform 34 and Build-Tools 34.0.0 in the local Android SDK.
- Raise Android `compileSdkVersion` and `buildToolsVersion` from 30 to 34.
- Raise Android `targetSdkVersion` from 30 to 33 in this branch.
- Upgrade Android Gradle Plugin from `7.0.4` to `7.4.2` and Gradle wrapper from `7.3.3` to `7.5.1` while staying on JDK 11.
- Add the AGP 7 compile SDK warning suppression for SDK 34.
- Remove the need for a local AAPT2 path override by using a newer AGP 7.x toolchain that can link SDK 34 resources.
- Upgrade `react-native-screens` from `3.6.0` to `3.22.1`, because the old Kotlin implementation fails against SDK 34 with nullable `Canvas` type changes.
- Add the Android 13+ notification runtime permission flow required after raising `targetSdkVersion` to 33.
- Declare `android.permission.POST_NOTIFICATIONS` in the Android manifest.
- Defer `targetSdkVersion=34` until a later React Native / Android Gradle Plugin step, because the RN 0.68 debug AAR crashes on Android 14+ when dev support registers a broadcast receiver without the Android 14 receiver flags.

Validation:

- `corepack yarn typescript:check` passed.
- `corepack yarn run postinstall` passed.
- Android `:app:assembleDevDebug -x lint` passed on JDK 11 after the compile SDK 34 / target SDK 33 / AGP 7.4.2 bump.
- Emulator smoke test passed on `Medium_Phone_API_36.0`: dev APK installs, Metro bundles `index.js`, JS logs `Running "GoldWallet"`, and the app reaches the PIN/onboarding flow without the Android 14 DevSupport receiver crash.
- Known Electrum testnet connection failure still appears in Metro logs, but it does not block app startup.
- Follow-up review blocker fixed: Android 13+ now requests notification permission before using the FCM token flow.
- Changed notification service lint passed.
- Fresh dev APK reinstall/launch smoke passed after the permission fix; Android displayed the expected notification permission dialog for `GoldWallet Dev`.

Open follow-ups:

- Revisit `targetSdkVersion=34` after the next React Native step or after replacing the RN Android AAR with a version that handles Android 14 dynamic receiver flags.
- Continue reducing remaining dependency-level Android warnings before the next React Native upgrade step.

### BEM-37.3 - Android Gradle warning cleanup

- Branch: `feature/bem-37-gradle-warning-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Audit Android Gradle warnings after the AGP 7.4.2 / SDK 34 step.
- Move the app module package namespace from `AndroidManifest.xml` to `android/app/build.gradle`.
- Set the Android package name explicitly in `react-native.config.js` because the current React Native CLI still needs it for autolinking config generation.
- Opt in to the AGP Gradle 8 publishing behavior with `android.disableAutomaticComponentCreation=true`.
- Keep dependency-owned warnings in `node_modules` for later package upgrade branches instead of patching installed packages directly.

Validation:

- Android `:app:assembleDevDebug -x lint --warning-mode all` passed on JDK 11.
- Gradle warning audit confirmed the app namespace warning is removed.
- `npx react-native config` still resolves `packageName`, `packageFolder`, and `mainFilePath` correctly after moving namespace out of the manifest.
- `corepack yarn typescript:check` passed.
- Emulator smoke test passed: dev APK installs, Metro bundles `index.js`, JS logs `Running "GoldWallet"`, and no crash log was emitted.

Open follow-ups:

- Upgrade or replace dependencies still emitting Gradle warnings from `node_modules`, including `@react-native-async-storage/async-storage`, `react-native-share`, and `@sentry/react-native`.
- Align local Android command-line tools with the installed SDK XML format to remove the SDK XML version warning.

### BEM-37.4 - Android dependency warning cleanup

- Branch: `feature/bem-37-dependency-warning-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Upgrade `@react-native-async-storage/async-storage` from the locked `1.15.7` install to `1.24.0`.
- Upgrade `react-native-share` from `2.0.0` to `7.9.1`.
- Upgrade `@sentry/react-native` from `3.1.0` to `5.36.0`.
- Remove obsolete `@types/react-native-share`, because `react-native-share` now ships its own TypeScript definitions.
- Update the logger Sentry level mapping from the removed `Sentry.Severity` enum to literal Sentry severity levels.

Validation:

- `corepack yarn add` completed on Node 16 and re-ran the repository `postinstall`.
- `corepack yarn typescript:check` passed.
- ESLint passed for the changed logger and share call sites, with existing `Function` type warnings only in `OptionsAuthenticatorScreen`.
- Android `:app:assembleDevDebug -x lint --warning-mode all` passed on JDK 11.
- Emulator smoke test passed: dev APK installs, Metro bundles `index.js`, JS logs `Running "GoldWallet"`, no crash log was emitted, and Electrum connected.

Open follow-ups:

- Remaining Gradle warnings are still dependency-owned and should be handled by separate package upgrades or later RN/AGP moves: `react-native-biometrics` still uses `jcenter()`, several libraries still declare namespace through manifests, and Sentry's Gradle script still touches deprecated Gradle task properties during configuration.
- Validate share sheet and Sentry native reporting manually in a QA pass, because this branch only smoke-tests app startup.

### BEM-37.14 - ViewPropTypes warning cleanup

- Branch: `feature/bem-37-viewproptypes-logbox-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Suppress the known `ViewPropTypes will be removed from React Native` LogBox warning emitted by the legacy `react-native-snap-carousel` dependency.
- Keep warning handling scoped to the specific dependency warning instead of disabling LogBox globally.

Validation:

- `corepack yarn typescript:check` passed.
- ESLint passed for `index.js`.
- `git diff --check` passed.
- Emulator smoke test passed after relaunch: dashboard rendered and the visible `ViewPropTypes` warning overlay was gone.
- UI hierarchy check did not contain `ViewPropTypes`, `deprecated-react-native-prop-types`, or `LogBox`.

Open follow-ups:

- Replace or upgrade `react-native-snap-carousel` in a later UI dependency branch instead of carrying this warning suppression indefinitely.

### BEM-37.15 - Notification API type cleanup

- Branch: `feature/bem-37-notification-api-type-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add typed payload contracts for notification push token registration and removal.
- Replace loose `any` types in `subscribeDeviceFCM` and `removeDeviceFCM`.
- Keep the runtime `/push/` payload shape unchanged.

Validation:

- `corepack yarn typescript:check` passed.
- ESLint passed for the changed email notification API files.
- `git diff --check` passed.

### BEM-37.16 - Transaction item callback type cleanup

- Branch: `feature/bem-37-transaction-item-type-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Replace the loose `any` callback argument in `TransactionItem` with a generic transaction item type, so dashboard and recovery lists keep their existing transaction shapes.
- Preserve enhanced dashboard transaction typing through the grouped transaction helper.
- Keep the rendered transaction list behavior unchanged.

Validation:

- `corepack yarn typescript:check` passed.
- ESLint passed for the changed dashboard transaction item and grouping helper files.
- `git diff --check` passed.

### BEM-37.17 - Action sheet background fix

- Branch: `feature/bem-37-action-sheet-background-fix`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Keep the previous dashboard screen mounted under the transparent `ActionSheet` route.
- Restore the expected dimmed dashboard background when opening the wallet selector bottom sheet.

Validation:

- `corepack yarn typescript:check` passed.
- ESLint passed for `src/navigators/RootNavigator.tsx`.
- `git diff --check` passed.
- Emulator smoke test passed: wallet selector opens with the dashboard visible under the dimmed overlay instead of a plain gray background.

### BEM-37.18 - Pre-push check cleanup

- Branch: `feature/bem-37-prepush-check-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Replace the `pre-push` hook's full Jest run with a deterministic TypeScript check.
- Add explicit `test:unit` and `test:integration` scripts so wallet/Electrum tests can still be run intentionally.
- Keep the existing full `test` and `test:ci` commands unchanged for full-suite runs.

Validation:

- `corepack yarn prepush` passed.
- `corepack yarn typescript:check` passed.
- `yarn eslint package.json` passed.
- Existing Jest blocker was reproduced before this change: unit/integration tests still depend on Electrum connectivity and legacy signer expectations, so they are tracked as test-suite stabilization work rather than a push gate.

### BEM-37.19 - Offline signer unit test stabilization

- Branch: `feature/bem-37-jest-signer-stabilization`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Mock `BlueElectrum.getDustValue()` in `tests/unit/signer.test.js` so signer unit tests do not open Electrum TCP connections.
- Promote the now-deterministic unit suite into the `prepush` script alongside TypeScript.
- Keep integration/Electrum tests separate from the local push gate.

Validation:

- `node node_modules/jest/bin/jest.js tests/unit/signer.test.js --forceExit` passed.
- `node node_modules/jest/bin/jest.js tests/unit --forceExit` passed.
- `corepack yarn prepush` passed.
- `corepack yarn typescript:check` passed.
- ESLint passed for `package.json` and `tests/unit/signer.test.js`.

### BEM-37.20 - Offline storage test stabilization

- Branch: `feature/bem-37-storage-test-stabilization`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Mock `BlueElectrum.getDustValue()` in `tests/integration/Storage.test.js` so storage coverage can run without starting Electrum.
- Add a dedicated `test:storage` script for the offline storage integration test.
- Promote the storage test into the `prepush` script after the unit suite.

Validation:

- `node node_modules/jest/bin/jest.js tests/integration/Storage.test.js --forceExit` passed.
- `corepack yarn prepush` passed.
- ESLint passed for `package.json`, `tests/unit/signer.test.js`, and `tests/integration/Storage.test.js`.
- `git diff --check` passed.

### BEM-37.21 - Offline authenticator test stabilization

- Branch: `feature/bem-37-authenticator-test-stabilization`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Remove the Electrum connection wait from `tests/integration/authenticator.test.js`; the covered PSBT signing paths are offline.
- Mock `BlueElectrum.getDustValue()` for authenticator coverage so the test does not open Electrum TCP connections.
- Add a dedicated `test:authenticator` script and promote it into the `prepush` gate.

Validation:

- `node node_modules/jest/bin/jest.js tests/integration/authenticator.test.js --forceExit` passed.
- `corepack yarn prepush` passed.
- ESLint passed for `package.json` and `tests/integration/authenticator.test.js`.
- `git diff --check` passed.

### BEM-37.22 - Watch-only wallet offline coverage

- Branch: `feature/bem-37-watchonly-offline-tests`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add deterministic watch-only wallet coverage for address validation, unsigned HW-wallet PSBT creation, and signed PSBT combination.
- Keep the existing network-backed `WatchOnlyWallet.test.js` unchanged for Electrum-specific fetch scenarios.
- Add a dedicated `test:watchonly:offline` script and promote it into the `prepush` gate.

Validation:

- `node node_modules/jest/bin/jest.js tests/integration/WatchOnlyWallet.offline.test.js --forceExit` passed.
- `corepack yarn prepush` passed.
- ESLint passed for `package.json` and `tests/integration/WatchOnlyWallet.offline.test.js`.
- `git diff --check` passed.

### BEM-37.23 - HD wallet offline derivation coverage

- Branch: `feature/bem-37-hdwallet-offline-tests`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add deterministic offline HD wallet coverage for witness/script address conversion, BIP49 derivation, BIP84 derivation, legacy xpub address generation, and malformed mnemonic normalization.
- Keep existing network-backed HD wallet tests unchanged for Electrum fetch and funded-wallet transaction scenarios.
- Add a dedicated `test:hdwallet:offline` script and promote it into the `prepush` gate.

Validation:

- `node node_modules/jest/bin/jest.js tests/integration/HDWallet.offline.test.js --forceExit` passed.
- `corepack yarn prepush` passed.
- ESLint passed for `package.json` and `tests/integration/HDWallet.offline.test.js`.
- `git diff --check` passed.

### BEM-37.24 - Wallet core offline coverage

- Branch: `feature/bem-37-wallet-core-offline-tests`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add deterministic offline wallet core coverage for legacy wallet serialization, address validation, and Segwit P2SH address derivation from WIF.
- Keep existing network-backed `App.test.js` unchanged for Electrum balance and UTXO scenarios.
- Add a dedicated `test:wallet-core:offline` script and promote it into the `prepush` gate.

Validation:

- `node node_modules/jest/bin/jest.js tests/integration/App.offline.test.js --forceExit` passed.
- `corepack yarn prepush` passed.
- ESLint passed for `package.json` and `tests/integration/App.offline.test.js`.
- `git diff --check` passed.

### May 2026 checkpoint - Baseline and hardening

- Branch: `feature/bem-37-may-checkpoint`
- Parent branch: `upgrade/wallet-modernization`

Closed in the May baseline/hardening window:

- Established `upgrade/wallet-modernization` as the integration branch for controlled wallet modernization work.
- Completed the Android SDK/toolchain cleanup steps currently safe for the existing React Native baseline.
- Added the Android 13 notification permission handling required after the target SDK bump.
- Fixed runtime issues found during emulator checks, including the wallet selector background and the scoped ViewPropTypes warning suppression.
- Replaced the unstable full Jest push gate with deterministic checks that run TypeScript plus offline wallet test coverage.
- Added offline coverage for signer, storage, authenticator, watch-only wallet, HD wallet derivation, and core wallet behavior.

Deferred to the next phases:

- Stepwise React Native upgrade beyond the current baseline.
- Larger native dependency replacements, including long-term removal of scoped warning suppressions.
- iOS Podfile, scheme, and release configuration validation.
- BTC support beside BTCV, explorer/API alignment, and rebrand work.
- Full wallet QA on a funded testnet wallet, including send, receive, QR, history, authenticator, and recovery flows.
- Security review and release readiness checks.

Open risks:

- Full network-backed Jest integration tests still depend on Electrum connectivity and local mnemonic/env secrets.
- Emulator smoke testing can confirm UI/runtime stability, but funded-wallet transaction testing remains blocked until a usable testnet wallet is available.
- `TransactionBuilder` deprecation remains visible in signer tests and should be addressed in a later PSBT-focused branch.
- Browserslist data is outdated and should be refreshed in a low-risk tooling maintenance branch.

Validation:

- `corepack yarn prepush` passed.
- `git diff --check` passed.
- Android emulator smoke test passed on `Medium_Phone_API_36.0` with package `io.goldwallet.wallet.dev`.
- Dashboard rendered with existing test wallet, `Send` and `Receive` actions, and bottom navigation.
- Wallet selector opened with the dashboard visible under the dimmed modal background.
- Settings tab rendered `General`, `Security`, `About`, and `Developer` sections.
- UI hierarchy and filtered logcat check did not show `LogBox`, `ViewPropTypes`, Metro load errors, or fatal React Native/runtime exceptions.
- Smoke screenshots and UI dumps were captured under `local-docs/may-smoke-*` for local evidence; `local-docs/` remains ignored.

### BEM-37.25 - Browserslist data refresh

- Branch: `feature/bem-37-browserslist-data-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh the `caniuse-lite` browser compatibility data used by Browserslist.
- Add a Yarn resolution so the older hoisted `browserslist@4.17.0` path and newer nested Browserslist path resolve to the same current `caniuse-lite` dataset.
- Keep Babel, React Native, Metro, and app runtime dependencies unchanged.

Validation:

- `corepack yarn why caniuse-lite` resolves to `caniuse-lite@1.0.30001793`.
- `corepack yarn test:storage` passed without the previous Browserslist outdated-data warning.

### BEM-37.26 - Legacy signer test warning cleanup

- Branch: `feature/bem-37-transactionbuilder-test-noise-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Suppress the known `bitcoinjs-lib` `TransactionBuilder` deprecation warning only inside the legacy signer unit test that still covers `createTransaction()`.
- Keep production transaction-building behavior unchanged.
- Leave the real legacy-to-PSBT migration as a separate wallet-signing task, because legacy PSBT signing needs previous transaction data that this code path does not currently receive.

Validation:

- `corepack yarn test:unit` passed without the previous `TransactionBuilder` deprecation warning in the Jest console output.

### BEM-37.27 - RN node polyfill shim check

- Branch: `feature/bem-37-rn-nodeify-shim-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a lightweight `check:rn-nodeify-shims` script that verifies the `rn-nodeify` stream/readable-stream patches needed by Metro.
- Make the failure message point directly to `yarn postinstall`, because skipping postinstall can leave Metro unable to resolve `stream`.
- Keep runtime code and dependency versions unchanged.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Android emulator smoke passed after relaunch: Metro served the bundle, dashboard rendered `E2EWalletTypeTest`, and logcat did not show the previous `Unable to resolve module stream` error.

### BEM-37.28 - Pre-push RN node polyfill guard

- Branch: `feature/bem-37-prepush-shim-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:rn-nodeify-shims` to the beginning of the `prepush` gate.
- Fail fast before TypeScript/Jest if the local RN node polyfill patches are missing after dependency install.
- Keep the existing TypeScript and offline wallet test coverage unchanged.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- Offline wallet tests passed individually: `test:unit`, `test:storage`, `test:authenticator`, `test:watchonly:offline`, `test:hdwallet:offline`, and `test:wallet-core:offline`.
- Android emulator smoke passed: Metro bundled `index.js`, dashboard rendered `E2EWalletTypeTest`, and log output did not show the previous `Unable to resolve module stream` error.

### BEM-36.1 - Android JDK guard

- Branch: `feature/bem-36-android-jdk-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a root Gradle fail-fast guard for unsupported JDK versions above 17.
- Preserve JDK 11 and JDK 17 support for the current AGP 7.4.2 / Gradle 7.5.1 toolchain.
- Replace the confusing JDK 21 D8 `NullPointerException` failure with an actionable Gradle message.

Validation:

- JDK 21 `./gradlew help` fails fast with the new supported-JDK message instead of reaching D8.
- JDK 17 `:app:assembleDevDebug -x lint --warning-mode all` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Fresh dev debug APK installed on Android emulator.
- Android emulator smoke passed: dashboard rendered `E2EWalletTypeTest`, `Send`, `Receive`, and logcat did not show runtime errors.

### BEM-36.2 - Android Gradle runner scripts

- Branch: `feature/bem-36-android-gradle-runner`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a small cross-platform Gradle runner for Android commands.
- Add `android:dev:assemble` for the standard dev debug APK build.
- Add `android:dev:assemble:warnings` for the warning-mode Android audit used during modernization.
- Keep existing React Native run scripts unchanged.

Validation:

- `android:dev:assemble` fails fast on JDK 21 with the runner-level supported-JDK message.
- `android:dev:assemble:warnings` passed on JDK 17.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- Fresh dev debug APK from the new runner installed on Android emulator.
- Android emulator smoke passed: dashboard rendered `E2EWalletTypeTest`, `Send`, `Receive`, and logcat did not show runtime errors.

### BEM-36.3 - Android JDK guard review fix

- Branch: `feature/bem-36-gradle-jdk-guard-review-fix`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make the Android Gradle runner check `JAVA_HOME/bin/java` before falling back to `java` from `PATH`, matching Gradle's Java selection on Windows.
- Reject JDK versions below 11 as well as above 17 in the root Gradle guard.
- Keep the existing supported range at JDK 11-17.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `android:dev:assemble` passed with `JAVA_HOME` set to JDK 17 while `PATH` pointed first to JDK 21, confirming the runner follows Gradle's Java selection.
- `android:dev:assemble` failed fast with the supported-JDK message for JDK 21.
- `android:dev:assemble` failed fast with the supported-JDK message for Java 8.
- Fresh dev debug APK installed on Android emulator.
- Android emulator smoke passed: dashboard rendered `E2EWalletTypeTest`, `Send`, `Receive`, and logcat did not show runtime errors.

### BEM-37.29 - JailMonkey Android Gradle warning cleanup

- Branch: `feature/bem-37-jail-monkey-gradle-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Upgrade `jail-monkey` from the resolved `2.6.0` package to `2.8.5`.
- Remove the hardcoded dependency-owned Android `buildToolsVersion "28.0.3"` warning by using a package version that reads the root Android build tools setting.
- Keep the public JailMonkey API used by the app unchanged; GoldWallet only calls `JailMonkey.isJailBroken()`.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `android:dev:assemble:warnings` passed on JDK 17.
- Android warning audit no longer reports `Build Tools version (28.0.3)`.
- Fresh dev debug APK installed on Android emulator.
- Android emulator smoke passed after Metro cache reset: dashboard rendered `E2EWalletTypeTest`, `Send`, `Receive`, and logcat did not show runtime errors.
- Remaining Android warnings are dependency-owned follow-ups: `jcenter()`, Sentry `execResult`, Android manifest namespace/package attributes, and native dependency deprecation notes.

### BEM-37.30 - Clipboard Android Gradle warning cleanup

- Branch: `feature/bem-37-clipboard-gradle-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Upgrade `@react-native-clipboard/clipboard` from `1.8.4` to `1.11.2`.
- Remove the Clipboard package's Android `jcenter()` usage by moving to a version that uses `mavenCentral()`.
- Keep the upgrade below the newer codegen/new-architecture metadata line that breaks the current RN 0.68 autolinker.
- Replace the remaining deprecated `Clipboard` import from `react-native` in `SendTransactionDetailsScreen`.

Validation:

- `@react-native-clipboard/clipboard@1.16.3` was rejected because its type definitions require newer TypeScript syntax.
- `@react-native-clipboard/clipboard@1.15.0` was rejected because the current RN autolinker generated `import undefined.ClipboardPackage`.
- `@react-native-clipboard/clipboard@1.11.2` passed compatibility checks.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `android:dev:assemble:warnings` passed on JDK 17.
- Fresh dev debug APK installed on Android emulator.
- Android emulator smoke passed after Metro cache reset: dashboard rendered `E2EWalletTypeTest`, `Send`, `Receive`, and logcat did not show runtime errors.

### BEM-37.31 - Biometrics Android Gradle warning cleanup

- Branch: `feature/bem-37-biometrics-gradle-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Upgrade `react-native-biometrics` from `2.1.4` to `3.0.1`.
- Adapt `BiometricService` from the legacy static API to the current instance API.
- Remove the active `jcenter()` warning source from `react-native-biometrics`.
- Keep the app-facing biometric wrapper API unchanged for screens and settings code.

Validation:

- `react-native-biometrics@2.2.2` was rejected because it still emitted the `jcenter()` warning.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `android:dev:assemble:warnings` passed on JDK 17.
- Android warning stacktrace moved the active `jcenter()` source from `react-native-biometrics` to `react-native-camera`, confirming this branch removed the biometrics warning source.
- Fresh dev debug APK installed on Android emulator.
- Android emulator smoke passed after Metro cache reset: dashboard rendered `E2EWalletTypeTest`, `Send`, `Receive`, and logcat did not show runtime errors.

### BEM-37.32 - Android Gradle warning audit helper

- Branch: `feature/bem-37-gradle-warning-audit-helper`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditAndroidGradleWarnings.mjs`.
- Add `android:dev:audit-warnings` to run the warning-mode Android build with stacktraces and write the full log to `local-docs/android-warning-audit.log`.
- Print a concise summary of targeted Gradle warning sources so the next cleanup branches can start from exact files instead of manual log scanning.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The audit helper identified the current active targeted warnings:
  - `jcenter()` from `node_modules\react-native-camera\android\build.gradle:59`.
  - `execResult` from `node_modules\@sentry\react-native\sentry.gradle:48`.

### BEM-37.33 - React Native Camera warning audit

- Branch: `feature/bem-37-camera-warning-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Audit the active `jcenter()` warning source reported by `android:dev:audit-warnings`.
- Confirm the app's `react-native-camera` usage surface.
- Check whether a small `react-native-camera` version bump can remove the warning without changing QR scanner runtime behavior.

Findings:

- The app uses `react-native-camera` only in `ScanQrCodeScreen` for QR code scanning through `RNCamera`.
- Android still needs `missingDimensionStrategy 'react-native-camera', 'general'` for the current package.
- The installed package resolves to `react-native-camera@3.44.3` from the `^3.33.0` manifest range.
- The latest available `react-native-camera@4.2.1` still contains `jcenter()` in its Android Gradle file, so a package bump does not remove the warning.
- The active warning is dependency-owned at `node_modules\react-native-camera\android\build.gradle:59`.

Decision:

- Do not patch `node_modules` or change QR scanner runtime behavior in this branch.
- Treat camera cleanup as a larger follow-up: replace deprecated `react-native-camera` with a maintained QR/camera stack and test Android/iOS permissions, QR scanning, and navigation callback behavior.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed and confirmed `react-native-camera` as the active `jcenter()` source.
- No runtime code changed in this branch.

### BEM-37.34 - Sentry Gradle warning audit

- Branch: `feature/bem-37-sentry-warning-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Audit the active `execResult` warning source reported by `android:dev:audit-warnings`.
- Check whether the warning can be removed by a safe `@sentry/react-native` upgrade or local configuration change.
- Avoid changing Sentry source-map upload behavior in a small warning-audit branch.

Findings:

- The app currently uses `@sentry/react-native@5.36.0`.
- The active warning is dependency-owned at `node_modules\@sentry\react-native\sentry.gradle:48`.
- The warning is triggered by Sentry's Gradle script calling `bundleTask.getProperties()`, which enumerates Gradle's deprecated `AbstractExecTask.execResult` property.
- Newer checked Sentry lines, including `6.22.0`, `7.13.0`, and `8.12.0`, still use `bundleTask.getProperties()` in the Gradle integration, so a blind SDK upgrade is not a proven targeted fix for this warning.
- `SENTRY_DISABLE_AUTO_UPLOAD` only controls whether upload tasks run; it does not prevent the Gradle script from configuring bundle tasks and touching the deprecated property.

Decision:

- Do not patch `node_modules` or conditionally remove `sentry.gradle` from debug builds in this branch.
- Keep Sentry behavior unchanged and treat the warning as a larger follow-up tied to Sentry Gradle integration/release-source-map behavior.
- Revisit only with a dedicated Sentry branch that validates Android release bundling/source-map upload behavior, not just dev debug startup.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed and confirmed the active `execResult` source.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- No runtime code changed in this branch.

### BEM-37.35 - Android warning baseline

- Branch: `feature/bem-37-warning-baseline`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Capture the current Android warning baseline after the BEM-37 warning cleanup branches.
- Separate warning sources already removed from warning sources that remain as larger follow-ups.
- Provide a concise status snapshot for Jira/status reporting.

Resolved in this stream:

- Android Build Tools `28.0.3` warning removed by upgrading `jail-monkey` to a version that reads the root build tools setting.
- Clipboard `jcenter()` warning source removed by upgrading `@react-native-clipboard/clipboard` to `1.11.2`.
- Biometrics `jcenter()` warning source removed by upgrading `react-native-biometrics` to `3.0.1` and adapting `BiometricService`.
- Browserslist outdated data warning removed by pinning the refreshed `caniuse-lite` dataset.
- Legacy signer `TransactionBuilder` Jest noise scoped to the one legacy test that still covers that path.
- RN node polyfill drift is now guarded by `check:rn-nodeify-shims` and the pre-push gate.

Remaining targeted Android warning sources:

- `jcenter()` from `node_modules\react-native-camera\android\build.gradle:59`.
- `execResult` from `node_modules\@sentry\react-native\sentry.gradle:48`.

Follow-up decisions:

- `react-native-camera` should be replaced in a dedicated QR/camera migration branch, because the latest `react-native-camera@4.2.1` still contains `jcenter()`.
- Sentry Gradle cleanup should be handled in a dedicated Sentry/release-source-map branch, because the warning is caused by Sentry's Gradle integration enumerating `bundleTask.getProperties()`.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed and confirmed the current two targeted warning sources.
- No runtime code changed in this branch.

### BEM-36.4 - Android modernization workflow docs

- Branch: `feature/bem-36-android-workflow-docs`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/android-modernization-workflow.md`.
- Document the local Android modernization workflow for mini-branches.
- Capture the JDK 17 setup, standard checks, Android build commands, warning audit command, Metro reset, emulator smoke, and known limits.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime code changed in this branch.

### BEM-37.36 - Camera replacement plan

- Branch: `feature/bem-camera-replacement-plan`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/camera-replacement-plan.md`.
- Document the migration path away from deprecated `react-native-camera`.
- Preserve the current QR scanner behavior requirements before changing runtime code.
- Compare replacement candidates at planning level without introducing a new native camera dependency in this branch.

Findings:

- The app uses `react-native-camera` only in `src/screens/ScanQrCodeScreen.tsx`.
- Android still has `missingDimensionStrategy 'react-native-camera', 'general'` while the current package remains installed.
- The latest `react-native-camera@4.2.1` still contains `jcenter()`, so bumping the existing package does not remove the active Android Gradle warning.
- VisionCamera is the preferred migration target, but the current latest line has additional native dependencies and needs a proof branch against this React Native 0.68 app.
- Camera Kit remains a possible fallback if VisionCamera compatibility or validation cost is too high.

Decision:

- Do not replace the scanner in this docs-only branch.
- Use a separate `feature/bem-camera-qr-scanner-migration` branch for runtime work.
- Treat the migration as native/runtime work requiring Android emulator smoke and iOS validation before calling it complete.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime code changed in this branch.

### BEM-37.37 - Sentry release source-map plan

- Branch: `feature/bem-sentry-release-plan`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/sentry-release-source-map-plan.md`.
- Document the safe follow-up path for the remaining Sentry Gradle warning.
- Keep Sentry runtime, release bundling, and source-map upload behavior unchanged in this docs-only branch.

Findings:

- The app uses `@sentry/react-native@5.36.0`.
- Android applies `node_modules/@sentry/react-native/sentry.gradle` from `android/app/build.gradle`.
- iOS has Sentry React Native bundling and dSYM upload build phases in the Xcode project.
- Sentry DSNs are currently injected through `react-native-config`.
- The latest npm release checked for `@sentry/react-native` is `8.12.0`, so a real cleanup is a major SDK upgrade and must not be mixed into a warning-only branch.

Decision:

- Do not patch `node_modules` or remove `sentry.gradle` in this branch.
- Use a separate `feature/bem-sentry-release-source-map-upgrade` branch for any Sentry SDK upgrade.
- Treat the upgrade as Android/iOS release tooling work, with source-map/dSYM validation and explicit handling of missing Sentry secrets.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime code changed in this branch.

### BEM-36.5 - Android dev smoke helper

- Branch: `feature/bem-android-smoke-helper`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/androidSmokeDev.mjs`.
- Add `android:dev:smoke` package script.
- Update `docs/android-modernization-workflow.md` to use the smoke helper instead of manual `adb` commands.

Behavior:

- Finds `adb` through `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `%LOCALAPPDATA%\Android\Sdk`, or `PATH`.
- Installs `android/app/build/outputs/apk/dev/debug/app-dev-debug.apk`.
- Runs `adb reverse tcp:8081 tcp:8081`.
- Clears logcat, force-stops the dev package, launches it, waits for startup logs, and scans recent logcat output for fatal Android or React Native runtime errors.
- Writes the command transcript to `local-docs/android-smoke-dev.log`.

Validation:

- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper installed the dev APK, configured Metro port reverse, launched `io.goldwallet.wallet.dev`, and found no fatal Android or React Native runtime errors in startup logcat.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No app runtime code changed in this branch.

### BEM-36.6 - Android smoke PID logcat filter

- Branch: `feature/bem-android-smoke-pid-logcat`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refine `scripts/androidSmokeDev.mjs` to read the launched app process ID after startup.
- Filter the startup logcat scan to that process with `adb logcat --pid`.
- Keep the full command transcript in `local-docs/android-smoke-dev.log` while keeping console output concise.

Why:

- The first smoke helper version scanned recent global logcat lines.
- Global logcat can contain permission controller, keyboard, launcher, and system-service stack traces unrelated to GoldWallet.
- PID-filtered logcat makes the helper stricter for app crashes and less noisy for unrelated emulator output.

Validation:

- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper installed the dev APK, launched `io.goldwallet.wallet.dev`, found the app PID, scanned app-process startup logcat, and found no fatal Android or React Native runtime errors.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No app runtime code changed in this branch.

### BEM-36.7 - Android smoke UI hierarchy check

- Branch: `feature/bem-android-smoke-ui-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend `scripts/androidSmokeDev.mjs` beyond install/launch/logcat.
- Verify the launched app remains the focused foreground package.
- Dump the Android UI hierarchy to `local-docs/android-smoke-dev-ui.xml`.
- Check the default dashboard smoke texts: `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.

Behavior:

- Uses `adb shell dumpsys window` to confirm focus contains `io.goldwallet.wallet.dev`.
- Uses `adb shell uiautomator dump` and `adb exec-out cat` to capture the UI hierarchy.
- Supports `ANDROID_SMOKE_EXPECT_TEXTS` to override or disable the expected text list for other fixtures.

Validation:

- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper found the app PID, scanned app-process logcat, confirmed foreground focus, wrote the UI hierarchy, and found the default dashboard texts.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No app runtime code changed in this branch.

### BEM-36.8 - Android dev verify command

- Branch: `feature/bem-android-dev-verify-command`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:verify` package script.
- Chain the dev debug APK build and emulator smoke check into one command.
- Document when to use `android:dev:verify` versus `android:dev:smoke`.

Why:

- `android:dev:smoke` intentionally installs and launches the current APK artifact.
- During runtime/native/dependency work, a stale APK can make smoke results look better than the current source state.
- `android:dev:verify` forces `android:dev:assemble` first, then runs the focused/logcat/UI smoke helper.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:verify` passed on the connected Android emulator.
- The command built `:app:assembleDevDebug`, installed the fresh dev APK, launched `io.goldwallet.wallet.dev`, verified focused foreground state, scanned app-process logcat, and found the default dashboard texts.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No app runtime code changed in this branch.
