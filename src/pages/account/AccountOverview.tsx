import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { orders as ordersApi, addresses as addressApi } from '../../lib/api';
import type { Order, Address } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';
import { Badge, Skeleton } from '../../components/ui';
import { statusTone } from './orderStatus';

export default function AccountOverview() {
  const { user } = useAuth();
  const { ids } = useWishlist();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);

  useEffect(() => {
    if (!user) return;
    ordersApi.listForUser(user.id).then(setOrders);
    addressApi.list(user.id).then(setAddresses);
  }, [user]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid sm:grid-cols-3 gap-5">
        <StatBox icon={Package} label="Total Orders" value={orders?.length ?? '—'} to="/account/orders" />
        <StatBox icon={Heart} label="Wishlist Items" value={ids.length} to="/account/wishlist" />
        <StatBox icon={MapPin} label="Saved Addresses" value={addresses?.length ?? '—'} to="/account/addresses" />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl">Recent Orders</h2>
          <Link to="/account/orders" className="btn-tertiary text-sm">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {orders === null ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted">You haven't placed any orders yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                to={`/account/orders/${o.id}`}
                className="flex items-center justify-between gap-4 border border-line rounded-xl px-4 py-3 hover:border-rose-300 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">{o.id}</p>
                  <p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.items.length} item(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatPrice(o.total)}</span>
                  <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, to }: { icon: React.ElementType; label: string; value: number | string; to: string }) {
  return (
    <Link to={to} className="card p-5 flex items-center gap-4 hover:border-rose-300 transition-colors">
      <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-display">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </Link>
  );
}
