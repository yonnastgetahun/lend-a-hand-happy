import { describe, expect, it } from 'bun:test';
import {
  renderReminderSms,
  REMINDER_TONES,
  type ReminderTone,
  type ReminderSmsInput,
} from './reminderTemplates';

const input: ReminderSmsInput = {
  borrowerName: 'Sarah',
  itemTitle: 'drill',
};

describe('renderReminderSms', () => {
  it('renders chill tone', () => {
    const result = renderReminderSms(input, 'chill');
    expect(result).toBe(
      "hey Sarah! how's the drill treating you? would love to get it back whenever you get a chance!"
    );
  });

  it('renders friendly tone', () => {
    const result = renderReminderSms(input, 'friendly');
    expect(result).toBe(
      'Hi Sarah! How was the drill? Would love to get it back when you get a chance. Want to drop it off or should I swing by?'
    );
  });

  it('renders warm tone', () => {
    const result = renderReminderSms(input, 'warm');
    expect(result).toBe(
      'Hey Sarah, hope you got good use out of the drill! How do you want to get it back to me?'
    );
  });

  it('trims whitespace from inputs', () => {
    const result = renderReminderSms(
      { borrowerName: '  Sarah  ', itemTitle: '  drill  ' },
      'chill'
    );
    expect(result).toContain('Sarah');
    expect(result).toContain('drill');
    expect(result).not.toContain('  ');
  });

  it('handles all tones without throwing', () => {
    for (const tone of REMINDER_TONES) {
      expect(() => renderReminderSms(input, tone)).not.toThrow();
    }
  });

  it('all tones produce non-empty strings', () => {
    for (const tone of REMINDER_TONES) {
      const result = renderReminderSms(input, tone);
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('no tone mentions "due" or "overdue"', () => {
    for (const tone of REMINDER_TONES) {
      const result = renderReminderSms(input, tone).toLowerCase();
      expect(result).not.toContain('due');
      expect(result).not.toContain('overdue');
    }
  });

  it('all tones stay under SMS segment limit (160 chars) for short inputs', () => {
    for (const tone of REMINDER_TONES) {
      const result = renderReminderSms(input, tone);
      expect(result.length).toBeLessThanOrEqual(160);
    }
  });
});
