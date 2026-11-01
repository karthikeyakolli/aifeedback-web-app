import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Compass,
  Bookmark,
  Activity,
  Shield,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

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

  const navItems = [
    { to: '/', label: 'Feed', icon: <Layers className="w-4 h-4 shrink-0" /> },
    { to: '/explore', label: 'Explore', icon: <Compass className="w-4 h-4 shrink-0" /> },
    { to: '/saved', label: 'Saved', icon: <Bookmark className="w-4 h-4 shrink-0" /> },
    { to: '/activity', label: 'My Activity', icon: <Activity className="w-4 h-4 shrink-0" /> },
    ...(user?.isModerator
      ? [{ to: '/moderation', label: 'Moderation', icon: <Shield className="w-4 h-4 text-rose-500 shrink-0" />, badge: 'Staff' }]
      : []),
    ...(import.meta.env.DEV
      ? [{ to: '/developer', label: 'Developer', icon: <Terminal className="w-4 h-4 text-amber-500 shrink-0" />, badge: 'Dev' }]
      : []),
    { to: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <aside
      aria-label="Main Navigation Sidebar"
      className={`hidden md:flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all duration-200 select-none shrink-0 ${
        isCollapsed ? 'w-[72px]' : 'w-[240px]'
      } ${className}`}
    >
      {/* Sidebar Header & Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]">
        <Link
          to="/"
          className={`flex items-center gap-2.5 overflow-hidden transition-opacity ${
            isCollapsed ? 'justify-center w-full' : ''
          }`}
          title="ResearchIntel Home"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-sm tracking-tight leading-none text-slate-900 dark:text-white">
                ResearchIntel
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide uppercase mt-0.5 truncate">
                Community & AI
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Action: New Post */}
      <div className="p-3">
        {isAuthenticated ? (
          <Link
            to="/create"
            className={`flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer ${
              isCollapsed ? 'p-2' : ''
            }`}
            title="Create New Discussion"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>New Discussion</span>}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            className={`flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer ${
              isCollapsed ? 'p-2' : ''
            }`}
            title="Create New Discussion"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>New Discussion</span>}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              {item.icon}
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area / Theme & Account */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-3">
        {/* Theme Switcher */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="text-[11px] font-medium">Appearance</span>
            <ThemeSwitcher variant="dropdown" />
          </div>
        ) : (
          <div className="flex justify-center">
            <ThemeSwitcher variant="dropdown" />
          </div>
        )}

        {/* User Profile or Sign In */}
        {isAuthenticated && user ? (
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] ${
              isCollapsed ? 'justify-center p-1.5' : ''
            }`}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
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
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          !isCollapsed && (
            <div className="space-y-1.5">
              <Link
                to="/login"
                className="flex items-center justify-center w-full py-1.5 px-3 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
              >
                Sign In
              </Link>
            </div>
          )
        )}

        {/* Collapse Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer text-xs"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!isCollapsed && <span className="text-[11px] font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};
