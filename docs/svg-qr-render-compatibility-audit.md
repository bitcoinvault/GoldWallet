# SVG QR Render Compatibility Audit

This audit supports the `BEM-36` native module upgrade stream before changing `react-native-svg` or QR rendering dependencies.

Checked on: 2026-05-28
Baseline refreshed on: 2026-05-29 after the RN `0.81.6` foundation and SVG upgrade stream.

## Current Repository State

- `react-native`: `0.81.6`
- `react`: `19.1.4`
- `react-native-svg`: `15.15.5`
- `react-native-qrcode-svg`: `6.1.1`

Current guarded QR render surface:

- `src/screens/ContactQRCodeScreen.tsx`
- `src/screens/ExportWalletScreen.tsx`
- `src/screens/ExportWalletXpubScreen.tsx`
- `src/screens/OptionsAuthenticator/OptionsAuthenticatorScreen.tsx`
- `src/screens/ReceiveCoinsScreen.tsx`

Guard commands:

```powershell
corepack yarn check:qr-render-usage-guard
corepack yarn check:qr-render-usage
```

## Npm Compatibility Snapshot

The current installed QR stack is pinned as the validated renderer set:

```text
react-native-svg@15.15.5
peerDependencies:
- react: *
- react-native: *
dependencies:
- css-select ^5.1.0
- css-tree ^1.1.3

react-native-qrcode-svg@6.1.1
peerDependencies:
- react: *
- react-native: >=0.63.4
- react-native-svg: ^12.1.0
dependencies:
- prop-types ^15.7.2
- qrcode ^1.4.4, pinned by root `resolutions` to 1.4.4 for the current React Native runtime
```

The latest npm packages checked during this audit are not a drop-in pair for this repo:

```text
react-native-svg latest: 15.15.5
peerDependencies:
- react: *
- react-native: *

react-native-qrcode-svg latest: 6.3.21
peerDependencies:
- react: *
- react-native: >=0.63.4
- react-native-svg: >=14.0.0
```

## Findings

- The repo previously pinned `react-native-svg` to `9.5.1`, while the lockfile resolved `react-native-qrcode-svg@6.1.1`, which declares `react-native-svg ^12.1.0`.
- `BEM-36.57` pins `react-native-svg@12.5.1` and `react-native-qrcode-svg@6.1.1` as a compatible current-baseline QR renderer pair.
- The RN `0.81.6` stream later validates `react-native-svg@15.15.5` while keeping `react-native-qrcode-svg@6.1.1` and the root `qrcode@1.4.4` resolution.
- `react-native-qrcode-svg@6.1.2` and freshly resolved `qrcode@1.5.4` were rejected during Android Receive-screen smoke because the QR render path raised `ReferenceError: Can't find variable: TextEncoder`.
- The latest `react-native-qrcode-svg` line expects `react-native-svg >=14.0.0`.
- A future major QR rendering upgrade should still treat `react-native-svg` and `react-native-qrcode-svg` as a coupled compatibility pair, not as independent patch bumps.
- The QR render surface is small and now guarded, but it covers sensitive flows: receive address QR, contact QR, wallet secret export, xpub export, and authenticator QR display.

## Decision

- Keep `react-native-svg@15.15.5`, `react-native-qrcode-svg@6.1.1`, and root `qrcode@1.4.4` resolution fixed until a dedicated QR renderer branch validates the newer QR package line without the `TextEncoder` runtime regression.
- Do not combine QR render dependency changes with the camera scanner replacement branch.
- Use a dedicated branch for any future `react-native-svg` or `react-native-qrcode-svg` major-line migration.

## Required Validation For Future Upgrade

Run before commit on the future dependency branch:

```powershell
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:assemble
corepack yarn start --reset-cache
adb reverse tcp:8081 tcp:8081
corepack yarn android:dev:smoke
```

Manual app checks after the dependency change:

- Receive screen renders a QR code for the current wallet address.
- Contact QR screen renders a QR code.
- Export wallet secret QR renders.
- Export xpub QR renders.
- Authenticator options QR renders.
- No React Native runtime error related to SVG elements.
- No AndroidRuntime crash in logcat.

If iOS validation is available for the branch:

- Run `pod install`.
- Build the affected iOS scheme.
- Repeat the QR render screens on simulator/device.
