# SVG QR Render Compatibility Audit

This audit supports the `BEM-36` native module upgrade stream before changing `react-native-svg` or QR rendering dependencies.

Checked on: 2026-05-27

## Current Repository State

- `react-native`: `0.68.7`
- `react`: `17.0.2`
- `react-native-svg`: `9.5.1`
- `react-native-qrcode-svg`: `^6.0.6`

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

The current installed manifest range resolves around the old QR stack:

```text
react-native-svg@9.5.1
peerDependencies:
- react: *
- react-native: >=0.50.0

react-native-qrcode-svg@6.0.6
peerDependencies:
- react: *
- react-native: >=0.59.0
- react-native-svg: ^9.6.4
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

- The repo currently pins `react-native-svg` to `9.5.1`, while `react-native-qrcode-svg@6.0.6` declares `react-native-svg ^9.6.4`.
- The latest `react-native-qrcode-svg` line expects `react-native-svg >=14.0.0`.
- A QR rendering upgrade should therefore treat `react-native-svg` and `react-native-qrcode-svg` as a coupled compatibility pair, not as independent patch bumps.
- The QR render surface is small and now guarded, but it covers sensitive flows: receive address QR, contact QR, wallet secret export, xpub export, and authenticator QR display.

## Decision

- Do not bump `react-native-svg` or `react-native-qrcode-svg` in a docs/audit branch.
- Do not combine QR render dependency changes with the camera scanner replacement branch.
- Use a dedicated `feature/bem-svg-qr-render-upgrade` branch when ready to test the dependency pair.

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
