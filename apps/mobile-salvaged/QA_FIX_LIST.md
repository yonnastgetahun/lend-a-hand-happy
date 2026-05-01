# Lendlee QA — Outstanding Fix List

**Date:** 2026-04-27
**Current Status:** Android 4/4, iOS 3/4

---

## Priority 0 — Implementation Blocker

### FIX-000: LENDLEE-015 — Wire veteran lender logic into UI

**Problem:** `lib/sms/lenderExperience.ts` is fully implemented and tested (17 unit tests pass) but **never imported by any UI component**. The library is dead code. Every lender — first-time or veteran — always sees the SMS preview modal. No "Skip preview next time" checkbox exists.

**What exists:**
- `isVeteranLender(userId)` — queries loans count via Supabase, threshold at ≥3
- `getSkipPreviewSetting()` / `setSkipPreviewSetting()` — AsyncStorage persistence
- `getLenderExperience(userId)` — composite read, gates skipPreview behind veteran status
- `getLastUsedTone()` / `setLastUsedTone()` — tone persistence
- 17 unit tests covering threshold, persistence, errors, and composite logic

**What's missing:**
1. **`app/(tabs)/lend.tsx`** — needs to call `getLenderExperience(userId)` on mount. If `skipPreview === true`, bypass the modal and call `sendSms` directly with `lastUsedTone`.
2. **`components/lend/SmsPreviewModal.tsx`** — needs a "Skip preview next time" checkbox, visible only when `isVeteran` prop is true. On send, calls `setSkipPreviewSetting(true)` if checked.

**Groker task:** LENDLEE-015 (status: blocked — stale, dependency LENDLEE-013 merged 2026-04-23)

**Blocks:** LENDLEE-021 (auth timing QA), LENDLEE-026 (first-time lender timing), LENDLEE-027 (veteran lender timing)

**Status:** Library done. UI wiring needed (~2 hours of work).

---

## Blocked Task Status Update (as of 2026-04-27)

The original report identified 5 blocked tasks. Here's the updated status after this QA session:

| Task | Title | Was Blocked By | Current Status |
|------|-------|---------------|----------------|
| LENDLEE-015 | Veteran SMS tone logic | LENDLEE-013 (merged) | **Unblocked** — library done, UI wiring needed |
| LENDLEE-021 | QA: 3 auth methods < 5s | LENDLEE-015 | Blocked — needs LENDLEE-015 UI wiring |
| LENDLEE-025 | QA: iOS/Android parity | LENDLEE-015 | **Partially unblocked** — BrowserStack running, core flows pass. Full parity needs lend-flow on iOS (FIX-002) and veteran flow (LENDLEE-015) |
| LENDLEE-026 | QA: first-time lend < 30s | LENDLEE-015 | Blocked — needs LENDLEE-015 to distinguish first-time vs veteran |
| LENDLEE-027 | QA: veteran lend < 15s | LENDLEE-015 | Blocked — needs LENDLEE-015 UI wiring + skip-preview working |

**Unblock sequence:**
```
FIX-000 (wire LENDLEE-015 into UI)
  → unblocks LENDLEE-021 (auth timing)
  → unblocks LENDLEE-026 (first-time timing — can measure without veteran logic, but AC requires distinction)
  → unblocks LENDLEE-027 (veteran timing — needs skip-preview working)
  → completes LENDLEE-025 (platform parity — BrowserStack infra is ready, just needs the flows)
```

**Completion metrics after FIX-000:**
- Implementation tasks: 20/20 → **21/21** (LENDLEE-015 moves from blocked to merged)
- QA tasks: 3/7 merged → up to **7/7** once timing tests run
- Overall: 23/27 → **27/27** (100%)

---

## Priority 1 — Fixes Ready to Ship

### FIX-001: Contacts permission dialog not handled in home-smoke.yaml

**Problem:** When `home-smoke` navigates to the Lend tab, iOS shows "Lendlee Would Like to Access Your Contacts" dialog. The test passes by luck (text visible behind dialog) but is flaky.

**Video evidence:** `08962b233426853b6547ab9d3d8dcb52c79cac38` — home-smoke test at ~25s, dialog appears over Lend screen.

