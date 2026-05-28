# React Package Coupling Audit

React package coupling audit for the staged React/RN baseline path.

Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`.

## Current Baseline

- Current React: `18.2.0`
- Current React types: `18.2.6`
- Current React Native types: `^0.63.37`
- Current react-test-renderer: `18.2.0`
- Target React peer from RN target snapshot: `^19.2.3`

## Coupling Rules

- Do not update React without updating `react-test-renderer` and `@types/react` in the same React/RN baseline branch.
- Do not update `@types/react-native` separately from the React Native baseline that owns the related native/runtime type surface.
- Treat React, React types, React Native types, renderer, TypeScript, Jest, and emulator smoke as one validation group when the React/RN baseline changes.
- Keep app behavior validation tied to the React 19 impact audit in `docs/react19-impact-audit.md`.

## Validation

```powershell
corepack yarn react:package-coupling:audit
```
