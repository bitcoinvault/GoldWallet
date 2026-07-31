# Native Module Upgrade Plan

This plan scopes `BEM-36 - Native modules upgrade` on the current React Native `0.86.2` baseline.

The current dependency inventory is guarded by:

```powershell
corepack yarn check:native-module-inventory
```

If a native dependency version changes, update `scripts/nativeModuleInventoryGuard.mjs`, this plan, and the branch notes in `docs/wallet-modernization-log.md` in the same mini-branch.

React Native upgrade path is tracked in `docs/react-native-upgrade-path.md`. Use that document before moving the RN baseline so native module updates stay sequenced with the current `0.86.2` branch. Run `corepack yarn rn:baseline:preflight` before an RN baseline branch so the current native-module, release-service, Metro, RN target snapshot, and warning-source audits are checked together.

## Current Constraints

- Keep Metro/dev runtime on Node 24.
- Use JDK 17 for Android build and smoke validation.
- Keep scanner changes separate from small native module cleanup branches.
- Keep Sentry SDK/release source-map changes separate from small native module cleanup branches.
- Do not mix iOS Podfile/deployment-target work into Android-only native cleanup branches.
- After any dependency update, run Metro with `--reset-cache` before emulator smoke.

## Upgrade Groups

### Group A - Already Stabilized In This Stream

- `@react-native-clipboard/clipboard` -> `1.16.3`
- `react-native-biometrics` -> `3.0.1`
- `react-native-screens` -> `4.26.2`
- `react-native-share` -> `12.3.1`
- `jail-monkey` -> `3.0.0`

Current expectation:

- Keep these versions fixed until the next RN baseline requires another bump.
- Do not revisit them unless Android audit, TypeScript, or emulator smoke shows a real compatibility issue.

### Group B - Navigation And Layout Native Surface

- `react-native-gesture-handler` -> `3.1.0`
- `@react-native-community/blur` -> `4.4.1`
- `@react-native-community/masked-view` -> removed
- `react-native-bootsplash` -> `7.3.2`
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
- `check:legacy-android-autolink` keeps wallet-critical prompt modules Android-autolinked for encrypted-storage startup and blocks any future unguarded legacy Android autolink disables in `react-native.config.js`.
- Validate TypeScript, Android build, emulator dashboard smoke, wallet list, send/receive navigation, and QR display.
- `react-native-bootsplash` is on latest checked `7.3.2` after `BEM-37.761`; future splash work should focus on release launch-screen behavior and iOS validation, not another immediate package bump.
- `@react-native-community/blur` is on latest checked `4.4.1` after `BEM-36.55`; future blur work should focus on visual regressions in layered/modal surfaces and RN baseline changes.
- `react-native-safe-area-context` is on checked `5.8.0` after `BEM-36.119`; future safe-area work should focus on layout validation and the next RN baseline.
- `react-native-screens` is on checked latest `4.26.2` as of 2026-07-18; the package satisfies the RN `0.86.2` baseline and keeps future changes tied to Android navigation smoke.
- `react-native-svg` is on checked `15.15.5` after `BEM-36.119`, paired with `react-native-qrcode-svg@6.3.21` and root `qrcode@1.5.4` resolution after `BEM-37.158`; the QR renderer branch remains guarded on the RN `0.86.2` baseline.
- For `react-native-svg` changes, manually check the guarded QR render screens: contact QR, export wallet secret, export xpub, authenticator options, and receive coins.
- `react-native-fast-image` is on latest checked `8.6.3` after `BEM-36.53`; future image work should focus on cached image behavior and any RN baseline-driven replacement rather than another 8.x package bump.
- `@react-native-community/slider` is on checked `5.2.0` after `BEM-37.108`; the app has no source imports for Slider, and the package no longer contributes Android `jcenter()` warnings on the RN `0.86.2` baseline.
- `react-native-vector-icons` is on checked latest `10.3.0` after `BEM-37.110`; the package no longer requires `@react-native-community/toolbar-android` and no longer contributes an Android `jcenter()` warning. Future icon work should focus on the package's per-icon-family migration guidance and iOS font validation rather than another warning-only cleanup.
- `react-native-gesture-handler` is on latest checked `3.1.0` as of 2026-07-18; the earlier RN `0.76.9` Kotlin/codegen blocker no longer reproduces on the current RN `0.86.2` New Architecture baseline.
- `@react-native-community/masked-view` was removed after moving the navigation proof to React Navigation 7; the current `@react-navigation/stack@7.10.17` package no longer requires the old community masked-view runtime path.
- `corepack yarn masked-view:migration:audit` now guards the completed removal state and keeps the warning baseline at one remaining targeted source.

