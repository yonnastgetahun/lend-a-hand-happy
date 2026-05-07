# Lendlee Session Report — May 4, 2026

## What Was Done

### Security Audit (Tyson)
- Ran full security audit covering OWASP Mobile Top 10, Supabase auth, RLS, secrets, SMS, notifications
- Found 2 critical, 3 high, 4 medium, 3 low issues across 30+ files reviewed
- 12 checks passed (auth tokens, RLS, input validation, XSS, navigation guards, HTTPS, etc.)

### Security Fixes Applied
| Severity | Fix | Status |
|----------|-----|--------|
| CRITICAL | Supabase URL/key moved from hardcoded to `EXPO_PUBLIC_` env vars | Done |
| CRITICAL | BrowserStack credentials removed from `.env` (deprecated) | Done |
| HIGH | Google OAuth hardcoded fallback values removed | Done |
| HIGH | `get_user_stats` RPC locked to `auth.uid()` + `search_path` set | Done + migrated |
| HIGH | `handle_new_user` / `handle_user_update` triggers set `search_path` | Done + migrated |
| MEDIUM | Apple Sign-In nonce `Math.random()` fallback replaced with throw | Done |
| MEDIUM | Loans realtime subscription filtered by `lender_id` | Done |

### Expo SDK Upgrade
- Upgraded from SDK 52 to SDK 54 (React 18→19, React Native 0.76→0.81)
- Required because Apple now mandates iOS 26 SDK (Xcode 26) as of April 28, 2026

### EAS Environment Variables
- Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in EAS production environment
- Root cause of first App Store rejection (crash on launch): `.env` is gitignored, so cloud builds had no credentials

### App Store Submission (iOS)
- Build 1.0.7: Submitted, rejected — crash on launch (missing env vars)
- Build 1.0.8: Submitted, rejected — 3 guideline violations (see below)
- Build 1.0.9: Fixes applied, uploaded to App Store Connect, **not yet submitted for review**

### App Store Rejection Fixes (Build 1.0.9)
1. **Guideline 5.1.1(v)** — Added "Delete Account" button in Profile screen with `delete_user_account()` RPC that removes all user data + auth record
2. **Guideline 5.1.1(ii)** — Added `NSCameraUsageDescription` with specific usage example
3. **Guideline 5.1.1(iv)** — Removed camera permission denial re-prompt alert

### Play Store Setup (Android)
- Created app listing in Google Play Console
- Filled out data safety form (name, email, contacts)
- Uploaded feature graphic (1024x500) and screenshots
- Service account key created and linked to EAS
- Android builds completed (SDK 52 and SDK 54)

### Other
- Resized iOS screenshots from 1320x2868 to 1284x2778 (Apple-accepted dimensions)
- Created demo review account: `review@lendlee.app` / `Lendlee2026!`
- Set up email forwarding: `hello@lendlee.app` → Gmail
- Generated Play Store feature graphic with brand assets
- Wrote App Store reviewer notes with demo account and testing instructions

---

## What We Learned

1. **EAS cloud builds don't have access to `.env` files** — env vars must be set via `eas env:create` for production builds. Our security fix (throwing on missing env vars) exposed this immediately as a crash on launch.

2. **Apple requires iOS 26 SDK (Xcode 26) since April 28, 2026** — Expo SDK 52 only supports up to iOS 18.2 SDK. Upgrade to SDK 54 was mandatory.

3. **Google Play requires 12 testers for 14 continuous days** before new personal developer accounts can publish to production. This was not flagged during planning and adds ~3 weeks to the Android timeline.

4. **Apple App Store reviewers test on iPad** (iPad Air 11-inch M3 in our case) — even for iPhone-only apps. Ensure the app works on iPad even with `supportsTablet: false`.

5. **Apple requires account deletion** (guideline 5.1.1v) — any app with account creation must offer full account deletion. Not just logout or deactivation.

6. **Camera purpose strings must be specific** — generic strings like "Camera access is required" get rejected. Must include a concrete example of how the camera is used.

7. **Don't re-prompt after permission denial** — Apple considers it pressuring the user. If denied, silently fail or show a non-intrusive message without asking to reconsider.

8. **Provisioning profiles need Push Notifications entitlement** — adding `expo-notifications` requires regenerating the provisioning profile with the `aps-environment` entitlement.

---

## Outstanding

### Immediate (iOS)
- [ ] Submit build 1.0.9 for App Store review (uploaded, not yet submitted)
- [ ] Record screen recording of account deletion flow (Apple requires this in review notes)
- [ ] Recreate demo account `review@lendlee.app` (may have been deleted during testing)

### Android (Blocked ~14 days)
- [ ] Set up closed testing track in Play Console
- [ ] Upload SDK 54 `.aab` to closed testing (`~/Downloads/lendlee-1.0.0-v2.aab`)
- [ ] Recruit 12 testers and share opt-in link
- [ ] Wait 14 days with testers opted in
- [ ] Apply for production access (~May 20)
- [ ] Google reviews application (~7 days)
- [ ] Publish to production (~May 27)

### Post-Launch
- [ ] Replace placeholder store badge links on website with real store URLs
- [ ] Verify DNS propagation: `lendlee.app` → Vercel
- [ ] Fix reminder-flow Maestro test (timing issue, not app bug)
- [ ] Strip `console.*` calls in production builds
- [ ] Configure Supabase rate limiting on write RPCs
- [ ] Commit outstanding unstaged files (eas.json, package.json, bun.lock, screenshots)
