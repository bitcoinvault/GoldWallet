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

TLS certificates use a fixed 30-day release-warning policy:

- `ready`: authorized and valid for more than 30 full days;
- `certificate-expiring`: authorized and valid for 0-30 full days;
- `certificate-expired`: the certificate expiry is already in the past;
- `tls-authorization-error`: authorization failed or usable expiry metadata is unavailable.

The summary reports both environment-entry counts and unique endpoint counts, so shared hosts are not mistaken for separate operational incidents.

The live audit is not part of `prepush`; it depends on external Electrum DNS, TCP, and TLS state. Use it before release-smoke work when Android reaches `No network`, and keep generated output in ignored `local-docs/`.

## Current Result

Latest local audit on `2026-07-16`:

- Env files scanned: `5`
- Electrum endpoint entries: `8`
- Unique endpoints: `3`
- Certificate warning threshold: `30 days`
- Ready entries: `0`
- Certificate expired entries: `2`
- Certificate expiring entries: `6`
- Unique expired endpoints: `1`
- Unique expiring endpoints: `2`
- TLS authorization error entries: `0`
- Connection error entries: `0`
- Unsupported protocol entries: `0`
- Missing config entries: `0`

The mainnet endpoints in `.env.stage.mainnet`, `.env.prod.mainnet`, and `.env.beta.mainnet` are currently authorized but inside the warning window: `electrumx-mainnet1.bitcoinvault.global:443` and `electrumx-mainnet2.bitcoinvault.global:443`. Their shared certificate expires on `Aug 7 14:28:14 2026 GMT`, with `21` full days remaining during the audit.

The blocked entries are `.env.dev.testnet` and `.env.beta.testnet`, both using `electrumx.testnet.btcv.stage.rnd.land:443 tls`. The TLS certificate is expired with `CERT_HAS_EXPIRED`, `valid_to=Jun 23 16:52:40 2026 GMT`, and `expires_in_days=-23`.

Required action: renew or fix the dev/testnet certificate and rotate the mainnet certificate before `2026-08-07`. Then rerun `corepack yarn electrum:endpoint-readiness:audit`, its summary check, and Android dev/release smoke validation.
