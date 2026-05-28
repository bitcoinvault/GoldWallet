# Wallet Modernization Log

This document tracks staged wallet modernization work branch by branch.

## Integration Branch

- Branch: `upgrade/wallet-modernization`
- Base: `develop`
- Purpose: integration branch for staged wallet modernization work before merging back to the main development line.

## Completed Branches

### BEM-36.107 - Background timer types 2.0.2

- Branch: `feature/bem-36-background-timer-types-2-0-2`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `@types/react-native-background-timer` from the broad `^2.0.0` range, currently resolved as `2.0.0`, to `2.0.2`.
- Refresh `yarn.lock`.
- Keep runtime `react-native-background-timer`, `TimeoutButton` behavior, native project files, env files, Android Gradle files, Metro config, and package scripts unchanged.

Why:

- `react-native-background-timer` is part of the timeout-button runtime surface, so its type package should be explicit and current before larger TypeScript, Jest, React, or React Native baseline changes.
- This is a type-only maintenance step; it does not change the runtime package used by the app.

Validation:

- `corepack yarn add --dev @types/react-native-background-timer@2.0.2` passed and ran postinstall.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- Metro was restarted with Node 16 and `--reset-cache`.
- `adb reverse tcp:8081 tcp:8081` passed on `emulator-5554`.
- `ANDROID_SERIAL=emulator-5554 JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:check-light` passed.

### BEM-36.106 - Snap carousel types 3.8.12

- Branch: `feature/bem-36-snap-carousel-types-3-8-12`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `@types/react-native-snap-carousel` from the broad `^3.8.1` range, currently resolved as `3.8.4`, to `3.8.12`.
- Refresh `yarn.lock`.
- Keep runtime `react-native-snap-carousel`, carousel UI code, ViewPropTypes LogBox handling, native project files, env files, Android Gradle files, Metro config, and package scripts unchanged.

Why:

- `react-native-snap-carousel` remains a legacy UI dependency with a known ViewPropTypes warning; this branch only narrows the TypeScript surface without changing runtime carousel behavior.
- Keeping compatible type packages current reduces noise before larger UI/RN dependency work.

Validation:

- `corepack yarn add --dev @types/react-native-snap-carousel@3.8.12` passed and ran postinstall.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- Metro was restarted with Node 16 and `--reset-cache`.
- `adb reverse tcp:8081 tcp:8081` passed on `emulator-5554`.
- `ANDROID_SERIAL=emulator-5554 JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:check-light` passed.

### BEM-36.105 - Redux stub type cleanup

- Branch: `feature/bem-36-redux-type-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Remove `@types/redux-saga` and `@types/reselect` from `devDependencies`.
- Refresh `yarn.lock` so `redux-saga` and `reselect` are no longer retained through stub type packages.
- Keep runtime `redux-saga`, runtime `reselect`, Redux state code, wallet screens, native project files, env files, Android Gradle files, Metro config, and package scripts unchanged.

Why:

- Yarn reports both type packages as stub definitions because `redux-saga` and `reselect` provide their own types.
- Removing obsolete stub packages shrinks the TypeScript maintenance surface before larger TypeScript, Jest, React, or React Native baseline changes.

Validation:

- `corepack yarn typescript:check` passed after the packages were removed.
- `corepack yarn postinstall` was run after `check:rn-nodeify-shims` detected stale shims from the install-tree update.
- `corepack yarn check:rn-nodeify-shims` passed after `postinstall`.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- Metro was restarted with Node 16 and `--reset-cache`.
- `adb reverse tcp:8081 tcp:8081` passed on `emulator-5554`.
- `ANDROID_SERIAL=emulator-5554 JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:check-light` passed.

### BEM-37.98 - Android warning baseline refresh

- Branch: `feature/bem-37-warning-baseline`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh the Android Gradle warning baseline evidence after the latest type-definition maintenance branches.
- Update `docs/wallet-modernization-baseline.md` to point at the latest local warning-audit summary timestamp.
- Keep runtime code, dependency versions, native project files, env files, package scripts, Metro behavior, release secrets, and ignored `local-docs/` artifacts unchanged.

Why:

- The integration branch should keep its high-level baseline aligned with the newest Gradle warning audit evidence.
- The remaining warning surface should stay constrained to the known dependency-owned sources before dedicated Sentry and camera replacement work.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The refreshed summary reported `Generated at: 2026-05-28T18:17:11.944Z`.
- The refreshed summary reported `Android Gradle audit exit code: 0`.
- The refreshed summary reported `Android Gradle warning baseline guard exit code: 0`.
- The refreshed summary reported `Targeted Android Gradle warnings: 2`.
- The refreshed summary reported `Unexpected targeted Android Gradle warnings: 0`.
- Remaining targeted sources are Sentry `execResult` at `node_modules\@sentry\react-native\sentry.gradle:48` and `react-native-camera` `jcenter()` at `node_modules\react-native-camera\android\build.gradle:59`.
- `corepack yarn android:dev:check-warning-audit-summary` passed.
- `corepack yarn android:dev:check-artifacts` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.

### BEM-36.87 - BIP21 types 2.0.3

- Branch: `feature/bem-36-bip21-types-2-0-3`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `@types/bip21` from the old `^1.1.30` range, currently resolved as `1.1.31`, to `2.0.3`.
- Align the type package major with the current runtime package `bip21@2.0.2`.
- Refresh `yarn.lock`.
- Keep runtime `bip21`, payment URI parsing/generation code, wallet screens, native project files, env files, Android Gradle files, Metro config, and package scripts unchanged.

Why:

- BIP21 sits on the wallet payment URI surface, so its TypeScript definitions should match the runtime major before larger TypeScript, Jest, React, or React Native baseline changes.
- This is a type-only maintenance step; it does not change the runtime package used by the app.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `corepack yarn android:dev:check-light` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- Metro was restarted with Node 16 and `--reset-cache`.
- `adb reverse tcp:8081 tcp:8081` passed on `emulator-5554`.
- `ANDROID_SERIAL=emulator-5554 JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `git diff --check` passed.

### BEM-36.86 - PBKDF2 types 3.1.2

- Branch: `feature/bem-36-pbkdf2-types-3-1-2`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `@types/pbkdf2` from the broad `^3.0.0` range, currently resolved as `3.1.0`, to `3.1.2`.
- Refresh `yarn.lock`.
- Keep runtime `pbkdf2`, wallet crypto code, native project files, env files, Android Gradle files, Metro config, and package scripts unchanged.

Why:

- `pbkdf2` is part of the wallet crypto/runtime dependency surface, so its type package should be current and pinned before larger TypeScript, Jest, React, or React Native baseline changes.
- This is a type-only maintenance step; it does not change the runtime package used by the app.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `corepack yarn android:dev:check-light` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- Metro was reachable on `127.0.0.1:8081`; `adb reverse tcp:8081 tcp:8081` passed on `emulator-5554`.
- `ANDROID_SERIAL=emulator-5554 JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `git diff --check` passed.

### BEM-36.85 - Android audit-smoke command content guard

- Branch: `feature/bem-36-audit-smoke-command-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend the Android dev environment audit required-script and command-snippet guards to cover `android:dev:audit-smoke`.
- Guard `android:dev:audit-smoke` so it must include `android:dev:audit-warnings`, `android:dev:smoke`, and `android:dev:check-artifacts`.
- Add self-check fixtures that reject `android:dev:audit-smoke` when the warning audit, smoke, or artifact checker step is removed.
- Keep runtime app code, native project files, dependency versions, Gradle configuration, Metro behavior, release secrets, package scripts, and validation artifact formats unchanged.

Why:

- Maintenance branches use `android:dev:audit-smoke` to refresh warning evidence and emulator smoke evidence together.
- The environment guard should catch accidental command drift in the combined maintenance validation path before a branch relies on incomplete evidence.

Validation:

- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn android:dev:env-audit` passed with JDK 17.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.
- No runtime, native, dependency, Android/iOS source, package-script behavior, or Metro behavior changed in this branch, so emulator smoke is not required for this guard-only update.

### BEM-36.84 - Android verify command content guard

- Branch: `feature/bem-36-verify-script-content-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend the Android dev environment audit to verify required command snippets inside guarded package scripts.
- Guard `android:dev:verify` so it must include `android:dev:assemble`, `android:dev:smoke`, and `android:dev:check-smoke-summary`.
- Add self-check fixtures that reject `android:dev:verify` when the assemble, smoke, or smoke-summary step is removed.
- Keep runtime app code, native project files, dependency versions, Gradle configuration, Metro behavior, release secrets, and validation artifact formats unchanged.

Why:

- `BEM-36.83` made `android:dev:verify` the high-confidence build plus smoke plus summary-validation command.
- The environment guard should catch accidental command drift, not only the presence of the package script name.

Validation:

- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn android:dev:env-audit` passed with JDK 17.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.
- No runtime, native, dependency, Android/iOS source, or Metro behavior changed in this branch, so emulator smoke is not required for this guard-only update.

### BEM-36.83 - Android verify smoke summary check

- Branch: `feature/bem-36-verify-smoke-summary-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend `android:dev:verify` so the full dev build plus emulator smoke command also validates the generated smoke summary artifact.
- Update README and Android modernization workflow docs to state that `android:dev:verify` now includes `android:dev:check-smoke-summary`.
- Keep runtime app code, native source, dependency versions, Gradle configuration, Metro behavior, release secrets, and validation artifact formats unchanged.

Why:

- App-affecting branches use `android:dev:verify` as the high-confidence Android validation command.
- The command should fail if smoke runs but the local summary artifact does not prove the expected UI, process/logcat capture, Metro reachability, UI hierarchy, and screenshot evidence.

Validation:

- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn android:dev:check-light` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 ANDROID_SERIAL=emulator-5554 corepack yarn android:dev:verify` passed.
- `git diff --check` passed.

### BEM-36.82 - Wallet modernization baseline refresh

- Branch: `feature/bem-36-modernization-baseline-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh `docs/wallet-modernization-baseline.md` after the latest warning-audit, RN baseline preflight, and live RN target snapshot checks.
- Record the current live RN target snapshot evidence: `react-native@0.85.3` latest, `0.86.0-rc.2` next, React peer `^19.2.3`, Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`, and `Mismatches: 0`.
- Update the baseline's latest Android warning-audit timestamp to `2026-05-28T17:18:23.991Z`.
- Keep runtime code, dependencies, native project files, package scripts, Metro behavior, release secrets, and ignored `local-docs/` artifacts unchanged.

Why:

- The high-level modernization baseline should match the evidence produced by the latest May maintenance checkpoints.
- The next RN/native upgrade branch needs a concise current baseline in addition to the detailed branch-by-branch log.

Validation:

- `corepack yarn rn:target-snapshot:current` passed and wrote a matched local summary.
- `corepack yarn rn:target-snapshot:check-summary` passed.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.
- No runtime, native, dependency, Android/iOS source, or Metro code changed in this branch, so emulator smoke is not required for this documentation/evidence checkpoint.

### BEM-37.94 - May warning baseline refresh

- Branch: `feature/bem-37-warning-baseline-refresh-may-close`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh the Android Gradle warning audit evidence after the latest May maintenance branches.
- Keep code, dependency versions, native project files, env files, and runtime behavior unchanged.
- Use the generated local warning-audit artifacts in `local-docs/` as evidence only; they remain ignored and are not committed.

Why:

- The May maintenance baseline should close with current Gradle evidence, not only older audit output.
- The known remaining Android warning sources should stay constrained to Sentry `execResult` and `react-native-camera` `jcenter()` before the larger follow-up branches.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The refreshed summary reported `Android Gradle audit exit code: 0`.
- The refreshed summary reported `Android Gradle warning baseline guard exit code: 0`.
- The refreshed summary reported `Targeted Android Gradle warnings: 2`.
- The refreshed summary reported `Unexpected targeted Android Gradle warnings: 0`.
- Remaining targeted sources are Sentry `execResult` at `node_modules\@sentry\react-native\sentry.gradle:48` and `react-native-camera` `jcenter()` at `node_modules\react-native-camera\android\build.gradle:59`.
- `corepack yarn android:dev:check-warning-audit-summary` passed.
- `corepack yarn android:dev:check-artifacts` passed.

Follow-up:

- Keep Sentry warning cleanup in the dedicated release/source-map validation branch.
- Keep `react-native-camera` cleanup in the dedicated QR/camera migration branch.

### BEM-36.80 - React Redux types 7.1.34

- Branch: `feature/bem-36-react-redux-types-7-1-34`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `@types/react-redux` from the broad `^7.1.7` manifest range to `7.1.34`.
- Refresh `yarn.lock`.
- Keep runtime `react-redux`, Redux state code, wallet screens, native project files, env files, and Android project files unchanged.

Why:

- Keep the TypeScript definitions for the current React Redux `7.x` runtime current while preserving the runtime package.
- React Redux is used across navigation, dashboard, settings, notifications, wallet, and transaction screens, so the branch validates the app's connected component and hook type surface without changing runtime behavior.

Validation:

- `corepack yarn typescript:check` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- Metro was restarted with Node 16 and `react-native start --reset-cache --port 8081`.
- `adb reverse tcp:8081 tcp:8081` passed on `emulator-5554`.
- `corepack yarn android:dev:smoke` passed on `emulator-5554`.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `corepack yarn android:dev:check-artifacts` passed.
- Android emulator smoke passed: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.

Follow-up:

- Runtime `react-redux` remains on the existing `7.2.x` line; any runtime Redux/React Redux upgrade should be a separate branch with navigation and wallet-flow validation.

### BEM-36.79 - Ecurve types 1.0.3

- Branch: `feature/bem-36-ecurve-types-1-0-3`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `@types/ecurve` from the broad `^1.0.0` manifest range to `1.0.3`.
- Refresh `yarn.lock`.
- Keep runtime `ecurve`, wallet code, native project files, env files, and Android project files unchanged.

Why:

- Keep Ecurve TypeScript metadata current inside the same `1.0.x` API family.
- Keep cryptography runtime packages unchanged while refreshing the dev-only type surface.

Validation:

- `corepack yarn typescript:check` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- Metro was restarted with Node 16 and `react-native start --reset-cache --port 8081`.
- `adb reverse tcp:8081 tcp:8081` passed on `emulator-5554`.
- `corepack yarn android:dev:smoke` passed on `emulator-5554`.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `corepack yarn android:dev:check-artifacts` passed.
- Android emulator smoke passed: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.

Follow-up:

- Runtime `ecurve` remains `1.0.6`; any runtime cryptography dependency movement should stay on a separate branch with wallet-flow validation.

### BEM-36.78 - Bigi types 1.4.5

- Branch: `feature/bem-36-bigi-types-1-4-5`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `@types/bigi` from the broad `^1.4.2` manifest range to `1.4.5`.
- Refresh `yarn.lock`.
- Keep runtime `bigi`, wallet code, native project files, env files, and Android project files unchanged.

Why:

- Keep Bigi TypeScript metadata current inside the same `1.4.x` API family.
- Pin the dev-only type package to the validated version so future lockfile refreshes do not drift independently from the branch evidence.

Validation:

- `corepack yarn typescript:check` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes dev type metadata and the lockfile, with no runtime, native, Metro, or application-code changes.

Follow-up:

- Runtime `bigi` remains `1.4.2`; any runtime cryptography dependency movement should stay on a separate branch with wallet-flow validation.

### BEM-36.77 - Lodash types 4.14.202

- Branch: `feature/bem-36-lodash-types-4-14-202`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `@types/lodash` from the broad `^4.14.162` manifest range to `4.14.202`.
- Refresh `yarn.lock`.
- Keep runtime `lodash`, application code, native project files, env files, and Android project files unchanged.

Why:

- Keep the TypeScript metadata for Lodash current within the newest compatible `4.14.x` line for this repo's TypeScript `4.4.2` compiler.
- Reduce future lockfile drift by pinning the dev-only type package to the validated version.
- `@types/lodash@4.17.24` was tested first and rejected because it requires newer TypeScript syntax than the current compiler accepts.

Validation:

- `corepack yarn typescript:check` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes dev type metadata and the lockfile, with no runtime, native, Metro, or application-code changes.

Follow-up:

- Runtime `lodash` remains `4.17.21`; any runtime package update should be handled as a separate, validated branch.

### BEM-36.76 - Calendar types pin

- Branch: `feature/bem-36-calendar-types-cleanup`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `@types/react-native-calendars` from the broad `^1.20.7` manifest range to the currently working `1.1264.2` lockfile version.
- Refresh the transitive `@types/xdate` lockfile entry from `0.8.32` to `0.8.35`.
- Keep `react-native-calendars` runtime package unchanged.
- Keep runtime code, native project files, dependency versions, env files, and Android project files unchanged.

Why:

- Removing `@types/react-native-calendars` failed TypeScript because the current runtime package does not expose declarations in a way this repo can consume.
- Updating `@types/react-native-calendars` to latest `1.1267.0` failed TypeScript because the latest package is a stub and no longer provides the module declaration this repo currently needs.
- Pinning the known working type package prevents future lockfile drift to the broken stub while keeping calendar imports typed.
- `react-native-calendars@1.1314.0` is deferred because its npm metadata requires Node `>=18`, while the current Metro/dev runtime baseline remains Node 16 for RN `0.68.7`.

Validation:

- `corepack yarn typescript:check` passed after restoring/pinning `@types/react-native-calendars@1.1264.2`.
- `corepack yarn check:rn-nodeify-shims` passed after rerunning `corepack yarn postinstall`.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes dev type metadata and documentation, with no runtime package or native project changes.

Follow-up:

- Revisit the runtime calendar package during the RN/Metro Node runtime transition instead of as an isolated Node 16 cleanup.

### BEM-36.75 - Push Notification iOS 1.12.0

- Branch: `feature/bem-36-push-notification-ios-1-12-0`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `@react-native-community/push-notification-ios` from `1.10.0` to `1.12.0`.
- Refresh `yarn.lock`.
- Update the native module inventory guard, push notification bridge audit expectation, native module upgrade plan, and release-services compatibility audit baseline.
- Keep runtime code, native project files, env files, and Android project files unchanged.

Why:

- `1.12.0` is the latest checked package version and declares React Native peer compatibility with `>=0.58.4`, which fits the current RN `0.68.7` baseline.
- The package is iOS-only, so Android validation checks bundle/runtime fallout while iOS notification runtime validation remains a Mac/device task.

Validation:

- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn check:native-module-upgrade-plan` passed.
- `corepack yarn check:push-notification-ios-usage-scope` passed.
- `corepack yarn push-notification:bridge-audit` passed.
- `corepack yarn push-notification:bridge-check-summary` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `corepack yarn android:dev:check-light` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- Metro was restarted with Node 16 and `react-native start --reset-cache --port 8081`.
- `adb reverse tcp:8081 tcp:8081` passed on `emulator-5554`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `corepack yarn android:dev:check-artifacts` passed.
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.
- `git diff --check` passed.

Follow-up:

- Validate APNs registration, token handling, foreground/background delivery, badge reset, and tap-through behavior on a Mac runner/device before claiming full iOS notification QA.

### BEM-36.74 - AsyncStorage 2.2.0

- Branch: `feature/bem-36-async-storage-2-2-0`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `@react-native-async-storage/async-storage` from `1.24.0` to `2.2.0`.
- Refresh `yarn.lock`.
- Update the native module inventory guard, native module upgrade plan, and storage/network compatibility audit baseline.
- Keep AsyncStorage call sites unchanged.

Why:

- `2.2.0` is the latest checked `2.x` AsyncStorage line and declares React Native peer compatibility with `>=0.65 <1.0`, which fits the current RN `0.68.7` baseline.
- Latest npm `3.1.0` is a larger storage/RN-baseline step, so this branch avoids jumping directly to it.

Validation:

- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn check:native-module-upgrade-plan` passed.
- `corepack yarn check:storage-network-usage` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn test:storage-network:focused` passed.
- `corepack yarn typescript:check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- `corepack yarn android:dev:check-light` passed.
- Metro was restarted with Node 16 and `react-native start --reset-cache --port 8081`.
- `adb reverse tcp:8081 tcp:8081` passed on `emulator-5554`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `corepack yarn android:dev:check-artifacts` passed.
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.
- `git diff --check` passed.

Follow-up:

- Full wallet persistence QA still needs manual create/import wallet and restart checks beyond the dashboard smoke.

### BEM-36.73 - Native upgrade plan version coverage

- Branch: `feature/bem-36-native-plan-version-coverage`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend the native module upgrade-plan guard so every package from `scripts/nativeModuleInventoryGuard.mjs` must be listed with its guarded version in `docs/native-module-upgrade-plan.md`.
- Update the native module upgrade plan with missing guarded versions for AsyncStorage, Firebase packages, Sentry, and `react-native-camera`.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The plan already required package coverage, but it could still drift from the guarded dependency versions. Version coverage makes future dependency branches update the plan deliberately.

Validation:

- `corepack yarn check:native-module-upgrade-plan-guard` passed.
- `corepack yarn check:native-module-upgrade-plan` passed.
- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn typescript:check` passed.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- When a native dependency version changes, update the inventory guard and the native module upgrade plan in the same mini-branch.

### BEM-36.72 - RandomBytes plan alignment

- Branch: `feature/bem-36-randombytes-plan-alignment`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Align `docs/native-module-upgrade-plan.md` with the existing `react-native-randombytes@3.6.2` package and inventory baseline from `BEM-36.49`.
- Record that future random-value work should be a dedicated crypto/runtime replacement branch for `react-native-get-random-values`.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The guarded package inventory and storage/network compatibility audit already track `react-native-randombytes@3.6.2`, but the Group C plan still showed the package without its stabilized version.

Validation:

- `corepack yarn check:native-module-upgrade-plan` passed.
- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn check:storage-network-usage` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes documentation.

Follow-up:

- Do not replace the random-value provider without focused wallet/crypto validation and emulator smoke.

### BEM-37.97 - Android smoke summary checker

- Branch: `feature/bem-37-smoke-summary-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:check-smoke-summary` to validate `local-docs/android-smoke-dev-summary.txt` independently from the combined warning/smoke artifact checker.
- Add `check:android-smoke-summary-guard` to self-check the smoke-summary validation rules.
- Reuse the smoke-summary guard in `android:dev:check-artifacts` so combined artifact validation and standalone smoke validation share the same pass criteria.
- Include the smoke-summary checker in `rn:baseline:preflight` after the warning-audit summary checker.
- Add the checker files and package scripts to the Android dev environment audit guard.
- Refresh workflow and baseline documentation with the standalone smoke-summary checker command.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- App-affecting branches require emulator smoke evidence. A standalone smoke-summary checker makes that evidence easy to validate without re-running the warning audit.

Validation:

- `corepack yarn check:android-smoke-summary-guard` passed.
- `corepack yarn android:dev:check-smoke-summary` passed.
- `corepack yarn android:dev:check-artifacts` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not re-run because this branch only changes validation tooling and documentation; it validates the latest existing smoke artifact.

Follow-up:

- Re-run `android:dev:verify` or `android:dev:smoke` before using the smoke-summary checker as evidence for a runtime, native, dependency, or Metro branch.

### BEM-37.96 - Android warning audit summary checker

- Branch: `feature/bem-37-warning-baseline-summary-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:check-warning-audit-summary` to validate `local-docs/android-warning-audit-summary.txt` without requiring smoke artifacts.
- Add `check:android-warning-audit-summary-guard` to self-check the targeted warning source/count validation.
- Include the warning audit summary checker in `rn:baseline:preflight` after the aggregate warning-source summary checker.
- Add the checker files and package scripts to the Android dev environment audit guard.
- Refresh workflow and baseline documentation with the standalone warning-audit summary checker command.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The real Gradle warning audit remains the authoritative warning baseline, but it should be quick to validate its local summary independently from emulator smoke artifacts.

