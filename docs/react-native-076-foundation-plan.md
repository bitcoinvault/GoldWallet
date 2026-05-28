# React Native 0.76 Foundation Plan

This plan scopes the first React Native foundation milestone. It must be treated as a full app foundation branch, not as a package-only update.

## Current Baseline

- React Native: `0.76.9`
- React: `18.2.0`
- RN Babel preset: `0.76.9`
- RN Metro config: `0.76.9`
- Metro/dev Node runtime: `22.18.0`
- Android compile SDK: `34`
- Android target SDK: `33`
- Android Gradle Plugin: `8.6.0`
- Gradle wrapper: `8.10.2`

## Target Package Set

Latest metadata checked on 2026-05-28 for the first milestone:

- `react-native@0.76.9`
- `react@18.2.0`
- `react-test-renderer@18.2.0`
- `@types/react@^18.2.6`
- `@react-native/babel-preset@0.76.9`
- `@react-native/metro-config@0.76.9`
- `@react-native/typescript-config@0.76.9`
- `@react-native/gradle-plugin@0.76.9`
- `@react-native/codegen@0.76.9`

Important metadata:

- `react-native@0.76.9` peers: React `^18.2.0`, `@types/react ^18.2.6`.
- `react-native@0.76.9` Node engine: `>=18`.
- `@react-native/babel-preset@0.76.9` Node engine: `>=18`.
- `@react-native/metro-config@0.76.9` Node engine: `>=18`.

## Required Template Scope

The RN `0.76.9` branch must include the template/native migration that was missing from the package-only probe:

- Node/dev runtime move from the old Node 16 baseline to Node 22 for Metro and RN tooling.
- Babel config migration from `metro-react-native-babel-preset` to the RN 0.76 preset stack.
- Metro config migration to the RN 0.76 Metro config package.
- Android Gradle settings and plugin wiring for `@react-native/gradle-plugin`.
- Android app Gradle/template drift, including autolinking, codegen, packaging, manifest, and debug build behavior.
- iOS Podfile/template drift recorded explicitly; Windows can audit files, but Mac runner/device validation remains required before calling iOS complete.
- React 18 type and renderer alignment, including cleanup for packages that bring nested React type versions.

## Known Package-Only Blocker

`BEM-36.114` proved that installing RN `0.76.9` packages without the full template/native migration is not a valid path. The runtime failed around RN internals with:

```text
Unable to resolve module ./AppContainer-prod from node_modules/react-native/Libraries/ReactNative/AppContainer.js
```

Do not repeat a package-only RN 0.76 branch. The next attempt must move packages and template/native files together.

## Branch Shape

Recommended branch:

```text
feature/bem-36-rn-076-foundation
```

Start with:

```powershell
corepack yarn rn:baseline:preflight
corepack yarn rn:target-snapshot:current
corepack yarn rn:076-foundation:audit
```

Then apply the RN `0.76.9` package and template changes in one branch. If the branch fails, isolate the blocker before selecting a lower milestone; do not fall back to one-minor-at-a-time upgrades automatically.

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
