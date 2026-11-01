import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { AuthVisualPanel } from './AuthVisualPanel';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemoUser, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginAsDemoUser();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
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
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  ResearchIntel
                </span>
              </Link>

              <Link
                to="/"
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                ← <span className="hidden sm:inline">Back to Community</span><span className="sm:hidden">Back</span>
              </Link>
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Sign in to manage your review requests, track feedback, and use the AI Research Studio.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="mb-6 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{error}</span>
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

            {/* Quick Demo Access */}
            <div className="mt-5 pt-5 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Sign In as Demo Product Founder (Sarah Chen)</span>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="pt-6 text-center text-xs text-[var(--text-muted)]">
            Don't have an account yet?{' '}
            <Link
              to="/signup"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
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
