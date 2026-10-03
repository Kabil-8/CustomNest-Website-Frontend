import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Sparkles, ArrowRight } from 'lucide-react';

export function AnnouncementBar() {
  return (
    <aside
      aria-label="Promotion"
      className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 text-white text-xs py-2 px-3 relative z-[75] shadow-xs select-none"
    >
      <div className="container-nest flex items-center justify-center gap-2 text-center flex-wrap">
        <span className="inline-flex items-center gap-1.5 font-medium tracking-wide">
          <Truck size={14} className="animate-pulse text-amber-300 shrink-0" />
          <span>
            Special Offer: <strong className="font-bold text-white underline decoration-amber-300 decoration-2 underline-offset-2">Shop above ₹799 for FREE Shipping!</strong>
          </span>
          <span className="hidden md:inline text-rose-200">| Handcrafted Pan-India Delivery</span>
        </span>

        <Link
          to="/shop"
          className="inline-flex items-center gap-1 font-semibold text-amber-200 hover:text-white transition-colors underline underline-offset-4 ml-1 text-[0.72rem] md:text-xs"
        >
          <span>Shop Now</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </aside>
  );
}
