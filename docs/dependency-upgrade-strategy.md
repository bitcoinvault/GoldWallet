# Dependency Upgrade Strategy

This project should not upgrade dependencies one package at a time unless the package is isolated and low risk. The current React Native baseline is old enough that many modern packages fail because of Metro, Babel, JavaScript runtime syntax, native templates, or peer ranges. The upgrade path should therefore move by layers.

## Current Rule

- Try the latest target first when the change is feasible.
- If latest fails, capture the exact blocker and choose the highest compatible version only as a temporary stopgap.
- Do not commit a dependency change that only passes TypeScript or Android assemble; runtime dependencies also need Metro reset and emulator smoke.
- Do not mix unrelated runtime families in the same branch.

## Upgrade Layers

### 1. Foundation Layer

Upgrade this layer before chasing most library majors:

- React Native, React, Metro, Babel presets/runtime, TypeScript, Jest transform stack.
- Android Gradle Plugin, Gradle wrapper, Kotlin/Java settings, compile/target SDK.
- iOS CocoaPods, Xcode project settings, deployment targets, native template drift.

Reason: recent blockers already show the current runtime cannot parse or resolve some modern packages:

- `uuid@14` fails Metro resolution because the package no longer exposes a classic `main` entry for this baseline.
- `uuid@11` resolves, but runtime fails on optional chaining/nullish coalescing syntax.
- `bip39@3.1.0` introduces a dependency path that fails runtime with `Unexpected token '?'`.

### 2. Native Module Cohorts

After the foundation branch is stable, upgrade native modules in groups with similar risk:

- Navigation and screen stack: `@react-navigation/*`, `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, masked view.
- Device/platform services: Firebase, Sentry, CodePush, push notifications, device info, config, localize, webview.
- Media and UI native modules: camera/scanner replacement, SVG, vector icons, fast image, share, slider, blur.

Each cohort needs Android build and emulator smoke. iOS changes need a separate macOS validation pass.

### 3. Wallet/Crypto Runtime Cohorts

Upgrade these as wallet-critical runtime groups, not as casual patch bumps:

- Mnemonic and key derivation: `bip39`, `bip32`, `bitcoinjs-lib`, `wif`, `ecurve`, `bigi`, `pbkdf2`, `randombytes`.
- Transaction building and coin selection: `coinselect`, BitcoinVault forks, Electrum client.
- Serialization, QR, URI parsing: `bech32`, `bip21`, QR packages.

Validation must include existing offline wallet tests plus emulator smoke. Funded transaction flow remains blocked until a funded BTCV testnet wallet is available.

### 4. Pure JS and Tooling Cohorts

Do these after the runtime foundation is newer:

- State stack: Redux, React Redux, Redux Saga, Reselect.
- Utility/runtime packages: Axios, Lodash, Dayjs, BigNumber, CryptoJS.
- Tooling: ESLint, Prettier, Husky, lint-staged, Jest, ts-jest, Detox.

These can be batched more aggressively because they either have strong automated gates or are developer-only.

## Branch Pattern

- `feature/bem-36-foundation-rn-target-audit`
- `feature/bem-36-foundation-rn-upgrade`
- `feature/bem-36-navigation-cohort-upgrade`
- `feature/bem-36-release-services-cohort-upgrade`
- `feature/bem-36-wallet-crypto-cohort-upgrade`
- `feature/bem-36-tooling-cohort-upgrade`

One branch can contain multiple packages when they belong to the same layer and share the same validation story.

## Start Here

The next coding branch should start with the foundation layer, not another isolated package. Use `docs/react-native-foundation-target-matrix.md` as the target matrix. The first planned milestone jump is RN `0.76.9`, not every intermediate RN minor. Then continue to an RN `0.82.x` React 19/Node 20 checkpoint and finally the current `0.85.x` line if branch-time evidence still supports that target.
