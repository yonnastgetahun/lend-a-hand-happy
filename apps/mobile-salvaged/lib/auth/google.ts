import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  type User as GoogleUser,
} from '@react-native-google-signin/google-signin';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface GoogleSignInResult {
  canceled: boolean;
  session: Session | null;
}

// Read client IDs from env with hardcoded fallbacks so a misconfigured build
// still picks up the real value that ships with the repo. Expo only exposes
// env vars prefixed with EXPO_PUBLIC_ to the JS bundle at runtime.
const IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
  '180727363697-jv1f6b84d80f7mtihenh7kq3vv7pu269.apps.googleusercontent.com';

const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
  '180727363697-jv1f6b84d80f7mtihenh7kq3vv7pu269.apps.googleusercontent.com';

let configured = false;

/**
 * `GoogleSignin.configure` is synchronous but safe to call more than once.
 * We memoize so repeated sign-in taps don't thrash the native side.
 */
export function configureGoogleSignIn(): void {
  if (configured) return;
  GoogleSignin.configure({
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

async function upsertGoogleProfile(
  userId: string,
  email: string | null | undefined,
  googleUser: GoogleUser['user'] | undefined
): Promise<void> {
  const displayName =
    googleUser?.name?.trim() ||
    [googleUser?.givenName, googleUser?.familyName].filter(Boolean).join(' ').trim() ||
    (email ? email.split('@')[0] : 'Google User');

  const row = {
    id: userId,
    name: displayName,
    email: email ?? googleUser?.email ?? '',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(row as never, { onConflict: 'id' });

  if (error) {
    console.warn('[signInWithGoogle] profile upsert failed:', error.message);
  }
}

function isCancelCode(code: unknown): boolean {
  if (typeof code !== 'string') return false;
  return (
    code === statusCodes.SIGN_IN_CANCELLED ||
    code === 'SIGN_IN_CANCELLED' ||
    code === 'SIGN_IN_CANCELED'
  );
}

/**
 * Runs the Google Sign-In flow and exchanges the resulting ID token for a
 * Supabase session. Returns `{ canceled: true }` when the user dismisses the
 * Google prompt; any other failure is re-thrown so the caller can surface a
 * user-visible toast.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    } catch (error: unknown) {
      console.error('[signInWithGoogle] play services check failed:', error);
      throw error;
    }
  }

  let response: Awaited<ReturnType<typeof GoogleSignin.signIn>>;
  try {
    response = await GoogleSignin.signIn();
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (isCancelCode(code)) {
      return { canceled: true, session: null };
    }
    throw error;
  }

  if (response.type === 'cancelled') {
    return { canceled: true, session: null };
  }

  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an ID token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    console.error('[signInWithGoogle] supabase exchange failed:', error.message);
    throw error;
  }

  if (data.user) {
    await upsertGoogleProfile(
      data.user.id,
      data.user.email ?? response.data.user.email,
      response.data.user
    );
  }

  return { canceled: false, session: data.session };
}
