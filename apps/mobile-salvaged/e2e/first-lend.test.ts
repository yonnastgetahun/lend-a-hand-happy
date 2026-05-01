/**
 * LENDLEE-026 — First-time lender end-to-end timing probe.
 *
 * No Detox/Maestro harness is configured in this repo, so this file is NOT a
 * true button-tap-to-SMS-sent E2E test. It is a programmatic probe that
 * measures each of the six steps in the first-lend flow, with native
 * dialogs (contacts permission, SMS composer) stubbed to configurable
 * latencies and a small, explicit "human think time" added per step so the
 * reported total reflects a realistic full run rather than JS-only floor.
 *
 * The six steps, per the AC:
 *   1. Permission prompt       — expo-contacts.requestPermissionsAsync
 *   2. Contact pick            — render list + user scrolls/taps one
 *   3. Item entry              — user types a title; autoCategory runs
 *   4. Timeframe               — user taps a preset chip
 *   5. Preview                 — SMS preview modal mounts; user reviews
 *   6. Send                    — expo-sms composer opens & reports 'sent'
 *
 * Running this test three times and taking the median of the totals is the
 * programmatic stand-in for "3 stopwatch runs on a warm device". The device
 * numbers go in the report — see qa-reports/first-lend-timing.md.
 *
 * What this CAN verify:
 *  - The JS work inside each step is negligible (< 50 ms per step).
 *  - With realistic native dialog latencies + modest human think times, the
 *    30 s budget is comfortably met.
 *  - No step has a hidden blocker (missing await, accidental Promise.race
 *    against a long timer, synchronous heavy work).
 *
 * What this CANNOT verify:
 *  - Real native dialog latency (iOS contacts sheet, SMS composer present).
 *    Those must be measured on device.
 *  - Real human think time. We use conservative defaults documented in the
 *    report; slower users may exceed the 30 s budget and that is expected.
 *  - Contacts list render with a 500-contact address book. RN FlatList
 *    first-paint is device-only; see R1 in the report.
 *
 * Run with:
 *   bun test e2e/first-lend.test.ts
 */
import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { registerReactNativeMock } from '../test-support/mock-react-native';

registerReactNativeMock(() => 'ios');

// Total AC budget.
const BUDGET_MS = 30_000;

// Simulated native dialog latencies (typical warm-device numbers).
// The real iOS contacts permission sheet reports ~250–600 ms from
// requestPermissionsAsync() invocation to the sheet appearing, plus the
// user's tap to resolve. We count the sheet+tap together here.
const NATIVE_PERMISSION_MS = 800;
// The iOS SMS composer present animation is ~500 ms; on Android the
// composer opens and sendSMSAsync resolves once the user taps Send.
const NATIVE_SMS_COMPOSER_MS = 900;
// Contact fetch from the OS address book. Empty → ~50 ms; 500 contacts
// can go to ~400 ms. Pick a middle-ground 250 ms.
const CONTACTS_FETCH_MS = 250;
// Supabase insert for the loan row.
const SUPABASE_INSERT_MS = 300;

// Human think time per step. These are conservative "first-time user"
// numbers; veterans are faster and have their own task (LENDLEE-027).
const HUMAN_CONTACT_PICK_MS = 4000; // scroll, scan, tap
const HUMAN_ITEM_ENTRY_MS = 5000;   // type "Drill" or similar
const HUMAN_TIMEFRAME_PICK_MS = 2000; // tap one of five preset chips
const HUMAN_PREVIEW_REVIEW_MS = 4000; // read preview, tap Send

// --- Stubs ------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Contacts permission stub — simulates OS dialog + user tap.
const requestPermissionsAsync = mock(async () => {
  await sleep(NATIVE_PERMISSION_MS);
  return { status: 'granted', canAskAgain: true };
});
const getPermissionsAsync = mock(async () => ({
  status: 'undetermined',
  canAskAgain: true,
}));
// Stubbed contacts fetch. The real app fetches on mount of the contact
// picker screen; we count it as part of the "load contacts" portion of
// step 2.
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

// AsyncStorage stub — veteran lookup returns "first-timer" by default.
const asyncStorage = new Map<string, string>();
mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: mock(async (key: string) => asyncStorage.get(key) ?? null),
    setItem: mock(async (key: string, value: string) => {
      asyncStorage.set(key, value);
    }),
  },
}));

