# React Native Upgrade Path

This document records the React Native upgrade direction for the wallet modernization stream.

React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`.
React Native foundation milestone targets are tracked in `docs/react-native-foundation-target-matrix.md`.
The RN 0.85 foundation branch plan is tracked in `docs/react-native-076-foundation-plan.md`.
Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`.

React 19 impact audit is tracked in `docs/react19-impact-audit.md`.

React package coupling audit is tracked in `docs/react-package-coupling-audit.md`.

Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`.

## Current Baseline

- React Native: `0.85.3`
- React: `19.2.3`
- RN Babel preset: `0.85.3`
- RN Metro config: `0.85.3`
- Metro/dev Node runtime: `24.16.0`
- Android compile SDK: `36`
- Android target SDK: `36`
- Android build tools: `36.0.0`
- Android Gradle Plugin: `8.13.2`
- Gradle wrapper: `8.13`

The current baseline is the first RN foundation checkpoint, not the final modernization target. It also should not walk every minor version one by one. The goal is a controlled milestone-jump path toward a current supported React Native line after the dependency and native tooling blockers are understood.

Current Android template/toolchain baseline compiles and targets SDK 36 on AGP 8.13.2.

## Upgrade Principles

- Keep the app shippable after every mini-branch.
- Do not combine a React Native baseline step with unrelated rebranding, explorer, Electrum, Firebase, Sentry, or camera changes.
- Keep target SDK changes tied to the React Native/toolchain path that owns Android template and debug receiver behavior.
- Run emulator smoke for every runtime, dependency, native, or Metro-affecting branch.
- Re-check the latest stable React Native release during the actual RN baseline branch instead of hardcoding it in this document.
- Prefer milestone jumps over version-by-version package work. Current milestone target is the validated `0.85.x` line; future RN moves should target the next stable line only after branch-time evidence supports it. As of the 2026-06-03 live probe, npm `latest` is still `0.85.3`, while `0.86.0-rc.3` and `0.87.0-nightly-20260602-23ce90bd3` remain planning signals rather than default wallet upgrade targets.

## Required Work Before The Next RN Step

1. Keep Android lightweight validation and emulator smoke green.
2. Keep `react-native-camera` replacement scoped to the dedicated QR scanner migration branch.
3. Keep Sentry Gradle/source-map cleanup scoped to a dedicated release tooling branch.
4. Keep Firebase major-family upgrade scoped to a dedicated release-service branch.
5. Keep native module groups aligned with `docs/native-module-upgrade-plan.md`.
6. Keep the Metro/dev runtime aligned with `.nvmrc` and RN package engine requirements before each RN milestone jump.

## Proposed RN Step Shape

1. Create a dedicated RN baseline branch from `upgrade/wallet-modernization`.
2. Run the RN baseline preflight before changing package versions.
3. Check the current stable React Native line, the RN 0.85 foundation plan audit, and the upgrade helper diff at branch start.
4. Move to the next milestone target, with matching React, Metro, Gradle, Android template, iOS Podfile, and codegen changes.
5. Run TypeScript, Android assemble, Android warning audit, Metro reset, and emulator smoke before commit.
6. If a milestone fails, isolate the blocker before falling back to a lower milestone; do not automatically switch to one-minor-at-a-time work.

## Validation

Use this audit before starting or reviewing a React Native baseline branch:

```powershell
corepack yarn rn:upgrade-path:audit
```

The audit verifies that the current package baseline, Metro runtime baseline, Android build/target SDK baseline, Gradle baseline, SDK 36 readiness, and staged upgrade documentation still agree.

Before changing a React Native baseline, run the broader preflight so the current Android lightweight gate, Metro runtime audit, Node runtime transition audit, RN path audit, target snapshot audit and offline comparison guard, React 19 impact audit, React package coupling audit, test/type coupling audit, QR camera migration audit, Sentry warning/source-map readiness audits, Firebase release-service audit, CodePush release-path audit, and push-notification bridge audit are all checked from one command:

```powershell
corepack yarn rn:baseline:preflight
```

When network access is available at the start of an actual RN baseline branch, use the online variant first so the live npm target snapshot is refreshed and validated before the offline preflight runs:

```powershell
corepack yarn rn:baseline:preflight:online
```

For the first milestone branch, also keep the RN 0.85 foundation plan audit green:

```powershell
corepack yarn rn:076-foundation:audit
```
