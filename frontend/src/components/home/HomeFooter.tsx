import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const HomeFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--surface)] border-t border-[var(--border-default)] py-12 text-xs text-[var(--text-secondary)]" aria-label="Site Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-[var(--text-primary)] font-bold text-base">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>FeedbackAI</span>
            </Link>
            <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed">
              The product feedback intelligence network. Discover applications, connect with creator communities, and improve software together.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems & AI Pipelines Operational</span>
            </div>
          </div>

          {/* Product & Discovery */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">Discover</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/explore" className="hover:text-[var(--text-primary)] transition-colors">
                  Explore Projects
                </Link>
              </li>
              <li>
                <Link to="/explore?sort=trending" className="hover:text-[var(--text-primary)] transition-colors">
                  Trending Feed
                </Link>
              </li>
              <li>
                <Link to="/explore?sort=most_discussed" className="hover:text-[var(--text-primary)] transition-colors">
                  Most Discussed
                </Link>
              </li>
              <li>
                <Link to="/publish" className="hover:text-[var(--text-primary)] transition-colors">
                  Publish Your App
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Governance */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">Community</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/explore" className="hover:text-[var(--text-primary)] transition-colors">
                  Public Discussions
                </Link>
              </li>
              <li>
                <a href="#guidelines" className="hover:text-[var(--text-primary)] transition-colors">
                  Community Guidelines
                </a>
              </li>
              <li>
                <a href="#verification" className="hover:text-[var(--text-primary)] transition-colors">
                  APK Safety & Quarantine
                </a>
              </li>
              <li>
                <Link to="/settings" className="hover:text-[var(--text-primary)] transition-colors">
                  Account Preferences
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Safety */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">Trust & Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#privacy" className="hover:text-[var(--text-primary)] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[var(--text-primary)] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[var(--text-primary)] transition-colors">
                  Responsible AI Security
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[var(--text-primary)] transition-colors">
                  Contact & Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-default)]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} FeedbackAI Foundation. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for software creators and communities worldwide
          </p>
        </div>
      </div>
    </footer>
  );
};
