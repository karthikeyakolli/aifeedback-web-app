import React from 'react';
import { Sparkles, Shield, Split, FileCheck } from 'lucide-react';

export const AuthVisualPanel: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0d1321] text-white border-l border-slate-800 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand */}
      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Product Research Intelligence Community</span>
        </div>
        <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight leading-snug text-white">
          Turn Raw Feedback into <span className="text-indigo-400">Grounded PRDs</span>
        </h2>
        <p className="text-xs xl:text-sm text-slate-300 leading-relaxed max-w-md">
          A dedicated community for founders, product engineers, and designers. Unvarnished critique without vanity metrics or retaliation.
        </p>
      </div>

      {/* 3 Core Value Pillars */}
      <div className="relative z-10 space-y-4 my-8">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>1. Candid Anonymity</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Contributors can share unfiltered feedback with confidence. Identities are cryptographically masked from public responses.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs space-y-1.5">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold">
            <Split className="w-4 h-4 text-blue-400" />
            <span>2. Bounded Discussion Threading</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Structured reply hierarchy bounded to depth 2 to prevent mobile staircasing while preserving context.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>3. Dual-Source AI Research Grounding</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Synthesize user feedback alongside uploaded project specifications (.pdf, .md, .txt) with verified citations and zero hallucination.
          </p>
        </div>
      </div>

      {/* Bottom Footer Quote */}
      <div className="relative z-10 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Targeting WCAG 2.2 AA & PAIR Guidelines</span>
        <span className="font-mono">v1.2.0</span>
      </div>
    </div>
  );
};

