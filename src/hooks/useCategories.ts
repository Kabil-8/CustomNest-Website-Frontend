import { useState, useEffect } from 'react';
import { productApi, type ApiCategory } from '../lib/productApi';
import { CATEGORIES as STATIC_CATEGORIES } from '../data/categories';
import type { Category } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    productApi
      .listCategories()
      .then((apiCats: ApiCategory[]) => {
        if (!mounted || !apiCats || apiCats.length === 0) return;

        // Map API categories into the Category type
        const dynamicCats: Category[] = apiCats.map((c) => {
          let name = c.name;
          let slug = c.slug;
          if (slug === 'kids-toys-jumbo' || /jumbo kids/i.test(name)) {
            name = 'Kids Special';
            slug = 'kids-special';
          }
          if (slug === 'resin-frames' || /resin/i.test(name)) {
            name = 'Resin Photo Frames';
            slug = 'resin-frames';
          }
          const staticMatch = STATIC_CATEGORIES.find(
            (sc) => sc.slug.toLowerCase() === slug.toLowerCase() || sc.name.toLowerCase() === name.toLowerCase()
          );
          return {
            id: slug,
            slug: slug,
            name: name,
            collection: c.collection || staticMatch?.collection || slug,
            image: c.image || staticMatch?.image || '/images/categories/jumbo-flower-bouquets.jpg',
            description: staticMatch?.description,
          };
        });

        // Ensure any static categories not yet in DB are still accessible
        const merged = [...dynamicCats];
        for (const sc of STATIC_CATEGORIES) {
          if (!merged.some((m) => m.slug.toLowerCase() === sc.slug.toLowerCase())) {
            merged.push(sc);
          }
        }

        setCategories(merged);
      })
      .catch(() => {
        // Silently preserve static categories on any network error
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { categories, loading };
}
