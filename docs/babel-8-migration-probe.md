# Babel 8 Migration Probe

This document records the current Babel 8 blocker for the React Native `0.86.0` wallet baseline.

## Current Baseline

- React Native: `0.86.0`
- `@react-native/babel-preset`: `0.86.0`
- Direct Babel tooling: `7.29.7`
- Babel resolutions: `@babel/core@7.29.7`, `@babel/traverse@7.29.7`
- Node runtime used for the probe: `24.16.0`

## Probe Target

The probe attempted the current npm latest Babel `8.0.0` line for direct Babel packages and resolutions:

- `@babel/cli`
- `@babel/core`
- `@babel/plugin-transform-runtime`
- `@babel/preset-env`
- `@babel/preset-react`
- `@babel/preset-typescript`
- `@babel/runtime`
- `@babel/traverse`

## Result

The package install completed, but the runtime transform path is not compatible with the current React Native preset. The first failing plugin path is owned by `@react-native/babel-preset@0.86.0`, which still depends on the Babel 7 plugin stack. The concrete failure appears when Babel 8 loads `@babel/plugin-transform-flow-strip-types` from the RN preset:

```text
BABEL_VERSION_UNSUPPORTED
Requires Babel "^7.0.0-0", but was loaded with "8.0.0"
While processing: "@react-native/babel-preset/src/index.js.overrides[0]$0"
First plugin path: @babel/plugin-transform-flow-strip-types
```

## Commands Run

Metadata:

```powershell
npm view @babel/core@8.0.0 version engines peerDependencies dependencies --json
npm view @babel/runtime@8.0.0 version engines dependencies --json
npm view @babel/plugin-transform-runtime@8.0.0 version engines peerDependencies dependencies --json
npm view @react-native/babel-preset@0.86.0 version dependencies peerDependencies engines --json
npm view babel-jest@30.4.1 version dependencies peerDependencies engines --json
```

Install probe:

```powershell
# In D:\wt\GoldWallet\07-babel8-probe only:
# package.json direct Babel devDependencies and @babel/core/@babel/traverse resolutions were temporarily changed to 8.0.0.
$node=(npx -y -p node@24.16.0 node -p "process.execPath").Trim()
$yarn='C:\Program Files\nodejs\node_modules\corepack\dist\yarn.js'
& $node $yarn install
```

Transform probe:

```powershell
$node=(npx -y -p node@24.16.0 node -p "process.execPath").Trim()
$probe='const App = () => <Text>{foo?.bar ?? "x"}</Text>;'
& $node -e "const babel=require('@babel/core'); babel.transformSync(process.argv[1], {filename:'Sample.tsx', presets:['module:@react-native/babel-preset']});" $probe
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

Keep Babel 8 blocked on the current RN `0.86.0` baseline. It should only be retried in a dedicated RN/Metro/Babel branch after a React Native preset line supports Babel 8 plugins, or after a controlled migration replaces the RN preset/plugin stack and proves:

- direct Babel transform,
- Jest focused tests,
- Metro bundle,
- Android assemble,
- Android emulator smoke.

The current direct-outdated snapshot should continue to record Babel 8 entries as blocked, not review-required.
