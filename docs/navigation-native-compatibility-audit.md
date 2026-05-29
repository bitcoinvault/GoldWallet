# Navigation Native Compatibility Audit

This audit supports `BEM-36 - Native modules upgrade` before changing navigation and layout native dependencies.

Checked on: 2026-05-28

## Current Repository State

- `react-native`: `0.68.7`
- `react`: `17.0.2`
- `@react-native-community/blur`: manifest and lockfile `4.4.1`
- `@react-native-community/masked-view`: manifest and lockfile `0.1.11`
- `react-native-bootsplash`: manifest and lockfile `3.2.7`
- `react-native-gesture-handler`: manifest and lockfile `1.10.3`
- `react-native-fast-image`: manifest and lockfile `8.6.3`
- `react-native-screens`: `3.22.1`
- `react-native-safe-area-context`: manifest and lockfile `3.4.1`
- `react-native-vector-icons`: manifest and lockfile `10.3.0`

Direct source usage found in this audit:

- `react-native-bootsplash` is used from `Main.tsx`, the Electrum saga startup path, Android `MainActivity`, and iOS `AppDelegate`.
- `@react-native-community/blur` is used from shared UI screen layers and must be validated visually on Android.
- `@react-native-community/masked-view` has no direct source import in `src`; it is still a native dependency for the current React Navigation stack and header/transition masking layer.
- `react-native-safe-area-context` is imported directly in `src/components/ScreenTemplate.tsx`.
- `react-native-gesture-handler` has no direct source import in `src`; it is still a native dependency for the current React Navigation stack and native autolinking.
- `react-native-fast-image` is re-exported from `src/components/Image.tsx` and used through shared button, list item, tab icon, and model types.
- `react-native-screens` has no direct source import in `src`; it is still a native dependency for the current React Navigation stack and native autolinking.
- `react-native-vector-icons` is used by the UI icon layer and copied native font assets.
- `@react-native-community/toolbar-android` is no longer installed after `react-native-vector-icons@10.3.0`; the package no longer declares that peer dependency.

## Npm Compatibility Snapshot

Current resolved packages:

```text
@react-native-community/blur@4.4.1
peerDependencies:
- react: *
- react-native: *

@react-native-community/masked-view@0.1.11
peerDependencies:
- react: >=16.0
- react-native: >=0.57

react-native-gesture-handler@1.10.3
dependencies:
- @egjs/hammerjs
- fbjs
- hoist-non-react-statics
- invariant
- prop-types

react-native-bootsplash@3.2.7
peerDependencies:
- react-native: >=0.60.0
dependencies:
- chalk ^4.1.2
- fs-extra ^10.0.0
- jimp ^0.16.1

react-native-screens@3.22.1
peerDependencies:
- react: *
- react-native: *

react-native-fast-image@8.6.3
peerDependencies:
- react: ^17 || ^18
- react-native: >=0.60.0

react-native-safe-area-context@3.4.1
peerDependencies:
- react: *
- react-native: *

react-native-vector-icons@10.3.0
peerDependencies:
- <none>
dependencies:
- prop-types ^15.7.2
- yargs ^16.1.1
```

Latest npm metadata checked during this audit:

```text
react-native-gesture-handler latest: 2.31.2
peerDependencies:
- react: *
- react-native: *

@react-native-community/blur latest checked in this stream: 4.4.1 for the current 4.x line

@react-native-community/masked-view latest checked in this stream: 0.1.11 for the deprecated community package line

react-native-screens latest: 4.25.2
peerDependencies:
- react: *
- react-native: >=0.82.0

react-native-fast-image latest checked in this stream: 8.6.3
peerDependencies:
- react: ^17 || ^18
- react-native: >=0.60.0

react-native-safe-area-context latest checked in this stream: 3.4.1 for the current 3.x line
peerDependencies:
- react: *
- react-native: *

react-native-vector-icons latest checked in this stream: 10.3.0

react-native-bootsplash latest checked in this stream: 3.2.7 for the current 3.x line
```

