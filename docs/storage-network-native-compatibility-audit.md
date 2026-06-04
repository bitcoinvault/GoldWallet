# Storage, Config, Network Native Compatibility Audit

This audit supports `BEM-36 - Native modules upgrade` before changing storage, environment, secure storage, Electrum networking, or WebView dependencies.

Checked on: 2026-06-03
Baseline refreshed on: 2026-05-29 after the RN `0.85.3` foundation checkpoint.

## Current Repository State

Tracked package versions:

- `@react-native-async-storage/async-storage`: manifest and lockfile `3.1.1`
- `@react-native-community/netinfo`: manifest and lockfile `12.0.1`
- `react-native-device-info`: manifest and lockfile `15.0.2`
- `react-native-config`: manifest and lockfile `1.6.1`
- `react-native-localize`: manifest and lockfile `3.7.0`
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
- `react-native-keychain`: `SecureStorageService`, legacy `AppStorage` React Native secure-storage path, focused `SecureStorageService` unit contract tests, and `AppStorage` migration-fallback integration tests.
- `react-native-secure-key-store`: retained as a legacy fallback-read and cleanup backend during the Keychain migration window.
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

The guard verifies that `test:secure-storage:unit`, `test:storage`, `test:authenticator`, and `test:wallet-core:offline` keep pointing at existing focused Jest files and remain part of `prepush`.

## Latest Npm Snapshot

Latest package metadata checked during this audit:

```text
@react-native-async-storage/async-storage latest: 3.1.1
peerDependencies:
- react: *
- react-native: *

@react-native-async-storage/async-storage current installed line for RN 0.85.3 validation: 3.1.1
peerDependencies:
- react: *
- react-native: *

@react-native-community/netinfo latest: 12.0.1
peerDependencies:
- react: *
- react-native: >=0.59

@react-native-community/netinfo current installed line for RN 0.85.3 validation: 12.0.1
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

react-native-config current installed line for RN 0.85.3 validation: 1.6.1
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

react-native-secure-key-store latest: 2.0.10
dist-tags:
- latest: 2.0.10

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
- `@react-native-async-storage/async-storage` is now on latest checked stable `3.1.1` after `BEM-37.169`; the app's storage tests pass after moving the Jest mock import to `@react-native-async-storage/async-storage/jest`.
- `@react-native-community/netinfo` is now on latest checked stable `12.0.1` after `BEM-37.168`; it remains installed on the current RN `0.85.3` baseline and future NetInfo work should focus on Electrum/network behavior.
- `react-native-config` is now on latest checked `1.6.1` after `BEM-37.167`; the earlier Android compile failure on older React Native Android APIs (`BaseReactPackage` / `WritableMap.putLong`) is resolved on the RN `0.85.3` baseline.
- `react-native-device-info` is now on checked `15.0.2` after `BEM-37.109`; it still fits the current React Native baseline according to npm peer metadata and no longer contributes an Android `jcenter()` warning.
- `react-native-localize` is now on checked `3.7.0` after `BEM-37.107`; it still fits the current React Native baseline according to npm peer metadata and no longer contributes an Android `jcenter()` warning.
- `react-native-keychain@10.0.0` remains the npm latest checked secure-storage backend on 2026-06-03, while `react-native-secure-key-store@2.0.10` remains npm latest and is retained temporarily for legacy fallback reads and cleanup.
- `corepack yarn secure-storage:migration:audit` keeps the current PIN and transaction-password storage surface explicit before any replacement branch starts.
- `tests/unit/SecureStorageService.test.js` locks the current wrapper contract for missing-value fallback, legacy fallback, failed Keychain migration writes, Keychain-only new writes, plain storage, hashed transaction-password storage, password verification, and value removal across the native secure-storage package boundary.
- `tests/integration/Storage.test.js` locks the React Native `AppStorage` fallback path so legacy wallet data remains readable even if the Keychain migration write fails during a read, while new encrypted wallet writes go to Keychain only.
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
