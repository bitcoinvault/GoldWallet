#!/usr/bin/env bash
# Creates "sentry.properties" file in the root, /ios/, and /android/.

set -euo pipefail

: "${SENTRY_AUTH_TOKEN:?SENTRY_AUTH_TOKEN is required to generate Sentry release properties}"
: "${SENTRY_RELEASE_PROFILE:?SENTRY_RELEASE_PROFILE is required; expected nonprod or prod}"

SENTRY_ORG="${SENTRY_ORG:-decentraplanet}"

case "$SENTRY_RELEASE_PROFILE" in
  nonprod)
    default_android_project="goldwallet-dev-android"
    default_ios_project="goldwallet-dev-ios"
    ;;
  prod)
    default_android_project="goldwallet-prod-android"
    default_ios_project="goldwallet"
    ;;
  *)
    printf '%s\n' 'SENTRY_RELEASE_PROFILE must be one of: nonprod, prod' >&2
    exit 1
    ;;
esac

SENTRY_ANDROID_PROJECT="${SENTRY_ANDROID_PROJECT:-$default_android_project}"
SENTRY_IOS_PROJECT="${SENTRY_IOS_PROJECT:-$default_ios_project}"

android_content="defaults.url=https://sentry.io/
defaults.org=$SENTRY_ORG
defaults.project=$SENTRY_ANDROID_PROJECT
auth.token=$SENTRY_AUTH_TOKEN"

ios_content="defaults.url=https://sentry.io/
defaults.org=$SENTRY_ORG
defaults.project=$SENTRY_IOS_PROJECT
auth.token=$SENTRY_AUTH_TOKEN"

umask 077
mkdir -p ios android

printf '%s\n' "$android_content" > sentry.properties
printf '%s\n' "$ios_content" > ios/sentry.properties
printf '%s\n' "$android_content" > android/sentry.properties
