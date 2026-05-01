import type { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface EmailAuthResult {
  session: Session | null;
  error: AuthError | null;
  /**
   * True when sign-up succeeded but Supabase did not return a session because
   * the project requires email confirmation. The caller should route the user
   * to a "check your email" screen rather than into the app.
   */
  needsEmailConfirmation?: boolean;
}

/**
 * Wraps `supabase.auth.signInWithPassword` with a normalized return shape.
 * Always trims the email; password is forwarded as-is so leading/trailing
 * whitespace in the password is preserved (some users intentionally use it).
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<EmailAuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  return {
    session: data?.session ?? null,
    error: error ?? null,
  };
}

/**
 * Wraps `supabase.auth.signUp`. When the project requires email confirmation,
 * Supabase returns `{ user: <user>, session: null }` AND no error — that is the
 * only signal the caller has to know the account was created but cannot be used
 * yet. We surface that as `needsEmailConfirmation: true` so the UI can route
 * to a "check your email" screen.
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<EmailAuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  const needsEmailConfirmation = Boolean(data?.user && !data?.session);

  return {
    session: data?.session ?? null,
    error: error ?? null,
    needsEmailConfirmation,
  };
}

export type AuthErrorKind =
  | 'invalid_credentials'
  | 'rate_limit'
  | 'user_already_exists'
  | 'email_not_confirmed'
  | 'weak_password'
  | 'network'
  | 'unknown';

export interface MappedAuthError {
  kind: AuthErrorKind;
  message: string;
}

type AuthErrorLike = Pick<AuthError, 'message'> & {
  status?: number;
  code?: string;
};

/**
 * Maps a Supabase auth error to a stable kind + user-friendly string.
 * The `kind` lets the UI decide where to surface the message (inline under a
 * field vs. toast vs. banner). `message` is always safe to show as-is.
 */
export function authErrorMessage(
  error: AuthErrorLike | null | undefined
): MappedAuthError {
  if (!error) return { kind: 'unknown', message: '' };

  const raw = error.message ?? '';
  const message = raw.toLowerCase();
  const status = error.status;
  const code = error.code;

  if (
    status === 429 ||
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    message.includes('rate limit') ||
    message.includes('too many')
  ) {
    return {
      kind: 'rate_limit',
      message: 'Too many attempts — try again in a minute',
    };
  }

  if (
    code === 'invalid_credentials' ||
    message.includes('invalid login credentials') ||
    message.includes('invalid email or password')
  ) {
    return {
      kind: 'invalid_credentials',
      message: 'Wrong email or password.',
    };
  }

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return {
      kind: 'email_not_confirmed',
      message: 'Please confirm your email before signing in.',
    };
  }

  if (
    code === 'user_already_exists' ||
    message.includes('already registered') ||
    message.includes('user already')
  ) {
    return {
      kind: 'user_already_exists',
      message: 'An account with this email already exists. Try signing in.',
    };
  }

  if (
    code === 'weak_password' ||
    message.includes('weak password') ||
    message.includes('password should be')
  ) {
    return {
      kind: 'weak_password',
      message: 'Password is too weak. Use at least 8 characters.',
    };
  }

  if (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed')
  ) {
    return {
      kind: 'network',
      message: 'Network error. Check your connection and try again.',
    };
  }

  return {
    kind: 'unknown',
    message: raw || 'Something went wrong. Please try again.',
  };
}
