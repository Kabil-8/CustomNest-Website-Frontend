import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, Palette } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { listActiveColors, type ApiColor } from '../lib/productApi';
import { formatPrice } from '../lib/utils';
import { Breadcrumb, EmptyState } from '../components/ui';

const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 50;

export default function Cart() {
  const { items, updateQuantity, updateCustomization, removeItem, subtotal } = useCart();
  const [availableColors, setAvailableColors] = useState<ApiColor[]>([]);

  useEffect(() => {
    listActiveColors()
      .then(setAvailableColors)
      .catch(() => {});
  }, []);

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
            {items.map((item) => {
              const itemColor = item.customization?.color || '';
              const itemColorsList =
                item.product.availableColors && item.product.availableColors.length > 0
                  ? item.product.availableColors
                  : availableColors;

              const handleAppendColor = (colorName: string) => {
                const trimmed = (item.customization?.color || '').trim();
                const next = trimmed ? `${trimmed}, ${colorName}` : colorName;
                updateCustomization(item.id, { color: next });
              };

              return (
                <div key={item.id} className="card p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex gap-4">
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
                            <p className="text-xs text-rose-600 font-medium mt-1">
                              {[
                                item.customization.yarnType ? (item.customization.yarnType === 'normal' ? 'Normal Yarn' : 'Acrylic Yarn') : null,
                                item.customization.resinOption ? `Setup: ${item.customization.resinOption}` : null,
                                item.customization.size ? `Size: ${item.customization.size}` : null,
                                item.customization.personalization ? `Name: ${item.customization.personalization}` : null,
                              ]
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

                  {/* Per-Product Colour Preference & Custom Notes */}
                  <div className="rounded-xl bg-rose-50/50 border border-rose-200/80 p-3 sm:p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                        <Palette size={14} className="text-rose-600 shrink-0" />
                        <span>Colour Preference & Notes for this Product</span>
                      </div>
                      <span className="text-[0.62rem] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Per Item
                      </span>
                    </div>

                    <p className="text-[11px] text-charcoal/80 leading-relaxed">
                      Mention your preferred colours & expectations for this item (e.g. flower petals, center, wrap or theme).
                    </p>

                    {/* Quick Color Swatches */}
                    {itemColorsList.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted">
                          <span className="font-semibold text-charcoal uppercase tracking-wider">Available Colours</span>
                          <span>Click to add</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {itemColorsList.map((c: any) => (
                            <button
                              key={c._id || c.id || c.name}
                              type="button"
                              onClick={() => handleAppendColor(c.name)}
                              title={`Add "${c.name}" to notes`}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white border border-rose-200/70 hover:border-rose-400 hover:bg-rose-50 shadow-2xs transition cursor-pointer"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: c.hexCode }}
                              />
                              <span className="text-charcoal">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Input for this product's colour preference */}
                    <div>
                      <textarea
                        rows={2}
                        value={itemColor}
                        onChange={(e) => updateCustomization(item.id, { color: e.target.value })}
                        placeholder={
                          item.quantity > 1
                            ? 'e.g. 1st in Soft Pink (#4), 2nd in Sky Blue (#18)'
                            : 'e.g. Petals in Soft Pink (#4) and center in Cream White (#12)'
                        }
                        className="input text-xs py-2 px-2.5 bg-white border-rose-200 focus:border-rose-400 focus:ring-rose-200 w-full"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
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
