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
  Layers,
  Palette,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSpace, SPACES } from '../../context/SpaceContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { SpaceSwitcher } from './SpaceSwitcher';
import { cn } from '../../lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { currentSpace } = useSpace();

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

  const getSpaceNavItems = () => {
    switch (currentSpace) {
      case 'personal':
        return [
          { to: '/personal', label: 'My Projects', icon: FolderKanban },
          { to: '/personal/projects/new', label: 'New Project', icon: Plus },
          { to: '/activity', label: 'Feedback Activity', icon: Activity },
          { to: '/saved', label: 'Saved Items', icon: Bookmark },
        ];
      case 'creator':
        return [
          { to: '/creator', label: 'Creator Studio', icon: Palette },
          { to: '/developer', label: 'AI Review Lab', icon: Terminal },
          { to: '/creator/profile', label: 'Public Showcase', icon: Sparkles },
          { to: '/saved', label: 'Saved Assets', icon: Bookmark },
        ];
      case 'public':
      default:
        return [
          { to: '/', label: 'Overview', icon: Home },
          { to: '/explore', label: 'Explore Projects', icon: Compass },
          { to: '/discussions', label: 'Community Feed', icon: Layers },
          { to: '/saved', label: 'Saved Bookmarks', icon: Bookmark },
        ];
    }
  };

  const navItems = getSpaceNavItems();

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

        {/* Space Switcher */}
        <div className="p-4 border-b border-[var(--border-default)] bg-[var(--canvas)]">
          <SpaceSwitcher />
        </div>

        {/* Space Nav Items */}
        <div className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {SPACES[currentSpace].label} Navigation
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                )}
              >
                <ItemIcon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-[var(--border-default)] mt-4">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Preferences & Account
            </div>
            <Link
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </Link>
            {user?.isModerator && (
              <Link
                to="/moderation"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-500/10 transition-colors"
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Moderation Queue</span>
              </Link>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[var(--border-default)] bg-[var(--surface)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium">Theme</span>
            <ThemeSwitcher variant="dropdown" />
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
                <div className="truncate text-xs">
                  <p className="font-semibold truncate text-[var(--text-primary)]">{user.displayName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center justify-center w-full py-2 px-3 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold text-xs shadow-xs"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
