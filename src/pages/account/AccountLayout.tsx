import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Heart, User, MapPin, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { classNames } from '../../lib/utils';
import { Breadcrumb } from '../../components/ui';
import { orders as ordersApi, customOrders as customOrdersApi } from '../../lib/api';

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [customOrdersCount, setCustomOrdersCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      try {
        const [myOrders, myCustom] = await Promise.all([
          ordersApi.listMine().catch(() => []),
          customOrdersApi.listMy().catch(() => []),
        ]);
        const activeOrders = myOrders.filter((o: any) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
        const activeCustom = myCustom.filter((r: any) => r.status === 'Accepted' || (r.messages || []).some((m: any) => m.sender === 'admin')).length;
        setOrdersCount(activeOrders);
        setCustomOrdersCount(activeCustom);
      } catch {}
    };
    fetchCounts();
  }, [user]);

  const links = [
    { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/account/orders', label: 'My Orders', icon: Package, badge: ordersCount },
    { to: '/account/custom-orders', label: 'Custom Orders', icon: Sparkles, badge: customOrdersCount },
    { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/account/addresses', label: 'Addresses', icon: MapPin },
    { to: '/account/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="container-nest py-10">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'My Account' }]} />
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Hi, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted text-sm mt-1">Manage your orders, wishlist, and account details.</p>
      </div>
      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        <aside className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                classNames(
                  'flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                  isActive ? 'bg-rose-500 text-white' : 'text-charcoal hover:bg-rose-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <l.icon size={16} />
                    <span>{l.label}</span>
                  </div>
                  {Boolean(l.badge && l.badge > 0) && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-[0.65rem] font-bold rounded-full transition-colors ${
                        isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {l.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors shrink-0 mt-0 lg:mt-4 cursor-pointer"
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