Validation:

- `corepack yarn check:android-warning-audit-summary-guard` passed.
- `corepack yarn android:dev:check-warning-audit-summary` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Re-run `android:dev:audit-warnings` when the warning baseline changes, then validate the refreshed summary with `android:dev:check-warning-audit-summary`.

### BEM-37.95 - Android warning-source summary aggregate

- Branch: `feature/bem-37-warning-source-summaries`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:check-warning-source-summaries` to validate the generated camera QR migration and Sentry Android warning local summaries together.
- Add `check:android-warning-source-summaries-guard` to self-check the aggregate warning-source checker wiring.
- Include the aggregate warning-source summary checker in `rn:baseline:preflight` after the camera and Sentry warning summaries are generated.
- Add the aggregate checker files and package scripts to the Android dev environment audit guard.
- Refresh workflow and baseline documentation with the aggregate warning-source checker command.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The active Android warning debt is split across `react-native-camera` and Sentry. A single aggregate check makes the remaining warning-source artifacts explicit before either larger cleanup branch starts.

Validation:

- `corepack yarn check:android-warning-source-summaries-guard` passed.
- `corepack yarn android:dev:check-warning-source-summaries` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Keep the aggregate warning-source checker aligned with any new targeted Android warning-source summary artifact.

### BEM-37.94 - Aggregate Sentry warning release-services summary

- Branch: `feature/bem-37-release-services-sentry-warning-aggregate`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `local-docs/sentry-android-warning-summary.txt` to `release-services:check-summaries`.
- Extend `check:release-services-summary-guard` so it verifies the aggregate checker imports and validates the Sentry Android warning summary.
- Refresh release-services, workflow, and baseline documentation to state that both Sentry summary artifacts are covered by the aggregate checker.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- Sentry readiness now has two local artifacts: Android warning baseline and release prerequisite summary. The aggregate release-services checker should validate both before larger Sentry or RN baseline branches.

Validation:

- `corepack yarn check:release-services-summary-guard` passed.
- `corepack yarn release-services:check-summaries` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Keep `release-services:check-summaries` aligned with any future release-service summary artifacts.

### BEM-37.93 - Sentry Android warning summary artifact

- Branch: `feature/bem-37-sentry-warning-summary`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `sentry:android-warning:audit` write `local-docs/sentry-android-warning-summary.txt`.
- Add `sentry:android-warning:check-summary` and `check:sentry-android-warning-summary-guard`.
- Add Sentry Android warning summary checker files and package scripts to the Android dev environment audit guard.
- Include the generated Sentry Android warning summary checker in `rn:baseline:preflight` immediately after `sentry:android-warning:audit`.
- Refresh Sentry release/source-map, release-services, workflow, and baseline documentation with the generated local artifact path.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The future Sentry release/source-map cleanup branch should start from a repeatable local artifact that captures the current dependency-owned `execResult` warning source and baseline stability.

Validation:

- `corepack yarn check:sentry-android-warning-summary-guard` passed.
- `corepack yarn sentry:android-warning:audit` passed and wrote `local-docs/sentry-android-warning-summary.txt`.
- `corepack yarn sentry:android-warning:check-summary` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Re-run the Sentry Android warning audit before changing `@sentry/react-native`, then validate source-map/dSYM behavior on the implementation branch.

### BEM-37.92 - Camera QR migration summary artifact

- Branch: `feature/bem-37-camera-qr-migration-summary`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `camera:qr-migration:audit` write `local-docs/camera-qr-migration-summary.txt`.
- Add `camera:qr-migration:check-summary` and `check:camera-qr-migration-summary-guard`.
- Add camera QR summary checker files and package scripts to the Android dev environment audit guard.
- Include the generated camera QR migration summary checker in `rn:baseline:preflight` immediately after `camera:qr-migration:audit`.
- Refresh camera replacement, workflow, and baseline documentation with the generated local artifact path.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The future `react-native-camera` replacement branch should start from a repeatable local artifact that captures scanner dependency baseline, QR renderer baseline, permission/runtime wiring, and migration readiness.

Validation:

- `corepack yarn check:camera-qr-migration-summary-guard` passed.
- `corepack yarn camera:qr-migration:audit` passed and wrote `local-docs/camera-qr-migration-summary.txt`.
- `corepack yarn camera:qr-migration:check-summary` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Re-run the camera QR migration audit before replacing `react-native-camera`, then validate Android QR permission/scanning behavior and iOS camera behavior on the implementation branch.

### BEM-37.91 - Aggregate release-services summary guard

- Branch: `feature/bem-37-release-services-summary-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:release-services-summary-guard` to self-check the aggregate release-services summary checker wiring.
- Include the aggregate guard immediately before `release-services:check-summaries` in `rn:baseline:preflight`.
- Add the aggregate guard file and package script to the Android dev environment audit guard.
- Refresh release-services, workflow, and baseline documentation with the aggregate guard command.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The aggregate checker now gates multiple release-service summary artifacts. A small self-check keeps its imported guard modules, local artifact paths, labels, and pass/fail output from drifting before larger release-service or RN branches.

Validation:

- `corepack yarn check:release-services-summary-guard` passed.
- `corepack yarn release-services:check-summaries` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Keep the aggregate guard and checker together when adding any new release-service summary artifact.

### BEM-37.90 - Aggregate release-services summary checker

- Branch: `feature/bem-37-release-services-summary-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `release-services:check-summaries` to validate the generated Sentry, Firebase, CodePush, and push bridge local summary artifacts together.
- Include the aggregate checker at the end of `rn:baseline:preflight`.
- Add the aggregate checker file and package script to the Android dev environment audit guard.
- Refresh release-services, workflow, and baseline documentation with the aggregate checker command.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- Release-service readiness now produces multiple local artifacts. A single aggregate checker makes it harder to forget one summary before larger RN or release-service dependency branches.

Validation:

- `corepack yarn release-services:check-summaries` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Keep release-service summary artifacts refreshed before Firebase, CodePush, Sentry, or iOS push implementation branches.

### BEM-37.89 - Push notification bridge summary artifact

- Branch: `feature/bem-37-push-bridge-summary`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `push-notification:bridge-audit` write `local-docs/push-notification-bridge-summary.txt`.
- Add `push-notification:bridge-check-summary` and `check:push-notification-bridge-summary-guard`.
- Add the push notification bridge summary checker files and package scripts to the Android dev environment audit guard.
- Include the generated push notification bridge summary checker in `rn:baseline:preflight` immediately after `push-notification:bridge-audit`.
- Refresh release-services, iOS release-config, workflow, and baseline documentation with the generated local artifact path.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- iOS push bridge validation should leave a repeatable local artifact before any notification dependency or release-config branch.

Validation:

- `corepack yarn check:push-notification-bridge-summary-guard` passed.
- `corepack yarn push-notification:bridge-audit` passed and wrote `local-docs/push-notification-bridge-summary.txt`.
- `corepack yarn push-notification:bridge-check-summary` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Device-level APNs registration, token, foreground/background delivery, badge reset, and tap-through behavior remain required on a Mac runner/device before changing iOS notification behavior.

### BEM-37.88 - Firebase release-services summary artifact

- Branch: `feature/bem-37-firebase-release-summary`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `firebase:release-services:audit` write `local-docs/firebase-release-services-summary.txt`.
- Add `firebase:release-services:check-summary` and `check:firebase-release-services-summary-guard`.
- Add the Firebase summary checker files and package scripts to the Android dev environment audit guard.
- Include the generated Firebase summary checker in `rn:baseline:preflight` immediately after `firebase:release-services:audit`.
- Refresh release-services, iOS release-config, workflow, and baseline documentation with the generated local artifact path.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- Firebase release-services validation should leave a repeatable local artifact before any Firebase package family upgrade.

Validation:

- `corepack yarn check:firebase-release-services-summary-guard` passed.
- `corepack yarn firebase:release-services:audit` passed and wrote `local-docs/firebase-release-services-summary.txt`.
- `corepack yarn firebase:release-services:check-summary` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Re-run the Firebase release-services audit before a Firebase family upgrade, then validate Android startup/notifications and iOS plist/pod behavior on implementation branches.

### BEM-37.87 - CodePush release path summary artifact

- Branch: `feature/bem-37-codepush-release-summary`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `codepush:release:path-audit` write `local-docs/codepush-release-path-summary.txt`.
- Add `codepush:release:path-check-summary` and `check:codepush-release-path-summary-guard`.
- Add the CodePush release-path summary checker files and package scripts to the Android dev environment audit guard.
- Include the generated CodePush summary checker in `rn:baseline:preflight` immediately after `codepush:release:path-audit`.
- Refresh release-services, iOS release-config, workflow, and baseline documentation with the generated local artifact path.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- CodePush release-path validation currently reports non-dev deployment-key blockers and beta warnings in command output only.
- The blocker should be captured in a repeatable local artifact without printing or guessing deployment-key values.

Validation:

- `corepack yarn check:codepush-release-path-summary-guard` passed.
- `corepack yarn codepush:release:path-audit` passed and wrote `local-docs/codepush-release-path-summary.txt`.
- `corepack yarn codepush:release:path-check-summary` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Re-run the CodePush release-path audit after non-beta deployment keys are available, then validate a non-dev update path before any CodePush package upgrade.

### BEM-37.86 - Sentry warning audit guards prerequisite summary wiring

- Branch: `feature/bem-37-sentry-warning-summary-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `sentry:android-warning:audit` require the Sentry prerequisite audit, generated-summary checker, and summary guard package scripts.
- Make the Sentry warning audit require the release/source-map docs to mention `sentry:release:prereq-check-summary` and `check:sentry-release-prereq-summary-guard`.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The Sentry Android warning audit is the entry point before a larger Sentry cleanup branch, so it should fail early if the prerequisite-summary validation wiring or docs drift.

Validation:

- `corepack yarn sentry:android-warning:audit` passed.
- `corepack yarn check:sentry-release-prereq-summary-guard` passed.
- `corepack yarn sentry:release:prereq-audit` passed and wrote `local-docs/sentry-release-prereq-summary.txt`.
- `corepack yarn sentry:release:prereq-check-summary` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Keep Sentry warning-source checks and Sentry prerequisite-summary checks together until a dedicated Sentry SDK/release tooling branch runs full release validation.

### BEM-37.85 - Sentry prerequisite summary in RN preflight

- Branch: `feature/bem-37-sentry-prereq-preflight`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `sentry:release:prereq-check-summary` to `rn:baseline:preflight` immediately after `sentry:release:prereq-audit`.
- Update the RN upgrade path audit's expected preflight command.
- Refresh workflow and baseline documentation to mention generated Sentry prerequisite-summary validation.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The Sentry prerequisite audit now writes a local summary artifact, so the RN baseline preflight should prove that artifact is valid before larger RN/package work starts.

Validation:

- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn sentry:release:prereq-audit` passed and wrote `local-docs/sentry-release-prereq-summary.txt`.
- `corepack yarn sentry:release:prereq-check-summary` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes validation tooling and documentation.

Follow-up:

- Keep generated artifact checkers directly after their artifact-producing audit commands when more preflight checks are added.

### BEM-37.84 - Sentry release prerequisite summary artifact

- Branch: `feature/bem-37-sentry-prereq-summary`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `sentry:release:prereq-audit` write `local-docs/sentry-release-prereq-summary.txt`.
- Add `sentry:release:prereq-check-summary` and `check:sentry-release-prereq-summary-guard`.
- Add the Sentry prerequisite summary checker files and package scripts to the Android dev environment audit guard.
- Refresh Sentry release/source-map documentation with the generated local artifact path.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- Sentry release validation is currently blocked locally by missing `sentry.properties` files and `SENTRY_AUTH_TOKEN`.
- The blocker should be captured in a repeatable local artifact without printing or guessing secrets.

Validation:

- `corepack yarn check:sentry-release-prereq-summary-guard` passed.
- `corepack yarn sentry:release:prereq-audit` passed and wrote `local-docs/sentry-release-prereq-summary.txt`.
- `corepack yarn sentry:release:prereq-check-summary` passed.
- `corepack yarn check:android-dev-env-audit-guard` passed.
- `corepack yarn rn:baseline:preflight` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- Emulator smoke was not required because this branch only changes tooling and documentation.

Follow-up:

- Re-run the prerequisite audit after Sentry secrets/properties are available, then validate release source-map upload behavior.

### BEM-37.83 - Android warning audit refresh after RN path guards

- Branch: `feature/bem-37-warning-audit-refresh-rn-guards`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Re-run the Android Gradle warning audit on JDK 17 after adding the RN upgrade path audit guards to the lightweight validation surface.
- Refresh `docs/wallet-modernization-baseline.md` with the latest warning-audit summary timestamp.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- `android:dev:check-light` now includes the RN upgrade path self-check and worktree audit, but the real Gradle warning audit remains the authoritative evidence for the current Android warning baseline.
- The current warning baseline should remain anchored to fresh Gradle output after validation tooling changes.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The refreshed `local-docs/android-warning-audit-summary.txt` was generated on `2026-05-28T14:08:26.667Z`.
- The refreshed audit reported `Android Gradle audit exit code: 0`.
- The refreshed audit reported `Android Gradle warning baseline guard exit code: 0`.
- The refreshed audit reported `Targeted Android Gradle warnings: 2`.
- The refreshed audit reported `Unexpected targeted Android Gradle warnings: 0`.
- Remaining targeted sources are Sentry `execResult` at `node_modules\@sentry\react-native\sentry.gradle:48` and `react-native-camera` `jcenter()` at `node_modules\react-native-camera\android\build.gradle:59`.
- `corepack yarn android:dev:check-artifacts` passed.
- `corepack yarn sentry:android-warning:audit` passed.
- `corepack yarn camera:qr-migration:audit` passed.

Follow-up:

- Keep Sentry Gradle/source-map behavior in a dedicated release tooling branch.
- Keep `react-native-camera` replacement in the dedicated QR scanner migration branch.

### BEM-36.92 - Android dev environment audit covers RN upgrade path files

- Branch: `feature/bem-36-android-env-audit-rn-path-files`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditReactNativeUpgradePath.mjs` and `scripts/checkReactNativeUpgradePathGuard.mjs` to the Android dev environment audit's required helper files.
- Extend `scripts/checkAndroidDevEnvironmentGuard.mjs` with a missing RN upgrade path guard helper fixture.
- Refresh Android workflow, baseline, and this modernization log.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- `BEM-36.91` made the environment audit require the RN upgrade path package scripts; this branch also makes it require the backing helper files.
- This prevents future RN/toolchain validation from passing when `package.json` still references a script whose implementation was removed or moved.

Validation:

- `corepack yarn check:android-dev-env-audit-guard` passed.
- With `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10`, `ANDROID_SDK_ROOT`, and `ANDROID_HOME` set, `corepack yarn android:dev:env-audit` passed.
- The real environment audit still reported Node `22.18.0` as a warning because Metro/dev runtime remains documented for Node `16.20.2`.
- `corepack yarn android:dev:check-light-docs` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Keep required helper-file coverage aligned with required package-script coverage in future validation tooling branches.

### BEM-36.91 - Android dev environment audit covers RN upgrade path scripts

- Branch: `feature/bem-36-android-env-audit-rn-path-scripts`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:rn-upgrade-path-audit-guard` and `rn:upgrade-path:audit` to the Android dev environment audit's required package scripts.
- Extend `scripts/checkAndroidDevEnvironmentGuard.mjs` with a missing `rn:upgrade-path:audit` fixture.
- Refresh Android workflow, baseline, and this modernization log.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The RN upgrade path audit is now part of `android:dev:check-light`, so Android environment readiness should fail if that validation surface disappears from `package.json`.
- This keeps future RN/toolchain branches from losing the upgrade-path guard while still passing environment setup checks.

Validation:

- `corepack yarn check:android-dev-env-audit-guard` passed.
- With `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10`, `ANDROID_SDK_ROOT`, and `ANDROID_HOME` set, `corepack yarn android:dev:env-audit` passed.
- The real environment audit still reported Node `22.18.0` as a warning because Metro/dev runtime remains documented for Node `16.20.2`.
- `corepack yarn android:dev:check-light-docs` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Keep the environment audit's required package-script list aligned whenever new build/smoke validation commands become mandatory.

### BEM-36.90 - React Native upgrade path audit guard

- Branch: `feature/bem-36-rn-upgrade-path-audit-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refactor `scripts/auditReactNativeUpgradePath.mjs` so the RN upgrade path checks can be exercised by fixture tests.
- Add `scripts/checkReactNativeUpgradePathGuard.mjs`.
- Add `check:rn-upgrade-path-audit-guard` package script and include it before the real `rn:upgrade-path:audit` in `android:dev:check-light`.
- Refresh README, Android workflow, baseline, lightweight docs guard, and this modernization log.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The RN upgrade path audit now guards several repository baselines, so fixture coverage should catch incorrect acceptance and rejection cases before the real worktree audit runs.
- This keeps the future RN baseline branch from silently drifting Node, Gradle, target SDK, or documentation assumptions.

Validation:

- `corepack yarn check:rn-upgrade-path-audit-guard` passed.
- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn android:dev:check-light-docs` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed and ran `check:rn-upgrade-path-audit-guard` before `rn:upgrade-path:audit`.

Follow-up:

- Update the fixture expectations in the same branch as any intentional RN baseline, Node runtime, Gradle, or Android target SDK move.

### BEM-36.89 - React Native upgrade path Android baseline guard

- Branch: `feature/bem-36-rn-upgrade-path-android-baseline`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend `scripts/auditReactNativeUpgradePath.mjs` to check `.nvmrc`, Android build tools, compile SDK, target SDK, Android Gradle Plugin, and Gradle wrapper baselines.
- Refresh `docs/react-native-upgrade-path.md` with the Android template/toolchain baseline used before the next RN step.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The RN upgrade path should be tied to real repository values, not only documentation snippets.
- `compileSdkVersion 34` with `targetSdkVersion 33` is intentional for the current RN `0.68.7` branch; target SDK 34 remains a later RN/toolchain step.

Validation:

- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn android:dev:check-light-docs` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed and ran the expanded RN upgrade path audit.

Follow-up:

- Re-check and intentionally update this audit when a dedicated RN baseline branch changes Node, Gradle, Android target SDK, or React Native versions.

### BEM-36.88 - React Native upgrade path audit

- Branch: `feature/bem-36-rn-upgrade-path-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/react-native-upgrade-path.md`.
- Add `scripts/auditReactNativeUpgradePath.mjs`.
- Add `rn:upgrade-path:audit` package script and include it in `android:dev:check-light`.
- Refresh README, Android workflow, baseline, native module plan, lightweight docs guard, and this modernization log.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The modernization target is to move from RN `0.68.7` toward a current supported RN line, but only through staged baseline steps.
- The repo should guard against accidentally presenting the next RN branch as a blind jump to latest or mixing it with camera, Sentry, Firebase, Electrum, explorer, or rebranding work.

Validation:

- `corepack yarn rn:upgrade-path:audit` passed.
- `corepack yarn android:dev:check-light-docs` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed and ran `rn:upgrade-path:audit`.

Follow-up:

- Re-check the current latest stable React Native release when the dedicated RN baseline branch starts.

### BEM-36.87 - Metro dev runtime audit guard

- Branch: `feature/bem-36-metro-runtime-audit-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refactor `scripts/auditMetroDevRuntime.mjs` so the Metro baseline rules can be exercised by fixture tests.
- Add `scripts/checkMetroDevRuntimeGuard.mjs`.
- Add `check:metro-dev-runtime-audit-guard` package script and include it in `android:dev:check-light`.
- Refresh README, Android workflow, baseline, lightweight docs guard, and this modernization log.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The real Metro audit warns when the active shell is on Node 22, which is useful before emulator smoke work but not enough as a stable lightweight gate.
- Adding the self-check keeps the Metro baseline guard covered without requiring every branch to start from a Node 16 terminal.

Validation:

- `corepack yarn check:metro-dev-runtime-audit-guard` passed.
- `corepack yarn metro:dev-runtime:audit` passed.
- The real audit reported Node `22.18.0` as a warning because Metro/dev runtime remains documented for Node `16.20.2`.
- `corepack yarn android:dev:check-light-docs` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed and ran `check:metro-dev-runtime-audit-guard`.

Follow-up:

- Use Node 16 for actual Metro sessions and emulator smoke even when command-line tooling checks run under a newer Node.

### BEM-36.86 - Metro dev runtime audit

- Branch: `feature/bem-36-metro-runtime-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditMetroDevRuntime.mjs`.
- Add `metro:dev-runtime:audit` package script.
- Document the audit in README, Android workflow, baseline, and this modernization log.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The current React Native/Metro dev runtime is documented for Node 16, while the active shell can drift to Node 22.
- Before Android emulator smoke work, the Metro runtime baseline should be auditable without starting Metro.

Validation:

- `corepack yarn metro:dev-runtime:audit` passed.
- The audit reported Node `22.18.0` as a warning because Metro/dev runtime remains documented for Node `16.20.2`.
- The audit confirmed `.nvmrc` `16.20.2`, `react-native@0.68.7`, `metro-react-native-babel-preset@0.67.0`, and `start` script `react-native start`.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Use Node 16 for actual Metro sessions and emulator smoke even when command-line tooling checks run under a newer Node.

### BEM-36.85 - Android dev environment audit guard

- Branch: `feature/bem-36-android-env-audit-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refactor `scripts/auditAndroidDevEnvironment.mjs` so the environment readiness rules are testable.
- Add `scripts/checkAndroidDevEnvironmentGuard.mjs`.
- Add `check:android-dev-env-audit-guard` package script and include it in `android:dev:check-light`.
- Refresh README, Android workflow, baseline, lightweight docs guard, and this modernization log.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The environment audit should fail fast when Java/SDK/ADB prerequisites drift, but its validation rules also need a terminal-independent self-check.
- Adding the self-check keeps `android:dev:check-light` useful even when the full environment audit is not appropriate for every branch.

Validation:

- `corepack yarn check:android-dev-env-audit-guard` passed.
- With `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10`, `ANDROID_SDK_ROOT`, and `ANDROID_HOME` set, `corepack yarn android:dev:env-audit` passed.
- The real environment audit still reported Node `22.18.0` as a warning because Metro/dev runtime remains documented for Node `16.20.2`.
- `corepack yarn android:dev:check-light-docs` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed and ran `check:android-dev-env-audit-guard`.

Follow-up:

- Keep running the real `android:dev:env-audit` before Android build/smoke work; the new guard only validates the audit rules.

### BEM-36.84 - Android env audit README guard

- Branch: `feature/bem-36-android-env-audit-readme-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Document `android:dev:env-audit` in `README.md`.
- Extend `scripts/checkAndroidLightDocs.mjs` so README, workflow, and baseline docs must mention the environment audit.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- `BEM-36.83` added an executable Android environment audit, but README is the first place developers check before build/smoke work.
- The lightweight docs guard should catch future documentation drift around the new preflight command.

Validation:

- `corepack yarn android:dev:check-light-docs` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Keep using `android:dev:env-audit` before Android build/smoke work when the active terminal or machine changes.

### BEM-36.83 - Android dev environment audit

