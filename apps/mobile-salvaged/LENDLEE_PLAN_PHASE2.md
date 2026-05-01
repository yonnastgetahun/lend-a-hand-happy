# LENDLEE Phase 2 — Testing Infrastructure + Completion

**Date:** 2026-04-27
**Plan ID:** LENDLEE-PLAN-2026-04-27
**Goal:** Ship 27/27 tasks to 100% and establish the testing infrastructure the original plan missed.

---

## Lessons Incorporated

These tasks are designed to prevent the six gaps found during the Apr 25-26 QA session:

1. **Remote ≠ local** — Every Maestro flow must include `launchApp` and handle BrowserStack real-device behavior
2. **Test data via API, not SQL** — QA fixtures created through Auth API to avoid NULL column crashes
3. **Infrastructure before QA** — Testing infra tasks come before QA validation tasks
4. **Platform parity includes test automation** — iOS and Android render tab bars differently; tests must account for this
5. **Diagnosis workflow built in** — Each task includes how to retrieve BrowserStack logs/video when it fails
6. **Single suite, multiple platforms** — All flows use `${APP_ID}` env var, zip must have parent folder

---

## Phase Structure

```
Phase 1.5: Testing Infrastructure (LENDLEE-028 → 032)
  ↓
Phase 2a: Final Implementation (LENDLEE-033)
  ↓
Phase 2b: QA Validation (LENDLEE-021, 025, 026, 027 — updated)
  ↓
Phase 2c: Extended Test Coverage (LENDLEE-034 → 036)
```

---

## Phase 1.5: Testing Infrastructure

### LENDLEE-028: BrowserStack test runner script

**Priority:** high
**Dependencies:** none
**Context files:** `apps/mobile-salvaged/.maestro/`, `apps/mobile-salvaged/.env`

#### Acceptance Criteria
- [ ] Shell script `scripts/browserstack-run.sh` accepts `--platform ios|android|both` and `--suite <path>`
- [ ] Script packages `.maestro/*.yaml` into a parent-folder zip (NOT flat — BrowserStack requires `lendlee-tests/` wrapper)
- [ ] Script uploads test suite via `POST /app-automate/maestro/v2/test-suite`
- [ ] Script triggers build via `POST /app-automate/maestro/v2/{ios|android}/build` with `setEnvVariables: {APP_ID: <bundle_id>}`
- [ ] Script polls `GET /app-automate/maestro/v2/builds/{id}` until complete
- [ ] Script prints per-test pass/fail summary with video URLs on completion
- [ ] Credentials read from `.env` (`BROWSERSTACK_USERNAME`, `BROWSERSTACK_ACCESS_KEY`), never hardcoded

#### QA
- test_command: `bash scripts/browserstack-run.sh --platform android --suite .maestro`
- manual: Run the script; verify it outputs test names, statuses, durations, and clickable video URLs

#### Debug
- If zip structure wrong (tests skip or only 1 runs): check `unzip -l` output — files must be inside `lendlee-tests/` folder, not at root
- If builds get "skipped" status: the `execute` param paths don't match zip contents — omit `execute` and let BrowserStack auto-discover
- If API returns HTML instead of JSON: you're hitting `api.browserstack.com` instead of `api-cloud.browserstack.com` for management endpoints
- Video/log URLs use `api.browserstack.com` (no `-cloud`), management uses `api-cloud.browserstack.com` — don't confuse them

#### Instructions
Create `scripts/browserstack-run.sh`. Read credentials from `.env`. Accept `--platform` and `--suite` flags. Package the suite directory into a zip with a `lendlee-tests/` parent folder. Upload via the Maestro v2 API. Trigger the build with `deviceLogs: true, video: true`. Set `APP_ID` env var to `me.lendlee.ios` for iOS or `me.lendlee.app` for Android. Poll until completion. Parse the session details API to extract per-test results and video URLs. Print a summary table.

---

### LENDLEE-029: Test data provisioning script

**Priority:** high
**Dependencies:** none
**Context files:** `apps/mobile-salvaged/lib/supabase.ts`, `apps/mobile-salvaged/.env`

