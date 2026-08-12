# React Native 0.87 Readiness

Checked: 2026-08-11

## Target State

- Current stable target: `react-native@0.87.0`
- Previous probe target: `react-native@0.87.0-rc.4`
- Current React peer: `^19.2.3`
- Required Node line: `^22.13.0 || ^24.3.0 || >=26.0.0`
- Required Android cohort: AGP `9.2.1`, Gradle `9.4.1`, Kotlin `2.2.10`
- Required temporary AGP compatibility flags: `android.builtInKotlin=false`, `android.newDsl=false`
- Production upgrade decision: Android acceptance passed; macOS iOS validation remains required

React Native `0.87.0` is the npm stable `latest` release observed on 2026-08-11. The branch upgrades the complete RN-owned package cohort together and keeps React plus `react-test-renderer` on `19.2.3`, matching the RN renderer contract. The production cohort contains no prerelease RN package.

## Stable Candidate Scope

- The seven RN-owned runtime/tooling packages are aligned to `0.87.0`.
- Android uses AGP `9.2.1`, Gradle `9.4.1`, Kotlin `2.2.10`, build tools `37.0.0`, compile SDK `37`, target SDK `36`, and JDK `17`.
- AsyncStorage explicitly resolves KSP `2.2.10-2.0.2`, matching the effective AGP 9.2 Kotlin compiler and eliminating the KSP/compiler mismatch warning.
- `edgeToEdgeEnabled=true` is enabled and the removed Android StatusBar color/translucency props are no longer used.
- The stable Android acceptance gates passed. iOS static validation passed, but Podfile refresh and runtime/archive validation remain a macOS handoff.

## Stable Acceptance Results

- Frozen Yarn installation passed on Node `24.16.0`; the production lockfile contains no RN prerelease package.
- TypeScript, all `14` unit suites (`68` tests), the focused storage/network suite, rn-nodeify shims, and the controlled lint baseline passed.
- JDK 17 `devDebug` assembly passed against the RN `0.87.0` New Architecture and Hermes baseline.
- The complete `dev`, `stage`, `prod`, and `beta` release matrix passed. APK manifest, secure-storage packaging, retired App Center exclusion, embedded bundle, and source-map checks passed for every variant.
- The signed `prodRelease` APK passed onboarding, dashboard, all four tabs, Settings Terms WebView, CameraKit QR open/close, standard wallet creation, 3-key vault entry, watch-only import, incorrect/correct PIN behavior, and persistence after restart on `emulator-5554` without Metro or fatal runtime findings.
- A historical production APK was installed first and populated with encrypted legacy storage. The RN `0.87.0` candidate installed over it with `adb install -r`, migrated PIN, transaction password, encrypted flag, and wallet data into Keychain, removed the migrated legacy values, and reopened the wallet after restart. The evidence is bound to the candidate APK and migration-source SHA-256 values.
- The full `rn:baseline:preflight` passed after refreshing all release-service and iOS static artifacts.
- The checksum-pinned Semgrep `1.170.0` whole-repository scan did not complete within the local `45` minute limit and produced no SARIF, so a full-scan pass is not claimed. The fail-closed GitHub job timeout was raised from `30` to `90` minutes so CI has a viable completion window while still requiring scanner success and SARIF baseline validation. A bounded rerun with the same security packs and suppression-disabled flags scanned all changed code/config files plus every reviewed baseline-owner file (`62` files, `164` effective rules); its `23` findings match the reviewed baseline exactly with `0` stale and `0` unreviewed entries. Actual full-scan duration and success remain to be confirmed on the Ubuntu CI runner.
- The `dev` and `devRelease` full smoke paths remain externally blocked by the expired certificate at `electrumx.testnet.btcv.stage.rnd.land:443`. Their no-network smoke paths pass and classify the blocker without treating reduced proof as full runtime acceptance.
- iOS static validation passes for eight schemes, four Sentry bundle/source-map phases, three Sentry dSYM phases, and four remote-notification plists. `ios/Podfile.lock` has `13` dependency-drift entries and must be refreshed and validated on macOS with Xcode `26.2+` and CocoaPods; no iOS runtime/archive claim is made from Windows.

## RC4 Probe Results

An isolated short-path worktree replaced the complete React Native package cohort with `0.87.0-rc.4` without changing production dependencies.

- Package installation and the existing postinstall shims passed on Node `24.16.0`.
- React Native CLI config and TypeScript passed without additional application-code changes.
- All `13` unit suites and `60` unit tests passed.
- The complete focused storage/network suite passed, including secure storage and offline wallet-core tests.
- A production Android Metro bundle completed on Metro `0.87.0`. The existing non-fatal private `ReactNativeFeatureFlags` export fallback warning remains.
- The RC continues to require AGP `9.2.1`, Gradle `9.4.1`, and Kotlin `2.2.0`.
- With AGP 9 defaults, `@react-native-async-storage/async-storage@3.1.1` fails while applying `kotlin-android`, then reports no visible `compileSdk` model.
- Android's documented temporary AGP 9 opt-out, `android.builtInKotlin=false` together with `android.newDsl=false`, preserves AsyncStorage's legacy Kotlin/KSP path and allows `assembleDevDebug` to complete. The build passed all `795` executed Gradle tasks and produced the embedded dev APK.
- A long Windows worktree path exceeded Ninja's 260-character object-path limit in Gesture Handler. Re-running the same checkout from the physical short path `D:\x962` removed that environment-only failure.
- The RC4 APK installed and launched on `emulator-5554`. Automated onboarding passed Terms, PIN creation, and transaction-password creation without a fatal React Native or Android runtime crash.
- Full dashboard, navigation, QR, and Terms WebView smoke could not complete because the external dev/testnet Electrum certificate expired on 2026-06-23. The app reached the expected `No network` state while the onboarding email screen remained underneath the network overlay.

## Compatibility Decision

AsyncStorage `3.1.1` and its current upstream `main` still apply `kotlin-android`, declare an AGP `8.7.2` buildscript, and use KSP/Room for legacy-storage migration. Removing those pieces locally is not acceptable for a wallet that must preserve historical storage.

The two AGP flags are an official temporary migration bridge, not a permanent upstream fix. Android documents that both opt-outs are removed in AGP 10. The stable RN 0.87 branch uses them only as an explicit compatibility checkpoint while AsyncStorage migrates to built-in Kotlin and the new Android DSL.

Android acceptance is complete for this branch. Full iOS acceptance still requires Podfile refresh, simulator build, and archive validation on macOS; Windows static checks do not replace a macOS Xcode archive.

References:

- https://reactnative.dev/versions
- https://developer.android.com/build/migrate-to-built-in-kotlin
- https://github.com/react-native-async-storage/async-storage/blob/main/packages/async-storage/android/build.gradle

Validation:

```powershell
corepack yarn check:rn-087-readiness
corepack yarn check:rn-nodeify-shims
corepack yarn typescript:check
corepack yarn test:unit --runInBand
corepack yarn test:storage-network:focused
corepack yarn android:dev:release:verify-local
corepack yarn android:prod:release:smoke:verify
corepack yarn android:prod:release:create-wallet-smoke:embedded
corepack yarn android:prod:release:import-wallet-smoke:embedded
corepack yarn secure-storage:first-party-migration:verify
corepack yarn ios:static:verify
corepack yarn rn:baseline:preflight
node scripts/checkSemgrepSarifBaseline.mjs semgrep-selected.sarif .github/semgrep-baseline.json
```

The local selected-file SARIF is an ignored validation artifact and is not committed. The repository-wide pinned Semgrep workflow remains the authoritative full security scan.
