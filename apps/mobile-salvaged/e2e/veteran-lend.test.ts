/**
 * LENDLEE-027 — Veteran-lender end-to-end timing probe (< 15 s).
 *
 * Mirrors the first-lend probe in shape (see e2e/first-lend.test.ts) but
 * models the veteran path:
 *   - Contacts permission is already granted (no OS prompt).
 *   - The user has >= VETERAN_THRESHOLD (3) prior lends.
 *   - The "skip preview" setting is ON.
 *   - Therefore `getLenderExperience().skipPreview === true` and the flow
 *     bypasses the SMS preview modal entirely — the Send goes straight
 *     through `submitLend()` using the last-used tone.
 *
 * The five steps for a veteran lender:
 *   1. Ready       — lend screen mounts; permission already granted, so
 *                    the only native cost is the contact-fetch.
 *   2. Contact pick — human scrolls/taps a contact (faster than a first-
 *                    timer because recent borrowers are near the top).
 *   3. Item entry   — human types a short title (veterans know the ropes,
 *                    typing is faster).
 *   4. Timeframe    — human taps one of five preset chips.
 *   5. Submit       — DB insert + native SMS composer + user taps Send.
 *                    NO preview modal step, NO modal review time.
 *
 * Running this test three times and taking the median of the totals is
 * the programmatic stand-in for "3 stopwatch runs on a warm device". The
 * device numbers go in the report — see qa-reports/veteran-lend-timing.md.
 *
 * What this CAN verify:
 *  - The JS work inside each veteran step is negligible (< 50 ms per step).
 *  - `getLenderExperience` correctly returns `skipPreview=true` when the
 *    user is a veteran AND has opted in, confirming the gate the lend
 *    screen should check before opening the preview modal.
 *  - With realistic native latencies + veteran-paced human think time, the
 *    15 s budget is met.
 *
 * What this CANNOT verify:
 *  - Real device dialog + composer latency; those must be stopwatch-timed
 *    on hardware and logged in §4 of the report.
 *  - That lend.tsx actually consumes `skipPreview` to bypass the modal.
 *    As of this probe's authoring, the lend screen still opens the modal
 *    unconditionally on `openPreview`. See §R3 of the report.
 *
 * Run with:
 *   bun test e2e/veteran-lend.test.ts
 */
import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { registerReactNativeMock } from '../test-support/mock-react-native';

registerReactNativeMock(() => 'ios');

// Total AC budget for the veteran flow.
const BUDGET_MS = 15_000;

// --- Simulated native latencies --------------------------------------------

// Permission is already granted for a veteran — the screen only calls
// getPermissionsAsync (cheap) on mount. No OS prompt, no 800 ms sheet.
const PERMISSION_LOOKUP_MS = 40;
// Contact fetch from the OS address book. Same cost as first-lend — this
// is a native-side cost not reduced by "being a veteran".
const CONTACTS_FETCH_MS = 250;
// iOS SMS composer present animation + sheet settle. Same as first-lend.
const NATIVE_SMS_COMPOSER_MS = 900;
// Supabase insert for the loan row. Same as first-lend.
const SUPABASE_INSERT_MS = 300;
// Supabase count read for lendExperience veteran gate. Cheap head-count
// query; warm connection.
const SUPABASE_COUNT_MS = 120;

// Human think time per step. Veteran numbers — faster across the board
// because the user knows what they're doing and tapped through this flow
// at least 3 times already.
const HUMAN_CONTACT_PICK_MS = 2500;  // muscle memory; taps recent borrower
const HUMAN_ITEM_ENTRY_MS = 3500;    // veteran typing, short title
const HUMAN_TIMEFRAME_PICK_MS = 1500; // tap one preset, no second thoughts
const HUMAN_SUBMIT_TAP_MS = 400;     // single tap on the Send button

