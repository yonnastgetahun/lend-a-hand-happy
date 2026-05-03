# Lendlee Mobile App — Security Audit Report

**Auditor:** Tyson (Security/Pentest Specialist)
**Date:** 2026-05-02
**Scope:** Full codebase review of Lendlee mobile app before App Store submission
**App Version:** 1.0.0
**Stack:** React Native / Expo 52 + Supabase + TypeScript

---

## Executive Summary

The Lendlee codebase demonstrates solid security fundamentals — SecureStore for auth tokens, properly configured RLS policies, parameterized queries via the Supabase SDK, and an atomic RPC for the core lend flow. However, there are **two critical issues** that must be resolved before App Store submission: hardcoded Supabase credentials in source code and exposed BrowserStack secrets in the `.env` file that is tracked in the working tree.

**Findings by severity:**
- CRITICAL: 2
- HIGH: 3
- MEDIUM: 4
- LOW: 3
- PASS: 12

---

## CRITICAL Issues

### C-1: Hardcoded Supabase URL and Anon Key in Source Code

**File:** `apps/mobile-salvaged/lib/supabase.ts` (lines 7-8)

```typescript
const supabaseUrl = 'https://divwsajiaxklbuehnzek.supabase.co';
const supabaseAnonKey = 'sb_publishable_umQuch6DLTJm5NaO7LCmyQ_dFeNLaW2';
```

The Supabase URL and anonymous key are hardcoded directly in the source file rather than read from environment variables. While the anon key is designed to be public (it is rate-limited and RLS-gated), embedding it in source means:
- The key ships in the compiled JS bundle and can be trivially extracted from the `.ipa`/`.apk`.
- Key rotation requires a new app build and store submission.
- The `.env` file exists with the same values, suggesting the code was supposed to read from env but fell back to hardcoding.

**Remediation:** Replace the hardcoded values with `process.env.EXPO_PUBLIC_SUPABASE_URL` and `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY` (or `expo-constants`). Ensure the build pipeline injects them at compile time. The `.env` already has the variables — the code just ignores them.

---

### C-2: BrowserStack Credentials Exposed in `.env`

**File:** `apps/mobile-salvaged/.env` (lines 16-17)

```
BROWSERSTACK_USERNAME=yonnastgetahun_jfGz34
BROWSERSTACK_ACCESS_KEY=uaSnhMAVh6K9YpNNdRpU
```

The `.env` file contains live BrowserStack API credentials. While `.env` is listed in `.gitignore`, the file exists on disk and could be accidentally committed. These credentials provide:
- Full access to BrowserStack App Automate.
- Ability to run arbitrary test sessions, consume quota, and access test artifacts.

**Remediation:**
1. Rotate the BrowserStack access key immediately.
2. Move BrowserStack credentials to a CI-only secrets store (GitHub Actions secrets, etc.).
3. Remove them from the `.env` file — they are not needed at runtime.
4. Verify `.env` has never been committed: `git log --all -- apps/mobile-salvaged/.env` (confirmed clean as of this audit).

---

## HIGH Issues

### H-1: Google OAuth Client IDs Hardcoded with Fallback Values

**File:** `apps/mobile-salvaged/lib/auth/google.ts` (lines 18-25)

```typescript
const IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
  '180727363697-jv1f6b84d80f7mtihenh7kq3vv7pu269.apps.googleusercontent.com';
```

The code reads from env vars but falls back to hardcoded Google OAuth client IDs. While OAuth client IDs are semi-public (embedded in app bundles), hardcoding them means:
- A compromised or leaked client ID cannot be rotated without a code change.
- The same client ID appears in `.env`, `google.ts`, and potentially `app.json`.

**Remediation:** Remove the hardcoded fallback strings. If `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` is not set, fail loudly at startup rather than silently using a baked-in value.

---

### H-2: `get_user_stats` Function Uses SECURITY DEFINER Without `search_path`

**File:** `apps/mobile-salvaged/supabase/migrations/20260417000000_initial_schema.sql` (line 261-282)

