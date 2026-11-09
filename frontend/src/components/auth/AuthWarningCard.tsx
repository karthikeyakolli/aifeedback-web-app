import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Cloud,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Sparkles,
  UserCheck,
  X,
  ExternalLink,
  Zap,
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

  // Auto-reconnect state for network / waking-up scenarios
  const [countdown, setCountdown] = useState<number>(5);
  const [attempt, setAttempt] = useState<number>(1);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  const errLower = (error || '').toLowerCase();

  const isNetwork =
    errLower.includes('failed to fetch') ||
    errLower.includes('unable to reach') ||
    errLower.includes('waking up') ||
    errLower.includes('sleep') ||
    errLower.includes('network') ||
    errLower.includes('offline') ||
    errLower.includes('connection') ||
    errLower.includes('resuming') ||
    errLower.includes('initializing') ||
    errLower.includes('timeout');

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

  // Periodic health check and auto-retry loop when network latency is encountered
  useEffect(() => {
    if (!isNetwork || !onRetry) return;

    setCountdown(5);
    setAttempt(1);

    timerRef.current = setInterval(async () => {
      setCountdown((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Trigger health check on countdown completion
        setIsCheckingHealth(true);
        api
          .pingHealth()
          .then((isAlive) => {
            setIsCheckingHealth(false);
            if (isAlive) {
              clearInterval(timerRef.current);
              onRetry();
            } else {
              setAttempt((a) => (a < 5 ? a + 1 : 1));
            }
          })
          .catch(() => {
            setIsCheckingHealth(false);
            setAttempt((a) => (a < 5 ? a + 1 : 1));
          });

        return 5;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isNetwork, onRetry]);

  const handleManualRetry = async () => {
    setIsCheckingHealth(true);
    try {
      const isAlive = await api.pingHealth();
      if (isAlive && onRetry) {
        onRetry();
      }
    } catch {
      // ignore
    } finally {
      setIsCheckingHealth(false);
    }
  };

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

  if (!error) return null;

  // ---------------------------------------------------------------------------
  // 1. Network / Cloud Sync Initializing State
  // ---------------------------------------------------------------------------
  if (isNetwork) {
    return (
      <div
        role="alert"
        className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-md p-4 text-xs transition-all animate-fade-in ${className}`}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-xs">
            <Cloud className={`w-4 h-4 ${isCheckingHealth ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                  Connecting to Cloud Engine
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Auto-sync active
                </span>
              </div>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-amber-900/90 dark:text-amber-200/80 leading-relaxed text-xs">
              Establishing high-speed session with our cloud backend. Auto-reconnecting in{' '}
              <span className="font-mono font-bold underline">{countdown}s</span> (Attempt {attempt}/5).
            </p>

            {/* Visual animated sync bar */}
            <div className="w-full h-1 bg-amber-500/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>

            <div className="pt-1.5 flex flex-wrap items-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={handleManualRetry}
                  disabled={isCheckingHealth}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                  <span>{isCheckingHealth ? 'Checking...' : 'Reconnect Now'}</span>
                </button>
              )}

              {onQuickDemoLogin && (
                <button
                  type="button"
                  onClick={onQuickDemoLogin}
                  className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-100 font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Enter via Demo Mode</span>
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
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                Email Verification Required
              </span>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-indigo-900/90 dark:text-indigo-200/80 leading-relaxed text-xs">
              {instantVerifySuccess
                ? 'Your email was successfully verified! You can now sign in immediately.'
                : error}
            </p>

            {instantVerifyError && (
              <p className="text-rose-600 dark:text-rose-400 text-xs font-medium">
                {instantVerifyError}
              </p>
            )}

            <div className="pt-1.5 flex flex-wrap items-center gap-2">
              {email && !instantVerifySuccess && (
                <button
                  type="button"
                  onClick={handleInstantVerify}
                  disabled={isInstantVerifying}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Zap className={`w-3 h-3 ${isInstantVerifying ? 'animate-spin' : ''}`} />
                  <span>{isInstantVerifying ? 'Verifying...' : 'Instant 1-Click Verify'}</span>
                </button>
              )}

              {instantVerifySuccess && onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>Continue to Sign In →</span>
                </button>
              )}

              <Link
                to={`/verify-email?email=${encodeURIComponent(email || '')}`}
                className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 font-semibold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Verification Portal</span>
                <ExternalLink className="w-3 h-3" />
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
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30 shadow-xs">
            <UserCheck className="w-4 h-4" />
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sky-900 dark:text-sky-200 text-sm">
                Account Already Exists
              </span>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-sky-900/90 dark:text-sky-200/80 leading-relaxed text-xs">
              An account with this email or username is already registered. You can sign in directly.
            </p>

            <div className="pt-1.5 flex items-center gap-2">
              {onSwitchMode ? (
                <button
                  type="button"
                  onClick={() => onSwitchMode('login')}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Switch to Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs"
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
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-xs">
          <KeyRound className="w-4 h-4" />
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200 text-sm">
              {isCredentials ? 'Invalid Credentials' : 'Authentication Notice'}
            </span>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-rose-900/90 dark:text-rose-200/80 leading-relaxed text-xs">
            {error}
          </p>

          <div className="pt-1.5 flex flex-wrap items-center gap-3">
            {onSwitchMode ? (
              <button
                type="button"
                onClick={() => onSwitchMode('forgot')}
                className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:opacity-80 cursor-pointer"
              >
                Forgot your password?
              </button>
            ) : (
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:opacity-80"
              >
                Forgot your password?
              </Link>
            )}

            {onQuickDemoLogin && (
              <span className="text-xs text-slate-400">•</span>
            )}

            {onQuickDemoLogin && (
              <button
                type="button"
                onClick={onQuickDemoLogin}
                className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Use Instant Demo Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
