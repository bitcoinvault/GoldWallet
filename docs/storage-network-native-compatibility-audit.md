# Storage, Config, Network Native Compatibility Audit

This audit supports `BEM-36 - Native modules upgrade` before changing storage, environment, secure storage, Electrum networking, or WebView dependencies.

Checked on: 2026-07-15
Baseline refreshed on: 2026-07-15 after the RN `0.86.0` foundation checkpoint, storage/network latest-target refresh, validated legacy secure-storage removal, `react-native-webview@14.0.1` Terms WebView validation, and `axios@1.18.1` API-client validation.

## Current Repository State

Tracked package versions:

- `@react-native-async-storage/async-storage`: manifest and lockfile `3.1.1`
- `@react-native-community/netinfo`: manifest and lockfile `12.0.1`
- `react-native-device-info`: manifest and lockfile `15.0.2`
- `react-native-config`: manifest and lockfile `1.6.1`
- `react-native-localize`: manifest and lockfile `3.7.0`
- `react-native-keychain`: manifest and lockfile `10.0.0`
- `react-native-tcp-socket`: manifest and lockfile `6.4.1`
- `react-native-webview`: manifest and lockfile `14.0.1`

Direct usage found in this audit:

- `@react-native-async-storage/async-storage`: legacy `AppStorage` CLI/test fallback, `Navigator`, fee cache, Redux persist, store service, storage tests.
- `@react-native-community/netinfo`: Electrum saga connectivity checks and network listener.
- `react-native-device-info`: emulator detection, device security checks, about screen metadata.
- `react-native-config`: app environment, Electrum host/protocol, explorer URL, Sentry DSNs, CodePush keys.
- `react-native-localize`: mocked in tests and used through localization runtime.
- `react-native-keychain`: `SecureStorageService`, React Native `AppStorage`, focused unit contracts, and encrypted-wallet storage integration tests.
- `react-native-tcp-socket`: TLS Electrum socket implementation. Updated from `6.0.6` to `6.4.1` in `BEM-36.50`.
- `react-native-webview`: terms and conditions screens.
- `react-native-get-random-values`: manifest and lockfile `2.0.0`; imported in `index.js` before app startup. Deprecated `react-native-randombytes` is removed.

The current usage surface is guarded by:

```powershell
corepack yarn check:storage-network-usage-guard
corepack yarn check:storage-network-usage
```

The guard covers source and test imports for this group before storage, config, network, secure storage, random-value, or WebView dependencies are changed.

Focused storage/network validation scripts are guarded by:

```powershell
corepack yarn check:storage-network-validation-scripts-guard
corepack yarn check:storage-network-validation-scripts
```

The guard verifies that `test:terms-webview:unit`, `test:electrum-reconnect:unit`, `test:secure-storage:unit`, `test:storage`, `test:authenticator`, and `test:wallet-core:offline` keep pointing at existing focused Jest files and remain part of `prepush`.

Electrum runtime observation parsing is guarded by:

```powershell
corepack yarn check:electrum-runtime-observation-parser-guard
```

The guard verifies success, failed-connection, inconclusive, fatal-runtime, UI-marker, and secret-redaction parsing before `local-docs/electrum-runtime-observation.txt` is used as Android runtime evidence.

The latest package snapshot is generated and validated by:

```powershell
corepack yarn storage-network:latest-snapshot:audit
corepack yarn storage-network:latest-snapshot:check-summary
```

The snapshot writes `local-docs/storage-network-latest-snapshot.txt`, records manifest, installed, latest, peer, and engine metadata for the tracked storage/network package group, and is part of `rn:baseline:preflight:online` plus the aggregate `foundation:target:check-summaries` gate.

## Latest Npm Snapshot

Latest package metadata checked during this audit:

