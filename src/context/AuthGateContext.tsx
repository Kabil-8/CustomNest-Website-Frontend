import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

interface AuthGateContextValue {
  isOpen: boolean;
  reason: string;
  requireAuth: (action: () => void, reason?: string) => void;
  close: () => void;
  resolveWithSuccess: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | undefined>(undefined);

const DEFAULT_REASON = 'A little step before your nest grows 🧶\nSign in or create an account to save handmade items to your nest.';

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState(DEFAULT_REASON);
  const pendingAction = useRef<(() => void) | null>(null);

  const requireAuth = useCallback(
    (action: () => void, customReason?: string) => {
      if (user) {
        action();
        return;
      }
      pendingAction.current = action;
      setReason(customReason ?? DEFAULT_REASON);
      setIsOpen(true);
    },
    [user]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    pendingAction.current = null;
  }, []);

  const resolveWithSuccess = useCallback(() => {
    setIsOpen(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    if (action) {
      window.setTimeout(() => {
        action();
      }, 150);
    }
  }, []);

  return (
    <AuthGateContext.Provider value={{ isOpen, reason, requireAuth, close, resolveWithSuccess }}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    if (import.meta.env.DEV) {
      return {
        isOpen: false,
        reason: '',
        requireAuth: (action: () => void) => action(),
        close: () => {},
        resolveWithSuccess: () => {},
      };
    }
    throw new Error('useAuthGate must be used within AuthGateProvider');
  }
  return ctx;
}

