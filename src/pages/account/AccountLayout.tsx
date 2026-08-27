import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Heart, User, MapPin, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { classNames } from '../../lib/utils';
import { Breadcrumb } from '../../components/ui';

const LINKS = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/custom-orders', label: 'Custom Orders', icon: Sparkles },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/profile', label: 'Profile', icon: User },
];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container-nest py-10">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'My Account' }]} />
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Hi, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted text-sm mt-1">Manage your orders, wishlist, and account details.</p>
      </div>
      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        <aside className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                  isActive ? 'bg-rose-500 text-white' : 'text-charcoal hover:bg-rose-50'
                )
              }
            >
              <l.icon size={16} /> {l.label}
            </NavLink>
          ))}
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors shrink-0 mt-0 lg:mt-4"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
