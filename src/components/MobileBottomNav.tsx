import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Search, Heart, User, Sparkles, X } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { classNames } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { productApi, normalizeProduct } from '../lib/productApi';
import type { Product } from '../types';

export function MobileBottomNav() {
  const { ids: wishlistIds } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  // State to manage dismissal of the floating custom order hint on mobile
  const [hintDismissed, setHintDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('custom_order_hint_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Hide floating alert if already on custom order, checkout or admin pages
  const hideCustomOrderHint =
    location.pathname.startsWith('/custom-order') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/admin');

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await productApi.list({ q: query.trim(), limit: 5 });
        setResults(res.items.map(normalizeProduct));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      {/* Floating Hint Alert for Custom Orders on Mobile (Since Custom is not in bottom bar) */}
      {!hideCustomOrderHint && !hintDismissed && (
        <div className="fixed bottom-[60px] left-3 right-3 z-[55] lg:hidden animate-fadeUp">
          <div className="bg-gradient-to-r from-charcoal via-[#3a201c] to-rose-950 text-white p-3 rounded-2xl shadow-lift border border-rose-400/40 flex items-center justify-between gap-2.5">
            <Link
              to="/custom-order"
              className="flex items-center gap-2.5 flex-1 min-w-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={18} className="text-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-200 bg-rose-500/40 px-1.5 py-0.2 rounded-full border border-rose-400/30">
                    Special
                  </span>
                  <span className="text-xs font-bold text-white truncate">Custom Orders</span>
                </div>
                <p className="text-[11px] text-ivory/80 truncate">
                  Want a unique crochet design? Request here!
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to="/custom-order"
                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-xs transition active:scale-95 whitespace-nowrap"
              >
                Order Now →
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHintDismissed(true);
                  try {
                    sessionStorage.setItem('custom_order_hint_dismissed', 'true');
                  } catch (_) {}
                }}
                className="text-ivory/60 hover:text-white p-1 rounded-lg transition cursor-pointer"
                aria-label="Dismiss custom order alert"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized Floating Button (if banner was dismissed, mobile users still have quick access) */}
      {!hideCustomOrderHint && hintDismissed && (
        <Link
          to="/custom-order"
          className="fixed bottom-[65px] right-3.5 z-[55] lg:hidden flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lift border border-rose-300/30 active:scale-95 transition-all animate-fadeUp"
          title="Need a custom design? Tap for Custom Orders"
        >
          <Sparkles size={13} className="text-amber-300 animate-pulse" />
          <span>Custom Orders</span>
        </Link>
      )}

      {/* Main Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-md border-t border-line shadow-lift lg:hidden py-1.5 px-3"
      >
        <div className="flex items-center justify-around">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              classNames(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-[0.68rem] font-medium transition-colors',
                isActive ? 'text-rose-600 font-bold' : 'text-charcoal/70 hover:text-rose-600'
              )
            }
          >
            <Home size={19} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/shop"
            className={({ isActive }) =>
              classNames(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-[0.68rem] font-medium transition-colors',
                isActive ? 'text-rose-600 font-bold' : 'text-charcoal/70 hover:text-rose-600'
              )
            }
          >
            <ShoppingBag size={19} />
            <span>Shop</span>
          </NavLink>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[0.68rem] font-medium text-charcoal/70 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Search size={19} />
            <span>Search</span>
          </button>

          <NavLink
            to="/account/wishlist"
            className={({ isActive }) =>
              classNames(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-[0.68rem] font-medium transition-colors relative',
                isActive ? 'text-rose-600 font-bold' : 'text-charcoal/70 hover:text-rose-600'
              )
            }
          >
            <Heart size={19} />
            {wishlistIds.length > 0 && (
              <span className="absolute top-0.5 right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-[0.55rem] text-white flex items-center justify-center font-bold">
                {wishlistIds.length}
              </span>
            )}
            <span>Wishlist</span>
          </NavLink>

          <NavLink
            to={user ? '/account' : '/login'}
            className={({ isActive }) =>
              classNames(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-[0.68rem] font-medium transition-colors',
                isActive ? 'text-rose-600 font-bold' : 'text-charcoal/70 hover:text-rose-600'
              )
            }
          >
            <User size={19} />
            <span>{user ? 'Account' : 'Sign In'}</span>
          </NavLink>
        </div>
      </nav>

      {/* Mobile Search Sheet */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[95] bg-charcoal/50 flex items-end justify-center lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white rounded-t-3xl p-5 max-h-[80vh] flex flex-col shadow-lift"
            >
              <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                <span className="font-display text-lg">Search Products</span>
                <button onClick={() => setSearchOpen(false)} className="text-muted hover:text-charcoal text-sm cursor-pointer">
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative mb-3">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Bouquets, amigurumi, keychains..."
                  className="input pl-11"
                />
              </form>

              {results.length > 0 && (
                <div className="overflow-y-auto max-h-[50vh] divide-y divide-line">
                  {results.map((p) => (
                    <Link
                      key={p.id}
                      to={`/products/${p.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 py-3 px-2 hover:bg-rose-50"
                    >
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-ivory" />
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{p.name}</p>
                        <p className="text-xs text-rose-600 font-bold">₹{p.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
