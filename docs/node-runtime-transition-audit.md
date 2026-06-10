# Node Runtime Transition Audit

Node runtime transition audit for the staged React Native modernization path.

## Current Baseline

- Current Metro/dev Node runtime: `24.16.0`
- Current React Native: `0.86.0`
- Current RN Babel preset: `0.86.0`
- Current RN Metro config: `0.86.0`

## Target Snapshot

- Target React Native snapshot: `0.86.0`
- Target RN Node engine snapshot: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`

## Coupling Rules

- Keep `.nvmrc` on `24.16.0` for the RN 0.86.0 foundation checkpoint and Node 24 tooling baseline.
- Re-check the target RN Node engine with `corepack yarn rn:target-snapshot:current` before changing Node, React Native, Metro, or Jest packages.
- Treat future Node runtime movement as part of a dedicated Node/tooling or RN baseline branch, not as standalone developer convenience cleanup.
- After the Node/RN baseline changes, restart Metro with `--reset-cache` and run Android emulator smoke before committing.

## Validation

```powershell
corepack yarn node:runtime-transition:audit
```

`corepack yarn rn:baseline:preflight` also runs `corepack yarn lint-staged:tooling:audit` so package install and hook tooling cannot pass silently under an older Node shell. Use the `.nvmrc` Node runtime before running the full baseline preflight.