#### Acceptance Criteria
- [ ] Script `scripts/seed-qa-user.sh` creates the QA test account via the Supabase Auth Admin API (NOT direct SQL insert)
- [ ] Account email: `qa@lendlee.test`, password: `Lendlee-QA-2026!`, name: `QA Tester`
- [ ] Email is auto-confirmed (no email verification required)
- [ ] Profile row exists in `public.profiles` after creation
- [ ] Script is idempotent — running it twice doesn't error or create duplicates
- [ ] Script verifies the account works by calling `POST /auth/v1/token?grant_type=password` and checking for `access_token`
- [ ] No NULL values in any `auth.users` varchar columns (the GoTrue Go scanner crashes on NULL → string)

#### QA
- test_command: `bash scripts/seed-qa-user.sh && echo "SUCCESS"`
- manual: Run script, then sign in with `qa@lendlee.test` / `Lendlee-QA-2026!` in the app

#### Debug
- If login returns "Database error querying schema": a varchar column in `auth.users` is NULL — run `SELECT id, email, email_change IS NULL, phone IS NULL, email_change_token_new IS NULL, recovery_token IS NULL FROM auth.users WHERE email = 'qa@lendlee.test'` and fix with `UPDATE auth.users SET <col> = '' WHERE <col> IS NULL`
- If profile doesn't exist: the Auth Admin API `createUser` may not trigger the `handle_new_user` database function — create the profile row explicitly after user creation
- The Supabase project URL is `https://divwsajiaxklbuehnzek.supabase.co` and the anon key is in `lib/supabase.ts` — but for admin operations you need the `service_role` key from the Supabase dashboard

#### Instructions
Create `scripts/seed-qa-user.sh`. Use `curl` against the Supabase Auth Admin API (`POST /auth/v1/admin/users`) with the service role key. Set `email_confirm: true` in the request body. After creating the user, query `public.profiles` to ensure a row exists (insert one if the trigger didn't fire). Verify by calling the token endpoint. Print the user ID and confirmation status.

---

### LENDLEE-030: Maestro flow validation checklist

**Priority:** high
**Dependencies:** none
**Context files:** `apps/mobile-salvaged/.maestro/*.yaml`

#### Acceptance Criteria
- [ ] Every `.yaml` flow in `.maestro/` starts with `appId: ${APP_ID}` (not a hardcoded bundle ID)
- [ ] Every flow that is an entry point (not just a helper) includes `- launchApp:` with `clearState: true`
- [ ] `login.yaml` handles both states: already-logged-in (Keychain session) and fresh login screen — via `runFlow: when: visible: "Sign In"`
- [ ] No flow uses `clearKeychain: true` (not supported on real iOS devices — confirmed in BrowserStack logs)
- [ ] Tab bar navigation uses `point:` coordinates at `93%` height (not `97%` which hits iOS home indicator)
- [ ] All flows that navigate to the Lend tab include a contacts permission dialog handler (`runFlow: when: visible: "Allow"`)
- [ ] `lend-flow.yaml` asserts SMS preview via `visible: "Preview message"` text (not `id: "sms-preview-modal"` — React Native Modal testID not exposed on Android)
- [ ] Validation script `scripts/validate-maestro-flows.sh` checks all of the above and exits non-zero on violation

#### QA
- test_command: `bash scripts/validate-maestro-flows.sh`
- manual: Read each `.yaml` file and verify against the checklist

#### Debug
- If `appId` is hardcoded: the flow will work on one platform but silently fail on the other — always use `${APP_ID}`
- If `clearKeychain` is present: tests will pass on simulators but the step is silently skipped on BrowserStack real devices (logged as WARN)
- If tab taps use `97%`: the tap hits the iOS home indicator area, not the tab bar

#### Instructions
Create `scripts/validate-maestro-flows.sh`. For each `.yaml` in `.maestro/`: grep for hardcoded `appId:` (should be `${APP_ID}`), check for `clearKeychain` (should not exist), verify `launchApp` presence in entry-point flows, check tab coordinates. Exit 1 with a clear message if any check fails. Also update any existing flows that violate these rules.

---

### LENDLEE-031: BrowserStack failure diagnosis runbook

**Priority:** medium
**Dependencies:** LENDLEE-028
**Context files:** `apps/mobile-salvaged/QA_REPORT.md`

#### Acceptance Criteria
- [ ] Document `docs/BROWSERSTACK_RUNBOOK.md` exists with step-by-step diagnosis workflow
- [ ] Covers: how to list builds, get session IDs, fetch Maestro logs, download videos, extract video frames
- [ ] Includes the two different API base URLs and when to use each (`api-cloud.browserstack.com` for management, `api.browserstack.com` for artifacts)
- [ ] Includes common failure patterns with solutions: app never launched (missing `launchApp`), auth 500 (NULL columns), tab tap miss (wrong coordinates), test isolation (Keychain persistence)
- [ ] Includes curl examples for every API call with `$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY` placeholders
- [ ] Includes `ffmpeg` command to extract video frames for visual diagnosis

#### QA
- manual: Follow the runbook on a failing build to verify each step works

#### Debug
- N/A — this IS the debug doc

#### Instructions
Write `docs/BROWSERSTACK_RUNBOOK.md` based on the diagnosis workflow discovered during the Apr 25-26 QA session. Structure as: 1) List builds, 2) Get build details, 3) Get session details, 4) Fetch per-test logs/video, 5) Common failure patterns. Include every curl command. Reference the QA_REPORT.md for historical context.

