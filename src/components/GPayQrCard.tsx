import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface GPayQrCardProps {
  amount: number;
  orderNumber?: string;
  className?: string;
}

const UPI_ID = 'ashwithaksamy@oksbi';
const PAYEE_NAME = 'Ashwitha P.C';
const GOOGLE_PAY_AID = 'uGICAgMDe1IuPFQ';

export default function GPayQrCard({ amount, orderNumber, className = '' }: GPayQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [upiLink, setUpiLink] = useState<string>('');

  useEffect(() => {
    // Standard NPCI UPI URI with exact amount pre-filled
    // NOTE: Keep literal '@' in pa so UPI scanners parse the VPA correctly
    const formattedAmount = amount.toFixed(2);
    const note = orderNumber ? `Order ${orderNumber}` : 'TheCustomNest Payment';
    const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&aid=${GOOGLE_PAY_AID}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

    setUpiLink(upiUri);

    // High error-correction level 'M' generates clean, high-contrast, instantly-readable QR modules
    QRCode.toDataURL(upiUri, {
      width: 512,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [amount, orderNumber]);

  return (
    <div className={`bg-white rounded-3xl p-5 border border-line/80 shadow-md max-w-[280px] mx-auto text-center ${className}`}>
      {/* Payee Profile Header (matching Google Pay screenshot) */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#004d40] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
          A
        </div>
        <span className="font-semibold text-charcoal text-base tracking-tight">{PAYEE_NAME}</span>
      </div>

      {/* QR Code (100% unobstructed for guaranteed instant amount recognition) */}
      <div className="bg-white p-2 rounded-2xl border border-line/50 inline-block mx-auto shadow-2xs">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`UPI QR Code for ₹${amount}`}
            className="w-52 h-52 object-contain mx-auto rounded-lg"
          />
        ) : (
          <div className="w-52 h-52 flex items-center justify-center bg-ivory rounded-lg text-xs text-muted">
            Generating QR…
          </div>
        )}
      </div>

      {/* UPI ID & Amount Info */}
      <div className="mt-3 space-y-1">
        <p className="text-[11px] font-semibold text-charcoal/80">
          UPI ID: <span className="font-mono font-bold text-charcoal">{UPI_ID}</span>
        </p>
        <p className="text-xs font-bold text-rose-600">
          Total to Pay: ₹{amount.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Copy UPI ID button */}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(UPI_ID);
          alert('UPI ID copied to clipboard: ' + UPI_ID);
        }}
        className="mt-3 inline-flex items-center justify-center w-full py-2 px-3 rounded-xl bg-ivory hover:bg-line/40 text-charcoal text-xs font-semibold border border-line transition shadow-2xs cursor-pointer"
      >
        📋 Copy UPI ID
      </button>

      {/* How to Pay Guidance Note for Mobile / Desktop */}
      <div className="mt-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-left space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
          <span>💡</span>
          <span>How to Pay Securely:</span>
        </div>
        <p className="text-[11px] text-amber-900 leading-snug">
          • <strong>Scan from another phone</strong>, OR
        </p>
        <p className="text-[11px] text-amber-900 leading-snug">
          • <strong>Take a screenshot</strong> of this QR code, open <strong>Google Pay / PhonePe / Paytm</strong>, select <em>&quot;Upload from Gallery / Scanner&quot;</em> and make the payment securely.
        </p>
        <p className="text-[11px] text-amber-900 leading-snug">
          • Once done, <strong>upload the payment screenshot</strong> below to confirm your order.
        </p>
      </div>

      {/* Footer hint */}
      <p className="text-[10px] text-muted mt-2.5 tracking-wide">
        Works with Google Pay, PhonePe, Paytm or any UPI app
      </p>
    </div>
  );
}
