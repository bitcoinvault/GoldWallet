# CodePush Retirement And Migration Plan

Scope: `BEM-37.282 - CodePush retirement audit`.

## Current State

- `BEM-37.583` removes `react-native-code-push` from JavaScript, Android, iOS plist/native integration, `package.json`, `yarn.lock`, and `ios/Podfile.lock`.
- Historical `.env.*` files may still carry stale `CODEPUSH_*` keys until a secrets-safe cleanup is done; those keys are no longer required by the app runtime or release-service env guard.
- `react-native-code-push@9.0.1` is the latest npm release checked on 2026-06-11.
- The latest npm release was published on 2024-12-19.
- Microsoft App Center CodePush was retired on 2025-03-31.
- The Microsoft `react-native-code-push` and standalone `code-push-server` repositories are archived/read-only. `gh repo view microsoft/react-native-code-push --json nameWithOwner,isArchived,pushedAt,updatedAt,defaultBranchRef,description,url` and `gh repo view microsoft/code-push-server --json nameWithOwner,isArchived,pushedAt,updatedAt,defaultBranchRef,description,url` confirmed `isArchived: true` on 2026-06-11.
- The upstream Microsoft README states that React Native CodePush does not support New Architecture.
- This repo currently has Android `newArchEnabled=true`, so CodePush must be treated as legacy release infrastructure even when local builds still pass.
- CodePush runtime startup and native bundle resolution are no longer present after `BEM-37.583`; non-dev builds use bundled JS assets instead of the retired OTA client.

Official references:

- https://learn.microsoft.com/appcenter/retirement
- https://github.com/microsoft/react-native-code-push
- https://github.com/microsoft/code-push-server

## Local Evidence

The guarded local audit now records:

```powershell
corepack yarn codepush:release:path-audit
corepack yarn codepush:release:path-check-summary
corepack yarn check:codepush-release-path-summary-guard
corepack yarn codepush:migration:readiness-audit
corepack yarn codepush:migration:readiness-check-summary
corepack yarn check:codepush-migration-readiness-summary-guard
corepack yarn codepush:removal-readiness:audit
corepack yarn codepush:removal-readiness:check-summary
corepack yarn check:codepush-removal-readiness-summary-guard
corepack yarn codepush:decision:handoff:dry-run
corepack yarn check:codepush-decision-handoff-summary-guard
corepack yarn codepush:update:validation:handoff:dry-run
corepack yarn check:codepush-update-validation-handoff-guard
corepack yarn check:codepush-env-cleanup-plan-guard
corepack yarn check:codepush-env-cleanup-summary-guard
corepack yarn codepush:env-cleanup:audit
corepack yarn codepush:env-cleanup:check-summary
corepack yarn codepush:env-cleanup:plan
corepack yarn codepush:env-cleanup:check-plan
```

Expected summary claims after `BEM-37.583`:

- package dependency and installed package are reported as `removed`, while latest npm metadata remains recorded for historical context;
- App Center CodePush retirement date is recorded as `2025-03-31`;
- upstream retired/archived state is recorded;
- upstream New Architecture support is recorded as `no`;
- Android New Architecture enabled state is recorded;
- CodePush migration required is recorded as `no` after removal;
- npm latest version, latest published timestamp, npm repository, and upstream repository are recorded in the migration-readiness summary so the remove-or-replace decision carries package/upstream evidence directly;
- CodePush runtime gate, runtime HOC, native bundle gate, plist placeholders, package dependency, and installed package are recorded as removed;
- Android release build evidence is recorded separately from CodePush update validation;
- local Android release evidence currently covers `dev`, `stage`, `prod`, and `beta` release variants;
- release build evidence readiness is recorded separately from OTA update validation;
- stale CodePush env-key presence is not treated as a release blocker and no deployment-key values are printed;
- the migration readiness summary records the current posture as removed;
- the long-term options are recorded as removed;
- the decision handoff generator defaults to the current post-removal decision `remove` with beta strategy `beta has no OTA`, while still allowing explicit `pending`, `replace`, or temporary legacy overrides for future planning;
- the decision handoff keeps release build evidence, release-smoke evidence, beta strategy, iOS validation status, and OTA update validation state in one local artifact without printing deployment-key values;
- the removal-readiness summary records zero runtime, Android, iOS, and plist surfaces remaining after removal;
- the removal-readiness summary also records the CodePush package latest version, latest published timestamp, npm repository, upstream repository, archived state, New Architecture support, Android New Architecture enabled state, migration-required state, and Android release evidence readiness before any removal is planned;
- the removal-readiness summary records `Safe to remove now: no` after removal because there is no remaining CodePush integration to remove;
- the release-services handoff now defaults to `--codepush-decision remove --codepush-beta-strategy beta-has-no-ota` so the selected post-removal decision is preserved through the full release-services validation sequence instead of being reset to `pending`;
- the update-validation handoff keeps Android release evidence, CodePush readiness summaries, aggregate release-service summaries, and the current blocked update-validation state in one guarded sequence;
- no deployment key values are printed.
- the env cleanup plan lists only file paths, key names, blank/non-empty state, and the required secrets-safe action; it never prints key values.
- the env cleanup readiness summary guard is run before release-services handoff refreshes CodePush env cleanup readiness, so stale cleanup evidence cannot silently drift.

