# Sentry Release Source Map Plan

## Current State

- The app uses `@sentry/react-native@8.21.0` with direct release tooling on `@sentry/cli@3.6.2`.
- Android applies `node_modules/@sentry/react-native/sentry.gradle` from `android/app/build.gradle`.
- Android has `project.ext.sentryCli.logLevel = "info"`; the release integration guard rejects `debug` because Sentry CLI debug output can include a masked credential prefix.
- Metro is wrapped with `withSentryConfig`, so Android release bundles and Hermes source maps receive a shared debug ID before the Gradle upload task runs.
- iOS has Xcode build phases for Sentry React Native bundling and dSYM upload.
- DSNs are injected through `react-native-config` as `SENTRY_DSN_IOS` and `SENTRY_DSN_ANDROID`.
- `@sentry/react-native` runtime imports are currently scoped to `App.tsx`, `Main.tsx`, and `logger/index.ts`; `corepack yarn check:sentry-usage-scope` guards that surface before the upgrade branch.
- `corepack yarn check:sentry-usage-guard` verifies the Sentry usage guard fixtures.
- `corepack yarn check:sentry-release-integration` guards the current Android Sentry Gradle integration and iOS source-map/dSYM upload phases.
- `corepack yarn check:sentry-release-integration-guard` verifies the Sentry release integration guard fixtures.
- `corepack yarn sentry:release:prereq-audit` reports whether local `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are available before release source-map validation and writes `local-docs/sentry-release-prereq-summary.txt`.
- The audit selects `prodRelease` runtime evidence by default and derives the full-smoke summary, signed APK, unsigned source APK, and create-wallet summary from one variant config. `SENTRY_ANDROID_RELEASE_EVIDENCE_VARIANT=dev|stage|prod|beta` provides an explicit override; the controlled Electrum no-network fallback is accepted only for `dev` and cannot satisfy a production-evidence claim.
- The prerequisite audit records per-file readiness for the three required Sentry properties files, validates that `create-sentry-properties.sh` writes all three paths, confirms the expected non-secret defaults without printing token values, records local `@sentry/cli` package/bin executability, records whether the latest local Android release summary artifact is present and valid, and now also embeds iOS static/macOS prerequisite evidence for Podfile.lock drift plus Sentry iOS source-map/dSYM phase coverage.
- `create-sentry-properties.sh` now rejects a missing `SENTRY_AUTH_TOKEN` before writing any properties files, so local release setup cannot accidentally create `auth.token=` files that look configured but fail during upload.
- `create-sentry-properties.sh` requires an explicit `SENTRY_RELEASE_PROFILE=nonprod|prod`. It writes separate Android/iOS project targets under the current `decentraplanet` organization and accepts platform-specific overrides only for a confirmed future project move.
- `corepack yarn sentry:release:create-properties` is the cross-platform release setup command for generating the root, Android, and iOS Sentry properties files after `SENTRY_AUTH_TOKEN` is provided.
- `corepack yarn check:sentry-properties-generator` validates the cross-platform `scripts/createSentryProperties.mjs` generator without touching repo-level Sentry files: it checks missing-token/profile failures, `--root` temp output, distinct root/Android/iOS project generation, platform-specific overrides, and secret-safe command output.
- `corepack yarn check:sentry-project-routing-guard` and `corepack yarn sentry:project-routing:audit` verify 11 current DSN routes without retaining or printing DSN values. Non-production Android/iOS route to `goldwallet-dev-android` / `goldwallet-dev-ios`; production routes to `goldwallet-prod-android` / `goldwallet`.
- `corepack yarn sentry:release:validation:handoff:dry-run` renders the Sentry source-map prerequisite sequence without printing token assignments.
- `corepack yarn sentry:release:validation:handoff` validates the generator, optionally refreshes Android release APK evidence with Sentry auto-upload disabled, refreshes the Sentry RN bundle task compatibility summary, generates the three Sentry properties files from `SENTRY_AUTH_TOKEN`, refreshes the Sentry prerequisite summary, and validates aggregate release-services summaries.
- `corepack yarn sentry:release:validation:preflight` runs the non-secret readiness path with `--preflight-only --skip-android-release` when current Android release evidence is already fresh and `SENTRY_AUTH_TOKEN` is unavailable. It validates Sentry-specific prerequisites and may accept a controlled `android-smoke-dev-release-no-network` blocker proof for a structurally valid `not ready` summary, but it does not run the final aggregate `release-services:check-summaries` gate and does not claim release upload readiness.
- `corepack yarn sentry:release:validation:preflight:dry-run` renders that non-secret preflight path without printing token assignments.
- `corepack yarn check:sentry-release-validation-handoff-guard` validates the handoff command order, `--skip-android-release` behavior, required-env handling, and secret-safe command rendering.
- `corepack yarn sentry:release:credential-plan` writes `local-docs/sentry-release-credential-plan.txt`, listing only file paths, env variable names, command names, package versions, and current release evidence states for Sentry release credential handoff.
- `corepack yarn sentry:release:credential-plan:check` validates that the local credential plan keeps source-map upload unclaimed, does not print token, DSN, or `auth.token` values, and cannot omit Android release/full-smoke/create-wallet blockers, the classified no-network Electrum blocker, or iOS macOS/Podfile blockers.
- `corepack yarn sentry:release:prereq-check-summary` validates the generated local prerequisite summary, including per-file readiness counts and generator coverage.
- `corepack yarn sentry:android-warning:audit` verifies that Sentry Gradle/source-map wiring remains tracked before any Sentry cleanup branch and writes `local-docs/sentry-android-warning-summary.txt`.
- `corepack yarn sentry:android-warning:check-summary` validates the generated local Android warning summary.
- `corepack yarn sentry:rn-bundle-task-compat:audit` records the static compatibility status between Sentry `8.21.0` bundle-task extraction and the RN `0.86.2` `BundleHermesCTask` property model.
- `corepack yarn sentry:rn-bundle-task-compat:check-summary` validates the generated local compatibility summary.
- The active RN `0.86.2` Android warning audit no longer reports Sentry `execResult`; Sentry still needs release/source-map validation with local credentials before claiming the SDK/tooling change complete for release artifacts.
- The latest npm releases checked for the Sentry release path on 2026-07-31 are `@sentry/react-native@8.21.0` and direct `@sentry/cli@3.6.2`. The SDK is current on the RN `0.86.2` baseline, and the release CLI is pinned explicitly as dev tooling. The guarded Sentry owner path resolves `undici@8.9.0`, the latest version compatible with Node `24.16.0`.
- The Sentry prerequisite audit now records live latest metadata for both packages and fails stale "current" claims when installed and latest versions differ.
- `@sentry/react-native@8.21.0` declares `react-native >=0.65.0`, but release artifact behavior still has to be proven instead of patching `node_modules` or disabling source-map upload.
- Android release APK generation has now been proven locally for `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease` with Sentry auto-upload disabled; Sentry source-map upload remains explicitly not claimed until `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are available.
- Android release Gradle output on Sentry `8.21.0` is checked for `Could not extract bundle task arguments` after the repo-owned RN `0.86.2` bundle task args shim; final source-map upload validation still requires a credentialed upload run.
- Static compatibility evidence shows Sentry expects `jsIntermediateSourceMapsDir` as a `Directory`, while RN `0.86.2` exposes it on `BundleHermesCTask` as a `RegularFileProperty`; Sentry's fallback also expects an `args` property that the RN task does not expose. Do not patch `node_modules` or add unsupported dynamic task properties in `android/app/build.gradle`.
- The 2026-07-05 BEM-37.819 refresh updates current Android release build/manifest evidence for the Sentry package bump. Sentry release integration uses the direct root `@sentry/cli@3.6.0`, nested Sentry-owned CLI versions are absent, and the Sentry RN bundle task compatibility path is ready through the repo-owned legacy args shim.
- BEM-37.920 binds Sentry Android candidate evidence to the exact signed AAB before any Play handoff: it cleans prior generated outputs, forces automatic upload off, extracts the embedded AAB bundle, snapshots the fresh Gradle bundle/map, and writes a strict hash-addressed manifest under ignored `local-docs/sentry-android-candidates/<aab-sha256>/`. The local signing proof validates this path on the API 36 emulator. This does not claim credentialed Sentry upload, Play acceptance, iOS dSYM/source-map delivery, or production upload-key identity.
- BEM-37.941 proves the Android upload transport independently of production release state. `sentry:android-upload-canary:execute` validates the exact BEM-37.940 signed-AAB candidate, uploads its binary bundle plus debug-ID-linked source map to the fixed `goldwallet-dev-android` project under a deterministic canary release, waits for artifact-bundle processing, and validates the returned Bundle ID, project, release, dist, and both debug IDs. The ignored summary records only hashes and non-secret evidence. This proves Android dev transport, not production upload, real-event symbolication, iOS source-map/dSYM delivery, or macOS archive readiness.
- BEM-37.942 proves the actual Android Gradle finalizer path. `sentry:gradle-dev-upload-canary:execute` verifies the dev-project slug/ID through the API, pins ignored properties and the direct CLI project to that non-production target, removes inherited CLI endpoint overrides, assigns a deterministic release from app and Android build inputs, runs `assembleDevRelease`, and requires a processed artifact bundle plus one shared Metro/Hermes debug ID. The runner invalidates stale executed evidence before preflight, redacts the credential, and rejects Authorization headers in its local log. Production release upload, real-event symbolication, and iOS delivery remain separate acceptance gates.
- BEM-37.944 closes the Android non-production symbolication gate. The canary excludes Sentry's generated `android/app/src/main/assets/modules.json` from release identity, repeats the real Gradle upload under a stable isolated release, sends a synthetic no-wallet-data event with the uploaded debug ID, and requires Sentry's processed stack to replace the generated bundle frame with the exact expected `App.tsx` line. This does not validate production routing or iOS delivery.
- BEM-37.945 adds `node scripts/runSentryProductionPreflight.mjs`, a no-upload production handoff gate. It replaces inherited routing overrides with the fixed production organization/projects, verifies their live ID/status/release access through the authenticated Sentry CLI without printing the response, forces prod Android evidence plus `SENTRY_DISABLE_AUTO_UPLOAD=true`, and accepts only a ready handoff or the explicit Windows iOS/macOS blocker.
- BEM-37.954 makes that production gate fail closed on stale Android release build evidence. The prerequisite summary now exposes the already-computed aggregate release-evidence readiness, the handoff propagates it, and the production checker requires it before an iOS-only blocker can be accepted. A current release fingerprint for all required variants plus valid APK manifests is therefore mandatory even when release smoke evidence itself is still valid.
- The 2026-06-17 BEM-37.742 prerequisite gate makes Sentry source-map readiness depend on iOS readiness as well: the summary reports static iOS files valid, 4 Sentry bundle/source-map phases, 3 Sentry dSYM upload phases, `ios/Podfile.lock` refresh required with 12 active drift issues, and macOS validation prerequisites not ready on this Windows host. Source-map/dSYM upload remains blocked by both missing local `SENTRY_AUTH_TOKEN` plus generated root/Android/iOS `sentry.properties` files and the required macOS/Xcode/CocoaPods Podfile/archive validation.

