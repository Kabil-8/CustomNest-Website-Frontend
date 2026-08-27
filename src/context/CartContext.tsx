import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, CustomizationChoice, Product } from '../types';
import { useAuth } from './AuthContext';
import { useAuthGate } from './AuthGateContext';
import { cartStore } from '../lib/api';
import { generateId } from '../lib/utils';
import { useToast } from './ToastContext';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isDrawerOpen: boolean;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: Product, quantity?: number, customization?: CustomizationChoice) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { show } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setItems(cartStore.get<CartItem[]>(user.id, []));
    } else {
      setItems([]);
    }
  }, [user]);

  const persist = useCallback(
    (next: CartItem[]) => {
      setItems(next);
      if (user) cartStore.set(user.id, next);
    },
    [user]
  );

  const addItem = useCallback(
    (product: Product, quantity = 1, customization?: CustomizationChoice) => {
      requireAuth(() => {
        setItems((prev) => {
          const existing = prev.find(
            (i) => i.product.id === product.id && JSON.stringify(i.customization) === JSON.stringify(customization)
          );
          let next: CartItem[];
          if (existing) {
            next = prev.map((i) => (i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i));
          } else {
            next = [...prev, { id: generateId('cart'), product, quantity, customization }];
          }
          if (user) cartStore.set(user.id, next);
          return next;
        });
        show(`${product.name} added to your cart.`, 'success');
        setIsDrawerOpen(true);
      }, 'Please sign in to continue adding items to your cart.');
    },
    [requireAuth, show, user]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      persist(items.filter((i) => i.id !== itemId));
    },
    [items, persist]
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        persist(items.filter((i) => i.id !== itemId));
        return;
      }
      persist(items.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
    },
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        isDrawerOpen,
        isOpen: isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        addItem,
        removeItem,
        updateQuantity,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
