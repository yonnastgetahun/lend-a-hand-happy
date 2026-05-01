/**
 * Realtime loans hook (LENDLEE-018).
 *
 * Fetches the user's active loans on mount, then subscribes to
 * postgres_changes events filtered by lender_id so the list stays in
 * sync across devices without a manual refresh.
 *
 * The merge logic is pulled out into a pure function (mergeLoanEvent)
 * so we can unit-test the dedupe / status-filtering behavior without a
 * rendered hook. The central invariant: a row with a given id should
 * appear at most once in `loans` regardless of which order the initial
 * fetch and the realtime INSERT arrive in.
 */
import { useEffect, useRef, useState } from 'react';
import { supabase as defaultSupabase } from '@/lib/supabase';
import type { Loan } from '@/types/supabase';

// Shape of a loans row as returned by `select('*, items(*)')`. The join
// is not present on realtime payloads (those only carry the bare row),
// so items is nullable.
export type LoanWithItem = Loan & {
  items?: {
    id: string;
    title: string;
    category: 'book' | 'tool' | 'game' | 'gear' | 'other';
    photo_url: string | null;
  } | null;
};

type LoansRealtimeClient = {
  from: typeof defaultSupabase.from;
  channel: typeof defaultSupabase.channel;
  removeChannel: typeof defaultSupabase.removeChannel;
};

type PostgresChangesPayload =
  | { eventType: 'INSERT'; new: LoanWithItem; old: Partial<LoanWithItem> }
  | { eventType: 'UPDATE'; new: LoanWithItem; old: Partial<LoanWithItem> }
  | { eventType: 'DELETE'; old: { id: string } & Partial<LoanWithItem>; new: Partial<LoanWithItem> };

export type UseLoansRealtimeOptions = {
  /**
   * Fires whenever an INSERT event arrives for a loan that wasn't
   * already in state. Home uses this to show a success toast when a
   * fresh lend is written from any of the user's sessions.
   */
  onInsert?: (loan: LoanWithItem) => void;
  /** Injection seam for tests. */
  client?: LoansRealtimeClient;
};

export type UseLoansRealtimeResult = {
  loans: LoanWithItem[];
  loading: boolean;
};

/**
 * Pure merge function. Exported for tests.
 *
 * - INSERT: prepend, deduped by id. If the row is non-active, skip.
 * - UPDATE: replace by id. If the row is non-active, remove from list.
 * - DELETE: remove by id.
 */
export function mergeLoanEvent(
  prev: LoanWithItem[],
  event: PostgresChangesPayload,
): LoanWithItem[] {
  if (event.eventType === 'DELETE') {
    return prev.filter((l) => l.id !== event.old.id);
  }

  const next = event.new;
  const isActive = next.status === 'active';

  if (event.eventType === 'INSERT') {
    if (!isActive) return prev;
    if (prev.some((l) => l.id === next.id)) return prev;
    return [next, ...prev];
  }

  // UPDATE
  const exists = prev.some((l) => l.id === next.id);
  if (!isActive) {
    return prev.filter((l) => l.id !== next.id);
  }
  if (!exists) {
    // An UPDATE for an active row we hadn't seen yet — treat as insert.
    return [next, ...prev];
  }
  return prev.map((l) => (l.id === next.id ? next : l));
}

/**
 * Subscribe to the user's active loans. Returns `{ loans, loading }`.
 *
 * Pass `onInsert` to react to new rows (e.g. show a toast). The callback
 * fires only for INSERT events the hook hasn't already merged, so
 * retrying the same INSERT won't double-fire.
 */
export function useLoansRealtime(
  userId: string | null | undefined,
  opts: UseLoansRealtimeOptions = {},
): UseLoansRealtimeResult {
  const [loans, setLoans] = useState<LoanWithItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Keep the latest onInsert in a ref so we don't tear down the channel
  // every time the consumer redefines the callback inline.
  const onInsertRef = useRef(opts.onInsert);
  onInsertRef.current = opts.onInsert;

  const client = opts.client ?? (defaultSupabase as unknown as LoansRealtimeClient);

  useEffect(() => {
    if (!userId) {
      setLoans([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // Initial fetch — active loans joined with the item row.
    (async () => {
      const { data, error } = await client
        .from('loans')
        .select('*, items(*)')
        .eq('lender_id', userId)
        .eq('status', 'active');

      if (cancelled) return;
      if (error) {
        // Leave loans as whatever we have; surface loading=false so the
        // UI can render its empty state / retry affordance.
        setLoading(false);
        return;
      }
      setLoans((prev) => dedupeById([...(data ?? []) as LoanWithItem[], ...prev]));
      setLoading(false);
    })();

    // Realtime subscription. The channel name is scoped per user so
    // multiple hook instances (e.g. across screens) don't collide on a
    // single shared channel.
    const channel = client
      .channel(`loans-realtime-${userId}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'loans',
          filter: `lender_id=eq.${userId}`,
        } as never,
        (payload: PostgresChangesPayload) => {
          setLoans((prev) => {
            const next = mergeLoanEvent(prev, payload);
            if (
              payload.eventType === 'INSERT' &&
              next.length > prev.length
            ) {
              onInsertRef.current?.(payload.new);
            }
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      // Both unsubscribe() and removeChannel() tear the subscription
      // down; we call removeChannel so the client also drops its
      // internal reference and doesn't leak across hot reloads.
      try {
        client.removeChannel(channel);
      } catch {
        // If removeChannel isn't available on the mocked client, fall
        // back to unsubscribe on the channel itself.
        (channel as { unsubscribe?: () => void }).unsubscribe?.();
      }
    };
  }, [userId, client]);

  return { loans, loading };
}

function dedupeById(items: LoanWithItem[]): LoanWithItem[] {
  const seen = new Set<string>();
  const out: LoanWithItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
