import { describe, test, expect, mock, beforeEach } from 'bun:test';

// --- AsyncStorage mock ----------------------------------------------------
const storage = new Map<string, string>();
const storageThrows = { getItem: false, setItem: false };

const getItem = mock(async (key: string) => {
  if (storageThrows.getItem) throw new Error('getItem failed');
  return storage.has(key) ? storage.get(key)! : null;
});
const setItem = mock(async (key: string, value: string) => {
  if (storageThrows.setItem) throw new Error('setItem failed');
  storage.set(key, value);
});

mock.module('@react-native-async-storage/async-storage', () => ({
  default: { getItem, setItem },
}));

// --- Supabase mock --------------------------------------------------------
type SupabaseQueryState = {
  count: number | null;
  error: { message: string } | null;
  capturedTable: string | null;
  capturedSelect: string | null;
  capturedSelectOptions: { count?: string; head?: boolean } | null;
  capturedEq: { column: string; value: unknown } | null;
};

const sb: SupabaseQueryState = {
  count: 0,
  error: null,
  capturedTable: null,
  capturedSelect: null,
  capturedSelectOptions: null,
  capturedEq: null,
};

function makeQuery() {
  const query: any = {
    select: mock((columns: string, opts?: { count?: string; head?: boolean }) => {
      sb.capturedSelect = columns;
      sb.capturedSelectOptions = opts ?? null;
      return query;
    }),
    eq: mock((column: string, value: unknown) => {
      sb.capturedEq = { column, value };
      // The chain ends here — return a thenable so `await` resolves with
      // { count, error } the way Supabase's count-head queries do.
      return {
        then: (resolve: (v: { count: number | null; error: any }) => void) =>
          resolve({ count: sb.count, error: sb.error }),
      };
    }),
  };
  return query;
}

const from = mock((table: string) => {
  sb.capturedTable = table;
  return makeQuery();
});

mock.module('@/lib/supabase', () => ({
  supabase: { from },
}));

// --- System under test ----------------------------------------------------
const {
  VETERAN_THRESHOLD,
  SKIP_PREVIEW_KEY,
  LAST_USED_TONE_KEY,
  getLendCount,
  isVeteran,
  isVeteranLender,
  getSkipPreviewSetting,
  setSkipPreviewSetting,
  getLastUsedTone,
  setLastUsedTone,
  getLenderExperience,
} = await import('./lenderExperience');

function reset() {
  storage.clear();
  storageThrows.getItem = false;
  storageThrows.setItem = false;
  sb.count = 0;
  sb.error = null;
  sb.capturedTable = null;
  sb.capturedSelect = null;
  sb.capturedSelectOptions = null;
  sb.capturedEq = null;
  getItem.mockClear();
  setItem.mockClear();
  from.mockClear();
}

describe('lenderExperience — constants', () => {
  test('VETERAN_THRESHOLD is 3 (the AC bar)', () => {
    expect(VETERAN_THRESHOLD).toBe(3);
  });

  test('SKIP_PREVIEW_KEY matches the documented AsyncStorage key', () => {
    expect(SKIP_PREVIEW_KEY).toBe('lendlee.skipPreview');
  });

  test('LAST_USED_TONE_KEY is namespaced under lendlee.', () => {
    expect(LAST_USED_TONE_KEY.startsWith('lendlee.')).toBe(true);
  });
});

describe('getLendCount', () => {
  beforeEach(reset);

  test('queries the loans table joined to items.owner_id (NOT items)', async () => {
    sb.count = 5;
    await getLendCount('user-1');

    expect(sb.capturedTable).toBe('loans');
    // The select must filter through items so we count loans-by-owner,
    // not items-by-owner. The Debug hint is explicit about this.
    expect(sb.capturedSelect).toContain('items!inner');
    expect(sb.capturedSelectOptions).toEqual({ count: 'exact', head: true });
    expect(sb.capturedEq).toEqual({ column: 'items.owner_id', value: 'user-1' });
  });

  test('returns the count when the query succeeds', async () => {
    sb.count = 7;
    expect(await getLendCount('user-1')).toBe(7);
  });

  test('returns 0 when count is null', async () => {
    sb.count = null;
    expect(await getLendCount('user-1')).toBe(0);
  });

  test('returns 0 (does not throw) when Supabase returns an error', async () => {
    sb.count = null;
    sb.error = { message: 'rls denied' };
    expect(await getLendCount('user-1')).toBe(0);
  });

  test('returns 0 without hitting Supabase for an empty userId', async () => {
    expect(await getLendCount('')).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });
});

