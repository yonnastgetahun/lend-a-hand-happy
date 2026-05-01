/**
 * Submit-lend orchestrator (LENDLEE-017).
 *
 * Central invariant: the DB row is written BEFORE the SMS composer is
 * opened. If the composer is cancelled, the loan row still exists, which
 * matches the AC: "the record exists even if SMS is canceled". If the DB
 * write fails, the SMS is never attempted and the caller is expected to
 * keep the form state so the user can retry.
 *
 * The six lend-flow categories (from the WHAT step autoCategory) collapse
 * to the five categories accepted by the `lend_item` RPC. The mapping is
 * intentionally conservative — when in doubt we fall back to 'gear' or
 * 'other' rather than guessing wrong.
 */
import {
  lendItem as defaultLendItem,
  type LendItemArgs,
  type LendItemCategory,
  type LendItemError,
  type LendItemResult,
} from '@/lib/db/lendItem';
import {
  sendSms as defaultSendSms,
  type SendSmsParams,
  type SendSmsResult,
} from '@/lib/sms/sendSms';
import { buildSms as defaultBuildSms, type SmsTone } from '@/lib/sms/templates';
import type { LendCategory } from '@/lib/categorize/autoCategory';
import type { Loan } from '@/types/supabase';

export type SubmitLendInput = {
  selectedContact: { name: string; phone: string } | null;
  itemTitle: string;
  category: LendCategory;
  returnBy: Date | null;
  tone: SmsTone;
  lenderName: string;
};

export type SubmitLendResult =
  | { kind: 'validation-error'; message: string }
  | { kind: 'db-error'; error: LendItemError }
  | { kind: 'sms-cancelled'; loan: Loan }
  | { kind: 'sms-sent'; loan: Loan }
  | { kind: 'sms-copied'; loan: Loan }
  | { kind: 'sms-unknown'; loan: Loan };

export type SubmitLendDeps = {
  lendItem?: (args: LendItemArgs) => Promise<LendItemResult>;
  sendSms?: (params: SendSmsParams) => Promise<SendSmsResult>;
  buildSms?: typeof defaultBuildSms;
};

/**
 * Maps the six-bucket autoCategory output to the five categories the
 * `lend_item` RPC accepts. Electronics/clothing/kitchen fall under 'gear'
 * (catch-all for non-book/non-tool physical goods) because the server
 * does not yet differentiate them. When more categories are added to the
 * DB enum, update this mapping to match.
 */
export function mapCategoryToDb(category: LendCategory): LendItemCategory {
  switch (category) {
    case 'book':
      return 'book';
    case 'tool':
      return 'tool';
    case 'electronics':
    case 'clothing':
    case 'kitchen':
      return 'gear';
    case 'other':
    default:
      return 'other';
  }
}

function validate(input: SubmitLendInput): string | null {
  if (!input.selectedContact) return 'Pick someone to lend to first';
  if (!input.selectedContact.name?.trim()) return 'Contact name is missing';
  if (!input.selectedContact.phone?.trim()) return 'Contact phone is missing';
  if (!input.itemTitle?.trim()) return 'Name what you are lending';
  return null;
}

/**
 * Runs the full submit flow. Returns a discriminated union so the caller
 * (the `lend.tsx` screen) can decide what toast to show and whether to
 * reset + navigate. No UI concerns live in here.
 */
export async function submitLend(
  input: SubmitLendInput,
  deps: SubmitLendDeps = {},
): Promise<SubmitLendResult> {
  const validationError = validate(input);
  if (validationError) {
    return { kind: 'validation-error', message: validationError };
  }

  const lendItem = deps.lendItem ?? defaultLendItem;
  const sendSms = deps.sendSms ?? defaultSendSms;
  const buildSms = deps.buildSms ?? defaultBuildSms;

  // Non-null after validate().
  const contact = input.selectedContact!;

  // DB FIRST. If this fails, do NOT send the SMS — the user should see
  // the error and retry, and no loan row should exist.
  const dbResult = await lendItem({
    title: input.itemTitle.trim(),
    category: mapCategoryToDb(input.category),
    borrowerName: contact.name.trim(),
    borrowerPhone: contact.phone.trim(),
    returnBy: input.returnBy ?? '',
    tone: input.tone,
  });

  if (dbResult.error || !dbResult.data) {
    return {
      kind: 'db-error',
      error: dbResult.error ?? { message: 'Failed to save loan' },
    };
  }

  const loan = dbResult.data;

  // Build the SMS body at submit time using the chosen tone. This
  // mirrors the preview the user just saw.
  const message = buildSms(
    {
      borrowerName: contact.name.trim(),
      lenderName: input.lenderName.trim() || 'your friend',
      itemName: input.itemTitle.trim(),
      returnDate: input.returnBy,
    },
    input.tone,
  );

  const smsResult = await sendSms({
    phone: contact.phone.trim(),
    message,
  });

  switch (smsResult.status) {
    case 'sent':
      return { kind: 'sms-sent', loan };
    case 'cancelled':
      return { kind: 'sms-cancelled', loan };
    case 'copied':
      return { kind: 'sms-copied', loan };
    case 'unknown':
    default:
      return { kind: 'sms-unknown', loan };
  }
}