```text
@react-native-async-storage/async-storage latest: 3.1.1
peerDependencies:
- react: *
- react-native: *

@react-native-async-storage/async-storage current installed line for RN 0.86.0 validation: 3.1.1
peerDependencies:
- react: *
- react-native: *

@react-native-community/netinfo latest: 12.0.1
peerDependencies:
- react: *
- react-native: >=0.59

@react-native-community/netinfo current installed line for RN 0.86.0 validation: 12.0.1
peerDependencies:
- react-native: >=0.59

react-native-device-info latest: 15.0.2
peerDependencies:
- react-native: *

react-native-config latest: 1.6.1
peerDependencies:
- react: *
- react-native: *
- react-native-windows: >=0.61

react-native-config current installed line for RN 0.86.0 validation: 1.6.1
peerDependencies:
- react-native-windows: >=0.61

react-native-localize latest: 3.7.0
peerDependencies:
- react: *
- react-native: *
- react-native-macos: *

react-native-get-random-values latest: 2.0.0

Note: npm marks `react-native-randombytes@3.6.2` as deprecated with a recommendation to use `react-native-get-random-values`. The deprecated bridge is removed; random-value runtime coverage now depends on the existing `react-native-get-random-values` import in `index.js`.

Windows validation for the random-value provider migration must cover wallet crypto runtime audit, focused wallet/storage tests, Android build, and emulator smoke. `ios/Podfile.lock` still needs a Mac `pod install` refresh before iOS validation is claimed for the broader native dependency baseline.

react-native-keychain latest: 10.0.0
dist-tags:
- latest: 10.0.0
engines:
- node: >=16

react-native-tcp-socket latest: 6.4.1
peerDependencies:
- react-native: >=0.60.0

react-native-webview latest: 14.0.1
peerDependencies:
- react: *
- react-native: *
```

The 2026-06-12 generated latest snapshot confirms the tracked storage/network/config package group remains on the checked current lines used by this RN `0.86.0` baseline. `react-native-get-random-values@2.0.0` remains the current random-value provider and peers `react-native >=0.81`; the deprecated `react-native-randombytes` bridge remains removed.

## Findings

- This group has high wallet risk because it touches persisted wallet data, encrypted storage, Electrum TLS sockets, env configuration, and terms WebViews.
- `@react-native-async-storage/async-storage` is now on latest checked stable `3.1.1` after `BEM-37.169`; the app's storage tests pass after moving the Jest mock import to `@react-native-async-storage/async-storage/jest`.
- `@react-native-community/netinfo` is now on latest checked stable `12.0.1` after `BEM-37.168`; it remains installed on the current RN `0.86.0` baseline and future NetInfo work should focus on Electrum/network behavior.
- `react-native-config` is now on latest checked `1.6.1` after `BEM-37.167`; the earlier Android compile failure on older React Native Android APIs (`BaseReactPackage` / `WritableMap.putLong`) is resolved on the RN `0.86.0` baseline.
- `react-native-device-info` is now on checked `15.0.2` after `BEM-37.109`; it still fits the current React Native baseline according to npm peer metadata and no longer contributes an Android `jcenter()` warning.
- `react-native-localize` is now on checked `3.7.0` after `BEM-37.107`; it still fits the current React Native baseline according to npm peer metadata and no longer contributes an Android `jcenter()` warning.
- `react-native-keychain@10.0.0` remains the checked secure-storage backend; `react-native-secure-key-store` is removed after historical migration and fallback-free upgrade validation.
- `corepack yarn secure-storage:migration:audit` keeps the current PIN and transaction-password storage surface explicit before any replacement branch starts.
- `corepack yarn secure-storage:release-validation:handoff:dry-run` renders the focused secure-storage validation sequence for a release-candidate check without executing Android build/smoke work. The executable `corepack yarn secure-storage:release-validation:handoff` refreshes migration/removal summaries, runs secure-storage/storage/authenticator/wallet-core focused checks, runs Android dev build plus emulator smoke by default, and directly validates `local-docs/android-smoke-dev-summary.txt` through the embedded smoke guard before reporting completion.
- `--skip-android-smoke` skips refreshing Android build/smoke evidence only; the handoff still requires a current valid `android-smoke-dev` summary artifact that records clean first-run onboarding, empty-dashboard CTA navigation, empty-tab navigation, and no fatal/runtime logcat findings.
- The secure-storage handoff validates the final Keychain-only posture and rejects restoration of the legacy package, adapter, or fallback reads.
- Historical upgrade-in-place evidence guards migration of legacy-only PIN, transaction-password, and encrypted wallet data before a fallback-free release update.
- The 2026-06-17 post-adapter release evidence rebuilt `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease`, then ran `devRelease` startup and create-wallet smoke on `emulator-5554` without Metro. First-run secure-storage setup, unlock, standard-wallet mnemonic backup, and default 3-key vault public-key integration screens all passed without fatal/runtime logcat findings.
- `tests/unit/SecureStorageService.test.js` locks Keychain reads, writes, transaction-password hashing and verification, missing-value behavior, and removal.
- `tests/integration/Storage.test.js` locks the Keychain-only encrypted wallet storage contract, including missing and failed reads.
- `react-native-webview` is now on latest checked `14.0.1` after `BEM-37.760`; future changes should focus on Terms screens validation, release builds, and the next RN baseline.
- `axios` is now on latest checked `1.18.1` after `BEM-37.763`; the app still imports the Metro-safe browser CJS bundle from `src/api/client.ts`, and future axios changes need focused API/Electrum/storage-network validation plus Android smoke.
- `react-native-tcp-socket` is on latest `6.4.1`, but it is directly tied to Electrum connectivity and still needs network observation on every future socket/config branch.
- Future config/env changes must preserve all current env variables used in `src/config/index.ts`.
- AsyncStorage changes must keep Redux persist, `StoreService`, fee cache, and storage encryption tests green.
- WebView changes need manual terms-screen checks because WebView loading is asynchronous and UI-driven.