## 2026-07-31 Release Services Refresh

- BEM-37.935 refreshes the Sentry CLI transport to `undici@8.9.0` while keeping the already-current SDK `8.21.0` and CLI `3.6.2` fixed.
- The properties readiness audit accepts persisted non-empty org/project overrides when a later shell does not inherit those variables. It still rejects a wrong URL, blank org/project/token, missing keys, and conflicts with explicitly supplied env values.
- All three ignored Sentry properties files pass readiness checks without printing values. `SENTRY_AUTH_TOKEN` is not present in the current shell, so credentialed source-map upload remains explicitly unclaimed.
- Android `dev`, `stage`, `prod`, and `beta` release APKs, JS bundles, source maps, manifests, secure-storage packaging, and retired App Center checks pass with automatic upload disabled.
- Fresh signed `prodRelease` emulator validation passes onboarding, dashboard actions, QR, tabs, Terms WebView, standard-wallet creation, restart/PIN persistence, and the default 3-key vault public-key flow with no fatal/runtime findings.
- iOS static readiness passes, but dSYM/source-map delivery and archive validation remain unclaimed until macOS/Xcode/CocoaPods refreshes the 12 active `ios/Podfile.lock` drifts.
- The isolated Android canary upload passes in `goldwallet-dev-android` with artifact bundle `29acab0d-9d11-5c7f-a9f4-e05207f96e2d`; a repeated execution confirms the same files are already present and fully processed. Production upload and event symbolication remain unclaimed.
- The real `devRelease` Gradle upload path passes with artifact bundle `4e574f79-0167-512b-b664-5402b2681b40` and shared bundle/source-map debug ID `e8c40da4-a7b7-40ea-9647-0f8dff19ab2d`. Sentry CLI logging is reduced to `info`, eliminating credential-prefix output from the final proof log.
- The stable Gradle canary release `goldwallet-android-gradle-canary@6.5.1+14-3d695d3fe994` passes after excluding Sentry's generated module inventory from identity and declaring the source-map parser directly. A synthetic event in `goldwallet-dev-android` resolves `index.android.bundle:1:3366532` to `App.tsx:41`; the processed event is bound to the expected ID, project, distribution, and canary tags and contains no identifying user or wallet data. Production and iOS event delivery remain unclaimed.

