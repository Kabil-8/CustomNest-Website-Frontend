import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart2,
} from 'lucide-react';
import { expenses as expensesApi, type Expense, type ExpensesStats, type CreateExpenseInput } from '../../lib/api';
import { StatCard } from '../../components/admin/StatCard';

// ── helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_LABELS: Record<string, string> = {
  yarn:          'Yarn',
  thread:        'Thread',
  fabric:        'Fabric',
  stuffing:      'Stuffing',
  hooks_needles: 'Hooks & Needles',
  packaging:     'Packaging',
  dyes:          'Dyes',
  other:         'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  yarn:          'bg-purple-100 text-purple-700 border-purple-200',
  thread:        'bg-blue-100 text-blue-700 border-blue-200',
  fabric:        'bg-amber-100 text-amber-700 border-amber-200',
  stuffing:      'bg-pink-100 text-pink-700 border-pink-200',
  hooks_needles: 'bg-teal-100 text-teal-700 border-teal-200',
  packaging:     'bg-orange-100 text-orange-700 border-orange-200',
  dyes:          'bg-indigo-100 text-indigo-700 border-indigo-200',
  other:         'bg-gray-100 text-gray-600 border-gray-200',
};

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Mini bar chart (pure CSS) ─────────────────────────────────────────────────

interface MonthlyBar {
  label: string;
  value: number;
  max: number;
  color: string;
}

