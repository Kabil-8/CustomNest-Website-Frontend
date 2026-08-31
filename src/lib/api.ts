// ---------------------------------------------------------------------------
// lib/api.ts — Backend HTTP client.
// Auth, orders, addresses, wishlist, cart all talk to the real Express API.
// No more localStorage mock data — everything persists in MongoDB.
// ---------------------------------------------------------------------------
import type { Address, CustomOrderMessage, CustomOrderRequest, Order, OrderStatus, User } from '../types';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000') + '/api';

// ── helpers ─────────────────────────────────────────────────────────────────

class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('tcn_token');
    return raw ?? null;
  } catch { return null; }
}
function setToken(t: string) { localStorage.setItem('tcn_token', t); }
function clearToken()        { localStorage.removeItem('tcn_token'); }

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.message ?? `API error ${res.status}`, res.status);
  return body as T;
}

// ── Session shape ────────────────────────────────────────────────────────────

export interface Session {
  user: User;
  token: string;
}

// Keep a tiny in-memory cache so components can read getSession() synchronously.
let _session: Session | null = null;

function hydrateSession(raw: { user: Record<string, unknown>; token: string }): Session {
  const session: Session = { user: rawUserToUser(raw.user), token: raw.token };
  _session = session;
  setToken(raw.token);
  return session;
}

function rawUserToUser(u: Record<string, unknown>): User {
  return {
    id:        String(u._id ?? u.id ?? ''),
    name:      String(u.name ?? ''),
    email:     String(u.email ?? ''),
    phone:     u.phone ? String(u.phone) : undefined,
    role:      (u.role === 'admin' ? 'admin' : 'customer') as 'customer' | 'admin',
    createdAt: String(u.createdAt ?? new Date().toISOString()),
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  async register(input: { name: string; email: string; phone: string; password: string }): Promise<Session> {
    const raw = await req<{ user: Record<string,unknown>; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return hydrateSession(raw);
  },

  async login(email: string, password: string): Promise<Session> {
    const raw = await req<{ user: Record<string,unknown>; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return hydrateSession(raw);
  },

  async sendOtp(phone: string): Promise<{ success: boolean; message: string; otp?: string }> {
    return await req<{ success: boolean; message: string; otp?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  async verifyOtp(phone: string, otp: string, name?: string): Promise<Session> {
    const raw = await req<{ user: Record<string, unknown>; token: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name }),
    });
    return hydrateSession(raw);
  },

  async googleLogin(data: { credential?: string; email?: string; name?: string; sub?: string; picture?: string }): Promise<Session> {
    const raw = await req<{ user: Record<string,unknown>; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return hydrateSession(raw);
  },


  async adminLogin(email: string, password: string): Promise<Session> {
    const raw = await req<{ user: Record<string,unknown>; token: string }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return hydrateSession(raw);
  },

  async logout(): Promise<void> {
    await req('/auth/logout', { method: 'POST' }).catch(() => {});
    _session = null;
    clearToken();
  },

  getSession(): Session | null {
    // On app startup, try to restore from token by checking /auth/me
    return _session;
  },

  async restoreSession(): Promise<Session | null> {
    if (!getToken()) return null;
    try {
      const raw = await req<{ user: Record<string,unknown> }>('/auth/me');
      // Reuse stored token since /me doesn't return a new one
      const token = getToken()!;
      const session: Session = { user: rawUserToUser(raw.user), token };
      _session = session;
      return session;
    } catch {
      clearToken();
      _session = null;
      return null;
    }
  },

  async updateProfile(userId: string, patch: Partial<Pick<User, 'name' | 'phone'>>): Promise<User> {
    const raw = await req<{ user: Record<string,unknown> }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    const user = rawUserToUser(raw.user);
    if (_session) _session = { ..._session, user };
    return user;
  },

  async listCustomers(): Promise<User[]> {
    const raw = await req<{ customers: Record<string,unknown>[] }>('/admin/customers');
    return raw.customers.map(rawUserToUser);
  },

  async getDashboard(): Promise<{
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    completedOrders: number;
    lowStock: Record<string, unknown>[];
  }> {
    return req('/admin/dashboard');
  },
};

// ── Addresses ────────────────────────────────────────────────────────────────

function rawAddressToAddress(a: Record<string, unknown>): Address {
  return {
    id: String(a._id ?? a.id ?? ''),
    fullName: String(a.fullName ?? ''),
    phone: String(a.phone ?? ''),
    line1: String(a.line1 ?? ''),
    city: String(a.city ?? ''),
    state: String(a.state ?? ''),
    postalCode: String(a.postalCode ?? ''),
    country: String(a.country ?? 'India'),
    isDefault: Boolean(a.isDefault),
  };
}

export const addresses = {
  async list(_userId: string): Promise<Address[]> {
    const data = await req<{ addresses: Record<string, unknown>[] }>('/addresses');
    return (data.addresses ?? []).map(rawAddressToAddress);
  },
  async save(_userId: string, address: Omit<Address, 'id'>): Promise<Address> {
    const data = await req<{ address: Record<string, unknown> }>('/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
    return rawAddressToAddress(data.address);
  },
  async remove(_userId: string, addressId: string): Promise<void> {
    await req(`/addresses/${addressId}`, { method: 'DELETE' });
  },
};


// ── Orders ────────────────────────────────────────────────────────────────────

export const orders = {
  async create(order: Omit<Order, 'id' | 'createdAt' | 'status' | 'paymentStatus'>): Promise<Order> {
    const data = await req<{ order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    return data.order;
  },
  async listForUser(_userId: string): Promise<Order[]> {
    const data = await req<{ orders: Order[] }>('/orders/my');
    return data.orders ?? [];
  },
  async listAll(): Promise<Order[]> {
    const data = await req<{ orders: Order[] }>('/orders');
    return data.orders ?? [];
  },
  async getById(orderId: string): Promise<{ order: Order; customOrderMessages?: CustomOrderMessage[] } | null> {
    try {
      const data = await req<{ order: Order; customOrderMessages?: CustomOrderMessage[] }>(`/orders/my/${orderId}`);
      return data;
    } catch { return null; }
  },

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    details?: {
      estimatedDeliveryDate?: string;
      trackingNumber?: string;
      courierPartner?: string;
    }
  ): Promise<Order> {
    const data = await req<{ order: Order }>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...details }),
    });
    return data.order;
  },
  async remove(orderId: string): Promise<void> {
    await req(`/orders/${orderId}`, { method: 'DELETE' });
  },
};

