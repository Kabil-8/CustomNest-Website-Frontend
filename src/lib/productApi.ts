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
  yarnType?: 'normal' | 'acrylic' | 'both';
  normalPrice?: number | null;
  acrylicPrice?: number | null;
  images: string[];
  description: string;
  materials: string;
  care: string;
  featured: boolean;
  featuredRank?: number;
  showOnHome?: boolean;
  bestseller: boolean;
  isNew: boolean;
  customizable: boolean;
  // Admin toggle: whether custom name input shows on product page
  allowCustomName?: boolean;
  // Per-product shipping override (₹). null = use global rate
  shippingCharge?: number | null;
  // Flag indicating if product is an add-on item (free shipping, suggested on product pages)
  isAddon?: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  availableColors?: { _id: string; name: string; hexCode: string; isActive: boolean }[];
  sizes?: { label: string; priceModifier: number }[];
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
  inStock?: boolean;
  minRating?: number;
  customizable?: boolean;
  home?: boolean | string | number;
  page?: number;
  limit?: number;
}

// ── Normalise API product → frontend Product type ──────────────────────────

import type { Product } from '../types';
import { CATEGORIES } from '../data/categories';

export function normalizeProduct(p: ApiProduct): Product {
  const cat = p.category as ApiCategory;
  let catSlug   = typeof cat === 'object' && cat ? cat.slug       : (p.category as string);
  let catName   = typeof cat === 'object' && cat ? cat.name       : catSlug;
  const catColl = typeof cat === 'object' && cat ? cat.collection : catSlug;

  if (catSlug === 'kids-toys-jumbo' || /jumbo kids/i.test(catName || '')) {
    catSlug = 'kids-special';
    catName = 'Kids Special';
  }
  if (catSlug === 'resin-frames' || /resin/i.test(catName || '')) {
    catName = 'Resin Photo Frames';
  }

  // If catName is just the slug or empty, look up in CATEGORIES for the official label
  if (!catName || catName === catSlug) {
    const match = CATEGORIES.find(c => c.slug.toLowerCase() === catSlug?.toLowerCase());
    if (match) {
      catName = match.name;
    }
  }

  const primary   = p.images?.[0] ?? (p as any).image ?? '';
  const prodId = p._id ? String(p._id) : String((p as any).id || '');

  return {
    id:            prodId,
    slug:          p.slug,
    name:          p.name,
    category:      catSlug,
    categoryLabel: catName,
    collection:    catColl,
    price:         p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    originalPrice:  p.compareAtPrice ?? undefined,
    image:          primary,
    images:         p.images ?? (primary ? [primary] : []),
    description:    p.description,
    materials:      p.materials,
    care:           p.care,
    featured:       p.featured,
    isFeatured:     p.featured,
    featuredRank:   p.featuredRank ?? 0,
    showOnHome:     p.showOnHome ?? false,
    bestseller:     p.bestseller,
    isNew:          p.isNew,
    customizable:   p.customizable,
    allowCustomName: p.allowCustomName ?? false,
    shippingCharge:  p.shippingCharge ?? null,
    isAddon:         Boolean(p.isAddon || (typeof p.category === 'object' && p.category?.slug === 'add-ons') || p.category === 'add-ons' || p.category === '6a7849c1abe39c4544be29d9'),
    customization:  p.customizable
      ? { colors: [], textAllowed: true }
      : undefined,
    availableColors: (p.availableColors ?? []).map((c: any) => ({
      id:     c._id ? String(c._id) : String(c.id || ''),
      name:   c.name,
      hexCode: c.hexCode,
    })),
    sizes:          p.sizes ?? [],
    stock:          p.stock,
    rating:         p.rating,
    reviewCount:    p.reviewCount,
    yarnType:       p.yarnType || 'both',
    normalPrice:    p.normalPrice ?? null,
    acrylicPrice:   p.acrylicPrice ?? null,
  };
}

// ── Auth token helper ─────────────────────────────────────────────────────
// The mock auth stores a token in localStorage. We forward it as Bearer so
// the real backend JWT middleware can authenticate admin mutations.

function getAuthHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('tcn_token');
    if (token) return { Authorization: `Bearer ${token}` };
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

  async createCategory(body: { name: string; slug?: string; collection?: string; image?: string }): Promise<ApiCategory> {
    const data = await apiFetch<{ category: ApiCategory }>('/products/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return data.category;
  },

  async updateCategory(id: string, body: Partial<{ name: string; slug: string; collection: string; image: string }>): Promise<ApiCategory> {
    const data = await apiFetch<{ category: ApiCategory }>(`/products/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return data.category;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiFetch<void>(`/products/categories/${id}`, { method: 'DELETE' });
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

  // ── Fetch all available Add-ons for product suggestions ──────────────────
  async listAddons(): Promise<Product[]> {
    try {
      const res = await productApi.list({ category: 'add-ons', limit: 20 });
      const items = res.items.map(normalizeProduct);
      if (items.length > 0) return items;
    } catch { /* fallback */ }
    try {
      const res = await productApi.list({ limit: 100 });
      return res.items.map(normalizeProduct).filter(isProductAddon);
    } catch {
      return [];
    }
  },
};

export function isProductAddon(p: { isAddon?: boolean; category?: any }): boolean {
  if (p.isAddon) return true;
  const cat = typeof p.category === 'object' ? p.category?.slug || p.category?.name || '' : String(p.category || '');
  const lower = cat.toLowerCase();
  return lower === 'add-ons' || lower === 'addon' || lower.includes('add-on') || cat === '6a7849c1abe39c4544be29d9';
}

// ── Active colors (public) — used in product customizer & custom order form ──
export interface ApiColor {
  _id: string;
  name: string;
  hexCode: string;
  isActive: boolean;
}

export async function listActiveColors(): Promise<ApiColor[]> {
  const data = await apiFetch<{ colors: ApiColor[] }>('/colors/active');
  return data.colors ?? [];
}