- Branch: `feature/bem-36-android-dev-env-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditAndroidDevEnvironment.mjs`.
- Add `android:dev:env-audit` package script.
- Document the environment audit in the Android workflow, baseline, and this modernization log.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- Android modernization work depends on the correct JDK range, Android SDK/ADB availability, Gradle wrappers, and local validation scripts.
- The workflow already documents these requirements; this branch makes the local preflight check executable.

Validation:

- `corepack yarn android:dev:env-audit` correctly failed in the default shell because `JAVA_HOME` was unset and `java` resolved to JDK 21.
- With `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10`, `ANDROID_SDK_ROOT`, and `ANDROID_HOME` set, `corepack yarn android:dev:env-audit` passed.
- The audit reported Node `22.18.0` as a warning because Metro/dev runtime remains documented for Node `16.20.2`.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Use `corepack yarn android:dev:env-audit` before Android build/smoke work when switching terminals, JDKs, Node versions, or machines.

### BEM-37.82 - Android warning baseline refresh after source audits

- Branch: `feature/bem-37-warning-baseline-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh `docs/wallet-modernization-baseline.md` after the current camera and Sentry warning-source audits.
- Refresh `docs/android-modernization-workflow.md` with the dedicated warning-source audit commands.
- Keep Android warning guards, runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- The warning baseline still has exactly two targeted Android Gradle warning sources, but both now have dedicated source audits.
- The baseline should point to the current `local-docs/android-warning-audit-summary.txt` evidence and the specific follow-up audits for camera and Sentry.

Validation:

- `corepack yarn sentry:android-warning:audit` passed.
- `corepack yarn camera:qr-migration:audit` passed.
- `corepack yarn android:dev:check-light` passed.
- `corepack yarn android:dev:check-artifacts` passed against the current warning-audit summary.
- `git diff --check` passed.

Follow-up:

- Continue treating `react-native-camera` and Sentry warning cleanup as dedicated larger branches, not small warning-only patches.

### BEM-37.81 - Sentry Android warning audit

- Branch: `feature/bem-sentry-android-warning-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditSentryAndroidWarning.mjs`.
- Add `sentry:android-warning:audit` package script.
- Document the audit in the Sentry release/source-map plan, release-services audit, and this modernization log.
- Keep Sentry SDK version, Android Gradle integration, iOS Sentry phases, runtime code, native project files, dependency versions, and lockfile content unchanged.

Why:

- The remaining Sentry Android `execResult` warning is dependency-owned in `node_modules/@sentry/react-native/sentry.gradle`.
- Removing it safely is release-tooling work, not a small warning-only cleanup, because Sentry source-map and dSYM upload behavior must remain intact.

Validation:

- `corepack yarn sentry:android-warning:audit` passed.
- The audit confirmed `@sentry/react-native@5.36.0`, Android Sentry Gradle integration, and dependency-owned `bundleTask.getProperties()` warning source at `sentry.gradle:48`.
- The audit reported that removing the warning safely requires a dedicated release/source-map validation branch.
- `corepack yarn sentry:release:prereq-audit` passed and reported local release validation is not ready because `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are not available.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Use this audit before the dedicated Sentry release/source-map cleanup or SDK upgrade branch.

### BEM-37.80 - iOS push readiness documentation refresh

- Branch: `feature/bem-ios-push-readiness-docs`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh release-service, iOS release-config, and native-module documentation after `BEM-37.79`.
- Record that static iOS push bridge readiness is now clean.
- Keep runtime code, native project files, dependency versions, env files, and lockfile content unchanged.

Why:

- `BEM-37.79` fixed the static iOS push bridge readiness gaps, but broader planning docs still described the older pre-fix state.
- The docs should distinguish static readiness from full APNs/token/notification behavior validation on iOS hardware or simulator.

Validation:

- `corepack yarn push-notification:bridge-audit` passed and reported no static readiness issues.
- `corepack yarn android:dev:check-light` passed.
- `git diff --check` passed.

Follow-up:

- Run iOS simulator/device validation before claiming iOS push notification behavior complete.

### BEM-37.79 - iOS push notification bridge readiness

- Branch: `feature/bem-ios-push-notification-bridge-readiness`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Set `UNUserNotificationCenter` delegate in `ios/GoldWallet/AppDelegate.m`.
- Add `UIBackgroundModes` `remote-notification` to `ios/GoldWallet/Info.plist`.
- Keep push notification dependency versions, JavaScript notification service code, Android files, env files, and lockfile content unchanged.

Why:

- `BEM-37.77` added a static iOS push bridge audit and found two readiness gaps in the main iOS target.
- Foreground notification presentation callbacks require the notification center delegate to be assigned.
- Remote notification background handling should be declared by the app target before iOS push behavior is considered ready for device validation.

Validation:

- `corepack yarn push-notification:bridge-audit` passed and reported no static readiness issues.
- `corepack yarn check:push-notification-ios-usage-guard` passed.
- `corepack yarn check:push-notification-ios-usage-scope` passed and confirmed the guarded iOS push notification integration surface is now 1 runtime file and 5 native integration files.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.
- iOS runtime behavior was not validated on this Windows machine.

Follow-up:

- Full APNs registration, token, foreground/background notification, badge, and tap-through behavior still requires iOS simulator/device validation on a Mac runner.

### BEM-37.78 - Camera QR migration audit

- Branch: `feature/bem-camera-qr-migration-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditCameraQrMigration.mjs`.
- Add `camera:qr-migration:audit` package script.
- Document the audit in the camera replacement plan, native module upgrade plan, and this modernization log.
- Keep scanner runtime, camera dependency versions, native project files, lockfile content, and Android/iOS behavior unchanged.

Why:

- `react-native-camera` remains the active deprecated scanner dependency and still owns one targeted Android `jcenter()` warning.
- Before replacing the QR scanner implementation, the current permission, runtime, autolink, warning-baseline, and documentation state should be auditable from one command.

Validation:

- `corepack yarn camera:qr-migration:audit` passed.
- The audit confirmed Android/iOS camera permissions, current scanner runtime, guarded legacy QR image autolinking, warning-baseline context, and migration documentation are present.
- The audit reported `react-native-camera` remains installed and deprecated; this branch is a readiness check, not the scanner replacement.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Use this audit before the dedicated `feature/bem-camera-qr-scanner-migration` runtime branch.

### BEM-37.77 - iOS push notification bridge audit

- Branch: `feature/bem-ios-push-notification-bridge-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditPushNotificationBridge.mjs`.
- Add `push-notification:bridge-audit` package script.
- Document the audit in release-services, iOS release config, native module upgrade plan, and this modernization log.
- Keep push notification dependency version, runtime behavior, native project files, env files, and lockfile content unchanged.

Why:

- Android debug smoke cannot validate iOS badge handling, remote-notification forwarding, or iOS notification presentation.
- Before any real iOS push notification bridge change, the current runtime/native/plist wiring should be auditable from one command.

Validation:

- `corepack yarn push-notification:bridge-audit` passed.
- The audit confirmed package manifest, runtime badge handling, AppDelegate forwarding methods, and foreground presentation hooks are wired.
- The audit reported static readiness issues before claiming full iOS push validation: `AppDelegate.m` does not set `UNUserNotificationCenter` delegate in the audited source, and `ios/GoldWallet/Info.plist` does not declare `UIBackgroundModes` `remote-notification`.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Use this audit before iOS device/simulator notification validation or any iOS push notification bridge behavior change.

### BEM-37.76 - Firebase release-services audit

- Branch: `feature/bem-firebase-release-services-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditFirebaseReleaseServices.mjs`.
- Add `firebase:release-services:audit` package script.
- Document the audit in release-services, iOS release config, native module upgrade plan, and this modernization log.
- Keep Firebase dependency versions, runtime behavior, native project files, env files, Google service files, and lockfile content unchanged.

Why:

- Firebase must be upgraded as an aligned package family, not as isolated package bumps.
- Before any Firebase family upgrade, the current Android/iOS config files and Messaging runtime paths should be auditable from one command.

Validation:

- `corepack yarn firebase:release-services:audit` passed.
- The audit confirmed Firebase package family alignment, Android Gradle/config files, iOS plist files, and Messaging runtime paths are wired.
- The audit reported React Native Firebase remains on `12.7`; the next `23+`/`24.x` move remains a major family upgrade.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Use this audit before a Firebase app/analytics/crashlytics/messaging family upgrade or release-config change.

### BEM-37.75 - CodePush release path audit

- Branch: `feature/bem-codepush-release-path-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditCodePushReleasePath.mjs`.
- Add `codepush:release:path-audit` package script.
- Document the audit in release-services, iOS release config, native module upgrade plan, and this modernization log.
- Keep CodePush dependency version, runtime behavior, native project files, env files, and lockfile content unchanged.

Why:

- CodePush is disabled under `__DEV__`, so Android debug smoke does not prove non-dev update-path behavior.
- Before any CodePush upgrade or release-path change, the current runtime/native/env wiring should be auditable without printing deployment-key values.

Validation:

- `corepack yarn codepush:release:path-audit` passed.
- The audit confirmed CodePush non-dev runtime, Android bundle resolution, iOS deployment-key placeholders, and env key references are wired.
- The audit reported release update validation is not ready because `.env.dev.testnet` has blank `CODEPUSH_DEPLOYMENT_KEY_ANDROID` and `CODEPUSH_DEPLOYMENT_KEY_IOS`.
- The audit also reported beta env files do not define CodePush deployment keys; beta release update strategy remains unconfirmed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Use this audit before validating a non-dev Android/iOS build path or changing CodePush release/update behavior.

### BEM-37.74 - Sentry release prerequisite audit

- Branch: `feature/bem-sentry-release-prereq-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/auditSentryReleasePrerequisites.mjs`.
- Add `sentry:release:prereq-audit` package script.
- Document the audit command in README, Sentry release/source-map plan, release-services audit, and this modernization log.
- Keep Sentry SDK version, Sentry Gradle integration, Xcode Sentry phases, runtime code, native project files, dependency versions, and lockfile content unchanged.

Why:

- The future Sentry release/source-map branch must not claim release validation without local Sentry prerequisites.
- `sentry.properties` files are ignored and local, so missing files should be reported explicitly instead of guessed or silently ignored.

Validation:

- `corepack yarn sentry:release:prereq-audit` passed and reported local Sentry release validation is not ready.
- Missing local files: `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties`.
- `create-sentry-properties.sh` is present and requires `SENTRY_AUTH_TOKEN`.
- `SENTRY_AUTH_TOKEN` is not available in the current shell.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:check-light` passed.

Follow-up:

- Generate local `sentry.properties` with `SENTRY_AUTH_TOKEN` before validating Android release source-map upload or iOS dSYM/source-map upload.

### BEM-37.73 - Android warning audit refresh after guard updates

- Branch: `feature/bem-warning-audit-refresh-after-guards`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Re-run the Android Gradle warning audit on JDK 17 after adding the Sentry release integration guard and legacy Android autolink guard.
- Refresh the modernization baseline note for the latest warning-audit evidence.
- Keep code, dependency versions, native project files, and runtime behavior unchanged.

Why:

- `android:dev:check-light` now covers additional guard groups, but the real Gradle warning audit remains the authoritative evidence for the current Android warning baseline.
- The next camera/Sentry cleanup work should start from current Gradle output after the latest guard changes.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The refreshed audit reported `Targeted Android Gradle warnings: 2`.
- Remaining targeted sources are Sentry `execResult` at `node_modules\@sentry\react-native\sentry.gradle:48` and `react-native-camera` `jcenter()` at `node_modules\react-native-camera\android\build.gradle:59`.
- The audit reported `Android Gradle warning baseline guard exit code: 0`, so no unexpected targeted warning source was introduced.

Follow-up:

- Keep Sentry Gradle/source-map behavior in a dedicated release tooling branch.
- Keep `react-native-camera` replacement in the dedicated QR scanner migration branch.

### BEM-36.72 - Legacy Android autolink guard

- Branch: `feature/bem-legacy-android-autolink-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a guard for the legacy Android autolinking disables in `react-native.config.js`.
- Keep Android autolinking disabled only for `@remobile/react-native-qrcode-local-image` and `react-native-prompt-android`.
- Add a self-check fixture for the guard and include both checks in `android:dev:check-light`.
- Refresh README, Android modernization workflow, native module upgrade plan, and modernization baseline documentation.
- Keep runtime source, native project files, dependency versions, and lockfile content unchanged.

Why:

- These legacy packages are intentionally kept out of Android autolinking because they depend on obsolete Android/Gradle support paths.
- The future QR/camera migration should remove or replace them deliberately, not accidentally re-enable them during unrelated native cleanup.

Validation:

- `corepack yarn check:legacy-android-autolink-guard` passed.
- `corepack yarn check:legacy-android-autolink` passed and confirmed only the guarded QR/prompt packages disable Android autolinking.
- `corepack yarn android:dev:check-light` passed and ran the new legacy Android autolink checks with the existing guard suite, TypeScript, and diff whitespace checks.
- Emulator smoke was not required because this branch adds validation tooling and documentation only; it does not change runtime source, native project files, dependency versions, or lockfile content.

Follow-up:

- Remove or replace the guarded legacy packages in the dedicated QR/camera migration branch after QR scan/import behavior is validated.

### BEM-37.72 - Sentry release integration guard

- Branch: `feature/bem-sentry-release-integration-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a Sentry release integration guard that verifies Android still applies `@sentry/react-native/sentry.gradle`.
- Verify that iOS project settings still include Sentry React Native source-map bundling and dSYM upload phases.
- Add a self-check fixture for the guard and include both checks in `android:dev:check-light`.
- Refresh the Sentry release/source-map plan, Android workflow, README, and modernization baseline.
- Keep Sentry SDK version, DSN wiring, source-map upload commands, and native project behavior unchanged.

Why:

- Sentry remains a dedicated release/source-map follow-up because the active Gradle warning is in Sentry's Gradle integration.
- Before any SDK or release tooling upgrade, the current Android/iOS release integration points should be mechanically guarded.

Validation:

- `corepack yarn check:sentry-release-integration-guard` passed.
- `corepack yarn check:sentry-release-integration` passed and confirmed Android Gradle plus iOS source-map/dSYM Sentry integration points.
- `corepack yarn android:dev:check-light` passed and ran the new Sentry release integration checks with the existing guard suite, TypeScript, and diff whitespace checks.
- Emulator smoke was not required because this branch adds validation tooling and documentation only; it does not change runtime source, native project integration, dependency versions, or lockfile content.

Follow-up:

- Use this guard as a precondition for the future Sentry SDK/source-map upgrade branch and validate non-dev Android release behavior plus iOS symbol/source-map upload on a Mac runner/device.

### BEM-36.71 - iOS Push Notification manifest pin

- Branch: `feature/bem-push-notification-ios-1-10-0-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `@react-native-community/push-notification-ios` manifest from `^1.8.0` to the already-resolved lockfile version `1.10.0`.
- Refresh the lockfile selector for the exact dependency.
- Update the native module inventory guard, native module upgrade plan, and release services compatibility audit.
- Keep source usage, Android/iOS native project files, notification permissions, Firebase messaging behavior, and runtime behavior unchanged.

Why:

- The repo was already installing `@react-native-community/push-notification-ios@1.10.0`, but the manifest allowed dependency drift in the iOS notification bridge used by `Navigator.tsx` and `AppDelegate.m`.
- This branch freezes the current working version and keeps real iOS notification behavior validation for a dedicated iOS push/release-service branch.

Validation:

- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn android:dev:check-light` passed.
- `corepack yarn android:dev:assemble` passed with JDK 17 (`D:\tmp\jdks\temurin17\jdk-17.0.19+10`).
- Metro was restarted with `--reset-cache`; Android emulator smoke passed via `corepack yarn android:dev:smoke`.
- Targeted logcat check found no fatal runtime errors, React Native JS exceptions, or push-notification bridge errors; Electrum testnet connection completed successfully.
- Limitation: Android debug smoke does not validate real iOS push permission, token, badge, or AppDelegate notification forwarding behavior.

Follow-up:

- Validate iOS badge handling, remote-notification forwarding, permission/token behavior, and AppDelegate integration before any real iOS push notification bridge upgrade.

### BEM-36.70 - CodePush manifest pin

- Branch: `feature/bem-code-push-7-0-2-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `react-native-code-push` manifest from `^7.0.2` to the already-resolved lockfile version `7.0.2`.
- Refresh the lockfile selector for the exact dependency.
- Update the native module inventory guard, native module upgrade plan, and release services compatibility audit.
- Keep source usage, Android/iOS native project files, release-service env files, deployment keys, and runtime behavior unchanged.

Why:

- The repo was already installing `react-native-code-push@7.0.2`, but the manifest allowed dependency drift in a release-service dependency used by non-dev bundle loading.
- This branch freezes the current working version and keeps real CodePush release/update behavior validation for a dedicated non-dev release-path branch.

Validation:

- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn android:dev:check-light` passed, including CodePush usage scope guards, release-service env key guards, TypeScript, native module guards, RN nodeify shims, and whitespace checks.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed with `BUILD SUCCESSFUL`.
- Metro was restarted with `--reset-cache` before emulator validation.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed on emulator `emulator-5554`; UI contained `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- Targeted logcat check found no fatal Android/React Native/CodePush runtime errors; Electrum connected to `electrumx.testnet.btcv.stage.rnd.land`.
- Limitation: debug smoke does not validate non-dev CodePush release/update behavior because CodePush is disabled under `__DEV__`.

Follow-up:

- Validate a non-dev CodePush release/update path before any real CodePush upgrade, because debug smoke runs with CodePush disabled under `__DEV__`.

### BEM-36.69 - Version Number manifest pin

- Branch: `feature/bem-version-number-0-3-6-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `react-native-version-number` manifest from `^0.3.6` to the already-resolved lockfile version `0.3.6`.
- Refresh the lockfile selector for the exact dependency.
- Add `react-native-version-number` to the native module inventory guard and native module upgrade plan.
- Keep source usage, Android/iOS native project files, and runtime behavior unchanged.

Why:

- The repo was already installing `react-native-version-number@0.3.6`, but the manifest allowed dependency drift in a native app metadata dependency.
- This branch freezes the current working version and keeps app metadata/version-display behavior changes for a dedicated validation branch.

Validation:

- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn android:dev:check-light` passed, including TypeScript, native module guards, RN nodeify shims, and whitespace checks.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed with `BUILD SUCCESSFUL`.
- Metro was restarted with `--reset-cache` before emulator validation.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed on emulator `emulator-5554`; UI contained `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- Targeted logcat check found no fatal Android/React Native/VersionNumber runtime errors; Electrum connected to `electrumx.testnet.btcv.stage.rnd.land`.

Follow-up:

- Manually verify displayed app/build version metadata during release-candidate validation if the UI exposes it.

### BEM-36.68 - Exit App manifest pin

- Branch: `feature/bem-exit-app-1-1-0-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `react-native-exit-app` manifest from `^1.1.0` to the already-resolved lockfile version `1.1.0`.
- Refresh the lockfile selector for the exact dependency.
- Add `react-native-exit-app` to the native module inventory guard and native module upgrade plan.
- Keep source usage, Android/iOS native project files, and runtime behavior unchanged.

Why:

- The repo was already installing `react-native-exit-app@1.1.0`, but the manifest allowed dependency drift in a native runtime dependency used by factory reset and terms rejection paths.
- This branch freezes the current working version and keeps behavior changes for a dedicated runtime validation branch.

Validation:

- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn android:dev:check-light` passed, including TypeScript, native module guards, RN nodeify shims, and whitespace checks.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed with `BUILD SUCCESSFUL`.
- Metro was restarted with `--reset-cache` before emulator validation.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed on emulator `emulator-5554`; UI contained `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- Targeted logcat check found no fatal Android/React Native/ExitApp runtime errors; Electrum connected to `electrumx.testnet.btcv.stage.rnd.land`.

Follow-up:

- Manually exercise factory reset exit behavior and terms rejection exit behavior during release-candidate validation.

### BEM-36.67 - Background Timer manifest pin

- Branch: `feature/bem-background-timer-2-4-1-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `react-native-background-timer` manifest from `^2.4.1` to the already-resolved lockfile version `2.4.1`.
- Refresh the lockfile selector for the exact dependency.
- Add `react-native-background-timer` to the native module inventory guard and native module upgrade plan.
- Keep source usage, Android/iOS native project files, and runtime behavior unchanged.

Why:

- The repo was already installing `react-native-background-timer@2.4.1`, but the manifest allowed dependency drift in a runtime/native dependency used by `src/components/TimeoutButton.tsx`.
- This branch freezes the current working version and keeps any behavior or replacement work for a dedicated runtime validation branch.

Validation:

- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn android:dev:check-light` passed, including TypeScript, native module guards, RN nodeify shims, and whitespace checks.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed with `BUILD SUCCESSFUL`.
- Metro was restarted with `--reset-cache` before emulator validation.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed on emulator `emulator-5554`; UI contained `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- Targeted logcat check found no fatal Android/React Native/BackgroundTimer runtime errors; Electrum connected to `electrumx.testnet.btcv.stage.rnd.land`.

Follow-up:

- Manually exercise timeout-button behavior during release-candidate validation.

### BEM-36.66 - Masked View manifest pin

- Branch: `feature/bem-masked-view-0-1-11-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `@react-native-community/masked-view` manifest from `^0.1.10` to the already-resolved lockfile version `0.1.11`.
- Refresh the lockfile selector for the exact dependency.
- Add `@react-native-community/masked-view` to the native module inventory guard.
- Update the native module upgrade plan and navigation compatibility audit.
- Keep source usage, Android/iOS native project files, and runtime behavior unchanged.

Why:

- The repo was already installing `@react-native-community/masked-view@0.1.11`, but the manifest allowed dependency drift in the navigation/layout native surface.
- The community package line is deprecated in favor of `@react-native-masked-view/masked-view`; this branch deliberately avoids that package migration and only freezes the current working version.

Validation:

- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn android:dev:check-light` passed, including TypeScript, native module guards, RN nodeify shims, and whitespace checks.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed with `BUILD SUCCESSFUL`.
- Metro was restarted with `--reset-cache` before emulator validation.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed on emulator `emulator-5554`; UI contained `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- Targeted logcat check found no fatal Android/React Native/Masked View runtime errors; Electrum connected to `electrumx.testnet.btcv.stage.rnd.land`.

Follow-up:

- Treat migration to `@react-native-masked-view/masked-view` as a dedicated navigation validation branch with stack/header transition checks.

### BEM-36.65 - React Native Gesture Handler manifest pin

- Branch: `feature/bem-gesture-handler-1-10-3-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `react-native-gesture-handler` manifest from `^1.6.1` to the already-resolved lockfile version `1.10.3`.
- Refresh the lockfile selector for the exact dependency.
- Update the native module inventory guard, native module upgrade plan, and navigation compatibility audit.
- Keep source usage, Android/iOS native project files, and runtime behavior unchanged.

Why:

- The repo was already installing `react-native-gesture-handler@1.10.3`, but the manifest allowed dependency drift from the navigation native layer.
- Gesture Handler affects navigation/touch behavior, so this branch only pins the current installed version and keeps any real package upgrade for a dedicated navigation validation branch.

Validation:

- `corepack yarn check:native-module-inventory` passed.
- `corepack yarn android:dev:check-light` passed, including TypeScript, native module guards, RN nodeify shims, and whitespace checks.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed with `BUILD SUCCESSFUL`.
- Metro was restarted with `--reset-cache` before emulator validation.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed on emulator `emulator-5554`; UI contained `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- Targeted logcat check found no fatal Android/React Native/Gesture Handler runtime errors; Electrum connected to `electrumx.testnet.btcv.stage.rnd.land`.

