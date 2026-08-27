import React, { useEffect, useState } from 'react';
import { auth as authApi, orders as ordersApi } from '../../lib/api';
import type { User, Order } from '../../types';
import { formatDate } from '../../lib/utils';
import { Skeleton } from '../../components/ui';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<User[] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    authApi.listCustomers().then(setCustomers);
    ordersApi.listAll().then(setOrders);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Customers</h1>
        <p className="text-muted text-sm mt-1">{customers?.length ?? 0} registered customers</p>
      </div>

      {customers === null ? (
        <Skeleton className="h-64" />
      ) : customers.length === 0 ? (
        <div className="card p-10 text-center text-muted">No customers have registered yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-line">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-muted">{c.email}</td>
                  <td className="py-3 px-4 text-muted">{c.phone ?? '—'}</td>
                  <td className="py-3 px-4">{orders.filter((o) => o.userId === c.id).length}</td>
                  <td className="py-3 px-4 text-muted">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