## 2026-06-17 Preflight Refresh

- `npm view @sentry/react-native version peerDependencies dependencies --json` reports `latest` as `8.17.1`, matching the installed SDK.
- `npm view @sentry/cli version dist-tags --json` reports `latest` as `3.6.0`, matching the direct release CLI package.
- `sentry:release:validation:preflight` passes without rendering secret values and keeps credentialed upload explicitly unclaimed while using the existing current Android release/smoke evidence.
- `sentry:release:prereq-audit` reports Android release summary, APK manifests, release smoke, and release create-wallet smoke as valid/current after the BEM-37.735 release-input fingerprint refresh.
- `sentry:release:prereq-audit` now also reports iOS static readiness, iOS Sentry source-map/dSYM phase counts, active `ios/Podfile.lock` drift, and macOS validation prerequisites in the same Sentry prerequisite summary.
- `sentry:rn-bundle-task-compat:audit` reports `Sentry RN bundle task compatibility ready: yes` through the repo-owned legacy args shim.
- `sentry:release:credential-plan` reports `SENTRY_AUTH_TOKEN available in current shell: no`, three missing properties files, zero invalid properties files, and `Sentry release upload validation: not claimed`.

## 2026-06-23 Preflight Refresh

- `npm view @sentry/react-native version dist-tags peerDependencies dependencies engines --json` reports `latest` as `8.17.1`, matching the installed SDK.
- `npm view @sentry/cli version dist-tags dependencies engines --json` reports `latest` as `3.6.0`, matching the direct release CLI package.
- `check:sentry-credential-handoff-guard` now checks the current package-script preflight evidence line, `sentry:release:validation:preflight:dry-run`, instead of the older manual `handoff:dry-run --skip-android-release` spelling.
- `sentry:release:validation:preflight` passes without rendering secret values and keeps credentialed upload explicitly unclaimed while using the current Android release, release-smoke, and release create-wallet evidence.
- `sentry:release:prereq-audit` reports Android release summary, APK manifests, release smoke, release create-wallet smoke, and Sentry RN bundle-task compatibility as valid/current.
- `sentry:release:prereq-audit` still reports `Release source-map prerequisites: not ready` because `SENTRY_AUTH_TOKEN` is absent, all three Sentry properties files are missing, iOS macOS archive validation is not ready, and `ios/Podfile.lock` has 12 drift issues.
- `sentry:release:credential-plan` reports `SENTRY_AUTH_TOKEN available in current shell: no`, three missing properties files, zero invalid properties files, Android release evidence ready, Android release smoke evidence ready, and `Sentry release upload validation: not claimed`.

