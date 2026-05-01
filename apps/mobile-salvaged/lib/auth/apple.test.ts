import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { registerReactNativeMock } from '../../test-support/mock-react-native';

registerReactNativeMock(() => 'ios');

type AppleCredential = {
  identityToken: string | null;
  authorizationCode: string | null;
  user: string;
  email: string | null;
  fullName: { givenName: string | null; familyName: string | null } | null;
};

const state: {
  signInResult: AppleCredential | Error;
  signInWithIdTokenResult: { data: { session: any; user: any }; error: any };
  profileUpsertError: any;
  capturedNonce: { apple?: string; supabase?: string };
  capturedUpsert: Record<string, unknown> | null;
  capturedSignInArgs: Record<string, unknown> | null;
} = {
  signInResult: {
    identityToken: 'identity-token',
    authorizationCode: 'code',
    user: 'apple-user-id',
    email: 'user@example.com',
    fullName: { givenName: 'Ada', familyName: 'Lovelace' },
  },
  signInWithIdTokenResult: {
    data: {
      session: { access_token: 'sup-token' },
      user: { id: 'sup-user-id', email: 'user@example.com' },
    },
    error: null,
  },
  profileUpsertError: null,
  capturedNonce: {},
  capturedUpsert: null,
  capturedSignInArgs: null,
};

const signInAsync = mock(async (options: { nonce?: string }) => {
  state.capturedNonce.apple = options?.nonce;
  if (state.signInResult instanceof Error) throw state.signInResult;
  return state.signInResult;
});

mock.module('expo-apple-authentication', () => ({
  signInAsync,
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
}));

const signInWithIdToken = mock(async (args: { provider: string; token: string; nonce?: string }) => {
  state.capturedNonce.supabase = args.nonce;
  state.capturedSignInArgs = args;
  return state.signInWithIdTokenResult;
});

const upsert = mock(async (row: Record<string, unknown>) => {
  state.capturedUpsert = row;
  return { error: state.profileUpsertError };
});

const from = mock((_table: string) => ({ upsert }));

mock.module('@/lib/supabase', () => ({
  supabase: {
    auth: { signInWithIdToken },
    from,
  },
}));

const { signInWithApple } = await import('./apple');

function resetState() {
  state.signInResult = {
    identityToken: 'identity-token',
    authorizationCode: 'code',
    user: 'apple-user-id',
    email: 'user@example.com',
    fullName: { givenName: 'Ada', familyName: 'Lovelace' },
  };
  state.signInWithIdTokenResult = {
    data: {
      session: { access_token: 'sup-token' },
      user: { id: 'sup-user-id', email: 'user@example.com' },
    },
    error: null,
  };
  state.profileUpsertError = null;
  state.capturedNonce = {};
  state.capturedUpsert = null;
  state.capturedSignInArgs = null;
  signInAsync.mockClear();
  signInWithIdToken.mockClear();
  upsert.mockClear();
  from.mockClear();
}

describe('signInWithApple', () => {
  beforeEach(() => {
    resetState();
  });

  test('requests FULL_NAME and EMAIL scopes and forwards identity token to Supabase', async () => {
    const result = await signInWithApple();

    expect(signInAsync).toHaveBeenCalledTimes(1);
    const appleArgs = signInAsync.mock.calls[0][0] as { requestedScopes: number[]; nonce: string };
    expect(appleArgs.requestedScopes).toEqual([0, 1]);
    expect(typeof appleArgs.nonce).toBe('string');
    expect(appleArgs.nonce.length).toBeGreaterThan(0);

    expect(signInWithIdToken).toHaveBeenCalledTimes(1);
    expect(state.capturedSignInArgs).toMatchObject({
      provider: 'apple',
      token: 'identity-token',
    });
    expect(state.capturedNonce.supabase).toBe(state.capturedNonce.apple);

    expect(result.canceled).toBe(false);
    expect(result.session).toEqual({ access_token: 'sup-token' });
  });

  test('creates or updates the profile row with the Apple full name', async () => {
    await signInWithApple();

    expect(from).toHaveBeenCalledWith('profiles');
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(state.capturedUpsert).toMatchObject({
      id: 'sup-user-id',
      name: 'Ada Lovelace',
      email: 'user@example.com',
    });
  });

  test('falls back to email prefix when Apple does not return a full name', async () => {
    state.signInResult = {
      identityToken: 'identity-token',
      authorizationCode: 'code',
      user: 'apple-user-id',
      email: 'ada@example.com',
      fullName: null,
    };

    await signInWithApple();

    expect(state.capturedUpsert).toMatchObject({ name: 'ada' });
  });

  test('returns { canceled: true } silently when the user cancels the Apple prompt', async () => {
    state.signInResult = Object.assign(new Error('canceled'), { code: 'ERR_REQUEST_CANCELED' });

    const result = await signInWithApple();

    expect(result).toEqual({ canceled: true, session: null });
    expect(signInWithIdToken).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  test('also treats double-L ERR_REQUEST_CANCELLED spelling as a silent cancel', async () => {
    state.signInResult = Object.assign(new Error('canceled'), { code: 'ERR_REQUEST_CANCELLED' });

    const result = await signInWithApple();

    expect(result.canceled).toBe(true);
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  test('re-throws non-cancel errors from Apple so the UI can surface them', async () => {
    state.signInResult = Object.assign(new Error('network down'), { code: 'ERR_REQUEST_FAILED' });

    await expect(signInWithApple()).rejects.toThrow('network down');
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  test('throws when Apple succeeds but returns no identity token', async () => {
    state.signInResult = {
      identityToken: null,
      authorizationCode: 'code',
      user: 'apple-user-id',
      email: 'user@example.com',
      fullName: null,
    };

    await expect(signInWithApple()).rejects.toThrow(/identity token/i);
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  test('re-throws Supabase errors so the UI can show a toast', async () => {
    state.signInWithIdTokenResult = {
      data: { session: null, user: null },
      error: { message: 'supabase down' },
    };

    await expect(signInWithApple()).rejects.toMatchObject({ message: 'supabase down' });
  });
});
