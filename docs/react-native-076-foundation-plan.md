# React Native 0.81 Foundation Checkpoint

This document records the first completed React Native foundation checkpoint. The filename and package script keep the old `076` name for compatibility with existing guards, but the guarded baseline is now RN `0.81.6`.

## Current Baseline

- React Native: `0.81.6`
- React: `19.1.4`
- RN Babel preset: `0.81.6`
- RN Metro config: `0.81.6`
- Metro/dev Node runtime: `22.18.0`
- Android compile SDK: `36`
- Android target SDK: `36`
- Android Gradle Plugin: `8.13.2`
- Gradle wrapper: `8.13`

## Completed Package Set

Completed first foundation checkpoint package set:

- `react-native@0.81.6`
- `react@19.1.4`
- `react-test-renderer@19.1.4`
- `@types/react@19.2.15`
- `@react-native/babel-preset@0.81.6`
- `@react-native/metro-config@0.81.6`
- `@react-native/typescript-config@0.81.6`
- `@react-native/gradle-plugin@0.81.6`
- `@react-native/codegen@0.81.6`

Important metadata:

- `react-native@0.81.6` peers: React `^19.1.0`.
- `react-native@0.81.6` Node engine: `>=20.19.4`.
- The repository keeps Metro/dev runtime on Node `22.18.0`, which satisfies the RN `0.81.6` engine range and the recorded later target snapshot.

## Completed Template Scope

The RN `0.81.6` checkpoint included package and template/native migration together:

- Node/dev runtime move from the old Node 16 baseline to Node 22 for Metro and RN tooling.
- Babel config migration from `metro-react-native-babel-preset` to the RN 0.81 preset stack.
- Metro config migration to the RN 0.81 Metro config package.
- Android Gradle settings and plugin wiring for `@react-native/gradle-plugin`.
- Android app Gradle/template drift, including autolinking, codegen, packaging, manifest, and debug build behavior.
- iOS Podfile/template drift recorded explicitly; Windows can audit files, but Mac runner/device validation remains required before calling iOS complete.
- React 19 type and renderer alignment, including cleanup for packages that bring nested React type versions.

## Historical Package-Only Blocker

`BEM-36.114` proved that installing RN `0.76.9` packages without the full template/native migration is not a valid path. The runtime failed around RN internals with:

```text
Unable to resolve module ./AppContainer-prod from node_modules/react-native/Libraries/ReactNative/AppContainer.js
```

Do not repeat a package-only RN 0.76 branch. The next attempt must move packages and template/native files together.

## Current Branch Shape

Completed checkpoint branch:

```text
feature/bem-37-rn-next-baseline-proof
```

Before the next RN milestone, keep these guards green:

```powershell
corepack yarn rn:baseline:preflight
corepack yarn rn:target-snapshot:current
corepack yarn rn:076-foundation:audit
```

Then move to the next milestone target with package and template/native changes in one branch. If the branch fails, isolate the blocker before selecting a lower milestone; do not fall back to one-minor-at-a-time upgrades automatically.

## Validation Plan

- `corepack yarn rn:baseline:preflight`
- `corepack yarn rn:076-foundation:audit`
- Package install and postinstall shim verification.
- `corepack yarn check:rn-nodeify-shims`
- `corepack yarn typescript:check`
- `git diff --check`
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`
- Metro restart with Node 22 and `--reset-cache`.
- Install dev APK on emulator, run `adb reverse tcp:8081 tcp:8081`, launch the app, and inspect UI/logcat.
- Smoke pass: dashboard renders `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`; no AndroidRuntime crash; no React Native runtime/bundle error.

## Out Of Scope

- Rebranding.
- Explorer/Electrum behavior changes.
- Firebase major-family upgrade.
- Sentry release/source-map upgrade.
- CodePush release-path changes.
- `react-native-camera` replacement.
- Funded BTCV transaction QA, which remains blocked until a funded BTCV testnet wallet is available.
