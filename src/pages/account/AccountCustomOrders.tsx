import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customOrders as customOrderApi } from '../../lib/api';
import type { CustomOrderRequest } from '../../types';
import { formatDate } from '../../lib/utils';
import { Skeleton } from '../../components/ui';
import {
  Sparkles, Send, Loader2, Plus,
  ChevronDown, ChevronUp, ShoppingBag,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<CustomOrderRequest['status'], string> = {
  'New':       'bg-rose-50    text-rose-700   border-rose-200',
  'In Review': 'bg-amber-50   text-amber-700  border-amber-200',
  'Quoted':    'bg-blue-50    text-blue-700   border-blue-200',
  'Accepted':  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Declined':  'bg-gray-100   text-gray-500   border-gray-200',
};

const STATUS_DESC: Record<CustomOrderRequest['status'], string> = {
  'New':       'Received — our team will review it shortly.',
  'In Review': 'We are reviewing your request.',
  'Quoted':    'A quote has been prepared — check the conversation below.',
  'Accepted':  'Your custom order is accepted! Proceed to payment when ready.',
  'Declined':  'We are unable to fulfil this request at the moment.',
};

// ── chat thread ───────────────────────────────────────────────────────────────
function ChatThread({ request, onUpdated }: {
  request: CustomOrderRequest;
  onUpdated: (r: CustomOrderRequest) => void;
}) {
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [request.messages?.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      const updated = await customOrderApi.customerSendMessage(request.id, text.trim());
      onUpdated(updated);
      setText('');
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const messages = request.messages ?? [];

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-col gap-3 max-h-80 overflow-y-auto px-1 py-2 no-scrollbar">
        {messages.length === 0 && (
          <p className="text-xs text-muted text-center py-6">No messages yet.</p>
        )}
        {messages.map((m) => {
          const isMe = m.sender === 'customer';
          return (
            <div key={m._id} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                isMe
                  ? 'bg-rose-500 text-white rounded-br-sm'
                  : 'bg-white border border-emerald-200 text-charcoal rounded-bl-sm shadow-sm'
              }`}>
                {m.text}
              </div>
              <span className="text-[0.6rem] text-muted px-1">
                {isMe ? 'You' : 'TheCustomNest'} &middot; {formatDate(m.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* only allow messaging if not declined */}
      {request.status !== 'Declined' && (
        <form onSubmit={handleSend} className="mt-3 pt-3 border-t border-line/60">
          {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask a question or add more details..."
              className="flex-1 border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white transition"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white flex items-center justify-center transition shrink-0"
              aria-label="Send"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function AccountCustomOrders() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CustomOrderRequest[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    customOrderApi.listMy()
      .then((data) => {
        setRequests(data);
        if (data[0]) setExpanded(data[0].id);
      })
      .catch(() => setRequests([]));
  }, []);

  function handleUpdated(updated: CustomOrderRequest) {
    setRequests((prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r)));
  }

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  if (requests === null) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-charcoal">My Custom Orders</h2>
          <p className="text-sm text-muted mt-0.5">Chat with our team and track your requests.</p>
        </div>
        <Link
          to="/custom-order"
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl transition shadow-soft"
        >
          <Plus size={14} /> New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-line shadow-soft p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
            <Sparkles size={26} />
          </div>
          <h3 className="font-display text-lg text-charcoal">No custom orders yet</h3>
          <p className="text-sm text-muted max-w-xs mx-auto">
            Have a unique idea? Submit a custom order and our artisan team will craft it just for you.
          </p>
          <Link to="/custom-order" className="btn-primary inline-flex items-center gap-2">
            <Sparkles size={15} /> Start a Custom Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const isOpen    = expanded === r.id;
            const hasReply  = (r.messages ?? []).some((m) => m.sender === 'admin');
            const readyToPay = r.status === 'Accepted' && !!r.agreedPrice && !r.linkedOrderId;
            const alreadyPaid = r.status === 'Accepted' && !!r.linkedOrderId;

            return (
              <div
                key={r.id}
                className={`bg-white rounded-3xl border shadow-soft overflow-hidden transition-all ${
                  readyToPay
                    ? 'border-emerald-400'
                    : hasReply && !isOpen
                    ? 'border-emerald-200'
                    : 'border-line'
                }`}
              >
                {/* header */}
                <button
                  className="w-full px-6 py-5 flex items-center justify-between gap-3 text-left"
                  onClick={() => toggle(r.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <Sparkles size={13} className="text-rose-500 shrink-0" />
                      <p className="font-semibold text-sm text-charcoal truncate">{r.productType}</p>
                      {readyToPay && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[0.6rem] font-bold shrink-0">
                          Payment Ready
                        </span>
                      )}
                      {alreadyPaid && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[0.6rem] font-bold shrink-0">
                          Order Placed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      {formatDate(r.createdAt)}
                      {r.quantity > 1 && ` · Qty ${r.quantity}`}
                      {r.agreedPrice && ` · Rs.${r.agreedPrice.toLocaleString('en-IN')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full border text-[0.65rem] font-semibold ${STATUS_STYLE[r.status]}`}>
                      {r.status}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </div>
                </button>

                {/* expanded */}
                {isOpen && (
                  <div className="border-t border-line">
                    {/* status banner */}
                    <div className={`px-6 py-3 text-xs font-medium flex items-center gap-2 ${STATUS_STYLE[r.status]} border-b`}>
                      <span className="font-semibold">{r.status}:</span>
                      {STATUS_DESC[r.status]}
                    </div>

                    {/* payment CTA — show when accepted + price set + not yet ordered */}
                    {readyToPay && (
                      <div className="mx-6 mt-5 bg-emerald-50 border border-emerald-300 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-emerald-800">Your custom order is ready!</p>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            Agreed price: <span className="font-bold">Rs.{r.agreedPrice!.toLocaleString('en-IN')}</span>
                            {r.quantity > 1 && ` · Qty ${r.quantity}`}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/custom-order-checkout/${r.id}`)}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl transition shadow-soft shrink-0"
                        >
                          <ShoppingBag size={16} /> Proceed to Payment
                        </button>
                      </div>
                    )}

                    {/* already paid — link to order */}
                    {alreadyPaid && (
                      <div className="mx-6 mt-5 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-blue-800">Order placed successfully!</p>
                        <Link
                          to="/account/orders"
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                        >
                          View Order
                        </Link>
                      </div>
                    )}

                    {/* Reference sample photo */}
                    {r.referenceImage && (
                      <div className="mx-6 mt-4 p-3.5 bg-rose-50/40 border border-rose-100 rounded-2xl flex items-center gap-3.5">
                        <a href={r.referenceImage} target="_blank" rel="noopener noreferrer" className="relative group shrink-0">
                          <img
                            src={r.referenceImage}
                            alt="Sample reference"
                            className="w-14 h-14 object-cover rounded-xl border border-rose-200 shadow-xs group-hover:scale-105 transition"
                          />
                        </a>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-charcoal">Your Reference Sample</p>
                          <a
                            href={r.referenceImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-rose-600 font-semibold hover:underline mt-0.5 block"
                          >
                            View image ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {/* conversation */}
                    <div className="px-6 py-5">
                      <p className="text-[0.65rem] font-semibold text-muted uppercase tracking-wider mb-3">
                        Conversation
                      </p>
                      <ChatThread request={r} onUpdated={handleUpdated} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
