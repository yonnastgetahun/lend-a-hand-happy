import { describe, test, expect, mock, beforeEach } from 'bun:test';

type PermissionResponse = {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
  granted?: boolean;
  expires?: 'never';
};

const state: {
  getResponse: PermissionResponse | null;
  requestResponse: PermissionResponse | null;
  getThrows: boolean;
  requestThrows: boolean;
} = {
  getResponse: { status: 'undetermined', canAskAgain: true },
  requestResponse: { status: 'granted', canAskAgain: true },
  getThrows: false,
  requestThrows: false,
};

const getPermissionsAsync = mock(async () => {
  if (state.getThrows) throw new Error('get failed');
  return state.getResponse;
});

const requestPermissionsAsync = mock(async () => {
  if (state.requestThrows) throw new Error('request failed');
  return state.requestResponse;
});

mock.module('expo-contacts', () => ({
  getPermissionsAsync,
  requestPermissionsAsync,
}));

const { getContactsPermissionStatus, requestContactsPermission } = await import('./contacts');

function resetState() {
  state.getResponse = { status: 'undetermined', canAskAgain: true };
  state.requestResponse = { status: 'granted', canAskAgain: true };
  state.getThrows = false;
  state.requestThrows = false;
  getPermissionsAsync.mockClear();
  requestPermissionsAsync.mockClear();
}

describe('getContactsPermissionStatus', () => {
  beforeEach(() => {
    resetState();
  });

  test('reads the current status without prompting', async () => {
    state.getResponse = { status: 'undetermined', canAskAgain: true };

    const result = await getContactsPermissionStatus();

    expect(getPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'undetermined', canAskAgain: true });
  });

  test('returns granted when the user has previously allowed contacts', async () => {
    state.getResponse = { status: 'granted', canAskAgain: true };

    const result = await getContactsPermissionStatus();

    expect(result).toEqual({ status: 'granted', canAskAgain: true });
  });

  test('returns denied with canAskAgain=false when the OS will no longer prompt', async () => {
    state.getResponse = { status: 'denied', canAskAgain: false };

    const result = await getContactsPermissionStatus();

    expect(result).toEqual({ status: 'denied', canAskAgain: false });
  });

  test('falls back to undetermined when the native module throws', async () => {
    state.getThrows = true;

    const result = await getContactsPermissionStatus();

    expect(result).toEqual({ status: 'undetermined', canAskAgain: true });
  });
});

describe('requestContactsPermission', () => {
  beforeEach(() => {
    resetState();
  });

  test('returns granted when the user accepts the prompt', async () => {
    state.requestResponse = { status: 'granted', canAskAgain: true };

    const result = await requestContactsPermission();

    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'granted', canAskAgain: true });
  });

  test('returns denied with canAskAgain=true the first time the user denies', async () => {
    state.requestResponse = { status: 'denied', canAskAgain: true };

    const result = await requestContactsPermission();

    expect(result).toEqual({ status: 'denied', canAskAgain: true });
  });

  test('returns denied with canAskAgain=false once Android latches never-ask-again', async () => {
    state.requestResponse = { status: 'denied', canAskAgain: false };

    const result = await requestContactsPermission();

    expect(result).toEqual({ status: 'denied', canAskAgain: false });
  });

  test('treats an unexpected status string as undetermined', async () => {
    state.requestResponse = {
      status: 'bogus' as unknown as PermissionResponse['status'],
      canAskAgain: true,
    };

    const result = await requestContactsPermission();

    expect(result.status).toBe('undetermined');
  });

  test('defaults canAskAgain when the native response omits it', async () => {
    state.requestResponse = {
      status: 'granted',
      canAskAgain: undefined as unknown as boolean,
    };

    const result = await requestContactsPermission();

    expect(result).toEqual({ status: 'granted', canAskAgain: true });
  });

  test('defaults canAskAgain to false when status is denied and the field is missing', async () => {
    state.requestResponse = {
      status: 'denied',
      canAskAgain: undefined as unknown as boolean,
    };

    const result = await requestContactsPermission();

    expect(result).toEqual({ status: 'denied', canAskAgain: false });
  });

  test('returns denied/canAskAgain=false when the native module throws', async () => {
    state.requestThrows = true;

    const result = await requestContactsPermission();

    expect(result).toEqual({ status: 'denied', canAskAgain: false });
  });
});