## 2026-06-24 Preflight Refresh

- `npm view @sentry/react-native version time repository.url dist-tags peerDependencies dependencies engines --json` reports `latest` as `8.17.1`, matching the installed SDK.
- `npm view @sentry/cli version time repository.url dist-tags peerDependencies dependencies engines --json` reports `latest` as `3.6.0`, matching the direct release CLI package.
- `sentry:android-warning:audit` reports Sentry Android warning wiring valid, no active Sentry `execResult` warning on the RN `0.86.2` baseline, `0` readiness issues, and `0` wiring errors.
- `sentry:rn-bundle-task-compat:audit` reports `Sentry RN bundle task compatibility ready: yes` through the repo-owned legacy args shim for RN `0.86.2`.
- `android:dev:release:verify-local` refreshed `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease` evidence with JDK 17 and `SENTRY_DISABLE_AUTO_UPLOAD=true`; the second run passed after the known transient Windows RN autolinking `cmd` failure on the first attempt.
- Full `android:dev:release:smoke:embedded` and `android:dev:release:create-wallet-smoke:embedded` remain blocked before dashboard/create-wallet proof because the dev/testnet release app reaches the `No network` screen after onboarding.
- A fresh reduced release smoke with artifact base `android-smoke-dev-release-no-network` validated signed `devRelease` install, launch, onboarding, expected `No network` UI, and no fatal/runtime logcat findings on `emulator-5554`.
- `sentry:release:validation:preflight` now passes without rendering secret values and keeps credentialed upload explicitly unclaimed while using current Android release build evidence plus the controlled no-network blocker proof.
- `sentry:release:prereq-audit` still reports `Release source-map prerequisites: not ready` because `SENTRY_AUTH_TOKEN` is absent, all three Sentry properties files are missing, full Android release smoke/create-wallet proof is blocked by `No network`, iOS macOS archive validation is not ready, and `ios/Podfile.lock` has 12 drift issues.
- `android:dev:release:network-blocker:audit` and `android:dev:release:network-blocker:check-summary` classify the current release-smoke blocker as `blocked-by-electrum-certificate-expired` only when the failed release-smoke log contains `SSLHandshakeException` plus `CertificateExpiredException` and the reduced no-network release-smoke proof is current.
- `sentry:release:prereq-audit` now embeds `Android release network blocker summary present/valid/outcome/errors` and `Sentry release network blocker classified`, so the no-network preflight fallback is tied to the expired Electrum TLS certificate instead of a generic connection screen.
- `sentry:release:validation:preflight` passes in the current not-ready state only after `android:dev:release:network-blocker:check-summary` and the Sentry prerequisite summary both classify the release blocker as `blocked-by-electrum-certificate-expired`.
- `release-services:check-summaries` remains intentionally stricter than Sentry preflight and should stay red until full release-smoke and release create-wallet evidence can be regenerated.