---

### LENDLEE-032: EAS build + BrowserStack upload script

**Priority:** medium
**Dependencies:** LENDLEE-028
**Context files:** `apps/mobile-salvaged/eas.json`, `apps/mobile-salvaged/package.json`

#### Acceptance Criteria
- [ ] Script `scripts/build-and-test.sh` triggers EAS builds for both platforms (`eas build --platform android --profile preview` and `--platform ios`)
- [ ] Script polls EAS until builds complete, then downloads artifacts (APK and IPA)
- [ ] Script uploads artifacts to BrowserStack via `POST /app-automate/upload`
- [ ] Script then calls `scripts/browserstack-run.sh --platform both` with the new app URLs
- [ ] End-to-end: one command goes from code → build → upload → test → results

#### QA
- test_command: `bash scripts/build-and-test.sh`
- manual: Run and verify both platforms build, upload, and test

#### Debug
- If EAS build fails: check `eas build:list` for error details; common issue is expired Apple certificates for iOS
- If BrowserStack upload fails: check file size — IPA must be < 500MB, APK < 500MB
- If tests fail on new build but passed on old: diff the two builds' test results to isolate the regression

#### Instructions
Create `scripts/build-and-test.sh`. Use `eas build --non-interactive --json` to get build IDs. Poll `eas build:list --json` until both complete. Download artifacts from the `applicationArchiveUrl` in the build JSON. Upload to BrowserStack. Pass the `bs://` URLs to `scripts/browserstack-run.sh`. Print final summary.

---

## Phase 2a: Final Implementation

### LENDLEE-033: Wire veteran lender logic into lend.tsx and SmsPreviewModal

**Priority:** critical
**Dependencies:** none (library `lib/sms/lenderExperience.ts` already complete with 17 passing tests)
**Context files:** `app/(tabs)/lend.tsx`, `components/lend/SmsPreviewModal.tsx`, `lib/sms/lenderExperience.ts`

