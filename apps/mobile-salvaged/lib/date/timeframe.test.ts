import { describe, test, expect } from 'bun:test';
import {
  addDays,
  formatReturnDate,
  getReturnByForPreset,
  TIMEFRAME_PRESETS,
  TIMEFRAME_LABELS,
  DEFAULT_TIMEFRAME_PRESET,
} from './timeframe';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('addDays', () => {
  test('adds the right number of milliseconds', () => {
    const start = new Date('2026-01-15T12:00:00Z');
    const result = addDays(start, 7);
    expect(result.getTime() - start.getTime()).toBe(7 * MS_PER_DAY);
  });

  test('supports negative offsets', () => {
    const start = new Date('2026-01-15T12:00:00Z');
    const result = addDays(start, -3);
    expect(result.getTime() - start.getTime()).toBe(-3 * MS_PER_DAY);
  });

  test('does not mutate the input date', () => {
    const start = new Date('2026-01-15T12:00:00Z');
    const ts = start.getTime();
    addDays(start, 30);
    expect(start.getTime()).toBe(ts);
  });

  test('crossing a DST boundary still adds exact 24h * n', () => {
    // 2026 US "spring forward" is March 8. Adding 7 days across that boundary
    // should still be exactly 7*24h in ms — that's the whole point of doing
    // the math on epoch ms instead of calendar fields.
    const beforeDst = new Date('2026-03-05T12:00:00Z');
    const result = addDays(beforeDst, 7);
    expect(result.getTime() - beforeDst.getTime()).toBe(7 * MS_PER_DAY);
  });
});

describe('formatReturnDate', () => {
  test('produces a non-empty human-readable string', () => {
    // Build the date in local time so the formatted weekday/day match the
    // local interpretation, sidestepping UTC-offset flakiness in CI.
    const date = new Date(2026, 3, 22); // April 22, 2026 (local)
    const formatted = formatReturnDate(date);
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toContain('Apr');
    expect(formatted).toContain('22');
  });

  test('includes the weekday', () => {
    // April 22, 2026 is a Wednesday in any reasonable timezone.
    const date = new Date(2026, 3, 22);
    expect(formatReturnDate(date)).toContain('Wed');
  });

  test('different dates produce different formatted strings', () => {
    const a = new Date(2026, 3, 22);
    const b = new Date(2026, 3, 29);
    expect(formatReturnDate(a)).not.toBe(formatReturnDate(b));
  });
});

describe('getReturnByForPreset', () => {
  const now = new Date('2026-04-22T12:00:00Z');

  test('1 week → +7 days', () => {
    const r = getReturnByForPreset('1week', now);
    expect(r).not.toBeNull();
    expect(r!.getTime() - now.getTime()).toBe(7 * MS_PER_DAY);
  });

  test('2 weeks → +14 days', () => {
    const r = getReturnByForPreset('2weeks', now);
    expect(r!.getTime() - now.getTime()).toBe(14 * MS_PER_DAY);
  });

  test('1 month → +30 days', () => {
    const r = getReturnByForPreset('1month', now);
    expect(r!.getTime() - now.getTime()).toBe(30 * MS_PER_DAY);
  });

  test('none → null', () => {
    expect(getReturnByForPreset('none', now)).toBeNull();
  });

  test('uses the current time when no `now` is passed', () => {
    const before = Date.now();
    const r = getReturnByForPreset('1week');
    const after = Date.now();
    expect(r).not.toBeNull();
    const diff = r!.getTime() - before;
    // Allow for the small wall-clock delta between `before` and `r`'s
    // construction. Lower bound is exactly 7 days; upper bound is 7 days
    // plus however long the test took.
    expect(diff).toBeGreaterThanOrEqual(7 * MS_PER_DAY);
    expect(diff).toBeLessThanOrEqual(7 * MS_PER_DAY + (after - before) + 5);
  });
});

describe('preset metadata', () => {
  test('exposes all five presets in declared order', () => {
    expect(TIMEFRAME_PRESETS).toEqual([
      '1week',
      '2weeks',
      '1month',
      'custom',
      'none',
    ]);
  });

  test('labels match the chip copy in the spec', () => {
    expect(TIMEFRAME_LABELS['1week']).toBe('1 week');
    expect(TIMEFRAME_LABELS['2weeks']).toBe('2 weeks');
    expect(TIMEFRAME_LABELS['1month']).toBe('1 month');
    expect(TIMEFRAME_LABELS.custom).toBe('Custom');
    expect(TIMEFRAME_LABELS.none).toBe('No return date');
  });

  test('default preset is "2 weeks"', () => {
    expect(DEFAULT_TIMEFRAME_PRESET).toBe('2weeks');
  });
});
