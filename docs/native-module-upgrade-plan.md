# Native Module Upgrade Plan

This plan scopes `BEM-36 - Native modules upgrade` after the React Native `0.85.3` step.

The current dependency inventory is guarded by:

```powershell
corepack yarn check:native-module-inventory
```

If a native dependency version changes, update `scripts/nativeModuleInventoryGuard.mjs`, this plan, and the branch notes in `docs/wallet-modernization-log.md` in the same mini-branch.

React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`. Use that document before moving the RN baseline so native module updates stay sequenced with the current `0.85.3` branch. Run `corepack yarn rn:baseline:preflight` before an RN baseline branch so the current native-module, release-service, Metro, RN target snapshot, and warning-source audits are checked together.

## Current Constraints

- Keep Metro/dev runtime on Node 22.
- Use JDK 17 for Android build and smoke validation.
- Keep scanner changes separate from small native module cleanup branches.
- Keep Sentry SDK/release source-map changes separate from small native module cleanup branches.
- Do not mix iOS Podfile/deployment-target work into Android-only native cleanup branches.
- After any dependency update, run Metro with `--reset-cache` before emulator smoke.

## Upgrade Groups

### Group A - Already Stabilized In This Stream

- `@react-native-clipboard/clipboard` -> `1.16.3`
- `react-native-biometrics` -> `3.0.1`
- `react-native-screens` -> `4.25.2`
- `react-native-share` -> `12.3.1`
- `jail-monkey` -> `3.0.0`

Current expectation:

- Keep these versions fixed until the next RN baseline requires another bump.
- Do not revisit them unless Android audit, TypeScript, or emulator smoke shows a real compatibility issue.

### Group B - Navigation And Layout Native Surface

- `react-native-gesture-handler` -> `3.0.0`
- `@react-native-community/blur` -> `4.4.1`
- `@react-native-community/masked-view` -> removed
- `react-native-bootsplash` -> `7.3.1`
- `react-native-fast-image` -> `8.6.3`
- `react-native-safe-area-context` -> `5.8.0`
- `react-native-screens`
- `react-native-svg` -> `15.15.5`
- `@react-native-community/slider` -> `5.2.0`
- `react-native-vector-icons` -> `10.3.0`

Risk:

- Navigation startup, tabs, modals, splash transitions, blur layers, cached images, QR rendering, icon fonts, and layout insets can regress.

Branch shape:

- One mini-branch per package or a very small compatible pair.
- `docs/navigation-native-compatibility-audit.md` records the current navigation/layout package compatibility snapshot and validation path.
- `check:qr-render-usage` keeps the current `react-native-qrcode-svg` render surface explicit before `react-native-svg` changes.
- `docs/svg-qr-render-compatibility-audit.md` records the current npm compatibility snapshot and future validation path.
- `check:legacy-android-autolink` keeps obsolete QR image/prompt Android modules disabled in `react-native.config.js` until they are removed or replaced in a dedicated QR/camera branch.
- Validate TypeScript, Android build, emulator dashboard smoke, wallet list, send/receive navigation, and QR display.
- `react-native-bootsplash` is on latest checked `7.3.1` after `BEM-37.218`; future splash work should focus on release launch-screen behavior and iOS validation, not another immediate package bump.
- `@react-native-community/blur` is on latest checked `4.4.1` after `BEM-36.55`; future blur work should focus on visual regressions in layered/modal surfaces and RN baseline changes.
- `react-native-safe-area-context` is on checked `5.8.0` after `BEM-36.119`; future safe-area work should focus on layout validation and the next RN baseline.
- `react-native-screens` is on checked latest `4.25.2` after `BEM-37.205`; the package now satisfies the RN `0.85.3` baseline and needs Android navigation smoke after future stack changes.
- `react-native-svg` is on checked `15.15.5` after `BEM-36.119`, paired with `react-native-qrcode-svg@6.3.21` and root `qrcode@1.5.4` resolution after `BEM-37.158`; the QR renderer branch revalidated the newer QR package line on the RN `0.85.3` baseline.
- For `react-native-svg` changes, manually check the guarded QR render screens: contact QR, export wallet secret, export xpub, authenticator options, and receive coins.
- `react-native-fast-image` is on latest checked `8.6.3` after `BEM-36.53`; future image work should focus on cached image behavior and any RN baseline-driven replacement rather than another 8.x package bump.
- `@react-native-community/slider` is on checked `5.2.0` after `BEM-37.108`; the app has no source imports for Slider, and the package no longer contributes two Android `jcenter()` warnings on the RN `0.85.3` baseline.
- `react-native-vector-icons` is on checked latest `10.3.0` after `BEM-37.110`; the package no longer requires `@react-native-community/toolbar-android` and no longer contributes an Android `jcenter()` warning. Future icon work should focus on the package's per-icon-family migration guidance and iOS font validation rather than another warning-only cleanup.
- `react-native-gesture-handler` is on latest checked `3.0.0` after `BEM-37.219`; the earlier RN `0.76.9` Kotlin/codegen blocker no longer reproduces on the current RN `0.85.3` New Architecture baseline.
- `@react-native-community/masked-view` was removed after moving the navigation proof to `@react-navigation/stack@7.9.3`, which no longer requires the old community masked-view runtime path.
- `corepack yarn masked-view:migration:audit` now guards the completed removal state and keeps the warning baseline at one remaining targeted source.

### Group C - Device, Storage, Network, And Runtime Integrations

- `@react-native-async-storage/async-storage` -> `3.1.1`
- `@react-native-community/netinfo` -> `12.0.1`
- `react-native-background-timer` -> `2.4.1`
- `react-native-device-info` -> `15.0.2`
- `react-native-exit-app` -> `2.0.0`
- `react-native-config` -> `1.6.1`
- `react-native-localize` -> `3.7.0`
- `react-native-randombytes` -> `3.6.2`
- `react-native-secure-key-store` -> `2.0.10`
- `react-native-keychain` -> `10.0.0`
- `react-native-tcp-socket` -> `6.4.1`
- `react-native-version-number` -> `0.3.6`
- `react-native-webview` -> `13.16.1`

Risk:

- Wallet persistence, environment loading, network status, Electrum connectivity, localization, random byte generation, secure key handling, and embedded web content can regress.

Branch shape:

- Prefer one dependency per mini-branch.
- `docs/storage-network-native-compatibility-audit.md` records the current storage/config/network package compatibility snapshot and validation path.
- Validate app startup, wallet list persistence, settings/env loading, and logcat for native module crashes.
- For storage/secure-key-store changes, add or run focused storage/authenticator tests before emulator smoke.
- `@react-native-community/netinfo` is on latest checked stable `12.0.1` after `BEM-37.168`; future NetInfo work should focus on Electrum/network behavior and RN baseline changes rather than another blind package bump.
- `@react-native-async-storage/async-storage` is on latest checked stable `3.1.1` after `BEM-37.169`; the Jest mock import moved to `@react-native-async-storage/async-storage/jest`, and future AsyncStorage work should focus on persistence behavior and platform validation.
- `react-native-background-timer` is pinned to the already-resolved `2.4.1` after `BEM-36.67`; future timer work should validate timeout-button behavior and wait for a broader RN/runtime baseline.
- `react-native-config` is on latest checked `1.6.1` after `BEM-37.167`; the earlier Android API compile blocker is resolved on the RN `0.85.3` baseline. Future config work should focus on flavor/env behavior, release-service keys, and platform validation.
- `react-native-device-info` is on checked `15.0.2` after `BEM-37.109`; the app's used APIs remain available (`isEmulator`, `isPinOrFingerprintSet`, app/build metadata), and the package no longer contributes an Android `jcenter()` warning.
- `react-native-exit-app` is on checked `2.0.0` after `BEM-37.106`; the package no longer contributes an Android `jcenter()` warning on the RN `0.85.3` baseline. Future exit-app work should validate factory reset and terms rejection behavior.
- `react-native-localize` is on checked `3.7.0` after `BEM-37.107`; the package no longer contributes an Android `jcenter()` warning on the RN `0.85.3` baseline. Future localization work should focus on app language behavior and RN baseline changes.
- `react-native-keychain@10.0.0` is installed beside `react-native-secure-key-store@2.0.10` for a staged secure-storage migration; future secure-storage work should remove the legacy backend only after fallback/dual-write behavior has shipped and been validated.
- `corepack yarn secure-storage:migration:audit` records that secure storage protects PIN and transaction-password behavior before any replacement branch starts.
- `tests/integration/Storage.test.js` now locks the React Native `AppStorage` dual-write and legacy fallback contract for encrypted wallet data before any later legacy secure-store removal.
- `react-native-tcp-socket` is already on the latest checked same-major version after `BEM-36.50`; future socket/config branches should focus on Electrum/network behavior rather than another blind package bump.
- `react-native-randombytes` is on latest checked `3.6.2` after `BEM-36.49`; future random-value work should be a dedicated crypto/runtime replacement branch for `react-native-get-random-values`, not another package bump.
- `react-native-version-number` is pinned to the already-resolved `0.3.6` after `BEM-36.69`; future app metadata work should validate displayed/build version behavior on both platforms.
- `react-native-webview` is on latest checked `13.16.1` after `BEM-37.162`; future WebView work should focus on Terms screens validation, release builds, and the next RN baseline.

### Group D - Notifications And Release Services

- `@react-native-firebase/app` -> `24.0.0`
- `@react-native-firebase/analytics` -> `24.0.0`
- `@react-native-firebase/crashlytics` -> `24.0.0`
- `@react-native-firebase/messaging` -> `24.0.0`
- `@react-native-community/push-notification-ios` -> `1.12.0`
- `react-native-code-push` -> `9.0.1`
- `@sentry/react-native` -> `8.13.0`

Risk:

- Release builds, crash reporting, analytics events, push registration, notification permissions, source maps, and CodePush can regress.

Branch shape:

- Do not do blind release-service upgrades inside generic cleanup.
- Keep remaining Sentry release/source-map validation in a dedicated branch when credentials and release build access are available.
- Keep Firebase grouped by package family; after `BEM-36.124` the current family is `24.0.0`, with Android debug build and embedded smoke validated.
- `corepack yarn firebase:release-services:audit` checks current Firebase package family alignment, Android config, iOS plist files, and Messaging runtime wiring before a Firebase family upgrade.
- `docs/release-services-native-compatibility-audit.md` records the current Firebase, push, CodePush, and Sentry package snapshot, native build surface, and release validation path.
- `react-native-code-push` is on latest checked `9.0.1` after the RN `0.85.3` proof, with guarded release bundle alias compatibility for RN Gradle task naming. App Center CodePush was retired on 2025-03-31 and the Microsoft upstream is archived, so future CodePush work should decide migration/removal before treating OTA updates as a supported release capability. Non-dev release/update validation and deployment-key loading still require non-empty deployment keys if the team keeps OTA behavior.
- `corepack yarn codepush:release:path-audit` checks the current CodePush non-dev runtime/native/env wiring before any release-path change.
- `@react-native-community/push-notification-ios` is on latest checked `1.12.0` after `BEM-36.75`; future iOS notification bridge work should validate badge handling, remote-notification forwarding, and iOS permission/token flows on a Mac runner/device.
- `@sentry/react-native` is on latest checked `8.13.0` after `BEM-36.125`; future Sentry work should focus on release source-map/dSYM validation with `SENTRY_AUTH_TOKEN` and generated `sentry.properties`, not another blind package bump.
- `corepack yarn push-notification:bridge-audit` checks the current iOS push notification bridge wiring before any notification bridge behavior change; after `BEM-37.79`, the static bridge readiness gaps are closed, while iOS runtime validation remains required on a Mac runner/device.
- Validate Android debug startup first, then release tooling separately when secrets and store/release config are available.

### Group E - Camera And QR Scanning

- `react-native-camera-kit` -> `18.0.0`
- Removed legacy `@remobile/react-native-qrcode-local-image` after no source usage remained.
- `react-native-qrcode-svg`

Risk:

- Camera permissions, QR scan callbacks, local QR image import, receive QR rendering, and navigation return values can regress.

Branch shape:

- Keep `react-native-camera-kit` scanner usage scoped to the dedicated QR scanner screen.
- Preserve all guarded QR scanner callers.
- Keep removed legacy QR local-image package out of `package.json` and `react-native.config.js`.
- Run `corepack yarn camera:qr-migration:audit` before scanner follow-up work so the current CameraKit permission/runtime/autolink baseline stays explicit.
- Validate Android/iOS camera permissions and QR scan behavior manually before claiming scanner follow-up work complete.
- Latest checked on 2026-05-31: `react-native-camera-kit@18.0.0`, `react-native-vision-camera@5.0.11`, `react-native-qrcode-svg@6.3.21`, and `qrcode@1.5.4`.
- `corepack yarn camera:candidate:audit` verifies those candidate/latest values against live npm metadata before scanner dependency follow-up work.
- VisionCamera remains deferred because its latest line requires `react-native-nitro-modules` and `react-native-nitro-image`; CameraKit remains the installed scanner baseline.

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
5. Keep CameraKit scanner follow-up work scoped to the dedicated QR scanner screen.
