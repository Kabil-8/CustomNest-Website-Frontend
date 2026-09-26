import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface GPayQrCardProps {
  amount: number;
  orderNumber?: string;
  className?: string;
}

const UPI_ID = 'ashwithaksamy@oksbi';
const PAYEE_NAME = 'Ashwitha P.C';

export default function GPayQrCard({ amount, orderNumber, className = '' }: GPayQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate UPI URI with exact pre-filled amount so customers don't have to type it
    const formattedAmount = amount.toFixed(2);
    const note = orderNumber ? `Order ${orderNumber}` : 'TheCustomNest Handcrafted';
    const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

    // High error-correction level 'H' allows the center Google Pay badge while remaining 100% scannable
    QRCode.toDataURL(upiUri, {
      width: 512,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [amount, orderNumber]);

  return (
    <div className={`bg-white rounded-3xl p-5 border border-line/80 shadow-md max-w-[280px] mx-auto text-center ${className}`}>
      {/* Payee Profile Header (matches user's GPay screenshot) */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#004d40] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
          A
        </div>
        <span className="font-semibold text-charcoal text-base tracking-tight">{PAYEE_NAME}</span>
      </div>

      {/* QR Code Container with Center Logo */}
      <div className="relative inline-block bg-white p-1 rounded-2xl mx-auto">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`Scan & Pay ₹${amount} to ${PAYEE_NAME}`}
            className="w-52 h-52 object-contain mx-auto rounded-xl"
          />
        ) : (
          <div className="w-52 h-52 flex items-center justify-center bg-ivory rounded-xl text-xs text-muted">
            Generating QR…
          </div>
        )}

        {/* Center Google Pay pill badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full p-1 shadow-sm border border-line/60 flex items-center justify-center pointer-events-none">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            {/* GPay 4-color stylized emblem */}
            <path
              d="M7.5 12a3.5 3.5 0 0 1 3.5-3.5h2a3.5 3.5 0 0 1 3.5 3.5v0a3.5 3.5 0 0 1-3.5 3.5h-2A3.5 3.5 0 0 1 7.5 12z"
              stroke="#4285F4"
              strokeWidth="1.8"
            />
            <circle cx="10" cy="11" r="1.5" fill="#EA4335" />
            <circle cx="14" cy="11" r="1.5" fill="#34A853" />
            <circle cx="12" cy="13.5" r="1.5" fill="#FBBC04" />
          </svg>
        </div>
      </div>

      {/* UPI ID & Amount Info */}
      <div className="mt-3 space-y-1">
        <p className="text-[11px] font-semibold text-charcoal/85">
          UPI ID: <span className="font-mono font-bold text-charcoal">{UPI_ID}</span>
        </p>
        <p className="text-xs font-bold text-rose-600">
          Amount: ₹{amount.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Footer hint */}
      <p className="text-[10px] text-muted mt-2 tracking-wide">
        Scan to pay with any UPI app
      </p>
    </div>
  );
}
