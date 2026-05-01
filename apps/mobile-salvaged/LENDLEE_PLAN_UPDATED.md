# Lendlee — Updated Plan (2026-05-01)

## Where We Are

### Task Completion: 36/36 merged (100%)

| Phase | Tasks | Merged | Status |
|-------|-------|--------|--------|
| Phase 1: Implementation (001-020) | 20 | 20 | **Complete** |
| Phase 1.5: Testing Infrastructure (028-033) | 6 | 6 | **Complete** |
| Phase 2: QA Validation (021-027) | 7 | 7 | **Complete** |
| Phase 2b: Extended Coverage (034-036) | 3 | 3 | **Complete** |

### Test Results

| Platform | Local Simulator | TestingBot Cloud |
|----------|----------------|-----------------|
| **iOS** | **6/6 PASSED** | Needs credits (was 3/6, fixes proven locally) |
| **Android** | N/A (no local emulator used) | **6/6 PASSED** |

### Key Fixes Shipped (Apr 25 – Apr 30)

1. **Maestro `launchApp` command** — app wasn't launching on remote devices
2. **Supabase GoTrue NULL columns** — `email_change` NULL crashed Go scanner
3. **iOS tab bar selectors** — env var pattern (`"Lend.*tab, 2 of 4"`) replaces fragile coordinates
4. **iOS "Save Password?" dialog** — `"Not Now"` handler in login.yaml
5. **Contact form keyboard** — `pressKey: enter` + `scroll` reveals submit button behind keyboard
6. **`lend_item` RPC migration** — function was missing from Supabase production database
7. **Test suite zip structure** — parent folder required for BrowserStack/TestingBot
8. **Conditional login** — handles iOS Keychain session persistence across tests
9. **Modal testID workaround** — React Native Modal testIDs not in Android/iOS view hierarchy
10. **Veteran lender UI** — wired `getLenderExperience` into `lend.tsx` + skip-preview checkbox

### Supabase Database Health

| Issue | Status |
|-------|--------|
| NULL varchar columns in `auth.users` | Fixed |
| `lend_item` RPC function missing | Applied migration |
| PostgREST schema cache | Reloaded |
| Profiles table + RLS | Working |
| All 5 tables (profiles, items, contacts, loans, gives) | Healthy |

---

## What's Left

### All Tasks Complete

All 36 tasks merged as of 2026-05-01. QA timing results:

| QA Task | Target | Result | Status |
|---------|--------|--------|--------|
| LENDLEE-021 | Auth < 5s | Email: 304ms, ~1-2s E2E | **PASS** |
| LENDLEE-025 | iOS/Android parity | Report at `qa-reports/platform-parity.md` | **PASS** |
| LENDLEE-026 | First-time lender < 30s | Median: 16,959ms (17s) | **PASS** |
| LENDLEE-027 | Veteran lender < 15s | Median: 9,404ms (9.4s) | **PASS** |

### Immediate (this week)

**1. TestingBot subscription ($50/mo)**

Free trial credits exhausted. Subscribe to verify iOS cloud runs go 6/6 with the proven local fixes. Android already confirmed 6/6.

### Near-term (next 2 weeks)

**5. CI/CD integration**

Wire `scripts/build-and-test.sh` into GitHub Actions:
- On PR: run Maestro locally on macOS runner (free for public repos)
- On merge to main: trigger TestingBot cloud run on both platforms
- On EAS build complete: auto-upload to TestingBot + run

**6. App Store preparation**

| Item | Status |
|------|--------|
| App icons | Done (in assets/) |
| Splash screen | Done |
| Apple Developer account | Needed ($99/year) |
| Google Play Console | Needed ($25 one-time) |
| Privacy policy | Not started |
| Terms of service | Not started |
| App Store screenshots | Not started |
| App Store description | Not started |

**7. Production polish**

| Feature | Status | Priority |
|---------|--------|----------|
| Push notifications | Not started | Medium |
| Photo storage (Supabase Storage) | Not started | Medium |
| Offline mode | Basic (React Query cache) | Low |
| Error retry logic | Basic | Low |

### Launch checklist

```
Pre-launch:
  ✅ Core lend flow (WHO → WHAT → WHEN → SMS → Done)
  ✅ Email authentication
  ✅ Apple Sign-In code ready
  ✅ Google Sign-In code ready
  ✅ Supabase backend (5 tables, RLS, real-time)
  ✅ Automated tests (6 Maestro flows, both platforms)
  ✅ Veteran lender skip-preview
  ✅ QA timing validated (auth < 5s, first-lend 17s < 30s, veteran 9.4s < 15s)
  ✅ Platform parity report
  ⬜ TestingBot iOS cloud verification ($50/mo subscription needed)
  ⬜ Privacy policy
  ⬜ Terms of service
  ⬜ App Store screenshots
  ⬜ Apple Developer enrollment
  ⬜ Google Play enrollment
  ⬜ TestFlight beta distribution
  ⬜ Final user testing (3-5 friends)
```

---

## Architecture Summary