### Group C - Device, Storage, Network, And Runtime Integrations

- `@react-native-async-storage/async-storage` -> `3.1.1`
- `@react-native-community/netinfo` -> `12.0.1`
- `react-native-background-timer` -> `2.4.1`
- `react-native-device-info` -> `15.0.2`
- `react-native-exit-app` -> `2.0.0`
- `react-native-config` -> `1.6.1`
- `react-native-localize` -> `3.7.0`
- `react-native-get-random-values` -> `2.0.0`
- `react-native-secure-key-store` -> removed after validated historical migration
- `react-native-keychain` -> `10.0.0`
- `react-native-tcp-socket` -> `6.4.2`
- `react-native-version-number` -> `0.3.6`
- `react-native-webview` -> `14.0.1`

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
- `react-native-config` is on latest checked `1.6.1` after `BEM-37.167`; the earlier Android API compile blocker is resolved on the RN `0.86.2` baseline. Future config work should focus on flavor/env behavior, release-service keys, and platform validation.
- `react-native-device-info` is on checked `15.0.2` after `BEM-37.109`; the app's used APIs remain available (`isEmulator`, `isPinOrFingerprintSet`, app/build metadata), and the package no longer contributes an Android `jcenter()` warning.
- `react-native-exit-app` is on checked `2.0.0` after `BEM-37.106`; the package no longer contributes an Android `jcenter()` warning on the RN `0.86.2` baseline. Future exit-app work should validate factory reset and terms rejection behavior.
- `react-native-localize` is on checked `3.7.0` after `BEM-37.107`; the package no longer contributes an Android `jcenter()` warning on the RN `0.86.2` baseline. Future localization work should focus on app language behavior and RN baseline changes.
- `react-native-keychain@10.0.0` is the only secure-storage backend after the guarded historical migration and fallback-free upgrade-in-place validation.
- `corepack yarn check:secure-storage-legacy-removal` prevents the removed package, adapter, environment switch, and runtime fallback references from returning.
- `corepack yarn secure-storage:release-validation:handoff` validates the final Keychain-only posture and focused wallet storage contracts.
- `tests/integration/Storage.test.js` locks the React Native `AppStorage` Keychain-only contract for encrypted wallet data.
- `react-native-tcp-socket` is on the latest checked `6.4.2` after `BEM-37.932`; future socket/config branches should focus on Electrum/network behavior rather than another blind package bump.
- `react-native-randombytes` was removed after the dedicated crypto/runtime replacement branch; random values are provided by `react-native-get-random-values@2.0.0`, imported in `index.js` before app startup.
- `react-native-version-number` is pinned to the already-resolved `0.3.6` after `BEM-36.69`; future app metadata work should validate displayed/build version behavior on both platforms.
- `react-native-webview` is on latest checked `14.0.1` after `BEM-37.760`; future WebView work should focus on Terms screens validation, release builds, and the next RN baseline.

### Debug Tooling Removed From Runtime

