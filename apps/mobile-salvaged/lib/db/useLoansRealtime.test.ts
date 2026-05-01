/**
 * Unit tests for useLoansRealtime (LENDLEE-018).
 *
 * The pure merge function gets most of the coverage because it owns the
 * dedupe / status-filtering invariants. A thin hook-level smoke test
 * verifies the subscription lifecycle (subscribe on mount, clean up on
 * unmount) against a mocked Supabase client.
 */
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import '../../test-support/mock-react-native';

// Mock the real Supabase client so `@/lib/supabase` doesn't drag
// SecureStore / AppState in at import time.
mock.module('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ eq: async () => ({ data: [], error: null }) }),
      }),
    }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => undefined,
  },
}));

mock.module('expo-secure-store', () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

const { mergeLoanEvent, useLoansRealtime } = await import('./useLoansRealtime');
import type { LoanWithItem } from './useLoansRealtime';

function loan(
  id: string,
  overrides: Partial<LoanWithItem> = {},
): LoanWithItem {
  return {
    id,
    item_id: `item-${id}`,
    contact_id: null,
    lender_id: 'user-1',
    borrower_name: 'Jamie',
    borrower_phone: '+15555550123',
    tone: 'friendly',
    lent_at: '2026-04-22T21:00:00.000Z',
    return_by: null,
    returned_at: null,
    status: 'active',
    reminder_sent: false,
    reminder_sent_at: null,
    notes: null,
    created_at: '2026-04-22T21:00:00.000Z',
    ...overrides,
  };
}

describe('mergeLoanEvent', () => {
  test('INSERT prepends a new active loan to the list', () => {
    const prev = [loan('a')];
    const event = {
      eventType: 'INSERT' as const,
      new: loan('b'),
      old: {},
    };
    const next = mergeLoanEvent(prev, event);
    expect(next.map((l) => l.id)).toEqual(['b', 'a']);
  });

  test('INSERT is a no-op when the id is already present (dedupe invariant)', () => {
    const existing = loan('a');
    const prev = [existing];
    const event = {
      eventType: 'INSERT' as const,
      new: loan('a', { borrower_name: 'Different' }),
      old: {},
    };
    const next = mergeLoanEvent(prev, event);
    expect(next).toHaveLength(1);
    // The original row wins — INSERT events for rows that were already
    // merged by the initial fetch must not overwrite the joined item.
    expect(next[0]).toBe(existing);
  });

  test('INSERT of a non-active row is skipped', () => {
    const prev = [loan('a')];
    const event = {
      eventType: 'INSERT' as const,
      new: loan('b', { status: 'returned' }),
      old: {},
    };
    const next = mergeLoanEvent(prev, event);
    expect(next).toEqual(prev);
  });

  test('UPDATE replaces the matching row in-place', () => {
    const prev = [loan('a'), loan('b')];
    const updated = loan('b', { borrower_name: 'New Name' });
    const event = { eventType: 'UPDATE' as const, new: updated, old: {} };
    const next = mergeLoanEvent(prev, event);
    expect(next).toHaveLength(2);
    expect(next[1].borrower_name).toBe('New Name');
    // Other rows untouched.
    expect(next[0]).toBe(prev[0]);
  });

  test('UPDATE to a non-active status removes the row from the active list', () => {
    const prev = [loan('a'), loan('b')];
    const event = {
      eventType: 'UPDATE' as const,
      new: loan('a', { status: 'returned', returned_at: '2026-04-23T00:00:00Z' }),
      old: {},
    };
    const next = mergeLoanEvent(prev, event);
    expect(next.map((l) => l.id)).toEqual(['b']);
  });

  test('UPDATE for a row we never saw adds it if active', () => {
    // Happens when a realtime UPDATE races the initial fetch and the
    // original INSERT event was dropped (e.g. channel was still
    // connecting). We still want the active row visible.
    const prev = [loan('a')];
    const event = {
      eventType: 'UPDATE' as const,
      new: loan('c'),
      old: {},
    };
    const next = mergeLoanEvent(prev, event);
    expect(next.map((l) => l.id)).toEqual(['c', 'a']);
  });

  test('DELETE removes the row by id', () => {
    const prev = [loan('a'), loan('b')];
    const event = {
      eventType: 'DELETE' as const,
      new: {},
      old: { id: 'a' },
    };
    const next = mergeLoanEvent(prev, event);
    expect(next.map((l) => l.id)).toEqual(['b']);
  });

  test('DELETE for an unknown id is a no-op', () => {
    const prev = [loan('a')];
    const event = {
      eventType: 'DELETE' as const,
      new: {},
      old: { id: 'does-not-exist' },
    };
    const next = mergeLoanEvent(prev, event);
    expect(next).toEqual(prev);
  });
});

// ---- Hook-level smoke tests ------------------------------------------------
//
// These verify the lifecycle contract:
//   - the initial fetch fires with the expected filters
//   - a postgres_changes listener is registered with the lender_id filter
//   - unmounting tears the channel down
// They deliberately do NOT re-test the merge logic (covered above).

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

type SubscribeRecord = { callbacks: Array<(payload: any) => void> };

function makeFakeClient() {
  const state = {
    selectCalls: [] as string[],
    filters: [] as Array<{ col: string; val: string }>,
    fetchResult: { data: [] as any[], error: null as unknown },
    channelName: '' as string,
    listener: undefined as undefined | ((payload: any) => void),
    onFilter: undefined as
      | undefined
      | { event: string; schema: string; table: string; filter: string },
    subscribed: false,
    removed: false,
  };

  const builder: any = {
    select: (cols: string) => {
      state.selectCalls.push(cols);
      return builder;
    },
    eq: (col: string, val: string) => {
      state.filters.push({ col, val });
      // After both .eq() calls the query is awaited; model that by
      // letting .eq() itself be thenable on the second call.
      if (state.filters.length >= 2) {
        return {
          then: (resolve: (r: { data: any[]; error: unknown }) => void) => {
            resolve(state.fetchResult);
            return { catch: () => undefined };
          },
        } as any;
      }
      return builder;
    },
  };

  const channel: any = {
    on: (event: string, filter: any, listener: (payload: any) => void) => {
      state.onFilter = filter;
      state.listener = listener;
      return channel;
    },
    subscribe: () => {
      state.subscribed = true;
      return channel;
    },
    unsubscribe: () => undefined,
  };

  const client = {
    from: (_table: string) => builder,
    channel: (name: string) => {
      state.channelName = name;
      return channel;
    },
    removeChannel: (_ch: any) => {
      state.removed = true;
    },
  };

  return { client, state };
}

function HookHarness({
  userId,
  onInsert,
  client,
  spy,
}: {
  userId: string | null | undefined;
  onInsert?: (loan: any) => void;
  client: any;
  spy: (result: { loans: any[]; loading: boolean }) => void;
}) {
  const result = useLoansRealtime(userId, { onInsert, client });
  spy(result);
  return null;
}

describe('useLoansRealtime (hook)', () => {
  test('fires the initial fetch with lender_id=userId and status=active', async () => {
    const { client, state } = makeFakeClient();
    state.fetchResult = { data: [loan('a')], error: null };

    const spy = mock(() => undefined);
    let tree: TestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = TestRenderer.create(
        React.createElement(HookHarness, {
          userId: 'user-1',
          client,
          spy,
        }),
      );
    });

    expect(state.selectCalls).toContain('*, items(*)');
    expect(state.filters).toEqual([
      { col: 'lender_id', val: 'user-1' },
      { col: 'status', val: 'active' },
    ]);
    tree?.unmount();
  });

  test('subscribes to postgres_changes filtered by lender_id', async () => {
    const { client, state } = makeFakeClient();
    const spy = mock(() => undefined);
    let tree: TestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = TestRenderer.create(
        React.createElement(HookHarness, {
          userId: 'user-42',
          client,
          spy,
        }),
      );
    });

    expect(state.subscribed).toBe(true);
    expect(state.onFilter?.filter).toBe('lender_id=eq.user-42');
    expect(state.onFilter?.table).toBe('loans');
    expect(state.channelName).toBe('loans-realtime-user-42');
    tree?.unmount();
  });

  test('unmount removes the channel', async () => {
    const { client, state } = makeFakeClient();
    const spy = mock(() => undefined);
    let tree: TestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = TestRenderer.create(
        React.createElement(HookHarness, {
          userId: 'user-1',
          client,
          spy,
        }),
      );
    });

    expect(state.removed).toBe(false);
    await act(async () => {
      tree?.unmount();
    });
    expect(state.removed).toBe(true);
  });

  test('onInsert fires only for brand-new INSERTs (dedupe against initial fetch)', async () => {
    const { client, state } = makeFakeClient();
    // Seed the initial fetch with loan "a" so the realtime INSERT for
    // that id should be ignored by onInsert.
    state.fetchResult = { data: [loan('a')], error: null };

    const onInsert = mock(() => undefined);
    const spy = mock(() => undefined);

    let tree: TestRenderer.ReactTestRenderer | null = null;
    await act(async () => {
      tree = TestRenderer.create(
        React.createElement(HookHarness, {
          userId: 'user-1',
          onInsert,
          client,
          spy,
        }),
      );
    });

    // Echo of the existing row — must NOT re-fire onInsert.
    await act(async () => {
      state.listener?.({
        eventType: 'INSERT',
        new: loan('a'),
        old: {},
      });
    });
    expect(onInsert).not.toHaveBeenCalled();

    // Brand new row — should fire.
    await act(async () => {
      state.listener?.({
        eventType: 'INSERT',
        new: loan('b'),
        old: {},
      });
    });
    expect(onInsert).toHaveBeenCalledTimes(1);

    tree?.unmount();
  });
});
