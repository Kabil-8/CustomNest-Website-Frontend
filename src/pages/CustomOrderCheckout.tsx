import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Smartphone, Sparkles, Loader2, ShieldCheck, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { addresses as addressApi, customOrders as customOrderApi, orders as ordersApi } from '../lib/api';
import { classNames } from '../lib/utils';
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
  const [payMethod] = useState<'upi-qr'>('upi-qr');
  const [placing, setPlacing] = useState(false);

  // UPI QR & Screenshot upload state
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

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

  const quantity = request.quantity || 1;
  const subtotal = request.agreedPrice;
  const shipping = 50 * quantity;
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

  const handleOpenPayment = async () => {
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

      setPendingOrderId(order.id);
      setShowUpiQr(true);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to initiate order. Please try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const handleConfirmQrPayment = async () => {
    if (!paymentScreenshot || !pendingOrderId) {
      show('Please upload your payment screenshot first.', 'error');
      return;
    }
    setUploadingScreenshot(true);
    try {
      const formData = new FormData();
      formData.append('paymentScreenshot', paymentScreenshot);

      const token = localStorage.getItem('tcn_token');
      const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
      const uploadRes = await fetch(`${apiBase}/api/orders/${pendingOrderId}/upload-screenshot`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include',
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload payment screenshot.');
      }

      setShowUpiQr(false);
      setPaymentScreenshot(null);
      show('Custom order placed! We will verify your UPI payment screenshot.', 'success');
      navigate(`/order-confirmation/${pendingOrderId}`);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Failed to upload screenshot. Please try again.', 'error');
    } finally {
      setUploadingScreenshot(false);
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
        {request.productType} &middot; Custom Price: <strong>Rs.{subtotal.toLocaleString('en-IN')}</strong>
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

      <div className="grid lg:grid-cols-[1fr_340px] gap-10">
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
                  {request.yarnType && <p className="text-muted capitalize">Yarn: {request.yarnType === 'normal' ? 'Normal Yarn' : 'Acrylic Yarn'}</p>}
                  {request.size     && <p className="text-muted">Size: {request.size}</p>}
                  <p className="text-muted">Qty: {quantity}</p>
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
              <h2 className="font-display text-xl mb-2">Payment</h2>
              <p className="text-xs text-muted mb-5">Only online UPI QR payment is accepted for custom handcrafted orders.</p>
              
              <div className="flex flex-col gap-3 mb-6">
                {[
                  { id: 'upi-qr', label: 'UPI QR Code', icon: Smartphone,
                    hint: 'Scan QR code using Google Pay, PhonePe, Paytm or any UPI app', badge: 'ONLINE PAYMENT ONLY' },
                ].map(({ id: pid, label, icon: Icon, hint, badge }) => (
                  <div key={pid} className="border-2 border-rose-500 bg-rose-50/70 rounded-2xl p-4.5 shadow-soft">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                        <Icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-charcoal">{label}</p>
                          {badge && (
                            <span className="bg-rose-500 text-white text-[0.6rem] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">{hint}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-ivory rounded-2xl border border-line text-xs text-muted mb-6 flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <span>You will scan the QR code for <strong>Rs.{total.toLocaleString('en-IN')}</strong> and attach your payment screenshot.</span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                <button onClick={handleOpenPayment} disabled={placing} className="btn-primary flex-1 py-3.5">
                  {placing && <Spinner size={16} />}
                  {`Show QR Code · Rs.${total.toLocaleString('en-IN')}`}
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
              <span className="text-charcoal font-medium">Rs.{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping ({quantity} {quantity > 1 ? 'items' : 'item'} × Rs.50)</span>
              <span className="text-charcoal font-medium">Rs.{shipping.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-line pt-2.5 flex justify-between font-bold text-base text-charcoal">
              <span>Total Amount</span>
              <span className="text-rose-600">Rs.{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-line text-xs text-muted space-y-1">
            {request.colors   && <p>Colors: {request.colors}</p>}
            {request.deadline && <p>Deadline: {request.deadline}</p>}
          </div>
        </div>
      </div>

      {/* UPI QR Code & Screenshot Upload Modal */}
      {showUpiQr && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-line">
            <h3 className="font-display text-2xl text-charcoal mb-1">Scan & Pay</h3>
            <p className="text-sm text-muted mb-4">
              Scan with any UPI app to pay <strong className="text-charcoal font-bold text-base">Rs.{total.toLocaleString('en-IN')}</strong>
            </p>
            
            {/* QR Code image */}
            <div className="bg-white p-4 rounded-2xl border-2 border-rose-100 shadow-soft inline-block mb-5">
              <img src="/images/upi.jpeg" alt="UPI QR Code" className="w-52 h-52 object-contain mx-auto" />
              <p className="text-[11px] font-semibold text-rose-600 mt-2">TheCustomNest UPI</p>
            </div>
            
            {/* Payment Screenshot Upload */}
            <div className="mb-5 text-left">
              <label className="label text-xs mb-1.5 flex items-center justify-between">
                <span>Upload Payment Screenshot <span className="text-rose-500">*</span></span>
              </label>
              <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-all ${
                paymentScreenshot ? 'border-emerald-400 bg-emerald-50/50' : 'border-line hover:border-rose-300 bg-ivory/50'
              }`}>
                {paymentScreenshot ? (
                  <div className="flex items-center gap-3 text-sm text-center">
                    <span className="text-emerald-600 font-bold">✓ {paymentScreenshot.name}</span>
                    <span className="text-xs text-muted">(Click to change)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center py-1">
                    <Upload size={20} className="text-rose-500 mb-1" />
                    <span className="text-xs font-bold text-charcoal">Click to upload payment screenshot</span>
                    <span className="text-[10px] text-muted">Attach transaction screenshot to verify</span>
                  </div>
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
              <button
                onClick={async () => {
                  if (pendingOrderId) {
                    try {
                      await ordersApi.remove(pendingOrderId);
                    } catch (_) {}
                  }
                  setShowUpiQr(false);
                  setPlacing(false);
                  setPaymentScreenshot(null);
                  setPendingOrderId(null);
                }}
                disabled={uploadingScreenshot}
                className="btn-secondary flex-1 py-3"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmQrPayment} 
                disabled={!paymentScreenshot || uploadingScreenshot}
                className="btn-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lift"
              >
                {uploadingScreenshot ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-1" /> Uploading...
                  </>
                ) : paymentScreenshot ? (
                  "I've Paid · Confirm"
                ) : (
                  'Upload Screenshot First'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
