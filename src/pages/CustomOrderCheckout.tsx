import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, CreditCard, Smartphone, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { addresses as addressApi, customOrders as customOrderApi, payment as paymentApi } from '../lib/api';
import { formatPrice, classNames } from '../lib/utils';
import type { Address, CustomOrderRequest } from '../types';
import { Breadcrumb, Spinner } from '../components/ui';

const STEPS = ['Address', 'Review', 'Payment'];

export default function CustomOrderCheckout() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [request, setRequest] = useState<CustomOrderRequest | null>(null);
  const [loadingReq, setLoadingReq] = useState(true);

  const [step, setStep] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({
    fullName: user?.name ?? '', phone: user?.phone ?? '',
    line1: '', city: '', state: '', postalCode: '', country: 'India',
  });
  const [payMethod, setPayMethod] = useState<'razorpay'>('razorpay');
  const [placing, setPlacing] = useState(false);

  // Load the custom order request
  useEffect(() => {
    if (!id) return;
    customOrderApi.listMy()
      .then((list) => {
        const found = list.find((r) => r.id === id);
        setRequest(found ?? null);
      })
      .finally(() => setLoadingReq(false));
  }, [id]);

  // Load saved addresses
  useEffect(() => {
    if (!user) return;
    addressApi.list(user.id).then((list) => {
      setSavedAddresses(list);
      const def = list.find((a) => a.isDefault) ?? list[0];
      if (def) setSelectedAddressId(def.id);
      else setShowNewAddress(true);
    });
  }, [user]);

  if (loadingReq) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={28} className="animate-spin text-rose-400" />
    </div>
  );

  if (!request || request.status !== 'Accepted' || !request.agreedPrice) {
    return (
      <div className="container-nest py-20 text-center space-y-4">
        <Sparkles size={32} className="text-rose-400 mx-auto" />
        <h2 className="font-display text-2xl text-charcoal">Order not ready for payment</h2>
        <p className="text-muted text-sm">This custom order has not been accepted yet or has no agreed price.</p>
        <Link to="/account/custom-orders" className="btn-primary inline-flex">Back to Custom Orders</Link>
      </div>
    );
  }

  const total = request.agreedPrice;
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

  const loadRazorpay = (): Promise<boolean> => new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const placeOrder = async () => {
    if (!user || !selectedAddress || !id) return;
    setPlacing(true);
    try {
      // Create the real Order from the custom request
      const order = await customOrderApi.createOrderFromCustomRequest(id, {
        fullName: selectedAddress.fullName,
        phone: selectedAddress.phone,
        line1: selectedAddress.line1,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
      });

      if (payMethod === 'razorpay') {
        const loaded = await loadRazorpay();
        if (loaded && (window as any).Razorpay) {
          const rzpData = await paymentApi.createRazorpayOrder(total, order.id);
          const options = {
            key: rzpData.key,
            amount: rzpData.amount,
            currency: rzpData.currency,
            name: 'TheCustomNest',
            description: `Custom: ${request.productType}`,
            order_id: rzpData.id,
            prefill: { name: user.name, email: user.email, contact: selectedAddress.phone },
            theme: { color: '#F43F5E' },
            handler: async (response: any) => {
              try {
                await paymentApi.verifyRazorpayPayment({
                  orderId: order.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                show('Payment confirmed! Your custom order is now in progress.', 'success');
                navigate(`/order-confirmation/${order.id}`);
              } catch {
                show('Payment done but verification failed. Contact support.', 'error');
              }
            },
            modal: { ondismiss: () => { setPlacing(false); } },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', () => {
            show('Payment failed. Please try again.', 'error');
            setPlacing(false);
          });
          rzp.open();
          return;
        }
      }

      // COD
      show('Order placed! Pay on delivery.', 'success');
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Something went wrong. Please try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container-nest py-10">
      <Breadcrumb items={[
        { label: 'Home', to: '/' },
        { label: 'Custom Orders', to: '/account/custom-orders' },
        { label: 'Checkout' },
      ]} />
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Custom Order Checkout</h1>
      <p className="text-muted text-sm mb-8">
        <Sparkles size={13} className="inline text-rose-500 mr-1" />
        {request.productType} &middot; Agreed price: <strong>Rs.{total.toLocaleString('en-IN')}</strong>
      </p>

      {/* stepper */}
      <div className="flex items-center gap-3 mb-10 max-w-md">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={classNames(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                i <= step ? 'bg-rose-500 text-white' : 'bg-line text-muted'
              )}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className={classNames('text-sm font-medium hidden sm:inline', i === step ? 'text-charcoal' : 'text-muted')}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={classNames('flex-1 h-[2px]', i < step ? 'bg-rose-500' : 'bg-line')} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-10">
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>

          {/* Step 0: Address */}
          {step === 0 && (
            <div className="bg-white rounded-3xl border border-line shadow-soft p-6 sm:p-8">
              <h2 className="font-display text-xl mb-5">Delivery Address</h2>
              {savedAddresses.length > 0 && !showNewAddress && (
                <div className="flex flex-col gap-3 mb-5">
                  {savedAddresses.map((a) => (
                    <label key={a.id} className={classNames(
                      'flex items-start gap-3 border rounded-2xl p-4 cursor-pointer transition-colors',
                      selectedAddressId === a.id ? 'border-rose-400 bg-rose-50' : 'border-line hover:border-rose-200'
                    )}>
                      <input type="radio" name="addr" checked={selectedAddressId === a.id}
                        onChange={() => setSelectedAddressId(a.id)}
                        className="mt-1 text-rose-500" />
                      <div className="text-sm">
                        <p className="font-semibold">{a.fullName}</p>
                        <p className="text-muted">{a.line1}, {a.city}, {a.state} {a.postalCode}</p>
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
                  {[
                    { key: 'fullName', label: 'Full Name' },
                    { key: 'phone',    label: 'Phone' },
                    { key: 'line1',    label: 'Address', span: true },
                    { key: 'city',     label: 'City' },
                    { key: 'state',    label: 'State' },
                    { key: 'postalCode', label: 'Postal Code' },
                    { key: 'country',  label: 'Country' },
                  ].map(({ key, label, span }) => (
                    <div key={key} className={span ? 'sm:col-span-2' : ''}>
                      <label className="label">{label} <span className="text-rose-500">*</span></label>
                      <input
                        className="input"
                        value={(addrForm as any)[key]}
                        onChange={(e) => setAddrForm({ ...addrForm, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleAddressNext} className="btn-primary mt-6">
                Continue to Review
              </button>
            </div>
          )}

          {/* Step 1: Review */}
          {step === 1 && selectedAddress && (
            <div className="bg-white rounded-3xl border border-line shadow-soft p-6 sm:p-8">
              <h2 className="font-display text-xl mb-5">Review Your Custom Order</h2>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 flex gap-4">
                {request.referenceImage && (
                  <img src={request.referenceImage} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                )}
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-charcoal">{request.productType}</p>
                  {request.colors   && <p className="text-muted">Colors: {request.colors}</p>}
                  {request.size     && <p className="text-muted">Size: {request.size}</p>}
                  {request.quantity > 1 && <p className="text-muted">Qty: {request.quantity}</p>}
                  <p className="text-muted text-xs leading-relaxed mt-1">{request.description}</p>
                </div>
              </div>
              <div className="border-t border-line pt-4 text-sm">
                <p className="font-semibold mb-1">Delivering to</p>
                <p className="text-muted">
                  {selectedAddress.fullName} &middot; {selectedAddress.line1}, {selectedAddress.city},{' '}
                  {selectedAddress.state} {selectedAddress.postalCode} &middot; {selectedAddress.phone}
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="btn-secondary">Back</button>
                <button onClick={() => setStep(2)} className="btn-primary">Continue to Payment</button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-3xl border border-line shadow-soft p-6 sm:p-8">
              <h2 className="font-display text-xl mb-5">Payment</h2>
              <div className="flex flex-col gap-3 mb-6">
                {[
                  { id: 'razorpay', label: 'Razorpay Secure Payment', icon: CreditCard,
                    hint: 'Cards, UPI, Netbanking, Wallets', badge: 'RECOMMENDED' },
                ].map(({ id: pid, label, icon: Icon, hint, badge }) => (
                  <label key={pid} className={classNames(
                    'flex items-center justify-between border rounded-2xl p-4 cursor-pointer transition-all',
                    payMethod === pid ? 'border-rose-500 bg-rose-50/60 shadow-soft' : 'border-line hover:border-rose-200'
                  )}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="pay" checked={payMethod === pid}
                        onChange={() => setPayMethod(pid as typeof payMethod)}
                        className="text-rose-500" />
                      <Icon size={20} className={payMethod === pid ? 'text-rose-600' : 'text-muted'} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{label}</p>
                          {badge && (
                            <span className="bg-rose-500 text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full">
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
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                <button onClick={placeOrder} disabled={placing} className="btn-primary flex-1 py-3.5">
                  {placing && <Spinner size={16} />}
                  {payMethod === 'razorpay'
                    ? `Pay Rs.${total.toLocaleString('en-IN')} with Razorpay`
                    : `Place Order · Rs.${total.toLocaleString('en-IN')}`
                  }
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* order summary sidebar */}
        <div className="bg-white rounded-3xl border border-line shadow-soft p-6 h-fit">
          <h2 className="font-display text-lg mb-4">Order Summary</h2>
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-muted">
              <span>Custom — {request.productType}</span>
              <span className="text-charcoal font-medium">Rs.{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span className="text-emerald-600 font-medium">Free</span>
            </div>
            <div className="border-t border-line pt-2.5 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>Rs.{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-line text-xs text-muted space-y-1">
            {request.colors   && <p>Colors: {request.colors}</p>}
            {request.deadline && <p>Deadline: {request.deadline}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
