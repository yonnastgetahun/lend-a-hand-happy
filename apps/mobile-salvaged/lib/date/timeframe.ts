/**
 * Timeframe helpers for the WHEN step of the lend flow.
 *
 * Date math is intentionally done in milliseconds rather than via
 * `Date#setDate` or string parsing — that way the result is independent of the
 * runtime's timezone and DST rules. The user's "1 week" should always be
 * exactly 7 * 24h after now, even if a DST transition happens in between.
 */

export const TIMEFRAME_PRESETS = [
  '1week',
  '2weeks',
  '1month',
  'custom',
  'none',
] as const;

export type TimeframePreset = (typeof TIMEFRAME_PRESETS)[number];

export const DEFAULT_TIMEFRAME_PRESET: TimeframePreset = '2weeks';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * MS_PER_DAY);
}

export function formatReturnDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Returns the ISO return date for a fixed-duration preset. `custom` is not
 * accepted here — the caller must hand that off to the platform date picker
 * and then store the chosen `Date` directly.
 */
export function getReturnByForPreset(
  preset: Exclude<TimeframePreset, 'custom'>,
  now: Date = new Date(),
): Date | null {
  switch (preset) {
    case '1week':
      return addDays(now, 7);
    case '2weeks':
      return addDays(now, 14);
    case '1month':
      return addDays(now, 30);
    case 'none':
      return null;
  }
}

export const TIMEFRAME_LABELS: Record<TimeframePreset, string> = {
  '1week': '1 week',
  '2weeks': '2 weeks',
  '1month': '1 month',
  custom: 'Custom',
  none: 'No return date',
};
