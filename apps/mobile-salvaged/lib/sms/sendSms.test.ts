import { describe, test, expect, mock, beforeEach } from 'bun:test';

type SmsResult = 'sent' | 'cancelled' | 'unknown';

const state: {
  available: boolean;
  availableThrows: boolean;
  sendThrows: boolean;
  sendResult: SmsResult;
  clipboardThrows: boolean;
} = {
  available: true,
  availableThrows: false,
  sendThrows: false,
  sendResult: 'sent',
  clipboardThrows: false,
};

const isAvailableAsync = mock(async () => {
  if (state.availableThrows) throw new Error('unavailable');
  return state.available;
});

const sendSMSAsync = mock(async (_addresses: string | string[], _message: string) => {
  if (state.sendThrows) throw new Error('send failed');
  return { result: state.sendResult };
});

const setStringAsync = mock(async (_text: string) => {
  if (state.clipboardThrows) throw new Error('clipboard failed');
  return true;
});

mock.module('expo-sms', () => ({
  isAvailableAsync,
  sendSMSAsync,
}));

mock.module('expo-clipboard', () => ({
  setStringAsync,
}));

const { sendSms } = await import('./sendSms');

function resetState() {
  state.available = true;
  state.availableThrows = false;
  state.sendThrows = false;
  state.sendResult = 'sent';
  state.clipboardThrows = false;
  isAvailableAsync.mockClear();
  sendSMSAsync.mockClear();
  setStringAsync.mockClear();
}

describe('sendSms', () => {
  beforeEach(() => {
    resetState();
  });

  test('opens native composer and returns sent', async () => {
    const result = await sendSms({ phone: '555-1234', message: 'Hi there' });
    expect(result).toEqual({ status: 'sent' });
    expect(sendSMSAsync).toHaveBeenCalledTimes(1);
    expect(sendSMSAsync).toHaveBeenCalledWith(['555-1234'], 'Hi there');
    expect(setStringAsync).not.toHaveBeenCalled();
  });

  test('returns cancelled when user dismisses composer', async () => {
    state.sendResult = 'cancelled';
    const result = await sendSms({ phone: '555', message: 'm' });
    expect(result).toEqual({ status: 'cancelled' });
  });

  test('returns unknown when composer cannot determine status (Android)', async () => {
    state.sendResult = 'unknown';
    const result = await sendSms({ phone: '555', message: 'm' });
    expect(result).toEqual({ status: 'unknown' });
  });

  test('copies to clipboard when SMS is unavailable', async () => {
    state.available = false;
    const result = await sendSms({ phone: '555', message: 'fallback msg' });
    expect(result).toEqual({ status: 'copied' });
    expect(sendSMSAsync).not.toHaveBeenCalled();
    expect(setStringAsync).toHaveBeenCalledWith('fallback msg');
  });

  test('copies to clipboard when sendSMSAsync throws on a real device', async () => {
    state.sendThrows = true;
    const result = await sendSms({ phone: '555', message: 'threw msg' });
    expect(result).toEqual({ status: 'copied' });
    expect(sendSMSAsync).toHaveBeenCalledTimes(1);
    expect(setStringAsync).toHaveBeenCalledWith('threw msg');
  });

  test('copies to clipboard when isAvailableAsync throws', async () => {
    state.availableThrows = true;
    const result = await sendSms({ phone: '555', message: 'avail threw' });
    expect(result).toEqual({ status: 'copied' });
    expect(setStringAsync).toHaveBeenCalledWith('avail threw');
  });

  test('still returns copied when clipboard itself throws', async () => {
    state.available = false;
    state.clipboardThrows = true;
    const result = await sendSms({ phone: '555', message: 'clipboard threw' });
    expect(result).toEqual({ status: 'copied' });
  });
});
