import React, { useEffect, useRef, useState } from 'react';
import { customOrders as customOrderApi } from '../../lib/api';
import type { CustomOrderRequest } from '../../types';
import { formatDate } from '../../lib/utils';
import { Skeleton } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { Send, Loader2, ChevronDown, ChevronUp, IndianRupee, CheckCircle2, Save, Trash2, Download } from 'lucide-react';

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

function getImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads')) {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
    return `${base.replace(/\/$/, '')}${url}`;
  }
  return url;
}

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Failed to fetch image');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    // Fallback: trigger download link directly
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = filename;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminCustomOrders() {
  const { show } = useToast();
  const [requests, setRequests] = useState<CustomOrderRequest[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingImg, setDownloadingImg] = useState<string | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<{ url: string; title: string; filename: string } | null>(null);

  useEffect(() => { customOrderApi.listAll().then(setRequests); }, []);

  function handleUpdated(updated: CustomOrderRequest) {
    setRequests((prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r)));
  }

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete custom order request from "${name}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await customOrderApi.remove(id);
      setRequests((prev) => (prev ?? []).filter((r) => r.id !== id));
      show(`Deleted custom order from "${name}" ✓`, 'success');
    } catch {
      show('Failed to delete custom order request', 'error');
    } finally {
      setDeletingId(null);
    }
  }

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
                    {r.resinOption && (
                      <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[0.65rem] font-semibold">
                        ✨ {r.resinOption}
                      </span>
                    )}
                    {((r.referenceImages && r.referenceImages.length > 0) || r.referenceImage) && (
                      <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[0.65rem] font-semibold">
                        📷 {r.referenceImages && r.referenceImages.length > 0 ? r.referenceImages.length : 1} Photo{(r.referenceImages?.length || 1) > 1 ? 's' : ''}
                      </span>
                    )}
                    {r.sampleImage && (
                      <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[0.65rem] font-semibold">
                        🖼️ Sample Design
                      </span>
                    )}
                    {r.status === 'Accepted' && r.agreedPrice && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[0.65rem] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> Rs.{r.agreedPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full border text-[0.65rem] font-semibold ${STATUS_TONE[r.status]}`}>
                      {r.status}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, r.id, r.name)}
                      disabled={deletingId === r.id}
                      title="Delete Custom Order"
                      className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 flex items-center justify-center transition ml-1"
                    >
                      {deletingId === r.id ? <Loader2 size={14} className="animate-spin text-rose-500" /> : <Trash2 size={14} />}
                    </button>
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
                      {r.resinOption && (
                        <p className="sm:col-span-2">
                          <span className="text-muted">Resin Option:</span>{' '}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            ✨ {r.resinOption}
                          </span>
                        </p>
                      )}
                      {r.colors   && <p><span className="text-muted">Color:</span> {r.colors}</p>}
                      {r.yarnType && (r.yarnType as string) !== 'either' && (r.yarnType as string) !== '' && (
                        <p>
                          <span className="text-muted">Yarn Type:</span>{' '}
                          <span className="capitalize font-semibold text-rose-600">
                            {r.yarnType === 'normal' ? 'Normal Yarn' : 'Acrylic Yarn'}
                          </span>
                        </p>
                      )}
                      {(r.yarnType as string) === 'either' && !r.resinOption && (
                        <p><span className="text-muted">Yarn Type:</span> <span className="text-muted italic">No preference</span></p>
                      )}
                      {r.size     && <p><span className="text-muted">Size:</span> <span className="font-semibold">{r.size}</span></p>}
                      {r.budget   && <p><span className="text-muted">Budget:</span> {r.budget}</p>}
                      {r.deadline && <p><span className="text-muted">Deadline:</span> {r.deadline}</p>}
                      <p className="sm:col-span-2 text-charcoal/80 leading-relaxed">
                        <span className="text-muted">Description:</span> {r.description}
                      </p>
                    </div>

                    {/* Customer Images — shown only when present */}
                    {(() => {
                      const allCustomerPhotos = (r.referenceImages && r.referenceImages.length > 0)
                        ? r.referenceImages
                        : (r.referenceImage ? [r.referenceImage] : []);
                      const hasAnyImages = allCustomerPhotos.length > 0 || Boolean(r.sampleImage);

                      if (!hasAnyImages) return null;

                      return (
                        <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-rose-200/50">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-charcoal">Customer Uploaded Images</span>
                              <span className="text-[10px] bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-full">
                                {allCustomerPhotos.length} Photo{allCustomerPhotos.length !== 1 ? 's' : ''}{r.sampleImage ? ' + 1 Sample' : ''}
                              </span>
                            </div>

                            {/* Download All button if multiple images exist */}
                            {(allCustomerPhotos.length + (r.sampleImage ? 1 : 0)) > 1 && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const safeName = r.name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
                                  for (let i = 0; i < allCustomerPhotos.length; i++) {
                                    await downloadImage(getImageUrl(allCustomerPhotos[i]), `${safeName}_customer_photo_${i + 1}.jpg`);
                                  }
                                  if (r.sampleImage) {
                                    await downloadImage(getImageUrl(r.sampleImage), `${safeName}_sample_reference.jpg`);
                                  }
                                  show('Started downloading all images ✓', 'success');
                                }}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1 rounded-xl transition shadow-xs cursor-pointer"
                              >
                                <Download size={11} />
                                Download All ({allCustomerPhotos.length + (r.sampleImage ? 1 : 0)})
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {/* Customer Photos (Up to 3) */}
                            {allCustomerPhotos.map((photoPath, idx) => {
                              const photoUrl = getImageUrl(photoPath);
                              const safeName = r.name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
                              const filename = `${safeName}_customer_photo_${idx + 1}.jpg`;
                              const title = `📸 Photo ${idx + 1} (${allCustomerPhotos.length > 1 ? `Subject Photo ${idx + 1}` : 'Customer Photo'})`;
                              const isDl = downloadingImg === `photo-${r.id}-${idx}`;

                              return (
                                <div key={idx} className="bg-white/80 p-2.5 rounded-2xl border border-rose-200/60 flex flex-col justify-between space-y-2">
                                  <div>
                                    <p className="text-[11px] font-bold text-charcoal uppercase tracking-wider">{title}</p>
                                    <p className="text-[10px] text-muted leading-tight mb-2">Subject to cast/recreate</p>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewModalImg({ url: photoUrl, title, filename })}
                                      className="relative group block w-full aspect-square rounded-xl overflow-hidden border border-rose-200 shadow-sm text-left cursor-pointer"
                                      title="Click to zoom & inspect"
                                    >
                                      <img
                                        src={photoUrl}
                                        alt={title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                      />
                                      <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white text-[11px] font-semibold transition">
                                        Zoom / View ↗
                                      </div>
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-line/50">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewModalImg({ url: photoUrl, title, filename })}
                                      className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                                    >
                                      View ↗
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setDownloadingImg(`photo-${r.id}-${idx}`);
                                        await downloadImage(photoUrl, filename);
                                        setDownloadingImg(null);
                                      }}
                                      disabled={isDl}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal bg-white hover:bg-rose-100/70 active:scale-95 px-2 py-1 rounded-lg border border-line transition shadow-xs cursor-pointer"
                                      title="Download this photo"
                                    >
                                      {isDl ? <Loader2 size={11} className="animate-spin text-rose-500" /> : <Download size={11} className="text-rose-600" />}
                                      Download
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Sample / Inspiration Image */}
                            {r.sampleImage && (() => {
                              const sampleUrl = getImageUrl(r.sampleImage);
                              const safeName = r.name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
                              const filename = `${safeName}_sample_reference.jpg`;
                              const title = '🖼️ Sample / Inspiration Design';
                              const isDl = downloadingImg === `sample-${r.id}`;

                              return (
                                <div className="bg-white/80 p-2.5 rounded-2xl border border-rose-200/60 flex flex-col justify-between space-y-2">
                                  <div>
                                    <p className="text-[11px] font-bold text-charcoal uppercase tracking-wider">{title}</p>
                                    <p className="text-[10px] text-muted leading-tight mb-2">Desired style / flowers / layout</p>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewModalImg({ url: sampleUrl, title, filename })}
                                      className="relative group block w-full aspect-square rounded-xl overflow-hidden border border-rose-200 shadow-sm text-left cursor-pointer"
                                      title="Click to zoom & inspect"
                                    >
                                      <img
                                        src={sampleUrl}
                                        alt={title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                      />
                                      <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white text-[11px] font-semibold transition">
                                        Zoom / View ↗
                                      </div>
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-line/50">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewModalImg({ url: sampleUrl, title, filename })}
                                      className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                                    >
                                      View ↗
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setDownloadingImg(`sample-${r.id}`);
                                        await downloadImage(sampleUrl, filename);
                                        setDownloadingImg(null);
                                      }}
                                      disabled={isDl}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal bg-white hover:bg-rose-100/70 active:scale-95 px-2 py-1 rounded-lg border border-line transition shadow-xs cursor-pointer"
                                      title="Download sample reference"
                                    >
                                      {isDl ? <Loader2 size={11} className="animate-spin text-rose-500" /> : <Download size={11} className="text-rose-600" />}
                                      Download
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })()}

                    <ChatThread request={r} onUpdated={handleUpdated} />
                  </div>
                )}
              </div>
          })}
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-5 overflow-hidden shadow-2xl relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
              <h3 className="font-semibold text-sm text-charcoal">{previewModalImg.title}</h3>
              <button
                onClick={() => setPreviewModalImg(null)}
                className="w-8 h-8 rounded-full bg-sand/60 hover:bg-rose-100 flex items-center justify-center text-charcoal font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[68vh] flex items-center justify-center overflow-auto rounded-2xl bg-neutral-900/5 p-2 border border-line">
              <img
                src={previewModalImg.url}
                alt={previewModalImg.title}
                className="max-h-[62vh] w-auto max-w-full object-contain rounded-xl shadow-sm"
              />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-line mt-3">
              <a
                href={previewModalImg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-600 font-bold hover:underline inline-flex items-center gap-1"
              >
                Open in new tab ↗
              </a>
              <button
                type="button"
                onClick={() => downloadImage(previewModalImg.url, previewModalImg.filename)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
              >
                <Download size={13} />
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
