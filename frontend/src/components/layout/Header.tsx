import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Plus,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  className = '',
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut `/` to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInputRef.current?.value.trim();
    if (query) {
      navigate(`/explore?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <header
      className={`sticky top-0 z-30 w-full h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md transition-colors ${className}`}
    >
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Mobile Hamburger & Brand Mobile Display */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              ResearchIntel
            </span>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-2 sm:mx-4">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search products, feedback, topics..."
              aria-label="Search discussions and products"
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/80 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <kbd className="hidden sm:inline-block absolute right-2.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-[var(--text-muted)] font-mono pointer-events-none">
              /
            </kbd>
          </div>
        </form>

        {/* Right: Actions, Notifications, Theme, Auth */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Dev Mode Workspace Shortcut Badge */}
          {import.meta.env.DEV && (
            <Link
              to="/developer"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
              title="Open Developer Workspace & AI Testing Lab"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Dev Lab</span>
            </Link>
          )}

          {/* Notification Center */}
          <NotificationBell />

          {/* Theme Switcher (Desktop Header & Mobile) */}
          <ThemeSwitcher variant="dropdown" />

          {/* New Post Button */}
          {isAuthenticated ? (
            <Link to="/create" className="hidden sm:inline-flex">
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                New Post
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="primary"
              className="hidden sm:inline-flex"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => openAuthModal('signup')}
            >
              New Post
            </Button>
          )}

          {/* User Profile Avatar / Sign In */}
          {isAuthenticated && user ? (
            <Link
              to="/settings"
              className="flex items-center gap-1.5 p-1 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-[var(--bg-secondary)] transition-colors"
              title={`${user.displayName} (@${user.username})`}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500/20">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
