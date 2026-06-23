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
- Babel `8.x` is a major Metro/RN transform migration and remains blocked while the current RN `0.86.0` Babel preset depends on the Babel `7.x` plugin stack. Move it only in a dedicated RN/Metro/Babel branch with bundle, Jest, Android build, and emulator smoke proof. The current blocker is documented in `docs/babel-8-migration-probe.md` and checked by `corepack yarn babel8:migration-probe:check`.
- React and `react-test-renderer` patch drift remains blocked by React Native renderer exact-version coupling on the current RN `0.86.0` baseline.
- `bl@7` remains blocked by CommonJS transitive consumers until the ESM/export-map line is proven separately. The BL readiness summary now records the live latest package type, whether a CommonJS `require` export exists, whether `bl/package.json` is exported, and an isolated latest-package probe for bare CJS `require('bl')` versus bare ESM import, so the blocker will be re-evaluated automatically if the latest line becomes CommonJS-compatible.
- `node-fetch@3` remains blocked by ESM-only v3 behavior until guarded CommonJS transitive consumers are proven separately. The node-fetch resolution summary records the live latest package type, package entry, and whether a CommonJS `require` export exists, so the blocker will be re-evaluated automatically if the latest line becomes CommonJS-compatible.
- `@typescript-eslint` and `lint-staged` patch drift is intentionally held for a dedicated lint/tooling branch with precommit, lint-staged, TypeScript, and baseline-audit proof.
- `axios@1.18.1` is now the API client runtime baseline after focused storage/network validation; future axios drift still needs a dedicated storage/network branch with API, Electrum, focused tests, Android build, and emulator smoke proof.
- `react-native-webview@14.0.1` is now the storage/network baseline; future WebView drift should still use a dedicated Terms WebView branch with Android smoke and iOS static readiness proof.
- `react-native-bootsplash@7.3.2` is now the startup/splash baseline after Android launch smoke; future splash drift should still use a dedicated startup branch with Android build and emulator proof.
- `react-native-gesture-handler@3.0.2` is now the navigation gesture baseline after Android navigation smoke; future Gesture Handler drift still needs a dedicated native navigation smoke branch before moving that runtime package.
- `semver` and `uuid` patch drift needs a dedicated tooling/runtime branch because those packages are direct runtime dependencies and `semver` is also enforced through `resolutions`.
- `babel-plugin-polyfill-regenerator@1` stays with the RN/Metro/Babel blocker instead of being moved separately from the Babel runtime stack.
- Any new `review-required` direct outdated entry must fail the online baseline until a dedicated compatibility branch records the decision.

Do not blindly bump direct outdated entries from this snapshot. Use the recorded decision and open a dedicated compatibility branch for each blocker or new review-required package.
