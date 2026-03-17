import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/api';
import type { User } from '../types';

export function useAuth() {
  const { token, user, isAuthenticated, setAuth, updateUser, logout } = useAuthStore();

  const login = async (email: string, password: string): Promise<void> => {
    const res = await authApi.login({ email, password });
    setAuth(res.data.token, res.data.user as User);
  };

  const register = async (email: string, password: string, username: string): Promise<void> => {
    const res = await authApi.register({ email, password, username });
    setAuth(res.data.token, res.data.user as User);
  };

  const signOut = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      logout();
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const res = await authApi.me();
      updateUser(res.data.user);
    } catch {
      logout();
    }
  };

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout: signOut,
    refreshUser,
    updateUser,
  };
}
