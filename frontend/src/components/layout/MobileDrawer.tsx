import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  Sparkles,
  Layers,
  Compass,
  Bookmark,
  Activity,
  Shield,
  Settings,
  Plus,
  LogOut,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navItems = [
    { to: '/', label: 'Discussion Feed', icon: <Layers className="w-5 h-5 text-indigo-500" /> },
    { to: '/explore', label: 'Explore Products & Feed', icon: <Compass className="w-5 h-5 text-blue-500" /> },
    { to: '/saved', label: 'Saved Bookmarks', icon: <Bookmark className="w-5 h-5 text-amber-500" /> },
    { to: '/activity', label: 'My Activity & Studio', icon: <Activity className="w-5 h-5 text-emerald-500" /> },
    ...(user?.isModerator
      ? [{ to: '/moderation', label: 'Moderation Queue', icon: <Shield className="w-5 h-5 text-rose-500" /> }]
      : []),
    ...(import.meta.env.DEV
      ? [{ to: '/developer', label: 'Developer Workspace', icon: <Terminal className="w-5 h-5 text-amber-500" /> }]
      : []),
    { to: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5 text-slate-400" /> },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-4/5 max-w-xs h-full bg-[var(--bg-surface)] text-[var(--text-primary)] border-r border-[var(--border-subtle)] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border-subtle)]">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              ResearchIntel
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-[var(--bg-secondary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action button */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <Link
            to="/create"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Discussion</span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Account & Theme */}
        <div className="p-4 border-t border-[var(--border-subtle)] space-y-3 bg-[var(--bg-secondary)]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Theme Mode</span>
            <ThemeSwitcher variant="dropdown" />
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5 truncate">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="truncate text-xs">
                  <div className="font-semibold truncate text-[var(--text-primary)]">{user.displayName}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate font-mono">@{user.username}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors min-h-[44px]"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={onClose}
                className="flex items-center justify-center w-full py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold text-xs transition-colors min-h-[44px]"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
