# QA Report — iOS & Android Parity for Full Lend Flow

**Task:** LENDLEE-025
**Date:** 2026-05-01 (updated; original audit 2026-04-22)
**Engineer:** Ralph (code-level QA pass)
**Status:** Code audit complete. Device screenshot pass requires physical devices.

---

## Executive Summary

The full lend flow (WHO → WHAT → WHEN → SMS Preview → Send) is now wired
end-to-end via `app/(tabs)/lend.tsx` → `submitLend()` → `sendSms()`. All
upstream dependencies (LENDLEE-016, 017, 018, 019) have landed.

**Findings:** 5 platform-specific issues identified. 1 concrete parity bug
(unguarded `presentationStyle`), 2 medium-risk gaps (missing SafeAreaProvider,
Android status bar color), 2 low-risk cosmetic divergences (modal chrome,
SMS result reporting). No clipped/cut-off UI elements found in the code.
All native pickers (contacts, date) are properly platform-branched. SMS
composer opens correctly on both via `expo-sms`.

---

## Screen-by-Screen Audit

### 1. Sign-in — `app/login.tsx`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| Safe-area top padding | `useSafeAreaInsets().top` | Same | ✅ Parity |
| Keyboard avoidance | `behavior="padding"` | `behavior="height"` | ✅ Correct per-platform |
| Apple Sign-In button | Shown | Hidden (`Platform.OS === 'ios'` guard) | ✅ Correct |
| Google Sign-In button | Shown | Shown | ✅ Parity |
| Google Play Services check | n/a | `hasPlayServices({ showPlayServicesUpdateDialog: true })` | ✅ Correct |
| Animation (fade + slide) | `useNativeDriver: true` | Same | ✅ Parity |
| Form inputs styling | Identical | Identical | ✅ Parity |
| Error display (inline + Alert) | Native Alert | Native Alert | ✅ Parity |

**Verdict: PASS** — No parity issues. Apple button correctly iOS-only.

---

### 2. Contact Picker — `app/(tabs)/lend.tsx` + `components/lend/ContactPicker.tsx`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| Device contacts fetch | `expo-contacts` API | Same API | ✅ Parity |
| Permission request on mount | `getContactsPermissionStatus()` → `requestContactsPermission()` | Same flow | ✅ Parity |
| Contact list (FlatList) | Renders identically | Renders identically | ✅ Parity |
| Search bar debounce (150ms) | Same | Same | ✅ Parity |
| "Add new contact" modal | **`presentationStyle="pageSheet"`** — renders as native sheet | **Prop ignored** — renders full-screen slide | 🟥 **PARITY BUG** |
| Manual contact form KAV | `behavior="padding"` | `behavior={undefined}` | ✅ Correct per-platform |
| `onRequestClose` for Android back | Set to `handleManualCancel` | Required and correctly wired | ✅ Correct |

**Bug P1: `presentationStyle="pageSheet"` is unguarded (ContactPicker.tsx:180)**

On iOS, this renders the "Add new contact" modal as a native page sheet
(card-style, with drag-to-dismiss). On Android, the prop is silently ignored
and the modal renders full-screen. Not broken, but visually inconsistent.

**Fix:**
```tsx
presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
```

---

### 3. Item Input — `components/lend/ItemInput.tsx`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| TextInput styling | Identical | Identical | ✅ Parity |
| Auto-focus | `autoFocus={Platform.OS !== 'web'}` — both mobile get focus | Same | ✅ Parity |
| Category auto-detection chip | Identical | Identical | ✅ Parity |
| Category picker modal | `animationType="fade"`, `transparent` | Same | ✅ Parity |
| Category picker `onRequestClose` | Wired to `closePicker` | Required and correctly wired | ✅ Correct |
| Chip wrap layout | `flexWrap` + `gap` | Same | ✅ Parity |

**Verdict: PASS** — No parity issues.

---

### 4. Timeframe — `components/lend/TimeframeSelector.tsx`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| Preset chips (horizontal scroll) | Identical | Identical | ✅ Parity |
| Custom date picker — iOS | `DateTimePicker` rendered in a Modal with `display="inline"` | n/a | ✅ iOS-native calendar |
| Custom date picker — Android | n/a | `DateTimePickerAndroid.open()` imperative API | ✅ Android-native picker |
| `minimumDate` enforcement | Set to `new Date()` | Same | ✅ Parity |
| "Done" button (iOS picker modal) | Rendered with primary color | n/a (Android picker auto-closes on OK) | ✅ Correct per-platform |
| "No return date" preset | Emits `null` | Same | ✅ Parity |
| Hint text ("Return by ...") | Identical | Identical | ✅ Parity |

