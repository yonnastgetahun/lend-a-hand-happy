import { describe, test, expect } from 'bun:test';
import {
  buildSms,
  formatSmsDate,
  renderSmsTemplate,
  SMS_RENDER_TONES,
  SMS_SEGMENT_LIMIT,
  SMS_TONES,
  type BuildSmsInput,
  type SmsRenderTone,
  type SmsTone,
} from './templates';

// Fixed sample input shared with qa-reports/sms-tones.md. If either file
// drifts, the report's rendered samples lie — so edit both together.
const SAMPLE_INPUT: BuildSmsInput = {
  borrowerName: 'Alex',
  lenderName: 'Sam',
  itemName: 'drill',
};

// 2026-05-06 at 15:00 UTC. Using UTC keeps the test timezone-independent:
// the formatter picks weekday / month / day from the machine's local zone,
// but 15:00 UTC is still "May 6" everywhere east of Anchorage and west of
// Line Islands — covering every reasonable CI and dev machine.
const SAMPLE_DATE = new Date(Date.UTC(2026, 4, 6, 15, 0, 0));
const FORMATTED_DATE = 'Wed, May 6';

// --- Expected snapshots (exact strings the templates must produce) --------
const EXPECTED: Record<SmsTone, { dated: string; undated: string }> = {
  friendly: {
    dated:
      "Hi Alex, it's Sam! Just a friendly heads-up - you borrowed my drill. Could you return it by Wed, May 6? Thanks so much!",
    undated:
      "Hi Alex, it's Sam! Just a friendly heads-up that you borrowed my drill. Thanks so much!",
  },
  casual: {
    dated:
      "hey Alex! Sam here - you've got my drill. cool to get it back by Wed, May 6? no rush, appreciate it!",
    undated:
      "hey Alex! Sam here - you've got my drill. cool to get it back whenever? no rush, appreciate it!",
  },
  direct: {
    dated:
      'Alex - Sam here. You borrowed my drill. Please return by Wed, May 6. Thanks.',
    undated:
      "Alex - Sam here. You borrowed my drill. Please return when you're done. Thanks.",
  },
};

describe('formatSmsDate', () => {
  test('formats the shared sample date as "Wed, May 6"', () => {
    expect(formatSmsDate(SAMPLE_DATE)).toBe(FORMATTED_DATE);
  });
});

describe('SMS_TONES constant', () => {
  test('exposes exactly the three AC tones in order', () => {
    expect(SMS_TONES).toEqual(['friendly', 'casual', 'direct']);
  });
});

describe('buildSms — snapshot: exact string per tone × date variant', () => {
  for (const tone of SMS_TONES) {
    test(`${tone} (with date) matches expected string`, () => {
      const actual = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, tone);
      expect(actual).toBe(EXPECTED[tone].dated);
    });

    test(`${tone} (no date) matches expected string`, () => {
      const actual = buildSms(SAMPLE_INPUT, tone);
      expect(actual).toBe(EXPECTED[tone].undated);
    });

    test(`${tone} — returnDate: null is treated the same as omitted`, () => {
      const withNull = buildSms({ ...SAMPLE_INPUT, returnDate: null }, tone);
      expect(withNull).toBe(EXPECTED[tone].undated);
    });
  }
});

describe('buildSms — no placeholder leaks (AC: "No placeholder strings remain")', () => {
  // Guards against the regression called out in the task Debug hint:
  //   template uses `{var}` but substitution expects `${var}`.
  for (const tone of SMS_TONES) {
    test(`${tone} output never contains '{' or '}'`, () => {
      const dated = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, tone);
      const undated = buildSms(SAMPLE_INPUT, tone);
      expect(dated).not.toContain('{');
      expect(dated).not.toContain('}');
      expect(undated).not.toContain('{');
      expect(undated).not.toContain('}');
    });

    test(`${tone} output contains no literal "undefined" or "null"`, () => {
      const dated = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, tone);
      const undated = buildSms(SAMPLE_INPUT, tone);
      expect(dated).not.toContain('undefined');
      expect(dated).not.toContain('null');
      expect(undated).not.toContain('undefined');
      expect(undated).not.toContain('null');
    });
  }
});

