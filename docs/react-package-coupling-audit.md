# React Package Coupling Audit

React package coupling audit for the staged React/RN baseline path.

Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`.

## Current Baseline

- Current React: `19.2.3`
- Latest React patch checked on 2026-06-03: `19.2.7`
- Current React types: `19.2.16`
- Current React Native types: bundled with `react-native@0.85.3`
- Current react-test-renderer: `19.2.3`
- Target React peer from RN target snapshot: `^19.2.3`
- React `19.2.7` remains blocked on this RN `0.85.3` baseline because `react-native-renderer` is exact-version sensitive at `19.2.3`.

## Coupling Rules

- Do not update React without updating `react-test-renderer` and `@types/react` in the same React/RN baseline branch.
- Do not take the React `19.2.7` patch on this RN `0.85.3` line unless a dedicated runtime proof also moves or validates the matching React Native renderer.
- Do not update `@types/react-native` separately from the React Native baseline that owns the related native/runtime type surface.
- Treat React, React types, React Native types, renderer, TypeScript, Jest, and emulator smoke as one validation group when the React/RN baseline changes.
- Keep app behavior validation tied to the React 19 impact audit in `docs/react19-impact-audit.md`.

## Validation

```powershell
corepack yarn react:package-coupling:audit
```
