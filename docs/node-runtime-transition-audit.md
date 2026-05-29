# Node Runtime Transition Audit

Node runtime transition audit for the staged React Native modernization path.

## Current Baseline

- Current Metro/dev Node runtime: `22.18.0`
- Current React Native: `0.81.6`
- Current RN Babel preset: `0.81.6`
- Current RN Metro config: `0.81.6`

## Target Snapshot

- Target React Native snapshot: `0.85.3`
- Target RN Node engine snapshot: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`

## Coupling Rules

- Keep `.nvmrc` on `22.18.0` for the RN 0.81 foundation checkpoint until the next RN milestone owns another Node/tooling move.
- Re-check the target RN Node engine with `corepack yarn rn:target-snapshot:current` before changing Node, React Native, Metro, or Jest packages.
- Treat Node runtime movement as part of the RN baseline branch, not as a standalone developer convenience cleanup.
- After the Node/RN baseline changes, restart Metro with `--reset-cache` and run Android emulator smoke before committing.

## Validation

```powershell
corepack yarn node:runtime-transition:audit
```
