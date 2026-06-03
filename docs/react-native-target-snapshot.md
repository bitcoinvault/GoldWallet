# React Native Target Snapshot

This document records the current external React Native target snapshot for the wallet modernization stream.

React 19 impact audit is tracked in `docs/react19-impact-audit.md`.
Node runtime transition audit is tracked in `docs/node-runtime-transition-audit.md`.

## Snapshot

- NPM snapshot date: `2026-06-03`
- Current repo React Native: `0.85.3`
- Current repo React: `19.2.3`
- Current repo Metro/dev Node runtime: `22.18.0`
- npm `latest`: `0.85.3`
- npm `next`: `0.86.0-rc.3`
- npm `next` channel classification: `prerelease`
- Default upgrade channel: `latest`
- React peer for `react-native@0.85.3`: `^19.2.3`
- Node engine for `react-native@0.85.3`: `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`

## Meaning

This snapshot is not a direct-upgrade instruction. It shows the current stable target line and the minimum ecosystem shift implied by that line: React 19, a newer Node runtime for RN tooling, newer Metro behavior, Android/iOS template changes, and native dependency compatibility work. The `next` tag is recorded for planning, but RC/nightly builds are not treated as the wallet's default upgrade target unless a dedicated branch proves that tradeoff is needed. If npm `next` stops being a prerelease line or starts matching `latest`, refresh this document and the target policy before starting another baseline branch.

Use it to size and sequence the RN modernization path. Re-check npm and the official React Native release page at the start of the actual RN baseline branch, then update this snapshot in that branch if the target line has changed.

## Validation

```powershell
corepack yarn rn:target-snapshot:audit
```

For a live npm check against the recorded snapshot, use:

```powershell
corepack yarn rn:target-snapshot:current
```

The live check requires network access and is intentionally not part of the default offline preflight. It writes the latest result to `local-docs/rn-target-snapshot-current-summary.txt`.

For actual RN baseline branches where network access is available, use the online baseline preflight wrapper:

```powershell
corepack yarn rn:baseline:preflight:online
```

To validate the latest local summary artifact after a live check, use:

```powershell
corepack yarn rn:target-snapshot:check-summary
```

For an offline self-check of the live npm comparison rules, use:

```powershell
corepack yarn check:rn-target-snapshot-current-guard
corepack yarn check:rn-target-snapshot-summary-guard
```
