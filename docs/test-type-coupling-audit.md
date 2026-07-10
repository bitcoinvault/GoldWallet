# Test/Type Coupling Audit

Test/type coupling audit for the staged React/RN baseline path.

## Current Baseline

- Current TypeScript: `6.0.3`
- Current Jest: `30.4.2`
- Current babel-jest: `30.4.1`
- Current jest-environment-node: `30.4.1`
- Current ts-jest: `29.4.11`
- Current react-test-renderer: `19.2.3`
- Current TS target: `ES2019`
- Current TS JSX mode: `react-native`
- Current TS skipLibCheck: `true`

## Coupling Rules

- TypeScript `6.0.3` is owned by the dedicated TypeScript compiler probe after removing the deleted `suppressImplicitAnyIndexErrors` option and preserving current module/path behavior with `ignoreDeprecations: "6.0"`.
- TypeScript 7 remains blocked on the current tooling baseline because `@typescript-eslint@8.63.0` peers `typescript >=4.8.4 <6.1.0` and `ts-jest@29.4.11` peers `typescript >=4.3 <7`; refresh that evidence with `corepack yarn typescript7:compatibility-probe:audit`.
- Move TypeScript/Jest/React/RN baseline pieces only from dedicated branches that own type/runtime behavior and focused validation.
- Keep `jest-environment-node` on the Jest 30 line because `@react-native/jest-preset@0.85.3` still declares a Jest 29 environment internally.
- Keep `react-test-renderer` aligned with React package changes.
- Re-run focused Jest suites and emulator smoke after TypeScript, Jest, React, or React Native package changes.
- Treat `skipLibCheck` changes as high-risk because the current repo depends on older React and React Native type packages.

## Focused Validation

- Required focused scripts: `test:unit`, `test:storage`, `test:authenticator`, `test:watchonly:offline`, `test:hdwallet:offline`, `test:wallet-core:offline`
- Required focused files: `tests/unit/signer.test.js`, `tests/unit/encryption.test.js`, `tests/integration/Storage.test.js`, `tests/integration/authenticator.test.js`, `tests/integration/WatchOnlyWallet.offline.test.js`, `tests/integration/HDWallet.offline.test.js`, `tests/integration/App.offline.test.js`
- The focused scripts must remain in `prepush` so TypeScript/Jest/RN baseline work keeps the deterministic offline coverage in front of emulator smoke.

## Validation

```powershell
corepack yarn test:type-coupling:audit
corepack yarn typescript7:compatibility-probe:audit
corepack yarn typescript7:compatibility-probe:check-summary
```
