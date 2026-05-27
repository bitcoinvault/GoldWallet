# Native Module Upgrade Plan

This plan scopes `BEM-36 - Native modules upgrade` after the React Native `0.68.7` step.

The current dependency inventory is guarded by:

```powershell
corepack yarn check:native-module-inventory
```

If a native dependency version changes, update `scripts/nativeModuleInventoryGuard.mjs`, this plan, and the branch notes in `docs/wallet-modernization-log.md` in the same mini-branch.

## Current Constraints

- Keep Metro/dev runtime on Node 16.
- Use JDK 17 for Android build and smoke validation.
- Keep `react-native-camera` replacement separate from small native module cleanup branches.
- Keep Sentry SDK/release source-map changes separate from small native module cleanup branches.
- Do not mix iOS Podfile/deployment-target work into Android-only native cleanup branches.
- After any dependency update, run Metro with `--reset-cache` before emulator smoke.

## Upgrade Groups

### Group A - Already Stabilized In This Stream

- `@react-native-clipboard/clipboard` -> `1.11.2`
- `react-native-biometrics` -> `3.0.1`
- `react-native-screens` -> `3.22.1`
- `react-native-share` -> `7.9.1`
- `jail-monkey` -> `2.8.5`

Current expectation:

- Keep these versions fixed until the next RN baseline requires another bump.
- Do not revisit them unless Android audit, TypeScript, or emulator smoke shows a real compatibility issue.

### Group B - Navigation And Layout Native Surface

- `react-native-gesture-handler`
- `@react-native-community/blur`
- `react-native-bootsplash`
- `react-native-fast-image`
- `react-native-safe-area-context`
- `react-native-screens`
- `react-native-svg`
- `react-native-vector-icons`

Risk:

- Navigation startup, tabs, modals, splash transitions, blur layers, cached images, QR rendering, icon fonts, and layout insets can regress.

Branch shape:

- One mini-branch per package or a very small compatible pair.
- `docs/navigation-native-compatibility-audit.md` records the current navigation/layout package compatibility snapshot and validation path.
- `check:qr-render-usage` keeps the current `react-native-qrcode-svg` render surface explicit before `react-native-svg` changes.
- `docs/svg-qr-render-compatibility-audit.md` records the current npm compatibility snapshot and future validation path.
- Validate TypeScript, Android build, emulator dashboard smoke, wallet list, send/receive navigation, and QR display.
- For `react-native-svg` changes, manually check the guarded QR render screens: contact QR, export wallet secret, export xpub, authenticator options, and receive coins.

### Group C - Device, Storage, Network, And Runtime Integrations

- `@react-native-async-storage/async-storage`
- `@react-native-community/netinfo`
- `react-native-device-info`
- `react-native-config`
- `react-native-localize`
- `react-native-randombytes`
- `react-native-secure-key-store`
- `react-native-tcp-socket`
- `react-native-webview`

Risk:

- Wallet persistence, environment loading, network status, Electrum connectivity, localization, random byte generation, secure key handling, and embedded web content can regress.

Branch shape:

- Prefer one dependency per mini-branch.
- `docs/storage-network-native-compatibility-audit.md` records the current storage/config/network package compatibility snapshot and validation path.
- Validate app startup, wallet list persistence, settings/env loading, and logcat for native module crashes.
- For storage/secure-key-store changes, add or run focused storage/authenticator tests before emulator smoke.

### Group D - Notifications And Release Services

- `@react-native-firebase/app`
- `@react-native-firebase/analytics`
- `@react-native-firebase/crashlytics`
- `@react-native-firebase/messaging`
- `@react-native-community/push-notification-ios`
- `react-native-code-push`
- `@sentry/react-native`

Risk:

- Release builds, crash reporting, analytics events, push registration, notification permissions, source maps, and CodePush can regress.

Branch shape:

- Do not do a blind Firebase or Sentry major upgrade inside generic cleanup.
- Keep Sentry release/source-map validation in a dedicated branch.
- Keep Firebase grouped by package family only when Android and iOS config changes are understood.
- `docs/release-services-native-compatibility-audit.md` records the current Firebase, push, CodePush, and Sentry package snapshot, native build surface, and release validation path.
- Validate Android debug startup first, then release tooling separately when secrets and store/release config are available.

### Group E - Camera And QR Scanning

- `react-native-camera`
- `@remobile/react-native-qrcode-local-image`
- `react-native-qrcode-svg`

Risk:

- Camera permissions, QR scan callbacks, local QR image import, receive QR rendering, and navigation return values can regress.

Branch shape:

- Replace `react-native-camera` only in the dedicated QR scanner migration branch.
- Preserve all guarded QR scanner callers.
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
