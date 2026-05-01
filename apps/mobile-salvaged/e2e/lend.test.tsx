/**
 * LENDLEE-017 — submit handler for the lend flow.
 *
 * The screen itself (`app/(tabs)/lend.tsx`) is a thin UI wrapper around
 * `submitLend()`; this suite targets the orchestrator directly so we can
 * verify the contract without booting expo-router + the native runtime.
 * A render-level test of the tab screen is gated on a proper integration
 * harness (Detox/Maestro) and is tracked separately in LENDLEE-025 / 026.
 */
import { describe, test, expect, mock } from 'bun:test';
import '../test-support/mock-react-native';

mock.module('@/lib/supabase', () => ({
  supabase: { rpc: async () => ({ data: null, error: null }) },
}));

mock.module('expo-secure-store', () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

mock.module('expo-sms', () => ({
  isAvailableAsync: async () => true,
  sendSMSAsync: async () => ({ result: 'sent' }),
}));

mock.module('expo-clipboard', () => ({
  setStringAsync: async () => true,
}));

const { submitLend, mapCategoryToDb } = await import('@/lib/lend/submitLend');
import type { LendItemResult } from '@/lib/db/lendItem';
import type { SendSmsResult } from '@/lib/sms/sendSms';

type SubmitLendInput = Parameters<typeof submitLend>[0];

const sampleLoan = {
  id: '11111111-1111-1111-1111-111111111111',
  item_id: '22222222-2222-2222-2222-222222222222',
  contact_id: null,
  lender_id: '33333333-3333-3333-3333-333333333333',
  borrower_name: 'Jamie',
  borrower_phone: '+15555550123',
  tone: 'friendly',
  lent_at: '2026-04-22T21:00:00.000Z',
  return_by: '2026-05-06T21:00:00.000Z',
  returned_at: null,
  status: 'active' as const,
  reminder_sent: false,
  reminder_sent_at: null,
  notes: null,
  created_at: '2026-04-22T21:00:00.000Z',
};

function baseInput(overrides: Partial<SubmitLendInput> = {}): SubmitLendInput {
  return {
    selectedContact: { name: 'Jamie', phone: '+15555550123' },
    itemTitle: 'Dune',
    category: 'book',
    returnBy: new Date('2026-05-06T21:00:00.000Z'),
    tone: 'friendly',
    lenderName: 'Yonnas',
    ...overrides,
  };
}

function makeDeps(params: {
  lendItemResponse: LendItemResult;
  sendSmsResponse?: SendSmsResult;
}) {
  const lendItemCalls: Array<Record<string, unknown>> = [];
  const sendSmsCalls: Array<Record<string, unknown>> = [];

  const lendItem = mock(async (args: any) => {
    lendItemCalls.push(args);
    return params.lendItemResponse;
  });

  const sendSms = mock(async (args: any) => {
    sendSmsCalls.push(args);
    return params.sendSmsResponse ?? { status: 'sent' as const };
  });

  const buildSms = mock(() => 'STUB MESSAGE');

  return { lendItem, sendSms, buildSms, lendItemCalls, sendSmsCalls };
}

describe('mapCategoryToDb', () => {
  test('passes book and tool through unchanged', () => {
    expect(mapCategoryToDb('book')).toBe('book');
    expect(mapCategoryToDb('tool')).toBe('tool');
  });

  test('collapses electronics / clothing / kitchen to gear', () => {
    expect(mapCategoryToDb('electronics')).toBe('gear');
    expect(mapCategoryToDb('clothing')).toBe('gear');
    expect(mapCategoryToDb('kitchen')).toBe('gear');
  });

  test('keeps other as other', () => {
    expect(mapCategoryToDb('other')).toBe('other');
  });
});

describe('submitLend — validation', () => {
  test('returns validation-error when no contact is selected', async () => {
    const deps = makeDeps({ lendItemResponse: { data: sampleLoan as any, error: null } });
    const result = await submitLend(baseInput({ selectedContact: null }), deps);
    expect(result.kind).toBe('validation-error');
    // DB must not be hit on a pure validation failure.
    expect(deps.lendItem).not.toHaveBeenCalled();
    expect(deps.sendSms).not.toHaveBeenCalled();
  });

  test('returns validation-error when the item title is empty', async () => {
    const deps = makeDeps({ lendItemResponse: { data: sampleLoan as any, error: null } });
    const result = await submitLend(baseInput({ itemTitle: '   ' }), deps);
    expect(result.kind).toBe('validation-error');
    expect(deps.lendItem).not.toHaveBeenCalled();
  });

  test('returns validation-error when contact phone is missing', async () => {
    const deps = makeDeps({ lendItemResponse: { data: sampleLoan as any, error: null } });
    const result = await submitLend(
      baseInput({ selectedContact: { name: 'Jamie', phone: '' } }),
      deps,
    );
    expect(result.kind).toBe('validation-error');
  });
});

describe('submitLend — DB first, SMS second', () => {
  test('calls lendItem BEFORE sendSms', async () => {
    const order: string[] = [];

    const lendItem = mock(async () => {
      order.push('db');
      return { data: sampleLoan as any, error: null };
    });
    const sendSms = mock(async () => {
      order.push('sms');
      return { status: 'sent' as const };
    });
    const buildSms = mock(() => 'msg');

    await submitLend(baseInput(), { lendItem, sendSms, buildSms });

    expect(order).toEqual(['db', 'sms']);
  });

  test('forwards the typed args to lendItem (p_title / p_category / etc. shape lives in the RPC helper)', async () => {
    const deps = makeDeps({ lendItemResponse: { data: sampleLoan as any, error: null } });
    await submitLend(baseInput(), deps);

    expect(deps.lendItemCalls).toHaveLength(1);
    const args = deps.lendItemCalls[0] as Record<string, unknown>;
    expect(args.title).toBe('Dune');
    expect(args.category).toBe('book');
    expect(args.borrowerName).toBe('Jamie');
    expect(args.borrowerPhone).toBe('+15555550123');
    expect(args.tone).toBe('friendly');
  });

  test('does NOT call sendSms when the DB write fails', async () => {
    const deps = makeDeps({
      lendItemResponse: {
        data: null,
        error: { message: 'db down', code: '08006' },
      },
    });

    const result = await submitLend(baseInput(), deps);

    expect(result.kind).toBe('db-error');
    if (result.kind === 'db-error') {
      expect(result.error.message).toBe('db down');
    }
    expect(deps.sendSms).not.toHaveBeenCalled();
  });
});

describe('submitLend — SMS result branching', () => {
  test('reports sms-sent on status=sent', async () => {
    const deps = makeDeps({
      lendItemResponse: { data: sampleLoan as any, error: null },
      sendSmsResponse: { status: 'sent' },
    });
    const result = await submitLend(baseInput(), deps);
    expect(result.kind).toBe('sms-sent');
    if (result.kind === 'sms-sent') expect(result.loan).toBeDefined();
  });

  test('reports sms-cancelled on status=cancelled and preserves the loan', async () => {
    const deps = makeDeps({
      lendItemResponse: { data: sampleLoan as any, error: null },
      sendSmsResponse: { status: 'cancelled' },
    });
    const result = await submitLend(baseInput(), deps);
    expect(result.kind).toBe('sms-cancelled');
    // AC: on DB success + SMS canceled, keep the loan row. We model that
    // by handing the loan back so the UI knows the row exists.
    if (result.kind === 'sms-cancelled') {
      expect(result.loan.id).toBe(sampleLoan.id);
    }
  });

  test('reports sms-copied when the composer is unavailable', async () => {
    const deps = makeDeps({
      lendItemResponse: { data: sampleLoan as any, error: null },
      sendSmsResponse: { status: 'copied' },
    });
    const result = await submitLend(baseInput(), deps);
    expect(result.kind).toBe('sms-copied');
  });

  test('reports sms-unknown for indeterminate Android composer results', async () => {
    const deps = makeDeps({
      lendItemResponse: { data: sampleLoan as any, error: null },
      sendSmsResponse: { status: 'unknown' },
    });
    const result = await submitLend(baseInput(), deps);
    expect(result.kind).toBe('sms-unknown');
  });
});

describe('submitLend — SMS body', () => {
  test('passes the selected tone and form values to buildSms', async () => {
    const deps = makeDeps({
      lendItemResponse: { data: sampleLoan as any, error: null },
    });

    await submitLend(baseInput({ tone: 'casual' }), deps);

    expect(deps.buildSms).toHaveBeenCalledTimes(1);
    const [bodyArgs, tone] = deps.buildSms.mock.calls[0] as [any, string];
    expect(tone).toBe('casual');
    expect(bodyArgs.borrowerName).toBe('Jamie');
    expect(bodyArgs.itemName).toBe('Dune');
  });

  test('falls back to a generic lender name when the profile is missing one', async () => {
    const deps = makeDeps({
      lendItemResponse: { data: sampleLoan as any, error: null },
    });

    await submitLend(baseInput({ lenderName: '' }), deps);

    const [bodyArgs] = deps.buildSms.mock.calls[0] as [any, string];
    // Anything non-empty works — the exact fallback is an implementation
    // detail, but it must NOT be an empty string (that would produce a
    // broken sentence in the SMS body).
    expect(typeof bodyArgs.lenderName).toBe('string');
    expect(bodyArgs.lenderName.length).toBeGreaterThan(0);
  });
});
