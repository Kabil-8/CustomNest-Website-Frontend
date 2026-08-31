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
