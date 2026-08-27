import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui';

export default function AccountProfile() {
  const { user, updateProfile } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      show('Profile updated successfully.', 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8 max-w-lg">
      <h2 className="font-display text-xl mb-6">Profile Details</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Email address</label>
          <input className="input bg-ivory" value={user?.email} disabled />
          <p className="text-xs text-muted mt-1.5">Email address cannot be changed.</p>
        </div>
        <div>
          <label className="label">Phone number</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-fit mt-2">
          {saving && <Spinner size={16} />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
