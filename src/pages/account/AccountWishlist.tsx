import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../lib/utils';
import { EmptyState } from '../../components/ui';

export default function AccountWishlist() {
  const { ids, toggle } = useWishlist();
  const { addItem } = useCart();
  const { products: allProducts } = useProducts({ limit: 100 });
  const products = allProducts.filter((p) => ids.includes(p.id));

  if (products.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<Heart size={28} />}
          title="Save pieces you love and find them here later."
          description="Tap the heart icon on any product to add it to your wishlist."
          action={
            <Link to="/shop" className="btn-primary">
              Explore Products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {products.map((p) => (
        <div key={p.id} className="card p-4 flex gap-4">
          <Link to={`/products/${p.slug}`} className="shrink-0">
            <img src={p.image} alt={p.name} className="w-24 h-24 rounded-xl object-cover bg-ivory" />
          </Link>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/products/${p.slug}`} className="font-medium text-sm leading-snug hover:text-rose-600 line-clamp-2">
                {p.name}
              </Link>
              <button onClick={() => toggle(p.id, p.name)} aria-label="Remove from wishlist" className="text-muted hover:text-danger shrink-0">
                <X size={15} />
              </button>
            </div>
            <p className="text-xs text-muted mt-1">{p.stock === 0 ? 'Out of stock' : 'In stock'}</p>
            <div className="flex items-center justify-between mt-auto pt-2">
              <span className="font-semibold text-sm">{formatPrice(p.price)}</span>
              <button
                onClick={() => addItem(p, 1)}
                disabled={p.stock === 0}
                className="btn-primary !py-1.5 !px-3 !text-xs disabled:bg-muted"
              >
                <ShoppingBag size={13} /> Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
