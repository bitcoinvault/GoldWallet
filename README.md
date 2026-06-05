# GoldWallet - A Bitcoin Vault mobile wallet

The first ever Bitcoin Vault wallet.

[![Playstore](/img/GooglePlay.png)](https://play.google.com/store/apps/details?id=io.goldwallet.wallet)
[![AppStore](/img/AppStore.svg)](https://apps.apple.com/pl/app/goldwallet-for-btcv/id1515116464)

## Prerequisites

* Node.js `24.16.0` is the current development runtime. Use the version from `.nvmrc`.
* Yarn `1.22.x` via Corepack.
* For Android: 
    * Java SE Development Kit (JDK) 17. The AGP 8.13 baseline and Android build guard require JDK 17 exactly.
    * Android SDK
    * Android SDK Platform
    * Android Virtual Device
* For iOS: 
    * Xcode
    * [CocoaPods](https://cocoapods.org/)
* Supported devices:
    * iOS 14+
    * Android 8+

**If you haven't launched any React Native projects before, you should check [Setting up the development environment · React Native](https://reactnative.dev/docs/environment-setup) to set up your local development environment correctly.**

## Installation

```sh
$ git clone https://github.com/bitcoinvault/GoldWallet.git
$ cd GoldWallet
$ corepack enable
$ yarn install
```

To run iOS app you also need to install Swift project's dependencies:

```sh
$ cd ios
$ pod install
```

To build a binary of any variant with Sentry upload enabled, you must have `sentry.properties` files created in root, `./ios`, and `./android`. You can create them by executing `create-sentry-properties.sh` script with the valid Sentry Auth token; the script fails before writing files if `SENTRY_AUTH_TOKEN` is missing. `SENTRY_ORG` and `SENTRY_PROJECT` are optional and default to the current `cloudbest` / `goldwallet` release target:

```sh
$ SENTRY_AUTH_TOKEN=${TOKEN} SENTRY_ORG=cloudbest SENTRY_PROJECT=goldwallet bash ./create-sentry-properties.sh
```

Before claiming Sentry release/source-map validation locally, audit the required files without printing secrets:

```sh
$ yarn sentry:release:prereq-audit
```

But to run the app with Metro server, this step isn't required.

## Running the app

For a fast Android maintenance check that does not build or launch the app, run:

```sh
$ yarn android:dev:check-light
```

This runs the lightweight Android warning, validation artifact, Android dev environment audit, Metro dev runtime audit, React Native renderer exact-version guard, camera usage, QR scanner caller, QR scanner validation scripts, QR render usage, QR render validation scripts, legacy Android autolink disables, Sentry usage, Sentry release integration, CodePush usage, Firebase usage, iOS push notification bridge, release-service env keys, Android env mapping, iOS scheme config mapping, storage/network usage, storage/network validation scripts, wallet crypto validation scripts, native module inventory and upgrade-plan, git dependency snapshot guard, wallet crypto latest snapshot guard, direct outdated snapshot guard, node-fetch resolution guard, secure-storage removal readiness guard, node polyfill shim, TypeScript, and diff whitespace guards used before the offline suites in `prepush`.

The React Native upgrade path guard is included through `check:rn-upgrade-path-audit-guard` and `rn:upgrade-path:audit`.

Before Android build or emulator smoke work, check the local Java/SDK/ADB toolchain:

```sh
$ yarn android:dev:env-audit
```

This verifies JDK 17, Android SDK/ADB access, Gradle wrappers, and validation scripts. It warns if the active Node runtime differs from the `.nvmrc` Metro/dev runtime.

To verify that the staged React Native upgrade direction still matches the current baseline:

```sh
$ yarn rn:upgrade-path:audit
```

Before changing React Native package versions, run the grouped baseline preflight:

```sh
$ yarn rn:baseline:preflight
```

To verify the recorded npm target snapshot for the staged RN upgrade:

```sh
$ yarn rn:target-snapshot:audit
```

To compare that snapshot with live npm metadata before a real RN baseline branch:

```sh
$ yarn rn:target-snapshot:current
```

To audit React 19 impact areas implied by the RN target snapshot:

```sh
$ yarn react19:impact:audit
```

To verify that React, renderer, and type packages are treated as a coupled baseline:

```sh
$ yarn react:package-coupling:audit
```

To verify that React matches the exact version required by the bundled React Native renderer:

```sh
$ yarn react:renderer-version:audit
```

To verify that TypeScript and Jest stay coupled to the React/RN baseline:

```sh
$ yarn test:type-coupling:audit
```

To verify the live snapshot comparison rules without network access:

```sh
$ yarn check:rn-target-snapshot-current-guard
```

To verify that the documented Metro runtime baseline is still aligned with the repo:

```sh
$ yarn metro:dev-runtime:audit
```

The lightweight check includes a Metro dev runtime audit self-check so fixture coverage stays stable even when the active shell is not using Node 24.

For Android development verification, start Metro first:

```sh
$ yarn start --reset-cache
```

Then use the dev build plus emulator smoke check from another shell:

```sh
$ yarn android:dev:verify
```

This builds the dev debug APK, checks that Metro is reachable on `127.0.0.1:8081`, installs the APK on a connected emulator/device, checks app startup logcat, verifies the dashboard UI, writes local artifacts under `local-docs/`, and validates the generated smoke summary.

The default smoke expectation is the seeded wallet dashboard: `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`. On a fresh emulator that has completed onboarding but has no wallet yet, use the empty-wallet dashboard expectation:

```sh
$env:ANDROID_SMOKE_EXPECT_TEXTS = 'Wallets,Create new wallet,Import wallet'
$ yarn android:dev:smoke
```

For Android maintenance branches that also need the warning baseline audit and artifact consistency check, use:

```sh
$ yarn android:dev:audit-smoke
```

This runs the Android Gradle warning audit, emulator smoke check, and local validation-artifact checker in sequence.

The lightweight Android check also includes the modernization log ID guard self-check and the modernization log ID guard, so duplicated `BEM-*` entries are caught before a maintenance branch is committed.

You can also launch the Android app in variants such as `prod` and `beta`:

```sh
$ yarn run android:prod
$ yarn run android:beta
```

as well as iOS:

```sh
$ yarn run ios:prod
$ yarn run ios:beta
```

By default, the app runs in `Debug` type which means you must run React packager/server first:

```sh
$ yarn start
```

## Testing

To run unit and integration tests:

```bash
$ yarn run test
```

To run [Detox](https://github.com/wix/Detox) (end-to-end) tests, please follow the [Install platform-specific dependencies, tools and dev-kits](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md#install-platform-specific-dependencies-tools-and-dev-kits) guideline to make sure you have everything configured correctly. Especially the part about [Android (AOSP) Emulators](https://github.com/wix/Detox/blob/master/docs/Introduction.AndroidDevEnv.md) is important.

Build the app for Detox:

```sh
$ yarn build:detox -- -c ${CONFIGURATION}
```

Start react-native packager:

```sh
$ yarn start:detox
```

And then run the tests:
```sh
$ yarn test:detox -- -c ${CONFIGRURATION} 
```

Check `.detoxrc.json` file to see all available configurations

To control what tests should be executed use the Jest's `-t` flag:

```sh
$ yarn test:detox -- -c ${CONFIGRURATION} -t ${REGEX}
```

## LICENSE

MIT