**Verdict: PASS** — Date pickers are properly platform-branched. iOS gets
the inline calendar in a modal sheet; Android gets the imperative native
dialog. Both handle `minimumDate` and the "no date" case correctly.

---

### 5. SMS Preview — `components/lend/SmsPreviewModal.tsx`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| Modal presentation | `animationType="slide"`, `transparent` | Same | ✅ Parity |
| LayoutAnimation enabled | Native (no-op call) | `UIManager.setLayoutAnimationEnabledExperimental(true)` at module load | ✅ Correct |
| Tone segmented control | Identical rendering | Identical rendering | ✅ Parity |
| Chat bubble preview | Identical | Identical | ✅ Parity |
| Veteran skip-preview checkbox | Identical | Identical | ✅ Parity |
| AsyncStorage tone persistence | Same API | Same API | ✅ Parity |
| Shadow on selected segment | `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` | `elevation: 1` | ✅ Both set |
| Shadow on Send button | iOS shadow props | `elevation: 2` | ✅ Both set |

**Verdict: PASS** — No parity issues. LayoutAnimation is correctly opted-in
for Android.

---

### 6. SMS Composer — `lib/sms/sendSms.ts`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| `SMS.isAvailableAsync()` | Returns true on device | Returns true on device | ✅ Parity |
| `SMS.sendSMSAsync()` | Opens MFMessageComposeViewController | Opens system SMS app via intent | ✅ Correct per-platform |
| Send result | `'sent'` or `'cancelled'` | Usually `'unknown'` (Android intent doesn't report back) | ⚠️ **Known divergence** |
| Clipboard fallback | Same | Same | ✅ Parity |

**Known divergence:** Android's SMS intent does not report send/cancel status
back to the app, so the result is typically `'unknown'`. The lend flow handles
this correctly in `lend.tsx:251-260` — the `sms-unknown` case shows a neutral
"Saved. Check your Messages app to confirm the text." alert. This is **by
design** and matches the AC.

---

### 7. Home — `app/(tabs)/(home)/index.tsx`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| Stats row layout | Identical | Identical | ✅ Parity |
| FlatList with ItemCard | Identical | Identical | ✅ Parity |
| LentItemsSection header | Identical | Identical | ✅ Parity |
| FAB shadow | `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` | `elevation: 6` | ✅ Both set |
| SuccessToast animation | `Animated.spring` + `Animated.timing`, `useNativeDriver: true` | Same | ✅ Parity |
| SuccessToast elevation | iOS shadow props | `elevation: 6` | ✅ Both set |
| Real-time loan subscription | Supabase realtime (same API) | Same | ✅ Parity |

**Verdict: PASS** — No parity issues.

---

### 8. History — `app/(tabs)/history/index.tsx`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| Filter chips | Identical | Identical | ✅ Parity |
| LoanCard rendering | Identical | Identical | ✅ Parity |
| Long-press action | `ActionSheetIOS.showActionSheetWithOptions` | `Alert.alert` with options | ✅ Correct per-platform |
| Haptic feedback | `Haptics.impactAsync(Medium)` | Same (vibration fallback) | ✅ Parity |

**Verdict: PASS** — LoanCard correctly uses platform-specific action sheet
(iOS native sheet vs Android Alert dialog).

---

### 9. Profile — `app/(tabs)/profile/index.tsx`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| Avatar, stats, settings card | Identical | Identical | ✅ Parity |
| Logout alert | `Alert.alert` with Cancel/Log Out | Same (native dialog) | ✅ Parity |
| ScrollView padding | Identical | Identical | ✅ Parity |

**Verdict: PASS** — No platform-specific code. Fully cross-platform.

---

### 10. Tab Bar — `app/(tabs)/_layout.tsx`

| Concern | iOS | Android | Verdict |
|---------|-----|---------|---------|
| Tab styling | `tabBarStyle` with border | Same | ✅ Parity |
| Icon rendering (lucide-react-native) | Same | Same | ✅ Parity |
| Label style | Identical | Identical | ✅ Parity |

**Verdict: PASS**

---

## Issues Found

### 🟥 P1 — `presentationStyle="pageSheet"` unguarded (ContactPicker.tsx:180)

**Severity:** Low (cosmetic)
**Impact:** "Add new contact" modal looks different on iOS vs Android. iOS
gets a draggable page sheet; Android gets a full-screen slide.
**Fix:** Guard with `Platform.OS === 'ios' ? 'pageSheet' : undefined`

### ⚠️ P2 — Root `SafeAreaProvider` is implicit (app/_layout.tsx)

**Severity:** Medium
**Impact:** `useSafeAreaInsets()` in `login.tsx` relies on Expo Router /
RN Screens providing SafeAreaContext implicitly. This works on current
versions but is fragile.
**Fix:** Wrap root in `<SafeAreaProvider>` from `react-native-safe-area-context`

### ⚠️ P3 — Android status bar background color not set

**Severity:** Medium
**Impact:** On Android, the status bar may show system-default background
(white or translucent), which may not match `Colors.cream`. iOS uses
`StatusBar style="dark"` on the login screen but no `backgroundColor` is
set for Android.
**Fix:** Add `<StatusBar style="dark" backgroundColor={Colors.cream} />` in root layout

### ℹ️ P4 — Android SMS result always `'unknown'`

**Severity:** Info (by design)
**Impact:** Android can't report whether SMS was actually sent. Handled
correctly with neutral "Saved" toast.
**Action:** No fix needed. Document for testers.

### ℹ️ P5 — Modal chrome differs (add-item as card modal)

**Severity:** Info (by design)
**Impact:** `_layout.tsx` sets `presentation: 'modal'` for `add-item`.
iOS shows card-style modal; Android shows full-screen slide. This is
standard Expo Router behavior.
**Action:** No fix needed. Expected platform behavior.

---

## Platform-Specific Code Inventory

Every `Platform.OS` gate and iOS-only prop in the codebase:

| File | Line | Gate | Correct? |
|------|------|------|----------|
| `login.tsx` | 226 | `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` | ✅ |
| `login.tsx` | 326 | `{Platform.OS === 'ios' && <AppleButton>}` | ✅ |
| `add-item.tsx` | 43 | `if (Platform.OS === 'web')` — camera fallback | ✅ |
| `lend.tsx` | 338 | `autoFocus={Platform.OS !== 'web'}` | ✅ |
| `modal.tsx` | 40 | `StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'}` | ✅ |
| `ManualContactForm.tsx` | 110 | `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` | ✅ |
| `ContactPicker.tsx` | 180 | `presentationStyle="pageSheet"` (unguarded) | 🟥 Bug |
| `TimeframeSelector.tsx` | 79 | `if (Platform.OS === 'android') DateTimePickerAndroid.open(...)` | ✅ |
| `TimeframeSelector.tsx` | 168 | `{Platform.OS === 'ios' && iosPickerOpen ? <Modal>...` | ✅ |
| `LoanCard.tsx` | 57 | `if (Platform.OS === 'ios') ActionSheetIOS... else Alert...` | ✅ |
| `SmsPreviewModal.tsx` | 73 | `Platform.OS === 'android' && UIManager.setLayout...` | ✅ |
| `LendleeProvider.tsx` | 14 | `Platform.OS === 'android' && UIManager.setLayout...` | ✅ |
| `supabase.ts` | 20-28 | `Platform.OS === 'web'` — storage noop | ✅ |
| `google.ts` | 87 | `if (Platform.OS === 'android')` — webClientId | ✅ |

**12 of 13 gates are correct. 1 bug (unguarded `presentationStyle`).**

---

## Recommended Fixes

All three fixes are independent, safe to apply now, and do not require
upstream task changes.

### Fix 1 — Guard `presentationStyle` (ContactPicker.tsx:180)

```diff
- presentationStyle="pageSheet"
+ presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
```

### Fix 2 — Add explicit SafeAreaProvider (app/_layout.tsx)

```diff
+ import { SafeAreaProvider } from 'react-native-safe-area-context';

  export default function RootLayout() {
    return (
+     <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            ...
          </GestureHandlerRootView>
        </QueryClientProvider>
+     </SafeAreaProvider>
    );
  }
```

### Fix 3 — Android status bar (app/_layout.tsx)

```diff
+ import { StatusBar } from 'expo-status-bar';

  function RootLayoutNav() {
    return (
+     <>
+       <StatusBar style="dark" backgroundColor={Colors.cream} />
        <Stack screenOptions={...}>
          ...
        </Stack>
+     </>
    );
  }
```

---

## Device-Pass Template

Once fixes are applied, run this checklist on physical iPhone + Android device.

### Golden Path Checklist

| # | Screen | Check | iOS | Android |
|---|--------|-------|-----|---------|
| 1 | Sign-in | App opens, no content under notch/status bar | ☐ | ☐ |
| 1 | Sign-in | Apple button visible (iOS) / hidden (Android) | ☐ | ☐ |
| 1 | Sign-in | Google sign-in completes successfully | ☐ | ☐ |
| 2 | Lend tab → WHO | Contacts permission prompt appears | ☐ | ☐ |
| 2 | Lend tab → WHO | Contact list renders, search works | ☐ | ☐ |
| 2 | Lend tab → WHO | "Add new contact" modal opens (sheet on iOS, full on Android) | ☐ | ☐ |
| 2 | Lend tab → WHO | Manual contact form: keyboard avoidance works | ☐ | ☐ |
| 3 | Lend tab → WHAT | Item title input receives focus | ☐ | ☐ |
| 3 | Lend tab → WHAT | Category auto-detects and chip appears | ☐ | ☐ |
| 3 | Lend tab → WHAT | Category picker modal opens and closes | ☐ | ☐ |
| 4 | Lend tab → WHEN | Timeframe preset chips render in scrollable row | ☐ | ☐ |
| 4 | Lend tab → WHEN | Custom date: native picker opens (calendar on iOS, dialog on Android) | ☐ | ☐ |
| 4 | Lend tab → WHEN | "Return by <date>" hint updates | ☐ | ☐ |
| 5 | SMS Preview | Modal slides up with chat bubble | ☐ | ☐ |
| 5 | SMS Preview | Tone switcher (casual/friendly/formal) updates bubble text live | ☐ | ☐ |
| 5 | SMS Preview | Send button triggers SMS composer | ☐ | ☐ |
| 6 | SMS Composer | iOS: MFMessageComposeViewController opens with pre-filled text | ☐ | n/a |
| 6 | SMS Composer | Android: System SMS app opens with pre-filled text | n/a | ☐ |
| 6 | SMS Composer | Cancel returns to app with neutral alert | ☐ | ☐ |
| 7 | Home | Stats row updates (Lent count +1) | ☐ | ☐ |
| 7 | Home | SuccessToast slides in from top | ☐ | ☐ |
| 7 | Home | FAB visible above tab bar | ☐ | ☐ |
| 8 | History | New loan appears with Active badge | ☐ | ☐ |
| 8 | History | Long-press: action sheet (iOS) / alert dialog (Android) | ☐ | ☐ |
| 9 | Profile | Avatar, stats, settings, logout all render | ☐ | ☐ |

### Screenshot Matrix

| Screen | iOS | Android | Parity? | Notes |
|--------|-----|---------|---------|-------|
| Sign-in | _(paste)_ | _(paste)_ | ☐ | |
| WHO (contacts) | _(paste)_ | _(paste)_ | ☐ | |
| WHAT (item input) | _(paste)_ | _(paste)_ | ☐ | |
| WHEN (timeframe) | _(paste)_ | _(paste)_ | ☐ | |
| SMS Preview | _(paste)_ | _(paste)_ | ☐ | |
| SMS Composer | _(paste)_ | _(paste)_ | ☐ | |
| Home (post-lend) | _(paste)_ | _(paste)_ | ☐ | |

---

## Files Audited

```
app/_layout.tsx
app/login.tsx
app/check-email.tsx
app/add-item.tsx
app/select-contact.tsx
app/set-reminder.tsx
app/(tabs)/_layout.tsx
app/(tabs)/lend.tsx
app/(tabs)/(home)/index.tsx
app/(tabs)/history/index.tsx
app/(tabs)/profile/index.tsx
components/lend/ContactPicker.tsx
components/lend/ContactSearchBar.tsx
components/lend/ManualContactForm.tsx
components/lend/ItemInput.tsx
components/lend/TimeframeSelector.tsx
components/lend/SmsPreviewModal.tsx
components/LoanCard.tsx
components/home/LentItemsSection.tsx
components/ItemCard.tsx
components/SuccessToast.tsx
lib/sms/sendSms.ts
lib/sms/templates.ts
lib/sms/lenderExperience.ts
lib/lend/submitLend.ts
lib/permissions/contacts.ts
lib/auth/apple.ts
lib/auth/google.ts
lib/supabase.ts
providers/AuthProvider.tsx
providers/LendleeProvider.tsx
```

---

## Conclusion

The lend flow is well-architected for cross-platform parity. All 13
platform-specific gates are correctly implemented except one cosmetic
issue (`presentationStyle` unguarded). The three recommended fixes (guard
`presentationStyle`, add `SafeAreaProvider`, set Android status bar color)
are minimal and safe to apply. Physical device verification should be done
after applying fixes.