## Findings

- `react-native-screens@4.25.2` is not compatible with the current RN `0.68.7` baseline because its npm peer dependency requires `react-native >=0.82.0`.
- `@react-native-community/blur` is now on latest checked `4.4.1` after `BEM-36.55`; it still fits the current React 17 and RN 0.68 baseline according to npm peer metadata.
- `@react-native-community/masked-view` is now pinned to the already-resolved `0.1.11` after `BEM-36.66`; npm marks the package as moved to `@react-native-masked-view/masked-view`, but swapping packages should be a dedicated navigation validation branch.
- `react-native-bootsplash` is now on latest checked `3.2.7` after `BEM-36.54`; it still fits the current React Native `0.68.7` baseline.
- The current `react-native-screens@3.22.1` was already stabilized earlier in the modernization stream to satisfy Android SDK 34 build compatibility.
- `react-native-fast-image` is now on latest checked `8.6.3` after `BEM-36.53`; it still fits the current React 17 and RN 0.68 baseline.
- `react-native-vector-icons` is now on checked latest `10.3.0` after `BEM-37.110`; `@react-native-community/toolbar-android` has been removed because the updated icon package no longer needs it at Metro bundle time. The package now warns about moving to per-icon-family packages, which should be handled as a later icon-font migration rather than mixed into this warning cleanup.
- `react-native-safe-area-context` is now on latest checked `3.4.1` after `BEM-36.56`; it still fits the current React 17 and RN 0.68 baseline according to npm peer metadata.
- `react-native-gesture-handler` is now pinned to the already-resolved `1.10.3` after `BEM-36.65`; latest metadata does not express a strict RN lower bound, but it still touches core navigation behavior and should not be upgraded blindly.
- The directly guarded source surface is small for safe area, but navigation behavior is mostly integration-level: app startup, stack transitions, tabs, modal screens, scrolling templates, and keyboard/footer layout.

## Decision

- Do not bump `react-native-screens` to latest on the current RN `0.68.7` branch.
- Do not combine `react-native-gesture-handler`, `react-native-screens`, and `react-native-safe-area-context` upgrades in one broad branch.
- Keep `@react-native-community/blur@4.4.1` fixed until a later RN baseline or visual-layer branch requires another change.
- Keep `@react-native-community/masked-view@0.1.11` fixed until a later RN baseline or dedicated migration to `@react-native-masked-view/masked-view`.
- Keep `react-native-bootsplash@3.2.7` fixed until a later startup/splash or RN baseline branch requires another change.
- Keep `react-native-screens@3.22.1` fixed until a later RN baseline can support newer `react-native-screens` major versions.
- Keep `react-native-fast-image@8.6.3` fixed until a later RN baseline or image-cache replacement branch requires another change.
- Keep `react-native-vector-icons@10.3.0` fixed until a dedicated per-icon-family migration branch is planned.
- Keep `react-native-safe-area-context@3.4.1` fixed until a later RN baseline or layout branch requires another change.
- Keep `react-native-gesture-handler@1.10.3` fixed until a later RN baseline or dedicated navigation validation branch requires another change.

## Required Validation For Future Upgrade

Run before commit on a future dependency branch:

```powershell
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:assemble
corepack yarn start --reset-cache
adb reverse tcp:8081 tcp:8081
corepack yarn android:dev:smoke
```

Manual Android checks after the dependency change:

- App starts to dashboard.
- Wallet list remains scrollable.
- Bottom tabs work.
- Send and Receive navigation works.
- Modal and stack transitions do not crash.
- Screens using `ScreenTemplate` keep safe-area spacing and footer/keyboard layout.
- Logcat has no `AndroidRuntime` crash or React Native runtime error.

If iOS validation is available for the branch:

- Run `pod install`.
- Build the affected iOS scheme.
- Repeat startup, tab navigation, send/receive navigation, and safe-area/footer checks on simulator/device.
