# BrowserStack Failure Diagnosis Runbook

**Project:** Lendlee
**Last Updated:** 2026-04-27
**Historical Data:** See `apps/mobile-salvaged/QA_REPORT.md` for the full Apr 25-26 QA session (33 builds, 3 root causes discovered).

---

## 1. Prerequisites

### Credentials

```bash
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"
```

Or source from the project env file:

```bash
source apps/mobile-salvaged/.env
```

### Tools

| Tool | Purpose | Install |
|------|---------|---------|
| `curl` | API calls | Built-in |
| `jq` | JSON parsing | `brew install jq` |
| `ffmpeg` | Video frame extraction | `brew install ffmpeg` |

### API Base URLs

| Base URL | Purpose |
|----------|---------|
| `https://api-cloud.browserstack.com` | Management API — list builds, get sessions, trigger runs |
| `https://api.browserstack.com` | Artifact API — download videos, logs, screenshots |

These are **different hosts**. Management calls go to `api-cloud`, artifact downloads go to `api`. Mixing them up returns 404s.

---

## 2. List Builds

Get the most recent builds to find the one you need to investigate.

```bash
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api-cloud.browserstack.com/app-automate/maestro/v2/builds" \
  | jq '.builds[:5] | .[] | {id: .id, name: .name, status: .status, device: .device_name}'
```

To list more builds or filter by status:

```bash
# Last 20 builds
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api-cloud.browserstack.com/app-automate/maestro/v2/builds?limit=20" \
  | jq '.builds[] | {id: .id, name: .name, status: .status}'
```

---

## 3. Get Build Details

Once you have a build ID, get its full details including session list.

```bash
BUILD_ID="93109741b374f8758f6d34f7e55c068f2515eb30"

curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api-cloud.browserstack.com/app-automate/maestro/v2/builds/$BUILD_ID" \
  | jq '.'
```

Extract session IDs from the build:

```bash
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api-cloud.browserstack.com/app-automate/maestro/v2/builds/$BUILD_ID" \
  | jq '.sessions[] | {session_id: .id, status: .status, device: .device_name}'
```

---

## 4. Get Session and Test Details

Each session contains one or more test runs. Get the session details to find test IDs and status.

```bash
SESSION_ID="e0118bda94ee9d33f87f70c676a10230ab0521790a928a3a"

curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api-cloud.browserstack.com/app-automate/maestro/v2/builds/$BUILD_ID/sessions/$SESSION_ID" \
  | jq '.'
```

Look for the `tests` array in the response. Each test has an ID and a pass/fail status.

---

## 5. Fetch Logs and Video

**Important:** Artifact URLs use `api.browserstack.com`, not `api-cloud`.

### Maestro Execution Logs

Shows each Maestro command and whether it COMPLETED or FAILED, with timing.

```bash
TEST_ID="e0118bda94ee9d33f87f70c676a10230ab0521790a928a3a"

curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api.browserstack.com/app-automate/maestro/builds/$BUILD_ID/sessions/tests/$TEST_ID/maestrologs"
```

### Device Logs

Raw device logs (logcat on Android, syslog on iOS). Useful for crash stack traces and Supabase HTTP errors.

```bash
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api.browserstack.com/app-automate/maestro/builds/$BUILD_ID/sessions/tests/$TEST_ID/devicelogs"
```

### Screenshots

Maestro step screenshots (if captured).

```bash
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api.browserstack.com/app-automate/maestro/builds/$BUILD_ID/sessions/tests/$TEST_ID/maestroScreenshot"
```

### Video Recording

Download the full session video as MP4.

```bash
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api.browserstack.com/app-automate/maestro/builds/$BUILD_ID/sessions/tests/$TEST_ID/video" \
  -o "session_video.mp4"
```

To play a specific time range (e.g., the failure moment):

```bash
# Append #t=START,END to the URL for browser playback
# For download, use ffmpeg to trim after downloading:
ffmpeg -i session_video.mp4 -ss 00:00:20 -to 00:00:35 -c copy failure_clip.mp4
```

---

## 6. Extract Video Frames for Visual Diagnosis

When logs aren't enough, extract frames from the video to see exactly what the device was showing.

### Extract one frame per second

```bash
ffmpeg -i session_video.mp4 -vf "fps=1" frames/frame_%04d.png
```

### Extract a single frame at a specific timestamp

```bash
ffmpeg -i session_video.mp4 -ss 00:00:15 -frames:v 1 frame_at_15s.png
```

### Create a contact sheet (grid of frames)

```bash
ffmpeg -i session_video.mp4 -vf "fps=0.5,scale=320:-1,tile=4x4" contact_sheet.png
```

This gives you a 4x4 grid of frames taken every 2 seconds — a quick visual summary of the entire test run.

### What to look for in frames

| Frame shows | Likely problem |
|-------------|----------------|
| Device home screen (app icons) | App never launched — missing `launchApp` |
| Login screen with alert dialog | Auth error — check Supabase logs |
| Correct screen but test failed | Element not found — Maestro can't see the target |
| Black screen | App crashed — check device logs |
| Splash screen frozen | App hung on startup — check network/bundle |

