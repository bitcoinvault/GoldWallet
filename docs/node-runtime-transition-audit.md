# Node Runtime Transition Audit

Node runtime transition audit for the staged React Native modernization path.

## Current Baseline

- Current Metro/dev Node runtime: `16.20.2`
- Current React Native: `0.68.7`
- Current Metro Babel preset: `0.67.0`

## Target Snapshot

- Target React Native snapshot: `0.85.3`
- Target RN Node engine snapshot: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`

## Coupling Rules

- Do not change `.nvmrc` away from `16.20.2` until the dedicated React Native baseline branch owns the Metro/tooling migration.
- Re-check the target RN Node engine with `corepack yarn rn:target-snapshot:current` before changing Node, React Native, Metro, or Jest packages.
- Treat Node runtime movement as part of the RN baseline branch, not as a standalone developer convenience cleanup.
- After the Node/RN baseline changes, restart Metro with `--reset-cache` and run Android emulator smoke before committing.

## Validation

```powershell
corepack yarn node:runtime-transition:audit
```
