import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { registerReactNativeMock } from '../../test-support/mock-react-native';

registerReactNativeMock(() => 'ios');

const state: {
  signInResult: { data: { session: any; user: any }; error: any };
  signUpResult: { data: { session: any; user: any }; error: any };
  capturedSignInArgs: { email: string; password: string } | null;
  capturedSignUpArgs: { email: string; password: string } | null;
} = {
  signInResult: {
    data: {
      session: { access_token: 'tok' },
      user: { id: 'user-id', email: 'user@example.com' },
    },
    error: null,
  },
  signUpResult: {
    data: {
      session: { access_token: 'tok' },
      user: { id: 'user-id', email: 'user@example.com' },
    },
    error: null,
  },
  capturedSignInArgs: null,
  capturedSignUpArgs: null,
};

const signInWithPassword = mock(async (args: { email: string; password: string }) => {
  state.capturedSignInArgs = args;
  return state.signInResult;
});

const signUp = mock(async (args: { email: string; password: string }) => {
  state.capturedSignUpArgs = args;
  return state.signUpResult;
});

mock.module('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword,
      signUp,
    },
  },
}));

const { signInWithEmail, signUpWithEmail, authErrorMessage } = await import('./email');

function resetState() {
  state.signInResult = {
    data: {
      session: { access_token: 'tok' },
      user: { id: 'user-id', email: 'user@example.com' },
    },
    error: null,
  };
  state.signUpResult = {
    data: {
      session: { access_token: 'tok' },
      user: { id: 'user-id', email: 'user@example.com' },
    },
    error: null,
  };
  state.capturedSignInArgs = null;
  state.capturedSignUpArgs = null;
  signInWithPassword.mockClear();
  signUp.mockClear();
}

describe('signInWithEmail', () => {
  beforeEach(() => {
    resetState();
  });

  test('forwards trimmed email and password to supabase.auth.signInWithPassword', async () => {
    const result = await signInWithEmail('  user@example.com  ', 'hunter2pass');

    expect(signInWithPassword).toHaveBeenCalledTimes(1);
    expect(state.capturedSignInArgs).toEqual({
      email: 'user@example.com',
      password: 'hunter2pass',
    });
    expect(result.session).toEqual({ access_token: 'tok' });
    expect(result.error).toBeNull();
  });

  test('preserves whitespace in passwords (does not trim password)', async () => {
    await signInWithEmail('user@example.com', '  with spaces  ');
    expect(state.capturedSignInArgs?.password).toBe('  with spaces  ');
  });

  test('returns the supabase error verbatim when sign-in fails', async () => {
    state.signInResult = {
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials', status: 400, code: 'invalid_credentials' },
    };

    const result = await signInWithEmail('user@example.com', 'wrong');

    expect(result.session).toBeNull();
    expect(result.error).toMatchObject({ message: 'Invalid login credentials' });
  });
});

describe('signUpWithEmail', () => {
  beforeEach(() => {
    resetState();
  });

  test('forwards trimmed email and password to supabase.auth.signUp', async () => {
    const result = await signUpWithEmail('  new@example.com  ', 'hunter2pass');

    expect(signUp).toHaveBeenCalledTimes(1);
    expect(state.capturedSignUpArgs).toEqual({
      email: 'new@example.com',
      password: 'hunter2pass',
    });
    expect(result.session).toEqual({ access_token: 'tok' });
    expect(result.error).toBeNull();
  });

  test('flags needsEmailConfirmation when supabase returns a user but no session', async () => {
    state.signUpResult = {
      data: {
        session: null,
        user: { id: 'user-id', email: 'new@example.com' },
      },
      error: null,
    };

    const result = await signUpWithEmail('new@example.com', 'hunter2pass');

    expect(result.session).toBeNull();
    expect(result.error).toBeNull();
    expect(result.needsEmailConfirmation).toBe(true);
  });

  test('does not flag needsEmailConfirmation when both session and user are returned', async () => {
    const result = await signUpWithEmail('new@example.com', 'hunter2pass');
    expect(result.needsEmailConfirmation).toBe(false);
  });

  test('does not flag needsEmailConfirmation when there is an error', async () => {
    state.signUpResult = {
      data: { session: null, user: null },
      error: { message: 'User already registered', code: 'user_already_exists' },
    };

    const result = await signUpWithEmail('new@example.com', 'hunter2pass');

    expect(result.needsEmailConfirmation).toBe(false);
    expect(result.error).toMatchObject({ message: 'User already registered' });
  });
});

describe('authErrorMessage', () => {
  test('returns empty mapping for null/undefined', () => {
    expect(authErrorMessage(null)).toEqual({ kind: 'unknown', message: '' });
    expect(authErrorMessage(undefined)).toEqual({ kind: 'unknown', message: '' });
  });

  test('maps invalid_credentials code to a friendly inline message', () => {
    const result = authErrorMessage({
      message: 'Invalid login credentials',
      status: 400,
      code: 'invalid_credentials',
    });
    expect(result.kind).toBe('invalid_credentials');
    expect(result.message).toMatch(/wrong email or password/i);
  });

  test('maps the legacy "Invalid login credentials" message even without a code', () => {
    const result = authErrorMessage({ message: 'Invalid login credentials' });
    expect(result.kind).toBe('invalid_credentials');
  });

  test('maps HTTP 429 to a rate_limit kind with the toast copy', () => {
    const result = authErrorMessage({ message: 'Too many requests', status: 429 });
    expect(result.kind).toBe('rate_limit');
    expect(result.message).toBe('Too many attempts — try again in a minute');
  });

  test('maps over_email_send_rate_limit code to rate_limit', () => {
    const result = authErrorMessage({
      message: 'For security purposes, you can only request this after 60 seconds',
      code: 'over_email_send_rate_limit',
    });
    expect(result.kind).toBe('rate_limit');
  });

  test('maps "User already registered" to user_already_exists', () => {
    const result = authErrorMessage({ message: 'User already registered' });
    expect(result.kind).toBe('user_already_exists');
    expect(result.message).toMatch(/already exists/i);
  });

  test('maps "Email not confirmed" to email_not_confirmed', () => {
    const result = authErrorMessage({
      message: 'Email not confirmed',
      code: 'email_not_confirmed',
    });
    expect(result.kind).toBe('email_not_confirmed');
    expect(result.message).toMatch(/confirm your email/i);
  });

  test('maps weak password errors to weak_password', () => {
    const result = authErrorMessage({
      message: 'Password should be at least 6 characters',
      code: 'weak_password',
    });
    expect(result.kind).toBe('weak_password');
  });

  test('maps fetch/network failures to network', () => {
    const result = authErrorMessage({ message: 'Network request failed' });
    expect(result.kind).toBe('network');
    expect(result.message).toMatch(/network/i);
  });

  test('falls through to unknown with the original message for unmapped errors', () => {
    const result = authErrorMessage({ message: 'something weird happened' });
    expect(result.kind).toBe('unknown');
    expect(result.message).toBe('something weird happened');
  });

  test('falls through to a generic message when error has no message text', () => {
    const result = authErrorMessage({ message: '' });
    expect(result.kind).toBe('unknown');
    expect(result.message).toMatch(/something went wrong/i);
  });
});