describe('buildSms — 160-char limit for short inputs (AC)', () => {
  for (const tone of SMS_TONES) {
    test(`${tone} (with date) stays under ${SMS_SEGMENT_LIMIT} chars`, () => {
      const dated = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, tone);
      expect(dated.length).toBeLessThanOrEqual(SMS_SEGMENT_LIMIT);
    });

    test(`${tone} (no date) stays under ${SMS_SEGMENT_LIMIT} chars`, () => {
      const undated = buildSms(SAMPLE_INPUT, tone);
      expect(undated.length).toBeLessThanOrEqual(SMS_SEGMENT_LIMIT);
    });
  }

  test('ASCII-only output (no em-dash / emoji) so GSM-7 encoding holds', () => {
    // Any character outside the basic GSM-7 repertoire flips the whole
    // segment to UCS-2 (effective limit 70). Guard the most common
    // offenders we might accidentally copy-paste in: em dash, en dash,
    // curly quotes, non-breaking space.
    const forbidden = ['—', '–', '“', '”', '‘', '’', ' '];
    for (const tone of SMS_TONES) {
      const dated = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, tone);
      const undated = buildSms(SAMPLE_INPUT, tone);
      for (const c of forbidden) {
        expect(dated).not.toContain(c);
        expect(undated).not.toContain(c);
      }
    }
  });
});

describe('buildSms — tone distinguishability (AC: distinguishable when read aloud)', () => {
  test('all three tones produce three different strings for the same input', () => {
    const f = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, 'friendly');
    const c = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, 'casual');
    const d = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, 'direct');
    expect(new Set([f, c, d]).size).toBe(3);
  });

  test('friendly opens with a capitalized greeting', () => {
    // "Hi Alex..." — first letter uppercase, signals warmth.
    const f = buildSms(SAMPLE_INPUT, 'friendly');
    expect(f[0]).toBe(f[0].toUpperCase());
    expect(f.startsWith('Hi ')).toBe(true);
  });

  test('casual opens with a lowercase greeting', () => {
    // "hey alex..." — lowercase is the most load-bearing casual signal.
    const c = buildSms(SAMPLE_INPUT, 'casual');
    expect(c.startsWith('hey ')).toBe(true);
    expect(c[0]).toBe(c[0].toLowerCase());
  });

  test('direct is the shortest of the three for identical input', () => {
    const f = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, 'friendly').length;
    const c = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, 'casual').length;
    const d = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, 'direct').length;
    expect(d).toBeLessThan(c);
    expect(d).toBeLessThan(f);
  });

  test('casual uses at least one lowercase discourse marker ("hey" or "cool")', () => {
    const c = buildSms(SAMPLE_INPUT, 'casual');
    expect(/\b(hey|cool)\b/.test(c)).toBe(true);
  });
});

describe('buildSms — substitution correctness', () => {
  test('all input values appear in the output (with date)', () => {
    for (const tone of SMS_TONES) {
      const out = buildSms({ ...SAMPLE_INPUT, returnDate: SAMPLE_DATE }, tone);
      expect(out).toContain('Alex');
      expect(out).toContain('Sam');
      expect(out).toContain('drill');
      expect(out).toContain(FORMATTED_DATE);
    }
  });

  test('date does not appear when returnDate is absent', () => {
    for (const tone of SMS_TONES) {
      const out = buildSms(SAMPLE_INPUT, tone);
      expect(out).not.toContain(FORMATTED_DATE);
    }
  });

  test('handles names with leading/trailing whitespace by trimming', () => {
    const out = buildSms(
      { borrowerName: '  Alex  ', lenderName: ' Sam ', itemName: ' drill ' },
      'direct',
    );
    expect(out).toBe(EXPECTED.direct.undated);
  });
});

// ===========================================================================
// renderSmsTemplate (LENDLEE-007)
// ===========================================================================
// AC: `renderSmsTemplate({ tone, borrowerName, itemTitle, returnBy, lenderName })`
// returns a string. Three tones × with-date / without-date = 6 required cases.

const RENDER_SAMPLE = {
  borrowerName: 'Alex',
  lenderName: 'Sam',
  itemTitle: 'drill',
};