```sql
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This function runs with the **definer's** privileges (typically `postgres`) and does not set `search_path`. A malicious actor who can create objects in the `public` schema could shadow the `items`, `loans`, or `contacts` tables/functions with trojanized versions.

The `lend_item` RPC in the later migration correctly uses `SECURITY INVOKER` with `SET search_path = public` — this function should follow the same pattern or at minimum add `SET search_path = public`.

Additionally, `get_user_stats` accepts an arbitrary `user_id` UUID parameter and queries data for that user. Since it runs as SECURITY DEFINER (bypassing RLS), any authenticated user can call `get_user_stats('any-other-user-uuid')` and get another user's item/loan/contact counts. This is an **information disclosure** vulnerability.

**Remediation:**
1. Add `SET search_path = public` to the function definition.
2. Replace the `user_id` parameter with `auth.uid()` inside the function body, or add a check: `IF user_id <> auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;`.
3. Consider switching to `SECURITY INVOKER` if RLS is sufficient.

---

### H-3: `handle_new_user` and `handle_user_update` Triggers Use SECURITY DEFINER

**File:** `apps/mobile-salvaged/supabase/migrations/20260422000000_fix_profile_creation.sql`

These triggers run on `auth.users` and legitimately need SECURITY DEFINER to write to `profiles` during signup (the user doesn't have RLS access yet). However:
- Neither function sets `search_path`, making them vulnerable to search-path hijacking.
- `handle_user_update` trusts `raw_user_meta_data->>'name'` without sanitization. While Supabase's GoTrue service controls this field, a compromised auth flow could inject malicious values.

**Remediation:** Add `SET search_path = public` to both function definitions. This is a one-line fix per function.

---

## MEDIUM Issues

### M-1: Apple Sign-In Nonce Uses `Math.random()` Fallback

**File:** `apps/mobile-salvaged/lib/auth/apple.ts` (lines 11-19)

```typescript
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  const g = globalThis as { crypto?: ... };
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  ...
}
```

The nonce generator falls back to `Math.random()` when `crypto.getRandomValues` is unavailable. `Math.random()` is **not cryptographically secure** — its output is predictable and could allow nonce replay attacks against Apple Sign-In. In practice, React Native's Hermes engine provides `crypto.getRandomValues`, so the fallback may never execute. However, relying on a weak fallback in a security-critical path is dangerous.

**Remediation:** Remove the `Math.random()` fallback entirely. If `crypto.getRandomValues` is not available, throw an error rather than using a weak PRNG.

---

### M-2: Loans Real-time Subscription Does Not Filter by `lender_id` in LendleeProvider

**File:** `apps/mobile-salvaged/providers/LendleeProvider.tsx` (line 179-202)

The `loans_changes` subscription in `LendleeProvider` subscribes to `{ event: '*', schema: 'public', table: 'loans' }` **without** a `filter` parameter for `lender_id`. While RLS on the database side prevents unauthorized data from being returned via the initial `select`, the realtime subscription may attempt to push events for all loans. Supabase Realtime respects RLS for `postgres_changes`, so this is not a direct data leak — but it is wasteful and inconsistent with how `items_changes` and `contacts_changes` are filtered.

The separate `useLoansRealtime` hook correctly filters: `filter: 'lender_id=eq.${userId}'`.

**Remediation:** Add `filter: \`lender_id=eq.${user.id}\`` to the loans subscription in `LendleeProvider.tsx` to match the pattern used elsewhere.

---

### M-3: No Certificate Pinning

No SSL/TLS certificate pinning is implemented for Supabase API connections. While Supabase uses HTTPS by default and React Native enforces system trust stores, a compromised CA or enterprise MITM proxy could intercept API traffic.

For a personal lending app, this is medium risk. Apple does not require pinning, and it can cause issues when certificates rotate.

**Remediation (optional):** Consider implementing certificate pinning for the Supabase endpoint using a library like `react-native-ssl-pinning` if the threat model includes corporate MITM. For most consumer apps, this is acceptable as-is.

---

### M-4: No Rate Limiting on Client-Side RPC Calls

There is no client-side throttle on the `lend_item` RPC or other write operations. A determined attacker who reverse-engineers the anon key could spam the API, creating thousands of items and loans. Supabase provides some built-in rate limiting, but the defaults are generous.

**Remediation:** Configure Supabase's built-in rate limiting or add an Edge Function as a proxy for write operations. Client-side debouncing (which the code does via `submitting` state flags) prevents accidental double-taps but not intentional abuse.

---

## LOW Issues

### L-1: Console Logging of Auth Errors in Production

Multiple files log authentication errors and Supabase responses via `console.error` and `console.warn`:
- `lib/auth/apple.ts` — logs Supabase exchange failure messages
- `lib/auth/google.ts` — logs play services errors and exchange failures
- `lib/auth/session.ts` — logs `getSession` failures
- `providers/AuthProvider.tsx` — logs profile creation errors

