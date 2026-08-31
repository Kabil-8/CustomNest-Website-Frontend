import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orders as ordersApi } from '../../lib/api';
import type { CustomOrderMessage, Order } from '../../types';
import { formatPrice, formatDate, estimateDelivery, getHandcraftingWindow } from '../../lib/utils';
import { OrderTimeline } from '../../components/OrderTimeline';
import { EmptyState, Skeleton, Badge } from '../../components/ui';
import { statusTone } from './orderStatus';

export default function AccountOrderDetail() {
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState<{ order: Order; customOrderMessages?: CustomOrderMessage[] } | null | undefined>(undefined);

  useEffect(() => {
    if (!orderId) return;
    ordersApi.getById(orderId).then((data) => {
      if (data) {
        setOrderData(data); // data now contains { order, customOrderMessages }
      } else {
        setOrderData(null);
      }
    });
  }, [orderId]);

  if (orderData === undefined) return <Skeleton className="h-64" />;

  if (orderData === null) {
    return (
      <div className="card">
        <EmptyState
          title="Order not found"
          description="We couldn't find that order."
          action={
            <Link to="/account/orders" className="btn-primary">
              Back to Orders
            </Link>
          }
        />
      </div>
    );
  }

  const { order, customOrderMessages } = orderData;

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="font-display text-xl">{order.id}</p>
            <p className="text-xs text-muted mt-0.5">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <Badge tone={statusTone(order.status)}>{order.status}</Badge>
        </div>
        <OrderTimeline status={order.status} />
        
        {/* Fulfillment Status Information */}
        {order.status === 'Shipped' ? (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-center mt-5 space-y-1">
            <p className="text-sm font-bold text-emerald-800">🚚 Shipped & On Its Way!</p>
            <p className="text-xs text-emerald-700">
              Expected Delivery Date:{' '}
              <span className="font-bold">
                {order.estimatedDeliveryDate || estimateDelivery(order.shippedAt || order.createdAt, 3)}
              </span>
            </p>
            {order.courierPartner && (
              <p className="text-xs text-muted">
                Courier: <span className="font-semibold text-charcoal">{order.courierPartner}</span>
                {order.trackingNumber ? ` · Tracking Number: ${order.trackingNumber}` : ''}
              </p>
            )}
          </div>
        ) : order.status !== 'Delivered' && order.status !== 'Cancelled' ? (
          <div className="bg-rose-50/60 border border-rose-200/70 rounded-2xl p-4 text-center mt-5 space-y-1">
            <p className="text-sm font-bold text-rose-800">🧶 Handcrafting & Preparation (7–10 days)</p>
            <p className="text-xs text-charcoal">
              Estimated dispatch window:{' '}
              <span className="font-bold text-rose-700">{getHandcraftingWindow(order.createdAt).rangeText}</span>
            </p>
            <p className="text-[0.7rem] text-muted">
              Every item is handcrafted with care. The exact delivery date will be updated and notified as soon as your order is posted.
            </p>
          </div>
        ) : null}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-4">Items</h2>
        <div className="flex flex-col gap-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-4">
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-ivory" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted">Qty {item.quantity}</p>
                  {item.customization && (
                    <p className="text-xs text-rose-600 font-medium mt-0.5">
                      {[item.customization.yarnType, item.customization.color, item.customization.size].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-line mt-5 pt-4 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-1.5 border-t border-line mt-1.5">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
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

      {/* Custom Order Messages */}
      {customOrderMessages && customOrderMessages.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display text-lg mb-4 flex items-center gap-2">
            <span className="text-rose-600">✨</span>
            Custom Order Conversation
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {customOrderMessages.map((msg) => (
              <div
                key={msg._id}
                className={`p-3 rounded-2xl ${
                  msg.sender === 'admin'
                    ? 'bg-rose-50 border-l-4 border-rose-600 ml-4'
                    : 'bg-blue-50 border-l-4 border-blue-600 mr-4'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${
                    msg.sender === 'admin' ? 'text-rose-600' : 'text-blue-600'
                  }`}>
                    {msg.sender === 'admin' ? 'TheCustomNest Team' : 'You'}
                  </span>
                  <span className="text-xs text-muted">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-charcoal">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
