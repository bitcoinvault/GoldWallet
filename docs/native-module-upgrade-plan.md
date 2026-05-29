# Native Module Upgrade Plan

This plan scopes `BEM-36 - Native modules upgrade` after the React Native `0.76.9` step.

The current dependency inventory is guarded by:

```powershell
corepack yarn check:native-module-inventory
```

If a native dependency version changes, update `scripts/nativeModuleInventoryGuard.mjs`, this plan, and the branch notes in `docs/wallet-modernization-log.md` in the same mini-branch.

React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`. Use that document before moving the RN baseline so native module updates stay sequenced with the current `0.76.9` branch. Run `corepack yarn rn:baseline:preflight` before an RN baseline branch so the current native-module, release-service, Metro, RN target snapshot, and warning-source audits are checked together.

## Current Constraints

- Keep Metro/dev runtime on Node 22.
- Use JDK 17 for Android build and smoke validation.
- Keep `react-native-camera` replacement separate from small native module cleanup branches.
- Keep Sentry SDK/release source-map changes separate from small native module cleanup branches.
- Do not mix iOS Podfile/deployment-target work into Android-only native cleanup branches.
- After any dependency update, run Metro with `--reset-cache` before emulator smoke.

## Upgrade Groups

### Group A - Already Stabilized In This Stream

- `@react-native-clipboard/clipboard` -> `1.11.2`
- `react-native-biometrics` -> `3.0.1`
- `react-native-screens` -> `4.5.0`
- `react-native-share` -> `7.9.1`
- `jail-monkey` -> `2.8.5`

Current expectation:

- Keep these versions fixed until the next RN baseline requires another bump.
- Do not revisit them unless Android audit, TypeScript, or emulator smoke shows a real compatibility issue.

### Group B - Navigation And Layout Native Surface

- `react-native-gesture-handler` -> `1.10.3`
- `@react-native-community/blur` -> `4.4.1`
- `@react-native-community/masked-view` -> `0.1.11`
- `react-native-bootsplash` -> `3.2.7`
- `react-native-fast-image` -> `8.6.3`
- `react-native-safe-area-context` -> `5.8.0`
- `react-native-screens`
- `react-native-svg` -> `15.15.5`
- `@react-native-community/slider` -> `5.2.0`
- `react-native-vector-icons` -> `6.7.0`
- `@react-native-community/toolbar-android` -> `0.2.1` as the bundle-time peer dependency needed by `react-native-vector-icons@6.7.0`

Risk:

- Navigation startup, tabs, modals, splash transitions, blur layers, cached images, QR rendering, icon fonts, and layout insets can regress.

Branch shape:

- One mini-branch per package or a very small compatible pair.
- `docs/navigation-native-compatibility-audit.md` records the current navigation/layout package compatibility snapshot and validation path.
- `check:qr-render-usage` keeps the current `react-native-qrcode-svg` render surface explicit before `react-native-svg` changes.
- `docs/svg-qr-render-compatibility-audit.md` records the current npm compatibility snapshot and future validation path.
- `check:legacy-android-autolink` keeps obsolete QR image/prompt Android modules disabled in `react-native.config.js` until they are removed or replaced in a dedicated QR/camera branch.
- Validate TypeScript, Android build, emulator dashboard smoke, wallet list, send/receive navigation, and QR display.
- `react-native-bootsplash` is on latest checked `3.2.7` after `BEM-36.54`; future splash work should focus on launch-screen behavior and RN baseline changes, not another 3.x bump.
- `@react-native-community/blur` is on latest checked `4.4.1` after `BEM-36.55`; future blur work should focus on visual regressions in layered/modal surfaces and RN baseline changes.
- `react-native-safe-area-context` is on checked `5.8.0` after `BEM-36.119`; future safe-area work should focus on layout validation and the next RN baseline.
- `react-native-svg` is on checked `15.15.5` after `BEM-36.119`, paired with `react-native-qrcode-svg@6.1.1` and root `qrcode@1.4.4` resolution to keep the QR renderer peer dependency aligned without the `TextEncoder` runtime regression found with freshly resolved `qrcode@1.5.4`.
- For `react-native-svg` changes, manually check the guarded QR render screens: contact QR, export wallet secret, export xpub, authenticator options, and receive coins.
- `react-native-fast-image` is on latest checked `8.6.3` after `BEM-36.53`; future image work should focus on cached image behavior and any RN baseline-driven replacement rather than another 8.x package bump.
- `@react-native-community/slider` is on checked `5.2.0` after `BEM-37.108`; the app has no source imports for Slider, and the package no longer contributes two Android `jcenter()` warnings on the RN `0.76.9` baseline.
- `react-native-vector-icons` is already on the latest checked 6.x line after `BEM-36.52`; `@react-native-community/toolbar-android` is tracked because that package line requires it at bundle time. The declared `^0.1.0-rc.1` peer did not compile on the current Android baseline, while `0.2.1` did; a future per-icon-family migration should be a dedicated branch.
- `react-native-gesture-handler` is pinned to the already-resolved `1.10.3` after `BEM-36.65`; future gesture-handler work should validate navigation transitions and wait for a broader RN baseline step.
- `@react-native-community/masked-view` is pinned to the already-resolved `0.1.11` after `BEM-36.66`; future masked-view work should validate stack/header masking and wait for a broader navigation package baseline.

### Group C - Device, Storage, Network, And Runtime Integrations

- `@react-native-async-storage/async-storage` -> `2.2.0`
- `@react-native-community/netinfo` -> `6.2.1`
- `react-native-background-timer` -> `2.4.1`
- `react-native-device-info` -> `15.0.2`
- `react-native-exit-app` -> `2.0.0`
- `react-native-config` -> `1.5.9`
- `react-native-localize` -> `3.7.0`
- `react-native-randombytes` -> `3.6.2`
- `react-native-secure-key-store` -> `2.0.10`
- `react-native-tcp-socket` -> `6.4.1`
- `react-native-version-number` -> `0.3.6`
- `react-native-webview` -> `11.26.1`

Risk:

- Wallet persistence, environment loading, network status, Electrum connectivity, localization, random byte generation, secure key handling, and embedded web content can regress.

Branch shape:

- Prefer one dependency per mini-branch.
- `docs/storage-network-native-compatibility-audit.md` records the current storage/config/network package compatibility snapshot and validation path.
- Validate app startup, wallet list persistence, settings/env loading, and logcat for native module crashes.
- For storage/secure-key-store changes, add or run focused storage/authenticator tests before emulator smoke.
- `@react-native-community/netinfo` is on latest checked 6.x `6.2.1` after `BEM-36.59`; future NetInfo work should focus on Electrum/network behavior and RN baseline changes rather than another blind package bump.
- `@react-native-async-storage/async-storage` is on checked compatible `2.2.0` after `BEM-36.74`; future AsyncStorage work should focus on persistence behavior and RN baseline changes rather than a direct jump to latest `3.x`.
- `react-native-background-timer` is pinned to the already-resolved `2.4.1` after `BEM-36.67`; future timer work should validate timeout-button behavior and wait for a broader RN/runtime baseline.
- `react-native-config` is on latest checked compatible `1.5.9` after `BEM-36.60`; `1.6.1` was rejected on the current RN `0.76.9` Android baseline because it requires newer React Native Android APIs. Future config work should focus on flavor/env behavior, release-service keys, and platform validation rather than another package bump.
- `react-native-device-info` is on checked `15.0.2` after `BEM-37.109`; the app's used APIs remain available (`isEmulator`, `isPinOrFingerprintSet`, app/build metadata), and the package no longer contributes an Android `jcenter()` warning.
- `react-native-exit-app` is on checked `2.0.0` after `BEM-37.106`; the package no longer contributes an Android `jcenter()` warning on the RN `0.76.9` baseline. Future exit-app work should validate factory reset and terms rejection behavior.
- `react-native-localize` is on checked `3.7.0` after `BEM-37.107`; the package no longer contributes an Android `jcenter()` warning on the RN `0.76.9` baseline. Future localization work should focus on app language behavior and RN baseline changes.
- `react-native-secure-key-store` is pinned to latest checked `2.0.10` after `BEM-36.63`; future secure-storage work should focus on behavior validation or replacement, not another package bump.
- `react-native-tcp-socket` is already on the latest checked same-major version after `BEM-36.50`; future socket/config branches should focus on Electrum/network behavior rather than another blind package bump.
- `react-native-randombytes` is on latest checked `3.6.2` after `BEM-36.49`; future random-value work should be a dedicated crypto/runtime replacement branch for `react-native-get-random-values`, not another package bump.
- `react-native-version-number` is pinned to the already-resolved `0.3.6` after `BEM-36.69`; future app metadata work should validate displayed/build version behavior on both platforms.
- `react-native-webview` is pinned to the already-resolved `11.26.1` after `BEM-36.64`; future WebView work should be a dedicated major upgrade with Terms screens validation.

### Group D - Notifications And Release Services

- `@react-native-firebase/app` -> `12.7`
- `@react-native-firebase/analytics` -> `12.7`
- `@react-native-firebase/crashlytics` -> `12.7`
- `@react-native-firebase/messaging` -> `12.7`
- `@react-native-community/push-notification-ios` -> `1.12.0`
- `react-native-code-push` -> `7.0.2`
- `@sentry/react-native` -> `5.36.0`

Risk:

- Release builds, crash reporting, analytics events, push registration, notification permissions, source maps, and CodePush can regress.

Branch shape:

- Do not do a blind Firebase or Sentry major upgrade inside generic cleanup.
- Keep Sentry release/source-map validation in a dedicated branch.
- Keep Firebase grouped by package family only when Android and iOS config changes are understood.
- `corepack yarn firebase:release-services:audit` checks current Firebase package family alignment, Android config, iOS plist files, and Messaging runtime wiring before a Firebase family upgrade.
- `docs/release-services-native-compatibility-audit.md` records the current Firebase, push, CodePush, and Sentry package snapshot, native build surface, and release validation path.
- `react-native-code-push` is pinned to the already-resolved `7.0.2` after `BEM-36.70`; future CodePush work should validate a non-dev release/update path and deployment-key loading.
- `corepack yarn codepush:release:path-audit` checks the current CodePush non-dev runtime/native/env wiring before any release-path change.
- `@react-native-community/push-notification-ios` is on latest checked `1.12.0` after `BEM-36.75`; future iOS notification bridge work should validate badge handling, remote-notification forwarding, and iOS permission/token flows on a Mac runner/device.
- `corepack yarn push-notification:bridge-audit` checks the current iOS push notification bridge wiring before any notification bridge behavior change; after `BEM-37.79`, the static bridge readiness gaps are closed, while iOS runtime validation remains required on a Mac runner/device.
- Validate Android debug startup first, then release tooling separately when secrets and store/release config are available.

### Group E - Camera And QR Scanning

- `react-native-camera` -> `^3.33.0`
- `@remobile/react-native-qrcode-local-image`
- `react-native-qrcode-svg`

Risk:

- Camera permissions, QR scan callbacks, local QR image import, receive QR rendering, and navigation return values can regress.

Branch shape:

- Replace `react-native-camera` only in the dedicated QR scanner migration branch.
- Preserve all guarded QR scanner callers.
- Run `corepack yarn camera:qr-migration:audit` before starting the replacement branch so the current permission/runtime/autolink baseline is explicit.
- Validate Android/iOS camera permissions and QR scan behavior manually.

## Minimum Validation By Branch Type

Docs/tooling-only:

```powershell
corepack yarn android:dev:check-light
```

Dependency/native change:

```powershell
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:assemble
corepack yarn start --reset-cache
adb reverse tcp:8081 tcp:8081
corepack yarn android:dev:smoke
```

Expected Android smoke result:

- Dashboard renders `Wallets`, `E2EWalletTypeTest`, `Send`, and `Receive`.
- No `AndroidRuntime` crash.
- No React Native runtime error.
- `local-docs/android-smoke-dev-summary.txt` reports `Android smoke outcome: passed`.

Release-service change:

- Run the dependency/native validation above.
- Add release-build/source-map/dSYM validation specific to the changed service.
- If required secrets are missing, document the exact missing variables and stop before claiming release validation.

## Next Recommended Branches

1. Use `docs/svg-qr-render-compatibility-audit.md` before changing `react-native-svg` or `react-native-qrcode-svg`.
2. Use `docs/navigation-native-compatibility-audit.md` before changing `react-native-gesture-handler`, `react-native-screens`, or `react-native-safe-area-context`.
3. Use `docs/storage-network-native-compatibility-audit.md` before changing storage, config, secure storage, socket, NetInfo, device-info, localization, randombytes, or WebView dependencies.
4. Use `docs/release-services-native-compatibility-audit.md` before changing Firebase, push notification, CodePush, or Sentry release-service dependencies.
5. Keep `react-native-camera` replacement for the dedicated QR scanner migration branch.
