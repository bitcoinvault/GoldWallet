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

After `BEM-37.592`, `ios/Podfile` and all Xcode `IPHONEOS_DEPLOYMENT_TARGET` entries are still aligned to React Native `0.86.0`'s minimum iOS `15.1`. `corepack yarn ios:release:readiness:audit` verifies that static alignment, required release files, expected shared schemes, Sentry phases, absence of CodePush plist placeholders, and remote-notification plist coverage, then writes `local-docs/ios-release-static-readiness-summary.txt`; `corepack yarn ios:release:readiness:check-summary` validates the generated summary. Runtime archive/simulator validation still requires macOS with Xcode `16.1+`.

After `BEM-37.687`, the same audit still reports `ios/Podfile.lock` drift against the current native package baseline on 2026-06-16. On this Windows machine the lockfile still references React Native `0.65.3` and older BootSplash, Config, AsyncStorage, DeviceInfo, FastImage, Firebase, Gesture Handler, Localize, Screens, Sentry, and VectorIcons pods. The static iOS project files are valid for React Native `0.86.0` with iOS deployment target `15.1`, 8 guarded schemes, 4 Sentry bundle/source-map phases, 3 Sentry dSYM upload phases, 4 remote-notification plists, and no CodePush plist placeholders, but iOS archive readiness is not claimable until `pod install` refreshes `ios/Podfile.lock` on macOS and an affected scheme builds with Xcode `16.1+`.

After `BEM-37.314`, Detox iOS build commands are routed through `scripts/runDetoxIosBuild.mjs`. The wrapper keeps `RN_SRC_EXT=e2e.tsx` and `CHAMBER_OF_SECRETS=true`, fails clearly outside macOS/Xcode, and maps production Detox builds to the existing `GoldWallet (Debug/Release)` schemes instead of the non-existent `GoldWallet Prod` schemes. `corepack yarn check:detox-readiness` guards that mapping before iOS simulator validation can run on macOS.

After `BEM-37.480`, `scripts/runIosMacValidationHandoff.mjs` provides an executable macOS handoff for iOS validation. `corepack yarn ios:mac-validation:handoff:dry-run` is Windows-safe and prints the required command order without claiming runtime validation. On macOS, `corepack yarn ios:mac-validation:handoff --scheme "GoldWallet Dev (Debug)"` runs prerequisite audit/check, refreshes pods, runs release readiness audit/check, builds the selected shared scheme with `xcodebuild` against `ios/GoldWallet.xcworkspace`, and re-runs release readiness checks after the build. The handoff then directly validates `local-docs/ios-mac-validation-prereqs-summary.txt` and `local-docs/ios-release-static-readiness-summary.txt`, and it refuses success unless both summaries are ready, `ios/Podfile.lock` drift is zero, and iOS runtime delivery remains explicitly not claimed. `corepack yarn check:ios-mac-validation-handoff-guard` guards the eight known shared scheme/configuration pairs, handoff command sequence, and final readiness gate.

After `BEM-37.569`, `corepack yarn ios:validation:handoff-summary` combines the static iOS release readiness summary and the macOS prerequisite summary into `local-docs/ios-validation-handoff-summary.txt`. The generated handoff records whether static files are valid, whether `ios/Podfile.lock` still needs a macOS `pod install` refresh, whether `xcodebuild`/CocoaPods are available, and keeps iOS runtime delivery as `not claimed` until a real macOS archive/simulator run exists. `corepack yarn ios:validation:handoff-summary:dry-run` is safe on Windows, while `corepack yarn check:ios-validation-handoff-summary-guard` guards the summary format, blocker accounting, zero-drift ready state, and secret-free output.

After `BEM-37.639`, `corepack yarn ios:podfile-refresh:plan` writes `local-docs/ios-podfile-refresh-plan.txt` with the exact active `ios/Podfile.lock` drift list and the macOS command sequence for refreshing CocoaPods before iOS archive/simulator validation. `corepack yarn ios:podfile-refresh:check-plan` validates that local artifact, while `corepack yarn check:ios-podfile-refresh-plan-guard` keeps the plan format guarded and ensures iOS runtime delivery remains unclaimed until a real macOS run exists.

After `BEM-37.425`, the iOS macOS validation handoff guard is part of `rn:baseline:preflight` and the Android dev environment audit's required helper/script inventory. This keeps the macOS handoff command order guarded before iOS runtime validation is attempted on a Mac, while Windows validation remains limited to dry-run/static checks.

After `BEM-37.433`, both iOS release readiness and iOS macOS validation prerequisite audits derive `ios/Podfile.lock` drift from the shared `scripts/iosPodfileLockDrift.mjs` helper. This keeps the Windows static-readiness summary and the macOS handoff prerequisite summary aligned on the same active drift count, removed-pod reference count, and required `pod install` action before any iOS archive/runtime validation is claimed.

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

- iOS Info.plist files no longer contain native `CodePushDeploymentKey` placeholders after the CodePush removal branch.
- Production, Dev, and Stage Info.plist files include `UIBackgroundModes` with `remote-notification`.
- `ios/GoldWallet/AppDelegate.m` assigns `UNUserNotificationCenter` delegate for foreground notification presentation callbacks.
- `GoldWallet-beta.plist` exists and is used by beta configurations, but beta scheme pre-actions do not currently copy a `GoogleService-Info-*.plist` file.
- The Xcode project contains build phases that copy `${FIREBASE_CONFIG_FILE}.plist` to `GoogleService-Info.plist` for some configurations.

## Risks Before Rebranding Or Release-Service Upgrades

- Stage Debug currently pairs `.env.dev.testnet` with `GoogleService-Info-stage.plist`; that may be intentional for testnet stage debugging, but it must be confirmed before changing scheme pre-actions.
- Beta schemes currently copy beta env files but no Firebase plist in scheme pre-actions; confirm whether beta relies on build settings, bundled resources, or a missing Firebase copy step.
- `ios/Podfile.lock` is stale after the Android/RN/native modernization stream; refresh it on macOS before claiming any iOS archive/runtime readiness. The current 2026-06-16 audit records 0 removed Podfile.lock pod references, 12 active drift issues, no local `xcodebuild`, no local CocoaPods, and iOS runtime delivery validation remains not claimed on this Windows machine.
- Rebranding may require coordinated changes across display names, bundle identifiers, Info.plist files, env `APP_ID`, Firebase plist files, Sentry DSNs, release-service env cleanup, and store metadata.
- CodePush native/runtime integration is removed; debug scheme startup does not validate any future OTA/update replacement posture.
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
- Validate at least one non-dev build path for Sentry source-map behavior and confirm the intended OTA/update replacement posture.
- Start CodePush release-path validation with `corepack yarn codepush:release:path-audit`; it checks wiring and key presence only, writes `local-docs/codepush-release-path-summary.txt`, and does not print deployment-key values. Validate that artifact with `corepack yarn codepush:release:path-check-summary`.
- Start Firebase release-service validation with `corepack yarn firebase:release-services:audit`; it checks package alignment, Android config, iOS plist files, Messaging runtime wiring, and writes `local-docs/firebase-release-services-summary.txt`. Validate that artifact with `corepack yarn firebase:release-services:check-summary`.
- Start iOS push notification bridge validation with `corepack yarn push-notification:bridge-audit`; after `BEM-37.79` it should report no static readiness issues and write `local-docs/push-notification-bridge-summary.txt`. Validate that artifact with `corepack yarn push-notification:bridge-check-summary`, then run device validation for APNs/token/delivery behavior.
- Do not guess missing DSNs, Firebase files, or CodePush deployment keys; report exact missing key/file names instead.
