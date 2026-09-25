import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, Palette } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';
import { Breadcrumb, EmptyState } from '../components/ui';

const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 50;

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [cartNotes, setCartNotes] = useState<string>(() => {
    try {
      return localStorage.getItem('tcn_order_notes') || '';
    } catch {
      return '';
    }
  });
  const shipping = items.length === 0 || subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  return (
    <div className="container-nest py-10">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <EmptyState
          title="Your nest is waiting for something special."
          description="Browse our handmade collection and add a few favourites to your cart."
          action={
            <Link to="/shop" className="btn-primary">
              Continue Shopping
            </Link>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          <div className="flex flex-col gap-5">
            {items.map((item) => (
              <div key={item.id} className="card flex gap-4 p-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shrink-0 bg-ivory"
                />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/products/${item.product.slug}`} className="font-display text-lg hover:text-rose-600">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">{item.product.categoryLabel}</p>
                      {item.customization && (
                        <p className="text-xs text-muted mt-1">
                          {[item.customization.yarnType, item.customization.resinOption ? `Setup: ${item.customization.resinOption}` : null, item.customization.color, item.customization.size, item.customization.personalization]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.product.name}`}
                      className="text-muted hover:text-danger shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <div className="flex items-center border border-line rounded-full">
                      <button
                        className="w-8 h-8 flex items-center justify-center text-muted hover:text-charcoal"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-sm w-7 text-center">{item.quantity}</span>
                      <button
                        className="w-8 h-8 flex items-center justify-center text-muted hover:text-charcoal"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Customization & Color Notes */}
            <div className="card p-5 bg-rose-50/40 border border-rose-200/80 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                  <Palette size={15} className="text-rose-600" />
                  <span>Product Customization & Color Notes</span>
                </div>
                <span className="text-[0.65rem] text-rose-600 font-semibold bg-rose-100/70 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Mention any colour combinations, flower yarn shades, or custom monogram name details for your order. You can also edit this at checkout.
              </p>
              <textarea
                rows={2}
                value={cartNotes}
                onChange={(e) => {
                  setCartNotes(e.target.value);
                  try {
                    localStorage.setItem('tcn_order_notes', e.target.value);
                  } catch {}
                }}
                placeholder="e.g. Please use Soft Pink petals with Milk White wrap. Monogram name: 'Priya'"
                className="input text-xs py-2 bg-white border-rose-200 focus:border-rose-400 focus:ring-rose-200"
              />
            </div>
          </div>

          <div className="card p-6 h-fit sticky top-24">
            <h2 className="font-display text-xl mb-5">Order Summary</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="text-charcoal font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span className="text-charcoal font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                  Add {formatPrice(SHIPPING_THRESHOLD - subtotal)} more for free shipping.
                </p>
              )}
              <div className="border-t border-line pt-3 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full mt-6">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/shop" className="btn-tertiary w-full justify-center mt-4 text-sm">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
