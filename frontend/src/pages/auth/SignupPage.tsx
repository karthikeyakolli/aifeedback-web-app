import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, AtSign, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';
import { Button } from '../../components/common/Button';
import { AuthVisualPanel } from './AuthVisualPanel';
import { AuthWarningCard } from '../../components/auth/AuthWarningCard';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, isAuthenticated, quickLoginDev } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
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
      setError(err.message || 'Failed to initialize Google signup');
      setIsOAuthLoading(false);
    }
  };

  // If already authenticated, redirect to /
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Live password strength calculation
  const hasMinLength = password.length >= 8;
  const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperAndLower && hasNumberOrSymbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Please provide your full name or display name.');
      return;
    }
    if (!username.trim()) {
      setError('Please provide a unique username.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please ensure your password satisfies all security criteria below.');
      return;
    }
    if (!agreedTerms) {
      setError('Please acknowledge the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        email: email.trim(),
        password,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details or choose another username.');
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
            <div className="flex items-center justify-between mb-6">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                  FeedbackAI
                </span>
              </Link>

              <Link
                to="/login"
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <span className="hidden sm:inline">Already registered? </span><span className="text-[var(--accent)] font-bold">Sign in</span>
              </Link>
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                Create your account
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Join creators and community members sharing authentic feedback on products.
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
                onQuickDemoLogin={quickLoginDev ? () => quickLoginDev('creator') : undefined}
                onDismiss={() => setError(null)}
                className="mb-5"
              />
            )}

            {/* Google OAuth Signup */}
            {isSupabaseConfigured() && (
              <div className="mb-5 space-y-3">
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
                  <span>Sign up with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[var(--border-subtle)] w-full" />
                  <span className="bg-[var(--bg-surface)] px-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider absolute">
                    or with email
                  </span>
                </div>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="signup-name" className="block text-xs font-semibold text-[var(--text-primary)]">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-username" className="block text-xs font-semibold text-[var(--text-primary)]">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="signup-username"
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="alexrivera"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="signup-email" className="block text-xs font-semibold text-[var(--text-primary)]">
                  Work or personal email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="signup-password" className="block text-xs font-semibold text-[var(--text-primary)]">
                  Create secure password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
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

                {/* Password Criteria Checklist */}
                <div className="pt-2 pb-1 space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px]">
                    {hasMinLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {hasUpperAndLower ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span className={hasUpperAndLower ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
                      Uppercase and lowercase letters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {hasNumberOrSymbol ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span className={hasNumberOrSymbol ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
                      At least one number or special symbol
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="agree-terms" className="text-[11px] text-[var(--text-muted)] leading-relaxed cursor-pointer">
                  I agree to the Community Guidelines, Terms of Service, and acknowledge that contributions marked anonymous protect my identity.
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                variant="primary"
                isLoading={isLoading}
                className="w-full justify-center text-sm font-semibold mt-2 min-h-[44px]"
              >
                Create Account
              </Button>
            </form>
          </div>

          {/* Footer Link */}
          <div className="pt-6 text-center text-xs text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign in here
            </Link>
          </div>
        </div>

        {/* Right Benefit Visual Panel */}
        <AuthVisualPanel />
      </div>
    </div>
  );
};
