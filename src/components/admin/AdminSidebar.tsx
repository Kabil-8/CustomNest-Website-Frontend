import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Sparkles,
  MessageSquare,
  BarChart3,
  Settings,
  Store,
  LogOut,
  X,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { classNames } from '../../lib/utils';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/custom-orders', label: 'Custom Orders', icon: Sparkles },
  { to: '/admin/expenses', label: 'Expenses', icon: Receipt },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
            <button onClick={onCloseMobile} className="lg:hidden text-muted hover:text-charcoal">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Links */}
        <nav className="space-y-1.5">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  classNames(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-rose-500 text-white shadow-soft'
                      : 'text-charcoal/80 hover:bg-rose-50 hover:text-rose-600'
                  )
                }
              >
                <Icon size={18} />
                <span>{link.label}</span>
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
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-danger hover:bg-danger/10 transition-colors text-left"
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