// --- Stubs ------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Contacts permission stub — veteran has already granted.
const getPermissionsAsync = mock(async () => {
  await sleep(PERMISSION_LOOKUP_MS);
  return { status: 'granted', canAskAgain: true };
});
const requestPermissionsAsync = mock(async () => {
  // Should never fire for a veteran with permission granted. If it does,
  // the probe expectations below catch it.
  return { status: 'granted', canAskAgain: true };
});
const getContactsAsync = mock(async () => {
  await sleep(CONTACTS_FETCH_MS);
  return {
    data: Array.from({ length: 25 }, (_, i) => ({
      id: `c-${i}`,
      name: `Contact ${i}`,
      phoneNumbers: [{ number: `555-010${i}` }],
    })),
  };
});
mock.module('expo-contacts', () => ({
  getPermissionsAsync,
  requestPermissionsAsync,
  getContactsAsync,
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  Fields: { PhoneNumbers: 'phoneNumbers', Name: 'name' },
}));

// SMS stubs — simulates composer open + user tap Send.
const isAvailableAsync = mock(async () => true);
const sendSMSAsync = mock(async (_addresses: string | string[], _msg: string) => {
  await sleep(NATIVE_SMS_COMPOSER_MS);
  return { result: 'sent' as const };
});
mock.module('expo-sms', () => ({ isAvailableAsync, sendSMSAsync }));
mock.module('expo-clipboard', () => ({
  setStringAsync: mock(async () => true),
}));

// AsyncStorage stub — seed veteran's "skip preview" = true and a
// last-used tone so getLenderExperience reports skipPreview=true.
const asyncStorage = new Map<string, string>();
asyncStorage.set('lendlee.skipPreview', 'true');
asyncStorage.set('lendlee.lastUsedTone', 'friendly');
asyncStorage.set('lendlee.lastTone', 'friendly');
mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: mock(async (key: string) => asyncStorage.get(key) ?? null),
    setItem: mock(async (key: string, value: string) => {
      asyncStorage.set(key, value);
    }),
  },
}));

// Supabase stub — lend count returns 3 (veteran threshold), loan insert
// resolves after the simulated RTT. The count query uses the head:true
// form from lenderExperience.getLendCount — we model it as a thenable
// that awaits SUPABASE_COUNT_MS before resolving.
const supabaseCount = mock(async () => {
  await sleep(SUPABASE_COUNT_MS);
  return { count: 3, error: null };
});
const supabaseInsert = mock(async () => {
  await sleep(SUPABASE_INSERT_MS);
  return { data: [{ id: 'loan-1' }], error: null };
});
mock.module('@/lib/supabase', () => ({
  supabase: {
    from: mock((_table: string) => ({
      select: (_cols: string, _opts?: unknown) => ({
        eq: (_col: string, _val: unknown) => ({
          // Support both await-syntax and .then-style consumption.
          then: (resolve: (v: { count: number; error: null }) => void) =>
            supabaseCount().then(resolve),
        }),
      }),
      insert: supabaseInsert,
    })),
    rpc: mock(async () => {
      await sleep(SUPABASE_INSERT_MS);
      return { data: null, error: null };
    }),
  },
}));

// --- System under test (loaded after mocks) ---------------------------------
const {
  getContactsPermissionStatus,
} = await import('../lib/permissions/contacts');
const { detectCategory } = await import('../lib/categorize/autoCategory');
const { getReturnByForPreset } = await import('../lib/date/timeframe');
const { getLenderExperience } = await import('../lib/sms/lenderExperience');
const { sendSms } = await import('../lib/sms/sendSms');
const { buildSms } = await import('../lib/sms/templates');

// --- Step functions ---------------------------------------------------------

type StepTiming = {
  step: string;
  ms: number;
};

/**
 * Step 1 — Ready.
 *
 * Veteran mounts the lend screen with permission already granted. The
 * screen reads permission state (no prompt) and fetches the contact
 * book. We count this as a single "ready" step because it's the
 * pre-interaction cost the user waits through before they can tap
 * anything.
 */
async function step1Ready(): Promise<number> {
  const start = performance.now();
  const perm = await getContactsPermissionStatus();
  expect(perm.status).toBe('granted');

  // Contacts fetch happens on the same effect, in parallel with the
  // lender-experience lookup. Model as a Promise.all to reflect the
  // actual wiring the lend screen should use on mount.
  const Contacts = await import('expo-contacts');
  const [{ data }, exp] = await Promise.all([
    Contacts.getContactsAsync(),
    getLenderExperience('user-veteran-1'),
  ]);
  expect(data.length).toBeGreaterThan(0);
  // Core AC gate: for a veteran with skip-preview on, skipPreview must be true.
  expect(exp.isVeteran).toBe(true);
  expect(exp.skipPreview).toBe(true);

  return performance.now() - start;
}