- `react-native-flipper`, `redux-flipper`, and `flipper-plugin-redux-debugger` are removed after `BEM-37.324` instead of bumped to `react-native-flipper@0.273.0`.
- `react-native-flipper@0.273.0` is npm `latest`, but still peers React `^16.8.0 || ^17.0.0 || ^18.0.0`; the current RN `0.86.2` baseline uses React `19.2.3`.
- Android Flipper bootstrap was already disabled before this cleanup; the branch removes the remaining package, Gradle, manifest, debug source, iOS Podfile/AppDelegate, and Redux middleware wiring.
- `corepack yarn check:flipper-removal` guards the completed removal state. `ios/Podfile.lock` still requires a macOS `pod install` refresh together with the other stale iOS pod drift.

### Group D - Notifications And Release Services

- `@react-native-firebase/app` -> `26.0.0`
- `@react-native-firebase/analytics` -> `26.0.0`
- `@react-native-firebase/crashlytics` -> `26.0.0`
- `@react-native-firebase/messaging` -> `26.0.0`
- `@react-native-community/push-notification-ios` -> `1.12.0`
- `react-native-code-push` -> removed; latest historical npm release checked `9.0.1`
- `@sentry/react-native` -> `8.21.0`

Risk:

- Release builds, crash reporting, analytics events, push registration, notification permissions, source maps, and removed CodePush/OTA assumptions can regress.

Branch shape:

- Do not do blind release-service upgrades inside generic cleanup.
- Keep remaining Sentry release/source-map validation in a dedicated branch when credentials and release build access are available.
- Keep Firebase grouped by package family; after `BEM-37.930` the current family is `26.0.0`, with New Architecture enabled and Android debug build, release evidence, and embedded smoke validation required before merge.
- `corepack yarn firebase:release-services:audit` checks current Firebase package family alignment, Android config, iOS plist files, and Messaging runtime wiring before a Firebase family upgrade.
- `docs/release-services-native-compatibility-audit.md` records the current Firebase, push, removed CodePush, and Sentry package snapshot, native build surface, and release validation path.
- `react-native-code-push` was removed after `BEM-37.583`; keep it removed unless a maintained OTA replacement is explicitly selected and validated as a separate release capability. Latest historical npm metadata remains `9.0.1`, App Center CodePush was retired on 2025-03-31, and the Microsoft upstream is archived. OTA update validation remains unclaimed, and stale `CODEPUSH_*` env cleanup remains a secrets-safe follow-up that must not expose historical deployment-key values in review. `corepack yarn codepush:migration:readiness-audit` records the current posture as removed and keeps the long-term remove-or-replace decision guarded.
- `corepack yarn codepush:release:path-audit` checks the current CodePush non-dev runtime/native/env wiring before any release-path change.
- `@react-native-community/push-notification-ios` is on latest checked `1.12.0` after `BEM-36.75`; future iOS notification bridge work should validate badge handling, remote-notification forwarding, and iOS permission/token flows on a Mac runner/device.
- `@sentry/react-native` is on latest checked `8.21.0` and release tooling pins and deduplicates `@sentry/cli@3.6.2`; the prerequisite audit verifies the Android resolver reaches that root package. Android source-map upload is credentialed and validated for the dev release. Future Sentry work should focus on macOS/Xcode/CocoaPods iOS dSYM validation after `ios/Podfile.lock` drift is refreshed, not another blind package bump. Use `corepack yarn sentry:release:validation:preflight` for repeatable release readiness checks.
- `corepack yarn push-notification:bridge-audit` checks the current iOS push notification bridge wiring before any notification bridge behavior change; after `BEM-37.79`, the static bridge readiness gaps are closed, while iOS runtime validation remains required on a Mac runner/device.
- Validate Android debug startup first, then release tooling separately when secrets and store/release config are available.

### Group E - Camera And QR Scanning

- `react-native-camera-kit` -> `18.0.0`
- `react-native-permissions` -> `5.6.1` for guarded Android/iOS Camera access
- Removed legacy `@remobile/react-native-qrcode-local-image` after no source usage remained.
- `react-native-qrcode-svg`

