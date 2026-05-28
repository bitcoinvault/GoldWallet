# Test/Type Coupling Audit

Test/type coupling audit for the staged React/RN baseline path.

## Current Baseline

- Current TypeScript: `^4.0.3`
- Current Jest: `26.6.3`
- Current babel-jest: `^26.6.3`
- Current ts-jest: `^26.4.1`
- Current react-test-renderer: `17.0.2`
- Current TS target: `ES2019`
- Current TS JSX mode: `react-native`
- Current TS skipLibCheck: `true`

## Coupling Rules

- Do not update TypeScript/Jest separately from the React/RN baseline branch that owns type/runtime behavior.
- Keep `react-test-renderer` aligned with React package changes.
- Re-run focused Jest suites and emulator smoke after TypeScript, Jest, React, or React Native package changes.
- Treat `skipLibCheck` changes as high-risk because the current repo depends on older React and React Native type packages.

## Validation

```powershell
corepack yarn test:type-coupling:audit
```
