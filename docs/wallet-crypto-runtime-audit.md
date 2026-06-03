# Wallet Crypto Runtime Audit

Scope: wallet-critical JavaScript and native-adjacent crypto/runtime dependencies used for BTCV key derivation, address handling, transaction building, signing, and persistence-adjacent wallet flows.

Latest npm checked on 2026-06-03.

## Current Package State

| Package | Current package.json | Latest checked | Notes |
| --- | --- | --- | --- |
| `bitcoinjs-lib` | `git+https://github.com/bitcoinvault/bitcoinjs-lib.git#0854f675114fada32348d51c80a6ccdb33afc360` | upstream npm `7.0.1`; BTCV fork `master` at `0854f675114fada32348d51c80a6ccdb33afc360` | Do not replace the BitcoinVault fork with upstream `bitcoinjs-lib` without a dedicated compatibility branch. The fork exposes BTCV-specific `VaultTxType`, `alt_networks`, and recovery/alert transaction behavior used by the app. The app pins the fork commit so fresh installs cannot drift silently. |
| `bip39` | `3.1.0` | `3.1.0` | Current mnemonic package remains latest. |
| `bip32` | `5.0.1` | `5.0.1` | Migrated through `utils/bip32.js`, which adapts the factory-based API to the wallet classes. |
| `@bitcoinerlab/secp256k1` | `1.2.0` | `1.2.0` | Pure-JavaScript ECC backend for the latest `bip32` factory API; selected because `tiny-secp256k1@2.x` pulls WASM/Node crypto paths that do not bundle cleanly in React Native. |
| `coinselect` | `3.1.13` | `3.1.13` | Current coin selection package remains latest. |
| `bech32` | not direct | `2.0.0` | The app does not import the standalone package directly. BTCV Bech32 address behavior is owned by the pinned BitcoinVault `bitcoinjs-lib` fork, which resolves transitive `bech32@1.1.4`; keep the direct package absent unless a future branch introduces direct address-encoding code. |
| `ecurve` | `1.0.6` | `1.0.6` | Legacy elliptic curve dependency used by `utils/crypto.ts`; pinned exactly because this is wallet-critical runtime code. |
| `bigi` | `1.4.2` | `1.4.2` | Legacy big integer dependency used by `utils/crypto.ts`; pinned exactly because this is wallet-critical runtime code. |
| `pbkdf2` | `3.1.6` | `3.1.6` | Current package remains latest. |
| `wif` | `5.0.0` | `5.0.0` | Direct dependency is current; the BTCV `bitcoinjs-lib` fork still resolves its own nested `wif@2.0.6` and this is guarded by `corepack yarn wallet:crypto-runtime:audit`. |
| `react-native-randombytes` | `3.6.2` | `3.6.2` | Current native random-bytes bridge remains latest checked. |
| `crypto-js` | `4.2.0` | `4.2.0` | Current package remains latest and has a separate runtime audit. |

## Runtime Surface

- `bitcoinjs-lib` is imported by wallet classes, transaction screens, config/network setup, signer tests, authenticator tests, and Electrum/HD wallet integration tests.
- `bip39` and the local `utils/bip32.js` adapter drive HD wallet mnemonic and derivation behavior in the HD wallet class hierarchy.
- `coinselect` is used by the SegWit bech32 send flow.
- Direct `bech32` usage is intentionally absent; Bech32 encode/decode behavior is exercised through `bitcoinjs-lib` address/payment APIs and the offline BIP84 fixtures.
- `crypto-js` is used for wallet-related hashing/encryption helpers and is guarded separately by `corepack yarn crypto-js:runtime:audit`.
- `ecurve` and `bigi` are not treated as isolated low-risk package bumps because they are coupled to the old bitcoin stack and BTCV fork behavior.
- Direct `wif` is now latest `5.0.0`; the BitcoinVault `bitcoinjs-lib` fork keeps using nested `wif@2.0.6`, because its old stack still depends on the 2.x WIF line.

## Upgrade Decision

Do not upgrade this group package-by-package unless the package is already isolated and has a narrow fixture. The safe path is a dedicated wallet/crypto runtime branch that keeps the BTCV fork behavior explicit and validates:

- offline wallet tests,
- authenticator/signing tests,
- HD wallet derivation fixtures,
- WIF import/export behavior and `_getWifForAddress` cache behavior,
- transaction construction fixtures, including signed BIP49 P2SH and BIP84 Bech32 regular-send/send-max UTXO coverage,
- Android build and emulator smoke.

Funded transaction flow remains blocked until a funded BTCV testnet wallet is available. Until then, do not claim live send/recovery transaction delivery; claim only offline construction/signing coverage and app startup/runtime smoke.

## Validation

```powershell
corepack yarn wallet:crypto-runtime:audit
corepack yarn crypto-js:runtime:audit
corepack yarn test:unit --runInBand
corepack yarn test:storage-network:focused
corepack yarn test:watchonly:offline
corepack yarn test:hdwallet:offline
```
