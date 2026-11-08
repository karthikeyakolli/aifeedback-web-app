import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Sparkles,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { isSupabaseConfigured } from '../../services/supabase';
import { Button } from '../common/Button';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    login,
    signup,
    loginWithGoogle,
    loginWithGitHub,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  // Sync mode with context when modal opens
  useEffect(() => {
    setMode(authModalMode);
    setError(null);
    setSuccessMessage(null);
    setShowPassword(false);
  }, [authModalMode, isAuthModalOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  // Password strength heuristics for signup
  const hasMinLength = password.length >= 8;
  const hasMixedChars = /[a-zA-Z]/.test(password) && /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordStrong = hasMinLength && hasMixedChars;

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    setIsOAuthLoading(true);
    try {
      if (provider === 'google' && loginWithGoogle) {
        await loginWithGoogle();
      } else if (provider === 'github' && loginWithGitHub) {
        await loginWithGitHub();
      }
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
      setIsOAuthLoading(false);
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    // Auto-generate clean Display Name if user hasn't explicitly customized it
    if (!displayName || displayName === username.replace(/_/g, ' ')) {
      const formatted = val
        .replace(/_/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      setDisplayName(formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();

    if (mode === 'signup') {
      if (!username.trim() || !displayName.trim()) {
        setError('Please provide a unique username and display name.');
        return;
      }
      if (!hasMinLength) {
        setError('Password must be at least 8 characters long.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(cleanEmail, password);
      } else if (mode === 'signup') {
        await signup({
          email: cleanEmail,
          password,
          username: username.trim().toLowerCase().replace(/\s+/g, '_'),
          displayName: displayName.trim(),
          bio: bio.trim(),
        });
      } else if (mode === 'forgot') {
        if (!cleanEmail) {
          setError('Please enter your account email address.');
          setIsSubmitting(false);
          return;
        }
        const res = await api.requestPasswordReset(cleanEmail);
        setSuccessMessage(res.message || 'If an account exists, a recovery token has been prepared.');
        if (res.devToken) {
          setResetToken(res.devToken);
          setMode('reset');
        } else {
          setMode('reset');
        }
      } else if (mode === 'reset') {
        if (!resetToken || !newPassword) {
          setError('Please provide both the reset token and your new password.');
          setIsSubmitting(false);
          return;
        }
        const res = await api.confirmPasswordReset(resetToken, newPassword);
        setSuccessMessage(res.message || 'Password reset successfully. You may now log in.');
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailExisting = error?.toLowerCase().includes('already exists') || error?.toLowerCase().includes('already registered');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[var(--surface)] rounded-2xl border border-[var(--border-default)] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                {mode === 'login'
                  ? 'Welcome Back'
                  : mode === 'signup'
                  ? 'Create Your Account'
                  : mode === 'forgot'
                  ? 'Recover Password'
                  : 'Set New Password'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {mode === 'login'
                  ? 'Sign in to review projects and explore AI intelligence'
                  : mode === 'signup'
                  ? 'Join creators and developers sharing authentic feedback'
                  : mode === 'forgot'
                  ? 'Enter your email to receive recovery instructions'
                  : 'Enter your reset token and new secure password'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Visible in login & signup modes) */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="flex border-b border-[var(--border-default)] px-6 pt-3 gap-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
                mode === 'login'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`pb-2.5 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
                mode === 'signup'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error notification banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
            {isEmailExisting && mode === 'signup' && (
              <div className="pt-1 pl-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Switch to Sign In →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success notification banner */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Social / OAuth Logins (Google & GitHub) */}
        {(mode === 'login' || mode === 'signup') && isSupabaseConfigured() && (
          <div className="px-6 pt-5 space-y-2.5">
            <button
              type="button"
              disabled={isOAuthLoading || isSubmitting}
              onClick={() => handleOAuth('google')}
              className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
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
              <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center pt-2">
              <div className="border-t border-[var(--border-default)] w-full" />
              <span className="bg-[var(--surface)] px-2.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider absolute">
                or with email
              </span>
            </div>
          </div>
        )}

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="alex_dev"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono text-xs transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex River"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password criteria hints for signup */}
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {hasMinLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-400 inline-block" />
                    )}
                    <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {isPasswordStrong ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-400 inline-block" />
                    )}
                    <span className={isPasswordStrong ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}>
                      Includes letters and numbers/symbols
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Bio <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Full-stack developer, founder, product builder"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
              />
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Reset Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter reset token"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full justify-center mt-3 cursor-pointer shadow-sm py-2.5 font-bold"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {mode === 'login'
              ? 'Sign In to FeedbackAI'
              : mode === 'signup'
              ? 'Complete Registration'
              : mode === 'forgot'
              ? 'Send Reset Token'
              : 'Update Password'}
          </Button>

          {(mode === 'forgot' || mode === 'reset') && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
