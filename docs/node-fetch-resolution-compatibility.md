# Node Fetch Resolution Compatibility

## Current Decision

Keep the root Yarn resolution at `node-fetch@2.7.0`.

The latest npm line, `node-fetch@3.3.2`, is ESM-only. The guarded summary records the live latest package type, main package entry, and whether a CommonJS `require` export is present, so the blocker is re-evaluated automatically if the v3 package shape changes. This app currently receives `node-fetch` through transitive packages that still need CommonJS compatibility in the current Node/RN tooling graph:

- `gaxios`, through `googleapis`.
- `isomorphic-fetch`, through legacy React Native/UI dependencies.

## Guarded Commands

- `corepack yarn node-fetch:resolution:audit`
- `corepack yarn node-fetch:resolution:check-summary`
- `corepack yarn check:node-fetch-resolution-summary-guard`

The generated local summary is written to `local-docs/node-fetch-resolution-summary.txt`.

## Upgrade Rule

Do not change the root `node-fetch` resolution from `2.7.0` to v3 from a generic outdated report. A v3 migration needs a dedicated compatibility branch that proves all transitive CommonJS consumers work with the ESM-only package entry or that the latest package line now exposes a compatible CommonJS require path.
