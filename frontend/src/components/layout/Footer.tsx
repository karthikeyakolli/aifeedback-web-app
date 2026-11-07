import { ShieldCheck, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--border-default)] bg-[var(--surface)] mt-16 text-xs text-[var(--text-muted)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">
              FeedbackAI
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <span>Product Intelligence Network</span>
          </div>

          <div className="flex items-center gap-4 text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Grounded Evidence
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              Verified AI Pipeline
            </span>
          </div>

          <p className="text-[11px] text-[var(--text-muted)]">
            Verified releases & community discussions.
          </p>
        </div>
      </div>
    </footer>
  );
};
