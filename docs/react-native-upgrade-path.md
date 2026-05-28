# React Native Upgrade Path

This document records the staged React Native upgrade direction for the wallet modernization stream.

React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`.
Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`.

React 19 impact audit is tracked in `docs/react19-impact-audit.md`.

React package coupling audit is tracked in `docs/react-package-coupling-audit.md`.

Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`.

## Current Baseline

- React Native: `0.68.7`
- React: `17.0.2`
- Metro Babel preset: `0.67.0`
- Metro/dev Node runtime: `16.20.2`
- Android compile SDK: `34`
- Android target SDK: `33`
- Android build tools: `34.0.0`
- Android Gradle Plugin: `7.4.2`
- Gradle wrapper: `7.5.1`

The current branch does not target a direct jump to the latest React Native release. The goal is a controlled path toward a current supported React Native line after the dependency and native tooling blockers are reduced.

Current Android template/toolchain baseline intentionally compiles with SDK 34 while keeping target SDK 33. Target SDK 34 should move only with the React Native/toolchain path that resolves Android 14+ debug receiver requirements.

## Upgrade Principles

- Keep the app shippable after every mini-branch.
- Do not combine a React Native baseline step with unrelated rebranding, explorer, Electrum, Firebase, Sentry, or camera changes.
- Keep `targetSdkVersion 34` deferred until the React Native/toolchain path can support Android 14+ debug receiver requirements.
- Run emulator smoke for every runtime, dependency, native, or Metro-affecting branch.
- Re-check the latest stable React Native release during the actual RN baseline branch instead of hardcoding it in this document.

## Required Work Before The Next RN Step

1. Keep Android lightweight validation and emulator smoke green.
2. Keep `react-native-camera` replacement scoped to the dedicated QR scanner migration branch.
3. Keep Sentry Gradle/source-map cleanup scoped to a dedicated release tooling branch.
4. Keep Firebase major-family upgrade scoped to a dedicated release-service branch.
5. Keep native module groups aligned with `docs/native-module-upgrade-plan.md`.
6. Keep Node 16 as the Metro/dev runtime until the RN baseline step intentionally changes it.

## Proposed RN Step Shape

1. Create a dedicated RN baseline branch from `upgrade/wallet-modernization`.
2. Run the RN baseline preflight before changing package versions.
3. Check the current stable React Native line and the upgrade helper diff at branch start.
4. Move one React Native baseline step at a time, with matching React, Metro, Gradle, Android template, iOS Podfile, and codegen changes.
5. Run TypeScript, Android assemble, Android warning audit, Metro reset, and emulator smoke before commit.
6. Document remaining blockers before attempting the next RN baseline step.

## Validation

Use this audit before starting or reviewing a React Native baseline branch:

```powershell
corepack yarn rn:upgrade-path:audit
```

The audit verifies that the current package baseline, Metro runtime baseline, Android build/target SDK baseline, Gradle baseline, Android target-SDK deferral, and staged upgrade documentation still agree.

Before changing a React Native baseline, run the broader preflight so the current Android lightweight gate, Metro runtime audit, Node runtime transition audit, RN path audit, target snapshot audit and offline comparison guard, React 19 impact audit, React package coupling audit, test/type coupling audit, QR camera migration audit, Sentry warning/source-map readiness audits, Firebase release-service audit, CodePush release-path audit, and push-notification bridge audit are all checked from one command:

```powershell
corepack yarn rn:baseline:preflight
```
