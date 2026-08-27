import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../ProductCard';
import { AnimatedContent } from '../reactbits/AnimatedContent';

export function FeaturedProductsSection() {
  const { products: featuredProducts, loading } = useProducts({ limit: 6, sort: 'featured' });

  return (
    <section className="container-nest py-12">
      <AnimatedContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="eyebrow mb-1">THE COLLECTION</span>
            <h2 className="font-display text-2xl sm:text-3xl text-charcoal mb-1">Made to Be Loved</h2>
            <p className="text-muted text-sm max-w-md">
              A few of our most-loved handmade pieces, ready to become part of your story.
            </p>
          </div>
          <Link to="/shop" className="btn-tertiary text-sm shrink-0">
            <span>View All Products</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted gap-2">
            <Loader2 size={24} className="animate-spin text-rose-400" />
            <span className="text-xs font-semibold">Loading collection…</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </AnimatedContent>
    </section>
  );
}
