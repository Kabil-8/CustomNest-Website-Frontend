import React from 'react';
import { Search, SlidersHorizontal, Grid, Rows } from 'lucide-react';

interface ShopToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOption: string;
  onSortChange: (sort: string) => void;
  mobileViewMode: 'grid' | 'carousel';
  onToggleMobileView: (mode: 'grid' | 'carousel') => void;
  totalResults: number;
  onOpenMobileFilters: () => void;
}

export function ShopToolbar({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  mobileViewMode,
  onToggleMobileView,
  totalResults,
  onOpenMobileFilters,
}: ShopToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-line shadow-soft mb-6">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search handmade crochet..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-line bg-cream/30 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
        />
      </div>

      {/* Toolbar Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="text-xs font-medium text-muted hidden sm:inline">
          {totalResults} {totalResults === 1 ? 'item' : 'items'}
        </span>

        {/* Mobile Filter Button */}
        <button
          onClick={onOpenMobileFilters}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-line bg-cream/30 hover:bg-rose-50 text-charcoal"
        >
          <SlidersHorizontal size={15} />
          <span>Filters</span>
        </button>

        {/* Mobile View Mode Toggle */}
        <div className="flex sm:hidden items-center bg-sand p-1 rounded-xl">
          <button
            onClick={() => onToggleMobileView('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              mobileViewMode === 'grid' ? 'bg-white shadow-soft text-rose-600' : 'text-muted'
            }`}
            title="Grid View"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => onToggleMobileView('carousel')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              mobileViewMode === 'carousel' ? 'bg-white shadow-soft text-rose-600' : 'text-muted'
            }`}
            title="Slider View"
          >
            <Rows size={16} />
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="shop-sort" className="text-xs text-muted font-medium hidden md:inline">
            Sort by:
          </label>
          <select
            id="shop-sort"
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-line bg-white text-charcoal outline-none focus:border-rose-400 cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>
    </div>
  );
}
