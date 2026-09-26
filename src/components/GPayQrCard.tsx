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

      {/* Direct link for mobile phone users */}
      {upiLink && (
        <a
          href={upiLink}
          className="sm:hidden mt-3 inline-flex items-center justify-center w-full py-2.5 px-3 rounded-xl bg-charcoal hover:bg-black text-white text-xs font-bold transition shadow-xs"
        >
          Tap to Open in UPI App (₹{amount.toLocaleString('en-IN')})
        </a>
      )}

      {/* Footer hint */}
      <p className="text-[10px] text-muted mt-2 tracking-wide">
        Scan with Google Pay, PhonePe, Paytm or any UPI app
      </p>
    </div>
  );
}
