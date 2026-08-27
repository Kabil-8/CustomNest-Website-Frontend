// productApi.ts — Real HTTP client for Express/MongoDB product & category API.
// All product reads and admin mutations go through here. No mock data.

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000') + '/api';

// ── API shape types ────────────────────────────────────────────────────────

export interface ApiCategory {
  _id: string;
  slug: string;
  name: string;
  collection: string;
  image: string;
}

export interface ApiProduct {
  _id: string;
  slug: string;
  name: string;
  category: ApiCategory | string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  description: string;
  materials: string;
  care: string;
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  customizable: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResult {
  items: ApiProduct[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductListParams {
  category?: string;
  collection?: string;
  q?: string;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating';
  maxPrice?: number;
  customizable?: boolean;
  page?: number;
  limit?: number;
}

// ── Normalise API product → frontend Product type ──────────────────────────

import type { Product } from '../types';

export function normalizeProduct(p: ApiProduct): Product {
  const cat = p.category as ApiCategory;
  const catSlug   = typeof cat === 'object' && cat ? cat.slug       : (p.category as string);
  const catName   = typeof cat === 'object' && cat ? cat.name       : catSlug;
  const catColl   = typeof cat === 'object' && cat ? cat.collection : catSlug;
  const primary   = p.images?.[0] ?? '';

  return {
    id:            p._id,
    slug:          p.slug,
    name:          p.name,
    category:      catSlug,
    categoryLabel: catName,
    collection:    catColl,
    price:         p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    originalPrice:  p.compareAtPrice ?? undefined,
    image:          primary,
    images:         p.images ?? [],
    description:    p.description,
    materials:      p.materials,
    care:           p.care,
    featured:       p.featured,
    isFeatured:     p.featured,
    bestseller:     p.bestseller,
    isNew:          p.isNew,
    customizable:   p.customizable,
    customization:  p.customizable
      ? { colors: ['Rose', 'Cream', 'Sage', 'Ivory'], textAllowed: true }
      : undefined,
    stock:          p.stock,
    rating:         p.rating,
    reviewCount:    p.reviewCount,
  };
}

// ── Auth token helper ─────────────────────────────────────────────────────
// The mock auth stores a token in localStorage. We forward it as Bearer so
// the real backend JWT middleware can authenticate admin mutations.

function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem('tcn_session');
    const session = raw ? JSON.parse(raw) : null;
    if (session?.token) return { Authorization: `Bearer ${session.token}` };
  } catch { /* ignore */ }
  return {};
}

// ── Core fetch helper ──────────────────────────────────────────────────────

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  return q.toString() ? `?${q.toString()}` : '';
}

// ── Public API ─────────────────────────────────────────────────────────────

export const productApi = {
  async list(params: ProductListParams = {}): Promise<ProductListResult> {
    const qs = buildQuery({ ...params, customizable: params.customizable ? '1' : undefined });
    return apiFetch<ProductListResult>(`/products${qs}`);
  },

  async getBySlug(slug: string): Promise<ApiProduct> {
    const data = await apiFetch<{ product: ApiProduct }>(`/products/${slug}`);
    return data.product;
  },

  async listCategories(): Promise<ApiCategory[]> {
    const data = await apiFetch<{ categories: ApiCategory[] }>('/products/categories');
    return data.categories;
  },

  // Admin-only mutations
  async create(body: Record<string, unknown>): Promise<ApiProduct> {
    const data = await apiFetch<{ product: ApiProduct }>('/products', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return data.product;
  },

  async update(id: string, body: Record<string, unknown>): Promise<ApiProduct> {
    const data = await apiFetch<{ product: ApiProduct }>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return data.product;
  },

  async remove(id: string): Promise<void> {
    await apiFetch<void>(`/products/${id}`, { method: 'DELETE' });
  },
};