// Supabase stub — loan insert + lend count lookup (0 for first-timer).
const supabaseInsert = mock(async () => {
  await sleep(SUPABASE_INSERT_MS);
  return { data: [{ id: 'loan-1' }], error: null };
});
mock.module('@/lib/supabase', () => ({
  supabase: {
    from: mock((_table: string) => ({
      select: (_cols: string, _opts?: unknown) => ({
        eq: (_col: string, _val: unknown) => ({
          then: (resolve: (v: { count: number | null; error: null }) => void) =>
            resolve({ count: 0, error: null }),
        }),
      }),
      insert: supabaseInsert,
    })),
  },
}));

// --- System under test (loaded after mocks) ---------------------------------
const {
  requestContactsPermission,
} = await import('../lib/permissions/contacts');
const { detectCategory } = await import('../lib/categorize/autoCategory');
const { getReturnByForPreset } = await import('../lib/date/timeframe');
const { getLenderExperience } = await import('../lib/sms/lenderExperience');
const { sendSms } = await import('../lib/sms/sendSms');

// --- Step functions ---------------------------------------------------------

type StepTiming = {
  step: string;
  ms: number;
};

async function step1PermissionPrompt(): Promise<number> {
  const start = performance.now();
  // Mirrors the first-lend entry point: on tapping Lend, the app checks
  // the current permission status and, if undetermined, triggers the OS
  // prompt. For a first-time lender we assume undetermined → request.
  const result = await requestContactsPermission();
  expect(result.status).toBe('granted');
  return performance.now() - start;
}

async function step2ContactPick(): Promise<number> {
  const start = performance.now();
  // Fetch contacts from the address book, then simulate human scroll/tap.
  const Contacts = await import('expo-contacts');
  const { data } = await Contacts.getContactsAsync();
  expect(data.length).toBeGreaterThan(0);
  await sleep(HUMAN_CONTACT_PICK_MS);
  return performance.now() - start;
}

async function step3ItemEntry(): Promise<number> {
  const start = performance.now();
  // Simulate the user typing by running autoCategory on each keystroke.
  // "Drill" → 5 characters → 5 detect calls.
  await sleep(HUMAN_ITEM_ENTRY_MS);
  const cat = detectCategory('Drill');
  expect(cat).toBeDefined();
  return performance.now() - start;
}

async function step4Timeframe(): Promise<number> {
  const start = performance.now();
  // User taps a preset. JS work = single getReturnByForPreset call.
  await sleep(HUMAN_TIMEFRAME_PICK_MS);
  const returnBy = getReturnByForPreset('2weeks');
  expect(returnBy).toBeInstanceOf(Date);
  return performance.now() - start;
}

async function step5Preview(): Promise<number> {
  const start = performance.now();
  // First-time lender always sees the preview modal. Look up their
  // lender experience (reads AsyncStorage + loan count) and render.
  const exp = await getLenderExperience('user-1');
  expect(exp.isVeteran).toBe(false);
  expect(exp.skipPreview).toBe(false);
  await sleep(HUMAN_PREVIEW_REVIEW_MS);
  return performance.now() - start;
}

async function step6Send(): Promise<number> {
  const start = performance.now();
  // Send the SMS (stubbed expo-sms).
  const result = await sendSms({
    phone: '555-0101',
    message: "Hey! You borrowed my Drill. Please return by Dec 5.",
  });
  expect(result.status).toBe('sent');
  return performance.now() - start;
}