## Decision Needed

Do not plan another blind CodePush package upgrade. The package is already latest and the upstream service is retired.

Choose one release strategy:

1. Remove CodePush from the app if OTA updates are no longer a product requirement.
2. Migrate OTA updates to a maintained/self-hosted compatible replacement if OTA remains required.
3. Keep current CodePush wiring temporarily only as legacy compatibility, gated off by default, with release update validation explicitly unclaimed.

## Decision Handoff Gate

Decision owner input required before implementation:

- choose `remove` if OTA updates are no longer a supported product/release capability;
- choose `replace` if OTA updates remain required and a maintained/self-hosted replacement is selected;
- choose `temporary legacy compatibility` only as an explicit short-term exception, with CodePush remaining gated off by default and update validation still unclaimed.

Evidence that must be attached to the decision:

- current `codepush:decision:handoff` output generated with the selected decision and beta strategy;
- current `codepush:release:path-audit` and `codepush:release:path-check-summary` output;
- current `codepush:migration:readiness-audit` and `codepush:migration:readiness-check-summary` output;
- current `codepush:removal-readiness:audit` and `codepush:removal-readiness:check-summary` output;
- current Android release build, manifest, and release-smoke evidence;
- current release-services aggregate summary;
- iOS macOS/Xcode/CocoaPods blocker or validation result;
- explicit beta deployment-key strategy: beta has OTA keys, beta has no OTA, or beta is out of scope.

Do not reintroduce a removal branch unless CodePush runtime/native integration is reintroduced.
Do not start a replacement branch until the decision says `replace` and names the replacement target.
Do not claim CodePush update validation until deployment keys are non-empty for the target environments and a real OTA delivery test has run.
Never print or commit CodePush deployment-key values in handoff artifacts.

Local remove-decision gate:

```powershell
corepack yarn codepush:release:path-audit
corepack yarn codepush:release:path-check-summary
corepack yarn codepush:migration:readiness-audit
corepack yarn codepush:migration:readiness-check-summary
corepack yarn codepush:removal-readiness:audit
corepack yarn codepush:removal-readiness:check-summary
corepack yarn codepush:decision:handoff --decision remove --beta-strategy beta-has-no-ota
corepack yarn codepush:removal-readiness:audit
corepack yarn codepush:removal-readiness:check-summary
corepack yarn release-services:validation:handoff --skip-android-release --codepush-decision remove --codepush-beta-strategy beta-has-no-ota
```

The first removal-readiness audit provides the inventory required by the decision handoff. The second removal-readiness audit proves that the valid local remove decision is visible before a CodePush removal implementation branch starts. After `BEM-37.583`, the same audit proves the removed state and requires keeping CodePush removed.

## Remove Branch Acceptance Gate

- remove `react-native-code-push` from `package.json` and `yarn.lock`;
- remove runtime wrapping from `App.tsx`;
- remove Android CodePush Gradle/native bundle integration;
- remove iOS CodePush native integration and plist placeholders;
- remove or rewrite env-key guards so missing CodePush keys are no longer release blockers;
- run Android debug assemble and emulator smoke;
- run Android release build, manifest check, and release smoke;
- leave iOS runtime/archive validation unclaimed unless it ran on macOS/Xcode.
- keep stale `.env.*` CodePush key cleanup separate and secrets-safe.

## Replace Branch Acceptance Gate

- document the selected maintained OTA provider or self-hosted server;
- prove Android native integration and release update-check behavior without printing secrets;
- define rollback behavior and store-policy constraints;
- update env/key guards for the replacement without carrying stale CodePush keys as blockers;
- run Android debug assemble and emulator smoke;
- run Android release build, manifest check, and release smoke;
- run iOS macOS validation or record the exact macOS/Xcode/CocoaPods blocker.

## Implementation Follow-Ups

After `BEM-37.583`, CodePush runtime/native removal is implemented. Remaining follow-ups:

If removing CodePush:

- run iOS `pod install` plus simulator/archive validation on macOS/Xcode before claiming iOS runtime delivery;
- remove stale `CODEPUSH_*` values from `.env.*` only through a secrets-safe cleanup that does not expose historical deployment-key values in review;
- use `corepack yarn codepush:env-cleanup:plan` before cleanup so the review-safe artifact records exactly which env files and key names need secure regeneration without printing secret values;
- do not claim OTA update validation unless a maintained replacement is selected and tested.

If replacing CodePush:

- select the maintained OTA provider or self-hosted server;
- validate Android and iOS native integration;
- prove non-dev update check behavior without printing secrets;
- document rollback behavior and store-policy constraints;
- run release build validation and runtime smoke.

## Current Conclusion

The CodePush runtime/native path has been removed from the app. Keep CodePush removed unless a maintained OTA replacement is selected and validated as a separate release capability.
