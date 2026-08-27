import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { auth as authApi, type Session } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyOtp: (phone: string, otp: string, name?: string) => Promise<void>;
  googleLogin: (data: { credential?: string; email?: string; name?: string; sub?: string; picture?: string }) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'phone'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from backend JWT on app start
  useEffect(() => {
    authApi.restoreSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setIsLoading(false));
  }, []);

  const applySession = (session: Session) => setUser(session.user);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    applySession(session);
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; phone: string; password: string }) => {
      const session = await authApi.register(input);
      applySession(session);
    },
    []
  );

  const sendOtp = useCallback(async (phone: string) => {
    return await authApi.sendOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string, name?: string) => {
    const session = await authApi.verifyOtp(phone, otp, name);
    applySession(session);
  }, []);

  const googleLogin = useCallback(
    async (data: { credential?: string; email?: string; name?: string; sub?: string; picture?: string }) => {
      const session = await authApi.googleLogin(data);
      applySession(session);
    },
    []
  );

  const adminLogin = useCallback(async (email: string, password: string) => {
    const session = await authApi.adminLogin(email, password);
    applySession(session);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<User, 'name' | 'phone'>>) => {
      if (!user) return;
      const updated = await authApi.updateProfile(user.id, patch);
      setUser(updated);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        sendOtp,
        verifyOtp,
        googleLogin,
        adminLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const defaultAuthValue: AuthContextValue = {
  user: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  sendOtp: async () => ({ success: false, message: '' }),
  verifyOtp: async () => {},
  googleLogin: async () => {},
  adminLogin: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn('[useAuth] Context accessed outside AuthProvider or during HMR cycle.');
      return defaultAuthValue;
    }
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

