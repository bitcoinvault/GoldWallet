# SVG QR Render Compatibility Audit

This audit supports the `BEM-36` native module upgrade stream before changing `react-native-svg` or QR rendering dependencies.

Checked on: 2026-06-17
Baseline refreshed on: 2026-06-17 after the RN `0.86.2` foundation, CameraKit scanner validation refresh, and QR renderer latest-target check.

## Current Repository State

- `react-native`: `0.86.2`
- `react`: `19.2.3`
- `react-native-svg`: `15.15.5`
- `react-native-qrcode-svg`: `6.3.21`
- root `qrcode` resolution: `1.5.4`

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
corepack yarn check:qr-render-validation-scripts
corepack yarn test:qr-render:unit
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

react-native-qrcode-svg@6.3.21
peerDependencies:
- react: *
- react-native: >=0.63.4
- react-native-svg: >=14.0.0
dependencies:
- prop-types ^15.8.0
- qrcode ^1.5.4, pinned by root `resolutions` to 1.5.4
- text-encoding ^0.7.0

qrcode@1.5.4
engines:
- node: >=10.13.0
dependencies:
- dijkstrajs ^1.0.1
- pngjs ^5.0.0
- yargs ^15.3.1
```

## Findings

- The repo previously pinned `react-native-svg` to `9.5.1`, while the lockfile resolved `react-native-qrcode-svg@6.1.1`, which declares `react-native-svg ^12.1.0`.
- `BEM-36.57` pins `react-native-svg@12.5.1` and `react-native-qrcode-svg@6.1.1` as a compatible current-baseline QR renderer pair.
- The RN `0.85.3` stream later validates `react-native-svg@15.15.5`.
- `react-native-qrcode-svg@6.1.2` and freshly resolved `qrcode@1.5.4` were rejected during Android Receive-screen smoke because the QR render path raised `ReferenceError: Can't find variable: TextEncoder`.
- `BEM-37.158` revalidates the latest `react-native-qrcode-svg@6.3.21` line with root `qrcode@1.5.4` on RN `0.85.3`; upstream documents RN `0.75+` as compatible without the TextEncoder Metro transform required for older React Native versions.
- A future major QR rendering upgrade should still treat `react-native-svg` and `react-native-qrcode-svg` as a coupled compatibility pair, not as independent patch bumps.
- The QR render surface is small and now guarded, but it covers sensitive flows: receive address QR, contact QR, wallet secret export, xpub export, and authenticator QR display.
- `BEM-37.408` adds focused unit coverage for those five guarded QR render screens so future `react-native-svg`, `react-native-qrcode-svg`, or QR payload changes must keep the expected values wired into `QRCode`.
- The 2026-06-17 live npm refresh still reports `react-native-svg@15.15.5`, `react-native-qrcode-svg@6.3.21`, `qrcode@1.5.4`, and `react-native-camera-kit@18.0.0` as the latest package targets.
- The current RN `0.86.2` baseline keeps this QR renderer pair compatible: `react-native-svg` peers on `react` and `react-native` wildcard ranges, while `react-native-qrcode-svg` peers on `react-native >=0.63.4` and `react-native-svg >=14.0.0`.
- `camera:qr-migration:audit` reports `react-native-camera` absent, `react-native-camera-kit@18.0.0` installed, QR renderer/native/encoder versions aligned, removed camera pods absent from `ios/Podfile.lock`, and only broader non-camera iOS Podfile.lock drift remaining.
- Focused unit validation passes for both guarded QR surfaces: `test:qr-scanner:unit` covers Android camera permission gating, CameraKit QR-only configuration, callback delivery, empty scans, and duplicate-scan suppression; `test:qr-render:unit` covers the five QR rendering screens.

## Decision

- Keep `react-native-svg@15.15.5`, `react-native-qrcode-svg@6.3.21`, and root `qrcode@1.5.4` resolution fixed until the next dedicated QR renderer branch.
- Do not combine QR render dependency changes with the camera scanner replacement branch.
- Use a dedicated branch for any future `react-native-svg` or `react-native-qrcode-svg` major-line migration.

## Required Validation For Future Upgrade

Run before commit on the future dependency branch:

```powershell
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:verify
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
