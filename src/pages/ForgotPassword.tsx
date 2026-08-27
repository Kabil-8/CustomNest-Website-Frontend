import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Spinner } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="container-nest py-16 flex justify-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl">
            TheCustom<span className="text-rose-500">Nest</span>
          </Link>
          <h1 className="font-display text-2xl mt-5">Reset your password</h1>
          <p className="text-muted text-sm mt-1.5">We'll send a reset link to your email address.</p>
        </div>

        <div className="card p-7">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={26} />
              </div>
              <p className="font-medium mb-1">Check your inbox</p>
              <p className="text-sm text-muted">We've sent password reset instructions to {email}.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <div>
                <label className="label" htmlFor="fp-email">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="fp-email"
                    type="email"
                    required
                    className="input pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
                {loading && <Spinner size={16} />}
                Send Reset Link
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-muted mt-6">
          <Link to="/login" className="text-rose-600 font-semibold">
            Back to Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
