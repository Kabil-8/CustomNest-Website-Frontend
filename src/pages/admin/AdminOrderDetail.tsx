import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Order, OrderStatus } from '../../types';
import { orders as ordersApi } from '../../lib/api';
import { formatPrice, formatDate } from '../../lib/utils';
import { OrderTimeline } from '../../components/OrderTimeline';
import { Badge, Skeleton, Spinner } from '../../components/ui';
import { statusTone } from '../account/orderStatus';
import { useToast } from '../../context/ToastContext';

const STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const { show } = useToast();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    ordersApi.getById(orderId).then(setOrder);
  }, [orderId]);

  const updateStatus = async (status: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, status);
      setOrder(updated);
      show(`Order status updated to ${status}.`, 'success');
    } finally {
      setUpdating(false);
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
          <h1 className="font-display text-3xl">{order.id}</h1>
          <Badge tone={statusTone(order.status)}>{order.status}</Badge>
        </div>
        <p className="text-muted text-sm mt-1">Placed on {formatDate(order.createdAt)}</p>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-4">Update Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={updating}
              onClick={() => updateStatus(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                order.status === s ? 'bg-rose-500 text-white border-rose-500' : 'border-line hover:border-rose-300'
              }`}
            >
              {updating && order.status !== s ? <Spinner size={12} /> : s}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <OrderTimeline status={order.status} />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-4">Customer</h2>
        <p className="text-sm font-medium">{order.customerName}</p>
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
