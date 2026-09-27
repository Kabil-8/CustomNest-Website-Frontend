export function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function classNames(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(' ');
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function estimateDelivery(fromISO: string, days = 7): string {
  const d = new Date(fromISO);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Returns the 7–10 days preparation & handcrafting dispatch window from order date
 */
export function getHandcraftingWindow(fromISO: string): {
  minDateStr: string;
  maxDateStr: string;
  rangeText: string;
} {
  const start = new Date(fromISO);
  const minD = new Date(start);
  minD.setDate(minD.getDate() + 7);
  const maxD = new Date(start);
  maxD.setDate(maxD.getDate() + 10);

  const minDateStr = minD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const maxDateStr = maxD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return {
    minDateStr,
    maxDateStr,
    rangeText: `${minDateStr} – ${maxDateStr}`,
  };
}

const BACKEND_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/api\/?$/, '');

export function getImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/uploads')) {
    return `${BACKEND_BASE}${cleanPath}`;
  }
  return cleanPath;
}

export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Failed to fetch image');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = filename;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
