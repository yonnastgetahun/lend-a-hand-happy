import { describe, test, expect } from 'bun:test';
import { detectCategory, LEND_CATEGORIES } from './autoCategory';

describe('detectCategory', () => {
  const cases: Array<{
    title: string;
    expected: ReturnType<typeof detectCategory>;
  }> = [
    { title: 'drill', expected: 'tool' },
    { title: 'cordless drill', expected: 'tool' },
    { title: 'extension ladder', expected: 'tool' },
    { title: 'harry potter', expected: 'book' },
    { title: 'The Great Gatsby novel', expected: 'book' },
    { title: 'cookbook for beginners', expected: 'book' },
    { title: 'iPad Pro', expected: 'electronics' },
    { title: 'Bluetooth speaker', expected: 'electronics' },
    { title: 'Nintendo Switch', expected: 'electronics' },
    { title: 'winter jacket', expected: 'clothing' },
    { title: 'leather boots', expected: 'clothing' },
    { title: 'cast iron skillet', expected: 'kitchen' },
    { title: 'instant pot', expected: 'kitchen' },
    { title: 'KitchenAid mixer', expected: 'kitchen' },
    { title: 'mystery thing', expected: 'other' },
    { title: '', expected: 'other' },
    { title: '   ', expected: 'other' },
  ];

  for (const { title, expected } of cases) {
    test(`"${title}" → ${expected}`, () => {
      expect(detectCategory(title)).toBe(expected);
    });
  }

  test('is case-insensitive', () => {
    expect(detectCategory('DRILL')).toBe('tool');
    expect(detectCategory('Harry Potter')).toBe('book');
  });

  test('matches on word boundaries (no false positives inside words)', () => {
    // "saw" is a tool keyword but should not match inside "samsung".
    expect(detectCategory('samsung galaxy')).not.toBe('tool');
  });

  test('returns "other" for null-ish inputs', () => {
    // @ts-expect-error - intentionally testing runtime guard
    expect(detectCategory(undefined)).toBe('other');
    // @ts-expect-error - intentionally testing runtime guard
    expect(detectCategory(null)).toBe('other');
  });

  test('always returns one of the canonical categories', () => {
    const samples = ['drill', 'novel', 'iphone', 'jacket', 'pan', 'xyzzy'];
    for (const t of samples) {
      expect(LEND_CATEGORIES).toContain(detectCategory(t));
    }
  });
});
