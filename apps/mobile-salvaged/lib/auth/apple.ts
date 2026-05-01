import * as AppleAuthentication from 'expo-apple-authentication';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AppleSignInResult {
  canceled: boolean;
  session: Session | null;
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  const g = globalThis as { crypto?: { getRandomValues?: (arr: Uint8Array) => Uint8Array } };
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function upsertAppleProfile(
  userId: string,
  email: string | null | undefined,
  fullName: AppleAuthentication.AppleAuthenticationCredential['fullName']
): Promise<void> {
  const displayName =
    [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ').trim() ||
    (email ? email.split('@')[0] : 'Apple User');

  const row = {
    id: userId,
    name: displayName,
    email: email ?? '',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(row as never, { onConflict: 'id' });

  if (error) {
    console.warn('[signInWithApple] profile upsert failed:', error.message);
  }
}

/**
 * Runs the Apple Sign-In flow and exchanges the resulting identity token for a
 * Supabase session. Returns `{ canceled: true }` when the user dismisses the
 * Apple prompt; any other failure is re-thrown so the caller can surface a
 * user-visible error.
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  const nonce = generateNonce();

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce,
    });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_REQUEST_CANCELLED') {
      return { canceled: true, session: null };
    }
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In did not return an identity token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce,
  });

  if (error) {
    console.error('[signInWithApple] supabase exchange failed:', error.message);
    throw error;
  }

  if (data.user) {
    await upsertAppleProfile(data.user.id, credential.email ?? data.user.email, credential.fullName);
  }

  return { canceled: false, session: data.session };
}
