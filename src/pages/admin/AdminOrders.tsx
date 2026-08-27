import React, { useEffect, useState } from 'react';
import { Search, Eye, Loader2, PackageX } from 'lucide-react';
import { orders as ordersApi } from '../../lib/api';
import type { Order, OrderStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { OrderTimeline } from '../../components/OrderTimeline';
import { formatDate } from '../../lib/utils';

export default function AdminOrders() {
  const { show } = useToast();
  const [orders, setOrders]             = useState<Order[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const list = await ordersApi.listAll();
      setOrders(list);
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const updated = await ordersApi.updateStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      show(`Updated ${orderId} status to ${nextStatus.toUpperCase()}! 📦`, 'success');
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to update order status', 'error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedStatus !== 'all' && o.status !== selectedStatus) return false;
    if (
      searchQuery.trim() &&
      !o.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(o.address?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="eyebrow mb-1">Fulfillment</span>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
          Customer Orders ({loading ? '…' : orders.length})
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-line shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Customer Name..."
            className="input text-xs pl-10 py-2.5 bg-cream/30"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-line bg-white text-charcoal outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted gap-2">
          <Loader2 size={24} className="animate-spin text-rose-400" />
          <span className="text-xs font-semibold">Loading orders from MongoDB…</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-line p-12 text-center shadow-soft">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <PackageX size={32} />
          </div>
          <h3 className="font-display text-xl text-charcoal mb-2">No orders in database</h3>
          <p className="text-muted text-sm max-w-md mx-auto">
            When customers place orders on the storefront, they will appear here live from MongoDB.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-cream/40 text-muted uppercase text-[0.65rem] tracking-wider">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-charcoal font-mono">{o.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-charcoal block">
                        {o.address?.fullName || 'Customer'}
                      </span>
                      <span className="text-[0.65rem] text-muted block">
                        {o.address?.phone || 'No phone'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted">{formatDate(o.createdAt)}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">₹{o.total}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                        className="px-2.5 py-1 rounded-full text-[0.65rem] font-bold border border-line bg-white cursor-pointer outline-none focus:border-rose-400"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="btn-secondary py-1 px-3 text-xs flex items-center gap-1 ml-auto"
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[95] bg-charcoal/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-lift border border-line p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <span className="eyebrow text-xs">Order Details</span>
                <h2 className="font-display text-xl text-charcoal font-mono">{selectedOrder.id}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-charcoal"
              >
                ✕
              </button>
            </div>

            {/* Interactive Timeline */}
            <div>
              <span className="label text-[0.7rem]">Fulfillment Timeline</span>
              <OrderTimeline currentStatus={selectedOrder.status} />
            </div>

            {/* Customer Info */}
            <div className="p-4 rounded-2xl bg-cream/40 border border-line space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Customer:</span>
                <span className="font-bold text-charcoal">{selectedOrder.address?.fullName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phone:</span>
                <span className="font-bold text-charcoal">{selectedOrder.address?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Shipping Address:</span>
                <span className="font-bold text-charcoal text-right max-w-xs">
                  {selectedOrder.address
                    ? `${selectedOrder.address.line1}, ${selectedOrder.address.city}, ${selectedOrder.address.state} ${selectedOrder.address.postalCode}`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <span className="label text-[0.7rem] mb-2 block">
                Order Items ({selectedOrder.items?.length || 0})
              </span>
              <div className="space-y-2 divide-y divide-line/60">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="pt-2 flex items-center gap-3">
                    <img
                      src={item.image || '/images/products/amigurumi-bunny.jpg'}
                      alt={item.name || 'Product'}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-charcoal">{item.name || 'Product'}</p>
                      <p className="text-[0.65rem] text-muted">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between">
              <span className="font-display text-base">Total Order Value</span>
              <span className="font-display text-xl text-rose-600">₹{selectedOrder.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
