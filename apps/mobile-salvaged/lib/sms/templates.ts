/**
 * SMS message templates for the three lend tones.
 *
 * Tones (aligned with `lib/sms/lenderExperience.ts` `Tone`):
 *   - friendly: warm, polite, some softeners
 *   - casual:   lowercase, chatty
 *   - direct:   brief, no fluff
 *
 * All templates use JavaScript template literals (`${var}`) — never `{var}`
 * bracket placeholders — so values are substituted at call time and cannot
 * leak through unreplaced. Tests enforce this (no `{` / `}` in output).
 *
 * All templates are ASCII-only (no em-dashes, no emoji). Non-GSM-7 characters
 * force a UCS-2 encoding whose effective per-segment limit drops from 160 to
 * 70, which breaks the "under 160 chars for short inputs" AC on many real
 * devices.
 */

export type SmsTone = 'friendly' | 'casual' | 'direct';

export const SMS_TONES: readonly SmsTone[] = ['friendly', 'casual', 'direct'] as const;

/**
 * Tone set used by `renderSmsTemplate` (LENDLEE-007). Distinct from
 * `SmsTone` above — the older `buildSms` API uses `direct` while the
 * newer `renderSmsTemplate` uses `formal` (clinical, confirmation-style
 * rather than terse). Kept as separate types so the existing 7 call
 * sites of `buildSms` don't have to move in lockstep with template
 * evolution.
 */
export type SmsRenderTone = 'casual' | 'friendly' | 'formal';

export const SMS_RENDER_TONES: readonly SmsRenderTone[] = [
  'casual',
  'friendly',
  'formal',
] as const;

/**
 * Single-segment SMS limit on GSM-7 encoding. Messages over this length are
 * split into concatenated segments by the carrier — the user still receives
 * them, but each segment bills separately on metered plans. Our AC is to
 * stay under this for short inputs.
 */
export const SMS_SEGMENT_LIMIT = 160;

export type BuildSmsInput = {
  /** The person who borrowed the item. */
  borrowerName: string;
  /** The person who lent the item (the current user). */
  lenderName: string;
  /** What was lent, as the lender would say it in a message ("drill", "the camping stove"). */
  itemName: string;
  /**
   * Optional return date. When absent, the template switches to the
   * "no-date" variant for that tone. Passing `null` is treated the same
   * as omitting it.
   */
  returnDate?: Date | null;
};

/**
 * Short, SMS-friendly date formatter used in message bodies.
 *
 * Chosen over `lib/date/timeframe.formatReturnDate` so the SMS wording is
 * decoupled from the in-app preview wording — an SMS copy tweak should not
 * ripple into the UI and vice versa.
 */
export function formatSmsDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function clean(s: string): string {
  return (s ?? '').trim();
}

function friendly(input: BuildSmsInput): string {
  const borrower = clean(input.borrowerName);
  const lender = clean(input.lenderName);
  const item = clean(input.itemName);
  const date = input.returnDate ? formatSmsDate(input.returnDate) : null;

  if (date) {
    return `Hi ${borrower}, it's ${lender}! Just a friendly heads-up - you borrowed my ${item}. Could you return it by ${date}? Thanks so much!`;
  }
  return `Hi ${borrower}, it's ${lender}! Just a friendly heads-up that you borrowed my ${item}. Thanks so much!`;
}

function casual(input: BuildSmsInput): string {
  const borrower = clean(input.borrowerName);
  const lender = clean(input.lenderName);
  const item = clean(input.itemName);
  const date = input.returnDate ? formatSmsDate(input.returnDate) : null;

  if (date) {
    return `hey ${borrower}! ${lender} here - you've got my ${item}. cool to get it back by ${date}? no rush, appreciate it!`;
  }
  return `hey ${borrower}! ${lender} here - you've got my ${item}. cool to get it back whenever? no rush, appreciate it!`;
}

function direct(input: BuildSmsInput): string {
  const borrower = clean(input.borrowerName);
  const lender = clean(input.lenderName);
  const item = clean(input.itemName);
  const date = input.returnDate ? formatSmsDate(input.returnDate) : null;

  if (date) {
    return `${borrower} - ${lender} here. You borrowed my ${item}. Please return by ${date}. Thanks.`;
  }
  return `${borrower} - ${lender} here. You borrowed my ${item}. Please return when you're done. Thanks.`;
}

/**
 * Build the SMS body for the given tone. Pure function — no clock, no I/O,
 * no RNG — so call sites and tests get identical output for identical input.
 */
export function buildSms(input: BuildSmsInput, tone: SmsTone): string {
  switch (tone) {
    case 'friendly':
      return friendly(input);
    case 'casual':
      return casual(input);
    case 'direct':
      return direct(input);
  }
}

// --- LENDLEE-007: `renderSmsTemplate` -------------------------------------
// The newer render API spoken from the LENDER'S perspective ("I'm lending
// you X") rather than the older confirmation-after-the-fact framing ("you
// borrowed X"). This matches the lend-flow UX where the lender taps Send
// at the moment of handoff.
//
// `returnBy` is the task's spelling of the date; we keep the parameter
// name faithful to the task spec even though `returnDate` is used
// elsewhere in this file.

export type RenderSmsInput = {
  tone: SmsRenderTone;
  borrowerName: string;
  lenderName: string;
  itemTitle: string;
  returnBy?: Date | null;
};

function renderCasual(args: {
  borrower: string;
  item: string;
  date: string | null;
}): string {
  if (args.date) {
    return `hey ${args.borrower}! lending you my ${args.item}, get it back to me by ${args.date} 🙏`;
  }
  return `hey ${args.borrower}! lending you my ${args.item}, get it back to me whenever 🙏`;
}

function renderFriendly(args: {
  borrower: string;
  item: string;
  date: string | null;
}): string {
  if (args.date) {
    return `Hi ${args.borrower}, here's the ${args.item} I'm lending you - please return by ${args.date}. Thanks!`;
  }
  return `Hi ${args.borrower}, here's the ${args.item} I'm lending you - please return when you can. Thanks!`;
}

function renderFormal(args: {
  borrower: string;
  item: string;
  date: string | null;
}): string {
  if (args.date) {
    return `Hi ${args.borrower}, this confirms I've lent you my ${args.item}. Please return by ${args.date}.`;
  }
  return `Hi ${args.borrower}, this confirms I've lent you my ${args.item}. Please return it at your convenience.`;
}

/**
 * Render the SMS body for a lend handoff. Pure function — identical input
 * yields identical output. When `returnBy` is null or omitted, the "no
 * return date" variant is used (no "by {date}" clause, sentences remain
 * grammatical).
 *
 * Note: `lenderName` is part of the input shape per the task AC but is
 * not rendered into any of the three templates. The sender of an SMS is
 * already identified by the phone number / contact name on the recipient's
 * device, so naming the lender inline would be redundant. The field is
 * accepted so callers can pass full lend-flow context through one object.
 */
export function renderSmsTemplate(args: RenderSmsInput): string {
  const borrower = clean(args.borrowerName);
  const item = clean(args.itemTitle);
  const date = args.returnBy ? formatSmsDate(args.returnBy) : null;
  const ctx = { borrower, item, date };

  switch (args.tone) {
    case 'casual':
      return renderCasual(ctx);
    case 'friendly':
      return renderFriendly(ctx);
    case 'formal':
      return renderFormal(ctx);
  }
}
