import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface AppLoadingScreenProps {
  onRetry?: () => void;
  onContinueGuest?: () => void;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  onRetry,
  onContinueGuest,
}) => {
  const [showRecovery, setShowRecovery] = useState(false);

  // If initial load takes more than 5 seconds, surface a graceful recovery option
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRecovery(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors select-none"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-md -z-10" />
        </div>

        {/* Brand Titles */}
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
            FeedbackAI
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-medium">
            Product Intelligence Network
          </p>
        </div>

        {/* Active Loader */}
        <div className="flex flex-col items-center space-y-3 w-full max-w-xs">
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            Restoring authenticated workspace session...
          </span>
        </div>

        {/* Graceful Recovery / Timeout Fallback */}
        {showRecovery && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] text-xs space-y-3 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Session restoration is taking longer than usual</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              You can retry connecting or proceed as an anonymous community guest.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                  Retry
                </Button>
              )}
              {onContinueGuest && (
                <Button size="sm" variant="primary" onClick={onContinueGuest} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Continue as Guest
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

