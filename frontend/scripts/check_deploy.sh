#!/usr/bin/env bash
set -euo pipefail

# check_deploy.sh - Verify Cloudflare Pages deploy serves compiled assets with correct Content-Type
# Usage: ./check_deploy.sh [BASE_URL]

URL=${1:-https://beta.acachile.com}
echo "Checking index at $URL"

INDEX=$(curl -sS "$URL")
if [ -z "$INDEX" ]; then
  echo "ERROR: Could not fetch index.html from $URL"
  exit 2
fi

# Look for a bundled asset referenced from dist (e.g. /assets/index-*.js)
ASSET_PATH=$(echo "$INDEX" | grep -oE 'src="/assets/[^"]+\.js' | head -n1 | sed 's/src="//')
if [ -z "$ASSET_PATH" ]; then
  echo "ERROR: No /assets/*.js reference found in index.html"
  # Dump a snippet for debugging
  echo "--- index.html snippet ---"
  echo "$INDEX" | sed -n '1,200p'
  exit 3
fi

FULL_ASSET="$URL$ASSET_PATH"
echo "Found asset: $FULL_ASSET"

echo "Checking headers for asset..."
HEADERS=$(curl -sI "$FULL_ASSET" || true)
if [ -z "$HEADERS" ]; then
  echo "ERROR: Could not fetch headers for $FULL_ASSET"
  exit 4
fi

echo "$HEADERS"

CONTENT_TYPE=$(echo "$HEADERS" | grep -i '^content-type:' || true)
echo "Content-Type header: $CONTENT_TYPE"

if echo "$CONTENT_TYPE" | grep -qi 'javascript'; then
  echo "OK: Content-Type looks correct (javascript)"
  exit 0
else
  echo "ERROR: Content-Type is not javascript. Possible cause: Pages serving raw source or wrong headers."
  exit 5
fi
