import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { Order, OrderStatus } from '../../types';
import { orders as ordersApi } from '../../lib/api';
import { formatPrice, formatDate, estimateDelivery, getHandcraftingWindow } from '../../lib/utils';
import { OrderTimeline } from '../../components/OrderTimeline';
import { Badge, Skeleton, Spinner } from '../../components/ui';
import { statusTone } from '../account/orderStatus';
import { useToast } from '../../context/ToastContext';
import { Truck, Save, Loader2, Trash2, Camera } from 'lucide-react';

const STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const { show } = useToast();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Delivery & Tracking form
  const [deliveryDate, setDeliveryDate] = useState('');
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [savingShipping, setSavingShipping] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    ordersApi.getById(orderId).then((data) => {
      const ord = data?.order ?? null;
      setOrder(ord);
      if (ord) {
        setDeliveryDate(ord.estimatedDeliveryDate || estimateDelivery(ord.shippedAt || new Date().toISOString(), 3));
        setCourier(ord.courierPartner || '');
        setTracking(ord.trackingNumber || '');
      }
    });
  }, [orderId]);

  const handleDelete = async () => {
    if (!order) return;
    if (!window.confirm(`Are you sure you want to permanently delete order ${order.orderNumber || order.id}?`)) {
      return;
    }
    setDeleting(true);
    try {
      await ordersApi.remove(order.id);
      show('Order permanently deleted ✓', 'success');
      navigate('/admin/orders');
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to delete order', 'error');
      setDeleting(false);
    }
  };

  const updateStatus = async (status: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const defaultDelivery = deliveryDate || estimateDelivery(new Date().toISOString(), 3);
      const updated = await ordersApi.updateStatus(order.id, status, {
        estimatedDeliveryDate: status === 'Shipped' ? defaultDelivery : (order.estimatedDeliveryDate || undefined),
      });
      setOrder(updated);
      show(`Order status updated to ${status}.`, 'success');
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSavingShipping(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, order.status, {
        estimatedDeliveryDate: deliveryDate.trim() || undefined,
        courierPartner: courier.trim(),
        trackingNumber: tracking.trim(),
      });
      setOrder(updated);
      show('Shipping and delivery details saved ✓', 'success');
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to save shipping details', 'error');
    } finally {
      setSavingShipping(false);
    }
  };

  if (order === undefined) return <Skeleton className="h-64" />;
  if (order === null) {
    return (
      <div className="card p-10 text-center">
        <p className="text-muted mb-4">Order not found.</p>
        <Link to="/admin/orders" className="btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link to="/admin/orders" className="text-sm text-muted hover:text-rose-600">
          ← Back to Orders
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3 mt-2">
          <div>
            <h1 className="font-display text-3xl">{order.orderNumber || order.id}</h1>
            <p className="text-muted text-sm mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-secondary py-1.5 px-3 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              <span>Delete Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* UPI Payment Screenshot Proof Card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-charcoal font-display text-lg">
            <Camera size={18} className="text-rose-500" />
            <h2>UPI Payment Screenshot Proof</h2>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            order.paymentScreenshot ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {order.paymentScreenshot ? 'Screenshot Uploaded' : 'Awaiting Screenshot'}
          </span>
        </div>

        {order.paymentScreenshot ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-rose-50/40 p-4 rounded-2xl border border-rose-100">
            <a href={order.paymentScreenshot} target="_blank" rel="noopener noreferrer" className="relative group shrink-0 block">
              <img
                src={order.paymentScreenshot}
                alt="Payment proof"
                className="w-28 h-28 object-cover rounded-xl border border-rose-200 shadow-sm group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white text-xs font-semibold transition">
                Enlarge ↗
              </div>
            </a>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-charcoal">Customer Transaction Proof</p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Total amount charged: <strong className="text-rose-600">₹{order.total}</strong>. Verify UPI transaction ID before processing order dispatch.
              </p>
              <a
                href={order.paymentScreenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-bold hover:underline mt-2.5"
              >
                Open full screenshot in new tab ↗
              </a>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted italic">No payment screenshot attached by the customer yet.</p>
        )}
      </div>

      {/* Status & Timeline */}
      <div className="card p-6">
        <h2 className="font-display text-lg mb-4">Update Status</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={updating}
              onClick={() => updateStatus(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                order.status === s ? 'bg-rose-500 text-white border-rose-500' : 'border-line hover:border-rose-300'
              }`}
            >
              {updating && order.status === s ? <Spinner size={12} /> : s}
            </button>
          ))}
        </div>
        <OrderTimeline status={order.status} />

        <div className="mt-4 pt-4 border-t border-line/60">
          {order.status === 'Shipped' ? (
            <p className="text-xs text-emerald-700 font-bold text-center">
              🚚 Dispatched · Expected delivery: {order.estimatedDeliveryDate || estimateDelivery(order.shippedAt || order.createdAt, 3)}
            </p>
          ) : order.status !== 'Delivered' && order.status !== 'Cancelled' ? (
            <p className="text-xs text-rose-700 font-medium text-center">
              🧶 Preparation Time: 7–10 days (Dispatch window: {getHandcraftingWindow(order.createdAt).rangeText})
            </p>
          ) : null}
        </div>
      </div>

      {/* Shipping & Delivery Details Card */}
      <form onSubmit={handleSaveShipping} className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-charcoal font-display text-lg">
          <Truck size={18} className="text-rose-500" />
          <h2>Delivery & Tracking Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label text-xs">Estimated Delivery Date</label>
            <input
              type="text"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              placeholder="e.g. 10 Sep 2026 or 3–4 days"
              className="input text-xs"
            />
          </div>
          <div>
            <label className="label text-xs">Courier Partner</label>
            <input
              type="text"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="e.g. Delhivery / DTDC"
              className="input text-xs"
            />
          </div>
          <div>
            <label className="label text-xs">Tracking Number</label>
            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. TRK12345678"
              className="input text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingShipping}
            className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {savingShipping ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{savingShipping ? 'Saving…' : 'Save Shipping Details'}</span>
          </button>
        </div>
      </form>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-4">Customer</h2>
        <p className="text-sm font-medium">{order.customerName || order.address?.fullName}</p>
        <p className="text-sm text-muted">{order.customerEmail}</p>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-4">Items</h2>
        <div className="flex flex-col gap-4 divide-y divide-line/60">
          {order.items.map((item, i) => (
            <div key={i} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <a
                  href={item.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group shrink-0 block"
                  title="Click to view full image"
                >
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border border-rose-200 bg-ivory group-hover:scale-105 transition" />
                  {order.isCustomOrder && (
                    <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                      Sample
                    </span>
                  )}
                </a>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-charcoal">{item.name}</p>
                    {order.isCustomOrder && (
                      <span className="bg-rose-100 text-rose-700 text-[0.6rem] font-bold px-2 py-0.5 rounded-full">
                        Custom Crafted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">Qty {item.quantity}</p>
                  {item.customization && (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-rose-600 font-semibold">
                        {[
                          item.customization.yarnType ? (item.customization.yarnType === 'normal' ? 'Normal Yarn' : 'Acrylic Yarn') : null,
                          item.customization.color ? `Color: ${item.customization.color}` : null,
                          item.customization.size ? `Size: ${item.customization.size}` : null,
                        ].filter(Boolean).join(' · ')}
                      </p>
                      {item.customization.specialRequest && (
                        <p className="text-xs text-charcoal/80 bg-rose-50/50 p-2 rounded-xl border border-rose-100/70 leading-relaxed">
                          <span className="font-semibold text-muted">Customer Vision:</span> {item.customization.specialRequest}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-rose-600 shrink-0">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-line mt-4 pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-3">Shipping Address</h2>
        <p className="text-sm text-muted leading-relaxed">
          {order.address.fullName}
          <br />
          {order.address.line1}, {order.address.city}, {order.address.state} {order.address.postalCode}
          <br />
          {order.address.country} · {order.address.phone}
        </p>
      </div>
    </div>
  );
}
