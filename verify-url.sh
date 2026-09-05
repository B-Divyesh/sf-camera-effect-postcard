#!/usr/bin/env bash
set -euo pipefail

url="${1:-https://camera-effect-postcard.sociobot.in/}"
node scripts/verify-url.mjs "$url"
