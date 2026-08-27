import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { AuthModal } from './AuthModal';
import { MobileBottomNav } from './MobileBottomNav';

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col pb-16 lg:pb-0">
      <Navbar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <MobileBottomNav />
    </div>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
