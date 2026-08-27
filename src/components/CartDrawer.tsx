import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuthGate } from '../context/AuthGateContext';

export function CartDrawer() {
  const { items, isOpen, closeDrawer, updateQuantity, removeItem, subtotal } = useCart();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();

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

                      {(item.customization?.color || item.customization?.text) && (
                        <p className="text-[0.7rem] text-rose-600 font-medium truncate mt-0.5">
                          {[item.customization.color, item.customization.text].filter(Boolean).join(' • ')}
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

            {/* Drawer Footer Subtotal & Action Buttons */}
            {items.length > 0 && (
              <div className="p-6 border-t border-line bg-cream/30 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-medium">Subtotal</span>
                  <span className="font-display text-xl text-rose-600">₹{subtotal}</span>
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
