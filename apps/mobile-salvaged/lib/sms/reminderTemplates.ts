/**
 * Reminder SMS templates — follow-up messages for items already lent.
 *
 * These are distinct from the initial lend templates in `templates.ts`.
 * Initial lend = "I'm lending you X". Reminder = "How was X? Would love
 * it back." The tone is warmer, shorter, and asks about the borrower's
 * experience rather than stating a due date.
 *
 * Three tones: chill, friendly, warm. The user picks via a tone selector
 * (same UX pattern as SmsPreviewModal). The last-used tone from the
 * initial lend carries over as the default.
 */

export type ReminderTone = 'chill' | 'friendly' | 'warm';

export const REMINDER_TONES: readonly ReminderTone[] = ['chill', 'friendly', 'warm'] as const;

export type ReminderSmsInput = {
  borrowerName: string;
  itemTitle: string;
};

function clean(s: string): string {
  return (s ?? '').trim();
}

function chill({ borrowerName, itemTitle }: ReminderSmsInput): string {
  const borrower = clean(borrowerName);
  const item = clean(itemTitle);
  return `hey ${borrower}! how's the ${item} treating you? would love to get it back whenever you get a chance!`;
}

function friendly({ borrowerName, itemTitle }: ReminderSmsInput): string {
  const borrower = clean(borrowerName);
  const item = clean(itemTitle);
  return `Hi ${borrower}! How was the ${item}? Would love to get it back when you get a chance. Want to drop it off or should I swing by?`;
}

function warm({ borrowerName, itemTitle }: ReminderSmsInput): string {
  const borrower = clean(borrowerName);
  const item = clean(itemTitle);
  return `Hey ${borrower}, hope you got good use out of the ${item}! How do you want to get it back to me?`;
}

/**
 * Render a reminder SMS body for the given tone. Pure function.
 */
export function renderReminderSms(input: ReminderSmsInput, tone: ReminderTone): string {
  switch (tone) {
    case 'chill':
      return chill(input);
    case 'friendly':
      return friendly(input);
    case 'warm':
      return warm(input);
  }
}
