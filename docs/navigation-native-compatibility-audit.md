# Navigation Native Compatibility Audit

This audit supports `BEM-36 - Native modules upgrade` before changing navigation and layout native dependencies.

Checked on: 2026-05-27

## Current Repository State

- `react-native`: `0.68.7`
- `react`: `17.0.2`
- `react-native-gesture-handler`: manifest `^1.6.1`, lockfile `1.10.3`
- `react-native-screens`: `3.22.1`
- `react-native-safe-area-context`: manifest `^3.0.6`, lockfile `3.3.2`

Direct source usage found in this audit:

- `react-native-safe-area-context` is imported directly in `src/components/ScreenTemplate.tsx`.
- `react-native-gesture-handler` has no direct source import in `src`; it is still a native dependency for the current React Navigation stack and native autolinking.
- `react-native-screens` has no direct source import in `src`; it is still a native dependency for the current React Navigation stack and native autolinking.

## Npm Compatibility Snapshot

Current resolved packages:

```text
react-native-gesture-handler@1.10.3
dependencies:
- @egjs/hammerjs
- fbjs
- hoist-non-react-statics
- invariant
- prop-types

react-native-screens@3.22.1
peerDependencies:
- react: *
- react-native: *

react-native-safe-area-context@3.3.2
peerDependencies:
- react: *
- react-native: *
```

Latest npm metadata checked during this audit:

```text
react-native-gesture-handler latest: 2.31.2
peerDependencies:
- react: *
- react-native: *

react-native-screens latest: 4.25.2
peerDependencies:
- react: *
- react-native: >=0.82.0

react-native-safe-area-context latest: 5.8.0
peerDependencies:
- react: *
- react-native: *
```

## Findings

- `react-native-screens@4.25.2` is not compatible with the current RN `0.68.7` baseline because its npm peer dependency requires `react-native >=0.82.0`.
- The current `react-native-screens@3.22.1` was already stabilized earlier in the modernization stream to satisfy Android SDK 34 build compatibility.
- `react-native-gesture-handler` and `react-native-safe-area-context` latest metadata does not express a strict RN lower bound, but they still touch core navigation/layout behavior and should not be upgraded blindly.
- The directly guarded source surface is small for safe area, but navigation behavior is mostly integration-level: app startup, stack transitions, tabs, modal screens, scrolling templates, and keyboard/footer layout.

## Decision

- Do not bump `react-native-screens` to latest on the current RN `0.68.7` branch.
- Do not combine `react-native-gesture-handler`, `react-native-screens`, and `react-native-safe-area-context` upgrades in one broad branch.
- Keep `react-native-screens@3.22.1` fixed until a later RN baseline can support newer `react-native-screens` major versions.
- Use dedicated mini-branches for any `react-native-gesture-handler` or `react-native-safe-area-context` changes.

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