Risk:

- Camera permissions, QR scan callbacks, local QR image import, receive QR rendering, and navigation return values can regress.

Branch shape:

- Keep `react-native-camera-kit` scanner usage scoped to the dedicated QR scanner screen.
- Keep `react-native-permissions` configured to the iOS Camera handler only, and preserve blocked/settings plus foreground refresh behavior in the scanner screen.
- Preserve all guarded QR scanner callers.
- Keep removed legacy camera/QR packages out of `package.json` and `react-native.config.js`; `react-native-camera` should not remain as a stale disabled Android autolink entry after the CameraKit migration.
- Run `corepack yarn camera:qr-migration:audit` before scanner follow-up work so the current CameraKit permission/runtime/autolink baseline stays explicit.
- Use `corepack yarn camera:qr-validation:handoff --include-android-release-smoke --android-release-variant=<dev|stage|prod|beta>` when scanner work must prove a release APK path. The sequence builds all release APKs and validates release smoke plus release create-wallet summaries for the selected variant after focused QR scanner/render tests.
- Treat the remaining active pod version drift in `ios/Podfile.lock` as an iOS readiness blocker until `pod install` refreshes the lockfile on macOS. Removed camera pods are now absent from the guarded lockfile baseline.
- Validate Android/iOS camera permissions and QR scan behavior manually before claiming scanner follow-up work complete.
- Latest checked on 2026-07-31: `react-native-camera-kit@18.0.0`, `react-native-permissions@5.6.1`, `react-native-vision-camera@5.2.0`, `react-native-qrcode-svg@6.3.21`, `react-native-svg@15.15.5`, and `qrcode@1.5.4`.
- `corepack yarn camera:candidate:audit` verifies those candidate/latest values, CameraKit peer ranges, QR renderer peer ranges, and QR renderer dependency ranges against live npm metadata before scanner dependency follow-up work.
- VisionCamera remains deferred because its latest line requires `react-native-nitro-modules` and `react-native-nitro-image`; the live peer ranges are wildcarded, so the blocker is the additional Nitro native stack rather than a narrow semver incompatibility. CameraKit remains the installed scanner baseline.

## Minimum Validation By Branch Type

Docs/tooling-only:

```powershell
corepack yarn android:dev:check-light
```

Dependency/native change:

```powershell
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:verify
```

Expected Android smoke result:

- Clean onboarding completes and the empty dashboard renders `Wallets`, `No wallets`, `Create new wallet`, and `Import wallet`.
- Create/Import wallet CTA navigation, QR scanner open/close, and empty-state bottom-tab navigation pass.
- No `AndroidRuntime` crash.
- No React Native runtime error.
- `local-docs/android-smoke-dev-summary.txt` reports `Android smoke outcome: passed`.

Run standalone Metro smoke with `corepack yarn android:dev:smoke` only when the branch changes Metro/dev-server transport behavior.

Release-service change:

- Run the dependency/native validation above.
- Add release-build/source-map/dSYM validation specific to the changed service.
- If required secrets are missing, document the exact missing variables and stop before claiming release validation.

## Next Recommended Branches

1. Use `docs/svg-qr-render-compatibility-audit.md` before changing `react-native-svg` or `react-native-qrcode-svg`.
2. Use `docs/navigation-native-compatibility-audit.md` before changing `react-native-gesture-handler`, `react-native-screens`, or `react-native-safe-area-context`.
3. Use `docs/storage-network-native-compatibility-audit.md` before changing storage, config, secure storage, socket, NetInfo, device-info, localization, random-value, or WebView dependencies.
4. Use `docs/release-services-native-compatibility-audit.md` before changing Firebase, push notification, CodePush, or Sentry release-service dependencies.
5. Keep CameraKit scanner follow-up work scoped to the dedicated QR scanner screen.
