import { useState, useEffect, useCallback, useRef } from 'react';
import { productApi, normalizeProduct, type ProductListParams } from '../lib/productApi';
import type { Product } from '../types';

interface UseProductsResult {
  products: Product[];
  total: number;
  totalPages: number;
  page: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(params: ProductListParams = {}): UseProductsResult {
  const [products, setProducts]     = useState<Product[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const tickRef                     = useRef(0);

  // Stable key so effect only re-runs when params actually change
  const paramsKey = JSON.stringify(params);

  const fetchProducts = useCallback(async () => {
    const tick = ++tickRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await productApi.list(JSON.parse(paramsKey) as ProductListParams);
      if (tick !== tickRef.current) return; // stale response
      setProducts(result.items.map(normalizeProduct));
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (err: unknown) {
      if (tick !== tickRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      if (tick === tickRef.current) setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, total, totalPages, page, loading, error, refetch: fetchProducts };
}
