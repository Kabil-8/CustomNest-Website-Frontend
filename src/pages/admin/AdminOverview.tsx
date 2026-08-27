import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Users, Package, AlertTriangle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { StatCard } from '../../components/admin/StatCard';
import { auth as authApi, orders as ordersApi, customOrders as customOrdersApi } from '../../lib/api';
import type { Order, CustomOrderRequest } from '../../types';
import { formatDate } from '../../lib/utils';

interface LowStockItem {
  _id: string;
  name: string;
  stock: number;
  images?: string[];
}

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  lowStock: LowStockItem[];
}

export default function AdminOverview() {
  const [stats, setStats]               = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomOrderRequest[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashData, orderList, customList] = await Promise.all([
          authApi.getDashboard().catch(() => null),
          ordersApi.listAll().catch(() => []),
          customOrdersApi.listAll().catch(() => []),
        ]);
        if (dashData) setStats(dashData as unknown as DashboardStats);
        setRecentOrders(orderList.slice(0, 5));
        setCustomRequests(customList.slice(0, 4));
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div>
        <span className="eyebrow mb-1">Store Overview</span>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">Dashboard & Analytics</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted">
          <Loader2 size={24} className="animate-spin text-rose-400" />
          <span className="text-sm font-medium">Loading dashboard from MongoDB…</span>
        </div>
      ) : (
        <>
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard label="Total Revenue" value={stats?.totalSales ?? 0} prefix="₹" icon={DollarSign} change="Live DB" />
            <StatCard label="Total Orders" value={stats?.totalOrders ?? recentOrders.length} icon={ShoppingBag} change="Live DB" />
            <StatCard label="Active Customers" value={stats?.totalCustomers ?? 0} icon={Users} change="Live DB" />
            <StatCard label="Products Listed" value={stats?.totalProducts ?? 0} icon={Package} change="Live DB" />
          </div>

          {/* Sales Overview & Low Stock Alert */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sales Summary Card */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-line shadow-soft space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg text-charcoal">Fulfillment Metrics</h2>
                  <p className="text-xs text-muted">Order distribution in live MongoDB database</p>
                </div>
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  Live System
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-cream/40 border border-line">
                  <p className="text-xs text-muted font-medium mb-1">Pending Fulfillment</p>
                  <p className="font-display text-2xl text-amber-600">{stats?.pendingOrders ?? 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-cream/40 border border-line">
                  <p className="text-xs text-muted font-medium mb-1">Delivered Orders</p>
                  <p className="font-display text-2xl text-emerald-600">{stats?.completedOrders ?? 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-cream/40 border border-line col-span-2 sm:col-span-1">
                  <p className="text-xs text-muted font-medium mb-1">Total Revenue</p>
                  <p className="font-display text-2xl text-rose-600">₹{stats?.totalSales ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Low Stock Alerts Card */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-line shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle size={18} />
                  <h2 className="font-display text-base text-charcoal">Low Stock Alerts</h2>
                </div>
                <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2.5 py-0.5 rounded-full">
                  {stats?.lowStock?.length ?? 0}
                </span>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                {(!stats?.lowStock || stats.lowStock.length === 0) ? (
                  <p className="text-xs text-muted text-center py-6">All inventory levels are healthy ✓</p>
                ) : (
                  stats.lowStock.map((p) => (
                    <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-cream/40 border border-line">
                      <img
                        src={p.images?.[0] || '/images/products/amigurumi-bunny.jpg'}
                        alt={p.name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-charcoal truncate">{p.name}</p>
                        <p className="text-[0.65rem] text-rose-600 font-semibold">{p.stock} units remaining</p>
                      </div>
                      <Link to="/admin/products" className="text-xs text-rose-600 font-semibold hover:underline">
                        Restock
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Orders & Custom Requests Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Recent Orders */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-line shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="font-display text-lg text-charcoal">Recent Orders ({recentOrders.length})</h2>
                <Link to="/admin/orders" className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-muted uppercase text-[0.65rem]">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60 font-medium">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted">No customer orders placed yet.</td>
                      </tr>
                    ) : (
                      recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-rose-50/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-charcoal font-mono">{o.id}</td>
                          <td className="py-3 px-3 text-muted">{o.address?.fullName || 'Customer'}</td>
                          <td className="py-3 px-3 font-bold text-rose-600">₹{o.total}</td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-full text-[0.65rem] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom Order Requests Queue */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-line shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2 text-rose-600">
                  <Sparkles size={18} />
                  <h2 className="font-display text-lg text-charcoal">Custom Requests ({customRequests.length})</h2>
                </div>
                <Link to="/admin/custom-orders" className="text-xs font-semibold text-rose-600 hover:underline">
                  Manage
                </Link>
              </div>

              <div className="space-y-3">
                {customRequests.length === 0 ? (
                  <p className="text-xs text-muted text-center py-8">No custom order requests submitted yet.</p>
                ) : (
                  customRequests.map((cr) => (
                    <div key={cr.id} className="p-3.5 rounded-2xl bg-cream/40 border border-line space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-charcoal">
                        <span>{cr.name}</span>
                        <span className="text-rose-600">{cr.budget || 'Custom'}</span>
                      </div>
                      <p className="text-xs text-muted font-medium">{cr.productType}</p>
                      <div className="flex justify-between items-center text-[0.65rem] text-muted pt-1 border-t border-line/60">
                        <span>Submitted {formatDate(cr.createdAt)}</span>
                        <Link to="/admin/custom-orders" className="text-rose-600 font-bold hover:underline">Review →</Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
