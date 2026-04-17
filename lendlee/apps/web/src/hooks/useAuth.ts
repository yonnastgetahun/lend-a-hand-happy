import { useAuthStore } from "@/store/auth";

export function useAuth() {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    loginAsGuest,
    logout,
    clearError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    loginAsGuest,
    logout,
    clearError,
  };
}

export { useAuthStore };