```
React Native / Expo 52
├── Expo Router (file-based navigation)
├── 16 screens
├── Supabase client (auth + database + real-time)
├── expo-secure-store (session persistence)
├── expo-sms (SMS composer)
├── expo-contacts (contact picker)
└── expo-apple-authentication + @react-native-google-signin

Supabase (lendlee-v1, us-west-1)
├── Auth (email + Apple + Google)
├── Database: profiles, items, contacts, loans, gives
├── RPC: lend_item() atomic function
├── RLS: user isolation on all tables
└── Real-time subscriptions

Testing
├── Maestro flows (6 YAML files)
├── TestingBot cloud ($50/mo) — Android 6/6, iOS pending
├── Local simulator testing (free, 6/6 iOS)
├── Env vars: APP_ID, TAB_LEND, TAB_PROFILE, TAB_HOME
├── Unit tests: 33 passing (lenderExperience + SmsPreviewModal)
└── Scripts: browserstack-run.sh, seed-qa-user.sh, validate-maestro-flows.sh
```

---

## Budget

| Item | Cost | Status |
|------|------|--------|
| Supabase (Free tier) | $0/mo | Active |
| TestingBot (Automated plan) | $50/mo | Trial expired, subscribe |
| GitHub | $0/mo | Active |
| EAS Build (Free tier) | $0/mo | Active |
| Apple Developer | $99/year | Not enrolled |
| Google Play | $25 one-time | Not enrolled |
| **Total to launch** | **$174 one-time + $50/mo** | |

---

## Recommended Execution Order

```
---

## Test Video Links (Auth Required)

### TestingBot — Android 6/6 PASSED (2026-04-27)

Project ID: `36073` | Run ID: `40315` | Platform: Pixel 8, Android 14

Access via: `https://api.testingbot.com/v1/app-automate/maestro/36073/40315`
Dashboard: `https://app.testingbot.com`

| Test | Status | Duration |
|------|--------|----------|
| auth-flow | PASS | 21s |
| login | PASS | 22s |
| lend-flow | PASS | 57s |
| home-smoke | PASS | 32s |
| lend-flow-allow-contacts | PASS | 58s |
| lend-flow-deny-contacts | PASS | 65s |

### TestingBot — iOS 3/6 (pre-fix, 2026-04-27)

Project ID: `36082` | Run ID: `39850` | Platform: iPhone 15, iOS 17

| Test | Status | Duration | Notes |
|------|--------|----------|-------|
| auth-flow | PASS | 17s | |
| login | PASS | 19s | |
| home-smoke | PASS | 26s | |
| lend-flow | FAIL | 41s | Fixed locally — tab selectors + keyboard + migration |
| lend-flow-allow-contacts | FAIL | 38s | Fixed locally |
| lend-flow-deny-contacts | FAIL | 43s | Fixed locally |

### Local iOS Simulator — 6/6 PASSED (2026-04-30)

All fixes verified locally on iPhone 17 Pro simulator, iOS 26.4. Logs at:
`~/.maestro/tests/2026-04-30_134348/`

| Test | Duration |
|------|----------|
| login | 11s |
| auth-flow | 11s |
| home-smoke | 25s |
| lend-flow | 39s |
| lend-flow-allow-contacts | 40s |
| lend-flow-deny-contacts | 43s |

### BrowserStack — Historical (2026-04-25 to 2026-04-26)

Full build history with video URLs in `apps/mobile-salvaged/browserstack-builds.csv` (33 builds).

Key passing builds:
- **Android 4/4:** `87ba20244686c29bfec1cf7c2f3c505093aac226` — video URLs in CSV
- **iOS 3/4:** `e77f3b93ced04bdc6c184b6c741537b053e609e3` — video URLs in CSV

To download BrowserStack videos:
```bash
source apps/mobile-salvaged/.env
curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" "<VIDEO_URL>" -o video.mp4
```

To access TestingBot results:
```bash
curl -u "48ef5174ece171e054f650dafe4a7b93:2554b71a60d382fbb4779ad469fe9b13" \
  "https://api.testingbot.com/v1/app-automate/maestro/<PROJECT_ID>/<RUN_ID>"
```

### Env Vars for Test Runs

**iOS:**
```
APP_ID=me.lendlee.ios
TAB_LEND=Lend.*tab, 2 of 4
TAB_PROFILE=Profile.*tab, 4 of 4
TAB_HOME=My Items.*tab, 1 of 4
```

**Android:**
```
APP_ID=me.lendlee.app
TAB_LEND=Lend
TAB_PROFILE=Profile
TAB_HOME=My Items
```

---

## Recommended Execution Order

Week 1 (now):
  1. Merge LENDLEE-015, 031, 032, 034, 035, 036 (update statuses)
  2. Subscribe to TestingBot ($50/mo)
  3. Run iOS cloud verification → confirm 6/6
  4. Dispatch Batch 3: LENDLEE-021, 025, 026
  5. After 026: dispatch LENDLEE-027

Week 2:
  6. Set up GitHub Actions CI
  7. Privacy policy + Terms of service
  8. Apple Developer enrollment ($99)
  9. Google Play enrollment ($25)

Week 3:
  10. App Store screenshots + description
  11. TestFlight beta → 3-5 friends
  12. Iterate on feedback

Week 4:
  13. App Store submission
  14. Play Store submission
  15. Launch 🚀
```
