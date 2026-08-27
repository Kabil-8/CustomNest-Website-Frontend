import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../ui';

export function LoginForm() {
  const { login, googleLogin } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from ?? '/account';

  const handleAutoFillDemo = () => {
    setForm({ email: 'customer@thecustomnest.com', password: 'password123' });
    show('Demo credentials populated! Click Sign In to enter.', 'info');
  };

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
                  show(`Welcome back! Signed in as ${profile.email} via Google`, 'success');
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
      show(`Welcome back! Signed in as ${cleanEmail} via Google`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!form.password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password);
      show('Welcome back to TheCustomNest!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-5">
        <span className="eyebrow mb-1 text-rose-500">Welcome Back</span>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal font-bold">
          Sign In to Your Nest
        </h1>
        <p className="text-muted text-xs sm:text-sm mt-1">
          Access your orders, saved favorites, and custom requests.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card p-5 sm:p-6 flex flex-col gap-3.5" noValidate>
        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full border border-line bg-white hover:bg-rose-50/50 text-charcoal font-semibold hover:border-rose-300 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl shadow-soft transition-all text-xs sm:text-sm"
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
          <span>Sign in with Google</span>
        </button>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-2.5 text-muted font-medium tracking-wider">Or email sign in</span>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="label text-xs mb-1" htmlFor="login-email">
            Email Address
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="login-email"
              type="email"
              required
              className="input pl-9 text-xs sm:text-sm py-2.5"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="customer@thecustomnest.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label text-xs" htmlFor="login-password">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-rose-600 hover:underline font-medium">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              required
              className="input pl-9 pr-9 text-xs sm:text-sm py-2.5"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal p-1"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Demo Credentials Pill */}
        <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between text-xs text-charcoal">
          <div className="truncate pr-2">
            <span className="text-rose-600 font-bold mr-1">Demo:</span>
            <span className="font-mono text-[11px] text-muted">customer@thecustomnest.com</span>
          </div>
          <button
            type="button"
            onClick={handleAutoFillDemo}
            className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all text-[11px] shrink-0"
          >
            Auto-fill
          </button>
        </div>

        {/* Remember me */}
        <div className="flex items-center text-xs text-muted">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-line text-rose-600 focus:ring-rose-500"
            />
            <span>Remember me on this device</span>
          </label>
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger bg-danger/10 rounded-xl px-3.5 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 mt-1">
          {loading ? (
            <Spinner size={16} />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs sm:text-sm text-muted mt-4">
        New to TheCustomNest?{' '}
        <Link to="/register" className="text-rose-600 font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