Follow-up:

- Manually exercise wallet list scrolling, bottom tabs, Send/Receive navigation, and modal/stack transitions during release-candidate validation.

### BEM-36.64 - React Native WebView manifest pin

- Branch: `feature/bem-webview-11-26-1-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `react-native-webview` manifest from `^11.26.1` to the already-resolved lockfile version `11.26.1`.
- Refresh the lockfile selector for the exact dependency.
- Update the native module inventory guard, native module upgrade plan, and storage/network compatibility audit.
- Keep source usage, Android/iOS native project files, and runtime behavior unchanged.

Why:

- The repo was already installing `react-native-webview@11.26.1`, but the manifest allowed dependency drift.
- WebView powers Terms screens, so the branch stays limited to deterministic pinning; a future WebView 13.x upgrade needs dedicated Terms/WebView QA.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn check:storage-network-usage`
- `corepack yarn test:storage-network:focused`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.
- Additional logcat observation after smoke showed BlueElectrum connecting to `electrumx.testnet.btcv.stage.rnd.land:443` and reporting `connected to server` / `connected to, ElectrumX 2.0.a,2.0`; no targeted WebView, Electrum, Android runtime, or React Native runtime errors were found.

Follow-up:

- Manually open Terms and Conditions screens during release-candidate validation. This branch only pins the existing installed WebView version and validates Android startup/runtime smoke.

### BEM-36.63 - React Native Secure Key Store manifest pin

- Branch: `feature/bem-secure-key-store-2-0-10-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `react-native-secure-key-store` manifest from `^2.0.10` to the already-resolved lockfile version `2.0.10`.
- Refresh the lockfile selector for the exact dependency.
- Update the native module inventory guard, native module upgrade plan, and storage/network compatibility audit.
- Keep source usage, Android/iOS native project files, and runtime behavior unchanged.

Why:

- The repo was already installing `react-native-secure-key-store@2.0.10`, but the manifest allowed dependency drift.
- This package protects secure storage behavior, so the branch stays limited to deterministic pinning and keeps replacement work separate.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn check:storage-network-usage`
- `corepack yarn test:storage-network:focused`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.
- Additional logcat observation after smoke showed BlueElectrum connecting to `electrumx.testnet.btcv.stage.rnd.land:443` and reporting `connected to server` / `connected to, ElectrumX 2.0.a,2.0`; no targeted secure storage, Electrum, Android runtime, or React Native runtime errors were found.

Follow-up:

- Real-device secure storage and biometric/keychain behavior should be checked during release-candidate validation; emulator smoke only proves startup and dashboard runtime stability.

### BEM-36.62 - React Native Localize manifest pin

- Branch: `feature/bem-localize-1-4-3-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `react-native-localize` manifest from `^1.4.0` to the already-resolved lockfile version `1.4.3`.
- Refresh the lockfile selector for the exact dependency.
- Update the native module inventory guard, native module upgrade plan, and storage/network compatibility audit.
- Keep source usage, Android/iOS native project files, and runtime behavior unchanged.

Why:

- The repo was already installing `react-native-localize@1.4.3`, but the manifest allowed dependency drift within the 1.x line.
- Pinning the installed version keeps the native module inventory deterministic during the staged Group C upgrade work.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn check:storage-network-usage`
- `corepack yarn test:storage-network:focused`
- `corepack yarn android:dev:check-light`
- `git diff --check`

Follow-up:

- Language/locale behavior should be checked again during future release-candidate validation on devices with non-default locale settings.

### BEM-36.61 - React Native Device Info manifest pin

- Branch: `feature/bem-device-info-6-2-1-manifest`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Pin `react-native-device-info` manifest from `^6.0.2` to the already-resolved lockfile version `6.2.1`.
- Refresh the lockfile selector for the exact dependency.
- Update the native module inventory guard, native module upgrade plan, and storage/network compatibility audit.
- Keep source usage, Android/iOS native project files, and runtime behavior unchanged.

Why:

- The repo was already installing `react-native-device-info@6.2.1`, but the manifest allowed drift back into the 6.x range.
- Pinning the installed version keeps the native module inventory deterministic during the staged Group C upgrade work.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn check:storage-network-usage`
- `corepack yarn test:storage-network:focused`
- `corepack yarn android:dev:check-light`
- `git diff --check`

Follow-up:

- Device metadata behavior should be checked again on real devices during future release-candidate validation, especially where emulator detection or device-security checks affect user-visible behavior.

### BEM-36.60 - React Native Config 1.5.9

- Branch: `feature/bem-react-native-config-1-5-9`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `react-native-config` from `1.4.4` to `1.5.9`.
- Refresh `yarn.lock`.
- Update the native module inventory guard, native module upgrade plan, and storage/network compatibility audit.
- Add a local React Native CLI Android override for `react-native-config`, because the newer package manifest shape is not detected by this repo's RN `0.68.7` CLI without an explicit Android `sourceDir`.
- Type required env values defensively in `src/config/index.ts` after the newer package types changed env values to `string | undefined`.
- Keep Android `envConfigFiles`, iOS scheme env-copy scripts, `src/config/index.ts`, Electrum configuration, explorer configuration, Sentry DSNs, and CodePush keys unchanged.

Why:

- `1.5.9` is the latest checked compatible `react-native-config` release for the current RN `0.68.7` Android baseline.
- `1.6.1` was checked and rejected because Android compile failed on newer React Native Android APIs that are not present in RN `0.68.7`.
- This package controls app flavor/env loading, Electrum host/protocol values, explorer URLs, Sentry DSNs, CodePush keys, and release-service configuration, so it stays isolated from storage, socket, and WebView changes.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn check:release-service-env-keys`
- `corepack yarn check:android-env-config-files`
- `corepack yarn check:ios-scheme-config`
- `corepack yarn check:storage-network-usage`
- `corepack yarn test:storage-network:focused`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.
- Additional logcat observation after smoke showed BlueElectrum connecting to `electrumx.testnet.btcv.stage.rnd.land:443` and reporting `connected to server` / `connected to, ElectrumX 2.0.a,2.0`; no targeted config, Electrum, Android runtime, or React Native runtime errors were found.
- Rejected `react-native-config@1.6.1` during this branch because Android compile failed on RN `0.68.7` with missing `BaseReactPackage` and `WritableMap.putLong` APIs.

Follow-up:

- `ios/Podfile.lock` was not refreshed in this Windows branch. Do not claim iOS validation until `pod install` and the affected iOS scheme build pass on a Mac/iOS environment.

### BEM-36.59 - React Native NetInfo 6.2.1

- Branch: `feature/bem-netinfo-6-2-1`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `@react-native-community/netinfo` from manifest `^6.0.2` and lockfile `6.0.2` to `6.2.1`.
- Pin the manifest to `6.2.1` and refresh `yarn.lock`.
- Update the native module inventory guard, native module upgrade plan, and storage/network compatibility audit.
- Keep Electrum sagas, connectivity handling code, native project files, and runtime behavior unchanged.

Why:

- `6.2.1` is the latest checked 6.x NetInfo line and declares React Native `>=0.59`.
- NetInfo affects Electrum saga connectivity checks and network listeners, so this stays isolated from socket/config/storage changes and requires focused storage/network validation plus Android emulator smoke.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn check:storage-network-usage-guard`
- `corepack yarn check:storage-network-usage`
- `corepack yarn check:storage-network-validation-scripts-guard`
- `corepack yarn check:storage-network-validation-scripts`
- `corepack yarn test:storage-network:focused`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.
- Additional logcat observation after smoke showed BlueElectrum connecting to `electrumx.testnet.btcv.stage.rnd.land:443` and reporting `connected to server` / `connected to, ElectrumX 2.0.a,2.0`; no targeted NetInfo, Electrum, Android runtime, or React Native runtime errors were found.

Follow-up:

- Funded transaction flow and deeper Electrum send-path validation remain blocked until a funded BTCV testnet wallet is available.
- `ios/Podfile.lock` was not refreshed in this Windows branch. Do not claim iOS validation until `pod install` and the affected iOS scheme build pass on a Mac/iOS environment.

### BEM-36.58 - SVG QR render documentation consistency

- Branch: `feature/bem-36-svg-qr-doc-consistency`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Align the native module upgrade plan and SVG QR render compatibility audit with the actual BEM-36.57 package state.
- Record the tested QR renderer pair as `react-native-svg@12.5.1`, `react-native-qrcode-svg@6.1.1`, and root `qrcode@1.4.4` resolution.
- Keep package versions, runtime code, native files, and lockfile unchanged.

Why:

- BEM-36.57 intentionally rejected `react-native-qrcode-svg@6.1.2` with freshly resolved `qrcode@1.5.4` after Receive-screen smoke exposed `ReferenceError: Can't find variable: TextEncoder`.
- The follow-up documentation must point future work at the tested state, not the rejected trial version.

Validation:

- `corepack yarn android:dev:check-light`
- `git diff --check`
- Confirmed no documentation still claims `react-native-qrcode-svg@6.1.2` as the fixed/current package; remaining `6.1.2` mentions are explicitly marked as the rejected trial version.

### BEM-36.57 - SVG QR render dependency pair

- Branch: `feature/bem-svg-qr-render-12-5-1`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `react-native-svg` from `9.5.1` to `12.5.1`.
- Pin `react-native-qrcode-svg` to the existing compatible `6.1.1` lockfile line.
- Add a root `resolutions` pin for `qrcode@1.4.4`.
- Refresh `yarn.lock` and update the native module inventory guard, QR render compatibility audit, and native module upgrade plan baseline.
- Keep QR render screen code, camera scanning code, native project files, and runtime behavior unchanged.

Why:

- The previous lockfile resolved `react-native-qrcode-svg@6.1.1`, which declares `react-native-svg ^12.1.0`, while the app still pinned `react-native-svg@9.5.1`.
- `react-native-svg@12.5.1` is the latest checked 12.x SVG line and declares React Native `>=0.50.0`.
- `react-native-qrcode-svg@6.1.1` stays on the compatible 6.1.x line for SVG 12.x.
- A trial with `react-native-qrcode-svg@6.1.2` and freshly resolved `qrcode@1.5.4` was rejected because the Android Receive screen raised `ReferenceError: Can't find variable: TextEncoder`.
- Newer QR package lines require SVG 13/14+ and should wait for a later RN baseline branch.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn check:qr-render-usage-guard`
- `corepack yarn check:qr-render-usage`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.
- Additional Android Receive-screen smoke passed: `Receive coins`, `qr-code-icon`, `Wallet address`, and the wallet address rendered; targeted logcat check found no fatal Android runtime errors, React Native runtime exceptions, SVG errors, or `TextEncoder` regression.

Follow-up:

- Manually verify QR rendering screens with a funded or populated wallet when available: Receive, contact QR, export wallet secret, export xpub, and authenticator options.
- `ios/Podfile.lock` was not refreshed in this Windows branch. Do not claim iOS validation until `pod install` and the affected iOS scheme build pass on a Mac/iOS environment.

### BEM-36.56 - React Native Safe Area Context 3.4.1

- Branch: `feature/bem-safe-area-context-3-4-1`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `react-native-safe-area-context` from manifest `^3.0.6` and lockfile `3.3.2` to `3.4.1`.
- Pin the manifest to `3.4.1` and refresh `yarn.lock`.
- Update the native module inventory guard, navigation/layout audit, and native module upgrade plan baseline.
- Keep `ScreenTemplate`, navigation code, native project files, and runtime behavior unchanged.

Why:

- `3.4.1` is the latest checked 3.x Safe Area Context package version and declares broad React/React Native peer compatibility.
- Safe-area behavior affects screen spacing and footer/keyboard layout, so this stays isolated from gesture, screen, blur, icon, and splash changes and requires Android smoke after a clean Metro cache.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.

Follow-up:

- `ios/Podfile.lock` was not refreshed in this Windows branch. Do not claim iOS validation until `pod install` and the affected iOS scheme build pass on a Mac/iOS environment.

### BEM-36.55 - React Native Community Blur 4.4.1

- Branch: `feature/bem-blur-4-4-1`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `@react-native-community/blur` from manifest `^4.3.0` and lockfile `4.3.0` to `4.4.1`.
- Pin the manifest to `4.4.1` and refresh `yarn.lock`.
- Update the native module inventory guard, navigation/layout audit, and native module upgrade plan baseline.
- Keep UI component code, native project files, and runtime behavior unchanged.

Why:

- `4.4.1` is the latest checked 4.x Blur package version and declares broad React/React Native peer compatibility.
- Blur affects layered visual surfaces, so the package bump stays isolated from safe-area, gesture, icon, and splash changes and requires Android smoke after a clean Metro cache.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.

Follow-up:

- `ios/Podfile.lock` was not refreshed in this Windows branch. Do not claim iOS validation until `pod install` and the affected iOS scheme build pass on a Mac/iOS environment.

### BEM-36.54 - React Native BootSplash 3.2.7

- Branch: `feature/bem-bootsplash-3-2-7`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `react-native-bootsplash` from locked `3.2.5` to `3.2.7`.
- Pin the manifest to `3.2.7` and refresh `yarn.lock`.
- Update the native module inventory guard, navigation/layout audit, and native module upgrade plan baseline.
- Keep BootSplash runtime calls, Android resources, Android `MainActivity`, iOS `AppDelegate`, and launch-screen files unchanged.

Why:

- `3.2.7` is the latest checked 3.x BootSplash version and declares React Native `>=0.60.0`.
- BootSplash touches app startup, so the package bump stays isolated from other navigation/layout changes and requires emulator smoke after a clean Metro cache.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.

Follow-up:

- `ios/Podfile.lock` still records `RNBootSplash (3.2.5)` until `pod install` is run on a Mac/iOS environment. Do not claim iOS validation until that is refreshed and the affected scheme builds.

### BEM-36.53 - React Native Fast Image 8.6.3

- Branch: `feature/bem-fast-image-8-6-3`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `react-native-fast-image` from locked `8.3.7` to `8.6.3`.
- Pin the manifest to `8.6.3` and refresh `yarn.lock`.
- Update the native module inventory guard, navigation/layout audit, and native module upgrade plan baseline.
- Keep shared image component exports, call sites, Android Gradle files, iOS project files, and runtime code unchanged.

Why:

- `8.6.3` is the latest checked 8.x FastImage version and declares compatibility with React `^17 || ^18` and React Native `>=0.60.0`.
- FastImage is used through the shared image abstraction, button/list/tab icon surfaces, and model types, so this stays isolated from unrelated navigation or QR work.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.

Follow-up:

- `ios/Podfile.lock` was not refreshed in this Windows branch. Do not claim iOS validation until `pod install` and the affected iOS scheme build pass on a Mac/iOS environment.

### BEM-36.52 - React Native Vector Icons 6.7.0

- Branch: `feature/bem-vector-icons-6-7-0`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `react-native-vector-icons` from `6.6.0` to `6.7.0`.
- Add `@react-native-community/toolbar-android@0.2.1`, the bundle-time peer dependency required by `react-native-vector-icons@6.7.0`.
- Refresh `yarn.lock`.
- Update the native module inventory guard, navigation/layout audit, and native module upgrade plan baseline.
- Keep icon usage, font configuration, runtime code, and native Gradle/iOS project files unchanged.

Why:

- `6.7.0` is the latest checked 6.x package line and remains a small same-major dependency update.
- The initial smoke attempt exposed a Metro 500 redbox because `react-native-vector-icons@6.7.0` requires `@react-native-community/toolbar-android`; adding the peer keeps the package line internally consistent.
- `@react-native-community/toolbar-android@0.1.0-rc.2` matched the declared peer range but failed Android compilation on the current baseline; `0.2.1` compiled and passed smoke.
- The package now warns about the newer per-icon-family migration model, but that is a larger icon-font migration and should not be mixed into this version bump.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn android:dev:check-light`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- Initial `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` failed with a Metro 500 redbox because `@react-native-community/toolbar-android` was missing.
- Retried with `@react-native-community/toolbar-android@0.1.0-rc.2`; Android assemble failed in `:react-native-community_toolbar-android:compileDebugJavaWithJavac` because `IconImageInfo` did not implement `getExtras()`.
- Retried with `@react-native-community/toolbar-android@0.2.1`.
- Metro restarted again with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.

Follow-up:

- `ios/Podfile.lock` was not refreshed in this Windows branch. Do not claim iOS validation until `pod install` and the affected iOS scheme build pass on a Mac/iOS environment.
- Yarn still reports that `react-native-vector-icons@6.7.0` declares `@react-native-community/toolbar-android@^0.1.0-rc.1`; this branch intentionally uses `0.2.1` because the matching RC line failed Android compilation.

### BEM-36.51 - Native plan TCP socket baseline

- Branch: `feature/bem-native-plan-tcp-socket-baseline`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `docs/native-module-upgrade-plan.md` after the `react-native-tcp-socket` `6.4.1` branch.
- Keep runtime code, native code, dependency versions, Metro behavior, and validation artifact formats unchanged.

Why:

- The native module plan explicitly says dependency version changes should keep the plan aligned with the guarded inventory.
- Future Group C socket/config work should start from the current `6.4.1` baseline and focus on Electrum/network behavior, not repeat the package bump.

Validation:

- `corepack yarn android:dev:check-light`
- `git diff --check`
- Emulator smoke not required for this documentation-only branch.

### BEM-36.50 - React Native TCP Socket 6.4.1

- Branch: `feature/bem-tcp-socket-6-4-1`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `react-native-tcp-socket` from locked `6.0.6` to `6.4.1`.
- Refresh `yarn.lock`.
- Update the native module inventory guard and storage/network audit baseline.
- Keep Electrum socket source code unchanged.

Why:

- `react-native-tcp-socket` is a Group C dependency directly used by the Electrum TLS socket implementation.
- `6.4.1` is the latest same-major version and still declares `react-native >=0.60.0`.
- This branch keeps the update isolated from Electrum logic changes and funded transaction flow work.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn check:storage-network-usage`
- `corepack yarn test:storage-network:focused`
- `corepack yarn android:dev:check-light`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.

Follow-up:

- `ios/Podfile.lock` still records the previous pod lock entry until `pod install` is run on a Mac/iOS environment. Do not claim iOS validation for this branch until that is refreshed and the affected scheme builds.
- Funded transaction flow remains blocked until a funded BTCV testnet wallet is available; this branch only validates startup/UI and preserves existing Electrum socket source.

### BEM-36.49 - React Native RandomBytes 3.6.2

- Branch: `feature/bem-randombytes-3-6-2`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `react-native-randombytes` from `3.5.3` to `3.6.2`.
- Refresh `yarn.lock`.
- Update the native module inventory guard and storage/network audit baseline.
- Keep source imports unchanged; the package remains indirectly used by wallet/crypto dependencies.

Why:

- This is the smallest Group C native dependency update after adding storage/network usage and validation guards.
- `3.6.2` is the latest npm version checked by Yarn metadata.
- The package is deprecated upstream in favor of `react-native-get-random-values`, but replacing the random-value provider is a larger crypto/runtime migration and should not be mixed into this version bump.

Validation:

- `corepack yarn check:native-module-inventory`
- `corepack yarn check:storage-network-usage`
- `corepack yarn check:storage-network-validation-scripts`
- `corepack yarn test:storage-network:focused`
- `corepack yarn android:dev:check-light`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `corepack yarn start --reset-cache`.
- `adb reverse tcp:8081 tcp:8081`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- Android emulator smoke passed on `emulator-5554`: dashboard rendered `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no fatal Android runtime or React Native runtime logcat findings were reported.

Follow-up:

- `ios/Podfile.lock` still records the previous pod lock entry until `pod install` is run on a Mac/iOS environment. Do not claim iOS validation for this branch until that is refreshed and the affected scheme builds.

### BEM-36.48 - Storage/network focused validation script

- Branch: `feature/bem-storage-focused-validation-script`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `test:storage-network:focused` as a single command for the focused Group C validation set.
- Extend the storage/network validation script guard so the aggregate command must run `test:storage`, `test:authenticator`, and `test:wallet-core:offline`.
- Document the aggregate command in the storage/network audit.

Why:

- Future storage/config/network dependency branches should have a short, repeatable command before Android assemble and emulator smoke.
- The aggregate command keeps the focused storage, authenticator, and wallet-core offline checks visible without replacing the existing individual `prepush` coverage.

Validation:

- `corepack yarn check:storage-network-validation-scripts-guard`
- `corepack yarn check:storage-network-validation-scripts`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn test:storage-network:focused`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.47 - Storage/network validation file guard

- Branch: `feature/bem-storage-validation-file-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend the storage/network validation script guard so it also verifies that the referenced focused Jest files exist.
- Add self-check coverage for an accepted file set and a missing test-file case.
- Refresh the storage/network audit wording.

Why:

- Guarding package script names is not enough if a future cleanup removes or renames the target test file.
- Group C dependency updates need the focused storage, authenticator, and wallet-core offline tests to remain concrete runnable files.

Validation:

- `corepack yarn check:storage-network-validation-scripts-guard`
- `corepack yarn check:storage-network-validation-scripts`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.46 - Storage/network validation script guard

- Branch: `feature/bem-storage-validation-script-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a guard for the focused storage/network validation scripts used before Group C dependency changes.
- Verify `test:storage`, `test:authenticator`, and `test:wallet-core:offline` still point at the expected Jest files.
- Verify `prepush` still runs the focused storage/authenticator/wallet-core offline validation scripts.
- Include the guard in `android:dev:check-light`.
- Update README, Android workflow, baseline, storage/network audit, and this modernization log.

Why:

- AsyncStorage and secure-storage dependency changes need focused tests before emulator smoke.
- The focused test entry points should fail fast if they are renamed, retargeted, or removed from the pre-push path.
- This keeps Group C validation explicit before actual dependency updates.

Validation:

- `corepack yarn check:storage-network-validation-scripts-guard`
- `corepack yarn check:storage-network-validation-scripts`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.45 - Storage/network usage guard

- Branch: `feature/bem-storage-network-usage-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a guard for current Group C storage/config/network/WebView usage.
- Track imports for AsyncStorage, NetInfo, device-info, react-native-config, localization, randombytes, secure storage, TCP socket, and WebView.
- Add fixture self-check coverage for accepted, missing, unexpected file, and unexpected package cases.
- Include the guard in `android:dev:check-light`.
- Update README, Android workflow, baseline, storage/network audit, and this modernization log.

Why:

- Group C dependencies touch wallet persistence, env loading, Electrum connectivity, secure storage, localization, crypto random bytes, and terms WebViews.
- Before changing any package versions, the import surface should fail fast if it drifts.
- `react-native-randombytes` is intentionally tracked with no direct source import, because current usage is indirect through wallet/crypto dependencies.

Validation:

- `corepack yarn check:storage-network-usage-guard`
- `corepack yarn check:storage-network-usage`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.44 - iOS scheme config mapping guard