## 2026-07-10 Preflight Refresh

- `sentry:release:validation:preflight` was rerun after the latest Android release build evidence, controlled Android release no-network blocker evidence, and iOS static validation evidence changed.
- The Sentry release prerequisite summary reports `@sentry/react-native@8.18.0` and direct `@sentry/cli@3.6.0` as current latest checked targets, with the direct CLI binary present and executable.
- `sentry:android-warning:audit` reports Sentry Android warning wiring valid, `0` readiness issues, and no active Sentry `execResult` warning on the RN `0.86.2` baseline.
- `sentry:rn-bundle-task-compat:audit` reports `Sentry RN bundle task compatibility ready: yes` through the repo-owned legacy args shim for RN `0.86.2`.
- Android release build and APK manifest evidence is current for `dev`, `stage`, `prod`, and `beta`, but Sentry release smoke evidence remains not ready because the full dashboard and release create-wallet proofs are blocked by the dev/testnet `No network` state.
- The reduced signed `devRelease` no-network smoke proof is valid and the network blocker summary is classified as `blocked-by-electrum-certificate-expired`, so the Sentry preflight may pass only as a controlled `not ready` state.
- iOS static readiness remains valid, but iOS macOS archive validation is not ready on this Windows host; `ios/Podfile.lock` still has active drift issues, including `RNScreens 3.6.0` versus package `4.26.2`.
- `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, and `SENTRY_AUTH_TOKEN` are missing, so source-map/dSYM upload validation remains explicitly not claimed.

## 2026-07-11 Preflight Refresh

- `sentry:release:validation:preflight` was rerun after the latest Android release validation refresh and iOS static handoff refresh.
- Latest Android release prerequisite evidence comes from `BEM-37.857`: `devRelease`, `stageRelease`, `prodRelease`, and `betaRelease` build/manifest/source-map evidence is current, and the signed `devRelease` no-network proof is classified as `blocked-by-electrum-certificate-expired`.
- The Sentry release prerequisite summary reports `@sentry/react-native@8.18.0` and direct `@sentry/cli@3.6.0` as current latest checked targets, with a single direct `@sentry/cli` package instance and no nested Sentry-owned CLI versions.
- `sentry:android-warning:audit` reports Sentry Android warning wiring valid, `0` readiness issues, `0` wiring errors, and no active Sentry `execResult` warning on the RN `0.86.2` baseline.
- `sentry:rn-bundle-task-compat:audit` reports `Sentry RN bundle task compatibility ready: yes` through the repo-owned legacy args shim for RN `0.86.2`.
- Android release build and APK manifest evidence remains current for `dev`, `stage`, `prod`, and `beta`, but full release smoke and release create-wallet proof remain not ready because the dev/testnet release app is blocked by the classified Electrum TLS certificate expiry.
- The reduced signed `devRelease` no-network smoke proof is valid and the network blocker summary is classified as `blocked-by-electrum-certificate-expired`, so the Sentry preflight may pass only as a controlled `not ready` state.
- iOS static readiness was refreshed in `BEM-37.858` and remains valid, but iOS macOS archive validation is not ready on this Windows host; `ios/Podfile.lock` still has 12 active drift issues, including `RNSentry 3.1.0` versus `@sentry/react-native 8.18.0`.
- `BEM-37.859` reran the aggregate release-services handoff with `--skip-android-release`, refreshed the Sentry prerequisite and bundle-task compatibility summaries, and kept release upload validation explicitly not claimed while the controlled Electrum blocker is active.
- `sentry:release:credential-plan` reports `SENTRY_AUTH_TOKEN available in current shell: no`, `Missing properties files: 3`, current Android release evidence state, controlled no-network blocker state, release create-wallet state, iOS macOS/Podfile blocker state, and `Sentry release upload validation: not claimed`; source-map/dSYM upload remains explicitly unclaimed until the token, root/Android/iOS properties files, current Android release/full-smoke/create-wallet proof, and macOS iOS validation are available.

## 2026-07-21 Release Cohort Refresh

- Live npm metadata reports `@sentry/react-native@8.19.0` and direct `@sentry/cli@3.6.1` as the latest stable targets; both are installed exactly.
- The prerequisite audit records one direct CLI `3.6.1`, verifies exact agreement between discovered package instances and aggregate/nested version lines, and executes the same Node resolver expression used by `sentry.gradle.kts` to prove Android resolves the root package.
- JDK 17 Android `devDebug`, all four release variants, JavaScript bundles, source maps, APK manifests, and controlled signed `devRelease` no-network emulator smoke pass on the RN `0.86.2` baseline.
- Static iOS readiness passes, but this Windows host cannot run CocoaPods, Xcode archive, simulator runtime, dSYM upload, or source-map upload validation. `ios/Podfile.lock` retains 12 guarded drift issues, including stale `RNSentry 3.1.0`.
- Credentialed upload remains explicitly unclaimed because `SENTRY_AUTH_TOKEN` and the root, Android, and iOS `sentry.properties` files are unavailable.

## Credential Handoff Gate

Credential owner input required before claiming release source-map validation:

- provide `SENTRY_AUTH_TOKEN` in the local shell or CI secret store, or use an authenticated official `sentry` CLI through `corepack yarn sentry:release:validation:managed:preflight`;
- select `SENTRY_RELEASE_PROFILE=nonprod` or `SENTRY_RELEASE_PROFILE=prod`; use `SENTRY_ORG`, `SENTRY_ANDROID_PROJECT`, and `SENTRY_IOS_PROJECT` overrides only after a confirmed Sentry project move;
- generate local-only `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties` with `corepack yarn sentry:release:create-properties`;
- keep generated Sentry properties files and token values out of commits, screenshots, and handoff artifacts.
- the managed command captures `sentry auth token`, passes it only in the child-process environment, prepares the three ignored properties files, and never prints the credential value;

Evidence that must be attached to the credential handoff:

- current `check:sentry-properties-generator` output;
- current `sentry:release:credential-plan` and `sentry:release:credential-plan:check` output;
- current `sentry:release:validation:preflight:dry-run` output;
- current `sentry:release:prereq-audit` and `sentry:release:prereq-check-summary` output after credentials are generated;
- current Android release build, manifest, and release-smoke evidence;
- current iOS release-readiness and macOS-prerequisite summaries, including whether `ios/Podfile.lock` drift is zero;
- current `sentry:android-warning:audit` and `sentry:android-warning:check-summary` output;
- current `sentry:rn-bundle-task-compat:audit` and `sentry:rn-bundle-task-compat:check-summary` output;
- current release-services aggregate summary;
- iOS macOS/Xcode/CocoaPods blocker or validation result.

Do not run or claim production Sentry release upload validation until `SENTRY_AUTH_TOKEN` is present and the three generated properties files are ready. The isolated Android dev canary is a separate transport-only proof and must keep production upload and event symbolication unclaimed.
Do not commit `sentry.properties`, `android/sentry.properties`, `ios/sentry.properties`, or token-derived output.
Do not print `SENTRY_AUTH_TOKEN` or generated `auth.token` values in handoff artifacts.
Do not claim iOS dSYM/source-map upload validation unless it ran on macOS/Xcode or a real CI equivalent.

## Source Map Upload Acceptance Gate

- run `corepack yarn sentry:release:validation:handoff` with `SENTRY_AUTH_TOKEN` available, or `corepack yarn sentry:release:validation:managed` with an authenticated official CLI;
- keep `SENTRY_DISABLE_AUTO_UPLOAD=true` only for Android release evidence refresh, not for the final upload validation claim;
- prove Android release artifact generation still covers `dev`, `stage`, `prod`, and `beta` variants;
- prove the Sentry release prerequisite summary reports `Release source-map prerequisites: ready`;
- prove Android release Gradle output still generates source maps without `Could not extract bundle task arguments`, and then run the credentialed upload path;
- prove iOS macOS validation prerequisites are ready, `ios/Podfile.lock` drift is zero, and the iOS source-map/dSYM phases remain present before claiming iOS symbol upload readiness;
- leave release source-map upload as `not claimed` when credentials are missing.
- require current signed-AAB candidate evidence whose embedded/generated bundle hashes match and whose manifest release/dist match the verified AAB metadata before attempting credentialed Android source-map upload.
- use `corepack yarn sentry:android-upload-canary:execute` only for the fixed non-production transport proof; its success cannot satisfy production-event symbolication or iOS acceptance criteria.

## Why This Needs A Dedicated Branch

- Sentry touches release bundling, source maps, dSYM upload, Crashlytics-adjacent observability, and build scripts.
- A warning-only fix could accidentally disable source-map upload or symbolication.
- The previous warning appeared during Gradle configuration, not from failed source-map upload execution.
- Newer checked Sentry lines still need proof against this React Native app and the current Android/iOS release setup.

## Proposed Branch

Branch: `feature/bem-sentry-release-source-map-upgrade`

Scope:

- Keep the newest compatible `@sentry/react-native` line for the current React Native `0.86.2` baseline.
- Validate that Android builds and runtime smoke continue to work after any future Sentry package/runtime change.
- Preserve Android source-map generation and upload behavior for release variants.
- Preserve iOS dSYM and source-map upload behavior.
- Keep Sentry DSN/environment wiring through the existing `react-native-config` setup.
- Document any required Sentry auth/token environment variables instead of guessing secrets.

## Validation Plan

- `corepack yarn check:rn-nodeify-shims`.
- `corepack yarn check:sentry-usage-guard`.
- `corepack yarn check:sentry-usage-scope`.
- `corepack yarn check:sentry-release-integration-guard`.
- `corepack yarn check:sentry-release-integration`.
- `corepack yarn sentry:release:prereq-audit`.
- `corepack yarn sentry:release:prereq-check-summary`.
- `corepack yarn check:sentry-release-prereq-summary-guard`.
- `corepack yarn check:sentry-android-release-evidence-variant-guard`.
- `corepack yarn check:sentry-properties-generator`.
- `corepack yarn check:sentry-release-validation-handoff-guard`.
- `corepack yarn check:sentry-credential-handoff-guard`.
- `corepack yarn check:sentry-release-credential-plan-guard`.
- `corepack yarn sentry:release:credential-plan`.
- `corepack yarn sentry:release:credential-plan:check`.
- `corepack yarn sentry:release:validation:preflight:dry-run`.
- `corepack yarn sentry:release:validation:preflight`.
- `corepack yarn sentry:release:validation:handoff:dry-run`.
- `corepack yarn sentry:android-warning:audit`.
- `corepack yarn sentry:android-warning:check-summary`.
- `corepack yarn sentry:rn-bundle-task-compat:audit`.
- `corepack yarn sentry:rn-bundle-task-compat:check-summary`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:release:validate-local`.
- `corepack yarn android:dev:release:check-summary`.
- `corepack yarn release-services:check-summaries`.
- `corepack yarn typescript:check`.
- `git diff --check`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:assemble`.
- `JAVA_HOME=D:\tmp\jdks\temurin17\jdk-17.0.19+10 corepack yarn android:dev:audit-warnings`.
- Android emulator smoke after Metro `--reset-cache`.
- Android release bundle/build check for at least one non-production flavor.
- Confirm whether `SENTRY_AUTH_TOKEN` and generated `sentry.properties`, `android/sentry.properties`, and `ios/sentry.properties` files are available locally.
- If the release target changes, set `SENTRY_ORG`, `SENTRY_ANDROID_PROJECT`, and `SENTRY_IOS_PROJECT` before generating properties instead of editing committed files.
- iOS release validation remains required on a Mac runner or device before calling the Sentry upgrade complete.

## Acceptance Criteria

- App still starts on Android after the Sentry change.
- No AndroidRuntime crash or React Native runtime error appears in logcat during smoke.
- Release source-map behavior is either proven working or explicitly blocked by missing local Sentry credentials.
- iOS symbol upload path is not removed or silently disabled.
- The remaining Sentry Gradle warning status is re-audited after the upgrade.
