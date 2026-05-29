# Storage, Config, Network Native Compatibility Audit

This audit supports `BEM-36 - Native modules upgrade` before changing storage, environment, secure storage, Electrum networking, or WebView dependencies.

Checked on: 2026-05-28
Baseline refreshed on: 2026-05-29 after the RN `0.81.6` foundation checkpoint.

## Current Repository State

Tracked package versions:

- `@react-native-async-storage/async-storage`: manifest and lockfile `2.2.0`
- `@react-native-community/netinfo`: manifest and lockfile `12.0.1`
- `react-native-device-info`: manifest and lockfile `15.0.2`
- `react-native-config`: manifest and lockfile `1.6.1`
- `react-native-localize`: manifest and lockfile `3.7.0`
- `react-native-randombytes`: manifest and lockfile `3.6.2`
- `react-native-keychain`: manifest and lockfile `10.0.0`
- `react-native-secure-key-store`: manifest and lockfile `2.0.10`
- `react-native-tcp-socket`: manifest and lockfile `6.4.1`
- `react-native-webview`: manifest and lockfile `13.16.1`

Direct usage found in this audit:

- `@react-native-async-storage/async-storage`: legacy `AppStorage` CLI/test fallback, `Navigator`, fee cache, Redux persist, store service, storage tests.
- `@react-native-community/netinfo`: Electrum saga connectivity checks and network listener.
- `react-native-device-info`: emulator detection, device security checks, about screen metadata.
- `react-native-config`: app environment, Electrum host/protocol, explorer URL, Sentry DSNs, CodePush keys.
- `react-native-localize`: mocked in tests and used through localization runtime.
- `react-native-keychain`: `SecureStorageService`, legacy `AppStorage` React Native secure-storage path, and the focused `SecureStorageService` unit contract test.
- `react-native-secure-key-store`: retained as a legacy fallback and dual-write target during the Keychain migration window.
- `react-native-tcp-socket`: TLS Electrum socket implementation. Updated from `6.0.6` to `6.4.1` in `BEM-36.50`.
- `react-native-webview`: terms and conditions screens.
- `react-native-randombytes`: tracked native dependency for crypto random byte behavior even though direct source usage is indirect through wallet/crypto dependencies. Updated from `3.5.3` to `3.6.2` in `BEM-36.49`.

The current usage surface is guarded by:

```powershell
corepack yarn check:storage-network-usage-guard
corepack yarn check:storage-network-usage
```

The guard covers source and test imports for this group before storage, config, network, secure storage, randombytes, or WebView dependencies are changed.

Focused storage/network validation scripts are guarded by:

```powershell
corepack yarn check:storage-network-validation-scripts-guard
corepack yarn check:storage-network-validation-scripts
```

The guard verifies that `test:secure-storage:unit`, `test:storage`, `test:authenticator`, and `test:wallet-core:offline` keep pointing at existing focused Jest files and remain part of `prepush`.

## Latest Npm Snapshot

Latest package metadata checked during this audit:

```text
@react-native-async-storage/async-storage latest: 3.1.0
peerDependencies:
- react: *
- react-native: *

@react-native-async-storage/async-storage current installed line for RN 0.81.6 validation: 2.2.0
peerDependencies:
- react-native: ^0.0.0-0 || >=0.65 <1.0

@react-native-community/netinfo latest: 12.0.1
peerDependencies:
- react: *
- react-native: >=0.59

@react-native-community/netinfo current installed line for RN 0.81.6 validation: 12.0.1
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

react-native-config current installed line for RN 0.81.6 validation: 1.6.1
peerDependencies:
- react-native-windows: >=0.61

react-native-localize latest: 3.7.0
peerDependencies:
- react: *
- react-native: *
- react-native-macos: *

react-native-randombytes latest: 3.6.2

Note: npm marks `react-native-randombytes@3.6.2` as deprecated with a recommendation to use `react-native-get-random-values`. This audit keeps the existing package and treats replacement as a separate crypto/runtime migration.

Windows validation for `BEM-36.49` covered Android build and emulator smoke. `ios/Podfile.lock` still needs a Mac `pod install` refresh before iOS validation is claimed for the `react-native-randombytes` bump.

react-native-keychain latest: 10.0.0
react-native-secure-key-store latest: 2.0.10

react-native-tcp-socket latest: 6.4.1
peerDependencies:
- react-native: >=0.60.0

react-native-webview latest: 13.16.1
peerDependencies:
- react: *
- react-native: *
```

