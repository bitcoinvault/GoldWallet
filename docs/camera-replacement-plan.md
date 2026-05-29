# Camera Replacement Plan

## Current State

- The app uses `react-native-camera` only in `src/screens/ScanQrCodeScreen.tsx`.
- The screen uses `RNCamera` for QR scanning through `onBarCodeRead`.
- The scanner is opened from 8 current callers: authenticator list, create contact, import authenticator, import wallet, integrate key, recovery seed, recovery send, and send coins.
- Android requires `missingDimensionStrategy 'react-native-camera', 'general'`.
- Android and iOS camera permissions are already present.
- `react-native-camera` resolves to `3.44.3`; the latest package release checked on 2026-05-28 is `4.2.1`.
- The latest `react-native-camera` still contains `jcenter()` in its Android Gradle file, so a package bump does not remove the warning.
- `corepack yarn check:camera-usage-guard` verifies the camera usage guard fixtures.
- `corepack yarn check:camera-usage-scope` guards the current runtime usage surface before the replacement work starts.
- `corepack yarn check:qr-scan-caller-guard` verifies the caller-inventory guard fixtures.
- `corepack yarn check:qr-scan-callers` guards the current QR scanner caller inventory before the replacement work starts.
- `corepack yarn camera:qr-migration:audit` checks the current scanner dependency, native permission, guarded autolink, warning-baseline, and migration-documentation state before the replacement branch starts, and writes `local-docs/camera-qr-migration-summary.txt`.
- `corepack yarn camera:qr-migration:check-summary` validates the generated local camera QR migration summary.

## Why Replace

- The upstream `react-native-camera` repository is archived and deprecated.
- The current Android Gradle warning is dependency-owned and cannot be removed cleanly without replacing or patching the dependency.
- The QR scan surface is small enough to migrate in a dedicated branch, but it still touches native camera permissions and runtime scanning behavior.

## Candidate Options

### Preferred: VisionCamera Barcode Scanner

- Package path: `react-native-vision-camera`.
- Upstream docs describe barcode/QR scanning for both Android and iOS.
- The modern API can scan only `qr-code`, which matches GoldWallet's current use.
- Current latest package checked on 2026-05-28 is `react-native-vision-camera@5.0.11`.
- Risk: the current latest line depends on the Nitro module stack (`react-native-nitro-modules` and `react-native-nitro-image`), so it should be aligned with the RN foundation upgrade path rather than attempted as a small RN `0.68.7` warning cleanup.
- Highest checked v4 line is `react-native-vision-camera@4.7.3`; it still requires additional native/worklet dependencies and needs a proof build before selection.
- Current proof choice: VisionCamera proof branch first, CameraKit fallback.

### Alternative: Camera Kit

- Package path: `react-native-camera-kit`.
- Smaller API surface for scanner use cases.
- Current latest package checked on 2026-05-28 is `react-native-camera-kit@18.0.0`.
- Risk: the latest package declares `node >=18`, while the current RN `0.68.7` Metro/dev baseline remains Node 16. Treat this as a post-Node/RN-foundation candidate unless a compatible older line is deliberately selected and proof-built.
- Current proof role: CameraKit fallback if the VisionCamera proof branch fails on native/runtime complexity.

### Not Recommended: Patch `react-native-camera`

- A local `node_modules` patch would hide the warning but keep a deprecated camera stack.
- It would not reduce the real migration risk.
- It would have to be maintained across installs unless patch-package or a fork is introduced.

## Proposed Migration Branch

Branch: `feature/bem-camera-qr-scanner-migration`

Scope:

- Start with a proof branch that installs the chosen candidate, builds Android, and opens the scanner before deleting `react-native-camera`.
- Replace `ScanQrCodeScreen` camera implementation.
- Preserve the existing navigation contract: `route.params.onBarCodeScan(data)`.
- Preserve all current scanner entry points guarded by `check:qr-scan-callers`.
- Preserve the duplicate-scan guard.
- Preserve the close button and crosshair overlay.
- Keep scan formats limited to QR codes.
- Remove `react-native-camera` from `package.json`, lockfile, Android Gradle flavor strategy, and iOS pods once the replacement is stable.

## Validation Plan

- `corepack yarn check:rn-nodeify-shims`.
- `corepack yarn check:camera-usage-guard`.
- `corepack yarn check:camera-usage-scope`.
- `corepack yarn check:qr-scan-caller-guard`.
- `corepack yarn check:qr-scan-callers`.
- `corepack yarn camera:candidate:audit`.
- `corepack yarn camera:candidate:check-summary`.
- `corepack yarn camera:qr-migration:audit`.
- `corepack yarn camera:qr-migration:check-summary`.
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

## Sequencing Decision

- Do not replace `react-native-camera` as a warning-only cleanup.
- Keep `react-native-camera` guarded until the RN foundation path moves past the current RN `0.68.7` and Node 16 baseline, or until a candidate proof branch demonstrates compatibility without weakening scanner behavior.
- The first proof branch should compare VisionCamera and Camera Kit against the actual QR screen contract, not just npm peer ranges.

## References

- `react-native-camera` GitHub repository: https://github.com/react-native-camera/react-native-camera
- VisionCamera barcode scanner docs: https://react-native-vision-camera.com/docs/guides/code-scanning
