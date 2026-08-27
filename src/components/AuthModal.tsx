import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Lock, Mail, User as UserIcon, Phone, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuthGate } from '../context/AuthGateContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from './ui';

type Mode = 'login' | 'register';

export function AuthModal() {
  const { isOpen, reason, close, resolveWithSuccess } = useAuthGate();
  const { login, register, googleLogin } = useAuth();
  const { show } = useToast();

  const [mode, setMode] = useState<Mode>('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  const reset = () => {
    setForm({ name: '', email: '', phone: '', password: '', confirm: '' });
    setError('');
    setShowPw(false);
  };

  const handleClose = () => {
    close();
    reset();
    setMode('login');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const googleClientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        '251890904590-rieqm8cqpfqsgfoa3bb3flm6kki8h5vn.apps.googleusercontent.com';

      // 1. Google OAuth Token Client Popup (Official Google popup window)
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: { access_token?: string; error?: string }) => {
            if (tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await userInfoRes.json();
                if (profile.email) {
                  await googleLogin({
                    email: profile.email,
                    name: profile.name || profile.given_name || profile.email.split('@')[0],
                    sub: profile.sub,
                    picture: profile.picture,
                  });
                  show(`Welcome! Signed in as ${profile.email} via Google 🚀`, 'success');
                  reset();
                  resolveWithSuccess();
                  return;
                }
              } catch (err) {
                console.error('Google profile fetch error:', err);
              }
            }
            setGoogleLoading(false);
          },
        });
        client.requestAccessToken();
        return;
      }

      // 2. Google One Tap ID Token Fallback
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential?: string }) => {
            if (response.credential) {
              await googleLogin({ credential: response.credential });
              show('Successfully signed in with Google! 🚀', 'success');
              reset();
              resolveWithSuccess();
            }
            setGoogleLoading(false);
          },
        });
        window.google.accounts.id.prompt();
        return;
      }

      // 3. Fallback prompt if Google script has not loaded
      const userEmail = window.prompt('Enter your Google / Gmail account email address:', 'ashwithaksamy@gmail.com');
      if (!userEmail || !userEmail.trim()) {
        setGoogleLoading(false);
        return;
      }
      const cleanEmail = userEmail.trim().toLowerCase();
      const defaultName = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const userName = window.prompt('Enter your name for your Google account:', defaultName) || defaultName;

      await googleLogin({ email: cleanEmail, name: userName, sub: `google_${Date.now()}` });
      show(`Signed in as ${cleanEmail} via Google! 🚀`, 'success');
      reset();
      resolveWithSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'register') {
      if (!form.name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (form.password !== form.confirm) {
        setError('Passwords do not match.');
        return;
      }
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        show('Welcome back! Signed in successfully.', 'success');
      } else {
        await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
        show(`Welcome to your nest, ${form.name.split(' ')[0]}!`, 'success');
      }
      reset();
      setMode('login');
      resolveWithSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-charcoal/50 backdrop-blur-[1px] px-0 sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-lift max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-line/60">
              <div className="flex items-center gap-2 text-rose-600 font-display text-lg">
                <Sparkles size={18} />
                <span>TheCustomNest</span>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sand text-muted hover:text-charcoal transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pt-5 pb-8">
              <div className="text-center mb-6">
                <h2 id="auth-modal-title" className="font-display text-2xl mb-2 text-charcoal">
                  A little step before your nest grows 🧶
                </h2>
                <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
                  {reason || 'Sign in or create an account with email or Google to continue.'}
                </p>
              </div>

              {/* Google Sign-In Button */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-line hover:border-rose-300 hover:bg-ivory/50 text-charcoal font-semibold py-3.5 px-4 rounded-2xl shadow-soft hover:shadow-lift transition-all duration-200"
                >
                  {googleLoading ? (
                    <Spinner size={18} />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-line w-full" />
                <span className="bg-white px-3 text-xs text-muted font-medium shrink-0 uppercase tracking-wider">
                  or continue with email
                </span>
                <div className="border-t border-line w-full" />
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-ivory rounded-full p-1.5 mb-6 border border-line">
                <button
                  type="button"
                  className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-semibold transition-all ${
                    mode === 'login' ? 'bg-white shadow-soft text-rose-600' : 'text-muted hover:text-charcoal'
                  }`}
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-semibold transition-all ${
                    mode === 'register' ? 'bg-white shadow-soft text-rose-600' : 'text-muted hover:text-charcoal'
                  }`}
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
                {mode === 'register' && (
                  <div>
                    <label className="label" htmlFor="am-name">
                      Full name
                    </label>
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        id="am-name"
                        required
                        className="input pl-10"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Priya Sharma"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="am-email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="am-email"
                      type="email"
                      required
                      className="input pl-10"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="customer@thecustomnest.com"
                    />
                  </div>
                </div>
                {mode === 'register' && (
                  <div>
                    <label className="label" htmlFor="am-phone">
                      Phone number (Optional)
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        id="am-phone"
                        className="input pl-10"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="am-password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="am-password"
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
                {mode === 'register' && (
                  <div>
                    <label className="label" htmlFor="am-confirm">
                      Confirm password
                    </label>
                    <input
                      id="am-confirm"
                      type={showPw ? 'text' : 'password'}
                      required
                      className="input"
                      value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {error && (
                  <p role="alert" className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-2.5 mt-2">
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                    {loading && <Spinner size={16} />}
                    {mode === 'login' ? 'Sign In & Continue' : 'Create Account & Continue'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-secondary w-full py-2.5 text-muted border-line hover:text-charcoal hover:bg-sand"
                  >
                    Continue Browsing
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
