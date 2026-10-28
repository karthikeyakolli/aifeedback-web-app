import { ShieldCheck, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#070a12]/80 mt-16 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Product Research Intelligence
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span>Phase 1 Verified Foundation</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Community-Grounded Evidence
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              AI as Research Assistant
            </span>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Anonymous contributions are cryptographically protected.
          </p>
        </div>
      </div>
    </footer>
  );
};
