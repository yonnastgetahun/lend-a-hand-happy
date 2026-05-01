#!/usr/bin/env bash
# validate-maestro-flows.sh — Checks all .maestro/*.yaml flows against the Lendlee checklist.
# Exit 1 on any violation.

set -uo pipefail

MAESTRO_DIR="$(cd "$(dirname "$0")/../.maestro" && pwd)"
VIOLATIONS=()

# Entry-point flows (not called via runFlow by other flows)
ENTRY_FLOWS=("login.yaml" "auth-flow.yaml")

# Flows that navigate to the Lend tab
LEND_TAB_FLOWS=("lend-flow.yaml" "home-smoke.yaml")

for file in "$MAESTRO_DIR"/*.yaml; do
  name="$(basename "$file")"

  # 1. appId must be ${APP_ID}, not hardcoded
  if grep -qE '^appId:' "$file"; then
    if ! grep -qE '^appId:\s*\$\{APP_ID\}' "$file"; then
      VIOLATIONS+=("$name: appId is hardcoded — must be \${APP_ID}")
    fi
  else
    VIOLATIONS+=("$name: missing appId header")
  fi

  # 2. No clearKeychain (silently skipped on real iOS devices)
  if grep -qi 'clearKeychain' "$file"; then
    VIOLATIONS+=("$name: uses clearKeychain — not supported on real iOS devices")
  fi

  # 3. Tab bar Y coordinates must be 93%, not 97% (hits iOS home indicator)
  point_lines=$(grep -o 'point:.*"[0-9]*%,[0-9]*%"' "$file" 2>/dev/null || true)
  if [ -n "$point_lines" ]; then
    bad_coords=$(echo "$point_lines" | sed 's/.*,\([0-9]*\)%.*/\1/' | grep -vE '^93$' || true)
    if [ -n "$bad_coords" ]; then
      bad_list=$(echo "$bad_coords" | sort -u | tr '\n' ',' | sed 's/,$//')
      VIOLATIONS+=("$name: tab tap Y coordinate(s) at ${bad_list}% — must be 93%")
    fi
  fi

  # 4. SMS modal assertion must use text, not testID
  if grep -qE 'id:\s*"sms-preview-modal"' "$file"; then
    VIOLATIONS+=("$name: uses id: \"sms-preview-modal\" — React Native Modal testID not exposed on Android; use visible: \"Preview message\" instead")
  fi
done

# 5. Entry-point flows must have launchApp with clearState: true
for entry in "${ENTRY_FLOWS[@]}"; do
  file="$MAESTRO_DIR/$entry"
  [ -f "$file" ] || continue
  if ! grep -q 'launchApp' "$file"; then
    VIOLATIONS+=("$entry: entry-point flow missing launchApp")
  else
    launch_block=$(grep -A2 'launchApp' "$file" || true)
    if ! echo "$launch_block" | grep -q 'clearState:\s*true'; then
      VIOLATIONS+=("$entry: launchApp missing clearState: true")
    fi
  fi
done

# 6. login.yaml must handle both states (Keychain vs fresh login)
login_file="$MAESTRO_DIR/login.yaml"
if [ -f "$login_file" ]; then
  run_block=$(grep -A2 'runFlow' "$login_file" || true)
  if ! echo "$run_block" | grep -q 'visible:.*"Sign In"'; then
    VIOLATIONS+=("login.yaml: missing conditional login handler (runFlow when visible: \"Sign In\")")
  fi
fi

# 7. Lend tab flows must include contacts permission handler
for lend in "${LEND_TAB_FLOWS[@]}"; do
  file="$MAESTRO_DIR/$lend"
  [ -f "$file" ] || continue
  run_block=$(grep -A3 'runFlow' "$file" || true)
  if ! echo "$run_block" | grep -q 'visible:.*"Allow"'; then
    VIOLATIONS+=("$lend: navigates to Lend tab but missing contacts permission handler (runFlow when visible: \"Allow\")")
  fi
done

# Report
if [ ${#VIOLATIONS[@]} -gt 0 ]; then
  echo "❌ Maestro flow validation FAILED — ${#VIOLATIONS[@]} violation(s):"
  echo ""
  for v in "${VIOLATIONS[@]}"; do
    echo "  • $v"
  done
  exit 1
else
  echo "✅ All Maestro flows pass validation (${#ENTRY_FLOWS[@]} entry-points, $(ls "$MAESTRO_DIR"/*.yaml | wc -l | tr -d ' ') total flows)"
  exit 0
fi
