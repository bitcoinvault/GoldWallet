# Store Metadata Readiness

Scope: `BEM-37.337`, store metadata and rebranding preparation.

Checked on 2026-06-03 from the current `upgrade/wallet-modernization` baseline. This document records the store metadata surface that must be coordinated with any GoldWallet rebrand, explorer change, or release-config change.

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

Android store metadata is not represented by a dedicated Fastlane metadata tree in this repo. The Android store-facing asset visible in source is `android/app/src/main/ic_launcher-playstore.png`; Play Console listing copy and screenshots need external/store-side verification.

## Pre-Rebrand Baseline

The current iOS metadata still records the old brand surface:

- Localized names include `GoldWallet`.
- Privacy URLs point to `goldwallet.io`.
- Support URLs point to `https://github.com/GoldWallet/GoldWallet/issues`.
- Copyright metadata references `GoldWallet Services S.R.L.`.

The Russian `name.txt` content appears mojibake when read from PowerShell in the current shell encoding. Do not rewrite localized metadata opportunistically; encoding and localization should be handled in a dedicated store metadata branch.

## Rebrand Coordination Rules

- Do not update native app names without updating store metadata names, subtitles, descriptions, keywords, support URL, privacy URL, screenshots, and release notes.
- Do not update store metadata before final app name, legal/copyright owner, privacy URL, and support channel are confirmed.
- Do not publish explorer or network wording changes unless the wallet runtime, env files, transaction links, terms copy, and screenshots agree.
- Do not assume Android metadata is covered by iOS Fastlane files; Play Console listing state must be checked separately.
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
- Check Android Play Console listing or add Android Fastlane metadata if the team wants repo-owned Android metadata.
- Rebuild and smoke Android if app names, icons, package IDs, or runtime explorer/env values change.
- Validate iOS on macOS/Xcode if bundle identifiers, display names, icons, or schemes change.