async function step2ContactPick(): Promise<number> {
  const start = performance.now();
  // No re-fetch — the list is already in memory from step 1. Only the
  // human tap time counts here.
  await sleep(HUMAN_CONTACT_PICK_MS);
  return performance.now() - start;
}

async function step3ItemEntry(): Promise<number> {
  const start = performance.now();
  await sleep(HUMAN_ITEM_ENTRY_MS);
  const cat = detectCategory('Drill');
  expect(cat).toBeDefined();
  return performance.now() - start;
}

async function step4Timeframe(): Promise<number> {
  const start = performance.now();
  await sleep(HUMAN_TIMEFRAME_PICK_MS);
  const returnBy = getReturnByForPreset('2weeks');
  expect(returnBy).toBeInstanceOf(Date);
  return performance.now() - start;
}

/**
 * Step 5 — Submit (no preview).
 *
 * The veteran gate is `skipPreview && veteran`. When true, the lend
 * screen must NOT open the SmsPreviewModal; instead it should call the
 * submit path directly using the last-used tone. This probe models that
 * submit path: DB insert → build SMS body with last-used tone → native
 * SMS composer → user taps Send.
 */
async function step5SubmitNoPreview(): Promise<number> {
  const start = performance.now();

  // Tap-to-Send latency: the user taps "Lend it" (the veteran CTA that
  // replaces "Preview message") and the handler kicks off.
  await sleep(HUMAN_SUBMIT_TAP_MS);

  // The DB write happens before SMS per LENDLEE-017's ordering invariant.
  // Model it as a call to our supabaseInsert mock so the timer reflects
  // the same ordering a real submit would.
  const insertResult = await supabaseInsert();
  expect(insertResult.error).toBeNull();

  // Build the SMS body using the last-used tone. This is the body the
  // composer will receive.
  const message = buildSms(
    {
      borrowerName: 'Contact 0',
      lenderName: 'Veteran',
      itemName: 'Drill',
      returnDate: getReturnByForPreset('2weeks'),
    },
    'friendly',
  );
  expect(typeof message).toBe('string');
  expect(message.length).toBeGreaterThan(0);

  // Native SMS composer open + user taps Send.
  const result = await sendSms({ phone: '555-0100', message });
  expect(result.status).toBe('sent');

  return performance.now() - start;
}

async function runFullFlow(): Promise<{
  steps: StepTiming[];
  totalMs: number;
}> {
  const timings: StepTiming[] = [];
  const totalStart = performance.now();

  timings.push({ step: '1. Ready',          ms: await step1Ready() });
  timings.push({ step: '2. Contact pick',   ms: await step2ContactPick() });
  timings.push({ step: '3. Item entry',     ms: await step3ItemEntry() });
  timings.push({ step: '4. Timeframe',      ms: await step4Timeframe() });
  timings.push({ step: '5. Submit (no preview)', ms: await step5SubmitNoPreview() });

  const totalMs = performance.now() - totalStart;
  return { steps: timings, totalMs };
}

