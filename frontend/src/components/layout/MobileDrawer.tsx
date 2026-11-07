import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  Sparkles,
  Compass,
  Bookmark,
  Activity,
  Shield,
  Settings,
  Plus,
  LogOut,
  FolderKanban,
  Home,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { cn } from '../../lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mainNavItems = isAuthenticated
    ? [
        { to: '/', label: 'Home', icon: Home },
        { to: '/explore', label: 'Explore Projects', icon: Compass },
        { to: '/workspace', label: 'AI Workspace', icon: Sparkles },
        { to: '/publish', label: 'Publish Project', icon: Plus },
        { to: '/activity', label: 'Activity', icon: Activity },
        { to: '/saved', label: 'Saved Projects', icon: Bookmark },
        { to: '/my-projects', label: 'My Projects', icon: FolderKanban },
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { to: '/', label: 'Home', icon: Home },
        { to: '/explore', label: 'Explore Projects', icon: Compass },
      ];

  const adminNavItems = [
    ...(user?.isModerator
      ? [{ to: '/moderation', label: 'Moderation', icon: Shield, badge: 'Staff' }]
      : []),
    ...(isAuthenticated
      ? [{ to: '/settings', label: 'Settings', icon: Settings }]
      : []),
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
      <div className="relative w-4/5 max-w-xs h-full bg-[var(--surface)] text-[var(--text-primary)] border-r border-[var(--border-default)] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border-default)]">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
              FeedbackAI
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="p-4 border-b border-[var(--border-default)] bg-[var(--surface-raised)]/30">
          {isAuthenticated ? (
            <Link
              to="/publish"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Project</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuthModal('signup');
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] text-white font-semibold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Project</span>
            </button>
          )}
        </div>

        {/* Unified Nav Items */}
        <div className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Menu
          </div>
          {mainNavItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] font-semibold border border-[var(--border-default)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                )}
              >
                <ItemIcon className={cn('w-4 h-4', isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[var(--border-default)]">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Preferences
            </div>
            {adminNavItems.map((item) => {
              const ItemIcon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ItemIcon className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--border-default)]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[var(--border-default)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Appearance</span>
            <ThemeSwitcher variant="dropdown" />
          </div>

          {isAuthenticated && user ? (
            <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.displayName}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">@{user.username}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuthModal('login');
              }}
              className="w-full py-2 px-3 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-center hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
