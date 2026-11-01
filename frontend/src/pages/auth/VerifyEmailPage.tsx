import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, MailCheck, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccess(false);

    try {
      if (isSupabaseConfigured() && supabase && emailParam) {
        await supabase.auth.resend({
          type: 'signup',
          email: emailParam,
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
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              ResearchIntel
            </span>
          </Link>
        </div>

        {/* Verification Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
          <MailCheck className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Verify your email address
          </h1>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            We've dispatched a confirmation link to{' '}
            {emailParam ? (
              <strong className="text-[var(--text-primary)]">{emailParam}</strong>
            ) : (
              'your inbox'
            )}
            . Click the link to complete account setup and unlock full research publishing privileges.
          </p>
        </div>

        {resendSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Verification email re-sent. Please check your inbox and spam folder.</span>
          </div>
        )}

        <div className="pt-2 space-y-3">
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
      </div>
    </div>
  );
};

