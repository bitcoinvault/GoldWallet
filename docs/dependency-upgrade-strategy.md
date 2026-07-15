# Dependency Upgrade Strategy

This project should not upgrade dependencies one package at a time unless the package is isolated and low risk. The app is now on the RN `0.86.0` / React `19.2.3` foundation checkpoint; RN `0.86.0` currently matches npm `latest`, while React `19.2.7` is intentionally blocked by the RN renderer exact-version constraint on this baseline. npm `next` for React Native is an RC line, is classified as `prerelease`, and is not the default wallet target. The upgrade path should therefore keep moving by layers, keep live snapshot checks at each foundation branch, and avoid returning to package-by-package churn.

## Current Rule

- Try the latest target first when the change is feasible.
- Treat npm `latest` as the default React Native target channel; npm `next` is planning evidence until a dedicated branch accepts prerelease risk.
- If latest fails, capture the exact blocker and choose the highest compatible version only as a temporary stopgap.
- Do not commit a dependency change that only passes TypeScript or Android assemble; runtime dependencies also need Metro reset and emulator smoke.
- Do not mix unrelated runtime families in the same branch.
- Validate the strategy guard with `corepack yarn upgrade:strategy:audit` before starting a foundation or cohort upgrade branch.
- When network access is available for target discovery or a React Native foundation branch, use `corepack yarn foundation:target:refresh-online` so `check:node-runtime-version` runs before the live RN target snapshot, direct outdated snapshot, generated React patch blocker summary, generated Babel 8 migration blocker summary, git dependency snapshot, wallet/crypto latest snapshot, storage/network latest snapshot, tooling latest snapshot, TypeScript 7 compatibility probe, Android toolchain target, BL resolution, plist major compatibility, and node-fetch resolution summaries are refreshed and validated through `foundation:target:check-summaries`. For an actual RN baseline branch, use `corepack yarn rn:baseline:preflight:online`; it runs the same online refresh first and then follows with the offline baseline gate.
- If the terminal is on a different global Node than `.nvmrc`, use `corepack yarn node:runtime:yarn <script>` for network-backed latest snapshots. The wrapper runs Corepack/Yarn through `npm exec --package node@<.nvmrc>` so generated snapshot summaries are not invalidated by a stale shell runtime.
- Treat clean Git dependency snapshots as fork-preservation evidence, not permission to casually replace wallet-critical forks. If `bitcoinjs-lib`, `electrum-client`, or `react-native-prompt-android` changes, use a dedicated compatibility branch with wallet/storage validation.

## Upgrade Layers

### 1. Foundation Layer

Upgrade this layer before chasing most library majors:

- React Native, React, Metro, Babel presets/runtime, TypeScript, Jest transform stack.
- Android Gradle Plugin, Gradle wrapper, Kotlin/Java settings, compile/target SDK.
- The current Android baseline stays on AGP `8.13.2`, Gradle `8.13`, Kotlin `2.1.20`, SDK `36`, and JDK `17`; use `corepack yarn android:toolchain-target:audit` before another Android toolchain branch. Live metadata on 2026-07-15 showed AGP `9.3.0`, Gradle `9.6.1`, stable Kotlin Gradle Plugin `2.4.10`, and Kotlin metadata release `2.4.20-Beta1` as prerelease-only. A real isolated AGP `9.3.0` / Gradle `9.6.1` / Kotlin `2.4.10` probe still failed in the React Native Gradle plugin `:gradle-plugin:settings-plugin:compileKotlin` path. The AGP 9 path stays blocked until a future React Native Gradle plugin baseline can compile against Gradle 9's embedded Kotlin metadata.
- Direct React Native CLI tooling is on checked latest `20.2.0` after `BEM-37.821`; future `@react-native-community/cli*` drift should still be handled in a dedicated RN CLI/tooling branch with Android assemble, Metro startup, emulator smoke, and iOS static handoff proof.
- iOS CocoaPods, Xcode project settings, deployment targets, native template drift.

Reason: the first foundation checkpoint is complete, but recent proof branches still show that the next jump has coupled blockers that need to move together:

- The current RN target snapshot records `react-native@0.86.0` with React peer `^19.2.3`, matching the installed RN `0.86.0` checkpoint and React `19.2.3`; do not take React `19.2.7` separately because the app has already recorded an emulator-startup mismatch against `react-native-renderer@19.2.3`.
- RN `0.85.x` and RN `0.82.x` probes exposed native compatibility blockers around CodePush, React/runtime coupling, and mandatory New Architecture/codegen behavior in older native modules.
- Package-only RN jumps are invalid for this repo; package versions and template/native files need to move in the same foundation branch.

### 2. Native Module Cohorts

