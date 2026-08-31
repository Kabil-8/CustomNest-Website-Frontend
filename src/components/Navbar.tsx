import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Heart, User, ShoppingBag, Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { productApi, normalizeProduct } from '../lib/productApi';
import { orders as ordersApi, customOrders as customOrdersApi, admin as adminApi } from '../lib/api';
import type { Product } from '../types';
import { classNames } from '../lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/custom-order', label: 'Custom Orders' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { count, openDrawer } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [userBadgeCount, setUserBadgeCount] = useState<number>(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      setUserBadgeCount(0);
      return;
    }
    const fetchBadges = async () => {
      try {
        if (user.role === 'admin') {
          const counts = await adminApi.getBadgeCounts();
          const total = (counts.orders || 0) + (counts.customOrders || 0) + (counts.messages || 0);
          setUserBadgeCount(total);
        } else {
          const [myOrders, myCustom] = await Promise.all([
            ordersApi.listMine().catch(() => []),
            customOrdersApi.listMy().catch(() => []),
          ]);
          const activeOrders = myOrders.filter((o: any) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
          const activeCustom = myCustom.filter((r: any) => r.status === 'Accepted' || (r.messages || []).some((m: any) => m.sender === 'admin')).length;
          setUserBadgeCount(activeOrders + activeCustom);
        }
      } catch {
        // ignore
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 25000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await productApi.list({ q: query.trim(), limit: 6 });
        setResults(res.items.map(normalizeProduct));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      <header
        className={classNames(
          'sticky top-0 z-[70] bg-cream/90 backdrop-blur-sm transition-shadow',
          scrolled ? 'shadow-soft' : ''
        )}
      >
        <div className="container-nest flex items-center justify-between h-[72px]">
          <button
            className="lg:hidden text-charcoal relative"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
            {userBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
            )}
          </button>

          <Link to="/" className="shrink-0 flex items-center">
            <img
              src="/Customnest pic.png"
              alt="TheCustomNest"
              className="h-10 w-auto object-contain"
              style={{ aspectRatio: '3/2' }}
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 ml-10 mr-auto">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  classNames(
                    'text-sm font-medium transition-colors relative py-1',
                    isActive ? 'text-rose-600' : 'text-charcoal/80 hover:text-rose-600'
                  )
                }
              >
                {({ isActive }) => (
                  <span className="relative">
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-rose-500 rounded-full"
                      />
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-rose-50 text-charcoal transition-colors"
            >
              <Search size={19} />
            </button>
            <Link
              to="/account/wishlist"
              aria-label="Wishlist"
              className="relative hidden sm:flex w-10 h-10 rounded-full items-center justify-center hover:bg-rose-50 text-charcoal transition-colors"
            >
              <Heart size={19} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[0.6rem] text-white flex items-center justify-center font-bold">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <div className="relative hidden sm:block">
              <button
                onClick={() => setAccountOpen((s) => !s)}
                className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-rose-50 text-charcoal transition-colors"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label="Account menu"
              >
                <User size={19} />
                {userBadgeCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[0.6rem] text-white flex items-center justify-center font-bold shadow-xs">
                    {userBadgeCount > 99 ? '99+' : userBadgeCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    onMouseLeave={() => setAccountOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white border border-line rounded-2xl shadow-lift py-2"
                    role="menu"
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-line mb-1">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-muted truncate">{user.email}</p>
                        </div>
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="flex items-center justify-between px-4 py-2 text-sm hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => setAccountOpen(false)}
                          >
                            <div className="flex items-center gap-2.5">
                              <LayoutDashboard size={15} /> Admin Dashboard
                            </div>
                            {userBadgeCount > 0 && (
                              <span className="px-1.5 py-0.2 text-[0.6rem] font-bold rounded-full bg-rose-500 text-white">
                                {userBadgeCount}
                              </span>
                            )}
                          </Link>
                        )}
                        <Link
                          to="/account"
                          className="flex items-center justify-between px-4 py-2 text-sm hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setAccountOpen(false)}
                        >
                          <div className="flex items-center gap-2.5">
                            <User size={15} /> My Account
                          </div>
                          {user.role !== 'admin' && userBadgeCount > 0 && (
                            <span className="px-1.5 py-0.2 text-[0.6rem] font-bold rounded-full bg-rose-500 text-white">
                              {userBadgeCount}
                            </span>
                          )}
                        </Link>
                        <button
                          onClick={async () => {
                            await logout();
                            setAccountOpen(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-rose-50 hover:text-rose-600 text-left"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setAccountOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/register"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setAccountOpen(false)}
                        >
                          Create Account
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={openDrawer}
              aria-label={`Cart, ${count} items`}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-rose-50 text-charcoal transition-colors"
            >
              <ShoppingBag size={19} />
              {count > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[0.6rem] text-white flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[95] bg-charcoal/50 flex items-start justify-center pt-20 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white rounded-2xl shadow-lift overflow-hidden"
            >
              <form onSubmit={submitSearch} className="flex items-center gap-3 px-5 py-4 border-b border-line">
                <Search size={18} className="text-muted" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for bouquets, keychains, amigurumi…"
                  className="flex-1 outline-none text-[0.95rem] bg-transparent"
                />
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="text-muted hover:text-charcoal">
                  <X size={18} />
                </button>
              </form>
              {results.length > 0 && (
                <div className="max-h-[60vh] overflow-y-auto py-2">
                  {results.map((p) => (
                    <Link
                      key={p.id}
                      to={`/products/${p.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-rose-50"
                    >
                      <img src={p.image} alt="" className="w-11 h-11 rounded-lg object-cover bg-ivory" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted">{p.categoryLabel}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {query.trim() && results.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted">No results for "{query}". Try another search.</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[90] bg-charcoal/45 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed left-0 top-0 z-[95] h-full w-[85%] max-w-sm bg-white shadow-lift lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-line">
                <span className="flex items-center">
                  <img
                    src="/Customnest pic.png"
                    alt="TheCustomNest"
                    className="h-9 w-auto object-contain"
                    style={{ aspectRatio: '3/2' }}
                  />
                </span>
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col px-6 py-4 gap-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      classNames(
                        'py-3 text-[1.05rem] font-display border-b border-line/70',
                        isActive ? 'text-rose-600' : 'text-charcoal'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <Link to="/account/wishlist" onClick={() => setMobileOpen(false)} className="py-3 text-[1.05rem] font-display border-b border-line/70">
                  Wishlist
                </Link>
              </nav>
              <div className="mt-auto px-6 py-6 border-t border-line">
                {user ? (
                  <div className="flex flex-col gap-3">
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="btn-primary w-full flex items-center justify-center gap-2">
                        <LayoutDashboard size={15} /> Admin Dashboard
                        {userBadgeCount > 0 && (
                          <span className="px-1.5 py-0.2 text-[0.65rem] font-bold rounded-full bg-white text-rose-600">
                            {userBadgeCount}
                          </span>
                        )}
                      </Link>
                    )}
                    <Link to="/account" onClick={() => setMobileOpen(false)} className="btn-secondary w-full flex items-center justify-center gap-2">
                      <span>My Account</span>
                      {user.role !== 'admin' && userBadgeCount > 0 && (
                        <span className="px-1.5 py-0.2 text-[0.65rem] font-bold rounded-full bg-rose-500 text-white">
                          {userBadgeCount}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        setMobileOpen(false);
                        navigate('/');
                      }}
                      className="btn-tertiary justify-center"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-secondary w-full">
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