- Branch: `feature/bem-ios-scheme-config-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a guard for shared iOS Xcode scheme pre-action `.env` and Firebase plist mapping.
- Add fixture self-check coverage for accepted, changed env, changed Firebase plist, missing scheme, unexpected scheme, and empty mapping cases.
- Include the guard in `android:dev:check-light`.
- Update README, Android workflow, baseline, release-service audit, iOS release-config audit, and this modernization log.

Why:

- iOS env/Firebase selection is part of the release-service/native-module surface.
- Rebranding, release-service, or scheme changes should not silently point an iOS scheme at the wrong env file or Firebase plist.
- This converts the BEM-36 iOS release-config audit into a mechanically checked baseline.

Validation:

- `corepack yarn check:ios-scheme-config-guard`
- `corepack yarn check:ios-scheme-config`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.43 - Android env config mapping guard

- Branch: `feature/bem-android-env-config-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a guard for Android `project.ext.envConfigFiles` flavor/build-type to `.env` mapping.
- Add fixture self-check coverage for accepted, mismatched, missing, unexpected, and missing-block cases.
- Include the guard in `android:dev:check-light`.
- Update README, Android workflow, baseline, and release-service audit docs.

Why:

- Android env selection is part of the release-service/native-module surface.
- Rebranding, release-service, or flavor changes should not silently point a build variant at the wrong env file.
- This keeps BEM-36 guard coverage aligned with the iOS scheme/env audit.

Validation:

- `corepack yarn check:android-env-config-files-guard`
- `corepack yarn check:android-env-config-files`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.42 - iOS release config compatibility audit

- Branch: `feature/bem-ios-scheme-release-config-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/ios-release-config-compatibility-audit.md`.
- Record current iOS scheme pre-actions, env file selection, Firebase plist selection, Info.plist usage, bundle identifiers, Sentry/CodePush key surface, and rebranding/release risks.
- Link the audit from `docs/release-services-native-compatibility-audit.md`.

Why:

- iOS release-service and rebranding work spans schemes, env files, Firebase plists, Info.plist files, CodePush deployment keys, and Sentry/Firebase behavior.
- The current mapping should be explicit before adding guards or changing release configuration.

Validation:

- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this docs/audit-only branch.

### BEM-36.41 - Release service env key guard self-check

- Branch: `feature/bem-release-service-env-guard-self-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extract release-service env key comparison logic into `scripts/releaseServiceEnvKeysGuard.mjs`.
- Add `scripts/checkReleaseServiceEnvKeysGuard.mjs` fixture coverage.
- Include `check:release-service-env-keys-guard` before the real env key check in `android:dev:check-light`.
- Refresh workflow, baseline, release-service audit, and check-light docs guard wording.

Why:

- The env-key guard protects Sentry, CodePush, Firebase messaging, email notifications, and flavor env files.
- Like the other usage/inventory guards, its allowlist behavior should be self-checked before the real repository scan runs.

Validation:

- `corepack yarn check:release-service-env-keys-guard`
- `corepack yarn check:release-service-env-keys`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.40 - Release service env key guard

- Branch: `feature/bem-release-service-env-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/checkReleaseServiceEnvKeys.mjs`.
- Add `check:release-service-env-keys` and include it in `android:dev:check-light`.
- Check env files referenced by Android `envConfigFiles` and iOS schemes for release-service keys without printing secret values.
- Refresh README, Android workflow, baseline, release-service audit, and check-light docs guard expectations.

Why:

- Sentry, Firebase messaging, email notifications, and CodePush depend on `react-native-config` env keys.
- Rebranding/release work should fail fast if a referenced app env loses required release-service keys.

Validation:

- `corepack yarn check:release-service-env-keys`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn check:diff-whitespace`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.39 - Android lightweight docs guard

- Branch: `feature/bem-check-light-docs-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/checkAndroidLightDocs.mjs`.
- Add `android:dev:check-light-docs` and include it in `android:dev:check-light`.
- Guard the README, Android workflow, and wallet modernization baseline descriptions for the main lightweight check groups.

Why:

- `android:dev:check-light` has grown into the main maintenance gate and now includes multiple release-service guards.
- Future check additions should fail fast if the public maintenance docs drift from the actual gate.

Validation:

- `corepack yarn android:dev:check-light-docs`
- `corepack yarn check:diff-whitespace`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.38 - Release service guard baseline docs

- Branch: `feature/bem-baseline-release-service-guards`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh README, Android workflow, and wallet modernization baseline descriptions of `android:dev:check-light`.
- Include the new CodePush, Firebase, and iOS push notification usage guards in the documented lightweight gate.

Why:

- `BEM-36.35` through `BEM-36.37` expanded the release-service guard surface.
- The documented Android maintenance workflow should match the actual `package.json` gate before further dependency work.

Validation:

- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this docs-only branch.

### BEM-36.37 - iOS push notification usage scope guard

- Branch: `feature/bem-push-notification-ios-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/pushNotificationIosUsageGuard.mjs`, `scripts/checkPushNotificationIosUsageGuard.mjs`, and `scripts/checkPushNotificationIosUsageScope.mjs`.
- Wire `check:push-notification-ios-usage-guard` and `check:push-notification-ios-usage-scope` into `android:dev:check-light`.
- Document the guard in `docs/release-services-native-compatibility-audit.md`.

Why:

- `@react-native-community/push-notification-ios` touches runtime badge handling and native iOS notification forwarding.
- The future iOS push bridge upgrade should start from a guarded runtime/native integration surface.

Validation:

- `corepack yarn check:push-notification-ios-usage-guard`
- `corepack yarn check:push-notification-ios-usage-scope`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.36 - Firebase usage scope guard

- Branch: `feature/bem-firebase-usage-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/firebaseUsageGuard.mjs`, `scripts/checkFirebaseUsageGuard.mjs`, and `scripts/checkFirebaseUsageScope.mjs`.
- Wire `check:firebase-usage-guard` and `check:firebase-usage-scope` into `android:dev:check-light`.
- Document the guard in `docs/release-services-native-compatibility-audit.md`.

Why:

- Firebase currently spans runtime messaging, Android Gradle plugins/config files, iOS plist selection, and Xcode RNFB phases.
- The future Firebase family upgrade should start from a guarded runtime/native integration surface.

Validation:

- `corepack yarn check:firebase-usage-guard`
- `corepack yarn check:firebase-usage-scope`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.35 - CodePush usage scope guard

- Branch: `feature/bem-codepush-usage-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/codePushUsageGuard.mjs`, `scripts/checkCodePushUsageGuard.mjs`, and `scripts/checkCodePushUsageScope.mjs`.
- Wire `check:codepush-usage-guard` and `check:codepush-usage-scope` into `android:dev:check-light`.
- Document the guard in `docs/release-services-native-compatibility-audit.md`.

Why:

- CodePush is disabled in `__DEV__`, but it affects non-dev bundle loading and deployment keys.
- The future CodePush upgrade should start from a guarded runtime/native integration surface.

Validation:

- `corepack yarn check:codepush-usage-guard`
- `corepack yarn check:codepush-usage-scope`
- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this tooling/documentation branch.

### BEM-36.34 - Release service compatibility audit

- Branch: `feature/bem-release-services-compat-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/release-services-native-compatibility-audit.md` for Firebase, push notification, CodePush, and Sentry release-service dependencies.
- Record current package versions, latest npm snapshot checked on 2026-05-27, runtime usage, Android/iOS native build surface, and validation requirements.
- Link the audit from `docs/native-module-upgrade-plan.md`.

Why:

- Firebase, CodePush, Sentry, and notification dependencies touch release builds, source maps, dSYMs, push permissions, tokens, Crashlytics, analytics, and environment-specific config.
- These packages should be upgraded in dedicated branches instead of being mixed into a generic native-module bump.

Validation:

- `corepack yarn android:dev:check-light`
- Emulator smoke not required for this docs/audit-only branch.

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

### BEM-36.9 - Android smoke log trimming

- Branch: `feature/bem-android-smoke-log-trim`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Keep `local-docs/android-smoke-dev.log` readable during emulator smoke validation.
- Stop recording full `dumpsys window` output in the smoke transcript.
- Stop duplicating the full UI hierarchy XML into the smoke transcript.
- Preserve the dedicated UI hierarchy artifact at `local-docs/android-smoke-dev-ui.xml`.

Why:

- The previous helper wrote the UI XML and focused-window dump into `android-smoke-dev.log`.
- That made the operational log noisy and harder to scan.
- The XML artifact is still available separately when the exact rendered UI tree is needed.

Validation:

- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper still found the app PID, scanned app-process logcat, confirmed foreground focus, wrote the UI hierarchy artifact, and found the default dashboard texts.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No app runtime code changed in this branch.

### BEM-36.10 - Android smoke screenshot artifact

- Branch: `feature/bem-android-smoke-screenshot`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend `scripts/androidSmokeDev.mjs` to capture a startup screenshot after the UI hierarchy check.
- Write the screenshot to `local-docs/android-smoke-dev.png`.
- Document the screenshot artifact in the Android modernization workflow.

Why:

- The smoke helper already proves foreground focus, expected UI text, and app-process logcat health.
- A screenshot gives a quick visual artifact for manual review without keeping the emulator window in focus.
- Keeping the screenshot in `local-docs/` avoids committing generated validation artifacts.

Validation:

- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper still found the app PID, scanned app-process logcat, confirmed foreground focus, found the default dashboard texts, and wrote `local-docs/android-smoke-dev.png`.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No app runtime code changed in this branch.

### BEM-37.38 - Android warning audit refresh

- Branch: `feature/bem-37-warning-audit-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Re-run the Android warning audit after the Android smoke tooling work.
- Confirm whether the targeted warning baseline changed.
- Keep this branch documentation-only.

Current targeted warnings:

- `jcenter()` from `node_modules\react-native-camera\android\build.gradle:59`.
- `execResult` from `node_modules\@sentry\react-native\sentry.gradle:48`.

Decision:

- The Android smoke tooling changes did not introduce new targeted warning sources.
- Keep the two remaining warning cleanups as already planned larger follow-ups:
  - Replace deprecated `react-native-camera` in a dedicated QR scanner migration branch.
  - Handle Sentry Gradle/source-map behavior in a dedicated Sentry release tooling branch.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The full audit log was written to `local-docs/android-warning-audit.log`.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime code changed in this branch.

### BEM-34.2 - Modernization baseline refresh

- Branch: `feature/bem-34-baseline-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh `docs/wallet-modernization-baseline.md` after the Android SDK/toolchain modernization work.
- Align the baseline document with the current branch state instead of the older RN 0.65 / AGP 4.2 / SDK 30 snapshot.
- Keep this branch documentation-only.

Current baseline captured:

- React Native `0.68.7`.
- Android Gradle Plugin `7.4.2`.
- Gradle wrapper `7.5.1`.
- Android compile SDK `34`, target SDK `33`, build tools `34.0.0`.
- Local Android modernization JDK: `D:\tmp\jdks\temurin17\jdk-17.0.19+10`.
- Standard validation command for app-affecting Android work: `corepack yarn android:dev:verify`.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime code changed in this branch.

### BEM-34.3 - Baseline Metro wording correction

- Branch: `feature/bem-34-baseline-metro-wording`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Correct the Metro section in `docs/wallet-modernization-baseline.md`.
- Replace the stale `React Native 0.65 stack` wording with the current `React Native 0.68 stack`.
- Keep this branch documentation-only.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime code changed in this branch.

### BEM-34.4 - README tooling refresh

- Branch: `feature/bem-34-readme-tooling-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh README development prerequisites.
- Replace stale Node `12.14.1+` and Android JDK 8 guidance with the current Node 16 / Corepack Yarn / JDK 17 workflow.
- Add `android:dev:verify` as the Android development verification command.
- Keep this branch documentation-only.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime code changed in this branch.

### BEM-36.11 - Android smoke screenshot artifact guard

- Branch: `feature/bem-android-smoke-screenshot-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Harden `scripts/androidSmokeDev.mjs` screenshot capture.
- Fail the smoke helper if `adb exec-out screencap -p` returns an empty artifact.
- Print the screenshot artifact byte size in the smoke transcript.

Why:

- The smoke helper already writes `local-docs/android-smoke-dev.png`.
- A non-empty artifact guard makes the visual evidence check explicit instead of assuming `screencap` returned valid data.

Validation:

- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper captured a non-empty startup screenshot and printed its byte size.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No app runtime code changed in this branch.

### BEM-36.12 - Android clean runner script

- Branch: `feature/bem-36-android-clean-runner`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:clean` as a guarded package script.
- Route Android clean through `scripts/runAndroidGradle.mjs` so it uses the same `JAVA_HOME` Java selection and JDK 11-17 guard as the assemble/audit commands.
- Document the clean command in `docs/android-modernization-workflow.md`.

Why:

- The existing broad `clean` script calls `gradlew` directly and also removes dependencies/caches.
- Android-only cleanup during modernization should have a smaller command that follows the same JDK guard as the rest of the Android workflow.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:clean` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:verify` passed on the connected Android emulator.
- The verify command rebuilt the dev APK after clean, installed it, launched `io.goldwallet.wallet.dev`, confirmed the focused app, found `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-36.13 - Android smoke helper messages

- Branch: `feature/bem-36-smoke-helper-messages`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update the missing-APK error to point at `corepack yarn android:dev:verify`, because that command rebuilds and smoke-tests the APK.
- Document the smoke helper environment overrides in `docs/android-modernization-workflow.md`.

Why:

- The helper now supports a full verify workflow, custom APK/package paths, startup wait tuning, and expected UI text overrides.
- The documentation should make those controls discoverable during emulator QA.

Validation:

- Missing-APK check exited with code `1` and wrote the updated `corepack yarn android:dev:verify` recovery message.
- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper installed the current dev APK, launched `io.goldwallet.wallet.dev`, confirmed the focused app, found `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`, scanned app-process logcat, and captured a non-empty screenshot.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.

### BEM-36.14 - Android smoke wait validation

- Branch: `feature/bem-36-smoke-wait-validation`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Validate `ANDROID_SMOKE_WAIT_MS` before the helper reaches the startup wait.
- Fail with a clear message when the value is not a non-negative millisecond count.
- Clarify the expected value in `docs/android-modernization-workflow.md`.

Why:

- The smoke helper now exposes wait-time tuning for slower emulator/dev-server startup.
- Invalid wait values should fail at the helper level with an actionable message instead of surfacing as an indirect `node -e` sleep failure.

Validation:

- Invalid `ANDROID_SMOKE_WAIT_MS=abc` check exited with code `1` and wrote the expected non-negative-number error.
- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper installed the current dev APK, launched `io.goldwallet.wallet.dev`, confirmed the focused app, found `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`, scanned app-process logcat, and captured a non-empty screenshot.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.

### BEM-36.15 - Android Gradle runner usage guard

- Branch: `feature/bem-36-gradle-runner-usage`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Check `scripts/runAndroidGradle.mjs` arguments before probing Java.
- Keep the existing JDK 11-17 guard and Gradle execution behavior unchanged.

Why:

- Calling the runner without Gradle arguments is a usage error.
- The runner should show the usage message immediately even if a local `JAVA_HOME` is missing or invalid.

Validation:

- `JAVA_HOME=D:\does-not-exist node scripts/runAndroidGradle.mjs` exited with code `1` and printed the usage message before probing Java.
- `JAVA_HOME=D:\does-not-exist node scripts/runAndroidGradle.mjs help` exited with code `1` and kept the existing invalid-Java error path.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble` passed.
- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper installed the current dev APK, launched `io.goldwallet.wallet.dev`, confirmed the focused app, found `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-36.16 - Android smoke device selection

- Branch: `feature/bem-36-smoke-device-selection`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `ANDROID_SERIAL` support to `scripts/androidSmokeDev.mjs`.
- Validate that the selected serial is connected before install/launch commands run.
- Fail fast with a clear message if multiple devices are connected and no serial is selected.
- Document `ANDROID_SERIAL` in the Android modernization workflow.

Why:

- The smoke helper now runs all device-specific `adb` commands through a selected device when `ANDROID_SERIAL` is set.
- This avoids ambiguous `adb install` / `adb shell` failures when more than one emulator or phone is connected.

Validation:

- `ANDROID_SERIAL=missing-emulator node scripts/androidSmokeDev.mjs` exited with code `1` and reported the connected device list.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `ANDROID_SERIAL=emulator-5554 corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper routed device-specific `adb` commands through the selected serial, installed the current dev APK, launched `io.goldwallet.wallet.dev`, confirmed the focused app, found `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-36.17 - Android smoke logcat line limit

- Branch: `feature/bem-36-smoke-logcat-lines`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `ANDROID_SMOKE_LOGCAT_LINES` support to `scripts/androidSmokeDev.mjs`.
- Validate that the value is a positive integer before reading logcat.
- Use the configured value for the app-process `adb logcat -t` startup scan.
- Document the override in the Android modernization workflow.

Why:

- The helper previously hardcoded `400` startup logcat lines.
- Some emulator/Metro startup investigations need a wider or narrower app-process log window without editing the script.

Validation:

- `ANDROID_SMOKE_LOGCAT_LINES=abc node scripts/androidSmokeDev.mjs` exited with code `1` and wrote the expected positive-integer error.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `ANDROID_SMOKE_LOGCAT_LINES=250 corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper used the configured app-process logcat line limit, installed the current dev APK, launched `io.goldwallet.wallet.dev`, confirmed the focused app, found `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-36.18 - Android smoke selected device

- Branch: `feature/bem-36-smoke-selected-device`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Select a concrete Android serial after `adb devices` validation even when `ANDROID_SERIAL` is not set and only one device is connected.
- Route all device-specific smoke commands through the selected serial.
- Log both a requested serial and the effective selected serial when applicable.

Why:

- The helper already fails fast when multiple devices are connected without `ANDROID_SERIAL`.
- Using the single detected device serial explicitly makes install, shell, logcat, and screenshot commands deterministic and easier to audit from `local-docs/android-smoke-dev.log`.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:smoke` passed on the connected Android emulator without `ANDROID_SERIAL` set.
- The helper detected the single connected device, logged `Using Android serial: emulator-5554`, routed device-specific `adb` commands through that serial, found `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-36.19 - Android smoke config logging

- Branch: `feature/bem-36-smoke-config-log`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Log the effective startup wait, logcat line limit, and expected UI text list at the start of `scripts/androidSmokeDev.mjs`.
- Keep smoke behavior unchanged.

Why:

- The smoke helper now supports multiple environment overrides.
- Recording the effective configuration in `local-docs/android-smoke-dev.log` makes smoke artifacts easier to audit without reconstructing the command environment.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The smoke transcript logged `Using startup wait: 8000ms`, `Using logcat line limit: 400`, and `Using expected UI text(s): Wallets, E2EWalletTypeTest, Send, Receive`.
- The helper selected `emulator-5554`, found the expected dashboard texts, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-36.20 - Android smoke adb timeout

- Branch: `feature/bem-36-smoke-adb-timeout`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `ANDROID_SMOKE_ADB_TIMEOUT_MS` support to `scripts/androidSmokeDev.mjs`.
- Validate that the value is a positive integer.
- Apply the timeout to every `adb` command run by the helper, including binary screenshot capture.
- Log the effective timeout at smoke startup.
- Document the override in the Android modernization workflow.

Why:

- Emulator and `adb` failures should not leave smoke validation hanging indefinitely.
- A configurable per-command timeout keeps the helper useful for both fast local checks and slower machines.

Validation:

- `ANDROID_SMOKE_ADB_TIMEOUT_MS=abc node scripts/androidSmokeDev.mjs` exited with code `1` and wrote the expected positive-integer error.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `ANDROID_SMOKE_ADB_TIMEOUT_MS=60000 corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The smoke transcript logged `Using adb command timeout: 60000ms`, selected `emulator-5554`, found the expected dashboard texts, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-37.39 - Android warning audit summary artifact

- Branch: `feature/bem-37-warning-audit-summary`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Write a compact `local-docs/android-warning-audit-summary.txt` artifact from `scripts/auditAndroidGradleWarnings.mjs`.
- Keep the full `local-docs/android-warning-audit.log` artifact unchanged.
- Document the summary artifact in `docs/android-modernization-workflow.md`.

Why:

- The full Gradle warning audit log is intentionally verbose.
- A stable small summary makes targeted warning deltas easier to review between mini-branches.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The audit wrote `local-docs/android-warning-audit.log` and `local-docs/android-warning-audit-summary.txt`.
- The summary artifact contains the two current targeted warning sources:
  - `jcenter()` from `node_modules\react-native-camera\android\build.gradle:59`.
  - `execResult` from `node_modules\@sentry\react-native\sentry.gradle:48`.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper selected `emulator-5554`, found the expected dashboard texts, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-37.40 - Android warning audit stable summary

- Branch: `feature/bem-37-warning-audit-stable-summary`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Sort unique targeted Android warning findings before printing and writing `local-docs/android-warning-audit-summary.txt`.
- Keep warning detection and full Gradle log output unchanged.

Why:

- Gradle warning order can shift as task execution changes.
- Stable summary ordering makes maintenance diffs easier to review and compare across mini-branches.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- `local-docs/android-warning-audit-summary.txt` now writes the current targeted findings in stable sorted order:
  - `execResult` from `node_modules\@sentry\react-native\sentry.gradle:48`.
  - `jcenter()` from `node_modules\react-native-camera\android\build.gradle:59`.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper selected `emulator-5554`, found the expected dashboard texts, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-37.41 - Android warning audit finding count

- Branch: `feature/bem-37-warning-audit-count`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Include the targeted warning count in `local-docs/android-warning-audit-summary.txt`.
- Print the same count in the audit helper console output.
- Keep warning detection, sorting, and full Gradle log output unchanged.

Why:

- The summary artifact is now stable and compact.
- A count line makes it quicker to see whether targeted Android warning debt changed after a mini-branch.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- `local-docs/android-warning-audit-summary.txt` starts with `Targeted Android Gradle warnings: 2`.
- The current sorted targeted findings remain:
  - `execResult` from `node_modules\@sentry\react-native\sentry.gradle:48`.
  - `jcenter()` from `node_modules\react-native-camera\android\build.gradle:59`.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper selected `emulator-5554`, found the expected dashboard texts, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-37.42 - Android warning audit exit code summary

- Branch: `feature/bem-37-warning-audit-exit-code`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Include the Android Gradle audit exit code in `local-docs/android-warning-audit-summary.txt`.
- Print the same exit code in the audit helper console output when targeted warnings are found.
- Use the captured exit code consistently for the helper process exit.
- Keep warning detection, sorting, and full Gradle log output unchanged.

Why:

- The compact summary should prove both what targeted warnings were found and whether the Gradle audit itself succeeded.
- This makes the artifact safer to read in isolation during maintenance handoff.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- `local-docs/android-warning-audit-summary.txt` starts with `Android Gradle audit exit code: 0`.
- The summary still reports `Targeted Android Gradle warnings: 2` with the sorted Sentry `execResult` and `react-native-camera` `jcenter()` findings.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn android:dev:smoke` passed on the connected Android emulator.
- The helper selected `emulator-5554`, found the expected dashboard texts, scanned app-process logcat, and captured a non-empty screenshot.

### BEM-37.43 - Android warning audit timeout

- Branch: `feature/bem-37-warning-audit-timeout`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `ANDROID_WARNING_AUDIT_TIMEOUT_MS` support to `scripts/auditAndroidGradleWarnings.mjs`.
- Validate that the timeout is a positive integer before starting Gradle.
- Apply the timeout to the Gradle audit subprocess.
- Record the effective timeout in `local-docs/android-warning-audit-summary.txt`.
- Document the override in `docs/android-modernization-workflow.md`.

Why:

- Android warning audit runs Gradle with `--warning-mode all --stacktrace`, which can hang if the local Gradle/JDK environment wedges.
- A configurable timeout keeps the audit usable as a repeatable maintenance gate.

