import React, { useEffect, useState, useCallback } from 'react';
import { Mail, Search, Trash2, CheckCircle2, MessageSquare, Loader2, Clock, MailOpen, Reply, AlertTriangle } from 'lucide-react';
import { contact as contactApi, type ContactMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';

export default function AdminMessages() {
  const { show } = useToast();
  const [messages, setMessages]       = useState<ContactMessage[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactApi.listAll(filterStatus === 'all' ? undefined : filterStatus, searchQuery || undefined);
      setMessages(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleUpdateStatus = async (id: string, nextStatus: 'Unread' | 'Read' | 'Replied') => {
    setProcessingId(id);
    try {
      const updated = await contactApi.updateStatus(id, nextStatus);
      setMessages((prev) => prev.map((m) => (m._id === id ? updated : m)));
      show(`Marked inquiry as ${nextStatus} ✓`, 'success');
    } catch {
      show('Failed to update status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete inquiry from "${name}"? This cannot be undone.`)) return;
    setProcessingId(id);
    try {
      await contactApi.remove(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      show('Inquiry deleted.', 'info');
    } catch {
      show('Failed to delete inquiry', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const unreadCount = messages.filter((m) => m.status === 'Unread').length;
  const repliedCount = messages.filter((m) => m.status === 'Replied').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow mb-1">Customer Support</span>
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
            Contact Messages & Inquiries ({loading ? '…' : messages.length})
          </h1>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-line shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-wide">Total Inquiries</p>
            <p className="font-display text-2xl font-bold text-charcoal mt-0.5">{messages.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sand/60 text-charcoal flex items-center justify-center">
            <Mail size={20} />
          </div>
        </div>

        <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-200/80 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold text-rose-700 uppercase tracking-wide">Unread Messages</p>
            <p className="font-display text-2xl font-bold text-rose-800 mt-0.5">{unreadCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold text-emerald-700 uppercase tracking-wide">Replied</p>
            <p className="font-display text-2xl font-bold text-emerald-800 mt-0.5">{repliedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-line shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender name, email, or message..."
            className="input text-xs pl-10 py-2.5 bg-cream/30"
          />
        </div>

        <div className="flex items-center gap-2 bg-cream/60 p-1 rounded-xl border border-line">
          {(['all', 'Unread', 'Read', 'Replied'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === s
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-muted hover:text-charcoal'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted">
          <Loader2 size={24} className="animate-spin text-rose-400" />
          <span className="text-sm">Loading contact inquiries…</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
          <AlertTriangle size={18} />
          <div>
            <p className="font-semibold">Failed to load inquiries</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={fetchMessages} className="ml-auto btn-primary py-1.5 px-3 text-xs">Retry</button>
        </div>
      )}

      {/* Messages List */}
      {!loading && !error && messages.length === 0 && (
        <div className="bg-white rounded-3xl border border-line p-12 text-center shadow-soft">
          <div className="w-16 h-16 rounded-full bg-sand/60 text-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} />
          </div>
          <h3 className="font-display text-xl text-charcoal mb-2">No inquiries yet</h3>
          <p className="text-muted text-sm max-w-md mx-auto">
            When visitors send a message via the Contact Us page ("Send Us a Message"), they will show up here live in your admin portal.
          </p>
        </div>
      )}

      {!loading && !error && messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((m) => {
            const isUnread = m.status === 'Unread';
            const isReplied = m.status === 'Replied';
            const isExpanded = expandedId === m._id;
            const isBusy = processingId === m._id;

            return (
              <div
                key={m._id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-soft overflow-hidden ${
                  isUnread
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-line hover:border-rose-200'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-3">
                  {/* Top Bar: Sender Name, Email, Date & Status */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isUnread
                            ? 'bg-rose-500 text-white shadow-soft'
                            : isReplied
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-sand text-charcoal'
                        }`}
                      >
                        {m.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-charcoal">{m.name}</h3>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </div>
                        <a
                          href={`mailto:${m.email}`}
                          className="text-xs text-rose-600 hover:underline font-medium block"
                        >
                          {m.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted font-mono">{formatDate(m.createdAt)}</span>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold border ${
                          isUnread
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : isReplied
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>

                  {/* Subject */}
                  {m.subject && (
                    <div className="pt-1">
                      <span className="text-xs font-semibold text-charcoal bg-sand/60 px-2.5 py-1 rounded-lg">
                        Subject: {m.subject}
                      </span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="bg-cream/40 rounded-xl p-4 border border-line/60">
                    <p className={`text-xs sm:text-sm text-charcoal/90 leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>
                      {m.message}
                    </p>
                    {m.message.length > 180 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : m._id)}
                        className="text-[0.7rem] font-semibold text-rose-600 hover:underline mt-2 inline-block cursor-pointer"
                      >
                        {isExpanded ? 'Show less' : 'Read full message →'}
                      </button>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
                    {/* Reply via Email Link */}
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(
                        m.subject ? `Re: ${m.subject}` : 'Regarding your inquiry to TheCustomNest'
                      )}&body=${encodeURIComponent(
                        `Hi ${m.name},\n\nThank you for reaching out to TheCustomNest!\n\nRegarding your message:\n"${m.message}"\n\n`
                      )}`}
                      onClick={() => {
                        if (isUnread) handleUpdateStatus(m._id, 'Replied');
                      }}
                      className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 shadow-soft"
                    >
                      <Reply size={14} />
                      <span>Reply via Email</span>
                    </a>

                    {/* Status Management & Delete */}
                    <div className="flex items-center gap-2">
                      {isUnread ? (
                        <button
                          onClick={() => handleUpdateStatus(m._id, 'Read')}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl border border-line bg-white hover:bg-sand text-charcoal text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MailOpen size={13} />
                          <span>Mark as Read</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(m._id, 'Unread')}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl border border-line bg-white hover:bg-sand text-muted hover:text-charcoal text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Clock size={13} />
                          <span>Mark as Unread</span>
                        </button>
                      )}

                      {!isReplied && (
                        <button
                          onClick={() => handleUpdateStatus(m._id, 'Replied')}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 size={13} />
                          <span>Mark as Replied</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(m._id, m.name)}
                        disabled={isBusy}
                        title="Delete Inquiry"
                        className="p-2 rounded-xl border border-line bg-white hover:bg-danger/10 hover:border-danger/30 text-danger transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