function MiniBarChart({ bars, title }: { bars: MonthlyBar[]; title: string }) {
  if (bars.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted">
        No data yet
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs text-muted font-semibold mb-3">{title}</p>
      <div className="flex items-end gap-1.5 h-24">
        {bars.map((b, i) => {
          const pct = b.max > 0 ? Math.round((b.value / b.max) * 100) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[0.6rem] px-2 py-0.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {fmt(b.value)}
              </div>
              <div
                className={`w-full rounded-t-lg transition-all ${b.color}`}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
              <span className="text-[0.58rem] text-muted font-medium">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Add Expense Modal ─────────────────────────────────────────────────────────

const EMPTY_FORM: CreateExpenseInput = {
  materialName: '',
  category: 'other',
  quantity: 1,
  unit: 'unit',
  unitCost: 0,
  supplier: '',
  notes: '',
  purchasedAt: new Date().toISOString().slice(0, 10),
};

interface AddExpenseModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function AddExpenseModal({ onClose, onSaved }: AddExpenseModalProps) {
  const [form, setForm] = useState<CreateExpenseInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalCost = (form.quantity || 0) * (form.unitCost || 0);

  function set<K extends keyof CreateExpenseInput>(key: K, value: CreateExpenseInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.materialName.trim()) return setError('Material name is required.');
    if (form.quantity <= 0) return setError('Quantity must be greater than 0.');
    if (form.unitCost < 0) return setError('Unit cost cannot be negative.');
    setError('');
    setSaving(true);
    try {
      await expensesApi.create(form);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-line animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <div>
            <h2 className="font-display text-lg text-charcoal">Log Raw Material Purchase</h2>
            <p className="text-xs text-muted mt-0.5">Record a new material expense</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          {/* Material Name */}
          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1.5">
              Material Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.materialName}
              onChange={(e) => set('materialName', e.target.value)}
              placeholder="e.g. Cotton Yarn — 4-ply White"
              className="w-full border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
            />
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as CreateExpenseInput['category'])}
                className="w-full border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-rose-300 transition bg-white"
              >
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">Purchase Date</label>
              <input
                type="date"
                value={form.purchasedAt ?? ''}
                onChange={(e) => set('purchasedAt', e.target.value)}
                className="w-full border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
              />
            </div>
          </div>

          {/* Quantity + Unit + Unit Cost */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                onChange={(e) => set('quantity', parseFloat(e.target.value) || 0)}
                className="w-full border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                placeholder="grams / meters"
                className="w-full border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">
                Unit Cost (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.unitCost}
                onChange={(e) => set('unitCost', parseFloat(e.target.value) || 0)}
                className="w-full border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
              />
            </div>
          </div>

          {/* Total Cost preview */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Total Cost</span>
            <span className="font-display text-lg text-rose-600 font-bold">{fmt(totalCost)}</span>
          </div>

          {/* Supplier + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">Supplier</label>
              <input
                type="text"
                value={form.supplier ?? ''}
                onChange={(e) => set('supplier', e.target.value)}
                placeholder="e.g. Craft Supplies Co."
                className="w-full border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1.5">Notes</label>
              <input
                type="text"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Optional notes"
                className="w-full border border-line rounded-2xl px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-line rounded-2xl py-2.5 text-sm font-semibold text-charcoal hover:bg-cream transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Saving…' : 'Log Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminExpenses() {
  const [stats, setStats]         = useState<ExpensesStats | null>(null);
  const [list, setList]           = useState<Expense[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const s = await expensesApi.getStats();
      setStats(s);
    } catch { /* silent */ }
  }, []);

  const loadList = useCallback(async () => {
    try {
      const data = await expensesApi.list(page, catFilter || undefined);
      setList(data.expenses);
      setTotal(data.total);
      setPages(data.pages);
    } catch { /* silent */ }
  }, [page, catFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadList()]).finally(() => setLoading(false));
  }, [loadStats, loadList]);

  async function handleDelete(id: string) {
    if (!confirm('Remove this expense entry?')) return;
    setDeleting(id);
    try {
      await expensesApi.remove(id);
      await Promise.all([loadStats(), loadList()]);
    } catch { /* silent */ } finally {
      setDeleting(null);
    }
  }

  // Build monthly bars
  const allMonths = (() => {
    const result: { year: number; month: number; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES[d.getMonth()] });
    }
    return result;
  })();

  const expMap = new Map(
    (stats?.monthlyExpenses ?? []).map((m) => [`${m._id.year}-${m._id.month}`, m.total])
  );
  const revMap = new Map(
    (stats?.monthlyRevenue ?? []).map((m) => [`${m._id.year}-${m._id.month}`, m.total])
  );

  const expBars = allMonths.map((m) => ({
    label: m.label,
    value: expMap.get(`${m.year}-${m.month}`) ?? 0,
    max: Math.max(...allMonths.map((x) => expMap.get(`${x.year}-${x.month}`) ?? 0), 1),
    color: 'bg-rose-400',
  }));

  const revBars = allMonths.map((m) => ({
    label: m.label,
    value: revMap.get(`${m.year}-${m.month}`) ?? 0,
    max: Math.max(...allMonths.map((x) => revMap.get(`${x.year}-${x.month}`) ?? 0), 1),
    color: 'bg-emerald-400',
  }));

  // Category breakdown sorted
  const catBreakdown = Object.entries(stats?.byCategory ?? {})
    .sort(([, a], [, b]) => b - a);
  const totalCatSum = catBreakdown.reduce((s, [, v]) => s + v, 0);

  function momChange(pct: number): string {
    const arrow = pct >= 0 ? '▲' : '▼';
    return `${arrow} ${Math.abs(pct)}%`;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow mb-1">Finance</span>
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal">Expenses Dashboard</h1>
          <p className="text-sm text-muted mt-1">Track sold-item revenue and raw material purchases</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition shadow-soft"
        >
          <Plus size={16} />
          Log Purchase
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-muted">
          <Loader2 size={24} className="animate-spin text-rose-400" />
          <span className="text-sm font-medium">Loading expenses data…</span>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              label="Total Revenue"
              value={stats?.totalRevenue ?? 0}
              prefix="₹"
              decimals={2}
              icon={TrendingUp}
              change={momChange(stats?.mom?.revenue ?? 0)}
              isPositive={(stats?.mom?.revenue ?? 0) >= 0}
              showVsMonth
            />
            <StatCard
              label="Items Sold"
              value={stats?.totalItemsSold ?? 0}
              icon={ShoppingCart}
              change={momChange(stats?.mom?.items ?? 0)}
              isPositive={(stats?.mom?.items ?? 0) >= 0}
              showVsMonth
            />
            <StatCard
              label="Raw Material Cost"
              value={stats?.totalExpenses ?? 0}
              prefix="₹"
              decimals={2}
              icon={Package}
              change={momChange(stats?.mom?.expenses ?? 0)}
              isPositive={(stats?.mom?.expenses ?? 0) <= 0}
              showVsMonth
            />
            <StatCard
              label="Net Profit"
              value={Math.abs(stats?.netProfit ?? 0)}
              prefix={(stats?.netProfit ?? 0) >= 0 ? '₹' : '-₹'}
              decimals={2}
              icon={(stats?.netProfit ?? 0) >= 0 ? DollarSign : TrendingDown}
              change={`Delivered ₹${(stats?.deliveredRevenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} − expenses`}
              isPositive={(stats?.netProfit ?? 0) >= 0}
            />
          </div>

          {/* This-month summary strip */}
          {stats?.mom && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: 'Revenue this month',
                  value: fmt(stats.mom.revenueThisMonth),
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50 border-emerald-200',
                },
                {
                  label: 'Expenses this month',
                  value: fmt(stats.mom.expensesThisMonth),
                  color: 'text-rose-600',
                  bg: 'bg-rose-50 border-rose-200',
                },
                {
                  label: 'Items sold this month',
                  value: String(stats.mom.itemsThisMonth),
                  color: 'text-blue-600',
                  bg: 'bg-blue-50 border-blue-200',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border px-5 py-4 flex items-center justify-between ${item.bg}`}
                >
                  <span className="text-xs font-semibold text-charcoal/70">{item.label}</span>
                  <span className={`font-display text-lg font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Revenue */}
            <div className="bg-white rounded-3xl p-6 border border-line shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className="font-display text-sm text-charcoal">Monthly Revenue</h3>
                  <p className="text-[0.65rem] text-muted">Delivered orders · last 6 months</p>
                </div>
              </div>
              <MiniBarChart bars={revBars} title="Revenue (₹)" />
            </div>

            {/* Monthly Expenses */}
            <div className="bg-white rounded-3xl p-6 border border-line shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <TrendingDown size={16} />
                </div>
                <div>
                  <h3 className="font-display text-sm text-charcoal">Monthly Expenses</h3>
                  <p className="text-[0.65rem] text-muted">Raw material cost · last 6 months</p>
                </div>
              </div>
              <MiniBarChart bars={expBars} title="Expenses (₹)" />
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-line shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                  <BarChart2 size={16} />
                </div>
                <div>
                  <h3 className="font-display text-sm text-charcoal">By Category</h3>
                  <p className="text-[0.65rem] text-muted">Expense distribution</p>
                </div>
              </div>
              {catBreakdown.length === 0 ? (
                <p className="text-xs text-muted text-center py-8">No expenses logged yet</p>
              ) : (
                <div className="space-y-2.5">
                  {catBreakdown.map(([cat, amount]) => {
                    const pct = totalCatSum > 0 ? Math.round((amount / totalCatSum) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`px-2 py-0.5 rounded-full border text-[0.65rem] font-semibold ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}`}>
                            {CATEGORY_LABELS[cat] ?? cat}
                          </span>
                          <span className="font-semibold text-charcoal">{fmt(amount)} <span className="text-muted font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-charcoal">Raw Material Purchases</h2>
                <p className="text-xs text-muted">{total} total entr{total !== 1 ? 'ies' : 'y'}</p>
              </div>
              {/* Category filter */}
              <select
                value={catFilter}
                onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
                className="border border-line rounded-2xl px-4 py-2 text-xs font-semibold text-charcoal focus:outline-none focus:ring-2 focus:ring-rose-300 transition bg-white"
              >
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-muted uppercase text-[0.63rem] bg-cream/40">
                    <th className="py-3 px-4 font-semibold">Material</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold text-right">Qty</th>
                    <th className="py-3 px-4 font-semibold text-right">Unit Cost</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                    <th className="py-3 px-4 font-semibold">Supplier</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-medium">
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted">
                        No purchases logged yet. Click "Log Purchase" to add one.
                      </td>
                    </tr>
                  ) : (
                    list.map((exp) => (
                      <tr key={exp._id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-charcoal">{exp.materialName}</div>
                          {exp.notes && <div className="text-[0.65rem] text-muted mt-0.5">{exp.notes}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full border text-[0.65rem] font-bold ${CATEGORY_COLORS[exp.category] ?? CATEGORY_COLORS.other}`}>
                            {CATEGORY_LABELS[exp.category] ?? exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-muted">
                          {exp.quantity} <span className="text-[0.6rem]">{exp.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-muted">{fmt(exp.unitCost)}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">{fmt(exp.totalCost)}</td>
                        <td className="py-3 px-4 text-muted">{exp.supplier || '—'}</td>
                        <td className="py-3 px-4 text-muted whitespace-nowrap">{formatDate(exp.purchasedAt)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDelete(exp._id)}
                            disabled={deleting === exp._id}
                            className="w-7 h-7 rounded-xl flex items-center justify-center mx-auto text-muted hover:bg-rose-100 hover:text-rose-600 transition disabled:opacity-40"
                            aria-label="Delete expense"
                          >
                            {deleting === exp._id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <Trash2 size={13} />
                            }
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="px-6 py-4 border-t border-line flex items-center justify-between">
                <span className="text-xs text-muted">
                  Page {page} of {pages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-xl border border-line flex items-center justify-center text-charcoal hover:bg-cream disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="w-8 h-8 rounded-xl border border-line flex items-center justify-center text-charcoal hover:bg-cream disabled:opacity-40 transition"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Modal */}
      {showModal && (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            loadStats();
            loadList();
          }}
        />
      )}
    </div>
  );
}

