import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

/**
 * A user is considered a "veteran" lender once they have completed at least
 * this many lends. Below this they always see the SMS preview modal.
 */
export const VETERAN_THRESHOLD = 3;

/** AsyncStorage key for the user's "skip preview" preference. */
export const SKIP_PREVIEW_KEY = 'lendlee.skipPreview';

/**
 * AsyncStorage key for the last SMS tone the user picked. Veterans who opt
 * into skip-preview reuse this value automatically on subsequent lends.
 */
export const LAST_USED_TONE_KEY = 'lendlee.lastUsedTone';

export type Tone = 'friendly' | 'casual' | 'direct' | string;

/**
 * Count completed lends authored by a given user.
 *
 * The schema does not store `lender_id` directly on `loans`; the lender is
 * the owner of the lent item, so we join through `items.owner_id`.
 */
export async function getLendCount(userId: string): Promise<number> {
  if (!userId) return 0;

  const { count, error } = await supabase
    .from('loans')
    .select('id, items!inner(owner_id)', { count: 'exact', head: true })
    .eq('items.owner_id', userId);

  if (error) return 0;
  return count ?? 0;
}

/** True when the user has completed at least `VETERAN_THRESHOLD` lends. */
export async function isVeteran(userId: string): Promise<boolean> {
  const count = await getLendCount(userId);
  return count >= VETERAN_THRESHOLD;
}

/** AC-named alias for `isVeteran`. */
export const isVeteranLender = isVeteran;

/**
 * Read the persisted "skip preview" preference. Defaults to `false` —
 * preview is always shown unless the user explicitly opts in.
 */
export async function getSkipPreviewSetting(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SKIP_PREVIEW_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setSkipPreviewSetting(skip: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SKIP_PREVIEW_KEY, skip ? 'true' : 'false');
  } catch {
    // AsyncStorage failures are non-fatal — worst case the user sees the
    // preview again next time, which is the safe default anyway.
  }
}

export async function getLastUsedTone(): Promise<Tone | null> {
  try {
    return await AsyncStorage.getItem(LAST_USED_TONE_KEY);
  } catch {
    return null;
  }
}

export async function setLastUsedTone(tone: Tone): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_USED_TONE_KEY, tone);
  } catch {
    // non-fatal
  }
}

export type LenderExperience = {
  /** True when the user has completed >= VETERAN_THRESHOLD lends. */
  isVeteran: boolean;
  /**
   * Effective skip-preview flag: only true when the user is BOTH a veteran
   * AND has explicitly opted in via the modal checkbox. First-timers and
   * veterans who never opted in always see the preview.
   */
  skipPreview: boolean;
  /** Last tone the user sent with, or null if none recorded. */
  lastUsedTone: Tone | null;
};

/**
 * Composite read used by the lend flow on screen mount. Reads the three
 * inputs in parallel and applies the "veteran-gated" rule for skipPreview
 * so callers don't have to remember it.
 */
export async function getLenderExperience(userId: string): Promise<LenderExperience> {
  const [veteran, optedIn, tone] = await Promise.all([
    isVeteran(userId),
    getSkipPreviewSetting(),
    getLastUsedTone(),
  ]);

  return {
    isVeteran: veteran,
    skipPreview: veteran && optedIn,
    lastUsedTone: tone,
  };
}
