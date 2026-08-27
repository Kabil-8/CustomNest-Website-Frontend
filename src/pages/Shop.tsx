import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, SlidersHorizontal, PackageX, Loader2 } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { CATEGORIES } from '../data/categories';
import { ProductCard } from '../components/ProductCard';
import { CategorySlider } from '../components/shop/CategorySlider';
import { ShopToolbar } from '../components/shop/ShopToolbar';
import { ProductFilters } from '../components/shop/ProductFilters';
import { BlurText } from '../components/reactbits/BlurText';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') ?? 'all';
  const queryParam     = searchParams.get('q') ?? '';

  const [searchQuery, setSearchQuery]   = useState(queryParam);
  const [sortOption, setSortOption]     = useState('featured');
  const [maxPrice, setMaxPrice]         = useState(3500);
  const [inStockOnly, setInStockOnly]   = useState(false);
  const [minRating, setMinRating]       = useState(0);
  const [mobileViewMode, setMobileViewMode] = useState<'grid' | 'carousel'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounce search query so we don't hammer the API on every keystroke
  const [debouncedQ, setDebouncedQ] = useState(queryParam);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Build API params — the backend handles all filtering/sorting
  const apiParams = useMemo(() => ({
    category:     activeCategory !== 'all' ? activeCategory : undefined,
    q:            debouncedQ.trim() || undefined,
    sort:         sortOption as 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating',
    maxPrice:     maxPrice < 3500 ? maxPrice : undefined,
    limit:        48,
  }), [activeCategory, debouncedQ, sortOption, maxPrice]);

  const { products: allProducts, total, loading, error } = useProducts(apiParams);

  // Client-side stock + rating filters (not in API query)
  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (inStockOnly)     list = list.filter(p => p.stock > 0);
    if (minRating > 0)   list = list.filter(p => p.rating >= minRating);
    return list;
  }, [allProducts, inStockOnly, minRating]);

  const handleSelectCategory = (catId: string) => {
    const next = new URLSearchParams(searchParams);
    catId === 'all' ? next.delete('category') : next.set('category', catId);
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSortOption('featured');
    setMaxPrice(3500);
    setInStockOnly(false);
    setMinRating(0);
    setSearchParams({});
  };

  const activeCategoryObj = CATEGORIES.find(
    (c) => (c.id ?? c.slug) === activeCategory
  );

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="container-nest">
        {/* Header */}
        <div className="mb-6 text-center sm:text-left">
          <span className="eyebrow mb-2">Handmade Collection</span>
          <BlurText
            text={activeCategoryObj ? activeCategoryObj.name : 'Explore Our Nest'}
            delay={40}
            animateBy="words"
            className="font-display text-3xl sm:text-4xl text-charcoal mb-2"
          />
          <p className="text-muted text-sm max-w-2xl leading-relaxed">
            {activeCategoryObj
              ? activeCategoryObj.description
              : 'Browse our complete range of handmade crochet bouquets, plushies, accessories, and gifts.'}
          </p>
        </div>

        {/* Category pills */}
        <div className="mb-6 rounded-2xl overflow-hidden shadow-soft border border-line bg-white">
          <CategorySlider selectedCategory={activeCategory} onSelectCategory={handleSelectCategory} />
        </div>

        {/* Toolbar */}
        <ShopToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOption={sortOption}
          onSortChange={setSortOption}
          mobileViewMode={mobileViewMode}
          onToggleMobileView={setMobileViewMode}
          totalResults={filteredProducts.length}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        />

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24">
            <ProductFilters
              selectedCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              inStockOnly={inStockOnly}
              onInStockChange={setInStockOnly}
              minRating={minRating}
              onMinRatingChange={setMinRating}
              onResetFilters={handleResetFilters}
            />
          </aside>

          {/* Product grid */}
          <main className="lg:col-span-9">
            {loading ? (
              <div className="flex items-center justify-center py-24 gap-3 text-muted">
                <Loader2 size={24} className="animate-spin text-rose-400" />
                <span className="text-sm font-medium">Loading products…</span>
              </div>
            ) : error ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
                <p className="text-sm text-rose-600 font-semibold mb-2">Failed to load products</p>
                <p className="text-xs text-muted">{error}</p>
                <p className="text-xs text-muted mt-1">Make sure the backend server is running on port 5000.</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              mobileViewMode === 'carousel' ? (
                <div className="flex sm:hidden overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar py-2">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="snap-center shrink-0 w-[82vw]">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )
            ) : (
              <div className="bg-white rounded-3xl border border-line p-12 text-center shadow-soft">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                  <PackageX size={32} />
                </div>
                <h3 className="font-display text-xl text-charcoal mb-2">
                  Your nest is waiting for something special.
                </h3>
                <p className="text-muted text-sm max-w-md mx-auto mb-6">
                  No products matched your filter criteria. Try expanding your price range or resetting filters.
                </p>
                <button onClick={handleResetFilters} className="btn-primary">
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Result count */}
            {!loading && !error && filteredProducts.length > 0 && (
              <p className="text-xs text-muted text-center mt-6">
                Showing {filteredProducts.length} of {total} products
              </p>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            className="fixed inset-0 z-[95] bg-charcoal/50 flex items-end justify-center lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto shadow-lift"
            >
              <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-rose-500" />
                  <span className="font-display text-lg">Filter Collection</span>
                </div>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-charcoal"
                >
                  <X size={18} />
                </button>
              </div>

              <ProductFilters
                selectedCategory={activeCategory}
                onSelectCategory={(cat) => { handleSelectCategory(cat); setMobileFiltersOpen(false); }}
                maxPrice={maxPrice}
                onMaxPriceChange={setMaxPrice}
                inStockOnly={inStockOnly}
                onInStockChange={setInStockOnly}
                minRating={minRating}
                onMinRatingChange={setMinRating}
                onResetFilters={() => { handleResetFilters(); setMobileFiltersOpen(false); }}
              />

              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-primary w-full mt-6 py-3.5"
              >
                Apply Filters ({filteredProducts.length} items)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
