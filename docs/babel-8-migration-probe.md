# Babel 8 Migration Probe

This document records the current Babel 8 blocker for the React Native `0.86.0` wallet baseline.

## Current Baseline

- React Native: `0.86.0`
- `@react-native/babel-preset`: `0.86.0`
- Direct Babel tooling: `7.29.7`
- Babel resolutions: `@babel/core@7.29.7`, `@babel/traverse@7.29.7`
- Node runtime used for the probe: repo `.nvmrc` baseline `24.16.0`

## Current Latest Target

Live npm metadata checked on 2026-07-12 reports the current Babel 8 target as a mixed `8.0.x` line:

- `@babel/cli@8.0.4`
- `@babel/core@8.0.1`
- `@babel/plugin-transform-runtime@8.0.1`
- `@babel/preset-env@8.0.2`
- `@babel/preset-react@8.0.1`
- `@babel/preset-typescript@8.0.1`
- `@babel/plugin-transform-flow-strip-types@8.0.1`
- `@babel/runtime@8.0.0`
- `@babel/traverse@8.0.4`
- `babel-plugin-polyfill-regenerator@1.0.0`

The current Babel 8 line requires Node `^22.18.0 || >=24.11.0`. The repo's active `.nvmrc` baseline `24.16.0` satisfies that engine range, so the blocker below is not a Node-runtime blocker.

## Probe Target

The isolated probe attempted the current npm latest Babel `8.0.x` line for direct Babel packages and resolutions:

- `@babel/cli`
- `@babel/core`
- `@babel/plugin-transform-runtime`
- `@babel/preset-env`
- `@babel/preset-react`
- `@babel/preset-typescript`
- `@babel/runtime`
- `@babel/traverse`

## Result

The full latest Babel 8 cohort package install completed in an isolated temp prefix: `@babel/cli@8.0.4`, `@babel/core@8.0.1`, `@babel/runtime@8.0.0`, `@babel/plugin-transform-runtime@8.0.1`, `@babel/preset-env@8.0.2`, `@babel/preset-react@8.0.1`, `@babel/preset-typescript@8.0.1`, `@babel/plugin-transform-flow-strip-types@8.0.1`, `@babel/traverse@8.0.4`, and `babel-plugin-polyfill-regenerator@1.0.0` all match the live latest target. The runtime transform path is still not compatible with the current React Native preset. A 2026-07-12 generated audit with the full latest Babel cohort and `@react-native/babel-preset@0.86.0` fails in the same RN-owned path. The first failing plugin path is owned by `@react-native/babel-preset@0.86.0`, which still depends on the Babel 7 plugin stack. The concrete failure appears when Babel 8 loads `@babel/plugin-transform-flow-strip-types` from the RN preset:

```text
BABEL_VERSION_UNSUPPORTED
Requires Babel "^7.0.0-0", but was loaded with "8.0.1"
While processing: "base$0.overrides[0]$0"
First plugin path: @babel/plugin-transform-flow-strip-types
```

## Commands Run

Metadata:

```powershell
corepack yarn babel8:migration-probe:audit
npm view @babel/cli version engines dependencies --json
npm view @babel/core version engines peerDependencies dependencies --json
npm view @babel/runtime version engines dependencies --json
npm view @babel/plugin-transform-runtime version engines peerDependencies dependencies --json
npm view @babel/preset-env version engines peerDependencies dependencies --json
npm view @babel/preset-react version engines peerDependencies dependencies --json
npm view @babel/preset-typescript version engines peerDependencies dependencies --json
npm view @babel/plugin-transform-flow-strip-types version engines peerDependencies dependencies --json
npm view @babel/traverse version engines dependencies --json
npm view babel-plugin-polyfill-regenerator version engines dependencies --json
npm view @react-native/babel-preset@0.86.0 version dependencies peerDependencies engines --json
npm view babel-jest@30.4.1 version dependencies peerDependencies engines --json
```

The generated audit writes `local-docs/babel-8-migration-probe-summary.txt`; validate it with:

```powershell
corepack yarn babel8:migration-probe:check-summary
```

Install probe:

```powershell
# In an isolated temp prefix only:
$tmp = Join-Path $env:TEMP 'goldwallet-babel8-probe'
npm install --prefix $tmp --ignore-scripts --no-audit --no-fund @babel/cli@8.0.4 @babel/core@8.0.1 @babel/runtime@8.0.0 @babel/plugin-transform-runtime@8.0.1 @babel/preset-env@8.0.2 @babel/preset-react@8.0.1 @babel/preset-typescript@8.0.1 @babel/plugin-transform-flow-strip-types@8.0.1 @babel/traverse@8.0.4 babel-plugin-polyfill-regenerator@1.0.0 @react-native/babel-preset@0.86.0
```

Transform probe:

```powershell
Push-Location $tmp
node .\probe.cjs
Pop-Location
```

Observed output:

```text
babel 8.0.1
preset 0.86.0
BABEL_VERSION_UNSUPPORTED
Requires Babel "^7.0.0-0", but was loaded with "8.0.1".
```

Jest/storage probe:

```powershell
$node=(npx -y -p node@24.16.0 node -p "process.execPath").Trim()
$yarn='C:\Program Files\nodejs\node_modules\corepack\dist\yarn.js'
& $node $yarn test:storage-network:focused
& $node $yarn test:unit --runInBand
```

Metro `react-native bundle` probe:

```powershell
$node=(npx -y -p node@24.16.0 node -p "process.execPath").Trim()
& $node .\node_modules\react-native\cli.js bundle --platform android --dev false --entry-file index.js --bundle-output local-docs\babel8-probe\index.android.bundle --assets-dest local-docs\babel8-probe\assets
```

## Decision

Keep Babel 8 blocked on the current RN `0.86.0` baseline. The 2026-07-12 latest-target refresh keeps this as a React Native preset/plugin-stack blocker, not a Node engine blocker or a partial package probe. It should only be retried in a dedicated RN/Metro/Babel branch after a React Native preset line supports Babel 8 plugins, or after a controlled migration replaces the RN preset/plugin stack and proves:

- direct Babel transform,
- Jest focused tests,
- Metro bundle,
- Android assemble,
- Android emulator smoke.

The current direct-outdated snapshot should continue to record Babel 8 entries as blocked, not review-required.
