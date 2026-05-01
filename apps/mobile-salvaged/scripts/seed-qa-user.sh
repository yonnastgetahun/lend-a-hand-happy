#!/usr/bin/env bash
# seed-qa-user.sh — Idempotent QA test account provisioning via Supabase Auth Admin API
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
SUPABASE_URL="https://divwsajiaxklbuehnzek.supabase.co"
QA_EMAIL="qa@lendlee.test"
QA_PASSWORD="Lendlee-QA-2026!"
QA_NAME="QA Tester"

# Service role key — required for admin operations.
# Set via env var or fall back to .env file in project root.
if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  ENV_FILE="$(dirname "$0")/../.env"
  if [ -f "$ENV_FILE" ]; then
    SUPABASE_SERVICE_ROLE_KEY=$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d "'\"")
  fi
fi

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY not set."
  echo "Export it or add it to .env at the project root."
  exit 1
fi

ANON_KEY="sb_publishable_umQuch6DLTJm5NaO7LCmyQ_dFeNLaW2"

echo "=== Lendlee QA User Seed ==="
echo "URL:   $SUPABASE_URL"
echo "Email: $QA_EMAIL"
echo ""

# ── Step 1: Check if user already exists ────────────────────────────────────
echo "[1/5] Checking if QA user already exists..."
EXISTING=$(curl -s -X GET \
  "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json")

USER_ID=$(echo "$EXISTING" | python3 -c "
import sys, json
data = json.load(sys.stdin)
users = data.get('users', data) if isinstance(data, dict) else data
for u in (users if isinstance(users, list) else []):
    if u.get('email') == '$QA_EMAIL':
        print(u['id'])
        break
" 2>/dev/null || true)

if [ -n "$USER_ID" ]; then
  echo "  User already exists: $USER_ID"
  echo "  Updating password and metadata..."
  curl -s -X PUT \
    "${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"password\": \"${QA_PASSWORD}\",
      \"email_confirm\": true,
      \"user_metadata\": {\"name\": \"${QA_NAME}\"}
    }" > /dev/null
else
  # ── Step 2: Create user via Auth Admin API ──────────────────────────────
  echo "[2/5] Creating QA user via Auth Admin API..."
  CREATE_RESP=$(curl -s -X POST \
    "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${QA_EMAIL}\",
      \"password\": \"${QA_PASSWORD}\",
      \"email_confirm\": true,
      \"user_metadata\": {\"name\": \"${QA_NAME}\"}
    }")

  USER_ID=$(echo "$CREATE_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('id', ''))
" 2>/dev/null || true)

  if [ -z "$USER_ID" ]; then
    echo "ERROR: Failed to create user."
    echo "$CREATE_RESP"
    exit 1
  fi
  echo "  Created user: $USER_ID"
fi

# ── Step 3: Ensure profile row exists ───────────────────────────────────────
echo "[3/5] Ensuring profile row exists..."
PROFILE_CHECK=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}&select=id" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json")

HAS_PROFILE=$(echo "$PROFILE_CHECK" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('yes' if len(data) > 0 else 'no')
" 2>/dev/null || echo "no")

if [ "$HAS_PROFILE" = "no" ]; then
  echo "  Profile missing — creating..."
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/profiles" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{
      \"id\": \"${USER_ID}\",
      \"name\": \"${QA_NAME}\",
      \"email\": \"${QA_EMAIL}\"
    }"
  echo "  Profile created."
else
  echo "  Profile exists."
fi

# ── Step 4: Fix NULL varchar columns in auth.users ──────────────────────────
echo "[4/5] Fixing NULL varchar columns in auth.users..."
# Use the admin API to update the user, ensuring metadata fields are populated.
# The Admin API update also refreshes the record and avoids NULL varchar issues.
curl -s -X PUT \
  "${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email_confirm\": true,
    \"phone\": \"\",
    \"user_metadata\": {\"name\": \"${QA_NAME}\"}
  }" > /dev/null
echo "  Done."

# ── Step 5: Verify login ───────────────────────────────────────────────────
echo "[5/5] Verifying login..."
TOKEN_RESP=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${QA_EMAIL}\",
    \"password\": \"${QA_PASSWORD}\"
  }")

ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('access_token', ''))
" 2>/dev/null || true)

if [ -n "$ACCESS_TOKEN" ]; then
  echo ""
  echo "=== SUCCESS ==="
  echo "User ID:    $USER_ID"
  echo "Email:      $QA_EMAIL"
  echo "Password:   $QA_PASSWORD"
  echo "Confirmed:  true"
  echo "Login:      VERIFIED (access_token received)"
  echo ""
else
  echo ""
  echo "=== WARNING ==="
  echo "User created ($USER_ID) but login verification failed."
  echo "Response: $TOKEN_RESP"
  echo ""
  echo "Debug: Check for NULL varchar columns:"
  echo "  SELECT id, email, phone, email_change, email_change_token_new, recovery_token"
  echo "  FROM auth.users WHERE email = '${QA_EMAIL}';"
  exit 1
fi
