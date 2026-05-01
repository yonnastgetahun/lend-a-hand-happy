/**
 * Typed wrapper around the `lend_item` Postgres RPC (LENDLEE-016).
 *
 * The RPC inserts an item row + a loan row in a single transaction on the
 * server, so callers don't have to orchestrate two writes or worry about
 * partial failures. On any error, neither row is persisted.
 */
import { supabase } from '@/lib/supabase';
import type { Loan } from '@/types/supabase';

export type LendItemCategory = 'book' | 'tool' | 'game' | 'gear' | 'other';

export type LendItemArgs = {
  title: string;
  category: LendItemCategory;
  borrowerName: string;
  borrowerPhone: string;
  returnBy: Date | string;
  tone: string;
};

export type LendItemError = {
  message: string;
  code?: string;
};

export type LendItemResult =
  | { data: Loan; error: null }
  | { data: null; error: LendItemError };

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export async function lendItem(
  args: LendItemArgs,
  client: Pick<typeof supabase, 'rpc'> = supabase,
): Promise<LendItemResult> {
  const { data, error } = await client.rpc('lend_item', {
    p_title: args.title,
    p_category: args.category,
    p_borrower_name: args.borrowerName,
    p_borrower_phone: args.borrowerPhone,
    p_return_by: toIso(args.returnBy),
    p_tone: args.tone,
  } as never);

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: (error as { code?: string }).code },
    };
  }

  return { data: data as unknown as Loan, error: null };
}