Validation:

- `ANDROID_WARNING_AUDIT_TIMEOUT_MS=abc node scripts/auditAndroidGradleWarnings.mjs` exits with the expected positive-integer validation error.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passes and records `Android Gradle audit timeout: 300000ms`, exit code `0`, and the two remaining targeted warnings.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `ANDROID_SMOKE_WAIT_MS=20000 JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passes on `emulator-5554`, with expected UI text `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.

### BEM-36.12 - Android smoke UI readiness polling

- Branch: `feature/bem-36-smoke-startup-wait`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add UI hierarchy polling to `scripts/androidSmokeDev.mjs` after the app process and focused window are available.
- Keep `ANDROID_SMOKE_WAIT_MS` as the startup-log delay and add `ANDROID_SMOKE_UI_WAIT_MS` plus `ANDROID_SMOKE_UI_POLL_INTERVAL_MS` for UI readiness.
- Keep writing the latest UI hierarchy to `local-docs/android-smoke-dev-ui.xml`.
- Document the new smoke overrides in `docs/android-modernization-workflow.md`.

Why:

- A clean Metro cache can leave the app on the native bootsplash during the first UI hierarchy read.
- Polling expected UI text avoids false negatives without turning every smoke run into a longer fixed sleep.

Validation:

- `ANDROID_SMOKE_UI_WAIT_MS=abc node scripts/androidSmokeDev.mjs` exits with the expected non-negative-number validation error.
- `ANDROID_SMOKE_UI_POLL_INTERVAL_MS=0 node scripts/androidSmokeDev.mjs` exits with the expected positive-number validation error.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passes on `emulator-5554` with startup wait `8000ms`, UI readiness wait `20000ms`, and expected UI text `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.

### BEM-37.44 - Android warning audit spawn diagnostics

- Branch: `feature/bem-37-warning-audit-spawn-diagnostics`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Record `spawnSync` errors from `scripts/auditAndroidGradleWarnings.mjs` in `local-docs/android-warning-audit.log`.
- Include the same spawn error or signal lines in `local-docs/android-warning-audit-summary.txt`.
- Keep existing warning detection, timeout handling, and exit-code behavior unchanged.
- Document the diagnostic behavior in `docs/android-modernization-workflow.md`.

Why:

- A failed Gradle/JDK subprocess can otherwise leave an empty full log with only exit code `1` in the summary.
- The warning audit is a maintenance gate, so failed setup needs actionable local diagnostics.

Validation:

- `ANDROID_WARNING_AUDIT_TIMEOUT_MS=1 node scripts/auditAndroidGradleWarnings.mjs` exits with code `1` and records `ETIMEDOUT` plus `SIGTERM` in both `local-docs/android-warning-audit.log` and `local-docs/android-warning-audit-summary.txt`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passes and restores the normal summary with exit code `0` plus the two remaining targeted warnings.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`

### BEM-34.2 - Baseline current-state refresh

- Branch: `feature/bem-34-baseline-current-state-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh `docs/wallet-modernization-baseline.md` after the latest Android warning-audit and smoke-helper hardening branches.
- Replace the stale single current-task branch reference with the current focused-branch model.
- Add the current smoke UI readiness polling and warning-audit diagnostic behavior to the validation baseline.

Why:

- The baseline document is used as a current maintenance snapshot, so it should match the actual helper behavior on `upgrade/wallet-modernization`.
- Keeping this in docs avoids overstating that a stale branch is still the active task branch.

Validation:

- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`

### BEM-36.93 - React Native baseline preflight script

- Branch: `feature/bem-36-rn-baseline-preflight`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `rn:baseline:preflight` as the grouped readiness command before larger React Native baseline branches.
- Include the lightweight Android gate, Metro runtime audit, RN upgrade path audit, QR camera migration audit, Sentry warning/source-map readiness audits, Firebase release-service audit, CodePush release-path audit, and push-notification bridge audit in that preflight.
- Guard the preflight script through the RN upgrade path audit and Android dev environment audit.
- Document the preflight in README, Android workflow, RN upgrade path, native-module plan, and baseline docs.

Why:

- Future RN baseline branches should start from one explicit readiness command instead of a manually remembered list of separate audits.
- This keeps the larger RN upgrade path staged without touching runtime, native dependencies, or Metro behavior in this branch.

Validation:

- `corepack yarn check:rn-upgrade-path-audit-guard`
- `corepack yarn check:android-dev-env-audit-guard`
- `corepack yarn rn:upgrade-path:audit`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk ANDROID_HOME=%ANDROID_SDK_ROOT% corepack yarn android:dev:env-audit`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn rn:baseline:preflight`

Notes:

- The preflight passed with existing readiness warnings for Node 22 in the current shell versus the documented Node 16 Metro baseline, missing local Sentry release secrets/properties, and unconfirmed/blank CodePush dev deployment keys.
- No emulator smoke was required because this branch only changes package scripts, audit guards, and documentation.

### BEM-36.94 - React Native target snapshot audit

- Branch: `feature/bem-36-rn-target-snapshot`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/react-native-target-snapshot.md` with the npm target snapshot checked on `2026-05-28`.
- Record `react-native@latest` as `0.85.3`, `next` as `0.86.0-rc.2`, React peer `^19.2.3`, and Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.
- Add `rn:target-snapshot:audit` and `check:rn-target-snapshot-guard`.
- Include the target snapshot guard/audit in `rn:baseline:preflight`.
- Guard the new scripts through the RN upgrade path audit and Android dev environment audit.

Why:

- The modernization target should be explicit without pretending the current branch can jump directly from RN `0.68.7` to the latest npm line.
- The target snapshot makes the React 19 and newer Node/tooling implications visible before package changes start.

Validation:

- `corepack yarn check:rn-target-snapshot-guard`
- `corepack yarn rn:target-snapshot:audit`
- `corepack yarn check:rn-upgrade-path-audit-guard`
- `corepack yarn check:android-dev-env-audit-guard`
- `corepack yarn rn:upgrade-path:audit`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk ANDROID_HOME=%ANDROID_SDK_ROOT% corepack yarn android:dev:env-audit`
- `corepack yarn android:dev:check-light-docs`
- `git diff --check`
- `corepack yarn rn:baseline:preflight`

Notes:

- Snapshot source was npm metadata checked during the branch: `react-native@latest` -> `0.85.3`, `react-native@next` -> `0.86.0-rc.2`, `react-native@0.85.3` peer React -> `^19.2.3`, and Node engine -> `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.
- The preflight passed with the same existing readiness warnings for Node 22 in the current shell versus the documented Node 16 Metro baseline, missing local Sentry release secrets/properties, and unconfirmed/blank CodePush dev deployment keys.
- No emulator smoke was required because this branch only changes package scripts, audit guards, and documentation.

### BEM-36.95 - React Native target live npm check

- Branch: `feature/bem-36-rn-target-live-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `rn:target-snapshot:current` as an explicit network-backed check for the recorded React Native target snapshot.
- Compare current npm metadata for `react-native@latest`, `react-native@next`, the recorded target React peer, and the recorded target Node engine.
- Keep the live npm check out of `rn:baseline:preflight` so the normal preflight remains usable offline.
- Guard the helper file and package script through the Android dev environment audit.
- Document the live check in README, Android workflow, and `docs/react-native-target-snapshot.md`.

Why:

- The target snapshot is intentionally date-stamped and can drift quickly.
- Before a real RN baseline branch, we need a single command that says whether the recorded target still matches npm or needs a refresh.

Validation:

- `corepack yarn rn:target-snapshot:current`
- `corepack yarn rn:target-snapshot:audit`
- `corepack yarn check:rn-target-snapshot-guard`
- `corepack yarn check:android-dev-env-audit-guard`
- `corepack yarn android:dev:check-light-docs`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk ANDROID_HOME=%ANDROID_SDK_ROOT% corepack yarn android:dev:env-audit`

Notes:

- The live npm check confirmed `react-native@latest` is still `0.85.3`, `react-native@next` is still `0.86.0-rc.2`, `react-native@0.85.3` still has React peer `^19.2.3`, and its Node engine still matches the recorded snapshot.
- No emulator smoke was required because this branch only adds a network-backed audit helper, package script, guard coverage, and documentation.

### BEM-36.96 - React Native target live-check guard

- Branch: `feature/bem-36-rn-target-live-check-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Export the live npm snapshot comparison logic from `scripts/checkReactNativeTargetSnapshotCurrent.mjs`.
- Add `check:rn-target-snapshot-current-guard` as an offline self-check for the live comparison rules.
- Cover matching npm metadata, changed `latest`, changed `next`, changed React peer, and missing Node engine fixtures.
- Guard the new helper and package script through the Android dev environment audit.
- Document the offline self-check in README, Android workflow, and target snapshot docs.

Why:

- The network-backed target check should be testable without relying on npm availability.
- Future edits to the live snapshot checker should fail locally if the stale-snapshot detection logic breaks.

Validation:

- `corepack yarn check:rn-target-snapshot-current-guard`
- `corepack yarn rn:target-snapshot:current`
- `corepack yarn rn:target-snapshot:audit`
- `corepack yarn check:android-dev-env-audit-guard`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk ANDROID_HOME=%ANDROID_SDK_ROOT% corepack yarn android:dev:env-audit`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn typescript:check`
- `git diff --check`

Notes:

- The live npm check still confirmed `react-native@latest` as `0.85.3`, `react-native@next` as `0.86.0-rc.2`, React peer `^19.2.3`, and the recorded Node engine.
- The Android dev environment audit passed with the existing Node 22 versus Node 16 Metro-baseline warning.
- No emulator smoke was required because this branch only changes audit helper logic, package scripts, and documentation.

### BEM-36.97 - React Native preflight live-check guard inclusion

- Branch: `feature/bem-36-rn-preflight-live-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:rn-target-snapshot-current-guard` to `rn:baseline:preflight`.
- Keep `rn:target-snapshot:current` out of the default preflight because it requires network access.
- Refresh RN upgrade path, Android workflow, and baseline wording for the offline target comparison guard.
- Keep runtime, dependency, native, and Metro behavior unchanged.

Why:

- The RN baseline preflight should prove both the recorded target snapshot and the stale-snapshot comparison rules without depending on npm availability.
- The live npm check remains an explicit command for branch-start refreshes.

Validation:

- `corepack yarn rn:baseline:preflight`
- `corepack yarn rn:upgrade-path:audit`
- `corepack yarn check:rn-upgrade-path-audit-guard`
- `corepack yarn android:dev:check-light-docs`
- `git diff --check`

Notes:

- The preflight now includes `check:rn-target-snapshot-current-guard` and passed.
- The live npm check remains explicit and outside the default preflight.
- The run still reports the known readiness warnings for Node 22 versus the Node 16 Metro baseline, missing local Sentry release secrets/properties, and unconfirmed/blank CodePush dev deployment keys.
- No emulator smoke was required because this branch only changes package scripts, audit expectations, and documentation.

### BEM-36.98 - React 19 impact audit

- Branch: `feature/bem-36-react19-impact-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/react19-impact-audit.md` for the React 19 impact implied by the RN target snapshot.
- Add `react19:impact:audit` and `check:react19-impact-guard`.
- Include the React 19 impact guard and audit in `rn:baseline:preflight`.
- Guard the new helper files and package scripts through the Android dev environment audit.
- Link the React 19 impact audit from the RN upgrade path, RN target snapshot, baseline, Android workflow, and README.

Why:

- The current RN target snapshot points at React peer `^19.2.3`, while the app is still on React `17.0.2`, `@types/react@^16.9.31`, and `react-test-renderer@17.0.2`.
- Before changing React/RN packages, the class-component, default-props, refs, hook, and renderer/type-package surfaces should be explicit.

Observed inventory:

- Source files scanned: `320`
- Class component files: `23`
- `componentWillUnmount` files: `16`
- `static defaultProps` files: `1`
- Function component type files: `8`
- `createRef` files: `8`

Validation:

- `corepack yarn check:react19-impact-guard`
- `corepack yarn react19:impact:audit`
- `corepack yarn check:rn-upgrade-path-audit-guard`
- `corepack yarn rn:upgrade-path:audit`
- `corepack yarn rn:baseline:preflight`
- `corepack yarn check:android-dev-env-audit-guard`
- `corepack yarn android:dev:check-light-docs`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk ANDROID_HOME=%ANDROID_SDK_ROOT% corepack yarn android:dev:verify`

Notes:

- The RN preflight passed with the new React 19 impact guard and audit.
- The preflight still reports the existing readiness warnings for Node 22 versus the Node 16 Metro baseline, missing local Sentry release secrets/properties, and unconfirmed/blank CodePush dev deployment keys.
- Android dev verify built the dev APK, installed it on `emulator-5554`, and smoke validated `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive` with no fatal AndroidRuntime or React Native runtime logcat findings.

### BEM-36.99 - React package coupling audit

- Branch: `feature/bem-36-react-package-coupling-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/react-package-coupling-audit.md`.
- Add `react:package-coupling:audit` and `check:react-package-coupling-guard`.
- Guard the current React-coupled package set: `react@17.0.2`, `@types/react@^16.9.31`, `@types/react-native@^0.63.37`, and `react-test-renderer@17.0.2`.
- Include the coupling guard and audit in `rn:baseline:preflight`.
- Link the coupling audit from React 19 impact, RN upgrade path, baseline, Android workflow, and README.

Why:

- The RN target snapshot points at React `^19.2.3`, so React, renderer, type packages, TypeScript, Jest, and emulator smoke should move as a coordinated baseline.
- This prevents accidental partial React package updates before the dedicated React/RN baseline branch.

Validation:

- `corepack yarn check:react-package-coupling-guard`
- `corepack yarn react:package-coupling:audit`
- `corepack yarn check:rn-upgrade-path-audit-guard`
- `corepack yarn check:android-dev-env-audit-guard`
- `corepack yarn rn:upgrade-path:audit`
- `corepack yarn react19:impact:audit`
- `corepack yarn android:dev:check-light-docs`
- `git diff --check`
- `corepack yarn rn:baseline:preflight`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk ANDROID_HOME=%ANDROID_SDK_ROOT% corepack yarn android:dev:verify`

Notes:

- The RN baseline preflight passed with the new React package coupling guard and audit.
- The preflight still reports the existing readiness warnings for Node 22 versus the Node 16 Metro baseline, missing local Sentry release secrets/properties, and unconfirmed/blank CodePush dev deployment keys.
- Android dev verify built the dev APK, installed it on `emulator-5554`, and smoke validated `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive` with no fatal AndroidRuntime or React Native runtime logcat findings.

### BEM-36.100 - Test/type coupling audit

- Branch: `feature/bem-36-test-type-coupling-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/test-type-coupling-audit.md`.
- Add `test:type-coupling:audit` and `check:test-type-coupling-guard`.
- Guard the current test/type baseline: `typescript@^4.0.3`, `jest@26.6.3`, `babel-jest@^26.6.3`, `ts-jest@^26.4.1`, `react-test-renderer@17.0.2`, TS target `ES2019`, TS JSX mode `react-native`, and `skipLibCheck: true`.
- Include the test/type guard and audit in `rn:baseline:preflight`.
- Link the audit from React package coupling, React 19 impact, RN upgrade path, baseline, Android workflow, and README.

Why:

- The next React/RN baseline can pull TypeScript, Jest, renderer, and type-package behavior together, so the current coupling needs to be explicit before package movement starts.
- This prevents an isolated TypeScript/Jest bump from changing type-check or test runtime behavior outside the dedicated React/RN baseline branch.

Validation:

- `corepack yarn check:test-type-coupling-guard`
- `corepack yarn test:type-coupling:audit`
- `corepack yarn check:rn-upgrade-path-audit-guard`
- `corepack yarn check:android-dev-env-audit-guard`
- `corepack yarn rn:upgrade-path:audit`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn rn:baseline:preflight`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk ANDROID_HOME=%ANDROID_SDK_ROOT% corepack yarn android:dev:verify`

Notes:

- The RN baseline preflight passed with the new test/type coupling guard and audit.
- The preflight still reports the existing readiness warnings for Node 22 versus the Node 16 Metro baseline, missing local Sentry release secrets/properties, and unconfirmed/blank CodePush dev deployment keys.
- Android dev verify built the dev APK, installed it on `emulator-5554`, and smoke validated `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive` with no fatal AndroidRuntime or React Native runtime logcat findings.

### BEM-36.101 - Test/type focused validation guard

- Branch: `feature/bem-36-test-type-focused-validation`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend `test:type-coupling:audit` so it also guards the deterministic focused Jest coverage required before TypeScript/Jest/React/RN baseline changes.
- Guard package scripts and existing files for `test:unit`, `test:storage`, `test:authenticator`, `test:watchonly:offline`, `test:hdwallet:offline`, and `test:wallet-core:offline`.
- Guard that those focused scripts remain in `prepush`.
- Document the focused validation contract in `docs/test-type-coupling-audit.md`.

Why:

- Version coupling alone is not enough for the next RN/React/TypeScript step; the branch should also prove that the offline tests used for wallet core, storage, authenticators, watch-only, and HD wallet behavior remain runnable.
- Keeping the focused scripts in `prepush` preserves a deterministic gate while the full legacy Jest suite still has known network/env blockers.

Validation:

- `corepack yarn check:test-type-coupling-guard`
- `corepack yarn test:type-coupling:audit`
- `corepack yarn test:unit`
- `corepack yarn test:storage`
- `corepack yarn test:authenticator`
- `corepack yarn test:watchonly:offline`
- `corepack yarn test:hdwallet:offline`
- `corepack yarn test:wallet-core:offline`
- `corepack yarn rn:baseline:preflight`
- `corepack yarn typescript:check`
- `git diff --check`

Notes:

- The focused test audit reports `Focused validation files: 7/7`.
- The guarded focused Jest scripts all passed.

### BEM-36.102 - Node runtime transition audit

- Branch: `feature/bem-36-node-runtime-transition-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/node-runtime-transition-audit.md`.
- Add `node:runtime-transition:audit` and `check:node-runtime-transition-guard`.
- Guard the current Metro/dev Node baseline at `.nvmrc` `16.20.2`, React Native `0.68.7`, and Metro Babel preset `0.67.0`.
- Record the RN target snapshot implication: `react-native@0.85.3` currently requires Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.
- Include the Node runtime transition guard and audit in `rn:baseline:preflight`.
- Link the audit from the RN target snapshot, RN upgrade path, baseline, and Android workflow docs.

Why:

- The future RN baseline cannot be treated as only a package bump; the RN target snapshot implies a Node tooling move away from the current Node 16 Metro baseline.
- `.nvmrc` should not be changed as a standalone cleanup before the branch that owns Metro, Jest, React Native CLI, Android build, and emulator validation.

Validation:

- `corepack yarn check:node-runtime-transition-guard`
- `corepack yarn node:runtime-transition:audit`
- `corepack yarn check:rn-upgrade-path-audit-guard`
- `corepack yarn check:android-dev-env-audit-guard`
- `corepack yarn rn:upgrade-path:audit`
- `corepack yarn rn:target-snapshot:audit`
- `corepack yarn android:dev:check-light-docs`
- `corepack yarn rn:baseline:preflight`
- `corepack yarn typescript:check`
- `git diff --check`

Notes:

- The RN baseline preflight passed with the new Node runtime transition guard and audit.
- The preflight still reports the existing warning that this shell is Node `22.18.0` while the current Metro/dev baseline remains documented as Node `16.20.2`.
- No dependency, runtime, native, or Metro behavior was changed in this branch.

### BEM-36.103 - RN target live summary artifact

- Branch: `feature/bem-36-rn-target-live-summary`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `rn:target-snapshot:current` write `local-docs/rn-target-snapshot-current-summary.txt`.
- Include generated timestamp, recorded snapshot date, live check outcome, compared npm fields, and mismatch count.
- Extend `check:rn-target-snapshot-current-guard` so the summary formatter is covered by matched and stale fixtures.
- Document the local summary artifact in `docs/react-native-target-snapshot.md`.

Why:

- The RN target snapshot depends on npm metadata that can drift; a short local artifact makes the live verification result reviewable without re-running the command.
- This keeps the external RN target evidence aligned with the rest of the modernization audit artifacts under `local-docs/`.

Validation:

- `corepack yarn check:rn-target-snapshot-current-guard`
- `corepack yarn rn:target-snapshot:current`
- `Get-Content local-docs\rn-target-snapshot-current-summary.txt`
- `corepack yarn rn:target-snapshot:audit`
- `corepack yarn rn:baseline:preflight`
- `corepack yarn typescript:check`
- `git diff --check`

Notes:

- The generated summary reported `Live check outcome: matched` and `Mismatches: 0`.
- The live npm check still matched `react-native@latest` `0.85.3`, `next` `0.86.0-rc.2`, React peer `^19.2.3`, and Node engine `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`.
- No dependency, runtime, native, or Metro behavior was changed in this branch.

### BEM-36.104 - RN target summary artifact checker

- Branch: `feature/bem-36-rn-target-summary-checker`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `rn:target-snapshot:check-summary` to validate `local-docs/rn-target-snapshot-current-summary.txt`.
- Add `check:rn-target-snapshot-summary-guard` for offline self-check coverage of the summary validator.
- Validate summary header, generated timestamp, snapshot date, outcome, mismatch count, and all four compared npm metadata lines.
- Guard the new helper files and package scripts through the Android dev environment audit.
- Document the summary checker in `docs/react-native-target-snapshot.md`.

Why:

- `rn:target-snapshot:current` now writes a reviewable local artifact; this branch makes the artifact itself machine-checkable.
- The checker keeps the live RN target evidence consistent without putting a network-backed command into the default offline preflight.

Validation:

- `corepack yarn check:rn-target-snapshot-summary-guard`
- `corepack yarn rn:target-snapshot:current`
- `corepack yarn rn:target-snapshot:check-summary`
- `corepack yarn check:android-dev-env-audit-guard`
- `corepack yarn rn:target-snapshot:audit`
- `corepack yarn rn:baseline:preflight`
- `corepack yarn typescript:check`
- `git diff --check`

Notes:

- The summary checker accepted the generated live npm summary artifact.
- The generated summary still reported `Live check outcome: matched` and `Mismatches: 0`.
- No dependency, runtime, native, or Metro behavior was changed in this branch.

### BEM-36.16 - Android smoke summary Metro status

- Branch: `feature/bem-36-smoke-summary-metro-status`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `Metro reachable: yes/no` to `local-docs/android-smoke-dev-summary.txt`.
- Set the field from the existing Metro preflight result in `scripts/androidSmokeDev.mjs`.
- Document the summary field in `docs/android-modernization-workflow.md` and `docs/wallet-modernization-baseline.md`.
- Keep smoke pass/fail behavior unchanged.

Why:

- The summary already records the Metro endpoint, but the preflight result should be visible without reading the full transcript.
- This makes the artifact clearer when smoke fails before an Android device is selected.

Validation:

- `ANDROID_SMOKE_METRO_PORT=65534 ANDROID_SMOKE_METRO_TIMEOUT_MS=500 node scripts/androidSmokeDev.mjs` exits with code `1` and writes `Metro reachable: no` to `local-docs/android-smoke-dev-summary.txt`.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passes on `emulator-5554` and writes `Metro reachable: yes` to `local-docs/android-smoke-dev-summary.txt`.

### BEM-36.17 - Android smoke summary UI hierarchy path

