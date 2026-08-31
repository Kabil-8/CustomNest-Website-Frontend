import React, { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Sparkles,
  Store,
  LogOut,
  X,
  Receipt,
  Palette,
  Star,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { classNames } from '../../lib/utils';
import { admin as adminApi } from '../../lib/api';

interface AdminBadgeCounts {
  orders?: number;
  customOrders?: number;
  messages?: number;
  reviews?: number;
}

const ADMIN_LINKS: {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  badgeKey?: keyof AdminBadgeCounts;
}[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/colors', label: 'Design Colors', icon: Palette },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, badgeKey: 'orders' },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/custom-orders', label: 'Custom Orders', icon: Sparkles, badgeKey: 'customOrders' },
  { to: '/admin/messages', label: 'Inquiries', icon: Mail, badgeKey: 'messages' },
  { to: '/admin/reviews', label: 'Reviews', icon: Star, badgeKey: 'reviews' },
  { to: '/admin/expenses', label: 'Expenses', icon: Receipt },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [badgeCounts, setBadgeCounts] = useState<AdminBadgeCounts>({});

  const loadBadges = async () => {
    try {
      const counts = await adminApi.getBadgeCounts();
      setBadgeCounts(counts);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadBadges();
    const timer = setInterval(loadBadges, 25000); // live refresh every 25s
    return () => clearInterval(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navContent = (
    <div className="h-full flex flex-col justify-between p-6 bg-white border-r border-line shadow-soft">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-line mb-6">
          <Link to="/admin" className="flex items-center gap-2 min-w-0">
            <img
              src="/Customnest pic.png"
              alt="TheCustomNest"
              className="h-12 w-auto object-contain shrink-0"
              style={{ aspectRatio: '3/2' }}
            />
            <span className="text-[0.6rem] font-bold uppercase tracking-widest text-rose-600 leading-tight whitespace-nowrap">
              ADMIN PORTAL
            </span>
          </Link>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden text-muted hover:text-charcoal cursor-pointer">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Links */}
        <nav className="space-y-1.5">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            const badgeValue = link.badgeKey ? badgeCounts[link.badgeKey] ?? 0 : 0;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  classNames(
                    'flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all group',
                    isActive
                      ? 'bg-rose-500 text-white shadow-soft'
                      : 'text-charcoal/80 hover:bg-rose-50 hover:text-rose-600'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </div>

                    {/* Dynamic notification badge */}
                    {badgeValue > 0 && (
                      <span
                        className={classNames(
                          'px-2 py-0.5 rounded-full text-[0.65rem] font-bold transition-transform group-hover:scale-105',
                          isActive
                            ? 'bg-white text-rose-600 shadow-xs'
                            : link.badgeKey === 'messages'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : link.badgeKey === 'customOrders'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-500 text-white shadow-xs'
                        )}
                      >
                        {badgeValue > 99 ? '99+' : badgeValue}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="pt-6 border-t border-line space-y-2">
        <Link
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-charcoal/70 hover:bg-sand transition-colors"
        >
          <Store size={18} />
          <span>View Storefront</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-danger hover:bg-danger/10 transition-colors text-left cursor-pointer"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">{navContent}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[95] lg:hidden flex">
          <div className="fixed inset-0 bg-charcoal/40" onClick={onCloseMobile} />
          <div className="relative w-72 h-full z-10">{navContent}</div>
        </div>
      )}
    </>
  );
}
