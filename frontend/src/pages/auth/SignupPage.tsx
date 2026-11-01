import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, AtSign, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { AuthVisualPanel } from './AuthVisualPanel';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  ResearchIntel
                </span>
              </Link>

              <Link
                to="/login"
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <span className="hidden sm:inline">Already registered? </span><span className="text-indigo-600 dark:text-indigo-400">Sign in</span>
              </Link>
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Create your account
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Join founders and reviewers extracting actionable evidence from authentic community discussion.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{error}</span>
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
