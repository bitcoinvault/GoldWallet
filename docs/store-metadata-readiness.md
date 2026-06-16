# Store Metadata Readiness

Scope: `BEM-37.337`, store metadata and rebranding preparation.

Checked on 2026-06-12 from the current `upgrade/wallet-modernization` baseline. This document records the store metadata surface that must be coordinated with any GoldWallet rebrand, explorer change, or release-config change.

## Current Store Metadata Surface

iOS Fastlane files are present under `ios/fastlane/metadata`.

Tracked localized metadata locales:

- `da`
- `en-US`
- `es-ES`
- `no`
- `pt-BR`
- `pt-PT`
- `ru`
- `sv`

Each tracked locale currently has:

- `name.txt`
- `subtitle.txt`
- `description.txt`
- `keywords.txt`
- `promotional_text.txt`
- `release_notes.txt`
- `privacy_url.txt`
- `support_url.txt`
- `marketing_url.txt`
- `apple_tv_privacy_policy.txt`

Root metadata files currently include:

- `app_icon.jpg`
- `watch_icon.jpg`
- `copyright.txt`
- primary and secondary category files
- review information
- trade representative contact information

Android Fastlane metadata baseline is present under `android/fastlane/metadata/android/en-US`.

Tracked Android metadata files:

- `title.txt`
- `short_description.txt`
- `full_description.txt`

The Android store-facing asset visible in source is `android/app/src/main/ic_launcher-playstore.png`. Play Console screenshots still need external/store-side verification.

## Pre-Rebrand Baseline

The current iOS metadata still records the old brand surface:

- Localized names include `GoldWallet`.
- Privacy URLs point to `goldwallet.io`.
- Support URLs point to `https://github.com/GoldWallet/GoldWallet/issues`.
- Copyright metadata references `GoldWallet Services S.R.L.`.

The current Android metadata baseline also records the old brand surface:

- Android title includes `GoldWallet`.
- Android short description records the current network wording: `Bitcoin & Lightning`.
- Android full description includes `GoldWallet`.
- Android listing metadata is tracked only for `en-US` in this repo baseline.

The Russian `name.txt` content appears mojibake when read from PowerShell in the current shell encoding. Do not rewrite localized metadata opportunistically; encoding and localization should be handled in a dedicated store metadata branch.

## Rebrand Coordination Rules

- Store metadata must move with rebrand, explorer/network wording, support/privacy URLs, screenshots, and legal/copyright decisions.
- Android `short_description.txt` is public network wording and must move with any BTCV/ELCASH/explorer messaging decision.
- Do not update native app names without updating store metadata names, subtitles, descriptions, keywords, support URL, privacy URL, screenshots, and release notes.
- Do not update store metadata before final app name, legal/copyright owner, privacy URL, and support channel are confirmed.
- Do not publish explorer or network wording changes unless the wallet runtime, env files, transaction links, terms copy, and screenshots agree.
- Do not assume Android metadata is fully covered by the repo baseline; Play Console screenshots and the live listing state must be checked separately.
- Do not include App Store Connect review credentials, demo passwords, or private contact values in docs or command output.

## Validation Path

Audit/docs/tooling only:

```powershell
corepack yarn check:store-metadata-readiness-guard
corepack yarn check:store-metadata-readiness
corepack yarn android:dev:check-light
corepack yarn check:rn-nodeify-shims
corepack yarn typescript:check
corepack yarn check:modernization-log-ids
corepack yarn lint:baseline:audit
git diff --check
```

Implementation branch:

- Refresh iOS localized metadata only after final copy and legal/support URLs are confirmed.
- Check Android Play Console listing, screenshots, and live listing copy before publishing store changes.
- Rebuild and smoke Android if app names, icons, package IDs, or runtime explorer/env values change.
- Validate iOS on macOS/Xcode if bundle identifiers, display names, icons, or schemes change.
