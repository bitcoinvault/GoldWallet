# React 19 Impact Audit

This document records the React-facing impact of the current RN target snapshot.

React package coupling audit is tracked in `docs/react-package-coupling-audit.md`.

Test/type coupling audit is tracked in `docs/test-type-coupling-audit.md`.

## Current Baseline

- Current React: `19.1.4`
- Current React types: `19.2.15`
- Current react-test-renderer: `19.1.4`
- Target React peer from RN target snapshot: `^19.2.3`

## Impact Areas

- Class component surfaces exist and must be smoke-tested after the React/RN baseline changes.
- Default props on class components exist and should be checked against the updated TypeScript/React type behavior.
- `react-test-renderer` must move with React when the baseline branch changes package versions.
- `@types/react` must move with React, and current TypeScript behavior should be rechecked before changing app code.
- Hook surfaces should be covered by TypeScript and emulator smoke after the React/RN baseline changes.
- Navigation and modal surfaces should be included in smoke because many screens still use class components and refs.

## Validation

```powershell
corepack yarn react19:impact:audit
```

Use this audit before starting a React/RN baseline branch and after changing React-related package versions.
