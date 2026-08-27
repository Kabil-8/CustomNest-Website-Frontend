import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAuthGate } from './AuthGateContext';
import { wishlistStore } from '../lib/api';
import { useToast } from './ToastContext';

interface WishlistContextValue {
  ids: string[];
  isSaved: (productId: string) => boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string, productName?: string) => void;
  toggleWishlist: (productId: string, productName?: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { show } = useToast();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(user ? wishlistStore.get(user.id) : []);
  }, [user]);

  const toggle = useCallback(
    (productId: string, productName = 'Item') => {
      requireAuth(() => {
        setIds((prev) => {
          const next = prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId];
          if (user) wishlistStore.set(user.id, next);
          show(
            prev.includes(productId) ? `${productName} removed from wishlist.` : `${productName} saved to wishlist.`,
            'success'
          );
          return next;
        });
      }, 'Please sign in to save items to your wishlist.');
    },
    [requireAuth, show, user]
  );

  const isSaved = useCallback((productId: string) => ids.includes(productId), [ids]);

  return (
    <WishlistContext.Provider
      value={{
        ids,
        isSaved,
        isWishlisted: isSaved,
        toggle,
        toggleWishlist: toggle,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
