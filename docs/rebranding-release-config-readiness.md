# Rebranding Release Config Readiness

Scope: `BEM-37.335`, rebranding and explorer/release-config preparation.

Checked on 2026-06-03 from the current `upgrade/wallet-modernization` baseline. This document does not change runtime behavior. It records the app identity, release-service, store metadata, and explorer surfaces that must move together when the GoldWallet rebrand starts.

## Current Identity Surface

Android:

| Surface | Current state |
| --- | --- |
| Gradle namespace | `io.goldwallet.wallet` |
| Product flavors | `dev`, `stage`, `prod`, `beta` |
| Application IDs | `io.goldwallet.wallet.dev`, `io.goldwallet.wallet.stage`, `io.goldwallet.wallet`, `io.goldwallet.wallet.beta` |
| Native app names | `GoldWallet`, `GoldWallet Dev`, `GoldWallet Stage`, `GoldWallet Beta` |
| Deep link scheme | `goldwallet` in `android/app/src/main/AndroidManifest.xml` |
| Firebase config files | `android/app/src/dev/google-services.json`, `stage`, `prod`, `beta` |
| Build config package | `io.goldwallet.wallet` |

iOS:

| Surface | Current state |
| --- | --- |
| Project/workspace | `GoldWallet.xcodeproj`, `GoldWallet.xcworkspace` |
| Schemes | `GoldWallet`, `GoldWallet Dev`, `GoldWallet Stage`, `GoldWallet Beta`, debug and release variants |
| Bundle identifiers | `com.minebest.goldwalletbtcv`, `.dev`, `.stage`, `.beta` |
| Display names | `GoldWallet`, `GoldWallet Dev`, `GoldWallet Stage`; beta uses `$(PRODUCT_NAME)` |
| Deep link schemes | `goldwallet`, `lapp` |
| Firebase plist files | `GoogleService-Info.plist`, `GoogleService-Info-dev.plist`, `GoogleService-Info-prod.plist`, `GoogleService-Info-stage.plist` |
| CodePush placeholder | `$(CODEPUSH_DEPLOYMENT_KEY_IOS)` in production, dev, and stage plists |

JavaScript/runtime:

| Surface | Current state |
| --- | --- |
| Package name | `goldwallet` |
| Runtime config | `src/config/index.ts` reads `APP_ID`, `APPLICATION_NAME`, `EXPLORER_URL`, `SENTRY_DSN_*`, and CodePush keys through `react-native-config` |
| Coin/unit copy | BTCV strings are used in wallet model, dashboard, send/filter screens, and terms content |
| Brand assets | `src/assets/images/bv017LogoGoldWalletRgbV3HorizontalBlack.png`, `bv017LogoGoldWalletRgbV3VerticalBlack.png` |
| About/rating links | GitHub and rating copy still reference GoldWallet/BitcoinVault surfaces |

Store metadata:

| Surface | Current state |
| --- | --- |
| iOS Fastlane names | localized `name.txt` files reference `GoldWallet - Bitcoin wallet` or equivalent |
| iOS Fastlane privacy URLs | localized `privacy_url.txt` files point to `goldwallet.io` |
| iOS Fastlane support URLs | localized `support_url.txt` files point to GitHub GoldWallet issues |
| Copyright metadata | `2019 GoldWallet Services S.R.L.` |

## Env And Explorer Surface

The following env files are present and must be updated as one release-config set if app identity, explorer routing, or network branding changes:

- `.env.dev.testnet`
- `.env.stage.mainnet`
- `.env.prod.mainnet`
- `.env.beta.testnet`
- `.env.beta.mainnet`
- `.env.testnet`
- `.env.test`

Observed key groups without printing secret values:

