import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { registerReactNativeMock } from '../../test-support/mock-react-native';

const state: {
  platformOS: 'ios' | 'android' | 'web';
  signInResult:
    | { type: 'success'; data: { idToken: string | null; user: { id: string; name: string | null; email: string; givenName: string | null; familyName: string | null; photo: string | null } } }
    | { type: 'cancelled'; data: null }
    | Error;
  hasPlayServicesResult: boolean | Error;
  signInWithIdTokenResult: { data: { session: any; user: any }; error: any };
  profileUpsertError: any;
  capturedUpsert: Record<string, unknown> | null;
  capturedSignInArgs: Record<string, unknown> | null;
  capturedConfigureArgs: Record<string, unknown> | null;
} = {
  platformOS: 'ios',
  signInResult: {
    type: 'success',
    data: {
      idToken: 'google-id-token',
      user: {
        id: 'google-user-id',
        name: 'Ada Lovelace',
        email: 'user@example.com',
        givenName: 'Ada',
        familyName: 'Lovelace',
        photo: null,
      },
    },
  },
  hasPlayServicesResult: true,
  signInWithIdTokenResult: {
    data: {
      session: { access_token: 'sup-token' },
      user: { id: 'sup-user-id', email: 'user@example.com' },
    },
    error: null,
  },
  profileUpsertError: null,
  capturedUpsert: null,
  capturedSignInArgs: null,
  capturedConfigureArgs: null,
};

registerReactNativeMock(() => state.platformOS);

const configure = mock((args: Record<string, unknown>) => {
  state.capturedConfigureArgs = args;
});

const hasPlayServices = mock(async (_opts: { showPlayServicesUpdateDialog: boolean }) => {
  if (state.hasPlayServicesResult instanceof Error) throw state.hasPlayServicesResult;
  return state.hasPlayServicesResult;
});

const signIn = mock(async () => {
  if (state.signInResult instanceof Error) throw state.signInResult;
  return state.signInResult;
});

mock.module('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure,
    hasPlayServices,
    signIn,
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  },
}));

const signInWithIdToken = mock(async (args: { provider: string; token: string }) => {
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

const { signInWithGoogle } = await import('./google');

function resetState() {
  state.platformOS = 'ios';
  state.signInResult = {
    type: 'success',
    data: {
      idToken: 'google-id-token',
      user: {
        id: 'google-user-id',
        name: 'Ada Lovelace',
        email: 'user@example.com',
        givenName: 'Ada',
        familyName: 'Lovelace',
        photo: null,
      },
    },
  };
  state.hasPlayServicesResult = true;
  state.signInWithIdTokenResult = {
    data: {
      session: { access_token: 'sup-token' },
      user: { id: 'sup-user-id', email: 'user@example.com' },
    },
    error: null,
  };
  state.profileUpsertError = null;
  state.capturedUpsert = null;
  state.capturedSignInArgs = null;
  // Note: capturedConfigureArgs and configure mock are intentionally not
  // reset because GoogleSignin.configure is memoized inside the module —
  // it only fires on the first sign-in call for the whole suite.
  hasPlayServices.mockClear();
  signIn.mockClear();
  signInWithIdToken.mockClear();
  upsert.mockClear();
  from.mockClear();
}

describe('signInWithGoogle', () => {
  beforeEach(() => {
    resetState();
  });

  test('forwards the Google ID token to Supabase and returns the session', async () => {
    const result = await signInWithGoogle();

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signInWithIdToken).toHaveBeenCalledTimes(1);
    expect(state.capturedSignInArgs).toMatchObject({
      provider: 'google',
      token: 'google-id-token',
    });
    expect(result.canceled).toBe(false);
    expect(result.session).toEqual({ access_token: 'sup-token' });
  });

  test('skips the Play Services check on iOS', async () => {
    state.platformOS = 'ios';
    await signInWithGoogle();
    expect(hasPlayServices).not.toHaveBeenCalled();
  });

  test('runs the Play Services check on Android before signing in', async () => {
    state.platformOS = 'android';
    await signInWithGoogle();
    expect(hasPlayServices).toHaveBeenCalledTimes(1);
    expect(hasPlayServices.mock.calls[0][0]).toEqual({ showPlayServicesUpdateDialog: true });
  });

  test('creates or updates the profile row with the Google display name', async () => {
    await signInWithGoogle();

    expect(from).toHaveBeenCalledWith('profiles');
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(state.capturedUpsert).toMatchObject({
      id: 'sup-user-id',
      name: 'Ada Lovelace',
      email: 'user@example.com',
    });
  });

  test('falls back to given/family name when the full name field is missing', async () => {
    state.signInResult = {
      type: 'success',
      data: {
        idToken: 'google-id-token',
        user: {
          id: 'google-user-id',
          name: null,
          email: 'user@example.com',
          givenName: 'Grace',
          familyName: 'Hopper',
          photo: null,
        },
      },
    };

    await signInWithGoogle();

    expect(state.capturedUpsert).toMatchObject({ name: 'Grace Hopper' });
  });

  test('returns { canceled: true } silently when Google returns a cancelled response', async () => {
    state.signInResult = { type: 'cancelled', data: null };

    const result = await signInWithGoogle();

    expect(result).toEqual({ canceled: true, session: null });
    expect(signInWithIdToken).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  test('returns { canceled: true } silently when GoogleSignin throws a SIGN_IN_CANCELLED error', async () => {
    state.signInResult = Object.assign(new Error('canceled'), { code: 'SIGN_IN_CANCELLED' });

    const result = await signInWithGoogle();

    expect(result).toEqual({ canceled: true, session: null });
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  test('re-throws non-cancel errors from GoogleSignin so the UI can surface them', async () => {
    state.signInResult = Object.assign(new Error('network down'), { code: 'DEVELOPER_ERROR' });

    await expect(signInWithGoogle()).rejects.toThrow('network down');
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  test('throws when Google succeeds but returns no ID token', async () => {
    state.signInResult = {
      type: 'success',
      data: {
        idToken: null,
        user: {
          id: 'google-user-id',
          name: null,
          email: 'user@example.com',
          givenName: null,
          familyName: null,
          photo: null,
        },
      },
    };

    await expect(signInWithGoogle()).rejects.toThrow(/id token/i);
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  test('re-throws Supabase errors so the UI can show a toast', async () => {
    state.signInWithIdTokenResult = {
      data: { session: null, user: null },
      error: { message: 'supabase down' },
    };

    await expect(signInWithGoogle()).rejects.toMatchObject({ message: 'supabase down' });
  });

  test('configures GoogleSignin with the expected client IDs on first call', async () => {
    await signInWithGoogle();

    expect(configure).toHaveBeenCalled();
    expect(state.capturedConfigureArgs).toMatchObject({
      iosClientId: expect.stringContaining('.apps.googleusercontent.com'),
      webClientId: expect.stringContaining('.apps.googleusercontent.com'),
      offlineAccess: false,
    });
  });

  test('re-throws Play Services errors on Android', async () => {
    state.platformOS = 'android';
    state.hasPlayServicesResult = Object.assign(new Error('no play services'), {
      code: 'PLAY_SERVICES_NOT_AVAILABLE',
    });

    await expect(signInWithGoogle()).rejects.toThrow('no play services');
    expect(signIn).not.toHaveBeenCalled();
  });
});