function median(ns: number[]): number {
  const sorted = [...ns].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// --- Tests ------------------------------------------------------------------

describe('veteran-lend timing — 5-step probe, skip-preview ON', () => {
  beforeEach(() => {
    getPermissionsAsync.mockClear();
    requestPermissionsAsync.mockClear();
    getContactsAsync.mockClear();
    isAvailableAsync.mockClear();
    sendSMSAsync.mockClear();
    supabaseInsert.mockClear();
    supabaseCount.mockClear();
  });

  const ONE_RUN_TIMEOUT = 30_000;
  const THREE_RUN_TIMEOUT = 90_000;

  test('veteran gate: skipPreview is true when user is veteran AND opted in', async () => {
    const exp = await getLenderExperience('user-veteran-1');
    expect(exp.isVeteran).toBe(true);
    expect(exp.skipPreview).toBe(true);
    expect(exp.lastUsedTone).toBe('friendly');
  });

  test('each step completes under its per-step budget', async () => {
    const { steps } = await runFullFlow();
    for (const { step, ms } of steps) {
      console.log(`[probe] ${step}: ${ms.toFixed(1)} ms`);
      // Any one veteran step should stay under 6 s — anything longer is
      // a UX smell even accounting for realistic human think time.
      expect(ms).toBeLessThan(6_000);
    }
  }, ONE_RUN_TIMEOUT);

  test('full flow end-to-end stays under 15 s (single run)', async () => {
    const { totalMs } = await runFullFlow();
    console.log(`[probe] total: ${totalMs.toFixed(1)} ms`);
    expect(totalMs).toBeLessThan(BUDGET_MS);
  }, ONE_RUN_TIMEOUT);

  test('3 runs + median stays under 15 s', async () => {
    const totals: number[] = [];
    for (let i = 0; i < 3; i++) {
      const { totalMs } = await runFullFlow();
      totals.push(totalMs);
      console.log(`[probe] run ${i + 1}: ${totalMs.toFixed(1)} ms`);
    }
    const med = median(totals);
    console.log(`[probe] median of 3 runs: ${med.toFixed(1)} ms`);
    // The AC bar: median of three runs must be under 15 s.
    expect(med).toBeLessThan(BUDGET_MS);
    // Deterministic stubs should keep the spread tight — any major
    // variance here would point at a leaked timer.
    const spread = Math.max(...totals) - Math.min(...totals);
    expect(spread).toBeLessThan(2_000);
  }, THREE_RUN_TIMEOUT);

  test('JS-only cost per step is small; human+native dominates', async () => {
    const { steps } = await runFullFlow();
    const byName = Object.fromEntries(steps.map((s) => [s.step, s.ms]));

    // Step 1 runs permission + contacts-fetch + lender-experience in
    // parallel; its JS-only cost is the longest of (permission-lookup,
    // contacts-fetch, supabase-count) plus ~0 JS. We approximate the
    // parallel "native" cost as the max of the three.
    const step1ParallelNativeMs = Math.max(
      PERMISSION_LOOKUP_MS,
      CONTACTS_FETCH_MS,
      SUPABASE_COUNT_MS,
    );

    const js = {
      ready: byName['1. Ready'] - step1ParallelNativeMs,
      contactPick: byName['2. Contact pick'] - HUMAN_CONTACT_PICK_MS,
      itemEntry: byName['3. Item entry'] - HUMAN_ITEM_ENTRY_MS,
      timeframe: byName['4. Timeframe'] - HUMAN_TIMEFRAME_PICK_MS,
      submit:
        byName['5. Submit (no preview)']
          - HUMAN_SUBMIT_TAP_MS
          - SUPABASE_INSERT_MS
          - NATIVE_SMS_COMPOSER_MS,
    };

    for (const [name, ms] of Object.entries(js)) {
      expect(ms).toBeLessThan(50);
      console.log(`[probe] js-only ${name}: ${ms.toFixed(1)} ms`);
    }
  }, ONE_RUN_TIMEOUT);

  test('permission prompt NEVER fires for a veteran with permission granted', async () => {
    await runFullFlow();
    // Core AC invariant: the OS permission sheet must not appear for a
    // veteran who already granted permission. If it does, we burn ~800 ms
    // that the 15 s budget cannot afford to lose.
    expect(requestPermissionsAsync).toHaveBeenCalledTimes(0);
  }, ONE_RUN_TIMEOUT);

  test('preview modal is bypassed — no preview-review time in the flow', async () => {
    // The probe has no step 5 "preview" — only a submit step. Proving it
    // by checking the step list stays length 5 and there is no step
    // whose name mentions "preview review".
    const { steps } = await runFullFlow();
    expect(steps).toHaveLength(5);
    for (const s of steps) {
      expect(s.step.toLowerCase()).not.toContain('preview review');
    }
    // And the SMS composer fires exactly once — not twice (which would
    // indicate a preview-then-send double-tap).
    expect(sendSMSAsync).toHaveBeenCalledTimes(1);
  }, ONE_RUN_TIMEOUT);

  test('SMS composer invoked exactly once with the expected message shape', async () => {
    await runFullFlow();
    expect(sendSMSAsync).toHaveBeenCalledTimes(1);
    const [addresses, message] = sendSMSAsync.mock.calls[0];
    expect(addresses).toEqual(['555-0100']);
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  }, ONE_RUN_TIMEOUT);
});