After each foundation checkpoint is stable, upgrade native modules in groups with similar risk:

- Navigation and screen stack: `@react-navigation/*`, `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, masked view.
- React Navigation is on checked latest v7 patch baselines after `BEM-37.828`: `@react-navigation/native@7.3.8`, `@react-navigation/stack@7.10.11`, `@react-navigation/bottom-tabs@7.18.8`, and `@react-navigation/devtools@7.1.5`. `react-native-screens@4.26.1` is the checked native screens baseline after `BEM-37.901`; `react-native-safe-area-context@5.8.0` and `react-native-gesture-handler@3.0.2` remain the current native navigation peers. Future navigation drift should stay in a dedicated navigation/smoke branch.
- Device/platform services: Firebase, Sentry, CodePush, push notifications, device info, config, localize, webview.
- Media and UI native modules: camera/scanner replacement, SVG, vector icons, fast image, share, slider, blur.

Each cohort needs Android build and emulator smoke. iOS changes need a separate macOS validation pass.

### 3. Wallet/Crypto Runtime Cohorts

Upgrade these as wallet-critical runtime groups, not as casual patch bumps:

- Mnemonic and key derivation: `bip39`, `bip32`, `bitcoinjs-lib`, `wif`, `ecurve`, `bigi`, `pbkdf2`, and the React Native random-value provider.
- Transaction building and coin selection: `coinselect`, BitcoinVault forks, Electrum client.
- Serialization, QR, URI parsing: `bech32`, `bip21`, QR packages.

Validation must include existing offline wallet tests plus emulator smoke. Funded transaction flow remains blocked until a funded BTCV testnet wallet is available.

Start wallet/crypto runtime work with:

```powershell
corepack yarn wallet:crypto-runtime:audit
corepack yarn direct-outdated:snapshot:audit
corepack yarn direct-outdated:snapshot:check-summary
corepack yarn git-deps:snapshot:audit
corepack yarn git-deps:snapshot:check-summary
corepack yarn wallet:crypto-latest-snapshot:audit
corepack yarn wallet:crypto-latest-snapshot:check-summary
```

### 4. Pure JS and Tooling Cohorts

Do these after the runtime foundation and native-module cohorts that own their validation surface are stable:

- State stack: Redux, React Redux, Redux Saga, Reselect.
- State runtime is on checked latest stable after `BEM-37.207`: `redux@5.0.1`, `react-redux@9.3.0`, `redux-saga@1.5.0`, and `reselect@5.2.0`.
- Utility/runtime packages: Axios, Lodash, Dayjs, BigNumber, CryptoJS.
- Node/RN polyfills: `buffer`, `events`, `path-browserify`, `stream-browserify`, `readable-stream`, `util`, and `url`; keep these in small runtime cohorts because Metro and wallet crypto flows depend on the same rn-nodeify shims.
- Lodash runtime is on checked latest `4.18.1` after `BEM-37.208`; `@types/lodash@4.17.24` is also checked latest.
- CryptoJS runtime is on checked latest `4.2.0` after `BEM-37.206`; future crypto work should focus on behavior coverage and replacement strategy, not another blind package bump.
- Localization runtime is on checked latest `i18next@26.3.6` and `react-i18next@17.0.9` after `BEM-37.823`; `react-i18next` accepts `i18next >=26.2.0`.
- Toast UI runtime is on checked latest `react-native-toast-message@2.4.0` after `BEM-37.829`; future toast drift should stay in a dedicated notification UI branch with TypeScript/unit proof, Android build, and emulator smoke because the package is app-runtime UI even though current source usage is narrow.
- UUID runtime is on checked latest `14.0.1` after `BEM-37.764`; future work should focus on source behavior or Metro compatibility only if new UUID import surfaces are added.
- Stream polyfills are on `stream-browserify@3.0.0` and checked latest `readable-stream@4.7.0` after `BEM-37.320`; the previous `readable-stream/readable` alias blocker is handled by v4 `lib/_stream_*` aliases plus the postinstall rn-nodeify alias guard.
- `bl` is on checked highest compatible `6.1.6` after `BEM-37.384`; live npm metadata on 2026-07-11 reports latest `7.0.6`, but the latest line remains blocked because it is ESM/export-only while `levelup` and `ora` still require `bl` through CommonJS.
- `plist` remains on the checked CommonJS-compatible `3.1.1` resolution with `simple-plist@1.3.1` after `BEM-37.881`; live npm metadata reports `plist@5.0.0`, but the latest line is ESM/import-only and breaks the current `react-native-bootsplash > @expo/config-plugins > xcode > simple-plist > plist` owner path with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- Tooling: ESLint, Prettier, Husky, lint-staged, Jest, ts-jest, Detox.
- TypeScript compiler tooling is on checked latest compatible `6.0.3` after `BEM-37.305`; the config removes the deleted `suppressImplicitAnyIndexErrors` option and keeps the current RN path/module behavior under `ignoreDeprecations: "6.0"`.
- TypeScript 7 is tracked by `corepack yarn typescript7:compatibility-probe:audit`; live metadata on 2026-07-12 still reports `typescript@7.0.2`, and it remains blocked until a dedicated compiler/RN/Metro branch moves TypeScript, `@typescript-eslint`, and Jest transform tooling together because `@typescript-eslint@8.63.0` peers `typescript >=4.8.4 <6.1.0` and `ts-jest@29.4.11` peers `typescript >=4.3 <7`. The probe now strengthens that decision with an isolated latest-cohort install: normal npm install fails with `ERESOLVE`, and the legacy-peer fallback confirms the same peer ceilings without changing the repo lockfile.
- Babel `8.x` is recorded as blocked after `BEM-37.682` because RN `0.86.0` still ships a Babel preset dependency stack on Babel `7.x` plugins. Treat Babel 8 as a dedicated RN/Metro/Babel migration branch, not as a direct package patch. Use `corepack yarn babel8:migration-probe:audit`, `corepack yarn babel8:migration-probe:check-summary`, and `corepack yarn babel8:migration-probe:check` to refresh the generated `local-docs/babel-8-migration-probe-summary.txt` evidence and keep the static blocker evidence aligned. The probe now installs the full latest Babel 8 cohort in isolation and then proves the RN preset transform failure, so the blocker is tied to actual package behavior rather than metadata only.
- Use `corepack yarn tooling:latest-snapshot:audit` before tooling dependency branches when network access is available. It records live npm latest versions for the tracked tooling cohort into `local-docs/tooling-latest-snapshot.txt` without changing package versions.
- Use `corepack yarn tooling:latest-snapshot:check-summary` to validate that generated local snapshot before using it as branch-start evidence.
- The tooling snapshot also tracks isolated report/E2E/coverage tooling after `BEM-37.269`, `BEM-37.270`, `BEM-37.295`, and `BEM-37.322`: `jest-junit@17.0.0`, `junit-report-merger@9.0.4`, `babel-plugin-istanbul@8.0.0`, `mailosaur@11.1.1`, and `jsdom@29.1.1`.
- Small tooling patch cohort is refreshed through `BEM-37.856`: `@types/react@19.2.17`, `@typescript-eslint/eslint-plugin@8.63.0`, `@typescript-eslint/parser@8.63.0`, `eslint@10.7.0`, `@eslint/js@10.0.1`, `@eslint/eslintrc@3.3.6`, `@eslint/compat@2.1.0`, `jiti@2.7.0`, `detox@20.51.4`, `prettier@3.9.5`, `semver@7.8.5`, `caniuse-lite@1.0.30001805`, and `junit-report-merger@9.0.4`. `BEM-37.862` refreshes the Browserslist data resolution with lockfile, Android build, and controlled no-network smoke proof; full dashboard smoke remains blocked by the dev/testnet Electrum TLS certificate until that external endpoint is fixed.
- Security transitive baselines are guarded after `BEM-37.863` through `BEM-37.879`: `elliptic@6.6.1`, `cipher-base@1.0.7`, `sha.js@2.4.12`, `shell-quote@1.10.0`, `minimist@1.2.8`, Sentry CLI `undici@8.7.0`, `plist@3.1.1`, `simple-plist@1.3.1`, `braces@3.0.3`, `form-data@4.0.6`, `moment@2.30.1`, `qs@6.15.3`, `tmpl@1.0.5`, `tmp@0.2.7`, `joi@18.2.3`, `launch-editor@2.14.1`, `micromatch@4.0.8`, `protobufjs@8.7.0`, `word-wrap@1.2.5`, scoped `**/xcode/uuid@14.0.1`, `serve-static@2.2.1`, `send@1.2.1`, lockfile `ansi-regex`, lockfile `base-x@3.0.11`, lockfile `brace-expansion@1.1.16`/`2.1.2`/`5.0.7`, lockfile `js-yaml@3.15.0`/`4.3.0`, lockfile `yaml@1.10.3`/`2.9.0`, lockfile `minimatch@3.1.5`, lockfile `picomatch@2.3.2`, lockfile `lodash@4.18.1`, lockfile `jws@4.0.1`, lockfile `ws@7.5.11`, and wallet-critical `tiny-secp256k1@2.2.4`. `BEM-37.868` keeps React Native runtime compatibility through a Metro-only `tiny-secp256k1` shim backed by `@bitcoinerlab/secp256k1`, because the upstream browser entry imports WASM. `BEM-37.872` reduced the remaining moderate audit surface from `1` to `0` findings by moving the `react-native-bootsplash > @expo/config-plugins > xcode > uuid` owner path from `uuid@7.0.3` to patched `uuid@11.1.1`; `BEM-37.873` cleared the low audit surface with compatible RN CLI server-path patches; `BEM-37.875` accepted the latest `serve-static@2.2.1` / `send@1.2.1` major owner path after Metro startup, Android build, and emulator no-network smoke proof; `BEM-37.876` accepts latest `uuid@14.0.1` for the `xcode` owner path after xcode parse/generate proof; `BEM-37.877` accepts latest `joi@18.2.3` for the RN CLI config/type owner path after RN CLI config, Android build, and emulator no-network smoke proof; `BEM-37.878` accepts latest `protobufjs@8.7.0` for the Firebase/Firestore proto-loader owner path after CommonJS/proto-loader API probes, Android build, and emulator no-network smoke proof; `BEM-37.879` accepts latest `undici@8.7.0` for the Sentry CLI install/download owner path after CJS API, Sentry CLI, release-service prerequisite, Android build, and emulator no-network smoke proof. `corepack yarn audit --level low` now reports `0 vulnerabilities found`. The security branches reduced `corepack yarn audit --json --level high` from `22` critical / `148` high to `0` critical / `0` high.
- BigNumber is on checked latest `bignumber.js@11.1.5` after `BEM-37.827`; future numeric runtime drift still needs a dedicated wallet amount branch with money-math probes, wallet/offline tests, transaction amount-label guards, Android build, and emulator smoke.
- `lint-staged` is on checked latest `17.0.8` after the Node 24 tooling baseline; it requires Node `>=22.22.1`, so run hooks and validation with the `.nvmrc` Node runtime. The `precommit`, `prepush`, `android:dev:check-light`, `rn:baseline:preflight`, and `rn:baseline:preflight:online` scripts intentionally run `check:node-runtime-version` first so Git hooks and direct validation entrypoints fail fast unless the active shell matches `.nvmrc`; `precommit` then runs `lint-staged:tooling:audit` before `lint-staged` instead of relying on package-manager engine behavior.
- Prettier tooling is on checked latest Prettier 3 line after `BEM-37.826`: `prettier@3.9.5`, `eslint-plugin-prettier@5.5.6`, and `eslint-config-prettier@10.1.8`; no mass formatting was performed, and the existing lint baseline remains tracked separately.
- ESLint is on checked latest `10.7.0` after `BEM-37.856`; `eslint.config.mjs` bridges the existing `.eslintrc` baseline through `FlatCompat`, `.eslintignore` is removed, and the current lint baseline remains tracked separately.
- TypeScript ESLint parser/plugin tooling is on checked latest `8.63.0` after `BEM-37.826`; it is verified through the ESLint 10 flat-config bridge because `@typescript-eslint@8.63.0` supports `eslint ^8.57.0 || ^9.0.0 || ^10.0.0` and `typescript >=4.8.4 <6.1.0`.
- The TypeScript ESLint v8 config compatibility is guarded after `BEM-37.294`: removed rule `@typescript-eslint/ban-types` must stay out of `.eslintrc`, and newly stricter v8 recommended rules that are not part of the current baseline remain explicitly disabled until a dedicated lint cleanup branch handles them.
- The unused legacy `@react-native-community/eslint-config` direct dev dependency is removed after `BEM-37.297`; `.eslintrc` already owns the active lint stack directly, and the community config would reintroduce an older nested lint toolchain if upgraded blindly.
- The deprecated unused `babel-eslint` direct dev dependency is removed after `BEM-37.298`; the active parser is `@typescript-eslint/parser`, and `babel-eslint` has no supported latest path beyond its deprecated `10.1.0` line.
- The deprecated stub `@types/react-navigation` direct dev dependency is removed after `BEM-37.299`; active `@react-navigation/*` v7 packages ship their own types, and the stub pulled old `react-navigation@4` packages into the lockfile.
- Flipper debug tooling is removed after `BEM-37.324` instead of bumped: `react-native-flipper@0.273.0` remains npm `latest` but only peers React 16/17/18, while the current RN `0.86.0` baseline uses React `19.2.3`.
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

The next coding branch should continue from the foundation layer or a blocker-removal branch that directly supports that layer, not another isolated package. Use `docs/react-native-foundation-target-matrix.md` as the target matrix. The current completed milestone jump is RN `0.86.0`, not every intermediate RN minor. Future RN work should target the next stable line only after branch-time evidence supports that target.
