import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';

const AUTH_KEY = 'lendlee_auth';

// Define the context type
interface AuthContextType {
  user: User | null;
  isReady: boolean;
  isLoggedIn: boolean;
  login: ({ email, name }: { email: string; name: string }) => void;
  logout: () => void;
  isLoggingIn: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUTH_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    },
  });

  useEffect(() => {
    if (authQuery.isFetched) {
      setUser(authQuery.data ?? null);
      setIsReady(true);
    }
  }, [authQuery.data, authQuery.isFetched]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const newUser: User = {
        id: 'u1',
        name,
        email,
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      return newUser;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['auth'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_KEY);
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['auth'], null);
    },
  });

  const value = useMemo(() => ({
    user,
    isReady,
    isLoggedIn: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
  }), [user, isReady, loginMutation.mutate, logoutMutation.mutate, loginMutation.isPending]);

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
