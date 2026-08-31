import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Order, OrderStatus } from '../../types';
import { orders as ordersApi } from '../../lib/api';
import { formatPrice, formatDate, estimateDelivery, getHandcraftingWindow } from '../../lib/utils';
import { OrderTimeline } from '../../components/OrderTimeline';
import { Badge, Skeleton, Spinner } from '../../components/ui';
import { statusTone } from '../account/orderStatus';
import { useToast } from '../../context/ToastContext';
import { Truck, Save, Loader2 } from 'lucide-react';

const STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const { show } = useToast();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [updating, setUpdating] = useState(false);

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
          <h1 className="font-display text-3xl">{order.orderNumber || order.id}</h1>
          <Badge tone={statusTone(order.status)}>{order.status}</Badge>
        </div>
        <p className="text-muted text-sm mt-1">Placed on {formatDate(order.createdAt)}</p>
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
        <div className="flex flex-col gap-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-4">
              <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-ivory" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted">Qty {item.quantity}</p>
                  {item.customization && (
                    <p className="text-xs text-rose-600">
                      {[item.customization.color, item.customization.size].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </div>
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
