import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui';

interface Color {
  id: string;
  name: string;
  hexCode: string;
  image: string | null;
  isActive: boolean;
}

export default function AdminColors() {
  const { show } = useToast();
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [form, setForm] = useState({ name: '', hexCode: '#FF0000', isActive: true });

  const fetchColors = async () => {
    try {
      const token = localStorage.getItem('tcn_token');
      const res = await fetch('http://localhost:5000/api/colors', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      setColors(data.colors || []);
    } catch (err) {
      show('Failed to fetch colors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('tcn_token');
      const url = editingColor
        ? `http://localhost:5000/api/colors/${editingColor.id}`
        : 'http://localhost:5000/api/colors';
      const method = editingColor ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      
      if (!res.ok) throw new Error('Failed to save color');
      
      show(editingColor ? 'Color updated!' : 'Color created!', 'success');
      setShowForm(false);
      setEditingColor(null);
      setForm({ name: '', hexCode: '#FF0000', isActive: true });
      fetchColors();
    } catch (err) {
      show('Failed to save color', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this color?')) return;
    try {
      const token = localStorage.getItem('tcn_token');
      await fetch(`http://localhost:5000/api/colors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      show('Color deleted!', 'success');
      fetchColors();
    } catch (err) {
      show('Failed to delete color', 'error');
    }
  };

  const openEdit = (color: Color) => {
    setEditingColor(color);
    setForm({ name: color.name, hexCode: color.hexCode, isActive: color.isActive });
    setShowForm(true);
  };

  if (loading) return <div className="p-8 text-center"><Spinner size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Design Colors</h1>
        <button onClick={() => { setShowForm(true); setEditingColor(null); setForm({ name: '', hexCode: '#FF0000', isActive: true }); }} className="btn-primary">
          + Add Color
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-display text-lg mb-4">{editingColor ? 'Edit Color' : 'Add New Color'}</h2>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="label">Color Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rose Pink"
                required
              />
            </div>
            <div>
              <label className="label">Hex Code</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.hexCode}
                  onChange={(e) => setForm({ ...form, hexCode: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  className="input w-28"
                  value={form.hexCode}
                  onChange={(e) => setForm({ ...form, hexCode: e.target.value })}
                  placeholder="#FF0000"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded text-rose-500"
              />
              Active
            </label>
            <button type="submit" className="btn-primary">{editingColor ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-ivory border-b border-line">
            <tr>
              <th className="text-left p-4 text-sm font-semibold">Preview</th>
              <th className="text-left p-4 text-sm font-semibold">Name</th>
              <th className="text-left p-4 text-sm font-semibold">Hex Code</th>
              <th className="text-left p-4 text-sm font-semibold">Status</th>
              <th className="text-right p-4 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => (
              <tr key={color.id} className="border-b border-line">
                <td className="p-4">
                  <div className="w-8 h-8 rounded-full border border-line" style={{ backgroundColor: color.hexCode }} />
                </td>
                <td className="p-4 font-medium">{color.name}</td>
                <td className="p-4 text-muted font-mono text-sm">{color.hexCode}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${color.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {color.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => openEdit(color)} className="text-rose-600 hover:text-rose-700 mr-3">Edit</button>
                  <button onClick={() => handleDelete(color.id)} className="text-red-500 hover:text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {colors.length === 0 && <div className="p-8 text-center text-muted">No colors yet. Add your first color!</div>}
      </div>
    </div>
  );
}