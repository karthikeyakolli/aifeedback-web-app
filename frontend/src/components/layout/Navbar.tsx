import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  Bookmark,
  Activity,
  Plus,
  Sun,
  Moon,
  Search,
  Layers,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const navLinks = [
    { to: '/', label: 'Feed', icon: <Layers className="w-4 h-4" /> },
    { to: '/explore', label: 'Explore', icon: <Compass className="w-4 h-4" /> },
    { to: '/saved', label: 'Saved', icon: <Bookmark className="w-4 h-4" /> },
    { to: '/activity', label: 'My Activity', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                ResearchIntel
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                Anonymous Community & AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/explore"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors w-44 md:w-56"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Search products, ideas...</span>
            <kbd className="ml-auto text-[10px] px-1 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 font-mono">
              /
            </kbd>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Create Post Button */}
          {isAuthenticated ? (
            <Link to="/create">
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                <span className="hidden sm:inline">New Post</span>
                <span className="sm:hidden">Post</span>
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => openAuthModal('signup')}
            >
              <span className="hidden sm:inline">New Post</span>
              <span className="sm:hidden">Post</span>
            </Button>
          )}

          {/* User Profile or Sign In */}
          {isAuthenticated ? (
            <Link
              to="/settings"
              className="flex items-center gap-2 p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`${user?.displayName} (@${user?.username})`}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs ring-1 ring-blue-300 dark:ring-blue-700">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </Link>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAuthModal('login')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
