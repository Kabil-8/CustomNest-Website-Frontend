import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, X, Image as ImageIcon, Upload, Star, Loader2, AlertTriangle } from 'lucide-react';
import { productApi, normalizeProduct, type ApiCategory } from '../../lib/productApi';
import type { Product } from '../../types';
import { useToast } from '../../context/ToastContext';

export default function AdminProducts() {
  const { show } = useToast();

  // ── Data state ────────────────────────────────────────────────────────────
  const [productList, setProductList]   = useState<Product[]>([]);
  const [categories, setCategories]     = useState<ApiCategory[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // ── Filter / UI state ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [editingProduct, setEditingProduct]   = useState<Product | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const blankForm = {
    name: '',
    category: '',
    price: 499,
    compareAtPrice: 0,
    stock: 15,
    description: 'Handcrafted crochet product created with premium milk cotton yarn.',
    images: [] as string[],
    featured: false,
    customizable: true,
  };
  const [formData, setFormData] = useState(blankForm);

  // ── Load products + categories from API ───────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodResult, cats] = await Promise.all([
        productApi.list({ limit: 48, sort: 'newest' }),
        productApi.listCategories(),
      ]);
      setProductList(prodResult.items.map(normalizeProduct));
      setCategories(cats);
      // Set default category for form
      if (cats.length > 0) {
        setFormData(prev => ({ ...prev, category: cats[0].slug }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({ ...blankForm, category: categories[0]?.slug ?? '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name:           p.name,
      category:       p.category,
      price:          p.price,
      compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? 0,
      stock:          p.stock,
      description:    p.description,
      images:         p.images?.length ? p.images : [p.image],
      featured:       p.isFeatured || p.featured || false,
      customizable:   !!p.customization,
    });
    setIsModalOpen(true);
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - formData.images.length;
    if (remaining <= 0) { show('Maximum 3 images allowed.', 'error'); return; }
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, reader.result as string].slice(0, 3),
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    show(`${Math.min(files.length, remaining)} image(s) added 📸`, 'success');
    e.target.value = '';
  };

  const handleRemoveImage = (i: number) =>
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { show('Please enter a product name.', 'error'); return; }
    if (formData.images.length === 0) { show('Please upload at least one image.', 'error'); return; }

    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload: Record<string, unknown> = {
      name:         formData.name,
      category:     formData.category,   // slug; backend maps to ObjectId
      price:        Number(formData.price),
      compareAtPrice: Number(formData.compareAtPrice) || null,
      stock:        Number(formData.stock),
      description:  formData.description,
      images:       formData.images,
      featured:     formData.featured,
      customizable: formData.customizable,
    };

    setSaving(true);
    try {
      if (editingProduct) {
        // PATCH /api/products/:id
        const updated = await productApi.update(editingProduct.id, payload);
        const norm = normalizeProduct(updated);
        setProductList(prev => prev.map(p => p.id === norm.id ? norm : p));
        show(`Updated "${norm.name}" ✓`, 'success');
      } else {
        // POST /api/products
        const created = await productApi.create({ ...payload, slug });
        const norm = normalizeProduct(created);
        setProductList(prev => [norm, ...prev]);
        show(`Created "${norm.name}" 🎉`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await productApi.remove(id);
      setProductList(prev => prev.filter(p => p.id !== id));
      show(`Deleted "${name}" from catalog.`, 'info');
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  // ── Client-side filter for search box ────────────────────────────────────
  const filteredProducts = productList.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim() &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow mb-1">CMS Management</span>
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
            Product Catalog ({loading ? '…' : productList.length})
          </h1>
        </div>
        <button onClick={handleOpenCreateModal} className="btn-primary flex items-center gap-2 py-3 px-5">
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-line shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products by name or category…"
            className="input text-xs pl-10 py-2.5 bg-cream/30"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-line bg-white text-charcoal outline-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c._id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted">
          <Loader2 size={24} className="animate-spin text-rose-400" />
          <span className="text-sm">Loading products from database…</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
          <AlertTriangle size={18} />
          <div>
            <p className="font-semibold">Failed to load products</p>
            <p className="text-xs mt-0.5">{error} — Make sure the backend is running on port 5000.</p>
          </div>
          <button onClick={loadData} className="ml-auto btn-primary py-1.5 px-3 text-xs">Retry</button>
        </div>
      )}

      {/* Product Table */}
      {!loading && !error && (
        <div className="bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-cream/40 text-muted uppercase text-[0.65rem] tracking-wider">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Featured</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted text-sm">
                      No products found
                    </td>
                  </tr>
                ) : filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-line bg-ivory"
                        />
                        <div>
                          <span className="font-bold text-charcoal block">{p.name}</span>
                          <span className="text-[0.65rem] text-muted block font-mono">{p.id.slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted">{p.categoryLabel}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">₹{p.price}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${
                        p.stock > 5
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {p.stock > 0 ? `${p.stock} units` : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(p.isFeatured || p.featured) ? (
                        <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Star size={10} className="fill-amber-400" /> Featured
                        </span>
                      ) : (
                        <span className="text-muted text-[0.65rem]">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg border border-line bg-white hover:bg-rose-50 text-charcoal hover:text-rose-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 rounded-lg border border-line bg-white hover:bg-danger/10 text-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[95] bg-charcoal/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lift border border-line max-h-[92vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
              <h2 className="font-display text-xl text-charcoal">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-charcoal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5" noValidate>
              {/* Name */}
              <div>
                <label className="label text-xs" htmlFor="p-name">Product Name *</label>
                <input
                  id="p-name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Crocheted Sunflower Bouquet"
                  className="input"
                />
              </div>

              {/* Category, Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label text-xs" htmlFor="p-cat">Category *</label>
                  <select
                    id="p-cat"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="input cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs" htmlFor="p-price">Price (₹) *</label>
                  <input
                    id="p-price"
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label text-xs" htmlFor="p-stock">Stock *</label>
                  <input
                    id="p-stock"
                    type="number"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              {/* Compare-at price */}
              <div>
                <label className="label text-xs" htmlFor="p-orig">Compare-at Price (₹) — optional</label>
                <input
                  id="p-orig"
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={e => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })}
                  placeholder="Leave 0 to hide strikethrough"
                  className="input"
                />
              </div>

              {/* Image Manager */}
              <div className="p-5 rounded-2xl bg-cream/40 border border-line space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs uppercase tracking-wider">
                    <ImageIcon size={16} />
                    <span>Product Images ({formData.images.length}/3)</span>
                  </div>
                  {formData.images.length < 3 && (
                    <label className="btn-primary py-1.5 px-4 text-[0.7rem] cursor-pointer flex items-center gap-1.5">
                      <Upload size={13} />
                      <span>Upload Photo{formData.images.length > 0 ? ' (add more)' : ''}</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageFilesUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {formData.images.length === 0 ? (
                  <label className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-rose-200 rounded-2xl cursor-pointer hover:bg-rose-50/60 transition-colors">
                    <Upload size={28} className="text-rose-300" />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-charcoal">Click to upload product photos</p>
                      <p className="text-[0.68rem] text-muted mt-0.5">Up to 3 images — JPG, PNG accepted</p>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handleImageFilesUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {formData.images.map((src, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-line bg-white shadow-soft">
                        <img src={src} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center shadow"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 bg-charcoal/70 text-cream text-[0.58rem] px-1.5 py-0.5 rounded-full font-bold">
                          {i === 0 ? 'Main' : `Slide ${i + 1}`}
                        </span>
                      </div>
                    ))}
                    {formData.images.length < 3 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-rose-50 transition-colors">
                        <Upload size={18} className="text-rose-300" />
                        <span className="text-[0.65rem] text-muted font-semibold">Add Photo</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageFilesUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                )}

                {formData.images.length > 1 && (
                  <p className="text-[0.68rem] text-rose-600 font-medium">
                    ✓ This product will auto-slide through {formData.images.length} images on the shop page.
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="label text-xs" htmlFor="p-desc">Product Description</label>
                <textarea
                  id="p-desc"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input text-xs py-2"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded border-line text-rose-500 focus:ring-rose-200"
                  />
                  Featured Product
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.customizable}
                    onChange={e => setFormData({ ...formData, customizable: e.target.checked })}
                    className="rounded border-line text-rose-500 focus:ring-rose-200"
                  />
                  Allow Customization
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary py-3 text-xs"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-3 px-6 text-xs flex items-center gap-2" disabled={saving}>
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
