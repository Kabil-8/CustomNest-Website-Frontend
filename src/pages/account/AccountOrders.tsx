import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { orders as ordersApi, reviews as reviewsApi } from '../../lib/api';
import type { Order } from '../../types';
import { formatPrice, formatDate, estimateDelivery, getHandcraftingWindow } from '../../lib/utils';
import { Badge, EmptyState, Skeleton } from '../../components/ui';
import { OrderTimeline } from '../../components/OrderTimeline';
import { useToast } from '../../context/ToastContext';
import { statusTone } from './orderStatus';
import { ChevronDown, ChevronUp, Star, Send, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';

// ── Star Rating Widget ────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
          aria-label={`${s} star`}
        >
          <Star
            size={22}
            className={`transition-colors ${
              s <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200 fill-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Review Form for a single order item ──────────────────────────────────────
function ReviewForm({ productId, productName, onDone }: {
  productId: string;
  productName: string;
  onDone: () => void;
}) {
  const { show } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { show('Please select a star rating.', 'error'); return; }
    if (!comment.trim()) { show('Please write a comment.', 'error'); return; }
    setSubmitting(true);
    try {
      await reviewsApi.submit(productId, rating, comment);
      setDone(true);
      show(`Review submitted for "${productName}"! ⭐`, 'success');
      setTimeout(onDone, 1500);
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold py-2">
        <CheckCircle2 size={18} />
        <span>Review submitted — thank you!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3">
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <span className="text-xs text-amber-600 font-semibold">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </span>
        )}
      </div>
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={`Share your experience with "${productName}"…`}
        className="w-full border border-line rounded-xl px-3 py-2 text-xs text-charcoal placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none bg-white"
      />
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="btn-primary py-2 px-4 text-xs flex items-center gap-2 disabled:opacity-50"
      >
        {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

// ── Main Orders Page ──────────────────────────────────────────────────────────
export default function AccountOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  // Track which product review forms are open
  const [reviewOpen, setReviewOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    ordersApi.listForUser(user.id).then(setOrders);
  }, [user]);

  if (orders === null) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
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
      {orders.map((o) => {
        const isOpen = expanded === o.id;
        const isDelivered = o.status === 'Delivered';

        return (
          <div
            key={o.id}
            className={`bg-white rounded-2xl border shadow-soft transition-all duration-200 ${
              isOpen ? 'border-rose-300 shadow-lift' : 'border-line hover:border-rose-200'
            }`}
          >
            {/* ── Summary Row (always visible, tap to expand) ── */}
            <button
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setExpanded(isOpen ? null : o.id)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={o.items[0]?.image}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover bg-ivory shrink-0 hidden sm:block border border-line"
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-charcoal truncate">
                    {o.orderNumber ?? o.id.slice(-12)}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatDate(o.createdAt)} &middot; {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                  </p>
                  {isDelivered && (
                    <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1">
                      <Star size={9} className="fill-amber-400 text-amber-400" />
                      Rate this order
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-sm text-charcoal hidden sm:inline">{formatPrice(o.total)}</span>
                <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                {isOpen
                  ? <ChevronUp size={16} className="text-muted" />
                  : <ChevronDown size={16} className="text-muted" />
                }
              </div>
            </button>

            {/* ── Expanded Detail Panel ── */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-line px-5 pb-5 pt-4 space-y-5">

                    {/* Timeline */}
                    <div>
                      <p className="text-[0.7rem] font-semibold text-muted uppercase tracking-wider mb-3">
                        Fulfillment Status
                      </p>
                      <OrderTimeline status={o.status} />

                      {/* Status Info Box */}
                      {o.status === 'Shipped' ? (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center mt-3 space-y-0.5">
                          <p className="text-xs font-bold text-emerald-800">🚚 Shipped & On Its Way!</p>
                          <p className="text-[0.7rem] text-emerald-700 font-medium">
                            Expected Delivery: <span className="font-bold">{o.estimatedDeliveryDate || estimateDelivery(o.shippedAt || o.createdAt, 3)}</span>
                          </p>
                          {o.courierPartner && (
                            <p className="text-[0.65rem] text-muted">Courier: {o.courierPartner} {o.trackingNumber ? `· Tracking #${o.trackingNumber}` : ''}</p>
                          )}
                        </div>
                      ) : o.status !== 'Delivered' && o.status !== 'Cancelled' ? (
                        <div className="bg-rose-50/50 border border-rose-200/60 rounded-xl p-3 text-center mt-3 space-y-0.5">
                          <p className="text-xs font-bold text-rose-800">🧶 Handcrafting & Preparation (7–10 days)</p>
                          <p className="text-[0.7rem] text-charcoal">
                            Estimated dispatch by: <span className="font-semibold text-rose-700">{getHandcraftingWindow(o.createdAt).rangeText}</span>
                          </p>
                          <p className="text-[0.62rem] text-muted leading-relaxed">
                            Each piece is handmade with care. Delivery date will be updated and shared once your order is posted.
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-[0.7rem] font-semibold text-muted uppercase tracking-wider mb-3">
                        Order Items
                      </p>
                      <div className="space-y-3">
                        {o.items.map((item, i) => {
                          const reviewKey = `${o.id}-${i}`;
                          return (
                            <div key={i} className="flex gap-3 items-start">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 rounded-xl object-cover bg-ivory border border-line shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-charcoal truncate">{item.name}</p>
                                <p className="text-xs text-muted">Qty {item.quantity}</p>
                                {item.customization && (
                                  <p className="text-xs text-rose-600 font-medium mt-0.5">
                                    {[item.customization.yarnType, item.customization.color, item.customization.size].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                                {/* Rate this item — only for delivered orders */}
                                {isDelivered && item.productId && (
                                  <div className="mt-2">
                                    {reviewOpen[reviewKey] ? (
                                      <ReviewForm
                                        productId={item.productId}
                                        productName={item.name}
                                        onDone={() => setReviewOpen(prev => ({ ...prev, [reviewKey]: false }))}
                                      />
                                    ) : (
                                      <button
                                        onClick={() => setReviewOpen(prev => ({ ...prev, [reviewKey]: true }))}
                                        className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-amber-600 hover:text-amber-700 transition-colors mt-1"
                                      >
                                        <Star size={12} className="fill-amber-400 text-amber-400" />
                                        Leave a Review
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-bold text-rose-600 shrink-0">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-cream/40 rounded-xl px-4 py-3 border border-line space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted">
                        <span>Subtotal</span>
                        <span>{formatPrice(o.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-muted">
                        <span>Shipping</span>
                        <span>{o.shipping === 0 ? 'Free' : formatPrice(o.shipping)}</span>
                      </div>
                      {o.discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount</span>
                          <span>-{formatPrice(o.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-line mt-1.5 text-charcoal">
                        <span>Total</span>
                        <span>{formatPrice(o.total)}</span>
                      </div>
                    </div>

                    {/* Shipping address */}
                    {o.address && (
                      <div className="text-xs text-muted">
                        <p className="font-semibold text-charcoal mb-0.5">Shipping to:</p>
                        <p>{o.address.fullName} &middot; {o.address.phone}</p>
                        <p>{o.address.line1}, {o.address.city}, {o.address.state} {o.address.postalCode}</p>
                      </div>
                    )}

                    {/* View full detail link */}
                    <Link
                      to={`/account/orders/${o.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                    >
                      <ExternalLink size={13} />
                      View Full Order Details
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