describe('isVeteran / isVeteranLender', () => {
  beforeEach(reset);

  test('false when count is below threshold', async () => {
    sb.count = 2;
    expect(await isVeteran('u')).toBe(false);
  });

  test('true at exactly the threshold', async () => {
    sb.count = 3;
    expect(await isVeteran('u')).toBe(true);
  });

  test('true above the threshold', async () => {
    sb.count = 99;
    expect(await isVeteran('u')).toBe(true);
  });

  test('isVeteranLender is the same function (AC alias)', () => {
    expect(isVeteranLender).toBe(isVeteran);
  });
});

describe('skip-preview persistence', () => {
  beforeEach(reset);

  test('default is false (preview always shown unless opted in)', async () => {
    expect(await getSkipPreviewSetting()).toBe(false);
  });

  test('setSkipPreviewSetting(true) persists "true" under the documented key', async () => {
    await setSkipPreviewSetting(true);
    expect(setItem).toHaveBeenCalledWith('lendlee.skipPreview', 'true');
    expect(await getSkipPreviewSetting()).toBe(true);
  });

  test('setSkipPreviewSetting(false) persists "false" and reads back as false', async () => {
    await setSkipPreviewSetting(true);
    await setSkipPreviewSetting(false);
    expect(await getSkipPreviewSetting()).toBe(false);
  });

  test('returns false when AsyncStorage.getItem throws', async () => {
    storageThrows.getItem = true;
    expect(await getSkipPreviewSetting()).toBe(false);
  });

  test('does not throw when AsyncStorage.setItem throws', async () => {
    storageThrows.setItem = true;
    await expect(setSkipPreviewSetting(true)).resolves.toBeUndefined();
  });
});

describe('last-used tone persistence', () => {
  beforeEach(reset);

  test('returns null when nothing has been stored', async () => {
    expect(await getLastUsedTone()).toBeNull();
  });

  test('persists and reads back the tone', async () => {
    await setLastUsedTone('friendly');
    expect(setItem).toHaveBeenCalledWith('lendlee.lastUsedTone', 'friendly');
    expect(await getLastUsedTone()).toBe('friendly');
  });

  test('returns null when AsyncStorage.getItem throws', async () => {
    storageThrows.getItem = true;
    expect(await getLastUsedTone()).toBeNull();
  });
});

describe('getLenderExperience (composite)', () => {
  beforeEach(reset);

  test('first-time lender: never skips preview even if opted-in flag is set', async () => {
    sb.count = 0;
    storage.set('lendlee.skipPreview', 'true');
    storage.set('lendlee.lastUsedTone', 'friendly');

    const exp = await getLenderExperience('user-1');
    expect(exp).toEqual({
      isVeteran: false,
      skipPreview: false,
      lastUsedTone: 'friendly',
    });
  });

  test('veteran without opt-in: still sees preview', async () => {
    sb.count = 5;
    // No skipPreview entry persisted.
    const exp = await getLenderExperience('user-1');
    expect(exp.isVeteran).toBe(true);
    expect(exp.skipPreview).toBe(false);
  });

  test('veteran + opted-in: skipPreview is true', async () => {
    sb.count = 4;
    storage.set('lendlee.skipPreview', 'true');
    storage.set('lendlee.lastUsedTone', 'casual');

    const exp = await getLenderExperience('user-1');
    expect(exp).toEqual({
      isVeteran: true,
      skipPreview: true,
      lastUsedTone: 'casual',
    });
  });
});
