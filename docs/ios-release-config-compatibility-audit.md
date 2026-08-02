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

After `BEM-37.592`, `ios/Podfile` and all Xcode `IPHONEOS_DEPLOYMENT_TARGET` entries are still aligned to React Native `0.86.2`'s minimum iOS `15.1`. `corepack yarn ios:release:readiness:audit` verifies that static alignment, required release files, expected shared schemes, Sentry phases, absence of CodePush plist placeholders, and remote-notification plist coverage, then writes `local-docs/ios-release-static-readiness-summary.txt`; `corepack yarn ios:release:readiness:check-summary` validates the generated summary. Runtime archive/simulator validation still requires macOS with Xcode `16.1+`.

After `BEM-37.687`, the same audit still reports `ios/Podfile.lock` drift against the current native package baseline on 2026-06-17. On this Windows machine the lockfile still references React Native `0.65.3` and older BootSplash, Config, AsyncStorage, DeviceInfo, FastImage, Firebase, Gesture Handler, Localize, Screens, Sentry, and VectorIcons pods. The static iOS project files are valid for React Native `0.86.2` with iOS deployment target `15.1`, 8 guarded schemes, 4 Sentry bundle/source-map phases, 3 Sentry dSYM upload phases, 4 remote-notification plists, and no CodePush plist placeholders, but iOS archive readiness is not claimable until `pod install` refreshes `ios/Podfile.lock` on macOS and an affected scheme builds with Xcode `16.1+`.

After `BEM-37.314`, Detox iOS build commands are routed through `scripts/runDetoxIosBuild.mjs`. The wrapper keeps `RN_SRC_EXT=e2e.tsx` and `CHAMBER_OF_SECRETS=true`, fails clearly outside macOS/Xcode, and maps production Detox builds to the existing `GoldWallet (Debug/Release)` schemes instead of the non-existent `GoldWallet Prod` schemes. `corepack yarn check:detox-readiness` guards that mapping before iOS simulator validation can run on macOS.

After `BEM-37.480`, `scripts/runIosMacValidationHandoff.mjs` provides an executable macOS handoff for iOS validation. `corepack yarn ios:mac-validation:handoff:dry-run` is Windows-safe and prints the required command order without claiming runtime validation. On macOS, `corepack yarn ios:mac-validation:handoff --scheme "GoldWallet Dev (Debug)"` runs prerequisite audit/check, refreshes pods, runs release readiness audit/check, builds the selected shared scheme with `xcodebuild` against `ios/GoldWallet.xcworkspace`, and re-runs release readiness checks after the build. The handoff then directly validates `local-docs/ios-mac-validation-prereqs-summary.txt` and `local-docs/ios-release-static-readiness-summary.txt`, and it refuses success unless both summaries are ready, `ios/Podfile.lock` drift is zero, and iOS runtime delivery remains explicitly not claimed. `corepack yarn check:ios-mac-validation-handoff-guard` guards the eight known shared scheme/configuration pairs, handoff command sequence, and final readiness gate.

After `BEM-37.569`, `corepack yarn ios:validation:handoff-summary` combines the static iOS release readiness summary and the macOS prerequisite summary into `local-docs/ios-validation-handoff-summary.txt`. The generated handoff records whether static files are valid, whether `ios/Podfile.lock` still needs a macOS `pod install` refresh, whether `xcodebuild`/CocoaPods are available, and keeps iOS runtime delivery as `not claimed` until a real macOS archive/simulator run exists. `corepack yarn ios:validation:handoff-summary:dry-run` is safe on Windows, `corepack yarn ios:validation:handoff-summary:check` validates the generated local artifact, and `corepack yarn check:ios-validation-handoff-summary-guard` guards the summary format, blocker accounting, zero-drift ready state, and secret-free output.