## Findings

- This group has high wallet risk because it touches persisted wallet data, encrypted storage, Electrum TLS sockets, env configuration, and terms WebViews.
- `@react-native-async-storage/async-storage` is now on checked compatible `2.2.0` after `BEM-36.74`; the latest `3.1.0` remains a separate RN-baseline/storage validation branch.
- `@react-native-community/netinfo` is now on latest checked stable `12.0.1` after `BEM-37.168`; it remains installed on the current RN `0.81.6` baseline and future NetInfo work should focus on Electrum/network behavior.
- `react-native-config` is now on latest checked `1.6.1` after `BEM-37.167`; the earlier Android compile failure on older React Native Android APIs (`BaseReactPackage` / `WritableMap.putLong`) is resolved on the RN `0.81.6` baseline.
- `react-native-device-info` is now on checked `15.0.2` after `BEM-37.109`; it still fits the current React Native baseline according to npm peer metadata and no longer contributes an Android `jcenter()` warning.
- `react-native-localize` is now on checked `3.7.0` after `BEM-37.107`; it still fits the current React Native baseline according to npm peer metadata and no longer contributes an Android `jcenter()` warning.
- `react-native-keychain@10.0.0` is installed as the new secure-storage backend, while `react-native-secure-key-store@2.0.10` remains temporarily for legacy fallback and dual-write migration.
- `corepack yarn secure-storage:migration:audit` keeps the current PIN and transaction-password storage surface explicit before any replacement branch starts.
- `tests/unit/SecureStorageService.test.js` locks the current wrapper contract for missing-value fallback, plain storage, hashed transaction-password storage, password verification, and value removal after replacing the native secure-storage package.
- `react-native-webview` is now on latest checked `13.16.1` after `BEM-37.162`; future changes should focus on Terms screens validation, release builds, and the next RN baseline.
- `react-native-tcp-socket` is on latest `6.4.1`, but it is directly tied to Electrum connectivity and still needs network observation on every future socket/config branch.
- Future config/env changes must preserve all current env variables used in `src/config/index.ts`.
- AsyncStorage changes must keep Redux persist, `StoreService`, fee cache, and storage encryption tests green.
- WebView changes need manual terms-screen checks because WebView loading is asynchronous and UI-driven.

## Decision

- Do not batch-upgrade this group.
- Keep one dependency per mini-branch unless two packages are proven to be tightly coupled.
- Treat `react-native-tcp-socket`, `react-native-keychain`, `react-native-secure-key-store`, and AsyncStorage as high-risk wallet branches.
- Treat `react-native-config` as release/env tooling sensitive because it controls Electrum, Sentry, CodePush, explorer, and flavor metadata.

## Required Validation For Future Upgrade

Run before commit on a future dependency branch:

```powershell
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:assemble
corepack yarn start --reset-cache
adb reverse tcp:8081 tcp:8081
corepack yarn android:dev:smoke
```

Focused tests by dependency:

- Group C focused validation: `corepack yarn test:storage-network:focused`.
- Secure storage wrapper contract: `corepack yarn test:secure-storage:unit`.
- AsyncStorage: `corepack yarn test:storage`, `corepack yarn test:wallet-core:offline`.
- Secure storage: `corepack yarn test:authenticator`.
- TCP socket / NetInfo: Android smoke plus Electrum connectivity observation; funded transaction flow remains blocked until a funded BTCV testnet wallet is available.
- Config: verify app starts with the expected flavor/env and does not lose Electrum, explorer, Sentry, or CodePush values.
- WebView: manually open terms screens and verify WebView content loads.

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
