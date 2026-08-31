import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, X, Image as ImageIcon, Upload, Star, Loader2, AlertTriangle, Palette, Ruler, PlusCircle, Home as HomeIcon, Award } from 'lucide-react';
import { productApi, normalizeProduct, listActiveColors, type ApiCategory, type ApiColor } from '../../lib/productApi';
import type { Product } from '../../types';
import { useToast } from '../../context/ToastContext';

export default function AdminProducts() {
  const { show } = useToast();

  // ── Data state ────────────────────────────────────────────────────────────
  const [productList, setProductList]   = useState<Product[]>([]);
  const [categories, setCategories]     = useState<ApiCategory[]>([]);
  const [allColors, setAllColors]       = useState<ApiColor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // ── Filter / UI state ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterView, setFilterView]           = useState<'all' | 'top10' | 'home'>('all');
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
    featuredRank: 0,
    showOnHome: false,
    customizable: true,
    yarnType: 'both',
    normalPrice: 499,
    acrylicPrice: 599,
    // Per-product colours (IDs of selected Color docs)
    selectedColorIds: [] as string[],
    // Per-product sizes
    sizes: [] as { label: string; priceModifier: number }[],
  };
  const [formData, setFormData] = useState(blankForm);

  // ── Load products + categories + colors from API ───────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodResult, cats, colors] = await Promise.all([
        productApi.list({ limit: 48, sort: 'featured' }),
        productApi.listCategories(),
        listActiveColors(),
      ]);
      setProductList(prodResult.items.map(normalizeProduct));
      setCategories(cats);
      setAllColors(colors);
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
      featuredRank:   p.featuredRank ?? 0,
      showOnHome:     p.showOnHome ?? false,
      customizable:   !!p.customization,
      yarnType:       (p as any).yarnType || 'both',
      normalPrice:    (p as any).normalPrice ?? 499,
      acrylicPrice:   (p as any).acrylicPrice ?? 599,
      selectedColorIds: (p.availableColors ?? []).map(c => c.id),
      sizes:          p.sizes ?? [],
    });
    setIsModalOpen(true);
  };

  // ── Quick toggles ─────────────────────────────────────────────────────────
  const handleQuickToggleHome = async (p: Product) => {
    const nextVal = !p.showOnHome;
    try {
      const updated = await productApi.update(p.id, { showOnHome: nextVal });
      const norm = normalizeProduct(updated);
      setProductList(prev => prev.map(item => item.id === norm.id ? norm : item));
      show(nextVal ? `"${p.name}" will now appear on Home Page 🏠` : `Removed "${p.name}" from Home Page`, 'success');
    } catch {
      show('Failed to update home page status', 'error');
    }
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

  // ── Color picker helpers ──────────────────────────────────────────────────
  const toggleColor = (colorId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedColorIds: prev.selectedColorIds.includes(colorId)
        ? prev.selectedColorIds.filter(id => id !== colorId)
        : [...prev.selectedColorIds, colorId],
    }));
  };

  // ── Sizes helpers ─────────────────────────────────────────────────────────
  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { label: '', priceModifier: 0 }],
    }));
  };

  const updateSize = (i: number, field: 'label' | 'priceModifier', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((s, idx) => idx === i ? { ...s, [field]: value } : s),
    }));
  };

  const removeSize = (i: number) => {
    setFormData(prev => ({ ...prev, sizes: prev.sizes.filter((_, idx) => idx !== i) }));
  };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { show('Please enter a product name.', 'error'); return; }
    if (formData.images.length === 0) { show('Please upload at least one image.', 'error'); return; }

    // Validate sizes
    for (const sz of formData.sizes) {
      if (!sz.label.trim()) { show('All size options must have a label.', 'error'); return; }
    }

    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload: Record<string, unknown> = {
      name:         formData.name,
      category:     formData.category,
      price:        Number(formData.price),
      compareAtPrice: Number(formData.compareAtPrice) || null,
      stock:        Number(formData.stock),
      description:  formData.description,
      images:       formData.images,
      featured:     formData.featured,
      featuredRank: Number(formData.featuredRank) || 0,
      showOnHome:   Boolean(formData.showOnHome),
      customizable: formData.customizable,
      yarnType:     formData.yarnType,
      normalPrice:  formData.yarnType === 'acrylic' ? null : Number(formData.normalPrice),
      acrylicPrice: formData.yarnType === 'normal' ? null : Number(formData.acrylicPrice),
      availableColors: formData.selectedColorIds,
      sizes:        formData.sizes,
    };

    setSaving(true);
    try {
      if (editingProduct) {
        const updated = await productApi.update(editingProduct.id, payload);
        const norm = normalizeProduct(updated);
        setProductList(prev => prev.map(p => p.id === norm.id ? norm : p));
        show(`Updated "${norm.name}" ✓`, 'success');
      } else {
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

  // ── Client-side filter for search box & views ────────────────────────────
  const filteredProducts = productList.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (filterView === 'top10' && (!p.featuredRank || p.featuredRank === 0 || p.featuredRank > 10)) return false;
    if (filterView === 'home' && !p.showOnHome) return false;
    if (searchQuery.trim() &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const top10Count = productList.filter(p => p.featuredRank && p.featuredRank > 0 && p.featuredRank <= 10).length;
  const homeCount = productList.filter(p => p.showOnHome).length;

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

      {/* Allocation Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-line shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-wide">Total Products</p>
            <p className="font-display text-2xl font-bold text-charcoal mt-0.5">{productList.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sand/60 text-charcoal flex items-center justify-center font-bold">
            📦
          </div>
        </div>

        <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold text-amber-700 uppercase tracking-wide">Top 10 Allocated</p>
            <p className="font-display text-2xl font-bold text-amber-800 mt-0.5">{top10Count} / 10</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Award size={20} />
          </div>
        </div>

        <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-200/80 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold text-rose-700 uppercase tracking-wide">Home Page Active</p>
            <p className="font-display text-2xl font-bold text-rose-800 mt-0.5">{homeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <HomeIcon size={20} />
          </div>
        </div>
      </div>

      {/* Search, Filter & View Controls */}
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

        <div className="flex flex-wrap items-center gap-2">
          {/* View Filter Pills */}
          <div className="flex items-center bg-cream/60 p-1 rounded-xl border border-line">
            <button
              onClick={() => setFilterView('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterView === 'all' ? 'bg-white shadow-sm text-charcoal' : 'text-muted hover:text-charcoal'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterView('top10')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterView === 'top10' ? 'bg-amber-500 text-white shadow-sm' : 'text-muted hover:text-amber-600'
              }`}
            >
              <Award size={13} />
              <span>Top 10</span>
            </button>
            <button
              onClick={() => setFilterView('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterView === 'home' ? 'bg-rose-500 text-white shadow-sm' : 'text-muted hover:text-rose-600'
              }`}
            >
              <HomeIcon size={13} />
              <span>Home Page</span>
            </button>
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
                  <th className="py-3.5 px-4">Top 10 Rank</th>
                  <th className="py-3.5 px-4">Home Page</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted text-sm">
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
                          className="w-12 h-12 rounded-xl object-cover border border-line bg-ivory shrink-0"
                        />
                        <div>
                          <span className="font-bold text-charcoal block">{p.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[0.65rem] text-muted font-mono">{p.id.slice(-8)}</span>
                            {p.availableColors && p.availableColors.length > 0 && (
                              <div className="flex -space-x-0.5">
                                {p.availableColors.slice(0, 5).map(c => (
                                  <span
                                    key={c.id}
                                    title={c.name}
                                    className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                                    style={{ backgroundColor: c.hexCode }}
                                  />
                                ))}
                                {p.availableColors.length > 5 && (
                                  <span className="text-[0.58rem] text-muted ml-1">+{p.availableColors.length - 5}</span>
                                )}
                              </div>
                            )}
                            {p.sizes && p.sizes.length > 0 && (
                              <span className="text-[0.58rem] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full font-semibold">
                                {p.sizes.map(s => s.label).join(' / ')}
                              </span>
                            )}
                          </div>
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

                    {/* Top 10 Rank Column */}
                    <td className="py-3 px-4">
                      {p.featuredRank && p.featuredRank > 0 && p.featuredRank <= 10 ? (
                        <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 shadow-xs">
                          <Award size={12} className="text-amber-500" />
                          <span>Top #{p.featuredRank}</span>
                        </span>
                      ) : (
                        <span className="text-muted/60 text-[0.65rem] italic">Unranked</span>
                      )}
                    </td>

                    {/* Home Page Column */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleQuickToggleHome(p)}
                        title={p.showOnHome ? 'Click to remove from Home Page' : 'Click to display on Home Page'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-bold border transition-all cursor-pointer ${
                          p.showOnHome
                            ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs hover:bg-rose-100'
                            : 'bg-cream/40 text-muted border-line hover:border-rose-300'
                        }`}
                      >
                        <HomeIcon size={11} className={p.showOnHome ? 'text-rose-500' : 'text-muted'} />
                        <span>{p.showOnHome ? 'On Home' : 'Hidden'}</span>
                      </button>
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
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-charcoal cursor-pointer">
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

              {/* Category, Stock, Yarn Type */}
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
                <div>
                  <label className="label text-xs" htmlFor="p-yarn">Yarn Type *</label>
                  <select
                    id="p-yarn"
                    value={formData.yarnType}
                    onChange={e => setFormData({ ...formData, yarnType: e.target.value })}
                    className="input cursor-pointer"
                  >
                    <option value="both">Both (Normal & Acrylic)</option>
                    <option value="normal">Normal Yarn Only</option>
                    <option value="acrylic">Acrylic Yarn Only</option>
                  </select>
                </div>
              </div>

              {/* Yarn Prices */}
              {formData.yarnType !== 'normal' && (
                <div>
                  <label className="label text-xs" htmlFor="p-acrylic">Acrylic Yarn Price (₹) *</label>
                  <input
                    id="p-acrylic"
                    type="number"
                    required
                    value={formData.acrylicPrice}
                    onChange={e => setFormData({ ...formData, acrylicPrice: Number(e.target.value) })}
                    className="input"
                    placeholder="Price for acrylic yarn version"
                  />
                </div>
              )}
              {formData.yarnType !== 'acrylic' && (
                <div>
                  <label className="label text-xs" htmlFor="p-normal">Normal Yarn Price (₹) *</label>
                  <input
                    id="p-normal"
                    type="number"
                    required
                    value={formData.normalPrice}
                    onChange={e => setFormData({ ...formData, normalPrice: Number(e.target.value) })}
                    className="input"
                    placeholder="Price for normal yarn version"
                  />
                </div>
              )}

              {/* Fallback single price */}
              {(formData.yarnType === 'normal' || formData.yarnType === 'acrylic') && (
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
              )}

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

              {/* ── Top 10 Ranking & Home Page Allocation Section ──────────── */}
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-4">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs uppercase tracking-wider">
                  <Award size={16} className="text-amber-600" />
                  <span>Top 10 Allocation & Home Page Placement</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Top 10 Rank Priority */}
                  <div>
                    <label className="label text-xs" htmlFor="p-rank">
                      Top 10 Priority Rank
                    </label>
                    <select
                      id="p-rank"
                      value={formData.featuredRank}
                      onChange={e => setFormData({ ...formData, featuredRank: Number(e.target.value) })}
                      className="input cursor-pointer bg-white"
                    >
                      <option value="0">Unranked (Standard catalog position)</option>
                      <option value="1">🏆 Rank #1 (Top Product - Appears First)</option>
                      <option value="2">⭐ Rank #2 (2nd Top Product)</option>
                      <option value="3">⭐ Rank #3 (3rd Top Product)</option>
                      <option value="4">⭐ Rank #4</option>
                      <option value="5">⭐ Rank #5</option>
                      <option value="6">⭐ Rank #6</option>
                      <option value="7">⭐ Rank #7</option>
                      <option value="8">⭐ Rank #8</option>
                      <option value="9">⭐ Rank #9</option>
                      <option value="10">⭐ Rank #10</option>
                    </select>
                    <p className="text-[0.65rem] text-amber-700/80 mt-1">
                      Ranked 1 to 10 products will always appear first in the shop and collection.
                    </p>
                  </div>

                  {/* Show on Home Page */}
                  <div className="flex flex-col justify-center gap-2 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-charcoal cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showOnHome}
                        onChange={e => setFormData({ ...formData, showOnHome: e.target.checked })}
                        className="w-4 h-4 rounded border-line text-rose-500 focus:ring-rose-200"
                      />
                      <span>Show on Home Page Showcase</span>
                    </label>
                    <p className="text-[0.65rem] text-muted leading-relaxed">
                      Enable this to display this product directly on the main website homepage.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Color Palette Picker ──────────────────────────────────── */}
              <div className="p-5 rounded-2xl bg-cream/40 border border-line space-y-3">
                <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs uppercase tracking-wider">
                  <Palette size={15} />
                  <span>Available Colors for This Product</span>
                  <span className="ml-auto text-muted normal-case font-normal">
                    {formData.selectedColorIds.length} selected
                  </span>
                </div>
                {allColors.length === 0 ? (
                  <p className="text-xs text-muted py-2">
                    No colors in palette yet. Go to Admin → Colors to add some first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allColors.map(c => {
                      const selected = formData.selectedColorIds.includes(c._id);
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => toggleColor(c._id)}
                          title={c.name}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            selected
                              ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                              : 'border-line bg-white text-charcoal hover:border-rose-300'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0"
                            style={{ backgroundColor: c.hexCode }}
                          />
                          {c.name}
                          {selected && <X size={11} className="ml-0.5 text-rose-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[0.68rem] text-muted">
                  Only selected colors will appear on the product page for customers to choose from.
                </p>
              </div>

              {/* ── Size Options ──────────────────────────────────────────── */}
              <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3">
                <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
                  <Ruler size={15} />
                  <span>Size Options</span>
                  <span className="ml-auto text-muted normal-case font-normal text-[0.65rem]">
                    optional — e.g. Small / Medium / Large
                  </span>
                </div>

                {formData.sizes.length === 0 ? (
                  <p className="text-xs text-muted">No sizes configured. Click "+ Add Size" to let customers choose a size.</p>
                ) : (
                  <div className="space-y-2">
                    {formData.sizes.map((sz, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={sz.label}
                          onChange={e => updateSize(i, 'label', e.target.value)}
                          placeholder="Size label e.g. Small"
                          className="input text-xs py-2 flex-1 bg-white"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted font-semibold">₹+</span>
                          <input
                            type="number"
                            min="0"
                            value={sz.priceModifier}
                            onChange={e => updateSize(i, 'priceModifier', Number(e.target.value))}
                            className="input text-xs py-2 pl-9 w-28 bg-white"
                            placeholder="0"
                            title="Price added on top of base price"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSize(i)}
                          className="p-1.5 rounded-lg border border-line hover:bg-rose-50 hover:text-rose-600 text-muted transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addSize}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-1 cursor-pointer"
                >
                  <PlusCircle size={14} />
                  Add Size
                </button>
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
                            className="w-8 h-8 rounded-full bg-white text-rose-600 flex items-center justify-center shadow cursor-pointer"
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
                  className="btn-secondary py-3 text-xs cursor-pointer"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-3 px-6 text-xs flex items-center gap-2 cursor-pointer" disabled={saving}>
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
