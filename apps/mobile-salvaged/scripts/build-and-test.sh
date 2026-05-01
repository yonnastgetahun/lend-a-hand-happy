#!/bin/bash
# EAS Build + BrowserStack Upload + Maestro Test — full pipeline
#
# One command: code -> build -> upload -> test -> results
#
# Usage:
#   ./scripts/build-and-test.sh
#
# Requires:
#   - EAS CLI (`npm install -g eas-cli`) and authenticated (`eas login`)
#   - BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY in .env
#   - Maestro test suite in .maestro/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
POLL_INTERVAL=30
MAX_POLL_ATTEMPTS=120  # 60 minutes max

# --- load credentials from .env ---
if [[ -f "$PROJECT_DIR/.env" ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    case "$key" in
      BROWSERSTACK_USERNAME|BROWSERSTACK_ACCESS_KEY) export "$key=$value" ;;
    esac
  done < "$PROJECT_DIR/.env"
fi

if [[ -z "${BROWSERSTACK_USERNAME:-}" || -z "${BROWSERSTACK_ACCESS_KEY:-}" ]]; then
  echo "ERROR: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set in .env"
  exit 1
fi

BS_AUTH="$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY"

# --- helper: extract JSON field via python3 ---
json_val() {
  python3 -c "import sys,json; print(json.load(sys.stdin).get('$1',''))" 2>/dev/null
}

json_array_field() {
  python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data:
    if item.get('platform') == '$1' or '$1' == '':
        print(item.get('$2', ''))
        break
" 2>/dev/null
}

# ============================================================
# Step 1: Trigger EAS builds for both platforms
# ============================================================
echo "============================================================"
echo "  STEP 1: Triggering EAS builds"
echo "============================================================"
echo ""

cd "$PROJECT_DIR"

echo "Starting Android build..."
ANDROID_BUILD_JSON=$(eas build --platform android --profile preview --non-interactive --json 2>/dev/null) || {
  echo "ERROR: Android EAS build command failed"
  echo "$ANDROID_BUILD_JSON"
  exit 1
}
ANDROID_BUILD_ID=$(echo "$ANDROID_BUILD_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    print(data[0].get('id', ''))
else:
    print(data.get('id', ''))
" 2>/dev/null)

if [[ -z "$ANDROID_BUILD_ID" ]]; then
  echo "ERROR: Could not extract Android build ID"
  echo "$ANDROID_BUILD_JSON"
  exit 1
fi
echo "Android build started: $ANDROID_BUILD_ID"

echo ""
echo "Starting iOS build..."
IOS_BUILD_JSON=$(eas build --platform ios --profile preview --non-interactive --json 2>/dev/null) || {
  echo "ERROR: iOS EAS build command failed"
  echo "$IOS_BUILD_JSON"
  exit 1
}
IOS_BUILD_ID=$(echo "$IOS_BUILD_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    print(data[0].get('id', ''))
else:
    print(data.get('id', ''))
" 2>/dev/null)

if [[ -z "$IOS_BUILD_ID" ]]; then
  echo "ERROR: Could not extract iOS build ID"
  echo "$IOS_BUILD_JSON"
  exit 1
fi
echo "iOS build started: $IOS_BUILD_ID"

echo ""

# ============================================================
# Step 2: Poll EAS until both builds complete
# ============================================================
echo "============================================================"
echo "  STEP 2: Waiting for EAS builds to complete"
echo "============================================================"
echo ""

poll_eas_build() {
  local build_id="$1"
  local platform="$2"
  local attempts=0

  while [[ $attempts -lt $MAX_POLL_ATTEMPTS ]]; do
    local build_info
    build_info=$(eas build:view "$build_id" --json 2>/dev/null) || {
      echo "  $platform: failed to query build status, retrying..."
      sleep "$POLL_INTERVAL"
      ((attempts++))
      continue
    }

    local status
    status=$(echo "$build_info" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    print(data[0].get('status', ''))
else:
    print(data.get('status', ''))
" 2>/dev/null)

    case "$status" in
      FINISHED|finished)
        local artifact_url
        artifact_url=$(echo "$build_info" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    data = data[0]
print(data.get('artifacts', {}).get('applicationArchiveUrl', '') or data.get('artifacts', {}).get('buildUrl', ''))
" 2>/dev/null)
        echo "$platform build FINISHED"
        echo "$artifact_url"
        return 0
        ;;
      ERRORED|errored|CANCELED|canceled)
        echo "ERROR: $platform build $status"
        echo "$build_info"
        return 1
        ;;
      *)
        echo "  $platform: $status ... waiting ${POLL_INTERVAL}s"
        sleep "$POLL_INTERVAL"
        ((attempts++))
        ;;
    esac
  done

  echo "ERROR: $platform build timed out after $((MAX_POLL_ATTEMPTS * POLL_INTERVAL / 60)) minutes"
  return 1
}

# Poll both builds (sequentially — EAS CLI doesn't love parallel calls)
ANDROID_RESULT=$(poll_eas_build "$ANDROID_BUILD_ID" "Android")
ANDROID_EXIT=$?
ANDROID_ARTIFACT_URL=$(echo "$ANDROID_RESULT" | tail -1)

if [[ $ANDROID_EXIT -ne 0 ]]; then
  echo "$ANDROID_RESULT"
  exit 1
fi

echo "$ANDROID_RESULT"
echo ""

IOS_RESULT=$(poll_eas_build "$IOS_BUILD_ID" "iOS")
IOS_EXIT=$?
IOS_ARTIFACT_URL=$(echo "$IOS_RESULT" | tail -1)

if [[ $IOS_EXIT -ne 0 ]]; then
  echo "$IOS_RESULT"
  exit 1
fi

echo "$IOS_RESULT"
echo ""

# ============================================================
# Step 3: Download artifacts
# ============================================================
echo "============================================================"
echo "  STEP 3: Downloading build artifacts"
echo "============================================================"
echo ""

ARTIFACT_DIR=$(mktemp -d)

echo "Downloading Android APK..."
ANDROID_APK="$ARTIFACT_DIR/lendlee.apk"
curl -sL -o "$ANDROID_APK" "$ANDROID_ARTIFACT_URL"
ANDROID_SIZE=$(wc -c < "$ANDROID_APK" | tr -d ' ')
echo "  Downloaded: $ANDROID_APK ($ANDROID_SIZE bytes)"

echo "Downloading iOS IPA..."
IOS_IPA="$ARTIFACT_DIR/lendlee.ipa"
curl -sL -o "$IOS_IPA" "$IOS_ARTIFACT_URL"
IOS_SIZE=$(wc -c < "$IOS_IPA" | tr -d ' ')
echo "  Downloaded: $IOS_IPA ($IOS_SIZE bytes)"

# Validate file sizes
if [[ $ANDROID_SIZE -lt 1000 ]]; then
  echo "ERROR: Android APK too small ($ANDROID_SIZE bytes) — download likely failed"
  rm -rf "$ARTIFACT_DIR"
  exit 1
fi

if [[ $IOS_SIZE -lt 1000 ]]; then
  echo "ERROR: iOS IPA too small ($IOS_SIZE bytes) — download likely failed"
  rm -rf "$ARTIFACT_DIR"
  exit 1
fi

echo ""

# ============================================================
# Step 4: Upload artifacts to BrowserStack
# ============================================================
echo "============================================================"
echo "  STEP 4: Uploading to BrowserStack"
echo "============================================================"
echo ""

echo "Uploading Android APK..."
ANDROID_BS_RESPONSE=$(curl -s -u "$BS_AUTH" \
  -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
  -F "file=@$ANDROID_APK")
ANDROID_BS_URL=$(echo "$ANDROID_BS_RESPONSE" | json_val "app_url")

if [[ -z "$ANDROID_BS_URL" ]]; then
  echo "ERROR: Android upload to BrowserStack failed:"
  echo "$ANDROID_BS_RESPONSE"
  rm -rf "$ARTIFACT_DIR"
  exit 1
fi
echo "  Android uploaded: $ANDROID_BS_URL"

echo "Uploading iOS IPA..."
IOS_BS_RESPONSE=$(curl -s -u "$BS_AUTH" \
  -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
  -F "file=@$IOS_IPA")
IOS_BS_URL=$(echo "$IOS_BS_RESPONSE" | json_val "app_url")

if [[ -z "$IOS_BS_URL" ]]; then
  echo "ERROR: iOS upload to BrowserStack failed:"
  echo "$IOS_BS_RESPONSE"
  rm -rf "$ARTIFACT_DIR"
  exit 1
fi
echo "  iOS uploaded: $IOS_BS_URL"

# Cleanup downloaded artifacts
rm -rf "$ARTIFACT_DIR"
echo ""

# ============================================================
# Step 5: Run Maestro tests via browserstack-run.sh
# ============================================================
echo "============================================================"
echo "  STEP 5: Running Maestro tests on BrowserStack"
echo "============================================================"
echo ""

"$SCRIPT_DIR/browserstack-run.sh" \
  --platform both \
  --suite .maestro \
  --app-ios "$IOS_BS_URL" \
  --app-android "$ANDROID_BS_URL"

EXIT_CODE=$?

echo ""
echo "============================================================"
if [[ $EXIT_CODE -eq 0 ]]; then
  echo "  ALL TESTS PASSED — Pipeline complete"
else
  echo "  TESTS FAILED — See results above"
fi
echo "============================================================"

exit $EXIT_CODE
