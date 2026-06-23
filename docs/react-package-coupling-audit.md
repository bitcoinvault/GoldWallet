# React Package Coupling Audit

React package coupling audit for the staged React/RN baseline path.

Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`.

## Current Baseline

- Current React: `19.2.3`
- Latest React patch checked on 2026-06-23: `19.2.7`
- Current React types: `19.2.17`
- Current React Native types: bundled with `react-native@0.86.0`
- Current react-test-renderer: `19.2.3`
- Current bundled React Native renderer: `19.2.3`
- Target React peer from RN target snapshot: `^19.2.3`
- React `19.2.7` remains blocked on this RN `0.86.0` baseline because `react-native-renderer` is exact-version sensitive at `19.2.3`.

## Coupling Rules

- Do not update React without updating `react-test-renderer` and `@types/react` in the same React/RN baseline branch.
- Do not take the React `19.2.7` patch on this RN `0.86.0` line unless a dedicated runtime proof also moves or validates the matching React Native renderer.
- React Native renderer exact-version audit checks the bundled renderer implementation before Android runtime smoke, so package-only React patches fail fast instead of redboxing on emulator startup.
- Do not update `@types/react-native` separately from the React Native baseline that owns the related native/runtime type surface.
- Treat React, React types, React Native types, renderer, TypeScript, Jest, and emulator smoke as one validation group when the React/RN baseline changes.
- Keep app behavior validation tied to the React 19 impact audit in `docs/react19-impact-audit.md`.

## Validation

```powershell
corepack yarn react:package-coupling:audit
corepack yarn react:renderer-version:audit
```
