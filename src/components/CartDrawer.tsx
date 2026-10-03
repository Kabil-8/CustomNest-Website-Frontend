import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuthGate } from '../context/AuthGateContext';
import { productApi } from '../lib/productApi';
import type { Product } from '../types';

export function CartDrawer() {
  const { items, isOpen, closeDrawer, updateQuantity, removeItem, subtotal, addItem } = useCart();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();
  const [drawerAddons, setDrawerAddons] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      productApi.listAddons().then(setDrawerAddons).catch(() => {});
    }
  }, [isOpen]);

  const handleCheckoutClick = () => {
    requireAuth(() => {
      closeDrawer();
      navigate('/checkout');
    }, 'Sign in to complete your checkout.');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            className="fixed inset-0 z-[90] bg-charcoal/45 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />

          {/* Responsive Drawer: Right-side on Desktop, Full/Bottom height on Mobile */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 bottom-0 z-[95] w-full sm:max-w-md bg-white shadow-lift flex flex-col justify-between"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-rose-500" />
                <h2 className="font-display text-xl text-charcoal">Your Nest Cart</h2>
                <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-muted hover:text-charcoal transition-colors"
                aria-label="Close cart drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Free Shipping Progress Alert */}
            {items.length > 0 && (
              <div className="px-6 py-3 bg-gradient-to-r from-rose-50 to-amber-50 border-b border-rose-100 flex flex-col gap-1.5 shrink-0">
                {subtotal > 799 ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Truck size={15} className="text-emerald-600" />
                    <span>🎉 You've unlocked <strong>FREE Shipping</strong>!</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-charcoal font-medium flex items-center gap-1.5">
                        <Truck size={14} className="text-rose-500" />
                        <span>Shop above ₹799 for <strong>FREE Shipping</strong>!</span>
                      </span>
                      <span className="text-rose-600 font-bold text-[0.72rem]">
                        Add ₹{800 - subtotal} more
                      </span>
                    </div>
                    <div className="w-full bg-rose-200/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((subtotal / 800) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Drawer Body Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-line/60">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4 items-center">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-ivory shrink-0 border border-line"
                    />

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product.slug}`}
                        onClick={closeDrawer}
                        className="font-display text-sm text-charcoal hover:text-rose-600 truncate block"
                      >
                        {item.product.name}
                      </Link>

                      {(item.customization?.yarnType || item.customization?.resinOption || item.customization?.color || item.customization?.size || item.customization?.text) && (
                        <p className="text-[0.7rem] text-rose-600 font-medium truncate mt-0.5">
                          {[item.customization.yarnType, item.customization.resinOption, item.customization.color, item.customization.size, item.customization.text].filter(Boolean).join(' • ')}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-line rounded-lg bg-cream/40 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs font-bold hover:bg-sand text-charcoal"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 text-xs font-bold text-charcoal">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs font-bold hover:bg-sand text-charcoal"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-display text-sm text-rose-600">
                          ₹{item.product.price * item.quantity}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted hover:text-danger transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mb-4">
                    <ShoppingBag size={28} />
                  </div>
                  <h3 className="font-display text-lg text-charcoal mb-1">Your cart is currently empty</h3>
                  <p className="text-xs text-muted max-w-xs mb-6">
                    Add beautiful handcrafted crochet pieces to your cart to begin your order.
                  </p>
                  <Link to="/shop" onClick={closeDrawer} className="btn-primary py-2.5 text-xs">
                    Explore Handmade Collection
                  </Link>
                </div>
              )}
            </div>

            {/* Suggested Add-ons (Free Shipping) */}
            {items.length > 0 && drawerAddons.length > 0 && (
              <div className="px-6 py-3 border-t border-line/80 bg-sand/30 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Suggested Add-Ons</span>
                  </div>
                  <span className="text-[0.62rem] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Free Shipping
                  </span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {drawerAddons.map((addon) => {
                    const inCart = items.some((i) => i.product.id === addon.id);
                    return (
                      <div
                        key={addon.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white border border-line shrink-0 w-48 shadow-xs"
                      >
                        <img
                          src={addon.image}
                          alt={addon.name}
                          className="w-9 h-9 rounded-lg object-cover bg-sand/20 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.72rem] font-semibold text-charcoal truncate">{addon.name}</p>
                          <p className="text-[0.7rem] font-bold text-rose-600">₹{addon.price}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addItem(addon, 1)}
                          disabled={inCart}
                          className={`px-2 py-1 rounded-lg text-[0.68rem] font-bold shrink-0 transition-colors cursor-pointer ${
                            inCart
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                          }`}
                        >
                          {inCart ? '✓' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Drawer Footer Subtotal & Action Buttons */}
            {items.length > 0 && (
              <div className="p-6 border-t border-line bg-cream/30 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-medium">Subtotal</span>
                  <span className="font-display text-xl text-rose-600">₹{subtotal}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Shipping</span>
                  <span className="font-medium text-charcoal">
                    {subtotal > 799 ? (
                      <span className="text-emerald-600 font-bold">FREE (Unlocked 🎉)</span>
                    ) : (
                      'Calculated at checkout'
                    )}
                  </span>
                </div>
                <p className="text-[0.7rem] text-muted">Taxes & shipping calculated at checkout.</p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <Link
                    to="/cart"
                    onClick={closeDrawer}
                    className="btn-secondary justify-center py-3 text-xs"
                  >
                    View Cart
                  </Link>
                  <button
                    onClick={handleCheckoutClick}
                    className="btn-primary justify-center py-3 text-xs flex items-center gap-1.5"
                  >
                    <span>Checkout</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