In a production React Native build, these logs are accessible via device debugging tools (Xcode console, `adb logcat`). They could leak error messages containing email addresses or internal error codes.

**Remediation:** Strip `console.*` calls in production builds using a Babel plugin (`babel-plugin-transform-remove-console`) or wrap them in a `__DEV__` guard.

---

### L-2: AsyncStorage Used for Non-Sensitive Preferences (Acceptable)

AsyncStorage is used for:
- Notification IDs (`lendlee:notification:*`)
- Skip-preview preference (`lendlee.skipPreview`)
- Last-used SMS tone (`lendlee.lastUsedTone`)
- Reminders enabled flag (`lendlee.remindersEnabled`)

None of these are sensitive. Auth tokens are correctly stored in SecureStore (iOS Keychain / Android Keystore). This is the correct pattern.

**Status:** Acceptable — no action needed.

---

### L-3: `.env.example` Contains Real Supabase URL

**File:** `apps/mobile-salvaged/.env.example`

If this file mirrors `.env`, it may contain real project URLs. Example files should use placeholder values.

**Remediation:** Verify `.env.example` uses placeholder values like `https://YOUR_PROJECT.supabase.co`.

---

## PASS Items (Checked and Found Secure)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| P-1 | **Auth Token Storage** | PASS | Tokens stored in `expo-secure-store` (iOS Keychain / Android Keystore), not AsyncStorage. Correct implementation in `lib/supabase.ts` and `lib/auth/session.ts`. |
| P-2 | **Row Level Security (RLS)** | PASS | RLS enabled on all 5 tables (profiles, items, contacts, loans, gives). Policies correctly use `auth.uid()` for ownership checks. Loans/gives use subqueries through items for ownership verification. |
| P-3 | **Input Validation** | PASS | Login screen validates email format and enforces 8-char minimum password. `submitLend()` validates required fields. SMS templates use template literals (not string concatenation), preventing injection. Item titles are trimmed. |
| P-4 | **No XSS / Injection Vectors** | PASS | No `WebView`, `innerHTML`, `eval()`, or `dangerouslyAllowBrowser` found. React Native's `Text` component auto-escapes content. Supabase SDK uses parameterized queries. |
| P-5 | **Auth Flow Implementation** | PASS | Apple Sign-In uses nonce-based flow with `signInWithIdToken`. Google Sign-In correctly exchanges ID token. Email auth trims input and handles confirmation flow. Session auto-refresh on app foreground. |
| P-6 | **SMS Security** | PASS | SMS messages are composed via the native `expo-sms` composer — the app never sends SMS directly. Messages use template literals with `clean()` function to trim inputs. No user data is sent to third-party SMS APIs. |
| P-7 | **Navigation Guards** | PASS | `_layout.tsx` enforces auth gate: unauthenticated users are redirected to `/login`, authenticated users are redirected away from auth screens. |
| P-8 | **HTTPS Enforcement** | PASS | Supabase URL uses `https://`. No `http://` endpoints found in production code. React Native enforces ATS (App Transport Security) on iOS by default. |
| P-9 | **lend_item RPC Security** | PASS | Uses `SECURITY INVOKER` (RLS applies), sets `search_path = public`, revokes access from `PUBLIC` role, grants only to `authenticated`. Atomic transaction prevents partial writes. |
| P-10 | **Contacts Permission Handling** | PASS | Contacts permission is requested contextually (when user navigates to lend screen), not on app launch. `NSContactsUsageDescription` string explains usage. Contact data stays on-device — only name + phone of the selected contact is used for the SMS. |
| P-11 | **Notifications** | PASS | Local-only push notifications via `expo-notifications`. No remote notification server. Permission requested only when needed. Notification content does not leak sensitive data. |
| P-12 | **App Transport Security** | PASS | `ITSAppUsesNonExemptEncryption` set to `false` (correct for apps using only system TLS). No ATS exceptions in `infoPlist`. |

---

## OWASP Mobile Top 10 Assessment

