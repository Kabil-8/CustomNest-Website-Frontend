import React, { useState, useEffect, useRef } from 'react';
import { Heart, ShoppingBag, Star, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuthGate } from '../context/AuthGateContext';
import { useToast } from '../context/ToastContext';
import { QuickViewModal } from './shop/QuickViewModal';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, openDrawer } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { requireAuth } = useAuthGate();
  const { show } = useToast();
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Multi-image slider state
  const allImages = product.images && product.images.length > 0
    ? product.images
    : [product.image];
  const hasMultiple = allImages.length > 1;
  const [imgIndex, setImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!hasMultiple || isHovered) return;
    timerRef.current = setInterval(() => {
      setImgIndex((i) => (i + 1) % allImages.length);
    }, 3200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasMultiple, allImages.length, isHovered]);

  const wished = isWishlisted(product.id);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i - 1 + allImages.length) % allImages.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i + 1) % allImages.length);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      addItem(product, 1);
      show(`Added ${product.name} to your cart! 🧶`, 'success');
      openDrawer();
    }, `Sign in or create an account to add ${product.name} to your cart.`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      toggleWishlist(product.id);
      show(
        wished ? `Removed ${product.name} from wishlist.` : `Saved ${product.name} to your wishlist! ❤️`,
        'info'
      );
    }, `Sign in to save ${product.name} to your wishlist.`);
  };

  return (
    <>
      <div
        onClick={() => setQuickViewOpen(true)}
        className="group relative bg-white border border-line rounded-2xl overflow-hidden shadow-soft hover:shadow-lift transition-all duration-300 flex flex-col justify-between h-full cursor-pointer select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Card Header & Image */}
        <div>
          <div className="relative aspect-square overflow-hidden bg-ivory">
            {/* Sliding images */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={allImages[imgIndex]}
                src={allImages[imgIndex]}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>

            {/* Interactive Slider Navigation Arrows */}
            {hasMultiple && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-charcoal hover:bg-rose-500 hover:text-white shadow-soft flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20"
                  aria-label="Previous image"
                  title="Previous view"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-charcoal hover:bg-rose-500 hover:text-white shadow-soft flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20"
                  aria-label="Next image"
                  title="Next view"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Slide dots — only shown when multiple images */}
            {hasMultiple && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-charcoal/30 backdrop-blur-sm px-2 py-1 rounded-full">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImgIndex(i);
                    }}
                    className={`block rounded-full transition-all duration-300 ${
                      i === imgIndex
                        ? 'w-4 h-1.5 bg-rose-500'
                        : 'w-1.5 h-1.5 bg-white/80 hover:bg-white'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
              {product.featuredRank && product.featuredRank > 0 && product.featuredRank <= 10 ? (
                <span className="bg-amber-500 text-white text-[0.62rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-soft flex items-center gap-1">
                  <Star size={9} className="fill-white" />
                  <span>Top #{product.featuredRank}</span>
                </span>
              ) : product.isFeatured ? (
                <span className="bg-rose-500 text-white text-[0.62rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-soft">
                  Featured
                </span>
              ) : null}
              {product.originalPrice && (
                <span className="bg-charcoal text-cream text-[0.62rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Sale
                </span>
              )}
              {hasMultiple && (
                <span className="bg-white/95 text-rose-700 text-[0.6rem] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-rose-200 flex items-center gap-1">
                  <Layers size={10} />
                  <span>{imgIndex + 1}/{allImages.length} Views</span>
                </span>
              )}
            </div>

            {/* Top Right Wishlist Action */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
              <button
                onClick={handleToggleWishlist}
                aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  wished
                    ? 'bg-rose-500 text-white shadow-soft'
                    : 'bg-white/90 backdrop-blur-sm text-charcoal hover:text-rose-600 shadow-sm'
                }`}
              >
                <Heart size={15} className={wished ? 'fill-white' : ''} />
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4">
            <span className="text-[0.68rem] font-semibold text-rose-600 uppercase tracking-wider mb-1 block">
              {product.categoryLabel}
            </span>
            <div className="block group-hover:text-rose-600 transition-colors">
              <h3 className="font-display text-base text-charcoal line-clamp-1 mb-1.5">{product.name}</h3>
            </div>

            {product.reviewCount > 0 ? (
              <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold mb-2">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
                <span className="text-muted text-[0.7rem] font-normal">({product.reviewCount})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted/70 font-normal mb-2">
                <span className="text-[0.68rem]">No reviews yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Price & Add to Cart */}
        <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-line/60">
          <div>
            <span className="font-display text-lg text-rose-600">
              ₹{(product.yarnType === 'acrylic' ? product.acrylicPrice : (product.normalPrice || product.price)) || product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted line-through ml-1.5">₹{product.originalPrice}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white text-xs font-semibold transition-all duration-200 cursor-pointer"
          >
            <ShoppingBag size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Quick View Modal (Pops up on touch/click anywhere on card) */}
      {quickViewOpen && <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />}
    </>
  );
}
