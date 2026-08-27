import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orders as ordersApi } from '../../lib/api';
import type { Order } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import { Badge, EmptyState, Skeleton } from '../../components/ui';
import { statusTone } from './orderStatus';

export default function AccountOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) return;
    ordersApi.listForUser(user.id).then(setOrders);
  }, [user]);

  if (orders === null) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card">
        <EmptyState
          title="No orders yet"
          description="Once you place an order, you'll be able to track it here."
          action={
            <Link to="/shop" className="btn-primary">
              Start Shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((o) => (
        <Link key={o.id} to={`/account/orders/${o.id}`} className="card p-5 flex items-center justify-between gap-4 hover:border-rose-300 transition-colors">
          <div className="flex items-center gap-4">
            <img src={o.items[0]?.image} alt="" className="w-14 h-14 rounded-lg object-cover bg-ivory hidden sm:block" />
            <div>
              <p className="font-semibold text-sm">{o.id}</p>
              <p className="text-xs text-muted mt-0.5">{formatDate(o.createdAt)} · {o.items.length} item(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-sm hidden sm:inline">{formatPrice(o.total)}</span>
            <Badge tone={statusTone(o.status)}>{o.status}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