#### Acceptance Criteria
- [ ] `lend.tsx` calls `getLenderExperience(userId)` on mount and stores result in state
- [ ] When `skipPreview === true`, tapping submit calls `sendSms` directly with `lastUsedTone` — modal never opens
- [ ] When `skipPreview === false`, tapping submit opens `SmsPreviewModal` as before (existing behavior preserved)
- [ ] `SmsPreviewModal` accepts an `isVeteran` boolean prop
- [ ] When `isVeteran === true`, a "Skip preview next time" checkbox appears below the tone selector
- [ ] When `isVeteran === false`, no checkbox is rendered
- [ ] Checking the box + tapping Send calls `setSkipPreviewSetting(true)` — persists the preference
- [ ] Unchecking the box + tapping Send calls `setSkipPreviewSetting(false)`
- [ ] The checkbox state defaults to the current `skipPreview` value (round-trips correctly)
- [ ] First-time lender (< 3 lends) NEVER skips preview, even if `skipPreview` AsyncStorage key is somehow set to true (the `getLenderExperience` composite already enforces this — verify it's respected in the UI)
- [ ] All existing unit tests still pass: `bun test lib/sms/lenderExperience.test.ts`
- [ ] All existing SMS preview tests still pass: `bun test components/lend/SmsPreviewModal.test.ts`

#### QA
- test_command: `bun test lib/sms/lenderExperience.test.ts && bun test components/lend/SmsPreviewModal.test.ts`
- manual: Complete 3 lends with the QA account. On the 4th lend, verify the "Skip preview next time" checkbox appears. Check it and send. On the 5th lend, verify the preview modal does NOT appear and the SMS is sent with the last-used tone.

#### Debug
- If checkbox never appears: `isVeteran` prop is not being passed from `lend.tsx` — check that `getLenderExperience` is called and its result wired to the modal's props
- If skip doesn't persist: `setSkipPreviewSetting` must be called in the `onSend` handler, not in the checkbox `onChange` — the AC says persist on Send, not on toggle
- If first-time lender skips preview: the `getLenderExperience` composite gates `skipPreview` behind `veteran && optedIn` — if the UI reads `skipPreview` directly from AsyncStorage instead of from `getLenderExperience`, it bypasses the gate
- If lend count is wrong: `getLendCount` queries `loans` joined to `items.owner_id`, NOT `items` directly — check the Supabase query
- Do NOT import `getLenderExperience` at the top level of `lend.tsx` — call it inside a `useEffect` so it doesn't block the initial render

#### Instructions
In `lend.tsx`: import `getLenderExperience` and `setSkipPreviewSetting` from `lib/sms/lenderExperience`. Add a `useEffect` that calls `getLenderExperience(user.id)` on mount and stores the result in state (`lenderExp`). In the submit handler, add a branch: if `lenderExp.skipPreview && lenderExp.lastUsedTone`, call `submitLend` then `sendSms` directly with `lenderExp.lastUsedTone`, bypassing the modal. Otherwise, open the modal as before. Pass `isVeteran: lenderExp.isVeteran` as a prop to `SmsPreviewModal`.

In `SmsPreviewModal.tsx`: add `isVeteran?: boolean` to the props. When `isVeteran` is true, render a checkbox below the tone segmented control: "Skip preview next time". The checkbox state defaults to the current `skipPreview` value (passed as another prop or read from AsyncStorage on mount). In `handleSend`, if the checkbox is checked, call `setSkipPreviewSetting(true)` before calling `onSend`. If unchecked, call `setSkipPreviewSetting(false)`.

---

## Phase 2b: QA Validation (Updated)

These are the existing blocked tasks, updated with BrowserStack infrastructure context. They are **unblocked once LENDLEE-033 is merged**.

### LENDLEE-021 (updated): QA — Auth timing via BrowserStack

**Dependencies:** LENDLEE-033, LENDLEE-028
**Additional context from QA session:**
- Email auth is confirmed working on BrowserStack (both platforms)
- Apple and Google Sign-In cannot be tested on BrowserStack (require real device credentials / interactive OAuth)
- Measure email auth timing from Maestro logs (timestamps are in the Maestro log output)

**Updated AC:**
- [ ] Email auth timing extracted from BrowserStack Maestro logs (`login.yaml` execution time)
- [ ] Email auth completes in < 5s on both iOS and Android (measure from `Launch app COMPLETED` to `Assert "My Items" COMPLETED`)
- [ ] Apple and Google timing measured manually on physical device (cannot be automated on BrowserStack)
- [ ] Report at `qa-reports/auth-timing.md` with BrowserStack build IDs, Maestro log timestamps, and manual timings

---

### LENDLEE-025 (updated): QA — Platform parity via BrowserStack

**Dependencies:** LENDLEE-033, LENDLEE-028
**Additional context from QA session:**
- BrowserStack video recordings ARE the side-by-side comparison — download iOS and Android videos for the same flow
- Known parity issues: iOS tab bar text not in Maestro view hierarchy (Android exposes it), iOS Keychain not clearable on real devices
- `lend-flow` passes on Android but fails on iOS at tab navigation — this IS a parity finding

**Updated AC:**
- [ ] All 4 Maestro flows run on both iOS (iPhone 15) and Android (Pixel 8) via `scripts/browserstack-run.sh --platform both`
- [ ] Video recordings from both platforms reviewed and compared (use `ffmpeg` to extract matching frames)
- [ ] Known iOS-specific issues documented: Keychain persistence, tab bar text not in view hierarchy, coordinate-based tap sensitivity
- [ ] Report at `qa-reports/platform-parity.md` with BrowserStack build IDs, video URLs, and frame-by-frame comparison for any differences found
- [ ] Any new parity issues added to `QA_FIX_LIST.md`

---

### LENDLEE-026 (updated): QA — First-time lender timing via BrowserStack

**Dependencies:** LENDLEE-033, LENDLEE-028
**Additional context from QA session:**
- The `lend-flow.yaml` Maestro flow IS the first-time lender E2E test
- Timing can be extracted from Maestro log timestamps (each step is timestamped)
- BrowserStack adds ~2-3s overhead per test for device setup — subtract this from total

**Updated AC:**
- [ ] `lend-flow.yaml` runs on BrowserStack with a user who has 0 prior lends
- [ ] Total flow time (from `Launch app` to `notVisible: "Preview message"`) is under 30 seconds
- [ ] Run 3 times on Android (where lend-flow passes reliably); record each timing
- [ ] Median of 3 runs < 30s
- [ ] Per-step timing breakdown extracted from Maestro logs (WHO, WHAT, WHEN, Preview, Send)
- [ ] Report at `qa-reports/first-lend-timing.md` with build IDs, per-step times, and median

---

### LENDLEE-027 (updated): QA — Veteran lender timing via BrowserStack

**Dependencies:** LENDLEE-033, LENDLEE-026
**Additional context from QA session:**
- Requires LENDLEE-033 (veteran skip-preview) to be wired into the UI
- Need to seed 3 completed loans for the QA user before running the test
- Need a new Maestro flow `lend-flow-veteran.yaml` that sets `skipPreview` via the UI first

**Updated AC:**
- [ ] New Maestro flow `lend-flow-veteran.yaml` exists for the skip-preview path
- [ ] QA user has ≥3 completed lends seeded via `scripts/seed-qa-user.sh` (or a companion `scripts/seed-veteran-loans.sh`)
- [ ] `skipPreview` is enabled by first running a lend with the checkbox checked
- [ ] Subsequent lend completes without the preview modal appearing
- [ ] Total flow time (from Lend tab tap to SMS sent) is under 15 seconds
- [ ] Run 3 times on Android; median < 15s
- [ ] Report at `qa-reports/veteran-lend-timing.md` with build IDs and timings

---

## Phase 2c: Extended Test Coverage

### LENDLEE-034: Contacts permission — Allow path

**Priority:** medium
**Dependencies:** LENDLEE-028, LENDLEE-030

#### Acceptance Criteria
- [ ] Maestro flow `lend-flow-allow-contacts.yaml` taps "Allow" on the contacts permission dialog
- [ ] After allowing, "Add new contact" row is still visible (BrowserStack devices have no contacts)
- [ ] Full lend flow completes via manual contact entry
- [ ] Flow passes on both iOS and Android
- [ ] If the dialog doesn't appear (permission already granted from a previous test), the flow still passes (the `when: visible: "Allow"` handler is conditional)

#### Debug
- If dialog never appears: `clearState: true` may have already reset it, or a previous test in the same session already granted it — the flow must handle both cases
- If "Allow" button text doesn't match: iOS uses "Allow", Android may use "Allow" or "ALLOW" — check case sensitivity

---

### LENDLEE-035: Contacts permission — Don't Allow path

**Priority:** medium
**Dependencies:** LENDLEE-028, LENDLEE-030

#### Acceptance Criteria
- [ ] Maestro flow `lend-flow-deny-contacts.yaml` taps "Don't Allow" on the contacts permission dialog
- [ ] After denying, no crash, no infinite permission prompt loop
- [ ] "Add new contact" row is visible and functional
- [ ] "No contacts loaded yet" message is displayed
- [ ] Full lend flow completes via manual contact entry (name + phone)
- [ ] Flow passes on both iOS and Android
- [ ] No re-prompt for contacts permission on subsequent navigations to the Lend tab within the same test

#### Debug
- If app crashes after deny: check that the contacts query is wrapped in a try-catch and gracefully falls back to empty state
- If permission prompt loops: the code is calling `requestContactsPermission()` on every mount instead of checking `getContactsPermissionStatus()` first
- iOS text is "Don't Allow" (with smart quote apostrophe) — Maestro should match but verify if it doesn't

---

### LENDLEE-036: iOS lend-flow tab navigation fix

**Priority:** high
**Dependencies:** LENDLEE-028, LENDLEE-030

#### Acceptance Criteria
- [ ] `lend-flow.yaml` passes on iOS (currently 3/4 — this is the failing test)
- [ ] The Lend tab is reliably tappable after Keychain auto-login (the state where `clearState: true` doesn't clear the session)
- [ ] Solution works without requiring `clearKeychain` (not supported on real devices)
- [ ] Solution works cross-platform (doesn't break Android's 4/4 pass)

#### Approach options (try in order):
1. Investigate whether the contacts permission dialog at 25s is shifting the tab bar — extract frame at tap moment from video
2. Try `point: "37%,92%"` or `"37%,94%"` to see if slight Y adjustment fixes it
3. Add a `- scroll` down then `- scroll` up before the tab tap to force layout recalculation
4. Research BrowserStack `permissions` API parameter to pre-grant contacts, avoiding the dialog entirely

#### Debug
- The tap COMPLETES but doesn't navigate — Maestro thinks it tapped but the coordinate misses the Lend tab
- This only happens after Keychain auto-login, not after a full login flow — the tab bar renders at a slightly different Y position
- Video evidence: build `e77f3b93ced04bdc6c184b6c741537b053e609e3`, test `lend-flow`, ~18s mark
- Download video and extract frames at the tap moment to see exactly where the tap lands vs where the tab bar is

---

## Dependency Graph

```
LENDLEE-028 (BS runner script)
  ├── LENDLEE-031 (runbook) 
  ├── LENDLEE-032 (build + test script)
  ├── LENDLEE-034 (allow contacts)
  ├── LENDLEE-035 (deny contacts)
  └── LENDLEE-036 (iOS tab fix)

LENDLEE-029 (seed script) — independent

LENDLEE-030 (flow validation) — independent

LENDLEE-033 (wire veteran logic) — independent
  ├── LENDLEE-021 (auth timing)
  ├── LENDLEE-025 (platform parity)
  ├── LENDLEE-026 (first-time timing)
  └── LENDLEE-027 (veteran timing) ← also depends on LENDLEE-026
```

## Execution Order for Parallel Subagents

**Batch 1 (parallel — no dependencies):**
- LENDLEE-028 (BS runner script)
- LENDLEE-029 (seed script)
- LENDLEE-030 (flow validation)
- LENDLEE-033 (wire veteran logic)

**Batch 2 (after Batch 1):**
- LENDLEE-031 (runbook — needs 028)
- LENDLEE-032 (build + test — needs 028)
- LENDLEE-034 (allow contacts — needs 028, 030)
- LENDLEE-035 (deny contacts — needs 028, 030)
- LENDLEE-036 (iOS tab fix — needs 028, 030)

**Batch 3 (after Batch 2 + LENDLEE-033):**
- LENDLEE-021 (auth timing)
- LENDLEE-025 (platform parity)
- LENDLEE-026 (first-time timing)

**Batch 4 (after LENDLEE-026):**
- LENDLEE-027 (veteran timing)

## Success Definition

**Phase 2 is complete when:**
1. All 27 original LENDLEE tasks are merged (currently 22/27)
2. BrowserStack runs 4/4 green on Android AND 4/4 green on iOS
3. `scripts/browserstack-run.sh --platform both` produces a passing summary in one command
4. `qa-reports/` contains timing and parity reports with build IDs and video URLs
5. `docs/BROWSERSTACK_RUNBOOK.md` exists for future debugging
