/**
 * Local push notification scheduling for loan return reminders.
 *
 * Schedules a notification 1 day before the return date so the lender
 * gets a gentle nudge. The copy is warm and non-judgmental — no mention
 * of "due" or "overdue".
 *
 * Notification IDs are returned so they can be stored (keyed by loanId
 * in AsyncStorage) and cancelled later if the loan is returned early.
 */
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── AsyncStorage key helpers ───────────────────────────────────────────
const NOTIFICATION_KEY_PREFIX = 'lendlee:notification:';

function storageKey(loanId: string): string {
  return `${NOTIFICATION_KEY_PREFIX}${loanId}`;
}

// ── Notification channel (Android) ─────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Ask the user for notification permission. Returns `true` if granted.
 * Safe to call multiple times — if already granted it returns immediately.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Build the trigger date: 1 day before `returnDate`, at 10:00 AM local.
 * Exported for testing.
 */
export function buildTriggerDate(returnDate: Date): Date {
  const trigger = new Date(returnDate);
  trigger.setDate(trigger.getDate() - 1);
  trigger.setHours(10, 0, 0, 0);
  return trigger;
}

/**
 * Schedule a local reminder notification for 1 day before `returnDate`.
 *
 * Returns the expo-notifications identifier (for cancellation) or `null`
 * if the reminder could not be scheduled (e.g. trigger date is in the
 * past, or permissions denied).
 *
 * The notification ID is also persisted to AsyncStorage keyed by loanId.
 */
export async function scheduleReminder(
  loanId: string,
  borrowerName: string,
  itemTitle: string,
  returnDate: Date,
): Promise<string | null> {
  const triggerDate = buildTriggerDate(returnDate);

  // Don't schedule if the trigger date has already passed.
  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lendlee',
        body: `${borrowerName} still has your ${itemTitle}. Want to send a reminder?`,
        data: { loanId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    // Persist the notification ID so we can cancel later.
    await AsyncStorage.setItem(storageKey(loanId), id);

    return id;
  } catch {
    // Scheduling can fail if permissions aren't granted or the platform
    // doesn't support local notifications. Non-fatal — the app still
    // works without reminders.
    return null;
  }
}

/**
 * Cancel a previously scheduled reminder by its notification ID.
 */
export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel a reminder by loan ID (looks up the notification ID in AsyncStorage).
 */
export async function cancelReminderForLoan(loanId: string): Promise<void> {
  const notificationId = await AsyncStorage.getItem(storageKey(loanId));
  if (notificationId) {
    await cancelReminder(notificationId);
    await AsyncStorage.removeItem(storageKey(loanId));
  }
}

/**
 * Cancel every scheduled Lendlee notification.
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
