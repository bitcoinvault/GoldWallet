# Git Dependency Snapshot

## Scope

This audit tracks direct git or GitHub dependencies that Yarn reports as `exotic` and that should not drift silently during wallet modernization.

Tracked dependencies:

- `bitcoinjs-lib`: BitcoinVault fork used by wallet-critical BTCV network, address, recovery, and transaction behavior.
- `electrum-client`: BitcoinVault Electrum client fork used by wallet network connectivity.
- `react-native-prompt-android`: Android native prompt module required by encrypted-storage startup.
- `rn-nodeify`: postinstall polyfill tool required before Metro, wallet crypto, and Android smoke validation.

## Commands

- `corepack yarn git-deps:snapshot:audit`
- `corepack yarn git-deps:snapshot:check-summary`
- `corepack yarn check:git-deps-snapshot-summary-guard`

The generated summary is local-only at `local-docs/git-dependency-snapshot.txt`.

## Decision

Do not update or replace these dependencies from a generic `yarn outdated` result. Check the live remote hash, compare it with the lockfile hash, and keep wallet-critical fork changes in dedicated compatibility branches with focused wallet/network validation.

As of `BEM-37.388`, all tracked direct git dependencies are pinned in `package.json` to their audited lockfile/remote hashes. Keep that hash suffix in the package spec so a future lockfile refresh cannot silently move wallet-critical forks or the local polyfill tool.