// ── Custom Orders ─────────────────────────────────────────────────────────────

export const customOrders = {
  async submit(input: Omit<CustomOrderRequest, 'id' | 'status' | 'createdAt' | 'adminReply' | 'repliedAt' | 'messages'>): Promise<CustomOrderRequest> {
    const data = await req<{ request: CustomOrderRequest }>('/custom-orders', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return data.request;
  },
  async listMy(): Promise<CustomOrderRequest[]> {
    const data = await req<{ requests: CustomOrderRequest[] }>('/custom-orders/my');
    return data.requests ?? [];
  },
  async listAll(): Promise<CustomOrderRequest[]> {
    const data = await req<{ requests: CustomOrderRequest[] }>('/custom-orders');
    return data.requests;
  },
  async updateStatus(
    id: string,
    status: CustomOrderRequest['status'],
    agreedPrice?: number
  ): Promise<CustomOrderRequest> {
    const data = await req<{ request: CustomOrderRequest }>(`/custom-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, agreedPrice }),
    });
    return data.request;
  },
  async adminSendMessage(id: string, text: string, status?: CustomOrderRequest['status'], agreedPrice?: number): Promise<CustomOrderRequest> {
    const data = await req<{ request: CustomOrderRequest }>(`/custom-orders/${id}/admin-message`, {
      method: 'POST',
      body: JSON.stringify({
        text,
        ...(status      ? { status }      : {}),
        ...(agreedPrice !== undefined ? { agreedPrice } : {}),
      }),
    });
    return data.request;
  },
  async customerSendMessage(id: string, text: string): Promise<CustomOrderRequest> {
    const data = await req<{ request: CustomOrderRequest }>(`/custom-orders/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return data.request;
  },
  async createOrderFromCustomRequest(id: string, address: {
    fullName: string; phone: string; line1: string;
    city: string; state: string; postalCode: string; country: string;
  }): Promise<Order> {
    const data = await req<{ order: Order }>(`/custom-orders/${id}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
    return data.order;
  },
  async remove(id: string): Promise<void> {
    await req(`/custom-orders/${id}`, { method: 'DELETE' });
  },
};

// ── Wishlist (stored per-user in DB via /wishlist) ────────────────────────────

export const wishlistStore = {
  get(_userId: string): string[] {
    // Fallback: wishlist IDs are synced to DB on toggle; read from local cache
    try { return JSON.parse(localStorage.getItem('tcn_wl') ?? '[]'); } catch { return []; }
  },
  set(_userId: string, ids: string[]) {
    localStorage.setItem('tcn_wl', JSON.stringify(ids));
  },
};

// ── Cart (local until checkout) ───────────────────────────────────────────────

export const cartStore = {
  get<T>(userId: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`tcn_cart_${userId}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  set<T>(userId: string, value: T) {
    localStorage.setItem(`tcn_cart_${userId}`, JSON.stringify(value));
  },
};

export const payment = {
  async createRazorpayOrder(amount: number, orderId?: string): Promise<{ id: string; amount: number; currency: string; key: string; isDemo?: boolean }> {
    return req('/payment/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, orderId }),
    });
  },

  async verifyRazorpayPayment(data: { orderId?: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature?: string }): Promise<{ success: boolean; message: string; order?: Order }> {
    return req('/payment/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const admin = {
  async getBadgeCounts(): Promise<{ orders: number; customOrders: number; messages: number; reviews: number }> {
    return req<{ orders: number; customOrders: number; messages: number; reviews: number }>('/admin/badge-counts');
  },
};

export { ApiError };

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface ApiReview {
  _id: string;
  product: { _id: string; name: string; slug: string; images: string[] } | string;
  user: { _id: string; name: string; email?: string } | string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
}

export const reviews = {
  // Public: get approved reviews for a product
  async listForProduct(productId: string): Promise<ApiReview[]> {
    const data = await req<{ reviews: ApiReview[] }>(`/reviews/product/${productId}`);
    return data.reviews ?? [];
  },

  // Customer: submit a review
  async submit(productId: string, rating: number, comment: string): Promise<ApiReview> {
    const data = await req<{ review: ApiReview }>(`/reviews/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
    return data.review;
  },

  // Admin: list all reviews
  async listAll(): Promise<ApiReview[]> {
    const data = await req<{ reviews: ApiReview[] }>('/reviews');
    return data.reviews ?? [];
  },

  // Admin: approve or unapprove
  async setApproved(id: string, approved: boolean): Promise<ApiReview> {
    const data = await req<{ review: ApiReview }>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ approved }),
    });
    return data.review;
  },

  // Admin: delete
  async remove(id: string): Promise<void> {
    await req(`/reviews/${id}`, { method: 'DELETE' });
  },
};


// ── Expenses (raw material purchases) ────────────────────────────────────────

export interface Expense {
  _id: string;
  materialName: string;
  category: 'yarn' | 'thread' | 'fabric' | 'stuffing' | 'hooks_needles' | 'packaging' | 'dyes' | 'other';
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplier: string;
  notes: string;
  purchasedAt: string;
  createdAt: string;
}

export interface ExpensesStats {
  totalRevenue: number;
  deliveredRevenue: number;
  totalItemsSold: number;
  totalExpenses: number;
  netProfit: number;
  byCategory: Record<string, number>;
  monthlyExpenses: { _id: { year: number; month: number }; total: number; count: number }[];
  monthlyRevenue: { _id: { year: number; month: number }; total: number; orders: number }[];
  mom: {
    revenue: number;
    items: number;
    expenses: number;
    revenueThisMonth: number;
    expensesThisMonth: number;
    itemsThisMonth: number;
  };
}

export interface CreateExpenseInput {
  materialName: string;
  category: Expense['category'];
  quantity: number;
  unit: string;
  unitCost: number;
  supplier?: string;
  notes?: string;
  purchasedAt?: string;
}

export const expenses = {
  async getStats(): Promise<ExpensesStats> {
    return req<ExpensesStats>('/admin/expenses/stats');
  },

  async list(page = 1, category?: string): Promise<{ expenses: Expense[]; total: number; pages: number }> {
    const qs = new URLSearchParams({ page: String(page), limit: '20' });
    if (category) qs.set('category', category);
    return req(`/admin/expenses?${qs.toString()}`);
  },

  async create(input: CreateExpenseInput): Promise<Expense> {
    const data = await req<{ expense: Expense }>('/admin/expenses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return data.expense;
  },

  async remove(id: string): Promise<void> {
    await req(`/admin/expenses/${id}`, { method: 'DELETE' });
  },
};

// ── Contact Messages (Inquiries) ─────────────────────────────────────────────

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'Unread' | 'Read' | 'Replied';
  createdAt: string;
  updatedAt: string;
}

export const contact = {
  // Public: Send a contact message
  async submit(data: { name: string; email: string; subject?: string; message: string }): Promise<ContactMessage> {
    const res = await req<{ contactMessage: ContactMessage }>('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.contactMessage;
  },

  // Admin: List all contact inquiries
  async listAll(status?: string, q?: string): Promise<ContactMessage[]> {
    const qs = new URLSearchParams();
    if (status && status !== 'all') qs.set('status', status);
    if (q) qs.set('q', q);
    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await req<{ messages: ContactMessage[] }>(`/contact${queryStr}`);
    return res.messages ?? [];
  },

  // Admin: Update status (Read, Replied, Unread)
  async updateStatus(id: string, status: 'Unread' | 'Read' | 'Replied'): Promise<ContactMessage> {
    const res = await req<{ message: ContactMessage }>(`/contact/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.message;
  },

  // Admin: Delete a contact message
  async remove(id: string): Promise<void> {
    await req(`/contact/${id}`, { method: 'DELETE' });
  },
};

