import React from 'react';
import { CATEGORIES } from '../../data/categories';
import { RotateCcw, Check } from 'lucide-react';

interface ProductFiltersProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  inStockOnly: boolean;
  onInStockChange: (val: boolean) => void;
  minRating: number;
  onMinRatingChange: (val: number) => void;
  onResetFilters: () => void;
}

export function ProductFilters({
  selectedCategory,
  onSelectCategory,
  maxPrice,
  onMaxPriceChange,
  inStockOnly,
  onInStockChange,
  minRating,
  onMinRatingChange,
  onResetFilters,
}: ProductFiltersProps) {
  return (
    <div className="bg-white rounded-2xl border border-line p-6 shadow-soft space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <h3 className="font-display text-lg text-charcoal">Filters</h3>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 transition-colors"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* Categories List */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Categories</h4>
        <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar pr-1">
          <button
            onClick={() => onSelectCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              selectedCategory === 'all' ? 'bg-rose-50 text-rose-600 font-bold' : 'hover:bg-sand text-charcoal'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === 'all' && <Check size={14} />}
          </button>
          {CATEGORIES.map((cat) => {
            const catId = cat.id || cat.slug;
            const isSelected = selectedCategory === catId;
            return (
              <button
                key={catId}
                onClick={() => onSelectCategory(catId)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                  isSelected ? 'bg-rose-50 text-rose-600 font-bold' : 'hover:bg-sand text-charcoal/80'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {isSelected && <Check size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Filter Slider */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-muted mb-2">
          <span>Max Price</span>
          <span className="text-rose-600 font-bold">₹{maxPrice}</span>
        </div>
        <input
          type="range"
          min="100"
          max="3500"
          step="50"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(Number(e.target.value))}
          className="w-full accent-rose-500 cursor-pointer"
        />
        <div className="flex justify-between text-[0.7rem] text-muted mt-1 font-medium">
          <span>₹100</span>
          <span>₹3,500</span>
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">Minimum Rating</h4>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 3, 4, 4.5].map((val) => (
            <button
              key={val}
              onClick={() => onMinRatingChange(val)}
              className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                minRating === val
                  ? 'bg-rose-500 text-white border-rose-500 shadow-soft'
                  : 'bg-white text-charcoal border-line hover:border-rose-300'
              }`}
            >
              {val === 0 ? 'Any' : `${val}★+`}
            </button>
          ))}
        </div>
      </div>

      {/* Availability Switch */}
      <div className="pt-3 border-t border-line">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-semibold text-charcoal">In Stock Only</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="w-4 h-4 rounded border-line text-rose-500 focus:ring-rose-200 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
