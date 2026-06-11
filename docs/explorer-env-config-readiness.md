# Explorer Env Config Readiness

Scope: `BEM-37.336`, explorer and env alignment preparation.

Checked on 2026-06-03 after the rebranding release-config readiness audit. This document records the non-secret explorer and network configuration surface that must be validated before changing BTCV/ELCASH explorer routing, Electrum hosts, app IDs, or environment naming.

Do not print env values in readiness logs or docs. Env files can carry release-service identifiers and deployment keys, so this audit records key presence and coordination rules only.

## Current Env Files

| Env file | Purpose in current release-config surface |
| --- | --- |
| `.env.dev.testnet` | Android dev debug/release and iOS Dev schemes |
| `.env.stage.mainnet` | Android stage and iOS Stage Release |
| `.env.prod.mainnet` | Android prod and iOS production schemes |
| `.env.beta.testnet` | Android beta debug and iOS Beta Debug |
| `.env.beta.mainnet` | Android beta release and iOS Beta Release |
| `.env.testnet` | Testnet local/test fixture surface |
| `.env.test` | Unit/integration test surface |

Each tracked env file currently carries the key group required by `src/config/index.ts` for explorer and network selection:

- `APP_ID`
- `APPLICATION_NAME`
- `ENVIRONMENT`
- `BTCV_NETWORK`
- `HOSTS`
- `PORT`
- `PROTOCOL`
- `ELECTRUM_X_PROTOCOL_VERSION`
- `EXPLORER_URL`

Release-service keys such as `SENTRY_DSN_IOS`, `SENTRY_DSN_ANDROID`, `CODEPUSH_ENABLED`, `CODEPUSH_DEPLOYMENT_KEY_IOS`, and `CODEPUSH_DEPLOYMENT_KEY_ANDROID` are tracked by the release-services guards and should stay secret-safe.

## Runtime Usage

`src/config/index.ts` reads env values through `react-native-config` and exposes:

- `applicationId`
- `applicationName`
- `hosts`
- `port`
- `networkName`
- `network`
- `protocol`
- `electrumXProtocolVersion`
- `explorerUrl`

Explorer changes are not visual-only changes. A different `EXPLORER_URL` can affect transaction link behavior, support/debug flows, store screenshots, and user-facing verification. Electrum host or network changes can affect startup connectivity, wallet balances, transaction history, QR/address validation, and funded send/recovery validation.

## Coordination Rules

- Do not change `EXPLORER_URL` without matching the intended `BTCV_NETWORK` and explorer project.
- Do not change `HOSTS`, `PORT`, `PROTOCOL`, or `ELECTRUM_X_PROTOCOL_VERSION` without Android startup smoke and Electrum connectivity observation.
- Do not change `APP_ID` or `APPLICATION_NAME` in env files without the rebranding release-config checklist in `docs/rebranding-release-config-readiness.md`.
- Do not infer ELCASH/BTCV split behavior from env names only; wallet model, address formats, explorers, terms copy, and store metadata must agree.
- Keep test envs in the same audit group so unit/integration fixtures do not silently drift from production assumptions.

## Validation Path

Audit/docs/tooling only:

```powershell
corepack yarn check:explorer-env-config-readiness-guard
corepack yarn check:explorer-env-config-readiness
corepack yarn check:android-env-config-files
corepack yarn check:ios-scheme-config
corepack yarn android:dev:check-light
corepack yarn typescript:check
corepack yarn check:modernization-log-ids
corepack yarn lint:baseline:audit
git diff --check
```

Runtime implementation branch:

```powershell
corepack yarn check:explorer-env-config-readiness
corepack yarn test:storage-network:focused
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:verify
```

Funded send/recovery validation remains blocked until a funded BTCV testnet wallet is available. Explorer link behavior can still be smoke-tested with existing empty-wallet and transaction-history fixtures once a wallet fixture is available.
