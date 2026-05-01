# iOS Lend Tab Navigation Investigation

**Date:** 2026-04-27
**Task:** LENDLEE-036
**Status:** Fix applied, awaiting BrowserStack quota reset for verification

## Problem

`lend-flow.yaml` fails on iOS after Keychain auto-login. The tap at `point: "37%,93%"` completes (Maestro reports success) but doesn't navigate to the Lend screen. "Who are you lending to?" is never found.

This only fails after Keychain auto-login, not after a full login flow. `home-smoke` uses the same coordinate and passes.

## Investigation — What Didn't Work

### Attempt 1: testID-based taps (`id: "tab-lend"`)
- **Result:** FAILED on iOS. `tabBarTestID` props from Expo Router's `<Tabs>` are NOT exposed in iOS's accessibility tree (`accessibilityIdentifier`). Maestro loops through view hierarchy requests and times out.
- **Android:** Not tested in isolation.
- **Build:** `adf1ac6978ce397fd30a7c2262e1afab61534a37` — iOS 2/6 (login + auth-flow pass, all 4 tab tests fail)

### Attempt 2: Text-based taps (`text: "Lend"`)
- **Result:** FAILED on iOS. Tab bar label text is not exposed as searchable text nodes in iOS's native UITabBar accessibility tree. Maestro cannot find "Lend", "Profile", or "My Items" as text.
- **Android:** PASSED 5/6 — text-based taps work on Android. Only `lend-flow-deny-contacts` failed (separate issue).
- **Build iOS:** `a9b12a406b6985e6e721e35018119aaa3cb57452` — 2/6
- **Build Android:** `86710c05ecd3460c4c6220a7e5bae9c2c38d45e8` — 5/6

### Key Finding: iOS Tab Bar Accessibility
On iOS, Expo Router's `<Tabs>` renders native `UITabBarItem` elements. These expose:
- Labels via `accessibilityLabel` (not searchable by Maestro `text:`)
- No `accessibilityIdentifier` from `tabBarTestID` (Expo Router bug or limitation)
- No plain text nodes (Maestro `text:` searches text nodes, not labels)

**Coordinate taps are the ONLY working approach for iOS tab navigation with Maestro.**

## Root Cause Analysis

The original `home-smoke` test passes with coordinate taps because it taps **Profile first** (`87%,93%`), then Lend (`37%,93%`). The first tab tap "activates" the tab bar interaction.

`lend-flow` fails because it tries to tap Lend as the **first tab interaction** after Keychain auto-login. The coordinate hits the screen but the tab bar hasn't fully established its touch targets.

Evidence:
- home-smoke: taps Profile → Settings appears → taps Lend → "Who are you lending to?" appears ✓
- lend-flow: taps Lend directly → tap "completes" but no navigation ✗
- Both use identical coordinates (`37%,93%`)

## Applied Fix

**Strategy:** Warm up the tab bar before tapping Lend by first tapping the Home tab (which we're already on), adding `waitForAnimationToEnd`, then tapping Lend.

### Files changed:

**`lend-flow.yaml`** — Added Home tab warm-up tap before Lend:
```yaml
- tapOn:
    point: "12%,93%"    # Tap Home tab (current tab — activates tab bar)
- waitForAnimationToEnd
- tapOn:
    point: "37%,93%"    # Now tap Lend
```

**`lend-flow-allow-contacts.yaml`** — Same warm-up pattern.

**`lend-flow-deny-contacts.yaml`** — Same warm-up pattern for both Lend tap locations.

**`home-smoke.yaml`** — Reverted to original coordinate taps (already works — taps Profile first).

**`browserstack-run.sh`** — Fixed missing `devices` parameter that caused `BROWSERSTACK_NO_DEVICE_SPECIFIED` error.

### Timeout increases:
- `extendedWaitUntil` for "Who are you lending to?" increased from 5000ms to 8000ms across all lend-flow tests.

## Verification Status

BrowserStack free trial testing time exhausted after 3 runs. Fix cannot be verified until quota resets.

**To verify:**
```bash
cd apps/mobile-salvaged
bash scripts/browserstack-run.sh --platform both --suite .maestro
```

**Expected results:**
- iOS: 4/4 core tests pass (home-smoke, lend-flow, auth-flow, login)
- Android: 4/4 core tests pass (unchanged — was already passing)

## Other Fixes

**`scripts/browserstack-run.sh`** was missing the required `devices` parameter in the build trigger API call. Added `IOS_DEVICE="iPhone 15-17"` and `ANDROID_DEVICE="Google Pixel 8-14.0"` to match `browserstack-test.sh`.
