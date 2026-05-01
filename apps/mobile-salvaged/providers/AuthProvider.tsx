import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/auth/session';
import { User, AuthError } from '@supabase/supabase-js';

// Define the context type
interface AuthContextType {
  user: User | null;
  isReady: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  authError: string | null;
  clearError: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const user: User | null = session?.user ?? null;
  const isReady = !loading;
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Helper to ensure profile exists
  const ensureProfile = async (userId: string, name: string, email: string) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (!existingProfile) {
        // Create profile if it doesn't exist
        console.log('Creating profile for user:', userId);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: name || email.split('@')[0],
            email: email,
          });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Try upsert as fallback
          await supabase
            .from('profiles')
            .upsert({
              id: userId,
              name: name || email.split('@')[0],
              email: email,
            });
        }
      }
    } catch (err) {
      console.error('Profile check error:', err);
    }
  };

  // Login with email/password
  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setAuthError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setAuthError(error.message);
        return { error };
      }
      
      // Ensure profile exists after login
      if (data.user) {
        await ensureProfile(
          data.user.id,
          data.user.user_metadata?.name || email.split('@')[0],
          data.user.email || email
        );
      }
      
      return { error: null };
    } catch (error: any) {
      setAuthError(error?.message || 'Login failed');
      return { error };
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, name: string) => {
    setIsSigningUp(true);
    setAuthError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) {
        setAuthError(error.message);
        return { error };
      }

      // Ensure profile is created after sign up
      if (data.user) {
        // Wait a moment for any trigger to run
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to create/update profile directly
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: name,
            email: email,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });
        
        if (upsertError) {
          console.log('Profile upsert note:', upsertError.message);
          // Don't fail sign-up if profile creation has issues
        }
      }
      
      return { error: null };
    } catch (error: any) {
      setAuthError(error?.message || 'Sign up failed');
      return { error };
    } finally {
      setIsSigningUp(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    isReady,
    isLoggedIn: !!user,
    login,
    signUp,
    logout,
    isLoggingIn,
    isSigningUp,
    authError,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
