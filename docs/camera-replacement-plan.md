# Camera Replacement Plan

## Current State

- The app uses `react-native-camera-kit` only in `src/screens/ScanQrCodeScreen.tsx`.
- Current scanner package: `react-native-camera-kit@18.0.0`.
- The screen uses CameraKit barcode scanning through `onReadCode`.
- The scanner is opened from 8 current callers: authenticator list, create contact, import authenticator, import wallet, integrate key, recovery seed, recovery send, and send coins.
- Android no longer requires `missingDimensionStrategy 'react-native-camera', 'general'`.
- Android and iOS camera permissions are already present.
- `react-native-camera` has been removed from the runtime dependency list.
- The unused legacy QR local-image package `@remobile/react-native-qrcode-local-image` has been removed from the JS dependency list and Android autolink guard.
- The latest legacy `react-native-camera` package checked on 2026-07-21 is still `4.2.1`, and it still does not solve the dependency-owned Android `jcenter()` warning cleanly.
- `corepack yarn check:camera-usage-guard` verifies the camera usage guard fixtures.
- `corepack yarn check:camera-usage-scope` guards the current runtime usage surface after the CameraKit migration.
- `corepack yarn check:qr-scan-caller-guard` verifies the caller-inventory guard fixtures.
- `corepack yarn check:qr-scan-callers` guards the current QR scanner caller inventory after the CameraKit migration.
- `corepack yarn test:qr-scanner:unit` validates the scanner screen contract for Android camera permission, CameraKit QR-only configuration, callback delivery, empty scans, and duplicate-scan suppression.
- `corepack yarn check:qr-scanner-validation-scripts` keeps that focused scanner test wired into the lightweight Android gate and prepush validation.
- `corepack yarn camera:candidate:audit` checks live npm metadata for the legacy camera, VisionCamera, CameraKit, QR renderer, QR native renderer, and QR encoder before scanner follow-up work, so stale candidate assumptions are visible before a dependency branch.
- The candidate audit also guards CameraKit peer ranges (`react@*`, `react-native@*`), QR renderer peer ranges (`react@*`, `react-native@>=0.63.4`, `react-native-svg@>=14.0.0`), and QR renderer dependencies (`prop-types@^15.8.0`, `qrcode@^1.5.4`, `text-encoding@^0.7.0`) so latest-compatible scanner decisions do not rely only on package version numbers.
- `corepack yarn camera:qr-migration:audit` checks the current scanner dependency, native permission, guarded autolink, warning-baseline, and migration-documentation state, separates removed camera-pod cleanup from broader iOS `Podfile.lock` drift, and writes `local-docs/camera-qr-migration-summary.txt`.
- `corepack yarn camera:qr-migration:check-summary` validates the generated local camera QR migration summary.
- `corepack yarn camera:qr-validation:handoff` and its dry-run now finish with the Camera/QR validation summary guard, summary generation, and summary check after the focused scanner/render validation steps.
- `corepack yarn camera:qr-validation:handoff --include-android-smoke` extends the Camera/QR handoff with Android dev assemble, embedded emulator smoke, and smoke-summary validation for scanner-affecting runtime changes.
- `corepack yarn camera:qr-validation:handoff --include-android-release-smoke --android-release-variant=<dev|stage|prod|beta>` builds and validates all release APKs, then refreshes release APK smoke, release create-wallet smoke, and both summary checks for the selected evidence variant.
- `corepack yarn camera:qr-validation:summary` writes `local-docs/camera-qr-validation-summary.txt`, tying candidate metadata, CameraKit migration wiring, Android dev QR scanner smoke evidence, optional Android release smoke evidence, the controlled Android release network blocker, and the iOS Podfile/runtime blocker into one guardable artifact.
- `corepack yarn camera:qr-validation:check-summary` validates that artifact and keeps iOS runtime validation explicitly unclaimed on Windows until `pod install` and scanner testing are completed on macOS/device.
- The QR migration audit verifies that removed camera pods are absent from `ios/Podfile.lock`; the same summary also reports broader iOS `Podfile.lock` drift from the RN/native-module baseline, so a stable Android/CameraKit scanner baseline is not mistaken for complete iOS runtime validation.
- The 2026-06-17 Camera/QR runtime validation refresh ran the full handoff with Android smoke included: CameraKit and QR renderer metadata matched live npm, focused scanner/render tests passed, `app-dev-debug.apk` installed on `emulator-5554`, first-run onboarding completed, empty dashboard CTA and tab navigation passed, the import-wallet QR scanner screen was opened and closed successfully, Settings Terms WebView passed, and no fatal/runtime logcat findings were reported. iOS camera QR runtime validation remains unclaimed until the broader `ios/Podfile.lock` drift is refreshed with `pod install` and the scanner is tested on macOS/device.
- The 2026-07-21 Camera/QR readiness refresh confirmed `react-native-camera-kit@18.0.0`, `react-native-qrcode-svg@6.3.21`, `react-native-svg@15.15.5`, and `qrcode@1.5.4` are still current npm latest packages. VisionCamera latest moved to `react-native-vision-camera@5.1.1` and still requires the Nitro native peer stack, so CameraKit remains the current compatible scanner target.
- The controlled release blocker is scoped to `dev` evidence because it describes the dev/testnet Electrum certificate. `stage`, `prod`, and `beta` summaries report that blocker as not applicable and remain `not ready` until their own release evidence passes; they cannot inherit the dev blocker as a substitute for variant-specific proof.
- On Windows the expected state is that Android/runtime dependency wiring can be guarded while iOS camera migration validation remains unclaimed until `pod install` refreshes the broader lockfile drift on macOS.

