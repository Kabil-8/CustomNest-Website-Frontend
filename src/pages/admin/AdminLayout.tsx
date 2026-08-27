import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Menu, Bell, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-cream flex">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-line px-6 py-4 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-charcoal p-1 hover:bg-sand rounded-xl"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="font-display text-lg text-charcoal font-bold">Admin Management</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-700">
              <ShieldCheck size={16} />
              <span>Admin Privileges Active</span>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-line">
              <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-charcoal block leading-tight">
                  {user?.name || 'Ashwitha K'}
                </span>
                <span className="text-[0.65rem] text-muted block">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Admin Page Content */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
