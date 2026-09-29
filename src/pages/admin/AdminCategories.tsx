import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  FolderTree,
  ExternalLink,
  Package,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react';
import { productApi, type ApiCategory } from '../../lib/productApi';
import { CATEGORIES, COLLECTIONS } from '../../data/categories';
import { compressImage } from '../../lib/imageUtils';
import { useToast } from '../../context/ToastContext';

export default function AdminCategories() {
  const { show } = useToast();

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ApiCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [compressingCover, setCompressingCover] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    collection: '',
    image: '',
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressingCover(true);
    try {
      const compressed = await compressImage(file, 1200, 800, 0.82);
      setFormData((prev) => ({ ...prev, image: compressed }));
      show('Cover photo uploaded & optimized ✓', 'success');
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to process cover photo', 'error');
    } finally {
      setCompressingCover(false);
      e.target.value = '';
    }
  };

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiCats = await productApi.listCategories();

      // Normalize any raw category objects
      const normalizedCats: ApiCategory[] = (apiCats || []).map((c) => {
        let name = c.name;
        let slug = c.slug;
        if (slug === 'kids-toys-jumbo' || /jumbo kids/i.test(name)) {
          name = 'Kids Special';
          slug = 'kids-special';
        }
        if (slug === 'resin-photo-frames' || /^resin\s*photo\s*frames?$/i.test(name)) {
          name = 'Resin Photo Frames';
          slug = 'resin-frames';
        }
        return { ...c, name, slug };
      });

      // Merge with static categories so all 21 official categories are accounted for
      const mergedCats: ApiCategory[] = [...normalizedCats];
      for (const sc of CATEGORIES) {
        if (!mergedCats.some((m) => m.slug.toLowerCase() === sc.slug.toLowerCase())) {
          mergedCats.push({
            _id: sc.slug,
            slug: sc.slug,
            name: sc.name,
            collection: sc.collection || sc.slug,
            image: sc.image || '/images/categories/jumbo-flower-bouquets.jpg',
            productCount: (sc as any).itemCount || 0,
          } as any);
        }
      }
      mergedCats.sort((a, b) => a.name.localeCompare(b.name));

      setCategories(mergedCats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      collection: COLLECTIONS[0]?.slug || 'special-combo-bouquets',
      image: '/images/categories/jumbo-flower-bouquets.jpg',
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (cat: ApiCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      collection: cat.collection || '',
      image: cat.image || '',
    });
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      show('Please enter a category name.', 'error');
      return;
    }

    const safeSlug = (formData.slug.trim() || formData.name.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    setSaving(true);
    try {
      if (editingCategory && editingCategory._id && !editingCategory._id.startsWith('static-') && editingCategory._id.length === 24) {
        // Real MongoDB ID update
        const updated = await productApi.updateCategory(editingCategory._id, {
          name: formData.name.trim(),
          slug: safeSlug,
          collection: formData.collection.trim() || safeSlug,
          image: formData.image.trim() || '/images/categories/jumbo-flower-bouquets.jpg',
        });
        show(`Updated category "${updated.name}" ✓`, 'success');
      } else {
        // Create new or promote static
        const created = await productApi.createCategory({
          name: formData.name.trim(),
          slug: safeSlug,
          collection: formData.collection.trim() || safeSlug,
          image: formData.image.trim() || '/images/categories/jumbo-flower-bouquets.jpg',
        });
        show(`Created category "${created.name}" 🎉`, 'success');
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: ApiCategory) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      if (cat._id && cat._id.length === 24) {
        await productApi.deleteCategory(cat._id);
        show(`Deleted category "${cat.name}" ✓`, 'success');
      } else {
        show(`Category "${cat.name}" removed from view.`, 'success');
      }
      setCategories((prev) => prev.filter((c) => c.slug !== cat.slug && c._id !== cat._id));
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to delete category', 'error');
    }
  };

  // Filter categories
  const filteredCategories = categories.filter((c) => {
    if (selectedCollection !== 'all' && c.collection !== selectedCollection) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.collection || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Extract distinct collection slugs
  const collectionsList = Array.from(new Set(categories.map((c) => c.collection).filter(Boolean)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow mb-1">Catalog Organization</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
            Category Management ({loading ? '…' : categories.length})
          </h1>
          <p className="text-muted text-xs mt-1">
            Create, edit, and organize all product categories across the shop and storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-2"
          >
            <Package size={15} />
            <span>Manage Products</span>
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary flex items-center gap-2 py-3 px-5 text-xs shadow-soft cursor-pointer"
          >
            <Plus size={18} />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Info Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-line shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-wide">
              Active Categories
            </p>
            <p className="font-display text-2xl font-bold text-charcoal mt-0.5">
              {categories.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sand/60 text-charcoal flex items-center justify-center font-bold">
            <FolderTree size={20} className="text-rose-600" />
          </div>
        </div>

        <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-200/80 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold text-rose-700 uppercase tracking-wide">
              Parent Collections
            </p>
            <p className="font-display text-2xl font-bold text-rose-800 mt-0.5">
              {collectionsList.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold text-emerald-700 uppercase tracking-wide">
              Storefront Sync
            </p>
            <p className="font-display text-sm font-bold text-emerald-800 mt-0.5 flex items-center gap-1.5">
              <Sparkles size={16} /> Live in Shop & Filter
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            ✓
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-line shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name, slug, or collection…"
            className="input text-xs pl-10 py-2.5 bg-cream/30"
          />
        </div>

        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-line bg-white text-charcoal outline-none cursor-pointer"
        >
          <option value="all">All Collections ({collectionsList.length})</option>
          {collectionsList.map((col) => (
            <option key={col} value={col}>
              Collection: {col}
            </option>
          ))}
        </select>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted">
          <Loader2 size={24} className="animate-spin text-rose-400" />
          <span className="text-sm">Loading categories…</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
          <AlertTriangle size={18} />
          <div>
            <p className="font-semibold">Failed to load categories</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={loadCategories} className="ml-auto btn-primary py-1.5 px-3 text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Categories Table */}
      {!loading && !error && (
        <div className="bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-cream/40 text-muted uppercase text-[0.65rem] tracking-wider">
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4">Slug (URL identifier)</th>
                  <th className="py-3.5 px-4">Parent Collection</th>
                  <th className="py-3.5 px-4">Active Products</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted">
                      No categories found matching &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.slug} className="hover:bg-rose-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={cat.image || '/images/categories/jumbo-flower-bouquets.jpg'}
                            alt={cat.name}
                            className="w-12 h-12 rounded-xl object-cover border border-line bg-ivory shrink-0 shadow-2xs"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/images/categories/jumbo-flower-bouquets.jpg';
                            }}
                          />
                          <div>
                            <span className="font-bold text-charcoal text-sm block">
                              {cat.name}
                            </span>
                            {cat.slug === 'kids-special' && (
                              <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full mt-0.5">
                                ⭐ Kids Special
                              </span>
                            )}
                            {cat.slug === 'resin-frames' && (
                              <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full mt-0.5">
                                🖼️ Resin Keepsakes
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-muted text-xs">
                        <span className="bg-sand/60 px-2 py-1 rounded-md text-charcoal">
                          {cat.slug}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-1 rounded-full text-[0.68rem] font-semibold">
                          {cat.collection || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-charcoal font-semibold">
                          <Package size={13} className="text-muted" />
                          <span>{(cat as any).productCount ?? 'Available'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/shop?category=${cat.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-line bg-white hover:bg-rose-50 text-muted hover:text-rose-600 transition-colors"
                            title="View in Storefront Shop"
                          >
                            <ExternalLink size={14} />
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 rounded-lg border border-line bg-white hover:bg-rose-50 text-charcoal hover:text-rose-600 transition-colors cursor-pointer"
                            title="Edit Category Name, Slug, or Image"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 rounded-lg border border-line bg-white hover:bg-danger/10 text-danger transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create / Edit Category Modal ────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-line"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-line">
              <div className="flex items-center gap-2">
                <FolderTree size={20} className="text-rose-500" />
                <h2 className="font-display text-xl text-charcoal">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-sand/60 hover:bg-rose-100 flex items-center justify-center text-charcoal transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="label text-xs">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: !editingCategory
                        ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                        : prev.slug,
                    }));
                  }}
                  placeholder="e.g. Kids Special or Resin Photo Frames"
                  className="input"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="label text-xs">
                  Category Slug (URL identifier) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    }))
                  }
                  placeholder="e.g. kids-special"
                  className="input font-mono text-xs"
                />
                <p className="text-[0.65rem] text-muted mt-1">
                  Used for clean shop URLs, e.g. <span className="font-mono">/shop?category={formData.slug || 'category-name'}</span>
                </p>
              </div>

              {/* Parent Collection */}
              <div>
                <label className="label text-xs">Parent Collection</label>
                <select
                  value={formData.collection}
                  onChange={(e) => setFormData((prev) => ({ ...prev, collection: e.target.value }))}
                  className="input cursor-pointer mb-2"
                >
                  <option value="">Select a known collection or type custom below</option>
                  {COLLECTIONS.map((col) => (
                    <option key={col.slug} value={col.slug}>
                      {col.name} ({col.slug})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.collection}
                  onChange={(e) => setFormData((prev) => ({ ...prev, collection: e.target.value }))}
                  placeholder="Or enter custom collection slug"
                  className="input text-xs font-mono"
                />
              </div>

              {/* Cover Image Upload (not path) */}
              <div>
                <label className="label text-xs">Category Cover Photo</label>

                {formData.image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-line bg-ivory shadow-xs group">
                    <img
                      src={formData.image}
                      alt="Category Cover Preview"
                      className="w-full h-44 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          '/images/categories/jumbo-flower-bouquets.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                      <label className="btn-secondary py-2 px-3 text-xs bg-white/95 hover:bg-white text-charcoal flex items-center gap-1.5 cursor-pointer shadow-md">
                        <Upload size={14} />
                        <span>Change Cover</span>
                        <input
                          type="file"
                          accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={handleCoverUpload}
                          disabled={compressingCover}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                        className="py-2 px-3 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                    <div className="p-3 bg-white/95 border-t border-line flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        ✓ Cover photo ready
                      </span>
                      <label className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer text-[0.72rem]">
                        Upload Different Photo
                        <input
                          type="file"
                          accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={handleCoverUpload}
                          disabled={compressingCover}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-line hover:border-rose-400 rounded-2xl p-6 cursor-pointer transition-colors bg-cream/20 hover:bg-rose-50/30 text-center">
                    {compressingCover ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <Loader2 size={24} className="animate-spin text-rose-500" />
                        <span className="text-xs font-semibold text-rose-700">
                          Optimizing & uploading cover photo...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-rose-100/70 text-rose-600 flex items-center justify-center mb-3">
                          <Upload size={22} />
                        </div>
                        <p className="text-xs font-bold text-charcoal">
                          Click or drag to upload category cover photo
                        </p>
                        <p className="text-[0.68rem] text-muted mt-1 max-w-xs">
                          Supports PNG, JPG, WEBP, and HEIC camera photos (automatically compressed)
                        </p>
                        <span className="btn-secondary py-1.5 px-3 text-xs mt-3">
                          Browse File
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={handleCoverUpload}
                      disabled={compressingCover}
                    />
                  </label>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary py-2.5 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2.5 px-6 text-xs flex items-center gap-2 shadow-soft cursor-pointer"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : editingCategory ? (
                    <Edit3 size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>{saving ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
