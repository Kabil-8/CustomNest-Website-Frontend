import React from 'react';
import { CATEGORIES } from '../../data/categories';
import { classNames } from '../../lib/utils';

interface CategorySliderProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export function CategorySlider({ selectedCategory, onSelectCategory }: CategorySliderProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 border-b border-line/60 bg-cream/40">
      <div className="flex items-center gap-2 px-4 min-w-max">
        <button
          onClick={() => onSelectCategory('all')}
          className={classNames(
            'px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0',
            selectedCategory === 'all'
              ? 'bg-rose-500 text-white shadow-soft'
              : 'bg-white text-charcoal border border-line hover:border-rose-300 hover:bg-rose-50'
          )}
        >
          All Items ({CATEGORIES.length})
        </button>

        {CATEGORIES.map((cat) => {
          const catId = cat.id || cat.slug;
          const isSelected = selectedCategory === catId;
          return (
            <button
              key={catId}
              onClick={() => onSelectCategory(catId)}
              className={classNames(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all shrink-0',
                isSelected
                  ? 'bg-rose-500 text-white shadow-soft'
                  : 'bg-white text-charcoal/80 border border-line hover:border-rose-300 hover:bg-rose-50'
              )}
            >
              <img
                src={cat.image}
                alt=""
                className="w-5 h-5 rounded-full object-cover border border-white/40"
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