**Fix:** Added `runFlow: when: visible: "Allow"` handler after Lend tab tap in `home-smoke.yaml`. Already in code, needs deploy.

**Status:** Code done, needs test suite upload + verification run.

---

### FIX-002: iOS lend-flow fails at Lend tab coordinate tap

**Problem:** `lend-flow` taps Lend tab at `point: "37%,93%"` after Keychain auto-login. The tap completes but doesn't navigate — "Who are you lending to?" never appears. Works in `home-smoke` (same coordinates) but fails in `lend-flow`.

**Root cause:** After Keychain auto-login (no login screen transition), the tab bar layout settles differently than after a full login flow. The y-coordinate at 93% might be slightly off in this context.

**Fix options:**
1. Adjust coordinate (try 92% or 94%)
2. Add longer `waitForAnimationToEnd` timeout
3. Wait for app rebuild with `tabBarTestID` — but `tabBarTestID` doesn't set `resource-id` on Android, so this won't work cross-platform
4. Use BrowserStack's `permissions` capability to pre-grant contacts permission, avoiding the dialog that may shift layout

**Status:** Open — needs investigation into whether the contacts permission dialog is shifting the tab bar position.

---

## Priority 2 — New Test Scenarios Needed

### FIX-003: Test contacts permission — user taps "Allow"

**Scenario:** User grants contacts access on the Lend screen.

**Expected behavior:**
1. User navigates to Lend tab
2. iOS shows "Lendlee Would Like to Access Your Contacts" dialog
3. User taps **"Allow"**
4. Device contacts load into the contacts picker list
5. User can search and select a contact from the list
6. Selected contact's name and phone populate the lend flow
7. On BrowserStack test devices: contact list will be empty (no contacts on device), so "No contacts loaded yet" is shown — but the "Add new contact" row should still be available as a fallback

**Maestro flow:** `lend-flow-allow-contacts.yaml`
```yaml
appId: ${APP_ID}
---
# Lend flow with contacts permission GRANTED

- runFlow: "login.yaml"

- waitForAnimationToEnd
- tapOn:
    point: "37%,93%"

# Grant contacts permission
- runFlow:
    when:
      visible: "Allow"
    commands:
      - tapOn: "Allow"

- extendedWaitUntil:
    visible: "Who are you lending to?"
    timeout: 8000

# Even with permission granted, BrowserStack test devices have no contacts.
# Verify the empty state and fallback are available.
- assertVisible: "Add new contact"

# Use manual contact entry (same as deny path on test devices)
- tapOn:
    id: "add-new-contact-row"
- extendedWaitUntil:
    visible:
      id: "manual-contact-name-input"
    timeout: 5000
- tapOn:
    id: "manual-contact-name-input"
- inputText: "Test Borrower"
- tapOn:
    id: "manual-contact-phone-input"
- inputText: "5551234567"
- tapOn:
    id: "manual-contact-submit"

# Continue with item entry
- extendedWaitUntil:
    visible: "What?"
    timeout: 5000
- tapOn:
    id: "item-input-title"
- inputText: "Drill"
- tapOn:
    id: "timeframe-chip-2weeks"
- tapOn:
    id: "lend-preview-button"
- extendedWaitUntil:
    visible: "Preview message"
    timeout: 5000
- tapOn:
    id: "sms-preview-send"
- extendedWaitUntil:
    notVisible: "Preview message"
    timeout: 10000
```

**Status:** Not yet created.

---

### FIX-004: Test contacts permission — user taps "Don't Allow"

**Scenario:** User denies contacts access on the Lend screen.

**Expected behavior:**
1. User navigates to Lend tab
2. iOS shows "Lendlee Would Like to Access Your Contacts" dialog
3. User taps **"Don't Allow"**
4. No crash, no permission prompt loop
5. Contact picker shows "Add new contact" row as the primary action
6. "No contacts loaded yet. Tap above to add one manually." message is displayed
7. User can complete the entire lend flow via manual contact entry (name + phone)
8. No re-prompt for contacts permission (iOS only prompts once)

