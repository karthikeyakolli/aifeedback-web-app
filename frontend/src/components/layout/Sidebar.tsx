import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  FolderKanban,
  Bookmark,
  Activity,
  Shield,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  Home,
  User,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../common/Tooltip';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  className = '',
}) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Navigation Items: Guests only see public exploration; Authenticated users see full SaaS workspace
  const mainNavItems = isAuthenticated
    ? [
        { to: '/', label: 'Home', icon: Home },
        { to: '/explore', label: 'Explore', icon: Compass },
        { to: '/discussions', label: 'Discussions', icon: MessageSquare },
        { to: '/workspace', label: 'AI Workspace', icon: Sparkles },
        { to: '/publish', label: 'Publish Project', icon: Plus },
        { to: '/activity', label: 'Activity', icon: Activity },
        { to: '/saved', label: 'Saved Projects', icon: Bookmark },
        { to: '/my-projects', label: 'My Projects', icon: FolderKanban },
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { to: '/', label: 'Home', icon: Home },
        { to: '/explore', label: 'Explore Feed', icon: Compass },
        { to: '/discussions', label: 'Discussions', icon: MessageSquare },
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
    <aside
      aria-label="Main Navigation Sidebar"
      className={cn(
        'hidden md:flex flex-col border-r border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] transition-all duration-200 select-none shrink-0 z-20',
        isCollapsed ? 'w-[72px]' : 'w-[240px]',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-default)]">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-2.5 overflow-hidden transition-opacity',
            isCollapsed && 'justify-center w-full'
          )}
          title="FeedbackAI"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-sm tracking-tight leading-none text-[var(--text-primary)]">
                FeedbackAI
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide uppercase mt-1 truncate">
                Product Intelligence
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        {isAuthenticated ? (
          <Tooltip content="Publish Project" side="right" disabled={!isCollapsed}>
            <Link
              to="/publish"
              className={cn(
                'flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-xs shadow-xs transition-all cursor-pointer active:translate-y-[1px]',
                isCollapsed && 'p-2.5'
              )}
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Publish Project</span>}
            </Link>
          </Tooltip>
        ) : (
          <Tooltip content="Create account to build" side="right" disabled={!isCollapsed}>
            <Link
              to="/signup"
              className={cn(
                'flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-xs shadow-xs transition-all cursor-pointer active:translate-y-[1px]',
                isCollapsed && 'p-2.5'
              )}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Get Started</span>}
            </Link>
          </Tooltip>
        )}
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

          return (
            <Tooltip key={item.to} content={item.label} side="right" disabled={!isCollapsed}>
              <Link
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer',
                  isActive
                    ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] font-semibold border border-[var(--border-default)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
                  isCollapsed && 'justify-center px-0'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </Tooltip>
          );
        })}

        <div className="pt-4 mt-4 border-t border-[var(--border-default)]/60">
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Preferences
            </p>
          )}
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Tooltip key={item.to} content={item.label} side="right" disabled={!isCollapsed}>
                <Link
                  to={item.to}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer',
                    isActive
                      ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
                    isCollapsed && 'justify-center px-0'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--border-default)]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </Tooltip>
            );
          })}
        </div>
      </nav>

      {/* Footer / Account / Collapse Toggle */}
      <div className="p-3 border-t border-[var(--border-default)] flex flex-col gap-2">
        {/* User Card when expanded */}
        {!isCollapsed && isAuthenticated && user && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]">
            <Link to="/profile" className="flex items-center gap-2.5 min-w-0">
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
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.displayName}</p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">@{user.username}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign out"
              className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Unauthenticated Visitor Sign In Options */}
        {!isCollapsed && !isAuthenticated && (
          <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]">
            <Link
              to="/login"
              className="w-full py-1.5 text-center text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="w-full py-1.5 text-center text-xs font-semibold text-[var(--accent-foreground)] bg-[var(--accent)] hover:opacity-90 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              Sign Up
            </Link>
          </div>
        )}

        {/* Bottom controls: Theme Switcher & Collapse Button */}
        <div className={cn('flex items-center gap-1.5', isCollapsed ? 'flex-col justify-center' : 'justify-between')}>
          <ThemeSwitcher />

          {isCollapsed && !isAuthenticated && (
            <Tooltip content="Sign In" side="right">
              <Link
                to="/login"
                className="p-2 rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-center cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
              </Link>
            </Tooltip>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