## Why Replace

- The upstream `react-native-camera` repository is archived and deprecated.
- The old Android Gradle warning was dependency-owned and could not be removed cleanly without replacing or patching the dependency.
- The QR scan surface is small enough to migrate in a dedicated branch, but it still touches native camera permissions and runtime scanning behavior.

## Candidate Options

### Preferred: VisionCamera Barcode Scanner

- Package path: `react-native-vision-camera`.
- Upstream docs describe barcode/QR scanning for both Android and iOS.
- The modern API can scan only `qr-code`, which matches GoldWallet's current use.
- Current latest package checked on 2026-07-21 is `react-native-vision-camera@5.1.1`.
- The camera candidate audit verifies this against live npm metadata before future scanner work.
- Risk: the current latest line depends on the Nitro module stack (`react-native-nitro-modules` and `react-native-nitro-image`); the live peer ranges are wildcarded (`react@*`, `react-native@*`, `react-native-nitro-image@*`, `react-native-nitro-modules@*`), so the blocker is the extra native architecture stack, not a narrow semver range. Align it with a future RN/native-module milestone rather than attempting it as a small warning cleanup.
- Highest checked v4 line is `react-native-vision-camera@4.7.3`; it still requires additional native/worklet dependencies and needs a proof build before selection.
- Current choice: CameraKit selected for the first migration branch because it avoids the Nitro peer dependency stack on the current RN foundation.

### Alternative: Camera Kit

- Package path: `react-native-camera-kit`.
- Smaller API surface for scanner use cases.
- Current latest package checked on 2026-07-21 is `react-native-camera-kit@18.0.0`.
- The camera candidate audit verifies this against live npm metadata before future scanner work.
- Node requirement `>=18` is compatible with the current Node 24 modernization baseline.
- Live peer ranges checked on 2026-07-21 remain `react@*` and `react-native@*`, so the installed CameraKit scanner remains the highest current compatible target without adding a new native peer stack.
- Current proof role: selected implementation for the QR scanner migration.

### QR Rendering Pair