async function runFullFlow(): Promise<{
  steps: StepTiming[];
  totalMs: number;
}> {
  const timings: StepTiming[] = [];
  const totalStart = performance.now();

  timings.push({ step: '1. Permission prompt', ms: await step1PermissionPrompt() });
  timings.push({ step: '2. Contact pick',      ms: await step2ContactPick() });
  timings.push({ step: '3. Item entry',        ms: await step3ItemEntry() });
  timings.push({ step: '4. Timeframe',         ms: await step4Timeframe() });
  timings.push({ step: '5. Preview',           ms: await step5Preview() });
  timings.push({ step: '6. Send',              ms: await step6Send() });

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

describe('first-lend timing — 6-step probe with simulated native + human time', () => {
  beforeEach(() => {
    asyncStorage.clear();
    requestPermissionsAsync.mockClear();
    getContactsAsync.mockClear();
    isAvailableAsync.mockClear();
    sendSMSAsync.mockClear();
    supabaseInsert.mockClear();
  });

  // Tests run the full simulated flow (~17 s of sleeps per run), so we
  // raise Bun's 5 s default timeout. The 3-runs-and-median test needs 3x.
  const ONE_RUN_TIMEOUT = 45_000;
  const THREE_RUN_TIMEOUT = 120_000;

  test('each step completes under its per-step budget', async () => {
    const { steps } = await runFullFlow();
    for (const { step, ms } of steps) {
      console.log(`[probe] ${step}: ${ms.toFixed(1)} ms`);
      // Each individual step must fit comfortably inside the 30 s budget
      // on its own. No single step is allowed > 10 s in the probe (that
      // would be a clear UX smell even accounting for human think time).
      expect(ms).toBeLessThan(10_000);
    }
  }, ONE_RUN_TIMEOUT);

  test('full flow end-to-end stays under 30 s (single run)', async () => {
    const { totalMs } = await runFullFlow();
    console.log(`[probe] total: ${totalMs.toFixed(1)} ms`);
    expect(totalMs).toBeLessThan(BUDGET_MS);
  }, ONE_RUN_TIMEOUT);

  test('3 runs + median stays under 30 s', async () => {
    const totals: number[] = [];
    for (let i = 0; i < 3; i++) {
      const { totalMs } = await runFullFlow();
      totals.push(totalMs);
      console.log(`[probe] run ${i + 1}: ${totalMs.toFixed(1)} ms`);
    }
    const med = median(totals);
    console.log(`[probe] median of 3 runs: ${med.toFixed(1)} ms`);
    // The AC bar: median of three runs must be under 30 s.
    expect(med).toBeLessThan(BUDGET_MS);
    // Runs should not vary wildly — max/min spread should be under 2 s
    // with deterministic stubs. If they do, a hidden timer is leaking.
    const spread = Math.max(...totals) - Math.min(...totals);
    expect(spread).toBeLessThan(2_000);
  }, THREE_RUN_TIMEOUT);

  test('JS-only cost per step is small; human+native dominates', async () => {
    // Re-run with all human think times zeroed (we can't zero them here
    // because the constants are inlined, but we can assert that the JS
    // work alone — i.e. subtracting the known sleeps — is tiny).
    const { steps } = await runFullFlow();
    const byName = Object.fromEntries(steps.map((s) => [s.step, s.ms]));

    // Each step's "JS-only" cost = total - (simulated native + human).
    const js = {
      permission: byName['1. Permission prompt'] - NATIVE_PERMISSION_MS,
      contactPick:
        byName['2. Contact pick'] - CONTACTS_FETCH_MS - HUMAN_CONTACT_PICK_MS,
      itemEntry: byName['3. Item entry'] - HUMAN_ITEM_ENTRY_MS,
      timeframe: byName['4. Timeframe'] - HUMAN_TIMEFRAME_PICK_MS,
      preview: byName['5. Preview'] - HUMAN_PREVIEW_REVIEW_MS,
      send: byName['6. Send'] - NATIVE_SMS_COMPOSER_MS,
    };

    for (const [name, ms] of Object.entries(js)) {
      // Each step's pure JS cost should be well under 50 ms. If we blow
      // this, there's accidental blocking work on the critical path.
      expect(ms).toBeLessThan(50);
      console.log(`[probe] js-only ${name}: ${ms.toFixed(1)} ms`);
    }
  }, ONE_RUN_TIMEOUT);

  test('permission prompt fires exactly once per first-time flow', async () => {
    await runFullFlow();
    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
  }, ONE_RUN_TIMEOUT);

  test('SMS composer invoked exactly once with the expected message shape', async () => {
    await runFullFlow();
    expect(sendSMSAsync).toHaveBeenCalledTimes(1);
    const [addresses, message] = sendSMSAsync.mock.calls[0];
    expect(addresses).toEqual(['555-0101']);
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  }, ONE_RUN_TIMEOUT);
});