describe('renderSmsTemplate — AC: 3 tones × (with date / without date) = 6 cases', () => {
  test('casual, with date — friend-text feel, includes name/item/date', () => {
    const out = renderSmsTemplate({
      ...RENDER_SAMPLE,
      tone: 'casual',
      returnBy: SAMPLE_DATE,
    });
    expect(out).toContain('Alex');
    expect(out).toContain('drill');
    expect(out).toContain(FORMATTED_DATE);
    // Lowercase greeting is the load-bearing "casual" signal.
    expect(out.startsWith('hey ')).toBe(true);
  });

  test('casual, no date — drops the "by {date}" clause, still grammatical', () => {
    const out = renderSmsTemplate({ ...RENDER_SAMPLE, tone: 'casual' });
    expect(out).toContain('Alex');
    expect(out).toContain('drill');
    expect(out).not.toContain(FORMATTED_DATE);
    expect(out).not.toContain(' by '); // no dangling "by" preposition
    expect(out.startsWith('hey ')).toBe(true);
  });

  test('friendly, with date — warm greeting, polite return request', () => {
    const out = renderSmsTemplate({
      ...RENDER_SAMPLE,
      tone: 'friendly',
      returnBy: SAMPLE_DATE,
    });
    expect(out).toContain('Alex');
    expect(out).toContain('drill');
    expect(out).toContain(FORMATTED_DATE);
    expect(out.startsWith('Hi ')).toBe(true);
    expect(out).toContain('Thanks');
  });

  test('friendly, no date — no "by {date}" clause, thanks preserved', () => {
    const out = renderSmsTemplate({ ...RENDER_SAMPLE, tone: 'friendly' });
    expect(out).toContain('Alex');
    expect(out).toContain('drill');
    expect(out).not.toContain(FORMATTED_DATE);
    expect(out).not.toContain(' by ');
    expect(out).toContain('Thanks');
  });

  test('formal, with date — clinical confirmation framing', () => {
    const out = renderSmsTemplate({
      ...RENDER_SAMPLE,
      tone: 'formal',
      returnBy: SAMPLE_DATE,
    });
    expect(out).toContain('Alex');
    expect(out).toContain('drill');
    expect(out).toContain(FORMATTED_DATE);
    expect(out).toContain('confirms');
  });

  test('formal, no date — confirmation without a hard return date', () => {
    const out = renderSmsTemplate({ ...RENDER_SAMPLE, tone: 'formal' });
    expect(out).toContain('Alex');
    expect(out).toContain('drill');
    expect(out).not.toContain(FORMATTED_DATE);
    expect(out).not.toContain(' by ');
    expect(out).toContain('confirms');
  });
});

describe('renderSmsTemplate — three tones produce distinct copy', () => {
  test('all three tones yield three different strings for identical input', () => {
    const c = renderSmsTemplate({ ...RENDER_SAMPLE, tone: 'casual', returnBy: SAMPLE_DATE });
    const f = renderSmsTemplate({ ...RENDER_SAMPLE, tone: 'friendly', returnBy: SAMPLE_DATE });
    const fo = renderSmsTemplate({ ...RENDER_SAMPLE, tone: 'formal', returnBy: SAMPLE_DATE });
    expect(new Set([c, f, fo]).size).toBe(3);
  });

  test('SMS_RENDER_TONES exposes exactly the three AC tones', () => {
    expect(SMS_RENDER_TONES).toEqual(['casual', 'friendly', 'formal']);
  });
});

describe('renderSmsTemplate — 160-char limit for short inputs (AC)', () => {
  // AC: "All templates stay under 160 chars when names/items are short (~10 chars)".
  // Our sample names/items are well under 10 chars, so every output must fit.
  for (const tone of SMS_RENDER_TONES) {
    test(`${tone} (with date) <= ${SMS_SEGMENT_LIMIT} chars`, () => {
      const out = renderSmsTemplate({ ...RENDER_SAMPLE, tone, returnBy: SAMPLE_DATE });
      expect(out.length).toBeLessThanOrEqual(SMS_SEGMENT_LIMIT);
    });

    test(`${tone} (no date) <= ${SMS_SEGMENT_LIMIT} chars`, () => {
      const out = renderSmsTemplate({ ...RENDER_SAMPLE, tone });
      expect(out.length).toBeLessThanOrEqual(SMS_SEGMENT_LIMIT);
    });
  }
});

describe('renderSmsTemplate — substitution correctness', () => {
  test('returnBy: null is treated the same as omitted', () => {
    for (const tone of SMS_RENDER_TONES) {
      const omitted = renderSmsTemplate({ ...RENDER_SAMPLE, tone });
      const nulled = renderSmsTemplate({ ...RENDER_SAMPLE, tone, returnBy: null });
      expect(nulled).toBe(omitted);
    }
  });

  test('no placeholder strings remain (no "{" or "}")', () => {
    for (const tone of SMS_RENDER_TONES) {
      const dated = renderSmsTemplate({ ...RENDER_SAMPLE, tone, returnBy: SAMPLE_DATE });
      const undated = renderSmsTemplate({ ...RENDER_SAMPLE, tone });
      expect(dated).not.toContain('{');
      expect(dated).not.toContain('}');
      expect(undated).not.toContain('{');
      expect(undated).not.toContain('}');
      expect(dated).not.toContain('undefined');
      expect(undated).not.toContain('undefined');
      expect(dated).not.toContain('null');
      expect(undated).not.toContain('null');
    }
  });

  test('trims whitespace on borrowerName/itemTitle', () => {
    const trimmed = renderSmsTemplate({
      tone: 'formal',
      borrowerName: '  Alex  ',
      lenderName: ' Sam ',
      itemTitle: ' drill ',
    });
    const clean = renderSmsTemplate({
      tone: 'formal',
      borrowerName: 'Alex',
      lenderName: 'Sam',
      itemTitle: 'drill',
    });
    expect(trimmed).toBe(clean);
  });
});
