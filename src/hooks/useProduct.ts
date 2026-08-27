import { useState, useEffect } from 'react';
import { productApi, normalizeProduct } from '../lib/productApi';
import type { Product } from '../types';

interface UseProductResult {
  product: Product | null;
  related: Product[];
  loading: boolean;
  error: string | null;
}

export function useProduct(slug: string | undefined): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const activeSlug = slug;
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const raw = await productApi.getBySlug(activeSlug);
        if (cancelled) return;
        const prod = normalizeProduct(raw);
        setProduct(prod);

        // Fetch related products from the same category (limit 4)
        const relatedResult = await productApi.list({
          category: prod.category,
          limit: 5,
        });
        if (cancelled) return;
        setRelated(
          relatedResult.items
            .map(normalizeProduct)
            .filter((p) => p.id !== prod.id)
            .slice(0, 4)
        );
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Product not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [slug]);

  return { product, related, loading, error };
}