- Required app identity keys: `APP_ID`, `APPLICATION_NAME`, `ENVIRONMENT`, `BTCV_NETWORK`.
- Required network/explorer keys: `HOSTS`, `PORT`, `PROTOCOL`, `ELECTRUM_X_PROTOCOL_VERSION`, `EXPLORER_URL`.
- Release-service keys: `SENTRY_DSN_IOS`, `SENTRY_DSN_ANDROID`, optional `CODEPUSH_ENABLED`, `CODEPUSH_DEPLOYMENT_KEY_IOS`, `CODEPUSH_DEPLOYMENT_KEY_ANDROID`.
- Beta env files intentionally do not currently carry CodePush deployment keys; do not add placeholder values unless beta OTA strategy is confirmed.

Explorer and Electrum changes should not be treated as visual rebrand only. `EXPLORER_URL`, Electrum hosts, network name, QR/address validation, terms copy, and transaction links need a separate validation pass before the app can be claimed rebranded.

## Rebranding Decision Points

These decisions must be made before implementation:

1. Final public app name and per-environment names.
2. Whether package IDs and bundle IDs remain compatible with existing store listings or move to new app identities.
3. Whether the deep-link scheme stays `goldwallet` for backward compatibility or gains a new scheme while keeping legacy handling.
4. Whether BTCV remains the only visible asset/unit or the app introduces ELCASH/BTCV split wording.
5. Which explorers should be used per network and environment.
6. Whether CodePush remains disabled/gated or is removed/migrated before the rebrand ships.
7. Whether Firebase apps, Sentry projects, and store metadata are reused or recreated under the new brand.

## Implementation Guardrails

- Do not rename native packages, bundle IDs, or schemes in the same branch as dependency updates.
- Do not change `APP_ID` without matching Android `applicationId`, Firebase `google-services.json`, iOS bundle identifier, and store metadata.
- Do not change `APPLICATION_NAME` without checking Android strings, iOS display names, localized app copy, assets, fastlane metadata, and screenshots.
- Do not change `EXPLORER_URL` or Electrum hosts without at least startup smoke, wallet list smoke, and link/address-flow checks.
- Do not remove `goldwallet` deep-link handling until migration behavior for existing users is decided.
- Do not print Sentry DSNs, CodePush deployment keys, or Firebase app IDs in logs/docs.
- Keep beta behavior explicit: beta iOS currently has no separate Firebase plist file in the captured scheme pre-actions, and beta env files do not require CodePush keys.

## Validation Path

Audit/docs-only changes:

```powershell
corepack yarn android:dev:check-light
corepack yarn check:release-services-summary-guard
corepack yarn release-services:check-summaries
corepack yarn check:android-env-config-files
corepack yarn check:ios-scheme-config
corepack yarn typescript:check
corepack yarn check:modernization-log-ids
corepack yarn lint:baseline:audit
git diff --check
```

Implementation branch, Android:

```powershell
corepack yarn android:dev:check-light
$env:JAVA_HOME='D:\tmp\jdks\temurin17\jdk-17.0.19+10'
corepack yarn android:dev:assemble
corepack yarn android:dev:smoke:embedded
```

Implementation branch, release services:

```powershell
corepack yarn firebase:release-services:audit
corepack yarn firebase:release-services:check-summary
corepack yarn sentry:release:prereq-audit
corepack yarn sentry:release:prereq-check-summary
corepack yarn codepush:release:path-audit
corepack yarn codepush:release:path-check-summary
corepack yarn release-services:check-summaries
```

iOS implementation validation remains blocked on this Windows machine until macOS/Xcode refreshes `ios/Podfile.lock` and builds at least one affected scheme.

## Next Branches

1. Rebrand implementation spike: update app names/assets/copy only where product decisions are confirmed.
2. Explorer/env alignment: validate explorer URLs, Electrum hosts, and transaction link behavior per network.
3. Store metadata refresh: update Fastlane metadata, privacy/support URLs, screenshots, and release notes.
4. iOS/macOS release validation: refresh Pods and validate schemes after bundle/display-name changes.
