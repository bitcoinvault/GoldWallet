# React Native Upgrade Path

This document records the staged React Native upgrade direction for the wallet modernization stream.

## Current Baseline

- React Native: `0.68.7`
- React: `17.0.2`
- Metro Babel preset: `0.67.0`
- Metro/dev Node runtime: `16.20.2`
- Android target SDK: `33`

The current branch does not target a direct jump to the latest React Native release. The goal is a controlled path toward a current supported React Native line after the dependency and native tooling blockers are reduced.

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
2. Check the current stable React Native line and the upgrade helper diff at branch start.
3. Move one React Native baseline step at a time, with matching React, Metro, Gradle, Android template, iOS Podfile, and codegen changes.
4. Run TypeScript, Android assemble, Android warning audit, Metro reset, and emulator smoke before commit.
5. Document remaining blockers before attempting the next RN baseline step.

## Validation

Use this audit before starting or reviewing a React Native baseline branch:

```powershell
corepack yarn rn:upgrade-path:audit
```

The audit verifies that the current package baseline, Metro runtime baseline, Android target-SDK deferral, and staged upgrade documentation still agree.
