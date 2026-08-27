import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Search, Heart, User } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { classNames } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { productApi, normalizeProduct } from '../lib/productApi';
import type { Product } from '../types';
import { Link, useNavigate } from 'react-router-dom';

export function MobileBottomNav() {
  const { ids: wishlistIds } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

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
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[0.68rem] font-medium text-charcoal/70 hover:text-rose-600 transition-colors"
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
                <button onClick={() => setSearchOpen(false)} className="text-muted hover:text-charcoal text-sm">
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
