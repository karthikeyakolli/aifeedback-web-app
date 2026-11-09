import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CloudOff,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Sparkles,
  UserCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';

interface AuthWarningCardProps {
  error: string | null;
  email?: string;
  onRetry?: () => void;
  onQuickDemoLogin?: () => void;
  onAutoVerified?: () => void;
  onSwitchMode?: (mode: 'login' | 'signup' | 'forgot') => void;
  onDismiss?: () => void;
  className?: string;
}

export const AuthWarningCard: React.FC<AuthWarningCardProps> = ({
  error,
  email,
  onRetry,
  onQuickDemoLogin,
  onAutoVerified,
  onSwitchMode,
  onDismiss,
  className = '',
}) => {
  const [isInstantVerifying, setIsInstantVerifying] = useState(false);
  const [instantVerifySuccess, setInstantVerifySuccess] = useState(false);
  const [instantVerifyError, setInstantVerifyError] = useState<string | null>(null);

  if (!error) return null;

  const errLower = error.toLowerCase();
  const isNetwork =
    errLower.includes('failed to fetch') ||
    errLower.includes('unable to reach') ||
    errLower.includes('waking up') ||
    errLower.includes('sleep') ||
    errLower.includes('network') ||
    errLower.includes('offline') ||
    errLower.includes('connection');

  const isVerification =
    errLower.includes('confirm') ||
    errLower.includes('verif') ||
    errLower.includes('unconfirmed');

  const isAlreadyRegistered =
    errLower.includes('already registered') ||
    errLower.includes('already taken') ||
    errLower.includes('already exists');

  const isCredentials =
    errLower.includes('invalid email or password') ||
    errLower.includes('credentials') ||
    errLower.includes('password') ||
    errLower.includes('unauthorized');

  const handleInstantVerify = async () => {
    if (!email) return;
    setIsInstantVerifying(true);
    setInstantVerifyError(null);
    try {
      await api.confirmEmail(email.trim());
      setInstantVerifySuccess(true);
      if (onAutoVerified) {
        onAutoVerified();
      } else if (onRetry) {
        onRetry();
      }
    } catch (err: any) {
      setInstantVerifyError(err.message || 'Auto-verification failed.');
    } finally {
      setIsInstantVerifying(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. Network / Server Standby Wake-Up Warning State
  // ---------------------------------------------------------------------------
  if (isNetwork) {
    return (
      <div
        role="alert"
        className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-md p-4 text-xs transition-all animate-fade-in ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-xs">
            <CloudOff className="w-4 h-4 animate-pulse" />
          </div>

          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900 dark:text-amber-200 text-[13px]">
                  Backend Service Initializing
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Standby Mode
                </span>
              </div>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed text-[11px]">
              Our live Render cloud server spins down during inactivity. It is currently waking up (~20-30s). Your credentials are safe.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Connection</span>
                </button>
              )}

              {onQuickDemoLogin && (
                <button
                  type="button"
                  onClick={onQuickDemoLogin}
                  className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 font-semibold text-[11px] inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Use Creator Demo Session</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Email Verification Needed State
  // ---------------------------------------------------------------------------
  if (isVerification) {
    return (
      <div
        role="alert"
        className={`relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent backdrop-blur-md p-4 text-xs transition-all animate-fade-in ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>

          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 text-[13px]">
                Email Verification Required
              </span>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-indigo-800/90 dark:text-indigo-300/80 leading-relaxed text-[11px]">
              {instantVerifySuccess
                ? 'Your email was successfully verified! You can now sign in immediately.'
                : error}
            </p>

            {instantVerifyError && (
              <p className="text-rose-600 dark:text-rose-400 text-[11px]">
                {instantVerifyError}
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-2">
              {email && !instantVerifySuccess && (
                <button
                  type="button"
                  onClick={handleInstantVerify}
                  disabled={isInstantVerifying}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <ShieldCheck className={`w-3 h-3 ${isInstantVerifying ? 'animate-spin' : ''}`} />
                  <span>{isInstantVerifying ? 'Verifying...' : 'Instant 1-Click Verify'}</span>
                </button>
              )}

              {instantVerifySuccess && onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>Continue to Sign In →</span>
                </button>
              )}

              <Link
                to={`/verify-email?email=${encodeURIComponent(email || '')}`}
                className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Verification Portal</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Already Registered State (Signup Conflict)
  // ---------------------------------------------------------------------------
  if (isAlreadyRegistered) {
    return (
      <div
        role="alert"
        className={`relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent backdrop-blur-md p-4 text-xs transition-all animate-fade-in ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30 shadow-xs">
            <UserCheck className="w-4 h-4" />
          </div>

          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sky-900 dark:text-sky-200 text-[13px]">
                Account Already Exists
              </span>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-sky-800/90 dark:text-sky-300/80 leading-relaxed text-[11px]">
              An account with this email or username is already registered. You can sign in directly.
            </p>

            <div className="pt-2 flex items-center gap-2">
              {onSwitchMode ? (
                <button
                  type="button"
                  onClick={() => onSwitchMode('login')}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Switch to Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Invalid Credentials / Standard Warning State
  // ---------------------------------------------------------------------------
  return (
    <div
      role="alert"
      className={`relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent backdrop-blur-md p-4 text-xs transition-all animate-fade-in ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-xs">
          <KeyRound className="w-4 h-4" />
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200 text-[13px]">
              {isCredentials ? 'Invalid Credentials' : 'Authentication Notice'}
            </span>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-rose-800/90 dark:text-rose-300/80 leading-relaxed text-[11px]">
            {error}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            {onSwitchMode ? (
              <button
                type="button"
                onClick={() => onSwitchMode('forgot')}
                className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 underline hover:opacity-80"
              >
                Forgot your password?
              </button>
            ) : (
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 underline hover:opacity-80"
              >
                Forgot your password?
              </Link>
            )}

            {onQuickDemoLogin && (
              <span className="text-[11px] text-slate-400">•</span>
            )}

            {onQuickDemoLogin && (
              <button
                type="button"
                onClick={onQuickDemoLogin}
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Use Instant Demo Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
