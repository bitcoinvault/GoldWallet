# React Native Upgrade Path

This document records the React Native upgrade direction for the wallet modernization stream.

React Native target snapshot is tracked in `docs/react-native-target-snapshot.md`.
React Native foundation milestone targets are tracked in `docs/react-native-foundation-target-matrix.md`.
The RN foundation branch plan is tracked in `docs/react-native-076-foundation-plan.md`.
Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`.

React 19 impact audit is tracked in `docs/react19-impact-audit.md`.

React package coupling audit is tracked in `docs/react-package-coupling-audit.md`.
React Native renderer exact-version audit is tracked in `docs/react-package-coupling-audit.md`.

Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`.
TypeScript 7 compatibility probe is tracked by `corepack yarn typescript7:compatibility-probe:audit`. The probe now includes isolated latest-cohort npm install proof, so TypeScript 7 stays tied to real `@typescript-eslint` and `ts-jest` peer compatibility rather than an outdated-package label.
Plist major compatibility is tracked by `corepack yarn plist:major-compatibility:audit`.

## Current Baseline

- React Native: `0.86.2`
- React: `19.2.3`
- RN Babel preset: `0.86.2`
- RN Metro config: `0.86.2`
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
- Prefer milestone jumps over version-by-version package work. Current milestone target is the validated `0.86.x` line. As of the 2026-08-10 live probe, npm `latest` is `0.86.2`; `0.87.0-rc.4` remains a prerelease planning signal and the exact nightly version remains informational rather than the default wallet upgrade target. BEM-37.962 proves that the RC4 Android cohort builds with AGP 9's documented temporary legacy Kotlin/DSL opt-outs, while full dev/testnet runtime acceptance remains blocked by the expired external Electrum certificate.

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
3. Check the current stable React Native line, the RN foundation plan audit, and the upgrade helper diff at branch start.
4. Move to the next milestone target, with matching React, Metro, Gradle, Android template, iOS Podfile, and codegen changes.
5. Run TypeScript, Android assemble, Android warning audit, Metro reset, and emulator smoke before commit.
6. If a milestone fails, isolate the blocker before falling back to a lower milestone; do not automatically switch to one-minor-at-a-time work.

## Validation

Use this audit before starting or reviewing a React Native baseline branch:

```powershell
corepack yarn rn:upgrade-path:audit
```

The audit verifies that the current package baseline, Metro runtime baseline, Android build/target SDK baseline, Gradle baseline, SDK 36 readiness, and staged upgrade documentation still agree.

Before changing a React Native baseline, run the broader preflight so the current Android lightweight gate, Metro runtime audit, Node runtime transition audit, lint-staged, Husky, Prettier, Jest, RN path audit, target snapshot audit and offline comparison guard, React 19 impact audit, React package coupling audit, React Native renderer exact-version audit, test/type coupling audit, wallet crypto, CryptoJS, state runtime, Lodash runtime, Babel 8 migration blocker probe, QR camera migration audit, Sentry warning/source-map readiness audits, Firebase release-service audit, CodePush release-path audit, and push-notification bridge audit are all checked from one command:

```powershell
corepack yarn rn:baseline:preflight
```

When network access is available for target discovery without a full offline preflight, refresh the live foundation target summaries with:

```powershell
corepack yarn foundation:target:refresh-online
```

When network access is available at the start of an actual RN baseline branch, use the online variant first so the live npm target snapshot is refreshed and validated before the offline preflight runs:

```powershell
corepack yarn rn:baseline:preflight:online
```

The online preflight runs `foundation:target:refresh-online` and then the normal offline baseline gate. The foundation refresh ends by running:

```powershell
corepack yarn foundation:target:check-summaries
```

This keeps the next RN/Android foundation branch tied to the full target evidence set: RN latest channel, direct outdated blockers, generated React patch blocker evidence, generated Babel 8 blocker evidence with isolated latest-cohort install and transform proof, git dependency pins, wallet/crypto latest state, storage/network latest state, tooling latest state, the TypeScript 7 peer-range compatibility probe, Android toolchain blockers with committed direct-probe evidence validation, BL resolution, plist major compatibility, and node-fetch resolution.

For foundation milestone branches, also keep the legacy-named foundation plan audit green:

```powershell
corepack yarn rn:076-foundation:audit
```
