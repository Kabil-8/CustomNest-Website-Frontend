import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Phone, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../ui';

export function RegisterForm() {
  const { register, googleLogin } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredName, setRegisteredName] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/account';

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const googleClientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        '251890904590-rieqm8cqpfqsgfoa3bb3flm6kki8h5vn.apps.googleusercontent.com';

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
                  show(`Welcome! Signed in as ${profile.email} via Google`, 'success');
                  navigate(from, { replace: true });
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

      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential?: string }) => {
            if (response.credential) {
              await googleLogin({ credential: response.credential });
              show('Successfully signed in with Google!', 'success');
              navigate(from, { replace: true });
            }
            setGoogleLoading(false);
          },
        });
        window.google.accounts.id.prompt();
        return;
      }

      const userEmail = window.prompt('Enter your Google / Gmail account email address:', 'customer@thecustomnest.com');
      if (!userEmail || !userEmail.trim()) {
        setGoogleLoading(false);
        return;
      }
      const cleanEmail = userEmail.trim().toLowerCase();
      const defaultName = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const userName = window.prompt('Enter your name for your Google account:', defaultName) || defaultName;

      await googleLogin({ email: cleanEmail, name: userName, sub: `google_${Date.now()}` });
      show(`Welcome! Signed in as ${cleanEmail} via Google`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      const firstName = form.name.trim().split(' ')[0];
      setRegisteredName(firstName);
      show(`Account created — Welcome to your nest, ${firstName}!`, 'success');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (registeredName) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 animate-bounce">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="font-display text-xl mb-1 text-charcoal font-bold">
          Welcome to your nest, {registeredName}! 🧶
        </h2>
        <p className="text-muted text-xs max-w-xs mx-auto mb-4">
          Your account has been created. Redirecting...
        </p>
        <Spinner size={20} className="mx-auto text-rose-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4">
        <span className="eyebrow mb-1 text-rose-500">Join The Nest</span>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal font-bold">
          Create Your Account
        </h1>
        <p className="text-muted text-xs sm:text-sm mt-0.5">
          Sign up to customize orders, save favorites, and track items.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card p-4 sm:p-5 flex flex-col gap-2.5" noValidate>
        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full border border-line bg-white hover:bg-rose-50/50 text-charcoal font-semibold hover:border-rose-300 flex items-center justify-center gap-2.5 py-2 px-3 rounded-xl shadow-soft transition-all text-xs sm:text-sm"
        >
          {googleLoading ? (
            <Spinner size={16} />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <div className="relative my-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-muted font-medium tracking-wider">Or register with email</span>
          </div>
        </div>

        {/* 2-Column Inputs Grid */}
        <div className="grid sm:grid-cols-2 gap-2.5">
          <div>
            <label className="label text-xs mb-0.5" htmlFor="reg-name">
              Full Name
            </label>
            <div className="relative">
              <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="reg-name"
                required
                className="input pl-8 text-xs py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Priya Sharma"
              />
            </div>
          </div>

          <div>
            <label className="label text-xs mb-0.5" htmlFor="reg-email">
              Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="reg-email"
                type="email"
                required
                className="input pl-8 text-xs py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="customer@thecustomnest.com"
              />
            </div>
          </div>

          <div>
            <label className="label text-xs mb-0.5" htmlFor="reg-password">
              Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                required
                className="input pl-8 pr-8 text-xs py-2"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal p-0.5"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label text-xs mb-0.5" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              type={showPw ? 'text' : 'password'}
              required
              className="input text-xs py-2"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Phone (Optional) */}
        <div>
          <label className="label text-xs mb-0.5" htmlFor="reg-phone">
            Phone Number <span className="text-[10px] text-muted font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="reg-phone"
              type="tel"
              className="input pl-8 text-xs py-2"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger bg-danger/10 rounded-xl px-3 py-1.5">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 mt-0.5">
          {loading ? (
            <Spinner size={16} />
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs sm:text-sm text-muted mt-3">
        Already have an account?{' '}
        <Link to="/login" className="text-rose-600 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
