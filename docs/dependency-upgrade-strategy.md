# Dependency Upgrade Strategy

This project should not upgrade dependencies one package at a time unless the package is isolated and low risk. The app is now on the RN `0.85.3` / React `19.2.3` foundation checkpoint; RN `0.85.3` currently matches npm `latest`, while React `19.2.6` is intentionally blocked by the RN renderer exact-version constraint on this baseline. npm `next` for React Native is an RC line, is classified as `prerelease`, and is not the default wallet target. The upgrade path should therefore keep moving by layers, keep live snapshot checks at each foundation branch, and avoid returning to package-by-package churn.

## Current Rule

- Try the latest target first when the change is feasible.
- Treat npm `latest` as the default React Native target channel; npm `next` is planning evidence until a dedicated branch accepts prerelease risk.
- If latest fails, capture the exact blocker and choose the highest compatible version only as a temporary stopgap.
- Do not commit a dependency change that only passes TypeScript or Android assemble; runtime dependencies also need Metro reset and emulator smoke.
- Do not mix unrelated runtime families in the same branch.
- Validate the strategy guard with `corepack yarn upgrade:strategy:audit` before starting a foundation or cohort upgrade branch.

## Upgrade Layers

### 1. Foundation Layer

Upgrade this layer before chasing most library majors:

- React Native, React, Metro, Babel presets/runtime, TypeScript, Jest transform stack.
- Android Gradle Plugin, Gradle wrapper, Kotlin/Java settings, compile/target SDK.
- iOS CocoaPods, Xcode project settings, deployment targets, native template drift.

Reason: the first foundation checkpoint is complete, but recent proof branches still show that the next jump has coupled blockers that need to move together:

- The current RN target snapshot records `react-native@0.85.3` with React peer `^19.2.3`, matching the installed RN `0.85.3` checkpoint and React `19.2.3`; do not take React `19.2.6` separately because the app has already recorded an emulator-startup mismatch against `react-native-renderer@19.2.3`.
- RN `0.85.x` and RN `0.82.x` probes exposed native compatibility blockers around CodePush, React/runtime coupling, and mandatory New Architecture/codegen behavior in older native modules.
- Package-only RN jumps are invalid for this repo; package versions and template/native files need to move in the same foundation branch.

### 2. Native Module Cohorts

After each foundation checkpoint is stable, upgrade native modules in groups with similar risk:

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

Start wallet/crypto runtime work with:

```powershell
corepack yarn wallet:crypto-runtime:audit
```

### 4. Pure JS and Tooling Cohorts

Do these after the runtime foundation and native-module cohorts that own their validation surface are stable:

- State stack: Redux, React Redux, Redux Saga, Reselect.
- State runtime is on checked latest stable after `BEM-37.207`: `redux@5.0.1`, `react-redux@9.3.0`, `redux-saga@1.5.0`, and `reselect@5.2.0`.
- Utility/runtime packages: Axios, Lodash, Dayjs, BigNumber, CryptoJS.
- Node/RN polyfills: `buffer`, `events`, `path-browserify`, `stream-browserify`, `readable-stream`, `util`, and `url`; keep these in small runtime cohorts because Metro and wallet crypto flows depend on the same rn-nodeify shims.
- Lodash runtime is on checked latest `4.18.1` after `BEM-37.208`; `@types/lodash@4.17.24` is also checked latest.
- CryptoJS runtime is on checked latest `4.2.0` after `BEM-37.206`; future crypto work should focus on behavior coverage and replacement strategy, not another blind package bump.
- UUID runtime is on checked latest `14.0.0` after `BEM-37.279`; future work should focus on source behavior or Metro compatibility only if new UUID import surfaces are added.
- Stream polyfills are on `stream-browserify@3.0.0` and highest compatible `readable-stream@3.6.2` after `BEM-37.278`; latest `readable-stream@4.7.0` is blocked until the app's `readable-stream/readable` alias usage is migrated.
- Tooling: ESLint, Prettier, Husky, lint-staged, Jest, ts-jest, Detox.
- Use `corepack yarn tooling:latest-snapshot:audit` before tooling dependency branches when network access is available. It records live npm latest versions for the tracked tooling cohort into `local-docs/tooling-latest-snapshot.txt` without changing package versions.
- Use `corepack yarn tooling:latest-snapshot:check-summary` to validate that generated local snapshot before using it as branch-start evidence.
- The tooling snapshot also tracks isolated report/E2E/coverage tooling after `BEM-37.269`, `BEM-37.270`, and `BEM-37.295`: `jest-junit@17.0.0`, `junit-report-merger@9.0.3`, `babel-plugin-istanbul@8.0.0`, `mailosaur@11.1.1`, and `jsdom@29.1.1`.
- `lint-staged` is on checked highest compatible `16.4.0` after `BEM-37.210`; latest `17.0.6` requires Node `>=22.22.1`, above the current Node `v22.18.0` baseline.
- Prettier tooling is on checked highest compatible Prettier 2 line after `BEM-37.211`: `prettier@2.8.8`, `eslint-plugin-prettier@4.2.5`, and `eslint-config-prettier@8.10.2`; the checked latest Prettier 3 line is deferred to a separate formatting migration because it creates repo-wide `prettier/prettier` churn in the current lint baseline.
- TypeScript ESLint parser/plugin tooling is on checked latest `8.60.0` after `BEM-37.293`; this stays on the current ESLint `8.57.0` baseline because `@typescript-eslint@8.60.0` supports `eslint ^8.57.0 || ^9.0.0 || ^10.0.0`.
- The TypeScript ESLint v8 config compatibility is guarded after `BEM-37.294`: removed rule `@typescript-eslint/ban-types` must stay out of `.eslintrc`, and newly stricter v8 recommended rules that are not part of the current baseline remain explicitly disabled until a dedicated lint cleanup branch handles them.
- The unused legacy `@react-native-community/eslint-config` direct dev dependency is removed after `BEM-37.297`; `.eslintrc` already owns the active lint stack directly, and the community config would reintroduce an older nested lint toolchain if upgraded blindly.
- The deprecated unused `babel-eslint` direct dev dependency is removed after `BEM-37.298`; the active parser is `@typescript-eslint/parser`, and `babel-eslint` has no supported latest path beyond its deprecated `10.1.0` line.
- The deprecated stub `@types/react-navigation` direct dev dependency is removed after `BEM-37.299`; active `@react-navigation/*` v7 packages ship their own types, and the stub pulled old `react-navigation@4` packages into the lockfile.
- Jest tooling is on the checked latest Jest 30 runtime line after `BEM-37.301`: `jest@30.4.2`, `babel-jest@30.4.1`, `jest-circus@30.4.2`, and `jest-environment-node@30.4.1`. The React Native Jest preset still declares a Jest 29 environment internally, so package resolutions keep that environment/mock layer aligned with the Jest 30 runtime.
- Husky hook tooling is on checked latest `9.1.7` after `BEM-37.302`; hooks now live in `.husky/pre-commit` and `.husky/pre-push`, while the actual commands remain owned by the existing `precommit` and `prepush` package scripts.

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

The next coding branch should continue from the foundation layer or a blocker-removal branch that directly supports that layer, not another isolated package. Use `docs/react-native-foundation-target-matrix.md` as the target matrix. The current completed milestone jump is RN `0.85.3`, not every intermediate RN minor. Future RN work should target the next stable line only after branch-time evidence supports that target.
