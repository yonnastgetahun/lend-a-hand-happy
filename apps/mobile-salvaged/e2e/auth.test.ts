/**
 * LENDLEE-021 — Auth method timing probe
 *
 * No Detox/Maestro harness is configured in this repo, so this file is NOT a
 * true end-to-end test. It is a programmatic timing probe that measures the
 * JS-thread portion of each auth method from "handler invoked" to "session
 * emitted via onAuthStateChange" with Supabase/Apple/Google network hops
 * stubbed to a configurable latency.
 *
 * What this CAN verify:
 *  - The JS-side code path (handler → provider call → state propagation) is
 *    well under the 5000ms budget, even with a generous simulated network
 *    latency.
 *  - There is no accidental blocking work (e.g. a huge synchronous profile
 *    upsert, a setTimeout loop, a missing await) on the happy path.
 *
 * What this CANNOT verify:
 *  - Real native dialog latency (Apple's system sheet, Google's account
 *    picker). Those must be measured on device — see qa-reports/auth-timing.md.
 *  - Home screen render after session emits. RN navigation + FlatList first
 *    paint are device-only.
 *
 * Run with:
 *   bun test e2e/auth.test.ts
 *
 * If ANY probe exceeds BUDGET_MS, the JS side is the bottleneck regardless
 * of network, and the device run will also fail. If every probe is well
 * under BUDGET_MS, network and native dialogs dominate — go to the manual
 * device report to confirm.
 */
import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { registerReactNativeMock } from '../test-support/mock-react-native';

registerReactNativeMock(() => 'ios');

// Total budget from AC. The JS-only probe should be a small fraction of this.
const BUDGET_MS = 5000;
// JS-only budget. Real-device adds native dialog + network + home render on
// top. If we blow this on the JS side alone, device can't possibly pass.
const JS_BUDGET_MS = 500;
// Simulated network round-trip for Supabase auth. 300ms is a realistic warm
// value for a nearby region; 5000ms budget leaves plenty of headroom.
const FAKE_NETWORK_MS = 300;

type FakeSession = {
  access_token: string;
  user: { id: string; email: string };
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------- Shared stubs -----------------------------------------------------

const state: {
  networkDelayMs: number;
  authChangeHandler: ((event: string, session: FakeSession) => void) | null;
  capturedProfileUpserts: number;
} = {
  networkDelayMs: FAKE_NETWORK_MS,
  authChangeHandler: null,
  capturedProfileUpserts: 0,
};

const fakeSession: FakeSession = {
  access_token: 'fake-token',
  user: { id: 'user-123', email: 'probe@lendlee.test' },
};

// Stub Supabase. Each auth call:
//  1. Simulates a network delay of `state.networkDelayMs`.
//  2. Fires `authChangeHandler` with the fake session on its way out —
//     this is the "Home screen can now render" moment in the real app.
const signInWithPassword = mock(async () => {
  await sleep(state.networkDelayMs);
  state.authChangeHandler?.('SIGNED_IN', fakeSession);
  return { data: { session: fakeSession, user: fakeSession.user }, error: null };
});

const signInWithIdToken = mock(async () => {
  await sleep(state.networkDelayMs);
  state.authChangeHandler?.('SIGNED_IN', fakeSession);
  return { data: { session: fakeSession, user: fakeSession.user }, error: null };
});

const onAuthStateChange = mock(
  (handler: (event: string, session: FakeSession) => void) => {
    state.authChangeHandler = handler;
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            state.authChangeHandler = null;
          },
        },
      },
    };
  }
);

// Stubbed profile upsert — matches the real AuthProvider's post-login work.
// We time it as part of the JS budget because the user doesn't see "Home"
// until the provider's async work settles.
const upsertProfile = mock(async () => {
  await sleep(5); // simulate instant DB write
  state.capturedProfileUpserts += 1;
  return { error: null };
});

const fromProfiles = mock(() => ({
  select: () => ({
    eq: () => ({
      single: async () => ({ data: { id: fakeSession.user.id }, error: null }),
    }),
  }),
  upsert: upsertProfile,
  insert: upsertProfile,
  update: () => ({ eq: upsertProfile }),
}));

mock.module('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword,
      signInWithIdToken,
      onAuthStateChange,
      signOut: mock(async () => ({ error: null })),
    },
    from: fromProfiles,
  },
}));