---

## 7. Common Failure Patterns

These patterns were discovered during the Lendlee QA session (33 builds, Apr 25-26 2026). See `QA_REPORT.md` for full details.

| # | Symptom | Root Cause | Fix |
|---|---------|------------|-----|
| 1 | **Video shows device home screen for entire test duration.** App never opens. Test times out after ~280s. | Maestro `appId:` front-matter auto-launches on local simulators but **not** on BrowserStack remote devices. | Add explicit `- launchApp` as the first command in every Maestro flow. Don't rely on `appId:` front-matter for remote execution. |
| 2 | **App launches, login screen renders, Sign In returns "Database error querying schema" alert.** HTTP 500 from Supabase. | QA test user was created via direct SQL `INSERT` into `auth.users`, leaving `email_change`, `email_change_token_new`, `recovery_token` as NULL. GoTrue (Go) crashes scanning NULL into `string`. | Fix existing users: `UPDATE auth.users SET email_change = COALESCE(email_change, '') ...`. **Prevention:** Always create QA users via `supabase.auth.admin.createUser()`, never raw SQL. |
| 3 | **Login succeeds, home screen loads, `tapOn: "Profile"` fails after 17s of retries.** Android passes the same test. | iOS renders tab bar labels via native `UITabBarButton`, making text invisible to Maestro's view hierarchy. `tapOn:` by text works on Android but not iOS. | Use percentage-based coordinate taps: `point: "87%,93%"` for Profile tab. **Important:** 93% height, not 97% — the bottom 4% is the iOS home indicator area. Long-term: add `tabBarTestID` props and use `id:` selectors. |
| 4 | **Tab tap registers but wrong screen appears, or "logout-button not found" assertion fails.** | Coordinate tap at `97%` height hit the iOS home indicator instead of the tab bar at `~93%` height. | Change Y coordinate from `97%` to `93%`. Test on actual device dimensions — the tab bar sits above the home indicator safe area. |
| 5 | **Test passes on first run, fails on second run.** Login screen not shown — app opens to home screen. | iOS Keychain persists Supabase auth session between test runs. BrowserStack doesn't always clear app state between builds. | Add a logout step at the start of login flows, or use `- clearKeychain` / `- clearState` commands. Alternatively, ensure each build uses a fresh device session. |
| 6 | **`assertVisible` fails for a modal element that has a `testID`, but the modal is clearly visible in the video.** | On iOS, modal `testID` props may not be exposed in Maestro's accessibility tree. `assertVisible` with `id:` fails even though the element renders. | Use text-based assertions instead: `- assertVisible: "Expected Text"`. Only use `id:` selectors for non-modal elements that are confirmed in the view hierarchy. |
| 7 | **Same test suite works on iOS but `appId` mismatch on Android (or vice versa).** | `appId:` was hardcoded to one platform's bundle ID (e.g., `me.lendlee.ios`). | Parameterize with env vars: `appId: ${APP_ID}`. Set via `setEnvVariables` in the BrowserStack build request: `{"APP_ID": "me.lendlee.ios"}` for iOS, `{"APP_ID": "me.lendlee.app"}` for Android. |

---

## Quick Reference: Full Diagnosis Workflow

When a build fails, run these steps in order:

```bash
# 1. Set credentials
export BROWSERSTACK_USERNAME="..."
export BROWSERSTACK_ACCESS_KEY="..."

# 2. Find the failing build
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api-cloud.browserstack.com/app-automate/maestro/v2/builds" \
  | jq '.builds[:3] | .[] | {id: .id, name: .name, status: .status}'

# 3. Get build details (replace BUILD_ID)
BUILD_ID="<paste_build_id>"
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api-cloud.browserstack.com/app-automate/maestro/v2/builds/$BUILD_ID" \
  | jq '.sessions[] | {session_id: .id, tests: [.tests[]? | {id: .id, status: .status}]}'

# 4. Fetch Maestro logs (replace TEST_ID) — uses api.browserstack.com
TEST_ID="<paste_test_id>"
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api.browserstack.com/app-automate/maestro/builds/$BUILD_ID/sessions/tests/$TEST_ID/maestrologs"

# 5. Download video
curl -s -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
  "https://api.browserstack.com/app-automate/maestro/builds/$BUILD_ID/sessions/tests/$TEST_ID/video" \
  -o session_video.mp4

# 6. Extract frames for visual diagnosis
mkdir -p frames
ffmpeg -i session_video.mp4 -vf "fps=1" frames/frame_%04d.png

# 7. Check the common failure patterns table above
```

---

## Notes

- **Video retention:** BrowserStack retains session videos for 30 days.
- **Maestro v2 API:** The Maestro-specific API paths (`/maestro/v2/...`) differ from the standard App Automate API (`/app-automate/sessions/...`). Always use the Maestro v2 paths for Maestro builds.
- **Historical builds:** See `apps/mobile-salvaged/QA_REPORT.md` for build IDs, video URLs, and step traces from the Apr 25-26 QA session.
- **Build CSV:** `apps/mobile-salvaged/browserstack-builds.csv` contains a machine-readable list of all historical builds.
