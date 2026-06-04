# iOS Release Config Compatibility Audit

Scope: `BEM-36 - Native modules upgrade`, release-service and rebranding preparation.

This audit records the current iOS scheme, env, Firebase plist, Info.plist, and CodePush wiring before release-service upgrades or rebranding changes. It does not change runtime behavior.

## Current Scheme Pre-Actions

| Scheme | Env copied to `.env` | Firebase plist copied by scheme pre-action |
| --- | --- | --- |
| `GoldWallet (Debug)` | `.env.prod.mainnet` | `GoogleService-Info-prod.plist` |
| `GoldWallet (Release)` | `.env.prod.mainnet` | `GoogleService-Info-prod.plist` |
| `GoldWallet Beta (Debug)` | `.env.beta.testnet` | none in scheme pre-action |
| `GoldWallet Beta (Release)` | `.env.beta.mainnet` | none in scheme pre-action |
| `GoldWallet Dev (Debug)` | `.env.dev.testnet` | `GoogleService-Info-dev.plist` |
| `GoldWallet Dev (Release)` | `.env.dev.testnet` | `GoogleService-Info-dev.plist` |
| `GoldWallet Stage (Debug)` | `.env.dev.testnet` | `GoogleService-Info-stage.plist` |
| `GoldWallet Stage (Release)` | `.env.stage.mainnet` | `GoogleService-Info-stage.plist` |

## Current Xcode Build Settings

Project build settings also define `FIREBASE_CONFIG_FILE` for the main non-beta configurations:

| Configuration group | Firebase config | Info.plist | Bundle identifier |
| --- | --- | --- | --- |
| Production | `GoogleService-Info-prod` | `GoldWallet/Info.plist` | `com.minebest.goldwalletbtcv` |
| Stage | `GoogleService-Info-stage` | `GoldWalletStage-Info.plist` | `com.minebest.goldwalletbtcv.stage` |
| Dev | `GoogleService-Info-dev` | `GoldWalletDev-Info.plist` | `com.minebest.goldwalletbtcv.dev` |
| Beta | not visible in the captured `FIREBASE_CONFIG_FILE` rows | `GoldWallet-beta.plist` | `com.minebest.goldwalletbtcv.beta` |

After `BEM-37.209`, `ios/Podfile` and all Xcode `IPHONEOS_DEPLOYMENT_TARGET` entries are aligned to React Native `0.85.3`'s minimum iOS `15.1`. `corepack yarn ios:release:readiness:audit` verifies that static alignment, required release files, expected shared schemes, Sentry phases, and CodePush plist placeholders, then writes `local-docs/ios-release-static-readiness-summary.txt`; `corepack yarn ios:release:readiness:check-summary` validates the generated summary. Runtime archive/simulator validation still requires macOS with Xcode `16.1+`.

After `BEM-37.333`, the same audit reports `ios/Podfile.lock` drift against the current native package baseline on 2026-06-03. On this Windows machine the lockfile still references React Native `0.65.3` and older BootSplash, Config, AsyncStorage, DeviceInfo, FastImage, Firebase, Gesture Handler, Localize, Screens, Sentry, and VectorIcons pods. The static iOS project files are valid, but iOS archive readiness is not claimable until `pod install` refreshes `ios/Podfile.lock` on macOS and an affected scheme builds.

After `BEM-37.314`, Detox iOS build commands are routed through `scripts/runDetoxIosBuild.mjs`. The wrapper keeps `RN_SRC_EXT=e2e.tsx` and `CHAMBER_OF_SECRETS=true`, fails clearly outside macOS/Xcode, and maps production Detox builds to the existing `GoldWallet (Debug/Release)` schemes instead of the non-existent `GoldWallet Prod` schemes. `corepack yarn check:detox-readiness` guards that mapping before iOS simulator validation can run on macOS.

After `BEM-37.399`, `scripts/runIosMacValidationHandoff.mjs` provides an executable macOS handoff for iOS validation. `corepack yarn ios:mac-validation:handoff:dry-run` is Windows-safe and prints the required command order without claiming runtime validation. On macOS, `corepack yarn ios:mac-validation:handoff --scheme "GoldWallet Dev (Debug)"` runs prerequisite audit/check, refreshes pods, runs release readiness audit/check, builds the selected shared scheme with `xcodebuild` against `ios/GoldWallet.xcworkspace`, and re-runs release readiness checks after the build. `corepack yarn check:ios-mac-validation-handoff-guard` guards the eight known shared scheme/configuration pairs and handoff command sequence.

## Current Release-Service Keys

Referenced iOS env files carry the current release-service keys as follows:

