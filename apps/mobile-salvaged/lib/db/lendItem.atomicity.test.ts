/**
 * Atomicity tests for the `lend_item` RPC (LENDLEE-024).
 *
 * These tests exercise the RPC directly against a LOCAL Supabase instance
 * reachable at http://127.0.0.1:54321 (default `supabase start` ports).
 * They do NOT run against production — they require a reset-able DB.
 *
 * Run with: bun test lib/db/lendItem.atomicity.test.ts
 *
 * Setup:
 *   1. `supabase start` in apps/mobile-salvaged/
 *   2. `supabase db reset` to apply migrations (including LENDLEE-016's RPC)
 *   3. `bun test lib/db/lendItem.atomicity.test.ts`
 *
 * Env (optional — defaults target the standard local stack):
 *   SUPABASE_LOCAL_URL              (default: http://127.0.0.1:54321)
 *   SUPABASE_LOCAL_ANON_KEY         (default: the well-known local anon key)
 *   SUPABASE_LOCAL_SERVICE_ROLE_KEY (required — default is the well-known
 *                                    local service-role key, printed by
 *                                    `supabase status`)
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// --- Local-only defaults. DO NOT ship these keys in a production build. ---
const SUPABASE_URL =
  process.env.SUPABASE_LOCAL_URL ?? 'http://127.0.0.1:54321';
// Default local keys published by `supabase start` (non-secret for local dev).
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_LOCAL_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Skip this whole suite when a local Supabase isn't reachable, so CI that
// doesn't stand up Docker doesn't fail. We hit /auth/v1/health because
// PostgREST is gated by API keys; auth is anonymous-friendly.
async function isLocalSupabaseUp(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const LOCAL_UP = await isLocalSupabaseUp();
const describeLocal = LOCAL_UP ? describe : describe.skip;

if (!LOCAL_UP) {
  // eslint-disable-next-line no-console
  console.warn(
    `[lendItem.atomicity] Skipping: no local Supabase reachable at ${SUPABASE_URL}. ` +
      `Start it with \`supabase start\` and re-run.`,
  );
}

// --- Test fixtures ----------------------------------------------------------

const TEST_EMAIL = `atomicity+${Date.now()}@test.lendlee.local`;
const TEST_PASSWORD = 'AtomicityTest123!';
let testUserId: string | null = null;

// Service-role client bypasses RLS — used only for setup, teardown and
// row-count verification. The test subject (the RPC call) is always made
// through the authenticated anon client, so RLS behavior is preserved.
const admin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Authenticated client used for the RPC calls themselves.
let userClient: SupabaseClient | null = null;

async function countRows(table: 'items' | 'loans'): Promise<number> {
  // Scope counts to the test user so parallel test runs don't collide.
  // Loans are joined through items.owner_id.
  if (!testUserId) throw new Error('testUserId not seeded');
  if (table === 'items') {
    const { count, error } = await admin
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', testUserId);
    if (error) throw error;
    return count ?? 0;
  }
  const { data, error } = await admin
    .from('items')
    .select('id, loans!inner(id)')
    .eq('owner_id', testUserId);
  if (error) throw error;
  return (data ?? []).reduce(
    (acc: number, row: { loans: unknown[] }) =>
      acc + (Array.isArray(row.loans) ? row.loans.length : 0),
    0,
  );
}

async function seedTestUser() {
  // Create user via admin API (email_confirm bypasses the verification step).
  const created = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  testUserId = created.data.user!.id;

  // Sign that user in on the user-scoped client.
  userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await userClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signIn.error) throw signIn.error;
}

async function wipeTestUserRows() {
  if (!testUserId) return;
  // items.delete cascades to loans via ON DELETE CASCADE.
  await admin.from('items').delete().eq('owner_id', testUserId);
}

async function deleteTestUser() {
  if (!testUserId) return;
  await wipeTestUserRows();
  await admin.auth.admin.deleteUser(testUserId);
  testUserId = null;
}

// Per LENDLEE-016 spec:
//   lend_item(p_title text, p_category text, p_borrower_name text,
//             p_borrower_phone text, p_return_by timestamptz, p_tone text)
// Returns the new loans row.
type LendItemArgs = {
  p_title: string | null;
  p_category: string;
  p_borrower_name: string;
  p_borrower_phone: string;
  p_return_by: string | null;
  p_tone: string;
};

function validArgs(overrides: Partial<LendItemArgs> = {}): LendItemArgs {
  return {
    p_title: 'Test Book',
    p_category: 'book',
    p_borrower_name: 'QA Borrower',
    p_borrower_phone: '+15555550123',
    p_return_by: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    p_tone: 'gentle',
    ...overrides,
  };
}

async function callLendItem(args: LendItemArgs) {
  if (!userClient) throw new Error('userClient not initialized');
  return userClient.rpc('lend_item', args as unknown as Record<string, unknown>);
}

// --- Lifecycle --------------------------------------------------------------

beforeAll(async () => {
  if (!LOCAL_UP) return;
  await seedTestUser();
});

afterAll(async () => {
  if (!LOCAL_UP) return;
  await deleteTestUser();
});

beforeEach(async () => {
  if (!LOCAL_UP) return;
  await wipeTestUserRows();
});

// --- Tests ------------------------------------------------------------------

describeLocal('lend_item — atomicity', () => {
  test('AC1: malformed call (null title) rolls back — no rows in items or loans', async () => {
    const beforeItems = await countRows('items');
    const beforeLoans = await countRows('loans');

    const { error } = await callLendItem(validArgs({ p_title: null }));

    // We expect the call to fail (NOT NULL violation on items.title).
    expect(error).not.toBeNull();

    const afterItems = await countRows('items');
    const afterLoans = await countRows('loans');

    expect(afterItems).toBe(beforeItems);
    expect(afterLoans).toBe(beforeLoans);
  });

  test('AC2: valid call inserts exactly 1 item and 1 loan', async () => {
    const beforeItems = await countRows('items');
    const beforeLoans = await countRows('loans');

    const { error, data } = await callLendItem(validArgs());

    expect(error).toBeNull();
    expect(data).not.toBeNull();

    const afterItems = await countRows('items');
    const afterLoans = await countRows('loans');

    expect(afterItems - beforeItems).toBe(1);
    expect(afterLoans - beforeLoans).toBe(1);
  });

  test('AC3: 2 concurrent calls insert exactly 2 items and 2 loans (no phantom rows)', async () => {
    const beforeItems = await countRows('items');
    const beforeLoans = await countRows('loans');

    const [r1, r2] = await Promise.all([
      callLendItem(validArgs({ p_title: 'Concurrent A' })),
      callLendItem(validArgs({ p_title: 'Concurrent B' })),
    ]);

    expect(r1.error).toBeNull();
    expect(r2.error).toBeNull();

    const afterItems = await countRows('items');
    const afterLoans = await countRows('loans');

    expect(afterItems - beforeItems).toBe(2);
    expect(afterLoans - beforeLoans).toBe(2);
  });

  test('stress: 10 parallel calls insert exactly 10 items and 10 loans', async () => {
    const beforeItems = await countRows('items');
    const beforeLoans = await countRows('loans');

    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        callLendItem(validArgs({ p_title: `Parallel ${i}` })),
      ),
    );

    for (const r of results) expect(r.error).toBeNull();

    const afterItems = await countRows('items');
    const afterLoans = await countRows('loans');

    expect(afterItems - beforeItems).toBe(10);
    expect(afterLoans - beforeLoans).toBe(10);
  });
});
