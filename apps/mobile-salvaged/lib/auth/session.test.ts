import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { registerReactNativeMock } from '../../test-support/mock-react-native';

const state: {
  platformOS: 'ios' | 'android' | 'web';
  store: Map<string, string>;
  getSessionResult: { data: { session: any }; error: null };
  authChangeHandler: ((event: string, session: any) => void) | null;
} = {
  platformOS: 'ios',
  store: new Map(),
  getSessionResult: { data: { session: null }, error: null },
  authChangeHandler: null,
};

// Rebind the shared RN mock with a live getter for Platform.OS so these
// tests can flip the platform between cases via `state.platformOS`.
registerReactNativeMock(() => state.platformOS);

const getItemAsync = mock(async (key: string) => state.store.get(key) ?? null);
const setItemAsync = mock(async (key: string, value: string) => {
  state.store.set(key, value);
});
const deleteItemAsync = mock(async (key: string) => {
  state.store.delete(key);
});

const getSession = mock(async () => state.getSessionResult);
const onAuthStateChange = mock((handler: (event: string, session: any) => void) => {
  state.authChangeHandler = handler;
  return {
    data: {
      subscription: {
        unsubscribe: mock(() => {
          state.authChangeHandler = null;
        }),
      },
    },
  };
});

mock.module('expo-secure-store', () => ({
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
}));

mock.module('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession,
      onAuthStateChange,
    },
  },
}));

const { ExpoSecureStoreAdapter } = await import('./session');

function resetState() {
  state.platformOS = 'ios';
  state.store.clear();
  state.getSessionResult = { data: { session: null }, error: null };
  state.authChangeHandler = null;
  getItemAsync.mockClear();
  setItemAsync.mockClear();
  deleteItemAsync.mockClear();
  getSession.mockClear();
  onAuthStateChange.mockClear();
}

describe('ExpoSecureStoreAdapter', () => {
  beforeEach(() => {
    resetState();
  });

  test('setItem writes to SecureStore on native', async () => {
    await ExpoSecureStoreAdapter.setItem('sb-session', 'token-value');
    expect(setItemAsync).toHaveBeenCalledWith('sb-session', 'token-value');
    expect(state.store.get('sb-session')).toBe('token-value');
  });

  test('getItem reads from SecureStore on native', async () => {
    state.store.set('sb-session', 'stored-token');
    const value = await ExpoSecureStoreAdapter.getItem('sb-session');
    expect(value).toBe('stored-token');
    expect(getItemAsync).toHaveBeenCalledWith('sb-session');
  });

  test('getItem returns null when key is missing', async () => {
    const value = await ExpoSecureStoreAdapter.getItem('missing');
    expect(value).toBeNull();
  });

  test('removeItem deletes from SecureStore on native', async () => {
    state.store.set('sb-session', 'to-delete');
    await ExpoSecureStoreAdapter.removeItem('sb-session');
    expect(deleteItemAsync).toHaveBeenCalledWith('sb-session');
    expect(state.store.has('sb-session')).toBe(false);
  });

  test('session round-trip: set then get returns the same value', async () => {
    const payload = JSON.stringify({ access_token: 'abc', refresh_token: 'xyz' });
    await ExpoSecureStoreAdapter.setItem('sb-auth-token', payload);
    const retrieved = await ExpoSecureStoreAdapter.getItem('sb-auth-token');
    expect(retrieved).toBe(payload);
  });

  test('getItem returns null on web without touching SecureStore', async () => {
    state.platformOS = 'web';
    const value = await ExpoSecureStoreAdapter.getItem('sb-session');
    expect(value).toBeNull();
    expect(getItemAsync).not.toHaveBeenCalled();
  });

  test('setItem is a no-op on web', async () => {
    state.platformOS = 'web';
    await ExpoSecureStoreAdapter.setItem('sb-session', 'v');
    expect(setItemAsync).not.toHaveBeenCalled();
  });

  test('removeItem is a no-op on web', async () => {
    state.platformOS = 'web';
    await ExpoSecureStoreAdapter.removeItem('sb-session');
    expect(deleteItemAsync).not.toHaveBeenCalled();
  });
});
