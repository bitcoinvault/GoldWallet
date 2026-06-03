# CodePush Retirement And Migration Plan

Scope: `BEM-37.282 - CodePush retirement audit`.

## Current State

- The app still has `react-native-code-push` wired in JavaScript, Android, iOS, and env files.
- `react-native-code-push@9.0.1` is the latest npm release checked on 2026-06-03.
- The latest npm release was published on 2024-12-19.
- Microsoft App Center CodePush was retired on 2025-03-31.
- The Microsoft `react-native-code-push` and standalone `code-push-server` repositories are archived/read-only. `gh repo view microsoft/react-native-code-push --json nameWithOwner,isArchived,pushedAt,defaultBranchRef,description,url` and `gh repo view microsoft/code-push-server --json nameWithOwner,isArchived,pushedAt,defaultBranchRef,description,url` confirmed `isArchived: true` on 2026-06-03.
- The upstream Microsoft README states that React Native CodePush does not support New Architecture.
- This repo currently has Android `newArchEnabled=true`, so CodePush must be treated as legacy release infrastructure even when local builds still pass.
- CodePush runtime startup and native bundle resolution are gated by optional `CODEPUSH_ENABLED=true` plus a non-empty platform deployment key. Without the flag, non-dev builds keep the wiring available but do not start the retired OTA client or resolve JS bundles through CodePush by default.

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
```

Expected summary claims:

- package dependency, installed, and latest npm versions are aligned;
- App Center CodePush retirement date is recorded as `2025-03-31`;
- upstream retired/archived state is recorded;
- upstream New Architecture support is recorded as `no`;
- Android New Architecture enabled state is recorded;
- CodePush migration required is recorded as `yes`;
- CodePush runtime gate is recorded as present;
- CodePush native bundle gate is recorded as present;
- CodePush runtime enabled by default is recorded as `no`;
- Android release build evidence is recorded separately from CodePush update validation;
- local Android release evidence currently covers `dev`, `stage`, `prod`, and `beta` release variants;
- release build evidence readiness is recorded separately from OTA update validation;
- ready, blocked, and unconfirmed CodePush env counts are recorded without printing deployment-key values;
- beta CodePush strategy remains explicitly unconfirmed until beta deployment keys or a no-OTA beta decision are provided;
- the migration readiness summary records the current posture as temporary legacy compatibility;
- the long-term options are recorded as remove or replace;
- the readiness guard keeps the migration/removal decision visible even while the package remains on npm latest;
- no deployment key values are printed.

## Decision Needed

Do not plan another blind CodePush package upgrade. The package is already latest and the upstream service is retired.

Choose one release strategy:

1. Remove CodePush from the app if OTA updates are no longer a product requirement.
2. Migrate OTA updates to a maintained/self-hosted compatible replacement if OTA remains required.
3. Keep current CodePush wiring temporarily only as legacy compatibility, gated off by default, with release update validation explicitly unclaimed.

## Implementation Follow-Ups

If removing CodePush:

- remove `react-native-code-push` from `package.json`;
- remove `codePush` wrapping from `App.tsx`;
- remove Android `codepush.gradle`, `MainApplication.java` bundle lookup, and `CodePushDeploymentKey` string placeholders;
- remove iOS `CodePushDeploymentKey` plist placeholders and native integration;
- clean env key guards and release-service docs;
- run Android assemble and emulator smoke.

If replacing CodePush:

- select the maintained OTA provider or self-hosted server;
- validate Android and iOS native integration;
- prove non-dev update check behavior without printing secrets;
- document rollback behavior and store-policy constraints;
- run release build validation and runtime smoke.

## Current Conclusion

The current CodePush code path is build-compatible enough to keep modernization moving and is gated off by default, but it is no longer a supported long-term release capability. Treat it as a migration/removal workstream, not as a normal dependency-refresh item.
