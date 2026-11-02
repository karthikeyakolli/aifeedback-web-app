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
  Terminal,
  Layers,
  Palette,
  Home,
  FileCode2,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSpace } from '../../context/SpaceContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { SpaceSwitcher } from './SpaceSwitcher';
import { Tooltip } from '../common/Tooltip';
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
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { currentSpace } = useSpace();

  // Space-specific Navigation Definitions (02_SPACES_AND_NAVIGATION.md)
  const getSpaceNavItems = () => {
    switch (currentSpace) {
      case 'personal':
        return [
          { to: '/personal', label: 'My Projects', icon: FolderKanban, badge: 'Private' },
          { to: '/personal/projects/new', label: 'New Project', icon: Plus },
          { to: '/activity', label: 'Feedback Activity', icon: Activity },
          { to: '/saved', label: 'Saved Items', icon: Bookmark },
        ];
      case 'creator':
        return [
          { to: '/creator', label: 'Creator Studio', icon: Palette, badge: 'Studio' },
          { to: '/creator/profile', label: 'Maker Profile', icon: User },
          { to: '/creator/lab', label: 'AI Review Lab', icon: Terminal, badge: 'Lab' },
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

  const globalItems = [
    ...(user?.isModerator
      ? [{ to: '/moderation', label: 'Moderation', icon: Shield, badge: 'Staff' }]
      : []),
    ...(import.meta.env.DEV
      ? [{ to: '/developer', label: 'Developer', icon: FileCode2, badge: 'Dev' }]
      : []),
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const getPrimaryAction = () => {
    if (currentSpace === 'personal') {
      return {
        to: '/personal/projects/new',
        label: 'New Project',
        icon: Plus,
      };
    }
    if (currentSpace === 'creator') {
      return {
        to: '/creator',
        label: 'New Showcase',
        icon: Sparkles,
      };
    }
    return {
      to: '/create',
      label: 'New Post',
      icon: Plus,
    };
  };

  const primaryAction = getPrimaryAction();
  const ActionIcon = primaryAction.icon;

  return (
    <aside
      aria-label="Main Navigation Sidebar"
      className={cn(
        'hidden md:flex flex-col border-r border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] transition-all duration-200 select-none shrink-0 z-20',
        isCollapsed ? 'w-[72px]' : 'w-[250px]',
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
          title="AI Project Feedback"
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
                Grounded Reviews
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* 3-Space Switcher (Public / Personal / Creator) */}
      <div className="px-3 pt-3">
        <SpaceSwitcher isCollapsed={isCollapsed} />
      </div>

      {/* Dominant Space Action Button */}
      <div className="p-3">
        {isAuthenticated ? (
          <Tooltip content={primaryAction.label} side="right" disabled={!isCollapsed}>
            <Link
              to={primaryAction.to}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-xs shadow-xs transition-all cursor-pointer active:translate-y-[1px]',
                isCollapsed && 'p-2.5'
              )}
            >
              <ActionIcon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{primaryAction.label}</span>}
            </Link>
          </Tooltip>
        ) : (
          <Tooltip content="Sign in to create" side="right" disabled={!isCollapsed}>
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-xs shadow-xs transition-all cursor-pointer active:translate-y-[1px]',
                isCollapsed && 'p-2.5'
              )}
            >
              <ActionIcon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{primaryAction.label}</span>}
            </button>
          </Tooltip>
        )}
      </div>

      {/* Space-Specific Navigation Items */}
      <div className="flex-1 px-2.5 py-1 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {currentSpace} Navigation
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const ItemIcon = item.icon;

            const linkContent = (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  isActive
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
                  isCollapsed && 'justify-center px-0'
                )}
              >
                <ItemIcon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-muted)]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.to} content={item.label} side="right">
                  {linkContent}
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Global / Secondary Navigation Section */}
        <div className="pt-3 border-t border-[var(--border-default)] mt-3">
          {!isCollapsed && (
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              General
            </div>
          )}
          <nav className="space-y-1">
            {globalItems.map((item) => {
              const isActive = location.pathname === item.to;
              const ItemIcon = item.icon;

              const linkContent = (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                    isActive
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
                    isCollapsed && 'justify-center px-0'
                  )}
                >
                  <ItemIcon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.to} content={item.label} side="right">
                    {linkContent}
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>
        </div>
      </div>

      {/* Footer Area / Theme & Account Controls */}
      <div className="p-3 border-t border-[var(--border-default)] space-y-2 bg-[var(--surface)]">
        {/* Appearance Theme Selector */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
            <span className="text-[11px] font-medium">Theme</span>
            <ThemeSwitcher variant="dropdown" />
          </div>
        ) : (
          <div className="flex justify-center">
            <ThemeSwitcher variant="dropdown" />
          </div>
        )}

        {/* Authenticated User Quick Info or Sign In */}
        {isAuthenticated && user ? (
          <div
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]',
              isCollapsed && 'justify-center p-1.5'
            )}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-[var(--border-default)]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0">
                {user.displayName?.charAt(0) || 'U'}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 truncate text-xs">
                <div className="font-semibold truncate text-[var(--text-primary)]">{user.displayName}</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate font-mono">@{user.username}</div>
              </div>
            )}
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => logout()}
                title="Sign Out"
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          !isCollapsed && (
            <Link
              to="/login"
              className="flex items-center justify-center w-full py-1.5 px-3 rounded-xl border border-[var(--border-default)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
            >
              Sign In
            </Link>
          )
        )}

        {/* Sidebar Collapse Toggle Button */}
        <Tooltip content={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-xs"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span className="text-[11px] font-medium">Collapse</span>}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};
