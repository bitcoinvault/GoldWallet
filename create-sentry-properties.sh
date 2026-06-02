#!/usr/bin/env bash
# Creates "sentry.properties" file in the root, /ios/, and /android/.

set -euo pipefail

: "${SENTRY_AUTH_TOKEN:?SENTRY_AUTH_TOKEN is required to generate Sentry release properties}"

content="defaults.url=https://sentry.io/
defaults.org=cloudbest
defaults.project=goldwallet
auth.token=$SENTRY_AUTH_TOKEN"

umask 077
mkdir -p ios android

printf '%s\n' "$content" > sentry.properties
printf '%s\n' "$content" > ios/sentry.properties
printf '%s\n' "$content" > android/sentry.properties
