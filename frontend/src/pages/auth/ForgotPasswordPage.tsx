import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please provide your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (resetErr) throw resetErr;
      }
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset. Please verify the email address.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-app)] text-[var(--text-primary)]">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              ResearchIntel
            </span>
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back to sign in</span><span className="sm:hidden">Sign in</span>
          </Link>
        </div>

        {isSubmitted ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Check your inbox
              </h1>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                If an account exists for <strong className="text-[var(--text-primary)]">{email}</strong>, you will receive password reset instructions shortly.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" size="md" className="w-full justify-center">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Reset your password
              </h1>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Enter your account email and we'll send a secure link to reset your credentials.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="block text-xs font-semibold text-[var(--text-primary)]">
                  Registered email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reset-email"
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

              <Button
                type="submit"
                size="lg"
                variant="primary"
                isLoading={isLoading}
                className="w-full justify-center text-sm font-semibold min-h-[44px]"
              >
                Send Reset Link
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