## Decision

- Do not batch-upgrade this group.
- Keep one dependency per mini-branch unless two packages are proven to be tightly coupled.
- Treat `react-native-tcp-socket`, `react-native-keychain`, and AsyncStorage as high-risk wallet branches.
- Treat `react-native-config` as release/env tooling sensitive because it controls Electrum, Sentry, CodePush, explorer, and flavor metadata.

## Required Validation For Future Upgrade

Run before commit on a future dependency branch:

```powershell
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:verify
```

Run the standalone Metro-required `corepack yarn android:dev:smoke` only when the branch explicitly changes Metro/dev-server transport behavior.

Focused tests by dependency:

- Group C focused validation: `corepack yarn test:storage-network:focused`.
- Secure storage wrapper contract: `corepack yarn test:secure-storage:unit`.
- Secure storage release-candidate handoff: `corepack yarn secure-storage:release-validation:handoff`.
- AsyncStorage: `corepack yarn test:storage`, `corepack yarn test:wallet-core:offline`.
- Secure storage: `corepack yarn test:authenticator`.
- TCP socket / NetInfo: run `corepack yarn test:electrum-reconnect:unit`, Android smoke, and Electrum connectivity observation; funded transaction flow remains blocked until a funded BTCV testnet wallet is available.
- Config: verify app starts with the expected flavor/env and does not lose Electrum, explorer, Sentry, or CodePush values.
- WebView: run `corepack yarn test:terms-webview:unit`, then manually open terms screens and verify WebView content loads for release-candidate validation.

Manual Android checks:

- App starts to dashboard.
- Existing wallet list persists after restart.
- PIN/authenticator flow still opens.
- Electrum connection errors do not produce React Native runtime errors.
- Terms and conditions WebView loads.
- No `AndroidRuntime` crash in logcat.

If iOS validation is available for the branch:

- Run `pod install`.
- Build the affected iOS scheme.
- Repeat storage, secure storage, config, socket, and WebView smoke checks on simulator/device.