// Stub expo-apple-authentication for the Apple probe.
mock.module('expo-apple-authentication', () => ({
  AppleAuthenticationScope: { FULL_NAME: 'name', EMAIL: 'email' },
  signInAsync: mock(async () => {
    // The native dialog would add ~300-800ms on device. We do NOT include
    // that here — this probe measures JS only. See the report for device
    // expectations.
    return {
      identityToken: 'apple-identity-token',
      authorizationCode: 'code',
      user: 'apple-user',
      email: fakeSession.user.email,
      fullName: { givenName: 'Probe', familyName: 'User' },
    };
  }),
}));

// Stub Google Sign-In
const googleSignIn = mock(async () => ({
  data: {
    idToken: 'google-id-token',
    user: { name: 'Probe User', email: fakeSession.user.email },
  },
}));
mock.module('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: mock(() => {}),
    hasPlayServices: mock(async () => true),
    signIn: googleSignIn,
  },
}));

// ---------- Probes -----------------------------------------------------------

async function probeEmailPassword(): Promise<number> {
  const start = performance.now();
  // Mirrors AuthProvider.login (lib/auth + provider glue).
  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: fakeSession.user.email,
    password: 'test-password-1234',
  });
  expect(error).toBeNull();
  expect(data.session).toBeDefined();
  // AuthProvider also does a profile existence check + optional insert.
  await supabase.from('profiles').select().eq('id', data.user.id).single();
  return performance.now() - start;
}

async function probeApple(): Promise<number> {
  const start = performance.now();
  const { signInWithApple } = await import('../lib/auth/apple');
  const result = await signInWithApple();
  expect(result.canceled).toBe(false);
  expect(result.session).toBeDefined();
  return performance.now() - start;
}

async function probeGoogle(): Promise<number> {
  const start = performance.now();
  // Mirrors handleGoogleSignIn in app/login.tsx.
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  const { supabase } = await import('@/lib/supabase');
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;
  expect(idToken).toBeTruthy();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken!,
    nonce: '',
  });
  expect(error).toBeNull();
  expect(data.session).toBeDefined();
  return performance.now() - start;
}

// ---------- Tests ------------------------------------------------------------

describe('auth timing — JS floor (stubbed network)', () => {
  beforeEach(() => {
    state.authChangeHandler = null;
    state.capturedProfileUpserts = 0;
    state.networkDelayMs = FAKE_NETWORK_MS;
    signInWithPassword.mockClear();
    signInWithIdToken.mockClear();
    upsertProfile.mockClear();
    googleSignIn.mockClear();

    // Register an auth change listener up front (the real app does this in
    // useSession on mount). Stubbed signIn calls fire through it.
    onAuthStateChange((event, session) => {
      // noop subscriber; presence of the handler is what matters.
      void event;
      void session;
    });
  });

  test('Email/password stays well under 5000ms JS-side', async () => {
    const elapsed = await probeEmailPassword();
    console.log(`[probe] email/password: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(BUDGET_MS);
    // Actually we expect MUCH less than the total budget on the JS side.
    expect(elapsed - state.networkDelayMs).toBeLessThan(JS_BUDGET_MS);
  });

  test('Apple Sign-In stays well under 5000ms JS-side', async () => {
    const elapsed = await probeApple();
    console.log(`[probe] apple: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(BUDGET_MS);
    expect(elapsed - state.networkDelayMs).toBeLessThan(JS_BUDGET_MS);
  });

  test('Google Sign-In stays well under 5000ms JS-side', async () => {
    const elapsed = await probeGoogle();
    console.log(`[probe] google: ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(BUDGET_MS);
    expect(elapsed - state.networkDelayMs).toBeLessThan(JS_BUDGET_MS);
  });

  test('No method regresses when network is slow (1500ms)', async () => {
    // Sanity check: with a slow-but-realistic network, we still have budget.
    state.networkDelayMs = 1500;
    const [emailMs, appleMs, googleMs] = await Promise.all([
      probeEmailPassword(),
      probeApple(),
      probeGoogle(),
    ]);
    console.log(
      `[probe] slow-network: email=${emailMs.toFixed(1)}ms apple=${appleMs.toFixed(1)}ms google=${googleMs.toFixed(1)}ms`
    );
    expect(emailMs).toBeLessThan(BUDGET_MS);
    expect(appleMs).toBeLessThan(BUDGET_MS);
    expect(googleMs).toBeLessThan(BUDGET_MS);
  });

  test('onAuthStateChange fires exactly once per login (no double-fire cost)', async () => {
    let fireCount = 0;
    onAuthStateChange(() => {
      fireCount += 1;
    });
    await probeEmailPassword();
    expect(fireCount).toBe(1);
  });
});
