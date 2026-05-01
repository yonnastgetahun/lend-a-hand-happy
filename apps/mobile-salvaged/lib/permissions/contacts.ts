import * as Contacts from 'expo-contacts';

export type ContactsPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type ContactsPermissionResult = {
  status: ContactsPermissionStatus;
  canAskAgain: boolean;
};

function normalizeStatus(status: unknown): ContactsPermissionStatus {
  if (status === 'granted' || status === 'denied' || status === 'undetermined') {
    return status;
  }
  return 'undetermined';
}

function normalize(response: {
  status?: unknown;
  canAskAgain?: unknown;
}): ContactsPermissionResult {
  const status = normalizeStatus(response?.status);
  const canAskAgain =
    typeof response?.canAskAgain === 'boolean'
      ? response.canAskAgain
      : status !== 'denied';
  return { status, canAskAgain };
}

/**
 * Read the current contacts permission state without showing any system
 * prompt. Safe to call on mount or during render.
 */
export async function getContactsPermissionStatus(): Promise<ContactsPermissionResult> {
  try {
    const response = await Contacts.getPermissionsAsync();
    return normalize(response);
  } catch {
    return { status: 'undetermined', canAskAgain: true };
  }
}

/**
 * Request the contacts permission, triggering the OS-level prompt if the
 * user has not yet decided. Only call this in response to an explicit user
 * action (e.g. tapping Lend) — never on app startup.
 */
export async function requestContactsPermission(): Promise<ContactsPermissionResult> {
  try {
    const response = await Contacts.requestPermissionsAsync();
    return normalize(response);
  } catch {
    return { status: 'denied', canAskAgain: false };
  }
}
