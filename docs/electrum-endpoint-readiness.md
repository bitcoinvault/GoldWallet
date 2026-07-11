# Electrum Endpoint Readiness

This document records the repo-side Electrum endpoint preflight used before Android dev/release smoke validation.

## Commands

- `corepack yarn check:electrum-endpoint-readiness-guard` runs offline parser and policy fixtures.
- `corepack yarn electrum:endpoint-readiness:audit` performs the live endpoint check and writes `local-docs/electrum-endpoint-readiness-summary.txt`.
- `corepack yarn electrum:endpoint-readiness:check-summary` validates the generated local summary.

## Scope

The live audit reads these environment files:

- `.env.dev.testnet`
- `.env.stage.mainnet`
- `.env.prod.mainnet`
- `.env.beta.testnet`
- `.env.beta.mainnet`

For each configured Electrum host it records environment, network, endpoint, protocol, status, TLS authorization state, certificate dates, certificate days remaining, and certificate fingerprint. The summary must report `Secret values printed: no` and the guard rejects secret-looking values.

The live audit is not part of `prepush`; it depends on external Electrum DNS, TCP, and TLS state. Use it before release-smoke work when Android reaches `No network`, and keep generated output in ignored `local-docs/`.

## Current Result

Latest local audit on `2026-07-11`:

- Env files scanned: `5`
- Electrum endpoint entries: `8`
- Unique endpoints: `3`
- Ready entries: `6`
- Certificate expired entries: `2`
- TLS authorization error entries: `0`
- Connection error entries: `0`
- Unsupported protocol entries: `0`
- Missing config entries: `0`

The ready entries are the mainnet endpoints in `.env.stage.mainnet`, `.env.prod.mainnet`, and `.env.beta.mainnet`: `electrumx-mainnet1.bitcoinvault.global:443` and `electrumx-mainnet2.bitcoinvault.global:443`.

The blocked entries are `.env.dev.testnet` and `.env.beta.testnet`, both using `electrumx.testnet.btcv.stage.rnd.land:443 tls`. The TLS certificate is expired with `CERT_HAS_EXPIRED`, `valid_to=Jun 23 16:52:40 2026 GMT`, and `expires_in_days=-19`.

Required action: renew or fix the dev/testnet Electrum TLS certificate, then rerun Android dev and release smoke validation.
