import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@lendlee/shared";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          // TODO: Replace with actual API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          // Demo validation
          if (password.length < 6) {
            throw new Error("Invalid credentials");
          }

          const user: User = {
            id: crypto.randomUUID(),
            email,
            name: email.split("@")[0],
            createdAt: new Date(),
          };

          set({
            user,
            token: "demo-token-" + crypto.randomUUID(),
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            loading: false,
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ loading: true, error: null });
        try {
          // TODO: Replace with actual API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const user: User = {
            id: crypto.randomUUID(),
            email,
            name,
            createdAt: new Date(),
          };

          set({
            user,
            token: "demo-token-" + crypto.randomUUID(),
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Registration failed",
            loading: false,
          });
          throw error;
        }
      },

      loginAsGuest: () => {
        const guestUser: User = {
          id: "guest",
          email: "guest@lendlee.app",
          name: "Guest",
          createdAt: new Date(),
        };

        set({
          user: guestUser,
          token: "guest-token",
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "lendlee-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
