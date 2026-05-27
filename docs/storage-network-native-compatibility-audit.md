# Storage, Config, Network Native Compatibility Audit

This audit supports `BEM-36 - Native modules upgrade` before changing storage, environment, secure storage, Electrum networking, or WebView dependencies.

Checked on: 2026-05-27

## Current Repository State

Tracked package versions:

- `@react-native-async-storage/async-storage`: manifest and lockfile `1.24.0`
- `@react-native-community/netinfo`: manifest `^6.0.2`, lockfile `6.0.2`
- `react-native-device-info`: manifest `^6.0.2`, lockfile `6.2.1`
- `react-native-config`: manifest and lockfile `1.4.4`
- `react-native-localize`: manifest `^1.4.0`, lockfile `1.4.3`
- `react-native-randombytes`: manifest and lockfile `3.5.3`
- `react-native-secure-key-store`: manifest `^2.0.10`, lockfile `2.0.10`
- `react-native-tcp-socket`: manifest `^6.0.6`, lockfile `6.0.6`
- `react-native-webview`: manifest `^11.26.1`, lockfile `11.26.1`

Direct usage found in this audit:

- `@react-native-async-storage/async-storage`: `Navigator`, fee cache, Redux persist, store service, storage tests.
- `@react-native-community/netinfo`: Electrum saga connectivity checks and network listener.
- `react-native-device-info`: emulator detection, device security checks, about screen metadata.
- `react-native-config`: app environment, Electrum host/protocol, explorer URL, Sentry DSNs, CodePush keys.
- `react-native-localize`: mocked in tests and used through localization runtime.
- `react-native-secure-key-store`: `SecureStorageService`.
- `react-native-tcp-socket`: TLS Electrum socket implementation.
- `react-native-webview`: terms and conditions screens.
- `react-native-randombytes`: tracked native dependency for crypto random byte behavior even though direct source usage is indirect through wallet/crypto dependencies.

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

The guard verifies that `test:storage`, `test:authenticator`, and `test:wallet-core:offline` keep pointing at existing focused Jest files and remain part of `prepush`.

## Latest Npm Snapshot

Latest package metadata checked during this audit:

```text
@react-native-async-storage/async-storage latest: 3.1.0
peerDependencies:
- react: *
- react-native: *

@react-native-community/netinfo latest: 12.0.1
peerDependencies:
- react: *
- react-native: >=0.59

react-native-device-info latest: 15.0.2
peerDependencies:
- react-native: *

react-native-config latest: 1.6.1
peerDependencies:
- react: *
- react-native: *
- react-native-windows: >=0.61

react-native-localize latest: 3.7.0
peerDependencies:
- react: *
- react-native: *
- react-native-macos: *

react-native-randombytes latest: 3.6.2

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
- `react-native-secure-key-store` is already at latest `2.0.10`; it should not be changed unless replacing the package entirely.
- `react-native-tcp-socket` has a newer `6.4.1`, but it is directly tied to Electrum connectivity and needs emulator/device smoke plus network checks.
- `react-native-config` upgrades must preserve all current env variables used in `src/config/index.ts`.
- AsyncStorage changes must keep Redux persist, `StoreService`, fee cache, and storage encryption tests green.
- WebView changes need manual terms-screen checks because WebView loading is asynchronous and UI-driven.

## Decision

- Do not batch-upgrade this group.
- Keep one dependency per mini-branch unless two packages are proven to be tightly coupled.
- Treat `react-native-tcp-socket`, `react-native-secure-key-store`, and AsyncStorage as high-risk wallet branches.
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
