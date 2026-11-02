import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Sparkles,
  ChevronRight,
  Settings,
  LogOut,
  Globe,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSpace, SPACES } from '../../context/SpaceContext';
import { Button } from '../common/Button';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { Tooltip } from '../common/Tooltip';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from '../common/Dropdown';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenCommandPalette?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenCommandPalette,
  className = '',
}) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { currentSpace, switchSpace, isInspectorOpen, toggleInspector, inspectorContent } = useSpace();

  // Keyboard shortcut `/` to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        onOpenCommandPalette?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  // Derive human-readable page name for breadcrumb
  const getPageTitle = (pathname: string): string => {
    if (pathname === '/') return 'Overview';
    if (pathname.startsWith('/explore')) return 'Explore Projects';
    if (pathname.startsWith('/personal/projects/new')) return 'New Project';
    if (pathname.startsWith('/personal')) return 'My Projects';
    if (pathname.startsWith('/creator/profile')) return 'Public Profile';
    if (pathname.startsWith('/creator')) return 'Studio';
    if (pathname.startsWith('/saved')) return 'Saved Items';
    if (pathname.startsWith('/activity')) return 'Activity';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/moderation')) return 'Moderation';
    if (pathname.startsWith('/developer')) return 'AI Lab';
    return 'Details';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full h-16 border-b border-[var(--border-default)] bg-[var(--surface)]/90 backdrop-blur-md transition-colors',
        className
      )}
    >
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Desktop Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand Link */}
          <Link to="/" className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </Link>

          {/* Desktop Breadcrumbs (02_SPACES_AND_NAVIGATION.md) */}
          <nav aria-label="Breadcrumbs" className="hidden md:flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)] px-2 py-0.5 rounded-md bg-[var(--surface-raised)] border border-[var(--border-default)]">
              {SPACES[currentSpace].label}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">
              {pageTitle}
            </span>
          </nav>
        </div>

        {/* Center: Global Search / Command Bar Trigger */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between pl-3 pr-2.5 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--canvas)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-left shadow-2xs group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent)] shrink-0 transition-colors" />
              <span className="truncate">Search projects, findings, commands...</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)] font-mono">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Actions, Notifications, Theme, User Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Contextual Inspector Toggle (if inspector content available or registered) */}
          {inspectorContent && (
            <Tooltip content={isInspectorOpen ? 'Close Inspector' : 'Open Contextual Inspector'} side="bottom">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleInspector}
                aria-label={isInspectorOpen ? 'Close inspector panel' : 'Open inspector panel'}
                className="p-2"
              >
                {isInspectorOpen ? (
                  <PanelRightClose className="w-4 h-4 text-[var(--accent)]" />
                ) : (
                  <PanelRightOpen className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </Button>
            </Tooltip>
          )}

          {/* Notification Center */}
          <NotificationBell />

          {/* Theme Switcher */}
          <ThemeSwitcher variant="dropdown" />

          {/* User Profile Avatar / Radix Dropdown Menu */}
          {isAuthenticated && user ? (
            <Dropdown>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  aria-label="User account menu"
                  className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[var(--accent)]/40 transition-all cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--accent)]/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs ring-2 ring-[var(--accent)]/20">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>
              </DropdownTrigger>

              <DropdownContent align="end" className="w-56 p-2">
                <div className="px-2.5 py-2">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.displayName}</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate font-mono">@{user.username}</p>
                </div>
                <DropdownSeparator />

                <DropdownLabel>Switch Space</DropdownLabel>
                <DropdownItem onClick={() => switchSpace('public')}>
                  <Globe className="w-3.5 h-3.5 mr-2 text-sky-500" />
                  <span>Public Space</span>
                </DropdownItem>
                <DropdownItem onClick={() => switchSpace('personal')}>
                  <ShieldCheck className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                  <span>Personal Space</span>
                </DropdownItem>
                <DropdownItem onClick={() => switchSpace('creator')}>
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  <span>Creator Space</span>
                </DropdownItem>

                <DropdownSeparator />
                <DropdownItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="w-3.5 h-3.5 mr-2 text-[var(--text-muted)]" />
                    <span>Settings & Preferences</span>
                  </Link>
                </DropdownItem>
                <DropdownSeparator />

                <DropdownItem destructive onClick={() => logout()}>
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  <span>Sign Out</span>
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
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
