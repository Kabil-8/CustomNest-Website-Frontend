import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { AnimatedContent } from '../reactbits/AnimatedContent';
import { SpotlightCard } from '../reactbits/SpotlightCard';

export function CategoryShowcase() {
  const categories = CATEGORIES.slice(0, 6);

  return (
    <section className="container-nest py-12">
      <AnimatedContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="eyebrow mb-1">DISCOVER THE COLLECTIONS</span>
            <h2 className="font-display text-2xl sm:text-3xl text-charcoal">Explore Our Nest</h2>
          </div>
          <Link to="/shop" className="btn-tertiary text-sm">
            <span>View All Categories</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const catId = cat.slug || cat.id;
            return (
              <Link key={catId} to={`/shop?category=${catId}`}>
                <SpotlightCard className="p-3 text-center group h-full bg-white border border-line shadow-soft hover:shadow-lift transition-all">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-ivory">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-display text-sm font-bold text-charcoal group-hover:text-rose-600 transition-colors truncate mb-0.5">
                    {cat.name}
                  </h3>
                  <span className="text-[0.7rem] text-rose-600 font-semibold flex items-center justify-center gap-1">
                    <span>Explore</span>
                    <ArrowRight size={11} />
                  </span>
                </SpotlightCard>
              </Link>
            );
          })}
        </div>
      </AnimatedContent>
    </section>
  );
}
