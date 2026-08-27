import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { addresses as addressApi } from '../../lib/api';
import type { Address } from '../../types';
import { useToast } from '../../context/ToastContext';
import { EmptyState, Skeleton, Spinner } from '../../components/ui';

export default function AccountAddresses() {
  const { user } = useAuth();
  const { show } = useToast();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  useEffect(() => {
    if (!user) return;
    addressApi.list(user.id).then(setAddresses);
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const saved = await addressApi.save(user.id, { ...form, isDefault: (addresses ?? []).length === 0 });
      setAddresses((prev) => [...(prev ?? []), saved]);
      setShowForm(false);
      setForm({ fullName: '', phone: '', line1: '', city: '', state: '', postalCode: '', country: 'India' });
      show('Address saved.', 'success');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!user) return;
    await addressApi.remove(user.id, id);
    setAddresses((prev) => (prev ?? []).filter((a) => a.id !== id));
    show('Address removed.', 'success');
  };

  if (addresses === null) return <Skeleton className="h-32" />;

  return (
    <div className="flex flex-col gap-5">
      {addresses.length === 0 && !showForm ? (
        <div className="card">
          <EmptyState
            icon={<MapPin size={28} />}
            title="No saved addresses"
            description="Add an address to make checkout faster next time."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Add Address
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((a, idx) => (
              <div key={a.id || (a as unknown as Record<string, unknown>)._id?.toString() || `addr-${idx}`} className="card p-5 relative">

                <button
                  onClick={() => remove(a.id)}
                  aria-label="Remove address"
                  className="absolute top-4 right-4 text-muted hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
                {a.isDefault && <span className="text-[0.65rem] font-bold uppercase text-rose-600 tracking-wide">Default</span>}
                <p className="font-semibold text-sm mt-1">{a.fullName}</p>
                <p className="text-sm text-muted mt-1">
                  {a.line1}, {a.city}, {a.state} {a.postalCode}
                </p>
                <p className="text-sm text-muted">{a.phone}</p>
              </div>
            ))}
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-secondary w-fit">
              <Plus size={15} /> Add New Address
            </button>
          )}
        </>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="card p-6 grid sm:grid-cols-2 gap-4">
          <Field label="Full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field className="sm:col-span-2" label="Address" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} />
          <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          <Field label="Postal code" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} />
          <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <div className="sm:col-span-2 flex gap-3 mt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Spinner size={16} />}
              Save Address
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input required className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
