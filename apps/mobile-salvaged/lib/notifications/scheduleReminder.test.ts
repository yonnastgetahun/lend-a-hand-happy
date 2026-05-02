import { describe, test, expect, mock, beforeEach } from 'bun:test';

// ── Mock state ─────────────────────────────────────────────────────────
const mockState = {
  permissionStatus: 'undetermined' as string,
  scheduledId: 'notif-abc-123',
  scheduleThrows: false,
  storage: {} as Record<string, string>,
};

// ── Mock expo-notifications ────────────────────────────────────────────
const getPermissionsAsync = mock(async () => ({
  status: mockState.permissionStatus,
}));
const requestPermissionsAsync = mock(async () => ({
  status: mockState.permissionStatus,
}));
const scheduleNotificationAsync = mock(async () => {
  if (mockState.scheduleThrows) throw new Error('schedule failed');
  return mockState.scheduledId;
});
const cancelScheduledNotificationAsync = mock(async () => {});
const cancelAllScheduledNotificationsAsync = mock(async () => {});
const setNotificationHandler = mock(() => {});

mock.module('expo-notifications', () => ({
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  setNotificationHandler,
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

// ── Mock AsyncStorage ──────────────────────────────────────────────────
const setItem = mock(async (key: string, value: string) => {
  mockState.storage[key] = value;
});
const getItem = mock(async (key: string) => {
  return mockState.storage[key] ?? null;
});
const removeItem = mock(async (key: string) => {
  delete mockState.storage[key];
});

mock.module('@react-native-async-storage/async-storage', () => ({
  default: { setItem, getItem, removeItem },
}));

// ── Import after mocks ────────────────────────────────────────────────
const {
  requestNotificationPermission,
  buildTriggerDate,
  scheduleReminder,
  cancelReminder,
  cancelReminderForLoan,
  cancelAllReminders,
} = await import('./scheduleReminder');

// ── Tests ──────────────────────────────────────────────────────────────

beforeEach(() => {
  mockState.permissionStatus = 'undetermined';
  mockState.scheduledId = 'notif-abc-123';
  mockState.scheduleThrows = false;
  mockState.storage = {};
  getPermissionsAsync.mockClear();
  requestPermissionsAsync.mockClear();
  scheduleNotificationAsync.mockClear();
  cancelScheduledNotificationAsync.mockClear();
  cancelAllScheduledNotificationsAsync.mockClear();
  setItem.mockClear();
  getItem.mockClear();
  removeItem.mockClear();
});

// ── buildTriggerDate (pure logic) ──────────────────────────────────────

describe('buildTriggerDate', () => {
  test('returns 1 day before the return date at 10:00 AM', () => {
    const returnDate = new Date('2025-03-15T14:00:00');
    const trigger = buildTriggerDate(returnDate);
    expect(trigger.getFullYear()).toBe(2025);
    expect(trigger.getMonth()).toBe(2); // March
    expect(trigger.getDate()).toBe(14);
    expect(trigger.getHours()).toBe(10);
    expect(trigger.getMinutes()).toBe(0);
    expect(trigger.getSeconds()).toBe(0);
  });

  test('handles month boundary (March 1 → Feb 28)', () => {
    const returnDate = new Date('2025-03-01T12:00:00');
    const trigger = buildTriggerDate(returnDate);
    expect(trigger.getMonth()).toBe(1); // February
    expect(trigger.getDate()).toBe(28);
  });

  test('does not mutate the input date', () => {
    const returnDate = new Date('2025-06-10T09:00:00');
    const original = returnDate.getTime();
    buildTriggerDate(returnDate);
    expect(returnDate.getTime()).toBe(original);
  });
});

// ── requestNotificationPermission ──────────────────────────────────────

describe('requestNotificationPermission', () => {
  test('returns true when already granted', async () => {
    mockState.permissionStatus = 'granted';
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test('requests permission when not granted, returns true on grant', async () => {
    // First call returns undetermined, then request returns granted.
    getPermissionsAsync.mockImplementationOnce(async () => ({
      status: 'undetermined',
    }));
    requestPermissionsAsync.mockImplementationOnce(async () => ({
      status: 'granted',
    }));
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  test('returns false when permission denied', async () => {
    getPermissionsAsync.mockImplementationOnce(async () => ({
      status: 'denied',
    }));
    requestPermissionsAsync.mockImplementationOnce(async () => ({
      status: 'denied',
    }));
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });
});

// ── scheduleReminder ───────────────────────────────────────────────────

describe('scheduleReminder', () => {
  test('schedules a notification and stores ID in AsyncStorage', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    const id = await scheduleReminder('loan-1', 'Alice', 'Drill', futureDate);

    expect(id).toBe('notif-abc-123');
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);

    const call = scheduleNotificationAsync.mock.calls[0][0] as {
      content: { title: string; body: string; data: { loanId: string } };
    };
    expect(call.content.body).toBe(
      'Alice still has your Drill. Want to send a reminder?',
    );
    expect(call.content.data.loanId).toBe('loan-1');

    // Verify stored in AsyncStorage
    expect(mockState.storage['lendlee:notification:loan-1']).toBe('notif-abc-123');
  });

  test('returns null when return date is in the past', async () => {
    const pastDate = new Date('2020-01-01');
    const id = await scheduleReminder('loan-2', 'Bob', 'Book', pastDate);
    expect(id).toBeNull();
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('returns null when scheduling throws', async () => {
    mockState.scheduleThrows = true;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const id = await scheduleReminder('loan-3', 'Carol', 'Camera', futureDate);
    expect(id).toBeNull();
  });

  test('notification body does not contain "due" or "overdue"', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    await scheduleReminder('loan-4', 'Dave', 'Laptop', futureDate);
    const call = scheduleNotificationAsync.mock.calls[0][0] as {
      content: { body: string };
    };
    expect(call.content.body).not.toContain('due');
    expect(call.content.body).not.toContain('overdue');
  });
});

// ── cancelReminder ─────────────────────────────────────────────────────

describe('cancelReminder', () => {
  test('cancels a notification by ID', async () => {
    await cancelReminder('notif-xyz');
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-xyz');
  });
});

// ── cancelReminderForLoan ──────────────────────────────────────────────

describe('cancelReminderForLoan', () => {
  test('looks up notification ID from AsyncStorage and cancels', async () => {
    mockState.storage['lendlee:notification:loan-5'] = 'notif-555';

    await cancelReminderForLoan('loan-5');

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-555');
    expect(mockState.storage['lendlee:notification:loan-5']).toBeUndefined();
  });

  test('does nothing when no stored notification ID', async () => {
    await cancelReminderForLoan('loan-missing');
    expect(cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });
});

// ── cancelAllReminders ─────────────────────────────────────────────────

describe('cancelAllReminders', () => {
  test('calls cancelAllScheduledNotificationsAsync', async () => {
    await cancelAllReminders();
    expect(cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });
});