After `BEM-37.704`, `corepack yarn ios:podfile-refresh:plan` writes `local-docs/ios-podfile-refresh-plan.txt` with the exact active `ios/Podfile.lock` drift list and the macOS command sequence for refreshing CocoaPods before iOS archive/simulator validation. The plan records all 8 guarded shared schemes, keeps the default `GoldWallet Dev (Debug)` simulator validation command visible, and also renders the full `ios:mac-validation:handoff --all-schemes` command for complete shared-scheme validation after the pod refresh. `corepack yarn ios:podfile-refresh:check-plan` validates that local artifact, while `corepack yarn check:ios-podfile-refresh-plan-guard` keeps the plan format guarded and ensures iOS runtime delivery remains unclaimed until a real macOS run exists.

After `BEM-37.425`, the iOS macOS validation handoff guard is part of `rn:baseline:preflight` and the Android dev environment audit's required helper/script inventory. This keeps the macOS handoff command order guarded before iOS runtime validation is attempted on a Mac, while Windows validation remains limited to dry-run/static checks.

After `BEM-37.433`, both iOS release readiness and iOS macOS validation prerequisite audits derive `ios/Podfile.lock` drift from the shared `scripts/iosPodfileLockDrift.mjs` helper. This keeps the Windows static-readiness summary and the macOS handoff prerequisite summary aligned on the same active drift count, removed-pod reference count, and required `pod install` action before any iOS archive/runtime validation is claimed.

After `BEM-37.722`, `corepack yarn ios:mac-validation:handoff:preflight --all-schemes` refreshes the iOS release readiness summary, macOS prerequisite summary, Podfile.lock refresh plan, combined validation handoff summary, and all-scheme macOS dry run on Windows. The 2026-06-17 handoff reports static iOS files valid, 12 active `ios/Podfile.lock` drift issues, 0 removed-pod references, platform `win32`, unavailable `xcodebuild`, unavailable CocoaPods, 8 guarded schemes, `Implementation ready: no`, `Secret values printed: no`, and `iOS runtime delivery validation: not claimed`.

After `BEM-37.794`, `corepack yarn check:ios-release-config-doc-guard` keeps this audit aligned with the current iOS release-config posture. Current CodePush posture is removed: iOS Info.plist files no longer contain native `CodePushDeploymentKey` placeholders, CodePush native/runtime integration is removed, and release-config follow-up must not reintroduce CodePush bundle/deployment-key work as a default iOS validation path. `ios/Podfile.lock` still has `12` active drift issues, so iOS runtime delivery validation remains not claimed until macOS with Xcode `16.1+`, CocoaPods, and a refreshed `ios/Podfile.lock` are available. Use `ios:mac-validation:handoff:preflight --all-schemes` on Windows to refresh static evidence, then run `ios:mac-validation:handoff --all-schemes` on macOS for complete shared-scheme simulator/archive validation.

After `BEM-37.834`, `ios:mac-validation:handoff:preflight --all-schemes` was refreshed on Windows on 2026-07-10 after the latest Android release and release-services evidence branches. Static iOS release files remain valid for React Native `0.86.2`, iOS deployment target `15.1`, minimum Xcode `16.1`, 8 guarded shared schemes, 4 Sentry bundle/source-map phases, 3 Sentry dSYM phases, 4 remote-notification plists, and 0 CodePush plist placeholders. The combined handoff summary still reports platform `win32`, missing `xcodebuild`, missing CocoaPods, 12 active `ios/Podfile.lock` drift issues, `Implementation ready: no`, and `iOS runtime delivery validation: not claimed`. The required macOS action remains unchanged: run `pod install`, review and commit the refreshed `ios/Podfile.lock`, then run `corepack yarn ios:mac-validation:handoff --all-schemes` before claiming simulator/archive readiness.