- Branch: `feature/bem-36-smoke-summary-ui-path`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `UI hierarchy path` to `local-docs/android-smoke-dev-summary.txt`.
- Keep smoke runtime behavior and artifact locations unchanged.
- Refresh the baseline description of smoke summary fields.

Why:

- The summary already points to the screenshot artifact.
- Adding the UI hierarchy path makes the summary a complete index of the two primary visual/debug artifacts.

Validation:

- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passes on `emulator-5554` and writes `UI hierarchy path` to `local-docs/android-smoke-dev-summary.txt`.

### BEM-37.45 - Android warning audit summary log path

- Branch: `feature/bem-37-warning-audit-summary-log-path`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `Android Gradle audit log path` to `local-docs/android-warning-audit-summary.txt`.
- Keep warning detection, timeout handling, diagnostics, and exit-code behavior unchanged.
- Refresh workflow and baseline documentation for the audit summary fields.

Why:

- The warning audit summary should be a complete index of the corresponding verbose log artifact.
- This mirrors the smoke summary's artifact-path fields and makes handoff easier.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passes and writes `Android Gradle audit log path` to `local-docs/android-warning-audit-summary.txt`.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passes on `emulator-5554`.

### BEM-36.18 - Android validation artifact checker

- Branch: `feature/bem-36-android-validation-artifact-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/checkAndroidValidationArtifacts.mjs`.
- Add `android:dev:check-artifacts` package script.
- Validate that the latest smoke summary passed, Metro was reachable, referenced UI/screenshot artifacts exist, and logcat/screenshot counters are positive.
- Validate that the latest Android warning audit summary has exit code `0`, a positive targeted warning count, and a non-empty full log artifact.
- Document the checker in the Android workflow and baseline.

Why:

- Smoke and warning-audit now produce compact summaries, but repeated maintenance work benefits from a single sanity command.
- This catches stale or missing local validation artifacts before a branch is treated as ready.

Validation:

- `corepack yarn android:dev:check-artifacts` passes on the existing smoke and warning-audit summaries.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- `corepack yarn android:dev:check-artifacts` passes again after fresh audit and smoke artifacts are written.

### BEM-36.19 - Android artifact checker zero-warning support

- Branch: `feature/bem-36-artifact-check-warning-zero`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Allow `Targeted Android Gradle warnings: 0` in `scripts/checkAndroidValidationArtifacts.mjs`.
- Keep positive-integer checks for smoke counters such as app PID, logcat lines, UI attempts, and screenshot bytes.
- Document that zero targeted warning findings is a valid future state.

Why:

- The checker should not block the desired cleanup outcome where Sentry and camera warning sources are eventually removed.
- The current branch still validates against the existing count of `2`, but the check should be future-proof.

Validation:

- `corepack yarn android:dev:check-artifacts` passes on the existing artifacts.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke`
- `corepack yarn android:dev:check-artifacts` passes again after fresh audit and smoke artifacts are written.

### BEM-36.20 - Android validation summary timestamps

- Branch: `feature/bem-36-validation-summary-timestamps`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `Generated at` ISO timestamps to `local-docs/android-smoke-dev-summary.txt` and `local-docs/android-warning-audit-summary.txt`.
- Validate those timestamp fields in `scripts/checkAndroidValidationArtifacts.mjs`.
- Refresh workflow and baseline documentation for the summary timestamp fields.
- Keep smoke and warning-audit pass/fail behavior unchanged.

Why:

- The local artifacts are overwritten repeatedly during maintenance work.
- Timestamps make it easier to see whether a summary belongs to the latest validation run.

Validation:

- `corepack yarn android:dev:check-artifacts` failed against the previous local summaries as expected because they did not yet include `Generated at`.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed and wrote `Generated at: 2026-05-27T18:56:56.337Z` to `local-docs/android-warning-audit-summary.txt`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passed on `emulator-5554`, found `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`, and wrote `Generated at: 2026-05-27T18:57:23.687Z` to `local-docs/android-smoke-dev-summary.txt`.
- `corepack yarn android:dev:check-artifacts` passed after fresh audit and smoke artifacts were written.

### BEM-37.46 - Android warning baseline guard

- Branch: `feature/bem-37-warning-baseline-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `scripts/auditAndroidGradleWarnings.mjs` fail when targeted Android Gradle warning sources appear outside the known baseline.
- Keep the current known `@sentry/react-native` `execResult` and `react-native-camera` `jcenter()` sources allowed.
- Add `Android Gradle warning baseline guard exit code` and `Unexpected targeted Android Gradle warnings` to `local-docs/android-warning-audit-summary.txt`.
- Make `scripts/checkAndroidValidationArtifacts.mjs` verify the warning baseline guard result.
- Refresh Android workflow and baseline documentation for the guard.

Why:

- The audit already identifies the remaining warning debt.
- Failing only on new targeted sources keeps the current cleanup stream stable while preventing new Android Gradle warning debt from being added silently.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The warning audit summary recorded `Android Gradle warning baseline guard exit code: 0`, `Targeted Android Gradle warnings: 2`, and `Unexpected targeted Android Gradle warnings: 0`.
- `corepack yarn android:dev:check-artifacts` passed with the refreshed warning audit summary and existing smoke summary artifacts.

### BEM-37.47 - Android warning baseline guard path separators

- Branch: `feature/bem-37-warning-baseline-guard-paths`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make the Android warning baseline guard accept both Windows `\` and Unix `/` path separators for known warning sources.
- Keep the allowed warning sources unchanged: Sentry `execResult` and `react-native-camera` `jcenter()`.
- Keep audit output and artifact checker behavior unchanged.

Why:

- The warning audit runs locally on Windows now, but the same guard should not fail falsely on CI or another developer machine that prints Gradle stack paths with `/`.

Validation:

- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The warning audit summary recorded `Android Gradle warning baseline guard exit code: 0`, `Targeted Android Gradle warnings: 2`, and `Unexpected targeted Android Gradle warnings: 0` after the separator-tolerant patterns.
- `corepack yarn android:dev:check-artifacts` passed with the refreshed warning audit summary.

### BEM-37.48 - Android warning baseline guard self-check

- Branch: `feature/bem-37-warning-guard-self-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extract Android warning baseline guard classification into `scripts/androidWarningBaselineGuard.mjs`.
- Add `scripts/checkAndroidWarningBaselineGuard.mjs` to validate known Windows and Unix warning paths.
- Add `android:dev:check-warning-guard` as a fast local check for the warning baseline patterns.
- Keep the Gradle audit output and allowed warning sources unchanged.

Why:

- The warning baseline guard now protects the Android modernization stream.
- A cheap self-check catches accidental pattern drift without requiring a full Gradle warning audit every time.

Validation:

- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed after the guard extraction.
- The warning audit summary recorded `Android Gradle warning baseline guard exit code: 0`, `Targeted Android Gradle warnings: 2`, and `Unexpected targeted Android Gradle warnings: 0`.
- `corepack yarn android:dev:check-artifacts` passed with the refreshed warning audit summary.

### BEM-37.49 - Android warning guard pre-push gate

- Branch: `feature/bem-37-warning-guard-prepush`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:check-warning-guard` to the beginning of the `prepush` script.
- Keep the existing TypeScript and Jest pre-push gates unchanged.
- Keep Android runtime, Gradle build, and dependency versions unchanged.

Why:

- The warning baseline guard now protects the Android maintenance stream.
- Running the cheap self-check before the heavier pre-push checks catches accidental guard drift early.

Validation:

- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn prepush` passed with the new warning guard first, followed by shim check, TypeScript, unit tests, and the promoted offline integration suites.

### BEM-37.50 - Android warning guard workflow docs

- Branch: `feature/bem-37-warning-guard-workflow-docs`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:check-warning-guard` to the normal Android mini-branch checks in `docs/android-modernization-workflow.md`.
- Document the warning guard self-check as the fast non-Gradle validation path for warning baseline patterns.
- Refresh `docs/wallet-modernization-baseline.md` so the current validation baseline includes the warning guard and pre-push ordering.
- Keep package scripts, runtime code, and dependency versions unchanged.

Why:

- The warning guard is now part of the actual `prepush` gate.
- The workflow and baseline docs should match the current validation surface so future mini-branches run the same checks consistently.

Validation:

- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-36.21 - Android audit and smoke validation script

- Branch: `feature/bem-36-android-dev-audit-smoke-script`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:audit-smoke` to run warning audit, emulator smoke, and artifact consistency check in one command.
- Document the command in the Android modernization workflow.
- Refresh the current validation baseline with the combined command.
- Keep Android runtime, native code, Gradle configuration, and dependency versions unchanged.

Why:

- The repeated maintenance loop requires running `android:dev:audit-warnings`, `android:dev:smoke`, and `android:dev:check-artifacts` together.
- A single script reduces the chance of refreshing audit/smoke artifacts but forgetting the final consistency checker.

Validation:

- `corepack yarn android:dev:check-warning-guard` passed.
- `git diff --check` passed.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-smoke` passed.
- The combined script refreshed warning audit, emulator smoke, and artifact checker evidence in one run.
- Smoke summary recorded `Generated at: 2026-05-27T19:22:40.185Z`, `Android smoke outcome: passed`, `Metro reachable: yes`, and the expected dashboard texts on `emulator-5554`.
- Warning audit summary recorded `Generated at: 2026-05-27T19:22:24.148Z`, `Android Gradle warning baseline guard exit code: 0`, `Targeted Android Gradle warnings: 2`, and `Unexpected targeted Android Gradle warnings: 0`.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.

### BEM-36.22 - README Android audit-smoke command

- Branch: `feature/bem-36-readme-audit-smoke-command`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:audit-smoke` to the README Android development verification section.
- Explain that the command runs warning audit, emulator smoke, and validation-artifact checker in sequence.
- Keep package scripts, runtime code, native code, and dependencies unchanged.

Why:

- `android:dev:audit-smoke` is now the shortest reliable validation path for Android maintenance branches that need both warning and runtime smoke evidence.
- The README should expose that command next to the existing `android:dev:verify` flow.

Validation:

- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.51 - Camera usage scope guard

- Branch: `feature/bem-camera-usage-scope-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/checkCameraUsageScope.mjs` to guard the current `react-native-camera` runtime usage surface.
- Add `check:camera-usage-scope` package script.
- Update `docs/camera-replacement-plan.md` so the future QR scanner migration starts from an enforced usage scope.
- Keep runtime code, native code, Gradle configuration, and dependencies unchanged.

Why:

- `react-native-camera` replacement is a larger follow-up, not a warning-only cleanup.
- Before that migration, the current camera dependency should remain isolated to `src/screens/ScanQrCodeScreen.tsx` so the replacement scope stays controlled.

Validation:

- `corepack yarn check:camera-usage-scope` passed and confirmed `react-native-camera` runtime usage is scoped to `ScanQrCodeScreen`.
- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.52 - Camera usage scope pre-push gate

- Branch: `feature/bem-camera-usage-prepush`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:camera-usage-scope` to the `prepush` script after the Android warning guard.
- Refresh `docs/wallet-modernization-baseline.md` so the current validation baseline includes the camera usage-scope guard and pre-push ordering.
- Keep runtime code, native code, dependency versions, and existing Jest gates unchanged.

Why:

- `react-native-camera` replacement is planned as a dedicated QR scanner migration.
- Running the usage-scope guard during pre-push keeps the dependency isolated to `ScanQrCodeScreen` until that migration starts.

Validation:

- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn prepush` passed with Android warning guard, camera usage-scope guard, shim guard, TypeScript, unit tests, and the promoted offline integration suites.

### BEM-37.53 - Camera usage scope workflow docs

- Branch: `feature/bem-camera-usage-workflow-docs`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:camera-usage-scope` to the normal mini-branch checks in `docs/android-modernization-workflow.md`.
- Explain that the guard keeps `react-native-camera` runtime usage isolated to `ScanQrCodeScreen` until the QR scanner migration branch.
- Keep package scripts, runtime code, native code, dependency versions, and validation behavior unchanged.

Why:

- The camera usage guard is now part of `prepush`.
- The Android workflow should match the actual validation surface used by maintenance mini-branches.

Validation:

- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.54 - Camera usage guard require detection

- Branch: `feature/bem-camera-usage-require-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extend `scripts/checkCameraUsageScope.mjs` to detect `require('react-native-camera')` and dynamic `import('react-native-camera')`.
- Keep the allowed runtime usage file unchanged: `src/screens/ScanQrCodeScreen.tsx`.
- Keep package scripts, runtime code, native code, and dependencies unchanged.

Why:

- The camera usage guard should catch CommonJS and dynamic-import usage as well as static imports and `RNCamera` symbols.
- This keeps the future QR scanner migration scope controlled even if a new file tries to load the camera dependency through a different import style.

Validation:

- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.55 - Sentry usage scope guard

- Branch: `feature/bem-sentry-usage-scope-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/checkSentryUsageScope.mjs` to guard current `@sentry/react-native` runtime imports.
- Add `check:sentry-usage-scope` package script.
- Update `docs/sentry-release-source-map-plan.md` so the future Sentry upgrade starts from an enforced usage scope.
- Keep runtime code, native code, Gradle configuration, and dependencies unchanged.

Why:

- The remaining Sentry Gradle warning is a dedicated release/source-map tooling follow-up.
- Before that upgrade, Sentry runtime usage should stay limited to `App.tsx`, `Main.tsx`, and `logger/index.ts` so the migration surface is clear.

Validation:

- `corepack yarn check:sentry-usage-scope` passed and confirmed `@sentry/react-native` runtime usage is scoped to `App.tsx`, `Main.tsx`, and `logger/index.ts`.
- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.56 - Sentry usage prepush guard

- Branch: `feature/bem-sentry-usage-prepush`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:sentry-usage-scope` to the `prepush` script after the Android warning and camera usage guards.
- Refresh `docs/wallet-modernization-baseline.md` so the current passing checklist includes the Sentry usage guard.
- Keep runtime code, native code, Gradle configuration, dependencies, and Metro behavior unchanged.

Why:

- Sentry remains a dedicated release/source-map tooling follow-up, so accidental new runtime imports should fail before push.
- Keeping the guard in `prepush` makes the Sentry migration surface stable while larger dependency work continues in later branches.

Validation:

- `corepack yarn check:sentry-usage-scope` passed and confirmed `@sentry/react-native` runtime usage is scoped to `App.tsx`, `Main.tsx`, and `logger/index.ts`.
- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn prepush` passed, including Android warning guard, camera usage guard, Sentry usage guard, nodeify shim guard, TypeScript, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.57 - Sentry usage workflow docs

- Branch: `feature/bem-sentry-usage-workflow-docs`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:sentry-usage-scope` to the normal mini-branch checklist in `docs/android-modernization-workflow.md`.
- Document the current allowed Sentry runtime usage files.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, and Metro behavior unchanged.

Why:

- The workflow document should match the enforced `prepush` gate after `BEM-37.56`.
- The dedicated future Sentry release/source-map branch should start from a documented and guarded runtime usage surface.

Validation:

- `corepack yarn check:sentry-usage-scope` passed.
- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.58 - Android warning artifact source guard

- Branch: `feature/bem-warning-artifact-source-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Make `scripts/checkAndroidValidationArtifacts.mjs` verify targeted warning summary entries with the shared Android warning baseline guard.
- Fail artifact validation if the targeted warning count does not match the listed warning sources.
- Refresh baseline and workflow documentation for the stronger artifact checker.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, and Metro behavior unchanged.

Why:

- The warning audit already blocks unexpected sources when it runs, but stored validation summaries should also stay internally consistent.
- This keeps the remaining Sentry `execResult` and `react-native-camera` `jcenter()` warnings constrained while still allowing the desired future state of `0` targeted warnings.

Validation:

- `corepack yarn android:dev:check-artifacts` passed and verified the current warning summary sources against the shared Android warning baseline guard.
- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:sentry-usage-scope` passed.
- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.59 - Android warning artifact guard self-check

- Branch: `feature/bem-warning-artifact-guard-self-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extract warning-summary source validation into `scripts/androidValidationArtifactsGuard.mjs`.
- Add `scripts/checkAndroidValidationArtifactGuard.mjs` with positive checks for known sources and zero-warning target state.
- Add negative checks for mismatched warning count and unexpected warning sources.
- Add `android:dev:check-artifact-guard` package script and document it in the Android workflow/baseline.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- `BEM-37.58` made artifact validation stricter; this branch gives that stricter logic a fast self-check that does not require Gradle, Metro, or emulator state.
- The guard should continue allowing the desired future cleanup outcome where targeted warning count becomes `0`.

Validation:

- `corepack yarn android:dev:check-artifact-guard` passed.
- `corepack yarn android:dev:check-artifacts` passed.
- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn check:sentry-usage-scope` passed.
- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.60 - Android warning artifact guard prepush

- Branch: `feature/bem-warning-artifact-guard-prepush`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:check-artifact-guard` to `prepush` after the Android warning baseline guard.
- Refresh `docs/wallet-modernization-baseline.md` so the prepush gate documents the warning artifact guard.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- The warning artifact source guard has a fast self-check, so it should run with the rest of the lightweight prepush guards.
- This protects the Android warning validation tooling before the larger camera/Sentry cleanup branches.

Validation:

- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn android:dev:check-artifact-guard` passed.
- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn check:sentry-usage-scope` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- `corepack yarn prepush` passed, including Android warning guard, Android warning artifact guard, camera usage guard, Sentry usage guard, nodeify shim guard, TypeScript, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.61 - Android warning artifact workflow checklist

- Branch: `feature/bem-warning-artifact-workflow-checklist`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:check-artifact-guard` to the normal mini-branch checklist in `docs/android-modernization-workflow.md`.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Why:

- `BEM-37.60` made the artifact guard part of `prepush`; the human workflow checklist should match the enforced gate.
- This keeps future Android warning cleanup branches running the same lightweight validation locally before commit.

Validation:

- `corepack yarn android:dev:check-warning-guard` passed.
- `corepack yarn android:dev:check-artifact-guard` passed.
- `corepack yarn check:camera-usage-scope` passed.
- `corepack yarn check:sentry-usage-scope` passed.
- `corepack yarn check:rn-nodeify-shims` passed.
- `corepack yarn typescript:check` passed.
- `git diff --check` passed.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.62 - Android lightweight check script

- Branch: `feature/bem-android-lightweight-check-script`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `android:dev:check-light` as the aggregate lightweight validation command for Android maintenance branches.
- Make `prepush` run `android:dev:check-light` before the promoted offline Jest suites.
- Refresh Android workflow and baseline documentation to use the aggregate command.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- The normal maintenance checklist and `prepush` had started duplicating the same guard sequence.
- A single aggregate command makes future mini-branches easier to validate consistently before commits.

Validation:

- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard, Sentry usage guard, nodeify shim guard, and TypeScript.
- `git diff --check` passed.
- `corepack yarn prepush` passed, including `android:dev:check-light`, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.63 - Android lightweight whitespace check

- Branch: `feature/bem-check-light-whitespace`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:diff-whitespace` as a package script for `git diff --check`.
- Include `check:diff-whitespace` in `android:dev:check-light`.
- Refresh Android workflow and baseline documentation so the aggregate command fully covers the normal mini-branch checklist.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- The normal checklist still had `git diff --check` as a separate manual command after `BEM-37.62`.
- Folding whitespace validation into `android:dev:check-light` keeps the lightweight branch gate and `prepush` aligned.

Validation:

- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard, Sentry usage guard, nodeify shim guard, TypeScript, and diff whitespace check.
- `corepack yarn prepush` passed, including `android:dev:check-light`, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.64 - QR scanner caller guard

- Branch: `feature/bem-qr-scan-caller-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `scripts/checkQrScanCallers.mjs` to guard the current `Route.ScanQrCode` navigation caller inventory.
- Add `check:qr-scan-callers` package script and include it in `android:dev:check-light`.
- Refresh the camera replacement plan, Android workflow, and baseline documentation for the caller guard.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- The future camera/QR scanner migration must preserve all scanner entry points, not just the `ScanQrCodeScreen` implementation.
- A lightweight caller inventory guard makes the migration surface explicit before replacing `react-native-camera`.

Validation:

- `corepack yarn check:qr-scan-callers` passed and confirmed 8 current QR scanner callers.
- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard, QR scanner caller guard, Sentry usage guard, nodeify shim guard, TypeScript, and diff whitespace check.
- `corepack yarn prepush` passed, including `android:dev:check-light`, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.65 - QR scanner caller guard self-check

- Branch: `feature/bem-qr-scan-caller-self-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extract QR scanner caller inventory comparison into `scripts/qrScanCallerGuard.mjs`.
- Add `scripts/checkQrScanCallerGuard.mjs` with positive and negative guard fixture checks.
- Add `check:qr-scan-caller-guard` package script and include it in `android:dev:check-light`.
- Refresh the camera replacement plan, Android workflow, and baseline documentation for the self-check.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- `BEM-37.64` introduced a repo scanner for QR caller inventory; this branch gives the comparison logic a fast self-check.
- The future camera migration should fail fast if either a caller is accidentally removed from the inventory or a new caller is introduced without updating the migration plan.

Validation:

- `corepack yarn check:qr-scan-caller-guard` passed.
- `corepack yarn check:qr-scan-callers` passed and confirmed 8 current QR scanner callers.
- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard, QR scanner caller guard self-check, QR scanner caller inventory guard, Sentry usage guard, nodeify shim guard, TypeScript, and diff whitespace check.
- `corepack yarn prepush` passed, including `android:dev:check-light`, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.66 - Camera usage guard self-check

- Branch: `feature/bem-camera-usage-self-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extract `react-native-camera` usage scope comparison into `scripts/cameraUsageGuard.mjs`.
- Add `scripts/checkCameraUsageGuard.mjs` with positive and negative guard fixture checks.
- Add `check:camera-usage-guard` package script and include it in `android:dev:check-light`.
- Refresh the camera replacement plan, Android workflow, and baseline documentation for the self-check.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- The camera usage inventory guard is now part of the lightweight gate; this branch gives the allowlist comparison logic a fast self-check.
- The future camera migration should fail fast if `react-native-camera` usage moves outside `ScanQrCodeScreen` or disappears before the planned replacement branch.

Validation:

- `corepack yarn check:camera-usage-guard` passed.
- `corepack yarn check:camera-usage-scope` passed and confirmed `react-native-camera` runtime usage is scoped to `src/screens/ScanQrCodeScreen.tsx`.
- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard self-check, camera usage inventory guard, QR scanner caller guard self-check, QR scanner caller inventory guard, Sentry usage guard, nodeify shim guard, TypeScript, and diff whitespace check.
- `corepack yarn prepush` passed, including `android:dev:check-light`, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.67 - Sentry usage guard self-check

- Branch: `feature/bem-sentry-usage-self-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extract `@sentry/react-native` usage scope comparison into `scripts/sentryUsageGuard.mjs`.
- Add `scripts/checkSentryUsageGuard.mjs` with positive and negative guard fixture checks.
- Add `check:sentry-usage-guard` package script and include it in `android:dev:check-light`.
- Refresh the Sentry release/source-map plan, Android workflow, and baseline documentation for the self-check.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- The Sentry usage inventory guard is part of the lightweight gate; this branch gives the allowlist comparison logic a fast self-check.
- The future Sentry release/source-map upgrade should fail fast if Sentry imports move outside `App.tsx`, `Main.tsx`, and `logger/index.ts`.

Validation:

