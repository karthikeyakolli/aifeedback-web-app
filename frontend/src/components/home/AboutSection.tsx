import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Cpu,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../common/Button';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="w-full py-16 sm:py-20 border-b border-[var(--border-default)]/60 bg-[var(--surface)] relative overflow-hidden"
      aria-label="About FeedbackAI"
    >
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[260px] bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-raised)] mb-4 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>About FeedbackAI</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight mb-4">
            The Product Feedback & Intelligence Network
          </h2>

          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed text-balance">
            FeedbackAI bridges the gap between software creators and real users. We replace shallow reviews with structured public dialogue, verifiable AI-powered finding synthesis, and secure Android APK distribution.
          </p>
        </div>

        {/* 3 Core Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Community Discussions */}
          <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/40 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Public Group Discussions
              </h3>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Every application features a dedicated public discussion hub. Share feedback, report bugs, ask architectural questions, and participate in threaded discussions directly with creators.
              </p>
            </div>

            <div className="pt-5 mt-5 border-t border-[var(--border-default)]/60 space-y-2 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Threaded replies & markdown</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Helpful community upvoting</span>
              </div>
            </div>
          </div>

          {/* Card 2: Grounded AI Intelligence */}
          <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/40 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[var(--accent)] border border-blue-100 flex items-center justify-center font-bold transition-transform">
                <Cpu className="w-5 h-5" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Grounded AI Synthesis
              </h3>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Creators run deep AI research across project source documents, design files, and community feedback. Every finding is backed by exact quote citations and source line offsets.
              </p>
            </div>

            <div className="pt-5 mt-5 border-t border-[var(--border-default)]/60 space-y-2 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero-hallucination quote evidence</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Multi-model cascade (Gemini, OpenRouter, Groq)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Verified APK Distribution */}
          <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--accent)]/40 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Verified Android APKs
              </h3>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Builders publish test builds directly to Android users. Every upload computes an immutable SHA-256 checksum and enters a private quarantine stage before creator authorization.
              </p>
            </div>

            <div className="pt-5 mt-5 border-t border-[var(--border-default)]/60 space-y-2 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>SHA-256 checksum verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Quarantine state machine protection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Ready to showcase your product or join the discussion?
            </h4>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Publishing is free, instant, and directly connects you with active testers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/explore">
              <Button variant="outline" size="sm" className="font-semibold cursor-pointer text-xs">
                Explore Projects
              </Button>
            </Link>
            <Link to="/publish">
              <Button size="sm" className="font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs bg-[var(--accent)] text-white">
                <span>Publish Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
