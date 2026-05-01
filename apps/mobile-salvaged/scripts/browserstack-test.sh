#!/bin/bash
# BrowserStack App Automate — upload app + run Maestro tests
# Video recording is automatic for every session.
#
# Usage:
#   ./scripts/browserstack-test.sh <path-to-app> [ios|android]
#   ./scripts/browserstack-test.sh ./lendlee.apk
#   ./scripts/browserstack-test.sh ./lendlee.ipa
#
# Requires: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY in .env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -E '^BROWSERSTACK_' "$PROJECT_DIR/.env" | xargs)
fi

if [ -z "${BROWSERSTACK_USERNAME:-}" ] || [ -z "${BROWSERSTACK_ACCESS_KEY:-}" ]; then
  echo "ERROR: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set in .env"
  exit 1
fi

APP_PATH="${1:-}"
if [ -z "$APP_PATH" ]; then
  echo "Usage: $0 <path-to-ipa-or-apk>"
  echo ""
  echo "Build first with:"
  echo "  eas build --platform ios --profile preview    # → .ipa"
  echo "  eas build --platform android --profile preview # → .apk"
  exit 1
fi

if [ ! -f "$APP_PATH" ]; then
  echo "ERROR: File not found: $APP_PATH"
  exit 1
fi

# Detect platform from file extension
EXT="${APP_PATH##*.}"
if [ "$EXT" = "ipa" ]; then
  PLATFORM="ios"
  DEVICE="iPhone 15-17"
elif [ "$EXT" = "apk" ]; then
  PLATFORM="android"
  DEVICE="Google Pixel 8-14.0"
else
  echo "ERROR: Unrecognized file type: .$EXT (expected .ipa or .apk)"
  exit 1
fi

echo "=== Step 1: Upload app to BrowserStack ==="
UPLOAD_RESPONSE=$(curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
  -F "file=@$APP_PATH")

APP_URL=$(echo "$UPLOAD_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('app_url',''))" 2>/dev/null)

if [ -z "$APP_URL" ]; then
  echo "ERROR: App upload failed. Response:"
  echo "$UPLOAD_RESPONSE"
  exit 1
fi

echo "App uploaded: $APP_URL"
echo ""

echo "=== Step 2: Upload Maestro test suite ==="
MAESTRO_ZIP="$PROJECT_DIR/.maestro-tests.zip"
# BrowserStack rejects hidden folders — copy to a temp dir with a non-hidden name
TMPDIR_BS=$(mktemp -d)
cp -r "$PROJECT_DIR/.maestro" "$TMPDIR_BS/maestro"
(cd "$TMPDIR_BS" && zip -r "$MAESTRO_ZIP" maestro/ -x "*.DS_Store")
rm -rf "$TMPDIR_BS"

SUITE_RESPONSE=$(curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  -X POST "https://api-cloud.browserstack.com/app-automate/maestro/v2/test-suite" \
  -F "file=@$MAESTRO_ZIP" \
  -F "custom_id=lendlee-flows")

rm -f "$MAESTRO_ZIP"

SUITE_URL=$(echo "$SUITE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('test_suite_url',''))" 2>/dev/null)

if [ -z "$SUITE_URL" ]; then
  echo "ERROR: Test suite upload failed. Response:"
  echo "$SUITE_RESPONSE"
  exit 1
fi

echo "Test suite uploaded: $SUITE_URL"
echo ""

echo "=== Step 3: Execute tests on $PLATFORM ($DEVICE) ==="
BUILD_RESPONSE=$(curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  -X POST "https://api-cloud.browserstack.com/app-automate/maestro/v2/$PLATFORM/build" \
  -H "Content-Type: application/json" \
  -d "{
    \"app\": \"$APP_URL\",
    \"testSuite\": \"$SUITE_URL\",
    \"project\": \"Lendlee QA\",
    \"devices\": [\"$DEVICE\"],
    \"networkLogs\": true,
    \"deviceLogs\": true
  }")

echo "Response:"
echo "$BUILD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BUILD_RESPONSE"
echo ""

BUILD_ID=$(echo "$BUILD_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('build_id',''))" 2>/dev/null)

if [ -n "$BUILD_ID" ]; then
  echo "=== Tests running! ==="
  echo ""
  echo "Dashboard:  https://app-automate.browserstack.com/builds/$BUILD_ID"
  echo "Video recordings will be available once tests complete."
  echo ""
  echo "Check status:"
  echo "  curl -s -u \"\$BROWSERSTACK_USERNAME:\$BROWSERSTACK_ACCESS_KEY\" \\"
  echo "    https://api-cloud.browserstack.com/app-automate/maestro/v2/builds/$BUILD_ID"
else
  echo "WARNING: Could not extract build_id. Check response above."
fi
