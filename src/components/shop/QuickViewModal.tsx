import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Star, ShoppingBag, Heart, Check, Sparkles, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuthGate } from '../../context/AuthGateContext';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addItem, openDrawer } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { requireAuth } = useAuthGate();
  const { show } = useToast();

  const [selectedColor, setSelectedColor] = useState('');
  const [customText, setCustomText] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const wished = isWishlisted(product.id);

  const handleAddToCart = () => {
    requireAuth(() => {
      addItem(product, quantity, {
        color: selectedColor || undefined,
        text: customText || undefined,
        size: selectedSize || undefined,
      });
      show(`Added ${product.name} to cart! 🧶`, 'success');
      onClose();
      openDrawer();
    }, `Sign in or create an account to add ${product.name} to your cart.`);
  };

  const handleWishlist = () => {
    requireAuth(() => {
      toggleWishlist(product.id);
      show(
        wished ? `Removed ${product.name} from wishlist.` : `Saved ${product.name} to your wishlist! ❤️`,
        'info'
      );
    }, `Sign in to save ${product.name} to your wishlist.`);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] bg-charcoal/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-lift max-h-[90vh] overflow-y-auto"
        >
          <div className="relative p-6 sm:p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-sand hover:bg-rose-100 flex items-center justify-center text-charcoal transition-colors"
            >
              <X size={18} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Product Image & Multi-view Thumbnails */}
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-ivory aspect-square group">
                  <img
                    src={allImages[activeImageIndex] || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  {product.isFeatured && (
                    <span className="absolute top-3 left-3 bg-rose-500 text-white text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-soft z-10">
                      Featured
                    </span>
                  )}
                  {allImages.length > 1 && (
                    <>
                      <span className="absolute top-3 right-3 bg-charcoal/70 backdrop-blur-md text-cream text-[0.65rem] font-semibold px-2.5 py-1 rounded-full shadow-soft z-10 flex items-center gap-1">
                        <Layers size={11} />
                        <span>View {activeImageIndex + 1} of {allImages.length}</span>
                      </span>
                      <button
                        onClick={() => setActiveImageIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-charcoal hover:bg-rose-500 hover:text-white shadow-soft flex items-center justify-center transition-all z-10"
                        title="Previous angle"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setActiveImageIndex((i) => (i + 1) % allImages.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-charcoal hover:bg-rose-500 hover:text-white shadow-soft flex items-center justify-center transition-all z-10"
                        title="Next angle"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                          activeImageIndex === idx
                            ? 'border-rose-500 scale-95 shadow-soft ring-2 ring-rose-300/50'
                            : 'border-line opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex flex-col h-full justify-between">
                <div>
                  <span className="eyebrow text-[0.7rem] mb-1">{product.categoryLabel}</span>
                  <h2 className="font-display text-xl sm:text-2xl text-charcoal mb-2">{product.name}</h2>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center text-amber-500 text-xs font-semibold">
                      <Star size={14} className="fill-amber-400 text-amber-400 mr-1" />
                      <span>{product.rating}</span>
                      <span className="text-muted ml-1 font-normal">({product.reviewCount} reviews)</span>
                    </div>
                    <span className="text-line font-light">|</span>
                    <span className={`text-xs font-semibold ${product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-display text-2xl text-rose-600">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted line-through">₹{product.originalPrice}</span>
                    )}
                  </div>

                  <p className="text-xs text-muted leading-relaxed mb-4 line-clamp-3">
                    {product.description}
                  </p>

                  {/* Customization color */}
                  {product.customization?.colors && product.customization.colors.length > 0 && (
                    <div className="mb-4">
                      <label className="label text-[0.68rem]">Select Color</label>
                      <div className="flex flex-wrap gap-1.5">
                        {product.customization.colors.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                              selectedColor === c
                                ? 'bg-rose-500 text-white border-rose-500 shadow-soft'
                                : 'bg-white text-charcoal border-line hover:border-rose-300'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-5 flex items-center gap-3">
                    <label className="label text-[0.68rem] mb-0">Qty</label>
                    <div className="flex items-center border border-line rounded-xl overflow-hidden bg-cream/40">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1 text-sm font-semibold hover:bg-sand text-charcoal"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-charcoal">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-3 py-1 text-sm font-semibold hover:bg-sand text-charcoal"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 pt-3 border-t border-line">
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddToCart}
                      className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={handleWishlist}
                      className={`p-3 rounded-full border transition-all ${
                        wished
                          ? 'bg-rose-50 border-rose-300 text-rose-600'
                          : 'bg-white border-line text-muted hover:text-rose-600 hover:border-rose-300'
                      }`}
                      aria-label="Wishlist"
                    >
                      <Heart size={18} className={wished ? 'fill-rose-500' : ''} />
                    </button>
                  </div>
                  <Link
                    to={`/products/${product.slug}`}
                    onClick={onClose}
                    className="block text-center text-xs font-semibold text-rose-600 hover:underline pt-1"
                  >
                    View Full Details & Customization →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
