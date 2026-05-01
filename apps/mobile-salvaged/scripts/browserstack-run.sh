#!/bin/bash
# BrowserStack Maestro v2 — test runner with polling and result summary
#
# Usage:
#   ./scripts/browserstack-run.sh --platform ios|android|both --suite .maestro
#
# Requires: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY in .env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# --- defaults ---
PLATFORM=""
SUITE_PATH=""
POLL_INTERVAL=30
APP_IOS_OVERRIDE=""
APP_ANDROID_OVERRIDE=""

# --- parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform)    PLATFORM="$2"; shift 2 ;;
    --suite)       SUITE_PATH="$2"; shift 2 ;;
    --app-ios)     APP_IOS_OVERRIDE="$2"; shift 2 ;;
    --app-android) APP_ANDROID_OVERRIDE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$PLATFORM" || -z "$SUITE_PATH" ]]; then
  echo "Usage: $0 --platform ios|android|both --suite <path> [--app-ios bs://...] [--app-android bs://...]"
  exit 1
fi

if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" && "$PLATFORM" != "both" ]]; then
  echo "ERROR: --platform must be ios, android, or both"
  exit 1
fi

# --- resolve suite path ---
if [[ "$SUITE_PATH" != /* ]]; then
  SUITE_PATH="$PROJECT_DIR/$SUITE_PATH"
fi

if [[ ! -d "$SUITE_PATH" ]]; then
  echo "ERROR: Suite directory not found: $SUITE_PATH"
  exit 1
fi

# --- load credentials from .env ---
if [[ -f "$PROJECT_DIR/.env" ]]; then
  set -a
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    case "$key" in
      BROWSERSTACK_USERNAME|BROWSERSTACK_ACCESS_KEY) export "$key=$value" ;;
    esac
  done < "$PROJECT_DIR/.env"
  set +a
fi

if [[ -z "${BROWSERSTACK_USERNAME:-}" || -z "${BROWSERSTACK_ACCESS_KEY:-}" ]]; then
  echo "ERROR: BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set in .env"
  exit 1
fi

AUTH="$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY"
API="https://api-cloud.browserstack.com/app-automate/maestro/v2"

# --- app URLs (use overrides if provided, else fall back to last known uploads) ---
IOS_APP_URL="${APP_IOS_OVERRIDE:-bs://5c439bcb6957f08bba4972f9c5307459d1f6c004}"
ANDROID_APP_URL="${APP_ANDROID_OVERRIDE:-bs://5553b70785d3f617e5ff65cdaed99a16033a9903}"

IOS_BUNDLE="me.lendlee.ios"
ANDROID_BUNDLE="me.lendlee.app"

IOS_DEVICE="iPhone 15-17"
ANDROID_DEVICE="Google Pixel 8-14.0"

# --- helper: json field extraction (no jq dependency) ---
json_val() {
  python3 -c "import sys,json; print(json.load(sys.stdin).get('$1',''))" 2>/dev/null
}

json_field() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d$1)" 2>/dev/null
}

# ============================================================
# Step 1: Package test suite into zip with lendlee-tests/ wrapper
# ============================================================
echo "=== Packaging test suite ==="

ZIP_FILE=$(mktemp /tmp/lendlee-tests-XXXXXX.zip)
rm -f "$ZIP_FILE"

TMPDIR_PACK=$(mktemp -d)
mkdir -p "$TMPDIR_PACK/lendlee-tests"
cp "$SUITE_PATH"/*.yaml "$TMPDIR_PACK/lendlee-tests/" 2>/dev/null || true
cp "$SUITE_PATH"/*.yml "$TMPDIR_PACK/lendlee-tests/" 2>/dev/null || true

FILE_COUNT=$(ls "$TMPDIR_PACK/lendlee-tests/" | wc -l | tr -d ' ')
if [[ "$FILE_COUNT" -eq 0 ]]; then
  echo "ERROR: No .yaml/.yml files found in $SUITE_PATH"
  rm -rf "$TMPDIR_PACK"
  exit 1
fi

(cd "$TMPDIR_PACK" && zip -r "$ZIP_FILE" lendlee-tests/)
rm -rf "$TMPDIR_PACK"

echo "Packaged $FILE_COUNT test files into zip"
echo ""

# ============================================================
# Step 2: Upload test suite
# ============================================================
echo "=== Uploading test suite ==="

SUITE_RESPONSE=$(curl -s -u "$AUTH" \
  -X POST "$API/test-suite" \
  -F "file=@$ZIP_FILE")

rm -f "$ZIP_FILE"

SUITE_URL=$(echo "$SUITE_RESPONSE" | json_val "test_suite_url")

if [[ -z "$SUITE_URL" ]]; then
  echo "ERROR: Test suite upload failed:"
  echo "$SUITE_RESPONSE"
  exit 1
fi

echo "Suite uploaded: $SUITE_URL"
echo ""

# ============================================================
# Step 3: Trigger builds
# ============================================================
trigger_build() {
  local plat="$1"
  local app_url="$2"
  local bundle_id="$3"
  local device="$4"

  echo "=== Triggering $plat build on $device ==="

  local response
  response=$(curl -s -u "$AUTH" \
    -X POST "$API/$plat/build" \
    -H "Content-Type: application/json" \
    -d "{
      \"app\": \"$app_url\",
      \"testSuite\": \"$SUITE_URL\",
      \"project\": \"Lendlee QA\",
      \"devices\": [\"$device\"],
      \"deviceLogs\": true,
      \"video\": true,
      \"setEnvVariables\": {\"APP_ID\": \"$bundle_id\"}
    }")

  local build_id
  build_id=$(echo "$response" | json_val "build_id")

  if [[ -z "$build_id" ]]; then
    echo "ERROR: Failed to trigger $plat build:"
    echo "$response"
    return 1
  fi

  echo "$plat build started: $build_id"
  echo "Dashboard: https://app-automate.browserstack.com/builds/$build_id"
  echo ""
  echo "$build_id"
}

declare -a BUILD_IDS=()
declare -a BUILD_PLATFORMS=()

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
  IOS_BUILD_ID=$(trigger_build "ios" "$IOS_APP_URL" "$IOS_BUNDLE" "$IOS_DEVICE" | tail -1)
  BUILD_IDS+=("$IOS_BUILD_ID")
  BUILD_PLATFORMS+=("ios")
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
  ANDROID_BUILD_ID=$(trigger_build "android" "$ANDROID_APP_URL" "$ANDROID_BUNDLE" "$ANDROID_DEVICE" | tail -1)
  BUILD_IDS+=("$ANDROID_BUILD_ID")
  BUILD_PLATFORMS+=("android")
fi

# ============================================================
# Step 4: Poll until all builds complete
# ============================================================
poll_build() {
  local build_id="$1"
  local plat="$2"

  echo "Polling $plat build $build_id..."

  while true; do
    local status_response
    status_response=$(curl -s -u "$AUTH" \
      "$API/builds/$build_id")

    local status
    status=$(echo "$status_response" | json_val "status")

    case "$status" in
      done|passed|failed|error|timed-out)
        echo "$plat build finished: $status"
        echo "$status_response"
        return 0
        ;;
      running|queued)
        echo "  $plat: $status ... waiting ${POLL_INTERVAL}s"
        sleep "$POLL_INTERVAL"
        ;;
      *)
        echo "  $plat: unknown status '$status' ... waiting ${POLL_INTERVAL}s"
        sleep "$POLL_INTERVAL"
        ;;
    esac
  done
}

declare -a BUILD_RESULTS=()

for i in "${!BUILD_IDS[@]}"; do
  result=$(poll_build "${BUILD_IDS[$i]}" "${BUILD_PLATFORMS[$i]}")
  BUILD_RESULTS+=("$result")
done

# ============================================================
# Step 5: Print per-test summary with video URLs
# ============================================================
print_summary() {
  local build_id="$1"
  local plat="$2"

  echo ""
  echo "============================================================"
  echo "  $plat RESULTS — Build $build_id"
  echo "============================================================"

  local sessions_response
  sessions_response=$(curl -s -u "$AUTH" \
    "https://api.browserstack.com/app-automate/maestro/v2/builds/$build_id/sessions")

  python3 -c "
import json, sys

try:
    data = json.load(sys.stdin)
except:
    print('  Could not parse session data')
    sys.exit(0)

sessions = data if isinstance(data, list) else data.get('sessions', data.get('data', []))
if not sessions:
    print('  No session data available')
    sys.exit(0)

total = 0
passed = 0
failed = 0

print()
print(f'  {\"TEST\":<40} {\"STATUS\":<10} {\"DURATION\":<10} VIDEO')
print(f'  {\"-\"*40} {\"-\"*10} {\"-\"*10} {\"-\"*50}')

for session in sessions:
    if isinstance(session, dict):
        tests = session.get('tests', session.get('testcases', []))
        if not tests:
            name = session.get('name', session.get('test_name', 'unknown'))
            status = session.get('status', 'unknown')
            duration = session.get('duration', '-')
            video = session.get('video_url', session.get('video', '-'))
            total += 1
            if status in ('passed', 'pass'):
                passed += 1
            else:
                failed += 1
            marker = 'PASS' if status in ('passed', 'pass') else 'FAIL'
            print(f'  {name:<40} {marker:<10} {str(duration):<10} {video}')
        else:
            for test in tests:
                name = test.get('name', test.get('test_name', 'unknown'))
                status = test.get('status', 'unknown')
                duration = test.get('duration', '-')
                video = test.get('video_url', session.get('video_url', session.get('video', '-')))
                total += 1
                if status in ('passed', 'pass'):
                    passed += 1
                else:
                    failed += 1
                marker = 'PASS' if status in ('passed', 'pass') else 'FAIL'
                print(f'  {name:<40} {marker:<10} {str(duration):<10} {video}')

print()
print(f'  Total: {total}  Passed: {passed}  Failed: {failed}')
if failed > 0:
    sys.exit(1)
" <<< "$sessions_response" || true
}

EXIT_CODE=0

for i in "${!BUILD_IDS[@]}"; do
  print_summary "${BUILD_IDS[$i]}" "${BUILD_PLATFORMS[$i]}" || EXIT_CODE=1
done

echo ""
if [[ "$EXIT_CODE" -eq 0 ]]; then
  echo "All builds passed."
else
  echo "Some tests failed. See details above."
fi

exit "$EXIT_CODE"
