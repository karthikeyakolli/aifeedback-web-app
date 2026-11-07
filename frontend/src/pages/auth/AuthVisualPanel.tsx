import React from 'react';
import { Sparkles, MessageSquare, ShieldCheck, Cpu } from 'lucide-react';

export const AuthVisualPanel: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 bg-[var(--surface-raised)] text-[var(--text-primary)] border-l border-[var(--border-default)] relative overflow-hidden select-none">
      {/* Top Brand */}
      <div className="relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border-default)] text-[var(--accent)] text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Product Feedback & Intelligence Network</span>
        </div>
        <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight leading-snug text-[var(--text-primary)]">
          Bridge Software Creators & Active Communities
        </h2>
        <p className="text-xs xl:text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
          A dedicated network for founders, software engineers, and product designers. Structured public dialogue, verified AI research synthesis, and safe Android APK releases.
        </p>
      </div>

      {/* 3 Core Value Pillars */}
      <div className="relative z-10 space-y-3.5 my-8">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-default)] shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-sky-600 text-xs font-bold">
            <MessageSquare className="w-4 h-4 text-sky-600" />
            <span>1. Public Discussion Hubs</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Every application features a dedicated public discussion space with threaded replies, markdown formatting, and helpful upvoting.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-default)] shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-bold">
            <Cpu className="w-4 h-4 text-[var(--accent)]" />
            <span>2. Grounded AI Synthesis</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Multi-model research engine extracts recurring themes, user friction points, and action items with exact line-level quote verification.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-default)] shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>3. Verified Android Releases</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Direct APK release channel featuring immutable SHA-256 verification and quarantine approval states before public user distribution.
          </p>
        </div>
      </div>

      {/* Bottom Footer Meta */}
      <div className="relative z-10 pt-4 border-t border-[var(--border-default)]/60 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span>100% Free & Open Architecture</span>
        <span>Secure Local & Cloud Storage</span>
      </div>
    </div>
  );
};
