import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// SecureStore has a ~2KB size limit per entry on some platforms. Supabase
// sessions are typically well under that for PKCE flows, but we only use
// SecureStore on native; on web we fall back to localStorage via no-op here
// (the Supabase client handles web separately).
export const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return Promise.resolve(null);
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') return Promise.resolve();
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') return Promise.resolve();
    return SecureStore.deleteItemAsync(key);
  },
};

export interface UseSessionResult {
  session: Session | null;
  loading: boolean;
}

/**
 * Reads the Supabase session on mount and subscribes to auth changes.
 * `loading` stays true until the initial `getSession()` resolves so callers
 * can gate their router / splash screen on it.
 */
export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session ?? null);
      })
      .catch((err) => {
        console.error('[useSession] getSession failed:', err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
