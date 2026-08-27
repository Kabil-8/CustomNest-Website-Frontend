import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, PackageX } from 'lucide-react';
import { classNames } from '../lib/utils';

// -- Signature element -------------------------------------------------
// A hand-stitched "running thread" divider that draws itself on scroll-in.
// Ties the brand's visual language directly back to crochet/needlework.
export function StitchDivider({ className = '', width = 220 }: { className?: string; width?: number }) {
  return (
    <svg
      viewBox={`0 0 ${width} 16`}
      width={width}
      height={16}
      className={classNames('overflow-visible', className)}
      aria-hidden="true"
    >
      <path
        d={`M2 8 Q ${width * 0.25} -4, ${width * 0.5} 8 T ${width - 2} 8`}
        fill="none"
        stroke="#C06B5C"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="6 7"
        className="motion-safe:animate-stitch"
        style={{ strokeDasharray: 400, strokeDashoffset: 0 }}
      />
      <circle cx="2" cy="8" r="2.5" fill="#C06B5C" />
      <circle cx={width - 2} cy="8" r="2.5" fill="#C06B5C" />
    </svg>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="eyebrow">
      <span className="h-1 w-1 rounded-full bg-rose-500" />
      {children}
    </span>
  );
}

export function Badge({
  children,
  tone = 'rose',
}: {
  children: React.ReactNode;
  tone?: 'rose' | 'charcoal' | 'success' | 'warning' | 'ivory';
}) {
  const tones: Record<string, string> = {
    rose: 'bg-rose-500 text-white',
    charcoal: 'bg-charcoal text-cream',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    ivory: 'bg-ivory text-rose-700 border border-rose-200',
  };
  return (
    <span className={classNames('inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide', tones[tone])}>
      {children}
    </span>
  );
}

export function Rating({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${value} out of 5`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.round(value) ? 'fill-rose-500 text-rose-500' : 'fill-line text-line'}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-muted">({count})</span>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={classNames('skeleton motion-safe:animate-shimmer rounded-xl', className)} />;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 mb-5">
        {icon ?? <PackageX size={28} />}
      </div>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-muted mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {item.to ? (
            <Link to={item.to} className="hover:text-rose-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-charcoal font-medium">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight size={12} />}
        </span>
      ))}
    </nav>
  );
}

export function Spinner({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={classNames('animate-spin', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-10" role="navigation" aria-label="Pagination">
      <button
        className="btn-secondary !px-4 !py-2 text-sm"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={classNames(
            'w-9 h-9 rounded-full text-sm font-semibold transition-colors',
            p === page ? 'bg-rose-500 text-white' : 'text-charcoal hover:bg-rose-50'
          )}
        >
          {p}
        </button>
      ))}
      <button
        className="btn-secondary !px-4 !py-2 text-sm"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
}
