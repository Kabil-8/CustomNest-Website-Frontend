import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGateProvider } from './context/AuthGateContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Layout } from './components/Layout';
import { RequireCustomer, RequireAdmin } from './components/RouteGuards';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CustomOrder from './pages/CustomOrder';
import CustomOrderCheckout from './pages/CustomOrderCheckout';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';

// Lazy loaded Account pages
const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const AccountOverview = lazy(() => import('./pages/account/AccountOverview'));
const AccountOrders = lazy(() => import('./pages/account/AccountOrders'));
const AccountOrderDetail = lazy(() => import('./pages/account/AccountOrderDetail'));
const AccountWishlist = lazy(() => import('./pages/account/AccountWishlist'));
const AccountAddresses = lazy(() => import('./pages/account/AccountAddresses'));
const AccountProfile = lazy(() => import('./pages/account/AccountProfile'));
const AccountCustomOrders = lazy(() => import('./pages/account/AccountCustomOrders'));

// Lazy loaded Admin pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCustomOrders = lazy(() => import('./pages/admin/AdminCustomOrders'));
const AdminExpenses = lazy(() => import('./pages/admin/AdminExpenses'));
const AdminColors = lazy(() => import('./pages/admin/AdminColors'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 rounded-full border-2 border-rose-200 border-t-rose-500 animate-spin" />
    </div>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGateProvider>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </AuthGateProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/custom-order" element={<CustomOrder />} />
              <Route path="/custom-order-checkout/:id" element={
                <RequireCustomer><CustomOrderCheckout /></RequireCustomer>
              } />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />

              <Route
                path="/account"
                element={
                  <RequireCustomer>
                    <AccountLayout />
                  </RequireCustomer>
                }
              >
                <Route index element={<AccountOverview />} />
                <Route path="orders" element={<AccountOrders />} />
                <Route path="orders/:orderId" element={<AccountOrderDetail />} />
                <Route path="wishlist" element={<AccountWishlist />} />
                <Route path="addresses" element={<AccountAddresses />} />
                <Route path="profile" element={<AccountProfile />} />
                <Route path="custom-orders" element={<AccountCustomOrders />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:orderId" element={<AdminOrderDetail />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="custom-orders" element={<AdminCustomOrders />} />
              <Route path="expenses" element={<AdminExpenses />} />
              <Route path="colors" element={<AdminColors />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="messages" element={<AdminMessages />} />
            </Route>
          </Routes>
        </Suspense>
      </Providers>
    </BrowserRouter>
  );
}
