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
