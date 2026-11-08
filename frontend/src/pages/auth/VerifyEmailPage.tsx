import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, MailCheck, RefreshCw, ArrowLeft, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { api } from '../../services/api';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = searchParams.get('email') || '';

  const [inputEmail, setInputEmail] = useState(emailParam);
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isInstantVerifying, setIsInstantVerifying] = useState(false);
  const [instantSuccess, setInstantSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const activeEmail = (inputEmail || emailParam).trim();

  const handleInstantVerify = async () => {
    if (!activeEmail) {
      setErrorMessage('Please provide an email address to verify.');
      return;
    }
    setErrorMessage(null);
    setIsInstantVerifying(true);
    setResendSuccess(false);

    try {
      const res = await api.confirmEmail(activeEmail);
      setInstantSuccess(res.message || `Email '${activeEmail}' verified successfully!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Auto-verification failed. You can sign in directly.');
    } finally {
      setIsInstantVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    if (!activeEmail) {
      setErrorMessage('Please provide an email address.');
      return;
    }
    setIsResending(true);
    setResendSuccess(false);
    setErrorMessage(null);

    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.resend({
          type: 'signup',
          email: activeEmail,
        });
      }
      setResendSuccess(true);
      setCooldown(60);
    } catch {
      // Cooldown regardless to prevent spamming
      setCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-app)] text-[var(--text-primary)]">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl text-center space-y-6">
        {/* Brand */}
        <div className="flex justify-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
              FeedbackAI
            </span>
          </Link>
        </div>

        {/* Verification Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
          {instantSuccess ? <ShieldCheck className="w-7 h-7 text-emerald-500" /> : <MailCheck className="w-7 h-7" />}
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {instantSuccess ? 'Email Verified Successfully!' : 'Verify your email address'}
          </h1>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {instantSuccess ? (
              instantSuccess
            ) : (
              <>
                Confirm your account to sign in immediately. If you have not received an email, you can click{' '}
                <strong className="text-[var(--text-primary)]">Instant Verify</strong> below.
              </>
            )}
          </p>
        </div>

        {!emailParam && !instantSuccess && (
          <div className="text-left space-y-1.5">
            <label htmlFor="verify-email-input" className="block text-xs font-semibold text-[var(--text-primary)]">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="verify-email-input"
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs text-left">
            {errorMessage}
          </div>
        )}

        {resendSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Verification email re-sent. Please check your inbox and spam folder.</span>
          </div>
        )}

        {instantSuccess ? (
          <div className="pt-2 space-y-3">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate('/login')}
              className="w-full justify-center min-h-[44px]"
            >
              Sign In to Your Account
            </Button>
          </div>
        ) : (
          <div className="pt-2 space-y-3">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleInstantVerify}
              isLoading={isInstantVerifying}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
              className="w-full justify-center min-h-[44px]"
            >
              Instant Verify Email
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              isLoading={isResending}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />}
              className="w-full justify-center min-h-[44px]"
            >
              {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend Verification Email'}
            </Button>

            <Link to="/login" className="block">
              <Button variant="ghost" size="sm" className="w-full justify-center">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

