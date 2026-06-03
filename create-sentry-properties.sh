#!/usr/bin/env bash
# Creates "sentry.properties" file in the root, /ios/, and /android/.

set -euo pipefail

: "${SENTRY_AUTH_TOKEN:?SENTRY_AUTH_TOKEN is required to generate Sentry release properties}"

SENTRY_ORG="${SENTRY_ORG:-cloudbest}"
SENTRY_PROJECT="${SENTRY_PROJECT:-goldwallet}"

content="defaults.url=https://sentry.io/
defaults.org=$SENTRY_ORG
defaults.project=$SENTRY_PROJECT
auth.token=$SENTRY_AUTH_TOKEN"

umask 077
mkdir -p ios android

printf '%s\n' "$content" > sentry.properties
printf '%s\n' "$content" > ios/sentry.properties
printf '%s\n' "$content" > android/sentry.properties
