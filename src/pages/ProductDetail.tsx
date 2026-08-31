import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, RefreshCw, Sparkles, Check, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Layers, Ruler, Send } from 'lucide-react';
import { useProduct } from '../hooks/useProduct';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuthGate } from '../context/AuthGateContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { BlurText } from '../components/reactbits/BlurText';
import { reviews as reviewsApi, type ApiReview } from '../lib/api';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const { addItem, openDrawer } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { requireAuth } = useAuthGate();
  const { show } = useToast();

  const { product, related, loading, error } = useProduct(slug);
  const { user } = useAuth();

  const [activeImage, setActiveImage]     = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize]   = useState('');
  const [customText, setCustomText]       = useState('');
  const [quantity, setQuantity]           = useState(1);
  const [activeTab, setActiveTab]         = useState<'desc' | 'materials' | 'care' | 'reviews'>('desc');

  // ── Reviews state ─────────────────────────────────────────────────────────
  const [productReviews, setProductReviews] = useState<ApiReview[]>([]);
  const [reviewsLoaded, setReviewsLoaded]   = useState(false);
  const [myRating, setMyRating]             = useState(0);
  const [myRatingHover, setMyRatingHover]   = useState(0);
  const [myComment, setMyComment]           = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Sync active image when product loads
  useEffect(() => {
    if (product) setActiveImage(product.image);
  }, [product]);

  // Reset selections when product changes
  useEffect(() => {
    setSelectedColor('');
    setSelectedSize('');
  }, [product?.id]);

  // Load reviews when Reviews tab is opened
  const loadReviews = useCallback(async () => {
    if (!product?.id || reviewsLoaded) return;
    try {
      const data = await reviewsApi.listForProduct(product.id);
      setProductReviews(data);
      setReviewsLoaded(true);
    } catch { /* silently ignore */ }
  }, [product?.id, reviewsLoaded]);

  useEffect(() => {
    if (activeTab === 'reviews') loadReviews();
  }, [activeTab, loadReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    if (myRating === 0) { show('Please select a star rating.', 'error'); return; }
    if (!myComment.trim()) { show('Please write a comment.', 'error'); return; }
    setSubmittingReview(true);
    try {
      const newReview = await reviewsApi.submit(product.id, myRating, myComment);
      const updatedReviews = [newReview, ...productReviews.filter(r => r._id !== newReview._id)];
      setProductReviews(updatedReviews);
      setReviewsLoaded(true);
      
      // Update local product review count & avg rating
      const avg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
      product.reviewCount = updatedReviews.length;
      product.rating = Math.round(avg * 10) / 10;

      setMyRating(0);
      setMyComment('');
      show('Review submitted! Thank you ⭐', 'success');
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const wished = product ? isWishlisted(product.id) : false;
  const galleryImages = product?.images && product.images.length > 0 ? product.images : (product ? [product.image] : []);
  const activeIndex = galleryImages.indexOf(activeImage);
  const currentIdx = activeIndex >= 0 ? activeIndex : 0;

  // Compute effective price (base + size modifier)
  const selectedSizeObj = product?.sizes?.find(s => s.label === selectedSize);
  const effectivePrice = product
    ? product.price + (selectedSizeObj?.priceModifier ?? 0)
    : 0;

  const handlePrevGallery = () => {
    if (galleryImages.length <= 1) return;
    const prevIdx = (currentIdx - 1 + galleryImages.length) % galleryImages.length;
    setActiveImage(galleryImages[prevIdx]);
  };

  const handleNextGallery = () => {
    if (galleryImages.length <= 1) return;
    const nextIdx = (currentIdx + 1) % galleryImages.length;
    setActiveImage(galleryImages[nextIdx]);
  };

  const handleAddToCart = () => {
    if (!product) return;
    requireAuth(() => {
      addItem(
        { ...product, price: effectivePrice },
        quantity,
        {
          color: selectedColor || undefined,
          size:  selectedSize  || undefined,
          text:  customText   || undefined,
        }
      );
      show(`Added ${product.name} to your cart! 🧶`, 'success');
      openDrawer();
    }, `Sign in or create an account to add ${product.name} to your cart.`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    requireAuth(() => {
      addItem(
        { ...product, price: effectivePrice },
        quantity,
        {
          color: selectedColor || undefined,
          size:  selectedSize  || undefined,
          text:  customText   || undefined,
        }
      );
      navigate('/checkout');
    }, `Sign in to buy ${product.name}.`);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    requireAuth(() => {
      toggleWishlist(product.id);
      show(
        wished
          ? `Removed ${product.name} from wishlist.`
          : `Saved ${product.name} to your wishlist! ❤️`,
        'info'
      );
    }, `Sign in to save ${product.name} to your wishlist.`);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted">
          <Loader2 size={36} className="animate-spin text-rose-400" />
          <p className="text-sm font-medium">Loading product…</p>
        </div>
      </div>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl text-charcoal">Product not found</h2>
          <p className="text-muted text-sm">{error ?? 'This product does not exist or has been removed.'}</p>
          <Link to="/shop" className="btn-primary inline-block">Browse the Collection</Link>
        </div>
      </div>
    );
  }

  const hasColors = product.availableColors && product.availableColors.length > 0;
  const hasSizes  = product.sizes && product.sizes.length > 0;
  const hasCustomization = product.customization && (hasColors || hasSizes || product.customization.textAllowed);

  return (
    <div className="py-8 sm:py-12 min-h-screen">
      <div className="container-nest">
        {/* Back */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-rose-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Collection</span>
        </Link>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start mb-16">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-ivory border border-line shadow-soft group">
              <img
                src={activeImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              {/* View angle badge & Slider Controls */}
              {galleryImages.length > 1 && (
                <>
                  <span className="absolute top-4 left-4 bg-charcoal/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-soft z-10 flex items-center gap-1.5">
                    <Layers size={13} />
                    <span>View {currentIdx + 1} of {galleryImages.length}</span>
                  </span>
                  <button
                    onClick={handlePrevGallery}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-charcoal hover:bg-rose-500 hover:text-white shadow-lift flex items-center justify-center transition-all z-10 opacity-0 group-hover:opacity-100"
                    title="Previous View"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextGallery}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-charcoal hover:bg-rose-500 hover:text-white shadow-lift flex items-center justify-center transition-all z-10 opacity-0 group-hover:opacity-100"
                    title="Next View"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <button
                onClick={handleToggleWishlist}
                className={`absolute top-4 right-4 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  wished
                    ? 'bg-rose-500 text-white shadow-soft'
                    : 'bg-white/90 backdrop-blur-sm text-charcoal hover:text-rose-600 shadow-lift'
                }`}
                aria-label="Wishlist"
              >
                <Heart size={20} className={wished ? 'fill-white' : ''} />
              </button>
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImage === img
                        ? 'border-rose-500 scale-95 shadow-soft ring-2 ring-rose-300/50'
                        : 'border-line opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="eyebrow text-xs mb-1.5">{product.categoryLabel}</span>
              <BlurText
                text={product.name}
                delay={30}
                animateBy="words"
                className="font-display text-2xl sm:text-3xl text-charcoal mb-3"
              />

              <div className="flex items-center gap-3 mb-4">
                {product.reviewCount > 0 ? (
                  <div className="flex items-center text-amber-500 text-sm font-bold">
                    <Star size={16} className="fill-amber-400 text-amber-400 mr-1" />
                    <span>{product.rating}</span>
                    <span className="text-muted text-xs font-normal ml-1">
                      ({product.reviewCount} {product.reviewCount === 1 ? 'customer review' : 'customer reviews'})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-muted">
                    <Star size={14} className="text-gray-300 mr-1" />
                    <span>No reviews yet &middot;</span>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className="text-rose-600 font-semibold ml-1 hover:underline cursor-pointer"
                    >
                      Be the first to review
                    </button>
                  </div>
                )}
                <span className="text-line">|</span>
                <span className={`text-xs font-semibold ${product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {product.stock > 0 ? 'In Stock — Ready to ship' : 'Out of Stock'}
                </span>
              </div>

              {/* Dynamic price display */}
              <div className="flex items-baseline gap-3 mb-4">
                <motion.span
                  key={effectivePrice}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-3xl text-rose-600"
                >
                  ₹{effectivePrice}
                </motion.span>
                {product.originalPrice && (
                  <span className="text-base text-muted line-through">₹{product.originalPrice}</span>
                )}
                {selectedSizeObj && selectedSizeObj.priceModifier > 0 && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    +₹{selectedSizeObj.priceModifier} for {selectedSizeObj.label}
                  </span>
                )}
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Inclusive of all taxes
                </span>
              </div>

              <p className="text-sm text-muted leading-relaxed">{product.description}</p>
            </div>

            {/* Customization Options */}
            {hasCustomization && (
              <div className="card p-5 space-y-4 bg-cream/30">
                <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles size={14} />
                  <span>Customization Options</span>
                </div>

                {/* ── Color Picker — from DB ────────────── */}
                {hasColors && (
                  <div>
                    <label className="label text-xs mb-2">
                      Yarn Color
                      {selectedColor && (
                        <span className="ml-2 font-normal text-muted normal-case">
                          — {selectedColor}
                        </span>
                      )}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.availableColors!.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedColor(selectedColor === c.name ? '' : c.name)}
                          title={c.name}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            selectedColor === c.name
                              ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-soft ring-1 ring-rose-300/50'
                              : 'bg-white text-charcoal border-line hover:border-rose-300'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0"
                            style={{ backgroundColor: c.hexCode }}
                          />
                          {c.name}
                          {selectedColor === c.name && <Check size={11} className="text-rose-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Size Picker ───────────────────────── */}
                {hasSizes && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Ruler size={13} className="text-blue-500" />
                      <label className="label text-xs mb-0">
                        Size
                        {selectedSize && selectedSizeObj && selectedSizeObj.priceModifier > 0 && (
                          <span className="ml-2 font-normal text-blue-600 normal-case">
                            +₹{selectedSizeObj.priceModifier}
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes!.map((sz) => (
                        <button
                          key={sz.label}
                          type="button"
                          onClick={() => setSelectedSize(selectedSize === sz.label ? '' : sz.label)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            selectedSize === sz.label
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-soft ring-1 ring-blue-300/50'
                              : 'bg-white text-charcoal border-line hover:border-blue-300'
                          }`}
                        >
                          {sz.label}
                          {sz.priceModifier > 0 && (
                            <span className="ml-1.5 text-[0.65rem] text-blue-500">+₹{sz.priceModifier}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Custom Text ───────────────────────── */}
                {product.customization?.textAllowed && (
                  <div>
                    <label className="label text-xs" htmlFor="custom-text">
                      Custom Monogram / Name Tag
                    </label>
                    <input
                      id="custom-text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="e.g. For Sarah ❤️"
                      className="input text-xs py-2 bg-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Quantity & CTA */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="label text-xs mb-0">Quantity:</span>
                <div className="flex items-center border border-line rounded-xl overflow-hidden bg-white">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3.5 py-1.5 text-sm font-semibold hover:bg-sand text-charcoal">-</button>
                  <span className="px-4 py-1.5 text-sm font-bold text-charcoal">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="px-3.5 py-1.5 text-sm font-semibold hover:bg-sand text-charcoal">+</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button onClick={handleAddToCart} className="btn-primary py-3.5 flex items-center justify-center gap-2">
                  <ShoppingBag size={18} />
                  <span>Add to Cart</span>
                </button>
                <button onClick={handleBuyNow} className="btn-dark py-3.5">Buy Now</button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-line/60 text-center">
              <div className="p-3 rounded-xl bg-white border border-line">
                <Truck size={18} className="mx-auto text-rose-500 mb-1" />
                <span className="text-[0.7rem] font-medium text-charcoal block">Handcrafted with Care</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-line">
                <ShieldCheck size={18} className="mx-auto text-rose-500 mb-1" />
                <span className="text-[0.7rem] font-medium text-charcoal block">100% Premium Yarn</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-line">
                <RefreshCw size={18} className="mx-auto text-rose-500 mb-1" />
                <span className="text-[0.7rem] font-medium text-charcoal block">Custom Requests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Tabs */}
        <div className="bg-white rounded-3xl border border-line shadow-soft p-6 sm:p-10 mb-16">
          <div className="flex border-b border-line gap-6 mb-6 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'desc',      label: 'Description' },
                { id: 'materials', label: 'Materials & Specs' },
                { id: 'care',      label: 'Care Instructions' },
                { id: 'reviews',   label: `Reviews (${reviewsLoaded ? productReviews.length : (product.reviewCount || 0)})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-muted hover:text-charcoal'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-sm text-charcoal/80 leading-relaxed max-w-3xl">
            {activeTab === 'desc'      && <p>{product.description}</p>}
            {activeTab === 'materials' && (
              <ul className="space-y-2">
                <li className="flex items-center gap-2"><Check size={16} className="text-rose-500" /> {product.materials || 'Premium Milk Cotton & Soft Acrylic Yarn'}</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-rose-500" /> Non-allergenic polyester fiberfill stuffing</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-rose-500" /> Sturdy structural wire inserts for bouquet stems</li>
              </ul>
            )}
            {activeTab === 'care'    && <p>{product.care || 'Hand wash gently with mild detergent in lukewarm water. Reshape while damp and lay flat to dry in shade.'}</p>}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* ── Submit a review ── */}
                {user ? (
                  <div className="bg-cream/40 rounded-2xl p-5 border border-line space-y-3">
                    <p className="text-sm font-semibold text-charcoal">Write a Review</p>
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      {/* Star picker */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onMouseEnter={() => setMyRatingHover(s)}
                            onMouseLeave={() => setMyRatingHover(0)}
                            onClick={() => setMyRating(s)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              size={26}
                              className={`transition-colors ${
                                s <= (myRatingHover || myRating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200 fill-gray-200'
                              }`}
                            />
                          </button>
                        ))}
                        {myRating > 0 && (
                          <span className="text-xs text-amber-600 font-semibold ml-1">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][myRating]}
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        placeholder="Share your experience with this product…"
                        className="w-full border border-line rounded-xl px-3 py-2.5 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none bg-white"
                      />
                      <button
                        type="submit"
                        disabled={submittingReview || myRating === 0}
                        className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2 disabled:opacity-50"
                      >
                        {submittingReview
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Send size={14} />}
                        {submittingReview ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-cream/40 rounded-2xl p-4 border border-line text-center">
                    <p className="text-sm text-muted">
                      <Link to="/login" className="text-rose-600 font-semibold hover:underline">Sign in</Link>{' '}
                      to leave a review for this product.
                    </p>
                  </div>
                )}

                {/* ── Existing reviews ── */}
                {!reviewsLoaded ? (
                  <div className="flex items-center gap-2 text-muted text-xs py-4">
                    <Loader2 size={14} className="animate-spin text-rose-400" />
                    Loading reviews…
                  </div>
                ) : productReviews.length === 0 ? (
                  <p className="text-sm text-muted py-4">
                    No reviews yet — be the first to review this product!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {productReviews.map((r) => {
                      const userName = typeof r.user === 'object' ? r.user.name : 'Customer';
                      const initial = userName[0]?.toUpperCase() ?? 'C';
                      return (
                        <div key={r._id} className="flex gap-4 p-4 rounded-2xl bg-white border border-line shadow-soft">
                          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 font-bold text-sm flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                              <span className="font-semibold text-sm text-charcoal">{userName}</span>
                              <div className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={13}
                                    className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-muted leading-relaxed">{r.comment}</p>
                            <p className="text-[0.65rem] text-muted/60 mt-1">
                              {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <div className="mb-6">
              <span className="eyebrow mb-1">Recommendations</span>
              <h2 className="font-display text-2xl text-charcoal">You May Also Like</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
