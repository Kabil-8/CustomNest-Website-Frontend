import React, { useEffect, useRef, useState } from 'react';
import { customOrders as customOrderApi } from '../../lib/api';
import type { CustomOrderRequest } from '../../types';
import { formatDate } from '../../lib/utils';
import { Skeleton } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { Send, Loader2, ChevronDown, ChevronUp, IndianRupee, CheckCircle2, Save } from 'lucide-react';

const STATUSES: CustomOrderRequest['status'][] = [
  'New', 'In Review', 'Quoted', 'Accepted', 'Declined',
];

const STATUS_TONE: Record<CustomOrderRequest['status'], string> = {
  'New':       'bg-rose-100   text-rose-700   border-rose-200',
  'In Review': 'bg-amber-100  text-amber-700  border-amber-200',
  'Quoted':    'bg-blue-100   text-blue-700   border-blue-200',
  'Accepted':  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Declined':  'bg-gray-100   text-gray-600   border-gray-200',
};

// ── Chat thread ───────────────────────────────────────────────────────────────
function ChatThread({ request, onUpdated }: {
  request: CustomOrderRequest;
  onUpdated: (r: CustomOrderRequest) => void;
}) {
  const { show } = useToast();
  const [text, setText]             = useState('');
  const [status, setStatus]         = useState<CustomOrderRequest['status']>(request.status);
  const [agreedPrice, setAgreedPrice] = useState<string>(
    request.agreedPrice != null ? String(request.agreedPrice) : ''
  );
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep local status in sync when parent updates
  useEffect(() => { 
    setStatus(request.status); 
    if (request.agreedPrice != null) {
      setAgreedPrice(String(request.agreedPrice));
    }
  }, [request.status, request.agreedPrice]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [request.messages?.length]);

  const isAccepting = status === 'Accepted';
  const isQuoting = status === 'Quoted';

  // ── Instant Status Click Handler ──
  async function handleStatusClick(nextStatus: CustomOrderRequest['status']) {
    setStatus(nextStatus);
    
    // For Accepted / Quoted, keep the price input open so admin can input price
    if (nextStatus === 'Accepted' || nextStatus === 'Quoted') {
      return;
    }

    // Direct status update for New, In Review, Declined
    setUpdatingStatus(true);
    try {
      const updated = await customOrderApi.updateStatus(request.id, nextStatus);
      onUpdated(updated);
      show(`Status updated to "${nextStatus}" ✓`, 'success');
    } catch {
      show(`Failed to update status to "${nextStatus}"`, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ── Save Price & Status Directly ──
  async function handleSavePriceAndStatus() {
    if (status === 'Accepted' && (!agreedPrice || isNaN(Number(agreedPrice)) || Number(agreedPrice) <= 0)) {
      show('Please enter the agreed price before accepting.', 'error');
      return;
    }
    setUpdatingStatus(true);
    try {
      const priceVal = agreedPrice && !isNaN(Number(agreedPrice)) ? Number(agreedPrice) : undefined;
      const updated = await customOrderApi.updateStatus(request.id, status, priceVal);
      onUpdated(updated);
      show(`Status updated to "${status}" ${priceVal ? `(Rs.${priceVal.toLocaleString('en-IN')})` : ''} ✓`, 'success');
    } catch {
      show('Failed to update status and price', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ── Send message (optionally updating status too) ──
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (isAccepting && (!agreedPrice || isNaN(Number(agreedPrice)) || Number(agreedPrice) <= 0)) {
      show('Enter the agreed price before accepting.', 'error');
      return;
    }
    setSending(true);
    try {
      const updated = await customOrderApi.adminSendMessage(
        request.id,
        text.trim(),
        status !== request.status ? status : undefined,
        (isAccepting || isQuoting) && agreedPrice ? Number(agreedPrice) : undefined,
      );
      onUpdated(updated);
      setText('');
      show('Message sent.', 'success');
    } catch {
      show('Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  }

  const messages = request.messages ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* message list */}
      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto px-1 py-2 no-scrollbar">
        {messages.length === 0 && (
          <p className="text-xs text-muted text-center py-6">No messages yet.</p>
        )}
        {messages.map((m) => {
          const isAdmin = m.sender === 'admin';
          return (
            <div key={m._id} className={`flex flex-col gap-0.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                isAdmin
                  ? 'bg-rose-500 text-white rounded-br-sm'
                  : 'bg-cream border border-line text-charcoal rounded-bl-sm'
              }`}>
                {m.text}
              </div>
              <span className="text-[0.6rem] text-muted px-1">
                {isAdmin ? 'You' : request.name} &middot; {formatDate(m.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* accepted + paid indicator */}
      {request.status === 'Accepted' && request.agreedPrice && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 size={15} />
            Accepted — agreed price set
          </div>
          <span className="font-display text-base font-bold text-emerald-700">
            Rs.{request.agreedPrice.toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* compose */}
      <form onSubmit={handleSend} className="space-y-2.5 pt-2 border-t border-line">
        {/* status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.65rem] font-semibold text-muted uppercase tracking-wider shrink-0">
            Set status:
          </span>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={updatingStatus}
              onClick={() => handleStatusClick(s)}
              className={`px-3 py-1 rounded-full text-[0.65rem] font-semibold border transition-all cursor-pointer ${
                status === s
                  ? STATUS_TONE[s] + ' shadow-sm font-bold scale-105'
                  : 'border-line text-muted hover:border-rose-300 hover:text-rose-600 bg-white'
              }`}
            >
              {s}
            </button>
          ))}
          {updatingStatus && <Loader2 size={13} className="animate-spin text-rose-500 ml-1" />}
        </div>

        {/* agreed / quoted price input */}
        {(isAccepting || isQuoting) && (
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 rounded-2xl px-4 py-2.5">
            <IndianRupee size={15} className="text-emerald-600 shrink-0" />
            <label className="text-xs font-semibold text-emerald-800 shrink-0">
              {isAccepting ? 'Agreed Price (₹):' : 'Quoted Price (₹):'}
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              placeholder="e.g. 2000"
              className="flex-1 border border-emerald-300 rounded-xl px-3 py-1.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            />
            <button
              type="button"
              onClick={handleSavePriceAndStatus}
              disabled={updatingStatus}
              className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-soft"
            >
              <Save size={13} />
              <span>Save Status</span>
            </button>
          </div>
        )}

        {/* text + send */}
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Type your reply... (Enter to send)"
            className="flex-1 border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none bg-white transition"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="self-end w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white flex items-center justify-center transition shrink-0 cursor-pointer"
            aria-label="Send"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminCustomOrders() {
  const [requests, setRequests] = useState<CustomOrderRequest[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { customOrderApi.listAll().then(setRequests); }, []);

  function handleUpdated(updated: CustomOrderRequest) {
    setRequests((prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r)));
  }

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="eyebrow mb-1">Fulfillment</span>
        <h1 className="font-display text-3xl text-charcoal">Custom Order Requests</h1>
        <p className="text-muted text-sm mt-1">{requests?.length ?? 0} submissions</p>
      </div>

      {requests === null ? (
        <Skeleton className="h-64" />
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-line shadow-soft p-10 text-center text-muted text-sm">
          No custom requests submitted yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((r) => {
            const isOpen  = expanded === r.id;
            const lastMsg = (r.messages ?? []).at(-1);
            const unread  = lastMsg?.sender === 'customer';

            return (
              <div
                key={r.id}
                className={`bg-white rounded-3xl border shadow-soft transition-all ${
                  unread ? 'border-rose-300' : 'border-line'
                }`}
              >
                {/* header */}
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                  onClick={() => toggle(r.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {unread && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-charcoal truncate">
                        {r.name} &middot; {r.productType}
                      </p>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {formatDate(r.createdAt)}
                        {r.quantity > 1 && ` · Qty ${r.quantity}`}
                        {lastMsg && (
                          <span className="ml-2 italic">
                            "{lastMsg.text.slice(0, 45)}{lastMsg.text.length > 45 ? '...' : ''}"
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === 'Accepted' && r.agreedPrice && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[0.65rem] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> Rs.{r.agreedPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full border text-[0.65rem] font-semibold ${STATUS_TONE[r.status]}`}>
                      {r.status}
                    </span>
                    {isOpen
                      ? <ChevronUp size={16} className="text-muted" />
                      : <ChevronDown size={16} className="text-muted" />
                    }
                  </div>
                </button>

                {/* expanded */}
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-line pt-5 space-y-5">
                    {/* order details */}
                    <div className="grid sm:grid-cols-2 gap-2 text-sm bg-cream/40 rounded-2xl px-4 py-3 border border-line/60">
                      <p><span className="text-muted">Email:</span> {r.email}</p>
                      <p><span className="text-muted">Phone:</span> {r.phone}</p>
                      {r.colors   && <p><span className="text-muted">Color:</span> {r.colors}</p>}
                      {r.yarnType && (r.yarnType as string) !== 'either' && (r.yarnType as string) !== '' && (
                        <p>
                          <span className="text-muted">Yarn Type:</span>{' '}
                          <span className="capitalize font-semibold text-rose-600">
                            {r.yarnType === 'normal' ? 'Normal Yarn' : 'Acrylic Yarn'}
                          </span>
                        </p>
                      )}
                      {(r.yarnType as string) === 'either' && (
                        <p><span className="text-muted">Yarn Type:</span> <span className="text-muted italic">No preference</span></p>
                      )}
                      {r.size     && <p><span className="text-muted">Size:</span> <span className="font-semibold">{r.size}</span></p>}
                      {r.budget   && <p><span className="text-muted">Budget:</span> {r.budget}</p>}
                      {r.deadline && <p><span className="text-muted">Deadline:</span> {r.deadline}</p>}
                      <p className="sm:col-span-2 text-charcoal/80 leading-relaxed">
                        <span className="text-muted">Description:</span> {r.description}
                      </p>
                    </div>

                    <ChatThread request={r} onUpdated={handleUpdated} />
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