**Maestro flow:** `lend-flow-deny-contacts.yaml`
```yaml
appId: ${APP_ID}
---
# Lend flow with contacts permission DENIED
# Validates LENDLEE-006 and LENDLEE-022 acceptance criteria

- runFlow: "login.yaml"

- waitForAnimationToEnd
- tapOn:
    point: "37%,93%"

# Deny contacts permission
- runFlow:
    when:
      visible: "Don't Allow"
    commands:
      - tapOn: "Don't Allow"

- extendedWaitUntil:
    visible: "Who are you lending to?"
    timeout: 8000

# Verify deny fallback UI
- assertVisible: "Add new contact"
- assertVisible: "No contacts loaded yet"

# Complete full lend flow via manual contact entry
- tapOn:
    id: "add-new-contact-row"
- extendedWaitUntil:
    visible:
      id: "manual-contact-name-input"
    timeout: 5000
- tapOn:
    id: "manual-contact-name-input"
- inputText: "Test Borrower"
- tapOn:
    id: "manual-contact-phone-input"
- inputText: "5551234567"
- tapOn:
    id: "manual-contact-submit"

# Continue through WHAT → WHEN → Preview → Send
- extendedWaitUntil:
    visible: "What?"
    timeout: 5000
- tapOn:
    id: "item-input-title"
- inputText: "Hammer"
- tapOn:
    id: "timeframe-chip-2weeks"
- tapOn:
    id: "lend-preview-button"
- extendedWaitUntil:
    visible: "Preview message"
    timeout: 5000
- tapOn:
    id: "sms-preview-send"
- extendedWaitUntil:
    notVisible: "Preview message"
    timeout: 10000
```

**Status:** Not yet created.

---

### FIX-005: Contacts permission persistence across tests

**Problem:** iOS only prompts for contacts permission once per app install. After the first test grants or denies permission, subsequent tests on the same device won't see the dialog. `clearState: true` may or may not reset the permission.

**Expected behavior:**
- If `clearState` resets permissions: each test gets a fresh prompt
- If `clearState` does NOT reset permissions: only the first test to hit the Lend tab sees the dialog; subsequent tests inherit the decision

**Testing needed:**
1. Run `lend-flow-deny-contacts.yaml` first, then `lend-flow-allow-contacts.yaml` second — does the second test get a prompt?
2. Run with `clearState: true` — does it reset the contacts permission?
3. If permissions persist, the test order matters and flows need to handle "no dialog shown" gracefully

**Status:** Needs investigation.

---

## Priority 3 — Infrastructure Improvements

### FIX-006: Pre-grant permissions via BrowserStack capability

**Problem:** BrowserStack Maestro API may support a `permissions` capability to pre-grant or pre-deny specific permissions, avoiding the native dialog entirely.

**Fix:** Research and add `"permissions": {"contacts": "allow"}` or equivalent to the build request. This would make tests deterministic regardless of permission state.

**Status:** Needs research.

---

### FIX-007: Separate allow/deny test suites

**Problem:** Can't test both "Allow" and "Don't Allow" paths in the same build if permissions persist. Need separate builds or BrowserStack permission configuration.

**Fix:** Create two test suite zips or use BrowserStack's permission capabilities:
- Suite A: Pre-grant contacts → test the contacts-loaded path
- Suite B: Pre-deny contacts → test the manual-entry fallback path

**Status:** Needs architecture decision.

---

## Summary Table

| ID | Description | Priority | Blocks | Status |
|----|------------|----------|--------|--------|
| FIX-000 | LENDLEE-015: Wire veteran lender logic into UI | **P0** | LENDLEE-021, 025, 026, 027 | Library done, UI wiring needed |
| FIX-001 | Contacts dialog handler in home-smoke.yaml | P1 | — | Code done |
| FIX-002 | iOS lend-flow Lend tab coordinate tap | P1 | LENDLEE-025 (parity) | Open |
| FIX-003 | Test: user taps "Allow" on contacts | P2 | — | Not created |
| FIX-004 | Test: user taps "Don't Allow" on contacts | P2 | — | Not created |
| FIX-005 | Contacts permission persistence across tests | P2 | FIX-003, FIX-004 | Needs investigation |
| FIX-006 | Pre-grant permissions via BrowserStack API | P3 | — | Needs research |
| FIX-007 | Separate allow/deny test suites | P3 | — | Needs architecture decision |
