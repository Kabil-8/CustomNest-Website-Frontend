import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { orders as ordersApi } from '../lib/api';
import type { CustomOrderMessage, Order } from '../types';
import { formatPrice, getHandcraftingWindow } from '../lib/utils';
import { Spinner } from '../components/ui';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    if (!orderId) return;
    ordersApi.getById(orderId).then((data) => {
      if (data) {
        setOrder(data.order); // Extract order from the response
      } else {
        setOrder(null);
      }
    });
  }, [orderId]);

  if (order === undefined) {
    return (
      <div className="container-nest py-24 flex justify-center">
        <Spinner size={28} className="text-rose-500" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="container-nest py-24 text-center">
        <h1 className="font-display text-2xl mb-3">We couldn't find that order.</h1>
        <Link to="/shop" className="btn-primary mt-4 inline-flex">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-nest py-16 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={32} />
        </motion.div>
        <h1 className="font-display text-3xl sm:text-4xl mb-3">Order placed successfully</h1>
        <p className="text-muted mb-8">
          Thank you{order.customerName ? `, ${order.customerName.split(' ')[0]}` : ''} — your handmade order is being prepared with care.
        </p>

        <div className="card p-6 sm:p-8 text-left">
          <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Order ID</p>
              <p className="font-display text-lg">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted uppercase tracking-wide">Preparation & Posting</p>
              <p className="font-bold text-sm text-rose-600">7–10 Days</p>
              <p className="text-[0.65rem] text-muted">Estimated dispatch: {getHandcraftingWindow(order.createdAt).rangeText}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3">
                <img 
                  src={item.image || '/images/products/amigurumi-bunny.jpg'} 
                  alt={item.name} 
                  className="w-14 h-14 rounded-lg object-cover bg-ivory" 
                />
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
          <div className="border-t border-line pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link to={`/account/orders/${order.id}`} className="btn-primary">
            Track Order
          </Link>
          <Link to="/shop" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