| # | Category | Status | Notes |
|---|----------|--------|-------|
| M1 | Improper Credential Usage | **WARN** | Hardcoded keys (C-1, H-1). Auth tokens properly secured (P-1). |
| M2 | Inadequate Supply Chain Security | **OK** | `npm audit` shows only low/moderate issues in dev dependencies (esbuild, @tootallnate/once). No critical CVEs in production deps. |
| M3 | Insecure Authentication/Authorization | **OK** | Auth via Supabase GoTrue with Apple/Google/Email. RLS enforced. Session management via SecureStore. |
| M4 | Insufficient Input/Output Validation | **OK** | Input trimmed and validated. No raw SQL. Parameterized queries via Supabase SDK. |
| M5 | Insecure Communication | **OK** | HTTPS only. No certificate pinning (M-3), acceptable for this threat model. |
| M6 | Inadequate Privacy Controls | **OK** | Contacts accessed contextually with clear permission string. No analytics or tracking SDKs detected. |
| M7 | Insufficient Binary Protections | **INFO** | Standard Expo/React Native build. JS bundle is not obfuscated (typical for RN apps). Consider Hermes bytecode compilation (already default in Expo 52). |
| M8 | Security Misconfiguration | **WARN** | SECURITY DEFINER functions without search_path (H-2, H-3). |
| M9 | Insecure Data Storage | **OK** | Auth tokens in SecureStore. Only non-sensitive preferences in AsyncStorage. |
| M10 | Insufficient Cryptography | **WARN** | Math.random() fallback in nonce generator (M-1). |

---

## App Store Compliance Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Privacy Manifest (`PrivacyInfo.xcprivacy`) | PASS | Present in `Lendlee.app/`. Multiple framework-level privacy manifests also present (GoogleSignIn, AsyncStorage, etc.). |
| `NSContactsUsageDescription` | PASS | Set with clear, user-friendly description. |
| `ITSAppUsesNonExemptEncryption` | PASS | Set to `false`. |
| No embedded secrets in binary | **FAIL** | Supabase anon key hardcoded in source (C-1). While anon keys are designed to be public, Apple reviewers may flag this in automated scans. |
| Data Collection Declarations | **ACTION** | Verify App Store Connect "App Privacy" section declares: Contacts (used for lending), Email (auth), Name (auth). No tracking or advertising data collected. |

---

## Recommended Remediation Priority

### Before App Store Submission (Blockers)
1. **C-1:** Move Supabase credentials to env vars / `expo-constants`.
2. **C-2:** Rotate BrowserStack access key, remove from `.env`.
3. **H-2:** Add `search_path` and `auth.uid()` check to `get_user_stats`.
4. **H-3:** Add `search_path` to trigger functions.

### Should Fix Soon
5. **H-1:** Remove hardcoded Google OAuth fallback values.
6. **M-1:** Remove `Math.random()` fallback in nonce generator.
7. **M-2:** Add `lender_id` filter to loans realtime subscription.
8. **L-1:** Strip console logs in production builds.

### Nice to Have
9. **M-3:** Certificate pinning (optional for this app class).
10. **M-4:** Server-side rate limiting on write operations.

---

## Files Reviewed

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client initialization |
| `lib/auth/apple.ts` | Apple Sign-In flow |
| `lib/auth/google.ts` | Google Sign-In flow |
| `lib/auth/email.ts` | Email/password authentication |
| `lib/auth/session.ts` | Session management hook |
| `lib/sms/sendSms.ts` | SMS sending via expo-sms |
| `lib/sms/templates.ts` | SMS message templates |
| `lib/sms/reminderTemplates.ts` | Reminder SMS templates |
| `lib/sms/lenderExperience.ts` | Veteran lender logic |
| `lib/lend/submitLend.ts` | Lend flow orchestrator |
| `lib/db/lendItem.ts` | Database RPC wrapper |
| `lib/db/useLoansRealtime.ts` | Realtime loans hook |
| `lib/notifications/scheduleReminder.ts` | Local notification scheduling |
| `lib/permissions/contacts.ts` | Contacts permission handling |
| `providers/AuthProvider.tsx` | Auth context provider |
| `providers/LendleeProvider.tsx` | Data context provider |
| `app/_layout.tsx` | Root layout with auth guard |
| `app/login.tsx` | Login screen |
| `app/loan-detail.tsx` | Loan detail screen |
| `app/(tabs)/lend.tsx` | Lend flow screen |
| `app/(tabs)/profile/index.tsx` | Profile screen |
| `app/(tabs)/(home)/index.tsx` | Home screen |
| `app/add-item.tsx` | Add item screen |
| `app.json` | Expo configuration |
| `eas.json` | EAS Build configuration |
| `.env` | Environment variables |
| `.gitignore` | Git ignore rules |
| `package.json` | Dependencies |
| `types/supabase.ts` | Database type definitions |
| `supabase/migrations/*.sql` | All 3 migration files |
| `supabase/config.toml` | Local Supabase configuration |

---

*Audit conducted by Tyson — Security/Pentest Specialist*
*Report generated: 2026-05-02*