- Current latest package checked on 2026-07-21 is `react-native-qrcode-svg@6.3.21`.
- Current latest native renderer package checked on 2026-07-21 is `react-native-svg@15.15.5`.
- Current latest encoder package checked on 2026-07-21 is `qrcode@1.5.4`.
- Live `react-native-qrcode-svg@6.3.21` peer ranges checked on 2026-07-21 remain `react@*`, `react-native@>=0.63.4`, and `react-native-svg@>=14.0.0`; the direct dependency set remains `prop-types@^15.8.0`, `qrcode@^1.5.4`, and `text-encoding@^0.7.0`.
- The camera candidate audit verifies all three QR rendering values against live npm metadata before future QR renderer work.
- The installed QR rendering pair remains current, so scanner follow-up work should focus on runtime camera behavior rather than another QR renderer bump.

### Not Recommended: Patch `react-native-camera`

- A local `node_modules` patch would hide the warning but keep a deprecated camera stack.
- It would not reduce the real migration risk.
- It would have to be maintained across installs unless patch-package or a fork is introduced.

## Completed Migration Branch

Branch: `feature/bem-37-camera-kit-qr-proof`

Scope:

- Installed CameraKit, built Android, and moved the scanner implementation to `react-native-camera-kit`.
- Replaced `ScanQrCodeScreen` camera implementation while preserving `route.params.onBarCodeScan(data)`.
- Preserved all current scanner entry points guarded by `check:qr-scan-callers`.
- Preserved the duplicate-scan guard.
- Preserved the close button and crosshair overlay.
- Kept scan formats limited to QR codes.
- Removed `react-native-camera` from `package.json`, lockfile, and Android Gradle flavor strategy; refresh iOS pods on a Mac before claiming iOS validation.

## Completed Legacy QR Local Image Cleanup

Branch: `feature/bem-37-remove-unused-qr-local-image`

Scope:

- Removed unused `@remobile/react-native-qrcode-local-image` from `package.json` and `yarn.lock`.
- Removed the stale Android autolink disable entry from `react-native.config.js`.
- Updated camera migration and legacy Android autolink guards so the removed package stays absent.
- iOS `Podfile.lock` and Xcode project still need a Mac `pod install`/project refresh before iOS validation is claimed. The lockfile no longer references removed `react-native-camera` and `react-native-qrcode-local-image` pods, but broader RN/native pod drift remains tracked by the iOS release readiness audit.

## Validation Plan

- `corepack yarn check:rn-nodeify-shims`.
- `corepack yarn check:camera-usage-guard`.
- `corepack yarn check:camera-usage-scope`.
- `corepack yarn check:qr-scan-caller-guard`.
- `corepack yarn check:qr-scan-callers`.
- `corepack yarn check:qr-scanner-validation-scripts`.
- `corepack yarn test:qr-scanner:unit`.
- `corepack yarn camera:candidate:audit`.
- `corepack yarn camera:candidate:check-summary`.
- `corepack yarn camera:qr-migration:audit`.
- `corepack yarn camera:qr-migration:check-summary`.
- `corepack yarn camera:qr-validation:handoff --include-android-smoke` for scanner-affecting runtime changes.
- `corepack yarn camera:qr-validation:handoff --include-android-release-smoke --android-release-variant=prod` when current production release APK evidence must prove the QR scanner screen and create-wallet flow.
- `corepack yarn check:camera-qr-validation-summary-guard`.
- `corepack yarn camera:qr-validation:summary`.
- `corepack yarn camera:qr-validation:check-summary`.
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
- Keep CameraKit guarded to `ScanQrCodeScreen` and keep the old scanner contract validation in place.
- VisionCamera remains a future option only if CameraKit proves insufficient on device coverage or scan quality.

## References

- `react-native-camera` GitHub repository: https://github.com/react-native-camera/react-native-camera
- VisionCamera barcode scanner docs: https://react-native-vision-camera.com/docs/guides/code-scanning
