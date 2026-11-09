import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';
import { Button } from '../../components/common/Button';
import { AuthVisualPanel } from './AuthVisualPanel';
import { AuthWarningCard } from '../../components/auth/AuthWarningCard';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated, quickLoginDev } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const handleOAuth = async () => {
    setError(null);
    setIsOAuthLoading(true);
    try {
      if (loginWithGoogle) {
        await loginWithGoogle();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Google login');
      setIsOAuthLoading(false);
    }
  };

  // If already authenticated, redirect to previous location or /
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(cleanEmail, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--bg-app)] text-[var(--text-primary)]">
      <div className="w-full max-w-5xl rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Form Area */}
        <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                  FeedbackAI
                </span>
              </Link>

              <Link
                to="/"
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                ← <span className="hidden sm:inline">Back to Overview</span><span className="sm:hidden">Back</span>
              </Link>
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                Welcome back
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Sign in to manage your projects, track reviews, and explore AI findings.
              </p>
            </div>

            {/* Redesigned Warning / Error Banner */}
            {error && (
              <AuthWarningCard
                error={error}
                email={email}
                onRetry={() => {
                  setError(null);
                  handleSubmit(new Event('submit') as any);
                }}
                onAutoVerified={() => {
                  setError(null);
                  handleSubmit(new Event('submit') as any);
                }}
                onQuickDemoLogin={quickLoginDev ? () => quickLoginDev('creator') : undefined}
                onDismiss={() => setError(null)}
                className="mb-6"
              />
            )}

            {/* Google OAuth Login */}
            {isSupabaseConfigured() && (
              <div className="mb-6 space-y-3">
                <button
                  type="button"
                  disabled={isOAuthLoading || isLoading}
                  onClick={handleOAuth}
                  className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 min-h-[44px]"
                >
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
                  <span>Sign in with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[var(--border-subtle)] w-full" />
                  <span className="bg-[var(--bg-surface)] px-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider absolute">
                    or continue with email
                  </span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[var(--text-primary)]"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[var(--text-primary)]"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                variant="primary"
                isLoading={isLoading}
                className="w-full justify-center text-sm font-semibold mt-2 min-h-[44px]"
              >
                Sign in to Account
              </Button>
            </form>
          </div>

          {/* Footer Link */}
          <div className="pt-6 text-center text-xs text-[var(--text-muted)]">
            Don't have an account yet?{' '}
            <Link
              to="/signup"
              className="font-bold text-[var(--accent)] hover:underline"
            >
              Create free account
            </Link>
          </div>
        </div>

        {/* Right Benefit Visual Panel */}
        <AuthVisualPanel />
      </div>
    </div>
  );
};
