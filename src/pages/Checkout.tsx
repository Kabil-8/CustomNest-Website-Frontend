import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, CreditCard, Smartphone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addresses as addressApi, orders as ordersApi } from '../lib/api';
import { formatPrice, classNames } from '../lib/utils';
import type { Address } from '../types';
import { Breadcrumb, Spinner, EmptyState } from '../components/ui';
import { useToast } from '../context/ToastContext';

const STEPS = ['Address', 'Review', 'Payment'];
const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 50;

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({
    fullName: user?.name ?? '',
    phone: user?.phone ?? '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [payMethod, setPayMethod] = useState<'upi-qr'>('upi-qr');
  const [placing, setPlacing] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  useEffect(() => {
    if (!user) return;
    addressApi.list(user.id).then((list) => {
      setSavedAddresses(list);
      const def = list.find((a) => a.isDefault) ?? list[0];
      if (def) setSelectedAddressId(def.id);
      else setShowNewAddress(true);
    });
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="container-nest py-20">
        <EmptyState
          title="Your cart is empty"
          description="Add a few handmade pieces to your cart before checking out."
          action={
            <Link to="/shop" className="btn-primary">
              Shop Now
            </Link>
          }
        />
      </div>
    );
  }

  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  const handleAddressNext = async () => {
    if (!user) return;
    if (showNewAddress || !selectedAddress) {
      if (!addrForm.fullName || !addrForm.phone || !addrForm.line1 || !addrForm.city || !addrForm.postalCode) {
        show('Please fill in all required address fields.', 'error');
        return;
      }
      const saved = await addressApi.save(user.id, { ...addrForm, isDefault: savedAddresses.length === 0 });
      setSavedAddresses((prev) => [...prev, saved]);
      setSelectedAddressId(saved.id);
      setShowNewAddress(false);
    }
    setStep(1);
  };

  const placeOrder = async () => {
    if (!user || !selectedAddress) return;
    setPlacing(true);
    try {
      const order = await ordersApi.create({
        userId: user.id,
        items: items.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          image: i.product.image,
          price: i.product.price,
          quantity: i.quantity,
          customization: i.customization,
        })),
        address: selectedAddress,
        subtotal,
        shipping,
        discount: 0,
        total,
        customerName: user.name,
        customerEmail: user.email,
        paymentMethod: payMethod,
      });

      // UPI QR Code - show QR and mark order as pending
      if (payMethod === 'upi-qr') {
        setPendingOrderId(order.id);
        setShowUpiQr(true);
        return;
      }

      clear();
      show('Order placed successfully!', 'success');
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Something went wrong placing your order. Please try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container-nest py-10">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center gap-3 mb-10 max-w-md">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div
                className={classNames(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  i < step ? 'bg-rose-500 text-white' : i === step ? 'bg-rose-500 text-white' : 'bg-line text-muted'
                )}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className={classNames('text-sm font-medium hidden sm:inline', i === step ? 'text-charcoal' : 'text-muted')}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={classNames('flex-1 h-[2px]', i < step ? 'bg-rose-500' : 'bg-line')} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          {step === 0 && (
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-xl mb-5">Delivery Address</h2>
              {savedAddresses.length > 0 && !showNewAddress && (
                <div className="flex flex-col gap-3 mb-5">
                  {savedAddresses.map((a) => (
                    <label
                      key={a.id}
                      className={classNames(
                        'flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-colors',
                        selectedAddressId === a.id ? 'border-rose-400 bg-rose-50' : 'border-line hover:border-rose-200'
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === a.id}
                        onChange={() => setSelectedAddressId(a.id)}
                        className="mt-1 text-rose-500 focus:ring-rose-200"
                      />
                      <div className="text-sm">
                        <p className="font-semibold">{a.fullName}</p>
                        <p className="text-muted">
                          {a.line1}, {a.city}, {a.state} {a.postalCode}
                        </p>
                        <p className="text-muted">{a.phone}</p>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => setShowNewAddress(true)} className="btn-tertiary text-sm w-fit">
                    + Add a new address
                  </button>
                </div>
              )}

              {(showNewAddress || savedAddresses.length === 0) && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name" required value={addrForm.fullName} onChange={(v) => setAddrForm({ ...addrForm, fullName: v })} />
                  <Field label="Phone" required value={addrForm.phone} onChange={(v) => setAddrForm({ ...addrForm, phone: v })} />
                  <Field className="sm:col-span-2" label="Address" required value={addrForm.line1} onChange={(v) => setAddrForm({ ...addrForm, line1: v })} />
                  <Field label="City" required value={addrForm.city} onChange={(v) => setAddrForm({ ...addrForm, city: v })} />
                  <Field label="State" required value={addrForm.state} onChange={(v) => setAddrForm({ ...addrForm, state: v })} />
                  <Field label="Postal code" required value={addrForm.postalCode} onChange={(v) => setAddrForm({ ...addrForm, postalCode: v })} />
                  <Field label="Country" required value={addrForm.country} onChange={(v) => setAddrForm({ ...addrForm, country: v })} />
                </div>
              )}

              <button onClick={handleAddressNext} className="btn-primary mt-6">
                Continue to Review
              </button>
            </div>
          )}

          {step === 1 && selectedAddress && (
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-xl mb-5">Review Your Order</h2>
              <div className="flex flex-col gap-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.product.image} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover bg-ivory" />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted">Qty {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-line pt-4">
                <p className="text-sm font-semibold mb-1">Delivering to</p>
                <p className="text-sm text-muted">
                  {selectedAddress.fullName} · {selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.state}{' '}
                  {selectedAddress.postalCode} · {selectedAddress.phone}
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="btn-secondary">
                  Back
                </button>
                <button onClick={() => setStep(2)} className="btn-primary">
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-xl mb-5">Select Payment Method</h2>
              <div className="flex flex-col gap-3 mb-6">
                {[
                  { id: 'upi-qr', label: 'UPI QR Code', icon: Smartphone, hint: 'Scan QR code to pay via any UPI app', badge: 'ONLY ONLINE PAYMENT' },
                ].map(({ id, label, icon: Icon, hint, badge }) => (
                  <label
                    key={id}
                    className={classNames(
                      'flex items-center justify-between border rounded-2xl p-4 cursor-pointer transition-all',
                      payMethod === id ? 'border-rose-500 bg-rose-50/60 shadow-soft' : 'border-line hover:border-rose-200 bg-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={payMethod === id}
                        onChange={() => setPayMethod(id as typeof payMethod)}
                        className="text-rose-500 focus:ring-rose-200"
                      />
                      <Icon size={20} className={payMethod === id ? 'text-rose-600' : 'text-muted'} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-charcoal">{label}</p>
                          {badge && (
                            <span className="bg-rose-500 text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">{hint}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="p-3 bg-ivory rounded-xl border border-line text-xs text-muted mb-6 flex items-center gap-2">
                <span className="text-emerald-600 font-bold">🔒 256-bit SSL Secure:</span>
                <span>Payments are processed with official Razorpay 256-bit encryption.</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  Back
                </button>
                <button onClick={placeOrder} disabled={placing} className="btn-primary flex-1 py-3.5">
                  {placing && <Spinner size={16} />}
                  {`Show QR Code · ${formatPrice(total)}`}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* UPI QR Code Modal */}
        {showUpiQr && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center">
              <h3 className="font-display text-xl mb-2">Scan & Pay</h3>
              <p className="text-sm text-muted mb-4">Scan the QR code with any UPI app to pay {formatPrice(total)}</p>
              <div className="bg-white p-4 rounded-2xl border border-line inline-block mb-4">
                <img src="/images/upi.jpeg" alt="UPI QR Code" className="w-48 h-48 object-contain" />
              </div>

              {/* Screenshot Upload */}
              <div className="mb-4">
                <p className="text-xs text-muted mb-2">Upload payment screenshot after paying</p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-line rounded-xl p-4 cursor-pointer hover:border-rose-400 transition-colors">
                  {paymentScreenshot ? (
                    <div className="text-sm">
                      <p className="text-rose-600 font-medium">✓ {paymentScreenshot.name}</p>
                      <p className="text-xs text-muted">Click to change</p>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-muted">Click to upload screenshot</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPaymentScreenshot(file);
                    }}
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowUpiQr(false); setPlacing(false); setPaymentScreenshot(null); }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!paymentScreenshot || !pendingOrderId) {
                      show('Please upload payment screenshot first', 'error');
                      return;
                    }
                    setUploadingScreenshot(true);
                    try {
                      // Upload screenshot to backend
                      const formData = new FormData();
                      formData.append('paymentScreenshot', paymentScreenshot);

                      const token = localStorage.getItem('tcn_token');
                      const uploadRes = await fetch(`http://localhost:5000/api/orders/${pendingOrderId}/upload-screenshot`, {
                        method: 'POST',
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        body: formData,
                        credentials: 'include',
                      });

                      if (!uploadRes.ok) {
                        throw new Error('Failed to upload screenshot');
                      }

                      clear();
                      setShowUpiQr(false);
                      setPendingOrderId(null);
                      setPaymentScreenshot(null);
                      show('Order placed! We will verify your payment.', 'success');
                      navigate(`/order-confirmation/${pendingOrderId}`);
                    } catch (err) {
                      show('Failed to upload screenshot. Please try again.', 'error');
                    } finally {
                      setUploadingScreenshot(false);
                    }
                  }}
                  disabled={!paymentScreenshot || uploadingScreenshot}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingScreenshot ? 'Uploading...' : paymentScreenshot ? 'I\'ve Paid' : 'Upload Screenshot First'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6 h-fit">
          <h2 className="font-display text-lg mb-4">Order Total</h2>
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="text-charcoal font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span className="text-charcoal font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="border-t border-line pt-2.5 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
