# Direct Dependency Outdated Snapshot

This audit records the direct `yarn outdated --json` surface before React Native foundation or broad dependency branches.

Run it with:

```powershell
corepack yarn direct-outdated:snapshot:audit
corepack yarn direct-outdated:snapshot:check-summary
corepack yarn check:direct-outdated-snapshot-summary-guard
```

Current snapshot policy:

- Known git/GitHub entries are handled by the git dependency snapshot and must not be replaced by generic npm package output.
- Babel `8.x` is a major Metro/RN transform migration and remains blocked while the current RN `0.86.0` Babel preset depends on the Babel `7.x` plugin stack. Move it only in a dedicated RN/Metro/Babel branch with bundle, Jest, Android build, and emulator smoke proof. The current blocker is documented in `docs/babel-8-migration-probe.md`, refreshed by `corepack yarn babel8:migration-probe:audit`, and checked by `corepack yarn babel8:migration-probe:check-summary` plus `corepack yarn babel8:migration-probe:check`.
- React and `react-test-renderer` patch drift remains blocked by React Native renderer exact-version coupling on the current RN `0.86.0` baseline. The live blocker summary is refreshed by `corepack yarn react:patch-blocker:audit` and checked by `corepack yarn react:patch-blocker:check-summary`.
- `bl@7.0.6` remains blocked by CommonJS transitive consumers until the ESM/export-map line is proven separately. The BL readiness summary records the live latest package type, whether a CommonJS `require` export exists, whether `bl/package.json` is exported, and an isolated latest-package probe for bare CJS `require('bl')` versus bare ESM import, so the blocker will be re-evaluated automatically if the latest line becomes CommonJS-compatible.
- `node-fetch@3` remains blocked by ESM-only v3 behavior until guarded CommonJS transitive consumers are proven separately. The node-fetch resolution summary records the live latest package type, package entry, and whether a CommonJS `require` export exists, so the blocker will be re-evaluated automatically if the latest line becomes CommonJS-compatible.
- `@react-native-community/cli@20.2.0`, `@react-native-community/cli-platform-android@20.2.0`, and `@react-native-community/cli-platform-ios@20.2.0` are the checked RN CLI tooling baseline after Android assemble, Metro/runtime checks, emulator smoke, and iOS static handoff proof. Future RN CLI drift still needs a dedicated RN CLI/tooling branch before changing the baseline snapshot.
- React Navigation package family `@react-navigation/native@7.3.8`, `@react-navigation/stack@7.10.11`, `@react-navigation/bottom-tabs@7.18.8`, and `@react-navigation/devtools@7.1.5` is now the checked navigation patch baseline after peer metadata review, TypeScript/unit/focused tests, Android `devDebug` build, Metro startup, and emulator no-network smoke. Future React Navigation drift still needs a dedicated navigation branch with tab/stack smoke proof.
- `react-native-screens@4.26.0` is the checked native navigation baseline after Android build and emulator smoke proof. Future screens drift should stay in a dedicated navigation/native-screens branch with stack/tab navigation and Android emulator proof instead of being mixed into unrelated release-services work.
- `@sentry/react-native@8.18.0` is the checked release-services baseline after the Sentry patch refresh. Future Sentry SDK drift needs a dedicated Sentry release-services branch with Android debug/release validation, Sentry prerequisite summaries, and no source-map upload claim without credentials.
- `@typescript-eslint@8.63.0`, `eslint@10.6.0`, `prettier@3.9.5`, and `lint-staged@17.0.8` are now lint/tooling baselines after precommit, lint-staged, TypeScript, Prettier, ESLint compatibility, and baseline-audit proof. Future patch drift in this cohort still needs a dedicated lint/formatting/tooling branch before changing the baseline snapshot.
- TypeScript 7 drift is tracked by `corepack yarn typescript7:compatibility-probe:audit`; live `typescript@7.0.2` remains blocked because `@typescript-eslint@8.63.0` peers `typescript >=4.8.4 <6.1.0` and `ts-jest@29.4.11` peers `typescript >=4.3 <7`.
- `caniuse-lite@1.0.30001803` is pinned through `resolutions`; future Browserslist data drift needs a dedicated tooling/resolution branch with lockfile, baseline audit, and bundle-transform proof.
- `bignumber.js@11.1.5` is the checked wallet amount runtime baseline after numeric probes, wallet/offline tests, transaction amount-label guards, Android build, and emulator smoke proof. Future numeric drift still needs a dedicated wallet amount branch with unit tests, transaction fixtures, and Android emulator proof.
- `react-native-toast-message@2.4.0` is the checked notification/developer-toast UI baseline after package metadata review, TypeScript/unit/focused tests, Android build, and emulator smoke proof. Future toast UI drift still needs a dedicated notification UI branch with Android emulator proof.
- `axios@1.18.1` is now the API client runtime baseline after focused storage/network validation; future axios drift still needs a dedicated storage/network branch with API, Electrum, focused tests, Android build, and emulator smoke proof.
- `react-native-webview@14.0.1` is now the storage/network baseline; future WebView drift should still use a dedicated Terms WebView branch with Android smoke and iOS static readiness proof.
- `react-native-bootsplash@7.3.2` is now the startup/splash baseline after Android launch smoke; future splash drift should still use a dedicated startup branch with Android build and emulator proof.
- `react-native-gesture-handler@3.0.2` is now the navigation gesture baseline after Android navigation smoke; future Gesture Handler drift still needs a dedicated native navigation smoke branch before moving that runtime package.
- `i18next@26.3.6` and `react-i18next@17.0.9` are now the checked i18n runtime patch baseline after TypeScript, translation checks, app-start smoke validation, and compatibility proof. Future i18n drift should stay coupled to the same localization runtime branch evidence because `react-i18next` provides the app runtime integration.
- `semver@7.8.5` and `uuid@14.0.1` are now the tooling/runtime baselines after Android smoke; future drift still needs a dedicated tooling/runtime branch because those packages are direct runtime dependencies and `semver` is also enforced through `resolutions`.
- `babel-plugin-polyfill-regenerator@1` stays with the RN/Metro/Babel blocker instead of being moved separately from the Babel runtime stack.
- Any new `review-required` direct outdated entry must fail the online baseline until a dedicated compatibility branch records the decision.

Do not blindly bump direct outdated entries from this snapshot. Use the recorded decision and open a dedicated compatibility branch for each blocker or new review-required package.
