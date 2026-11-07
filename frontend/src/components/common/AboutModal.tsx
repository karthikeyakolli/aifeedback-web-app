import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { Button } from './Button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="About FeedbackAI"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[var(--surface)] text-[var(--text-primary)] rounded-3xl border border-[var(--border-default)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                About FeedbackAI
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                The Product Feedback & Intelligence Network
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Mission */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider text-[var(--accent)]">
              Our Mission
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              FeedbackAI helps builders craft better software by directly connecting them with active tester communities. We replace shallow 5-star ratings with deep, threaded feedback, AI-synthesized research grounded in real source evidence, and verified Android APK distribution.
            </p>
          </div>

          {/* Core Capabilities */}
          <div className="space-y-4 pt-4 border-t border-[var(--border-default)]/60">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Core Platform Capabilities
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)]/30 space-y-2">
                <MessageSquare className="w-5 h-5 text-sky-500" />
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Public Discussions</h4>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Real-time threaded community dialogue with author attribution, markdown support, and helpful upvoting.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)]/30 space-y-2">
                <Cpu className="w-5 h-5 text-indigo-500" />
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Grounded AI</h4>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Multi-provider AI synthesis across project documents and discussions with verified line-level citations.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-raised)]/30 space-y-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Verified APKs</h4>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Secure Android distribution featuring SHA-256 verification and quarantine approval controls.
                </p>
              </div>
            </div>
          </div>

          {/* Open Architecture */}
          <div className="p-4 rounded-2xl bg-[var(--surface-raised)]/40 border border-[var(--border-default)] space-y-2 text-xs">
            <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Free & Open for All Builders</span>
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Anyone can explore applications, test Android builds, or publish a project to gather constructive feedback. Creators retain full ownership of their code, APKs, and data.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--canvas)] flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Link to="/explore" onClick={onClose}>
              <Button variant="outline" size="sm">
                Explore Projects
              </Button>
            </Link>
            <Link to="/publish" onClick={onClose}>
              <Button size="sm">
                Publish Project
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
