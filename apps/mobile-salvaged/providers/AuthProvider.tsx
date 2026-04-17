import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsReady(true);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login with email/password
  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setAuthError(error.message);
        return { error };
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

      // Create profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name,
            email,
          });
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
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