- `corepack yarn check:sentry-usage-guard` passed.
- `corepack yarn check:sentry-usage-scope` passed and confirmed `@sentry/react-native` runtime usage is scoped to `App.tsx`, `Main.tsx`, and `logger/index.ts`.
- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard self-check, camera usage inventory guard, QR scanner caller guard self-check, QR scanner caller inventory guard, Sentry usage guard self-check, Sentry usage inventory guard, nodeify shim guard, TypeScript, and diff whitespace check.
- `corepack yarn prepush` passed, including `android:dev:check-light`, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.68 - RN nodeify shim guard self-check

- Branch: `feature/bem-rn-nodeify-shim-self-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extract RN nodeify shim marker validation into `scripts/rnNodeifyShimGuard.mjs`.
- Add `scripts/checkRnNodeifyShimGuard.mjs` with positive and negative guard fixture checks.
- Add `check:rn-nodeify-shim-guard` package script and include it in `android:dev:check-light`.
- Refresh Android workflow and baseline documentation for the self-check.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- `rn-nodeify` patches are required for existing Node polyfill behavior after install.
- The real shim scanner should have a fast self-check for missing files and missing markers before dependency work continues.

Validation:

- `corepack yarn check:rn-nodeify-shim-guard` passed.
- `corepack yarn check:rn-nodeify-shims` passed and confirmed the required polyfill markers exist in `node_modules`.
- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard self-check, camera usage inventory guard, QR scanner caller guard self-check, QR scanner caller inventory guard, Sentry usage guard self-check, Sentry usage inventory guard, nodeify shim guard self-check, nodeify shim inventory guard, TypeScript, and diff whitespace check.
- `corepack yarn prepush` passed, including `android:dev:check-light`, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.69 - README lightweight Android check docs

- Branch: `feature/bem-readme-check-light-docs`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Document `yarn android:dev:check-light` in the README Android running section.
- Explain that the command is a fast maintenance check before build/emulator validation.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Why:

- `android:dev:check-light` is now the main lightweight gate used by `prepush`.
- The README should expose it as the first local maintenance check before heavier Android smoke/audit commands.

Validation:

- `corepack yarn android:dev:check-light` passed and validated the README-documented lightweight gate.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.70 - Android warning audit refresh

- Branch: `feature/bem-warning-audit-refresh-log`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh the Android warning audit evidence on JDK 17.
- Record the current targeted warning baseline in this modernization log.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Findings:

- The refreshed warning audit still reports exactly 2 targeted Android Gradle warning sources.
- The remaining sources are unchanged:
  - Sentry `execResult` from `node_modules\@sentry\react-native\sentry.gradle:48`.
  - `react-native-camera` `jcenter()` from `node_modules\react-native-camera\android\build.gradle:59`.
- Unexpected targeted Android Gradle warnings remain at `0`.

Why:

- After adding the lightweight guard self-checks, the real Gradle warning audit should still prove that the known-warning baseline did not drift.
- This keeps the next camera/Sentry cleanup branches anchored to current Gradle evidence instead of only script-level checks.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings` passed.
- The refreshed `local-docs/android-warning-audit-summary.txt` reports `Android Gradle audit exit code: 0`, `Android Gradle warning baseline guard exit code: 0`, `Targeted Android Gradle warnings: 2`, and `Unexpected targeted Android Gradle warnings: 0`.
- `corepack yarn android:dev:check-artifacts` passed against the refreshed local warning summary and existing smoke artifact summary.
- No runtime, native, dependency, or Metro code changed in this branch.

### BEM-37.71 - Modernization baseline lightweight guard refresh

- Branch: `feature/bem-baseline-lightweight-guard-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh `docs/wallet-modernization-baseline.md` after the lightweight Android validation guard/self-check stream.
- Record the current `android:dev:check-light` coverage as the primary fast validation gate before `prepush`.
- Record the refreshed `BEM-37.70` Android warning audit evidence in the baseline.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and local artifacts unchanged.

Why:

- Plane currently tracks `BEM-37` as in progress, and the baseline should match the actual guard set now used by the branch.
- The previous baseline still listed several older individual checks before the aggregate lightweight gate, making the current validation path harder to scan.
- The remaining camera and Sentry warning sources should be tied to the latest audit evidence before the next cleanup/replacement branch.

Validation:

- `corepack yarn android:dev:check-light` passed.
- `corepack yarn android:dev:check-artifacts` passed.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this documentation-only update.

### BEM-36.23 - Native module inventory guard

- Branch: `feature/bem-native-module-inventory-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add a guarded inventory for the current native module dependency versions in `package.json`.
- Add `check:native-module-inventory-guard` fixture checks for missing and changed native dependency versions.
- Add `check:native-module-inventory` for the real repository `package.json`.
- Include both native inventory checks in `android:dev:check-light`.
- Refresh Android workflow and baseline documentation for the new guard.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- Plane tracks `BEM-36` as in progress for native module modernization.
- The next native dependency upgrades should start from an explicit inventory instead of relying on an informal package list.
- If a future branch changes a native module version, the guard forces the branch to update the inventory and related upgrade notes deliberately.

Validation:

- `corepack yarn check:native-module-inventory-guard` passed.
- `corepack yarn check:native-module-inventory` passed and confirmed `28` tracked native module dependencies.
- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard, QR scanner caller guard, Sentry usage guard, native module inventory guard, RN nodeify shim guard, TypeScript, and diff whitespace check.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this guard/tooling update.

### BEM-36.24 - Native module upgrade plan

- Branch: `feature/bem-native-module-upgrade-plan`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/native-module-upgrade-plan.md`.
- Group the current native dependency inventory into controlled upgrade streams.
- Record branch shape and validation expectations for docs/tooling-only, dependency/native, and release-service changes.
- Link the plan from the modernization baseline.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Why:

- `BEM-36` remains in progress and now has a guarded native dependency inventory.
- The next dependency branches should have an explicit sequencing plan so camera, Sentry/Firebase, navigation/layout, and storage/network changes do not get mixed.
- This keeps the small-branch workflow aligned with the larger wallet modernization roadmap in Plane.

Validation:

- `corepack yarn android:dev:check-light` passed.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this documentation-only update.

### BEM-36.25 - Native module upgrade plan coverage guard

- Branch: `feature/bem-native-plan-coverage-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:native-module-upgrade-plan` to verify that every dependency tracked by the native module inventory appears in `docs/native-module-upgrade-plan.md`.
- Include the upgrade-plan coverage guard in `android:dev:check-light`.
- Update the native module upgrade plan to cover the missing tracked packages: `@react-native-community/blur`, `react-native-bootsplash`, `react-native-fast-image`, and `react-native-randombytes`.
- Refresh Android workflow and baseline documentation for the new guard.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- `BEM-36.23` introduced a guarded dependency inventory and `BEM-36.24` introduced the upgrade sequencing plan.
- The plan should stay mechanically aligned with the inventory so future native dependency branches do not accidentally omit a module category.
- This keeps grouped native upgrades auditable before package versions start changing.

Validation:

- `corepack yarn check:native-module-upgrade-plan` passed and confirmed the plan covers `28` tracked native dependencies.
- `corepack yarn check:native-module-inventory` passed and confirmed the current inventory is stable.
- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard, QR scanner caller guard, Sentry usage guard, native module inventory guard, native module upgrade-plan coverage guard, RN nodeify shim guard, TypeScript, and diff whitespace check.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this guard/tooling update.

### BEM-36.26 - Native module upgrade plan guard self-check

- Branch: `feature/bem-native-plan-coverage-self-check`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Extract native module upgrade-plan coverage comparison into `scripts/nativeModuleUpgradePlanGuard.mjs`.
- Add `check:native-module-upgrade-plan-guard` with complete-plan and missing-package fixture checks.
- Include the self-check before the real `check:native-module-upgrade-plan` in `android:dev:check-light`.
- Refresh Android workflow and baseline documentation for the self-check.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- `BEM-36.25` made the native module upgrade plan mechanically checked against the dependency inventory.
- The comparison logic itself should have a fast positive/negative fixture check before grouped native dependency upgrades continue.
- This matches the existing lightweight guard pattern used for camera, QR scanner callers, Sentry, and RN nodeify shims.

Validation:

- `corepack yarn check:native-module-upgrade-plan-guard` passed.
- `corepack yarn check:native-module-upgrade-plan` passed and confirmed the plan covers `28` tracked native dependencies.
- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard, QR scanner caller guard, Sentry usage guard, native module inventory guard, native module upgrade-plan self-check, native module upgrade-plan coverage guard, RN nodeify shim guard, TypeScript, and diff whitespace check.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this guard/tooling update.

### BEM-36.27 - README native guard docs

- Branch: `feature/bem-readme-native-guard-docs`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh the README `android:dev:check-light` description after adding native module inventory and upgrade-plan guards.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Why:

- The repository-level quickstart should match the actual lightweight gate now used by `prepush`.
- The BEM-36 native module guard work should be visible from the normal Android maintenance instructions, not only from deeper docs.

Validation:

- `corepack yarn android:dev:check-light` passed.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this documentation-only update.

### BEM-36.28 - Native guard prepush evidence

- Branch: `feature/bem-native-guard-prepush-evidence`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Record the full `prepush` validation after adding native module inventory and upgrade-plan guards to `android:dev:check-light`.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Why:

- `BEM-36.23` through `BEM-36.27` expanded the lightweight gate with native module inventory and plan coverage checks.
- The full pre-push gate should be proven after that expansion, because it also includes the promoted offline Jest suites used before pushing modernization work.

Validation:

- `corepack yarn prepush` passed on `upgrade/wallet-modernization` after `BEM-36.27`.
- The run included `android:dev:check-light`, unit tests, storage, authenticator, watch-only offline, HD wallet offline, and wallet-core offline suites.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this documentation-only update.

### BEM-36.29 - QR render usage inventory guard

- Branch: `feature/bem-qr-render-inventory-guard`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `check:qr-render-usage-guard` fixture checks for the current `react-native-qrcode-svg` render surface.
- Add `check:qr-render-usage` to scan source files for `react-native-qrcode-svg` imports.
- Include both QR render usage checks in `android:dev:check-light`.
- Refresh the native module upgrade plan, Android workflow, and baseline documentation for the new guard.
- Keep runtime code, native code, Gradle configuration, dependencies, Metro behavior, and validation artifact formats unchanged.

Why:

- The native module upgrade plan recommends reviewing `react-native-svg` and QR rendering compatibility before camera migration.
- A guarded QR render inventory makes the future `react-native-svg` upgrade surface explicit: contact QR, export wallet secret, export xpub, authenticator options, and receive coins.
- This mirrors the existing QR scanner caller guard, but covers QR rendering instead of camera scanning entry points.

Validation:

- `corepack yarn check:qr-render-usage-guard` passed.
- `corepack yarn check:qr-render-usage` passed and confirmed `5` QR render screens.
- `corepack yarn android:dev:check-light` passed and ran Android warning baseline guard, Android warning artifact guard, camera usage guard, QR scanner caller guard, QR render usage guard, Sentry usage guard, native module inventory guard, native module upgrade-plan guard, RN nodeify shim guard, TypeScript, and diff whitespace check.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this guard/tooling update.

### BEM-36.30 - README QR render guard docs

- Branch: `feature/bem-readme-qr-render-guard-docs`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh the README `android:dev:check-light` wording after adding QR render usage checks.
- Distinguish camera usage, QR scanner caller, and QR render usage guards in the repository-level quickstart.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Why:

- `BEM-36.29` added a QR render usage inventory guard for future `react-native-svg` and QR rendering dependency upgrades.
- The README should reflect the actual lightweight guard set rather than grouping scan and render risks under a generic QR label.

Validation:

- `corepack yarn android:dev:check-light` passed.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this documentation-only update.

### BEM-36.31 - SVG QR compatibility audit

- Branch: `feature/bem-svg-qr-compat-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/svg-qr-render-compatibility-audit.md`.
- Record the current `react-native-svg` / `react-native-qrcode-svg` package state and npm compatibility snapshot.
- Link the audit from the native module upgrade plan.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Findings:

- The repo currently pins `react-native-svg` to `9.5.1`.
- `react-native-qrcode-svg@6.0.6` declares `react-native-svg ^9.6.4`.
- Latest npm metadata checked for this branch reports `react-native-svg@15.15.5` and `react-native-qrcode-svg@6.3.21`; the latest QR package declares `react-native-svg >=14.0.0`.
- Future QR rendering dependency work should treat `react-native-svg` and `react-native-qrcode-svg` as a coupled compatibility pair.

Why:

- The native module upgrade plan listed `react-native-svg` / QR rendering review as the next recommended branch before camera migration.
- The QR render surface is now guarded, so this audit records the dependency compatibility risk and the future validation path before changing package versions.

Validation:

- `corepack yarn android:dev:check-light` passed.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this documentation-only update.

### BEM-36.32 - Navigation native compatibility audit

- Branch: `feature/bem-navigation-native-compat-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/navigation-native-compatibility-audit.md`.
- Record the current `react-native-gesture-handler`, `react-native-screens`, and `react-native-safe-area-context` package state and npm compatibility snapshot.
- Link the audit from the native module upgrade plan.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Findings:

- `react-native-safe-area-context` is imported directly in `src/components/ScreenTemplate.tsx`.
- `react-native-gesture-handler` and `react-native-screens` have no direct `src` imports, but remain native dependencies for the React Navigation/native autolinking stack.
- Latest npm metadata checked for this branch reports `react-native-screens@4.25.2` with peer dependency `react-native >=0.82.0`, so it is not a direct latest-version target for the current RN `0.68.7` branch.

Why:

- The native module upgrade plan listed navigation behavior review as the next recommended branch after the SVG/QR audit.
- Navigation/layout changes affect startup, tabs, stack transitions, safe-area spacing, scrolling templates, and keyboard/footer layout, so they need a dedicated validation path before package versions change.

Validation:

- `corepack yarn android:dev:check-light` passed.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this documentation-only update.

### BEM-36.33 - Storage and network native compatibility audit

- Branch: `feature/bem-storage-network-compat-audit`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Add `docs/storage-network-native-compatibility-audit.md`.
- Record the current storage/config/network native dependency versions, usage surface, npm compatibility snapshot, and future validation path.
- Link the audit from the native module upgrade plan.
- Keep runtime code, native code, Gradle configuration, dependencies, package scripts, Metro behavior, and validation artifact formats unchanged.

Findings:

- This package group touches persisted wallet data, encrypted storage, Electrum TLS sockets, env configuration, and terms WebViews.
- `react-native-secure-key-store` is already at latest `2.0.10`.
- `react-native-tcp-socket` has a newer `6.4.1`, but it directly affects Electrum connectivity and should be validated separately.
- AsyncStorage and secure storage changes need focused tests before emulator smoke.
- `react-native-config` changes must preserve Electrum, explorer, Sentry, CodePush, and flavor metadata.

Why:

- The native module upgrade plan listed storage/config/network modules as the next recommended review area.
- These dependencies are wallet-sensitive, so they need a documented compatibility and validation path before package versions change.

Validation:

- `corepack yarn android:dev:check-light` passed.
- No runtime, native, dependency, or Metro code changed in this branch, so emulator smoke is not required for this documentation-only update.

### BEM-34.4 - README Metro smoke workflow

- Branch: `feature/bem-34-readme-metro-smoke-docs`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Update `README.md` Android development verification instructions to start Metro before `yarn android:dev:verify`.
- Mention the smoke helper Metro preflight on `127.0.0.1:8081`.
- Keep package scripts and runtime behavior unchanged.

Why:

- `android:dev:verify` runs the dev APK smoke check, and the smoke helper now fails fast if Metro is not reachable.
- The README should explain the required shell order instead of leaving Metro as a later generic note.

Validation:

- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`

### BEM-36.13 - Android smoke failure screenshot

- Branch: `feature/bem-36-smoke-failure-screenshot`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Try to capture `local-docs/android-smoke-dev.png` when `scripts/androidSmokeDev.mjs` fails after selecting an Android serial.
- Keep existing smoke pass/fail criteria unchanged.
- Keep successful smoke screenshot capture unchanged.
- Document failure screenshot behavior in `docs/android-modernization-workflow.md`.

Why:

- UI hierarchy failures can be easier to diagnose from the visible screen than from XML alone.
- The helper should preserve the same screenshot artifact even when expected text validation fails.

Validation:

- `ANDROID_SMOKE_EXPECT_TEXTS=__missing_for_failure_artifact__ ANDROID_SMOKE_UI_WAIT_MS=1000 JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` exits with code `1` and refreshes `local-docs/android-smoke-dev.png`.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passes on `emulator-5554` and refreshes the successful startup screenshot.

### BEM-36.14 - Android smoke Metro preflight

- Branch: `feature/bem-36-smoke-metro-preflight`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Check that Metro is reachable before installing and launching the dev APK in `scripts/androidSmokeDev.mjs`.
- Add `ANDROID_SMOKE_METRO_HOST`, `ANDROID_SMOKE_METRO_PORT`, and `ANDROID_SMOKE_METRO_TIMEOUT_MS` overrides.
- Keep existing ADB, logcat, UI hierarchy, and screenshot validation behavior unchanged.
- Document the Metro preflight in `docs/android-modernization-workflow.md`.

Why:

- The dev APK depends on Metro during smoke validation.
- A clear preflight failure is faster to diagnose than launching the app into a bundle-loading screen and debugging it as a UI failure.

Validation:

- `ANDROID_SMOKE_METRO_PORT=65534 ANDROID_SMOKE_METRO_TIMEOUT_MS=500 node scripts/androidSmokeDev.mjs` exits with code `1` and records `Metro is not reachable`.
- `ANDROID_SMOKE_METRO_PORT=abc node scripts/androidSmokeDev.mjs` exits with the expected integer-range validation error.
- `ANDROID_SMOKE_METRO_TIMEOUT_MS=0 node scripts/androidSmokeDev.mjs` exits with the expected positive-integer validation error.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passes on `emulator-5554` after checking Metro at `127.0.0.1:8081`.

### BEM-36.15 - Android smoke summary artifact

- Branch: `feature/bem-36-smoke-summary-artifact`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Write `local-docs/android-smoke-dev-summary.txt` from `scripts/androidSmokeDev.mjs`.
- Include outcome, exit code, reason, selected serial, package, Metro endpoint, expected UI texts, app PID, logcat count, UI attempts, screenshot path, and screenshot byte count.
- Keep the existing full smoke transcript, UI hierarchy, screenshot, and pass/fail criteria unchanged.
- Document the summary artifact in `docs/android-modernization-workflow.md`.

Why:

- The full smoke log is useful for debugging, but a compact summary is faster to scan during repeated maintenance branch validation.
- A stable summary artifact mirrors the Android warning audit summary pattern.

Validation:

- `ANDROID_SMOKE_METRO_PORT=65534 ANDROID_SMOKE_METRO_TIMEOUT_MS=500 node scripts/androidSmokeDev.mjs` exits with code `1` and writes `Android smoke outcome: failed` plus the Metro failure reason to `local-docs/android-smoke-dev-summary.txt`.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:smoke` passes on `emulator-5554` and writes `Android smoke outcome: passed`, app PID, logcat count, UI attempt count, and screenshot byte count to `local-docs/android-smoke-dev-summary.txt`.

### BEM-34.3 - Baseline smoke summary refresh

- Branch: `feature/bem-34-baseline-smoke-summary-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Refresh `docs/wallet-modernization-baseline.md` after adding the Android smoke summary artifact.
- Record `local-docs/android-smoke-dev-summary.txt` as part of the current validation baseline.
- Keep runtime and tooling behavior unchanged.

Why:

- The baseline should reflect the current smoke evidence set used for maintenance branches.
- This keeps the high-level status document aligned with the branch-by-branch modernization log.

Validation:

- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`

### BEM-36.81 - React Native baseline preflight refresh

- Branch: `feature/bem-36-rn-baseline-preflight-refresh`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Re-run the aggregated React Native baseline preflight after the May Android/tooling cleanup branches.
- Refresh ignored local audit artifacts under `local-docs/` for camera QR migration, Sentry Android warning, Sentry release prerequisites, Firebase release services, CodePush release path, push notification bridge, Android warning summary, and Android smoke summary validation.
- Record the current larger follow-ups without changing runtime code, native code, dependencies, Metro behavior, or release secrets.

Findings:

- The current React Native baseline remains `0.68.7` with React `17.0.2`, Metro/dev Node `16.20.2`, Android compile SDK `34`, target SDK `33`, AGP `7.4.2`, and Gradle `7.5.1`.
- `corepack yarn rn:baseline:preflight` passes on the current integration baseline.
- Camera QR migration wiring is stable, but `react-native-camera` remains installed and deprecated; replacement stays a dedicated scanner migration branch.
- Sentry Android warning baseline is stable, but removing the dependency-owned Gradle `execResult` warning stays a dedicated release/source-map validation branch.
- Sentry release validation is not locally ready because `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties` are missing and `SENTRY_AUTH_TOKEN` is not present in the current shell.
- CodePush release update validation is not ready because `.env.dev.testnet` has blank Android/iOS deployment keys and beta env files do not define Android/iOS deployment keys.

Why:

- The next React Native baseline branch needs a current evidence point before changing package versions or native templates.
- This checkpoint keeps the modernization path honest: the baseline is internally consistent, while Sentry release validation, CodePush release validation, camera replacement, and funded BTCV transaction QA remain separate prerequisites/follow-ups.

Validation:

- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn rn:baseline:preflight` passed.
- No runtime, native, dependency, Android/iOS source, or Metro code changed in this branch, so emulator smoke is not required for this documentation/evidence checkpoint.

### BEM-36.108 - UUID runtime modernization

- Branch: `feature/bem-36-uuid-runtime-14`
- Parent branch: `upgrade/wallet-modernization`

Scope:

- Try the current `uuid@14.0.0` release first, then fall back only after runtime evidence.
- Upgrade the direct app dependency from `uuid@3.4.0` to `uuid@11.1.1`.
- Remove `@types/uuid`; supported `uuid` releases now ship their own TypeScript declarations.
- Keep existing app call sites unchanged: `v4` is still imported as `uuidv4`.

Findings:

- `uuid@14.0.0` is the current latest release, but it is ESM/export-map only and has no classic `main` entry for this React Native 0.68 Metro baseline.
- Android assemble and TypeScript were not enough to catch that issue.
- Emulator smoke with Metro reset failed on `uuid@14.0.0`: Metro returned a bundle error while resolving `uuid` from `src/state/toastMessages/actions.ts`.
- `uuid@11.1.1` is the highest tested compatible line for the current Metro baseline because it still exposes a CommonJS `main` entry while shipping its own types.
- Moving beyond `uuid@11.1.1` should be re-tested after the React Native/Metro baseline is upgraded.

Why:

- This moves an old runtime dependency forward without hiding a latest-version blocker.
- The branch keeps the app working now while preserving the real latest target as a follow-up tied to React Native/Metro modernization.

Validation:

- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restarted with `react-native start --reset-cache --port 8081`.
- Emulator smoke on `emulator-5554`: installed `android/app/build/outputs/apk/dev/debug/app-dev-debug.apk`, ran `adb reverse tcp:8081 tcp:8081`, launched `io.goldwallet.wallet.dev`, confirmed `MainActivity` foreground, Metro bundled `./index.js`, and logcat showed no fatal AndroidRuntime or React Native bundle/runtime errors for the app.
- Smoke artifacts: `local-docs/uuid14-smoke.png`, `local-docs/uuid11-smoke.png`, `local-docs/metro-uuid14.log`, `local-docs/metro-uuid11.log`.