After `BEM-37.851`, `ios:static:verify` was refreshed on Windows on 2026-07-11 after the latest foundation target evidence branch. The static iOS release posture is unchanged and still valid for React Native `0.86.2`, iOS deployment target `15.1`, minimum Xcode `16.1`, 8 guarded shared schemes, 4 Sentry bundle/source-map phases, 3 Sentry dSYM phases, 4 remote-notification plists, and 0 CodePush plist placeholders. The refreshed handoff summary still reports platform `win32`, missing `xcodebuild`, missing CocoaPods, 12 active `ios/Podfile.lock` drift issues, `Implementation ready: no`, and `iOS runtime delivery validation: not claimed`. Removed Podfile.lock pod references remain `0`; the active macOS blocker is stale native pod versions. The required macOS action remains unchanged: run `pod install`, review and commit the refreshed `ios/Podfile.lock`, then run `corepack yarn ios:mac-validation:handoff --all-schemes` before claiming simulator/archive readiness.

After `BEM-37.858`, `ios:static:verify` was refreshed again on Windows on 2026-07-11 after the latest Android release validation evidence. Static iOS release files remain valid for React Native `0.86.2`, iOS deployment target `15.1`, minimum Xcode `16.1`, 8 guarded shared schemes, 4 Sentry bundle/source-map phases, 3 Sentry dSYM phases, 4 remote-notification plists, and 0 CodePush plist placeholders. The combined handoff summary still reports platform `win32`, missing `xcodebuild`, missing CocoaPods, 12 active `ios/Podfile.lock` drift issues, `Implementation ready: no`, and `iOS runtime delivery validation: not claimed`. Removed Podfile.lock pod references remain `0`; the active blocker is stale native pod versions plus lack of macOS/Xcode/CocoaPods on this machine. The required macOS action remains unchanged: run `pod install`, review and commit the refreshed `ios/Podfile.lock`, then run `corepack yarn ios:mac-validation:handoff --all-schemes` before claiming simulator/archive readiness.

After `BEM-37.957`, the project-owned iOS bootstrap matches the React Native `0.86.2` template contract before the macOS handoff. `ios/Podfile` resolves `react_native_pods.rb` through Node, calls `prepare_react_native_project!`, autolinks React Native/Hermes inside each of the four concrete application targets so package script phases such as RN Firebase are retained, supplies the required application root, and calls the current `react_native_post_install` signature once. The obsolete direct CLI `native_modules` require and duplicate manual `react-native-config` pod declaration are removed. `AppDelegate.m` now starts RN through `RCTReactNativeFactory` and `RCTAppDependencyProvider` while preserving Firebase, dynamic application naming, BootSplash, push notifications, badge cleanup, and deep linking. All four bundle phases use `.xcode.env`, the RN environment wrapper, and the current Sentry Xcode script; the three existing dSYM phases use the current Sentry debug-files script. Xcode project settings now match the template baseline with object version `54`, compatibility `Xcode 12.0`, Swift `5.0`, and C++20. The normal and Detox handoffs no longer request the removed legacy Xcode build system, and the root `Gemfile` pins the Xcode 16-compatible CocoaPods `1.16.2` and xcodeproj `1.27.0` toolchain; the macOS handoff installs this bundle before auditing CocoaPods. `corepack yarn check:ios-rn-template-baseline` guards these invariants, mutation-tests legacy regressions, and accepts both LF and CRLF checkouts. This does not refresh `ios/Podfile.lock` or claim an iOS build: CocoaPods and Xcode `16.1+` on macOS must still generate and validate the lockfile through `corepack yarn ios:mac-validation:handoff --all-schemes`.

After `BEM-37.958`, `.github/workflows/ios-macos-validation.yml` provides that macOS execution environment with pinned `macos-15-intel` and Xcode 16.4. Relevant integration-branch pushes and pull requests run the focused Dev Debug simulator build, while manual dispatch can execute all eight shared schemes after the workflow reaches the default branch. The job uses read-only repository permissions, no release secrets, and explicit Sentry auto-upload disablement, then retains the generated `ios/Podfile.lock` and local iOS summaries for review even when the build fails. It fails until the generated lockfile is reviewed, committed, and reproduced without a diff on the next run. `corepack yarn check:ios-macos-validation-workflow-guard` keeps the workflow fail-closed and rejects floating runners/actions, write permissions, secret expressions, unfrozen dependency installation, or acceptance of uncommitted lockfile drift. iOS runtime readiness remains unclaimed until an actual workflow run succeeds and its refreshed lockfile is reviewed and committed.

