import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(form.email, form.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-soft">
            <ShieldCheck size={28} />
          </div>
          <span className="eyebrow text-xs mb-1">TheCustomNest</span>
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal">Admin Portal</h1>
          <p className="text-muted text-xs sm:text-sm mt-1.5 leading-relaxed">
            Manage your handmade collection, orders and customers.
          </p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-3xl p-7 sm:p-8 flex flex-col gap-4 border border-line shadow-lift" noValidate>
          <div>
            <label className="label text-xs" htmlFor="a-email">
              Admin Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="a-email"
                type="email"
                required
                className="input pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ashwithaksamy@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="label text-xs" htmlFor="a-password">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="a-password"
                type={showPw ? 'text' : 'password'}
                required
                className="input pl-10 pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-danger bg-danger/10 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-1">
            {loading && <Spinner size={16} />}
            Secure Sign In
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          <Link to="/" className="hover:text-rose-600 font-semibold transition-colors">
            ← Back to Storefront
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
