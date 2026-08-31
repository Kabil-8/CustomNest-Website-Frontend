import React, { useEffect, useState } from 'react';
import { Loader2, Star, Trash2, Eye, EyeOff, Search, MessageSquare } from 'lucide-react';
import { reviews as reviewsApi, type ApiReview } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { show } = useToast();
  const [allReviews, setAllReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    reviewsApi.listAll()
      .then(setAllReviews)
      .catch(() => show('Failed to load reviews', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleApprove = async (r: ApiReview) => {
    setProcessingId(r._id);
    try {
      const updated = await reviewsApi.setApproved(r._id, !r.approved);
      setAllReviews((prev) => prev.map((x) => (x._id === r._id ? updated : x)));
      show(updated.approved ? 'Review published ✓' : 'Review hidden', 'success');
    } catch {
      show('Failed to update review', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (r: ApiReview) => {
    const productName = typeof r.product === 'object' ? r.product.name : 'product';
    if (!window.confirm(`Delete this review for "${productName}"? This cannot be undone.`)) return;
    setProcessingId(r._id);
    try {
      await reviewsApi.remove(r._id);
      setAllReviews((prev) => prev.filter((x) => x._id !== r._id));
      show('Review deleted.', 'info');
    } catch {
      show('Failed to delete review', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = allReviews.filter((r) => {
    if (filter === 'approved' && !r.approved) return false;
    if (filter === 'hidden' && r.approved) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const productName = typeof r.product === 'object' ? r.product.name.toLowerCase() : '';
      const userName = typeof r.user === 'object' ? r.user.name.toLowerCase() : '';
      const comment = r.comment.toLowerCase();
      if (!productName.includes(q) && !userName.includes(q) && !comment.includes(q)) return false;
    }
    return true;
  });

  const approvedCount = allReviews.filter(r => r.approved).length;
  const hiddenCount   = allReviews.filter(r => !r.approved).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="eyebrow mb-1">Content Moderation</span>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
          Customer Reviews ({loading ? '…' : allReviews.length})
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Reviews',    value: allReviews.length,  color: 'text-charcoal',    bg: 'bg-white' },
          { label: 'Published',        value: approvedCount,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Hidden / Pending', value: hiddenCount,         color: 'text-rose-600',    bg: 'bg-rose-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl border border-line p-4 shadow-soft`}>
            <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-wide">{stat.label}</p>
            <p className={`font-display text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-line shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, customer, or comment…"
            className="input text-xs pl-10 py-2.5 bg-cream/30"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'approved', 'hidden'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                filter === f
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : 'border-line bg-white text-charcoal hover:border-rose-300'
              }`}
            >
              {f === 'all' ? 'All' : f === 'approved' ? 'Published' : 'Hidden'}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted">
          <Loader2 size={22} className="animate-spin text-rose-400" />
          <span className="text-sm">Loading reviews…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-line p-12 text-center shadow-soft">
          <MessageSquare size={36} className="text-muted mx-auto mb-4" />
          <h3 className="font-display text-xl text-charcoal mb-2">No reviews found</h3>
          <p className="text-muted text-sm">No reviews match your current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
          <div className="divide-y divide-line/60">
            {filtered.map((r) => {
              const productName = typeof r.product === 'object' ? r.product.name : 'Unknown Product';
              const productImg  = typeof r.product === 'object' && r.product.images?.[0]
                ? r.product.images[0]
                : null;
              const productSlug = typeof r.product === 'object' ? r.product.slug : null;
              const userName    = typeof r.user === 'object' ? r.user.name : 'Customer';
              const userEmail   = typeof r.user === 'object' ? r.user.email : null;
              const busy = processingId === r._id;

              return (
                <div key={r._id} className="flex gap-4 p-4 sm:p-5 hover:bg-rose-50/30 transition-colors">
                  {/* Product thumbnail */}
                  <div className="shrink-0">
                    {productImg ? (
                      <img
                        src={productImg}
                        alt={productName}
                        className="w-14 h-14 rounded-xl object-cover border border-line bg-ivory"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-cream border border-line flex items-center justify-center text-muted">
                        <Star size={18} />
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-charcoal truncate max-w-xs">{productName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarDisplay rating={r.rating} />
                          <span className="text-[0.65rem] text-muted">
                            by <span className="font-semibold text-charcoal">{userName}</span>
                            {userEmail && <span className="text-muted"> &middot; {userEmail}</span>}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {r.approved ? (
                          <span className="px-2.5 py-1 rounded-full text-[0.65rem] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Published
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[0.65rem] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-charcoal/80 leading-relaxed line-clamp-3">
                      "{r.comment}"
                    </p>

                    <p className="text-[0.62rem] text-muted/60">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleApprove(r)}
                      disabled={busy}
                      title={r.approved ? 'Hide this review' : 'Publish this review'}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                        r.approved
                          ? 'border-line text-muted hover:bg-rose-50 hover:text-rose-500 hover:border-rose-300'
                          : 'border-emerald-200 text-emerald-500 bg-emerald-50 hover:bg-emerald-100'
                      } ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {busy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : r.approved ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      disabled={busy}
                      title="Delete review permanently"
                      className={`w-8 h-8 rounded-lg border border-line text-muted hover:bg-danger/10 hover:text-danger hover:border-danger/30 flex items-center justify-center transition-all ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