## Current Release-Service Keys

Referenced iOS env files carry the current release-service keys as follows:

| Env file | Sentry iOS/Android DSNs | CodePush iOS/Android keys | Beta flag |
| --- | --- | --- | --- |
| `.env.dev.testnet` | yes | yes | no explicit `IS_BETA` |
| `.env.stage.mainnet` | yes | yes | no explicit `IS_BETA` |
| `.env.prod.mainnet` | yes | yes | no explicit `IS_BETA` |
| `.env.beta.testnet` | yes | no | yes |
| `.env.beta.mainnet` | yes | no | yes |

`check:release-service-env-keys` validates required key presence for referenced env files and intentionally does not print secret values. Historical CodePush env keys can still exist in referenced env files, but they are not evidence of native/runtime CodePush integration after the removal work; future OTA replacement work should start from a separate product decision and explicit validation branch.

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
- `ios/Podfile.lock` is stale after the Android/RN/native modernization stream; refresh it on macOS before claiming any iOS archive/runtime readiness. The current 2026-07-11 audit records 0 removed Podfile.lock pod references, 12 active drift issues, no local `xcodebuild`, no local CocoaPods, and iOS runtime delivery validation remains not claimed on this Windows machine.
- Rebranding may require coordinated changes across display names, bundle identifiers, Info.plist files, env `APP_ID`, Firebase plist files, Sentry DSNs, release-service env cleanup, and store metadata.
- CodePush native/runtime integration is removed; release-config work should keep that posture unless a separate OTA replacement decision is made.
- Sentry and Firebase config changes need release-build validation, not only Android/iOS debug startup.

## Recommended Follow-Up Branches

1. iOS macOS validation branch: refresh `ios/Podfile.lock` with `pod install`, then run `ios:mac-validation:handoff --all-schemes` on macOS before claiming iOS simulator/archive readiness.
2. Firebase/APNs validation branch: confirm Firebase plist selection, APNs registration, foreground/background notification behavior, and notification tap-through for affected iOS schemes.
3. Sentry source-map/dSYM upload branch: validate Sentry source-map/dSYM upload once `SENTRY_AUTH_TOKEN` and the required Sentry properties files are available.
4. Rebranding branch: update app names, bundle IDs, env app IDs, Firebase/Sentry wiring, and store metadata as one coordinated release-config change.

## Validation Path For Future Changes

Docs/audit-only:

```powershell
corepack yarn android:dev:check-light
```

Release-config implementation:

- Run `corepack yarn android:dev:check-light`.
- Run `corepack yarn ios:release:readiness:audit` and `corepack yarn ios:release:readiness:check-summary`; if `Podfile.lock refresh required` is `yes`, refresh CocoaPods on macOS before archive validation.
- Run `corepack yarn check:ios-release-config-doc-guard` after changing this audit or release-config wording.
- Run Android build/smoke if shared env or runtime config changes affect Android.
- Validate iOS schemes on a Mac runner/device or simulator.
- Validate Sentry source-map/dSYM upload only after Sentry credentials and properties files are available.
- Start Firebase release-service validation with `corepack yarn firebase:release-services:audit`; it checks package alignment, Android config, iOS plist files, Messaging runtime wiring, and writes `local-docs/firebase-release-services-summary.txt`. Validate that artifact with `corepack yarn firebase:release-services:check-summary`.
- Start iOS push notification bridge validation with `corepack yarn push-notification:bridge-audit`; after `BEM-37.79` it should report no static readiness issues and write `local-docs/push-notification-bridge-summary.txt`. Validate that artifact with `corepack yarn push-notification:bridge-check-summary`, then run device validation for APNs/token/delivery behavior.
- Do not guess missing DSNs, Firebase files, Sentry credentials, or store metadata values; report exact missing key/file names instead.
