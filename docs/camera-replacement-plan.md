# Camera Replacement Plan

## Current State

- The app uses `react-native-camera` only in `src/screens/ScanQrCodeScreen.tsx`.
- The screen uses `RNCamera` for QR scanning through `onBarCodeRead`.
- Android requires `missingDimensionStrategy 'react-native-camera', 'general'`.
- Android and iOS camera permissions are already present.
- `react-native-camera` resolves to `3.44.3`; the latest package release is `4.2.1`.
- The latest `react-native-camera` still contains `jcenter()` in its Android Gradle file, so a package bump does not remove the warning.
- `corepack yarn check:camera-usage-scope` guards the current runtime usage surface before the replacement work starts.

## Why Replace

- The upstream `react-native-camera` repository is archived and deprecated.
- The current Android Gradle warning is dependency-owned and cannot be removed cleanly without replacing or patching the dependency.
- The QR scan surface is small enough to migrate in a dedicated branch, but it still touches native camera permissions and runtime scanning behavior.

## Candidate Options

### Preferred: VisionCamera Barcode Scanner

- Package path: `react-native-vision-camera` plus its barcode scanner package.
- Upstream docs describe barcode/QR scanning for both Android and iOS.
- The modern API can scan only `qr-code`, which matches GoldWallet's current use.
- Risk: current latest VisionCamera line has additional native dependencies and may require React Native/toolchain compatibility checks beyond RN 0.68.

### Alternative: Camera Kit

- Package path: `react-native-camera-kit`.
- Smaller API surface for scanner use cases.
- Risk: still requires native permission and scanner behavior validation; feature parity and maintenance need a separate proof build.

### Not Recommended: Patch `react-native-camera`

- A local `node_modules` patch would hide the warning but keep a deprecated camera stack.
- It would not reduce the real migration risk.
- It would have to be maintained across installs unless patch-package or a fork is introduced.

## Proposed Migration Branch

Branch: `feature/bem-camera-qr-scanner-migration`

Scope:

- Replace `ScanQrCodeScreen` camera implementation.
- Preserve the existing navigation contract: `route.params.onBarCodeScan(data)`.
- Preserve the duplicate-scan guard.
- Preserve the close button and crosshair overlay.
- Keep scan formats limited to QR codes.
- Remove `react-native-camera` from `package.json`, lockfile, Android Gradle flavor strategy, and iOS pods once the replacement is stable.

## Validation Plan

- `corepack yarn check:rn-nodeify-shims`.
- `corepack yarn check:camera-usage-scope`.
- `corepack yarn typescript:check`.
- `git diff --check`.
- Android debug build on JDK 17.
- Fresh install on Android emulator.
- Metro restart with `--reset-cache`.
- Open the QR scanner screen and verify camera permission behavior.
- Scan at least one QR value and verify `onBarCodeScan(data)` returns to the caller.
- Reopen scanner and verify duplicate-scan guard does not call the callback repeatedly.
- Check logcat for camera/runtime errors.
- iOS validation remains required on a Mac runner or device before calling the migration complete.

## References

- `react-native-camera` GitHub repository: https://github.com/react-native-camera/react-native-camera
- VisionCamera barcode scanner docs: https://react-native-vision-camera.com/docs/guides/code-scanning
