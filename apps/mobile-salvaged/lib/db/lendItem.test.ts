/**
 * Unit tests for the `lendItem` helper (LENDLEE-016).
 *
 * These verify that the helper marshals its args into the RPC's
 * `p_*` parameter shape correctly and normalizes the RPC result into
 * a `{ data, error }` tuple. They do NOT exercise the database — the
 * end-to-end atomicity coverage lives in `lendItem.atomicity.test.ts`,
 * which runs against a local Supabase stack.
 */
import { describe, test, expect, mock } from 'bun:test';
import '../../test-support/mock-react-native';

// Mock the project's Supabase client so importing `@/lib/supabase` doesn't
// pull in SecureStore / AppState at module-load time.
mock.module('@/lib/supabase', () => ({
  supabase: { rpc: async () => ({ data: null, error: null }) },
}));

mock.module('expo-secure-store', () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

const { lendItem } = await import('./lendItem');

type RpcResponse = { data: unknown; error: unknown };

function makeMockClient(response: RpcResponse) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const rpc = mock((fn: string, args: Record<string, unknown>) => {
    calls.push({ fn, args });
    return Promise.resolve(response);
  });
  return { client: { rpc } as unknown as Parameters<typeof lendItem>[1], calls };
}

const sampleLoan = {
  id: '11111111-1111-1111-1111-111111111111',
  item_id: '22222222-2222-2222-2222-222222222222',
  contact_id: null,
  lender_id: '33333333-3333-3333-3333-333333333333',
  borrower_name: 'Jamie',
  borrower_phone: '+15555550123',
  tone: 'gentle',
  lent_at: '2026-04-22T21:00:00.000Z',
  return_by: '2026-05-06T21:00:00.000Z',
  returned_at: null,
  status: 'active' as const,
  reminder_sent: false,
  reminder_sent_at: null,
  notes: null,
  created_at: '2026-04-22T21:00:00.000Z',
};

const baseArgs = {
  title: 'Dune',
  category: 'book' as const,
  borrowerName: 'Jamie',
  borrowerPhone: '+15555550123',
  returnBy: new Date('2026-05-06T21:00:00.000Z'),
  tone: 'gentle',
};

describe('lendItem', () => {
  test('calls the lend_item RPC with the p_ prefixed arg shape', async () => {
    const { client, calls } = makeMockClient({ data: sampleLoan, error: null });

    await lendItem(baseArgs, client);

    expect(calls).toHaveLength(1);
    expect(calls[0].fn).toBe('lend_item');
    expect(calls[0].args).toEqual({
      p_title: 'Dune',
      p_category: 'book',
      p_borrower_name: 'Jamie',
      p_borrower_phone: '+15555550123',
      p_return_by: '2026-05-06T21:00:00.000Z',
      p_tone: 'gentle',
    });
  });

  test('serializes a Date return_by to ISO', async () => {
    const { client, calls } = makeMockClient({ data: sampleLoan, error: null });
    await lendItem(baseArgs, client);
    expect(calls[0].args.p_return_by).toBe('2026-05-06T21:00:00.000Z');
  });

  test('passes a pre-serialized ISO string through unchanged', async () => {
    const { client, calls } = makeMockClient({ data: sampleLoan, error: null });
    await lendItem(
      { ...baseArgs, returnBy: '2026-07-01T00:00:00.000Z' },
      client,
    );
    expect(calls[0].args.p_return_by).toBe('2026-07-01T00:00:00.000Z');
  });

  test('returns { data, error: null } on success', async () => {
    const { client } = makeMockClient({ data: sampleLoan, error: null });
    const result = await lendItem(baseArgs, client);
    expect(result.error).toBeNull();
    expect(result.data).toEqual(sampleLoan as never);
  });

  test('returns { data: null, error } on RPC failure', async () => {
    const { client } = makeMockClient({
      data: null,
      error: { message: 'null value in column "title"', code: '23502' },
    });
    const result = await lendItem(baseArgs, client);
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'null value in column "title"',
      code: '23502',
    });
  });

  test('tolerates an error without a code', async () => {
    const { client } = makeMockClient({
      data: null,
      error: { message: 'boom' },
    });
    const result = await lendItem(baseArgs, client);
    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: 'boom', code: undefined });
  });
});