| Env file | Sentry iOS/Android DSNs | CodePush iOS/Android keys | Beta flag |
| --- | --- | --- | --- |
| `.env.dev.testnet` | yes | yes | no explicit `IS_BETA` |
| `.env.stage.mainnet` | yes | yes | no explicit `IS_BETA` |
| `.env.prod.mainnet` | yes | yes | no explicit `IS_BETA` |
| `.env.beta.testnet` | yes | no | yes |
| `.env.beta.mainnet` | yes | no | yes |

`check:release-service-env-keys` validates required key presence for referenced env files and intentionally does not print secret values. Beta env files currently do not require CodePush deployment keys until beta release/update behavior is confirmed.

`check:ios-scheme-config-guard` and `check:ios-scheme-config` now guard the scheme-to-env/Firebase plist matrix above. The guard preserves the currently documented Stage Debug and Beta behavior as an explicit baseline; changing that behavior should happen in a release-config branch with iOS validation.

## Current Native App Metadata Surface

- `ios/GoldWallet/Info.plist`, `ios/GoldWalletDev-Info.plist`, and `ios/GoldWalletStage-Info.plist` contain `CodePushDeploymentKey`.
- Production, Dev, and Stage Info.plist files include `UIBackgroundModes` with `remote-notification`.
- `ios/GoldWallet/AppDelegate.m` assigns `UNUserNotificationCenter` delegate for foreground notification presentation callbacks.
- `GoldWallet-beta.plist` exists and is used by beta configurations, but beta scheme pre-actions do not currently copy a `GoogleService-Info-*.plist` file.
- The Xcode project contains build phases that copy `${FIREBASE_CONFIG_FILE}.plist` to `GoogleService-Info.plist` for some configurations.

## Risks Before Rebranding Or Release-Service Upgrades

- Stage Debug currently pairs `.env.dev.testnet` with `GoogleService-Info-stage.plist`; that may be intentional for testnet stage debugging, but it must be confirmed before changing scheme pre-actions.
- Beta schemes currently copy beta env files but no Firebase plist in scheme pre-actions; confirm whether beta relies on build settings, bundled resources, or a missing Firebase copy step.
- `ios/Podfile.lock` is stale after the Android/RN/native modernization stream; refresh it on macOS before claiming any iOS archive/runtime readiness. The current audit records 0 removed Podfile.lock pod references, 12 active drift issues, and confirms `xcodebuild` is unavailable on this Windows machine.
- Rebranding may require coordinated changes across display names, bundle identifiers, Info.plist files, env `APP_ID`, Firebase plist files, Sentry DSNs, CodePush deployment keys, and store metadata.
- CodePush is disabled in `__DEV__`, so debug scheme startup alone does not validate release update behavior.
- Sentry and Firebase config changes need release-build validation, not only Android/iOS debug startup.

## Recommended Follow-Up Branches

1. `feature/bem-ios-scheme-config-guard`: add a non-secret guard that captures the expected scheme-to-env/plist mapping once the Stage/Beta behavior is confirmed.
2. `feature/bem-codepush-release-path-audit`: validate non-dev CodePush bundle/deployment-key behavior.
3. `feature/bem-firebase-release-config-audit`: validate Firebase plist selection and Crashlytics/Messaging setup for iOS schemes.
4. Rebranding branch: update app names, bundle IDs, env IDs, Firebase/Sentry/CodePush wiring, and store metadata as one coordinated release-config change.

## Validation Path For Future Changes

Docs/audit-only:

```powershell
corepack yarn android:dev:check-light
```

Release-config implementation:

- Run `corepack yarn android:dev:check-light`.
- Run `corepack yarn ios:release:readiness:audit` and `corepack yarn ios:release:readiness:check-summary`; if `Podfile.lock refresh required` is `yes`, refresh CocoaPods on macOS before archive validation.
- Run Android build/smoke if shared env or runtime config changes affect Android.
- Validate iOS schemes on a Mac runner/device or simulator.
- Validate at least one non-dev build path for CodePush and Sentry source-map behavior.
- Start CodePush release-path validation with `corepack yarn codepush:release:path-audit`; it checks wiring and key presence only, writes `local-docs/codepush-release-path-summary.txt`, and does not print deployment-key values. Validate that artifact with `corepack yarn codepush:release:path-check-summary`.
- Start Firebase release-service validation with `corepack yarn firebase:release-services:audit`; it checks package alignment, Android config, iOS plist files, Messaging runtime wiring, and writes `local-docs/firebase-release-services-summary.txt`. Validate that artifact with `corepack yarn firebase:release-services:check-summary`.
- Start iOS push notification bridge validation with `corepack yarn push-notification:bridge-audit`; after `BEM-37.79` it should report no static readiness issues and write `local-docs/push-notification-bridge-summary.txt`. Validate that artifact with `corepack yarn push-notification:bridge-check-summary`, then run device validation for APNs/token/delivery behavior.
- Do not guess missing DSNs, Firebase files, or CodePush deployment keys; report exact missing key/file names instead.
